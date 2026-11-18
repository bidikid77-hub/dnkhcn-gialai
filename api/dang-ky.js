// Vercel Serverless Function: /api/dang-ky
// Tiep nhan va dong bo danh sach dang ky vao data/registrations.json tren GitHub

const REPO_OWNER = 'bidikid77-hub';
const REPO_NAME = 'dnkhcn-gialai';
const FILE_PATH = 'data/registrations.json';

async function getRegistrations(token) {
  try {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    const headers = {
      'User-Agent': 'Vercel-Serverless-Function',
      'Accept': 'application/vnd.github.v3+json'
    };
    if (token) headers['Authorization'] = `token ${token}`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      // Fallback raw
      const rawRes = await fetch(`https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${FILE_PATH}?t=${Date.now()}`);
      if (rawRes.ok) {
        const text = await rawRes.text();
        return { list: JSON.parse(text || '[]'), sha: null };
      }
      return { list: [], sha: null };
    }
    const data = await res.json();
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return { list: JSON.parse(content || '[]'), sha: data.sha };
  } catch (err) {
    console.error('getRegistrations error:', err);
    return { list: [], sha: null };
  }
}

async function saveRegistrations(token, list, sha) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
  const contentBase64 = Buffer.from(JSON.stringify(list, null, 2), 'utf-8').toString('base64');
  const payload = {
    message: `Cap nhat dang ky moi (${list.length} dai bieu)`,
    content: contentBase64,
    branch: 'main'
  };
  if (sha) payload.sha = sha;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'User-Agent': 'Vercel-Serverless-Function',
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return res.ok;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = process.env.GH_TOKEN;

  // GET: Lay toan bo danh sach dang ky
  if (req.method === 'GET') {
    const { list } = await getRegistrations(token);
    return res.status(200).json({ success: true, total: list.length, data: list });
  }

  // POST: Nhan dang ky moi
  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        body = JSON.parse(body);
      } else if (!body) {
        body = await new Promise((resolve) => {
          let str = '';
          req.on('data', chunk => str += chunk);
          req.on('end', () => {
            try { resolve(JSON.parse(str || '{}')); } catch(err) { resolve({}); }
          });
        });
      }

      if (!body.company || !body.main_delegate) {
        return res.status(400).json({ success: false, error: 'Thiếu tên doanh nghiệp hoặc đại biểu' });
      }

      const newEntry = {
        id: Date.now(),
        timestamp: body.timestamp || new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }),
        company: body.company,
        address: body.address || '',
        main_delegate: body.main_delegate,
        position: body.position || '',
        phone: body.phone || '',
        email: body.email || ''
      };

      if (!token) {
        console.warn('Khong co GH_TOKEN, tra ve success va bo qua ghi repo');
        return res.status(200).json({ success: true, saved: false, data: newEntry });
      }

      const { list, sha } = await getRegistrations(token);
      list.push(newEntry);

      const saved = await saveRegistrations(token, list, sha);

      return res.status(200).json({
        success: true,
        saved: saved,
        total: list.length,
        data: newEntry
      });
    } catch (err) {
      console.error('Loi POST dang-ky:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
