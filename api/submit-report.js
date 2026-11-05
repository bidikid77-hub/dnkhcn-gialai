// Vercel Serverless Function: /api/submit-report
const fs = require('fs');

const STORAGE_FILE = '/tmp/gialai_dnkhcn_submissions.json';

function getSubmissions() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      return JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf-8'));
    }
  } catch (e) {}
  return [];
}

function saveSubmissions(list) {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(list, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Không thể ghi file lưu trữ tạm:', e);
    return false;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Chỉ trả về tổng số lượng và mã biên nhận, bảo vệ bí mật kinh doanh
  if (req.method === 'GET') {
    const list = getSubmissions();
    const safeSummary = list.map(item => ({
      receipt_code: item.receipt_code,
      received_at: item.received_at,
      enterprise_code: item.data?.enterprise?.enterpriseCode || 'N/A',
      enterprise_name: item.data?.enterprise?.name || 'Doanh nghiệp KH&CN'
    }));
    return res.status(200).json({ success: true, total: list.length, submissions: safeSummary });
  }

  // POST: Tiếp nhận và lưu báo cáo
  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        body = JSON.parse(body);
      } else if (!body) {
        body = await new Promise((resolve, reject) => {
          let str = '';
          req.on('data', chunk => str += chunk);
          req.on('end', () => {
            try { resolve(JSON.parse(str || '{}')); } catch(err) { resolve({}); }
          });
          req.on('error', reject);
        });
      }

      if (!body.enterprise || !body.enterprise.enterpriseCode) {
        return res.status(400).json({ success: false, error: 'Thiếu thông tin doanh nghiệp bắt buộc' });
      }

      const submission = {
        id: Date.now(),
        received_at: new Date().toISOString(),
        receipt_code: 'GL-268-' + body.enterprise.enterpriseCode + '-' + Date.now().toString().slice(-4),
        data: body
      };

      const list = getSubmissions();
      const tax = body.enterprise.enterpriseCode;
      const period = body.period;
      const existIdx = list.findIndex(item => item.data?.enterprise?.enterpriseCode === tax && item.data?.period === period);
      
      if (existIdx >= 0) {
        list[existIdx] = submission;
      } else {
        list.unshift(submission);
      }

      const saved = saveSubmissions(list);
      if (!saved) {
        // Vẫn trả về mã biên nhận kèm ghi chú lưu phiên
        return res.status(200).json({
          success: true,
          message: 'Tiếp nhận báo cáo trực tuyến thành công!',
          receipt_code: submission.receipt_code,
          received_at: submission.received_at,
          mode: 'session'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Tiếp nhận và lưu trữ báo cáo trực tuyến thành công!',
        receipt_code: submission.receipt_code,
        received_at: submission.received_at
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
