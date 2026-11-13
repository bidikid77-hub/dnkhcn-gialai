// Vercel Serverless Function: /api/overview (Tự động tổng hợp dữ liệu)
const fs = require('fs');
const STORAGE_FILE = '/tmp/gialai_dnkhcn_submissions.json';

const baseData = {"success": true, "timestamp": "2026-11-13T11:00:00.000Z", "summary": {"enterprises": {"total": 31, "compliant": 31, "non_compliant": 0, "total_rd_expense": 67878, "formatted_rd": "67.878 triệu đồng"}, "organizations": {"total": 57, "active": 26, "reorganized_or_closed": 24, "merged_or_other": 7}, "support_policies": {"grand_total": 1289000000, "formatted_total": "1.289.000.000 đồng", "total_recipients": 42, "batch1_total": 934000000, "batch2_total": 55000000, "batch3_total": 191000000, "batch4_total": 9000000, "batch5_total": 100000000, "groups": {"enterprise_fund": 503000000, "iso_management": 453000000, "international_paper": 270000000, "intellectual_property": 63000000}}}};

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const result = JSON.parse(JSON.stringify(baseData));

  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const submissions = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf-8'));
      let extraRd = 0;
      let newCount = 0;

      for (const item of submissions) {
        const d = item.data;
        if (!d) continue;
        newCount += 1;
        extraRd += (d.monthly?.researchTechnologyInnovationExpenditureMillionVND || 0);
      }

      result.summary.enterprises.total += newCount;
      result.summary.enterprises.compliant += newCount;
      result.summary.enterprises.total_rd_expense += extraRd;
      result.summary.enterprises.formatted_rd = result.summary.enterprises.total_rd_expense.toLocaleString('vi-VN') + ' triệu đồng';
    }
  } catch (err) {
    console.error('Lỗi khi merge overview submissions:', err);
  }
  
  return res.status(200).json(result);
};
