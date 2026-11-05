// Vercel Serverless Function: /api/submit-report
const fs = require('fs');
const path = require('path');

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
  } catch (e) {
    console.error('Không thể ghi file lưu trữ tạm:', e);
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

  if (req.method === 'GET') {
    const list = getSubmissions();
    return res.status(200).json({ success: true, total: list.length, submissions: list });
  }

  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        body = JSON.parse(body);
      } else if (!body) {
        // Fallback đọc stream nếu body-parser chưa xử lý
        body = await new Promise((resolve, reject) => {
          let str = '';
          req.on('data', chunk => str += chunk);
          req.on('end', () => {
            try { resolve(JSON.parse(str || '{}')); } catch(err) { resolve({}); }
          });
          req.on('error', reject);
        });
      }

      const submission = {
        id: Date.now(),
        received_at: new Date().toISOString(),
        receipt_code: 'GL-268-' + (body.enterprise?.enterpriseCode || 'DN') + '-' + Date.now().toString().slice(-4),
        data: body
      };

      const list = getSubmissions();
      // Nếu cùng mã số thuế và kỳ báo cáo thì cập nhật, ngược lại thêm mới
      const tax = body.enterprise?.enterpriseCode;
      const period = body.period;
      const existIdx = list.findIndex(item => item.data?.enterprise?.enterpriseCode === tax && item.data?.period === period);
      if (existIdx >= 0) {
        list[existIdx] = submission;
      } else {
        list.unshift(submission);
      }

      saveSubmissions(list);

      return res.status(200).json({
        success: true,
        message: 'Tiếp nhận báo cáo trực tuyến thành công!',
        receipt_code: submission.receipt_code,
        received_at: submission.received_at
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
