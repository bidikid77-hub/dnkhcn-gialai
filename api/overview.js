// Vercel Serverless Function: /api/overview
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const data = {"success": true, "timestamp": "2026-11-05T07:59:48.463Z", "summary": {"enterprises": {"total": 31, "compliant": 31, "non_compliant": 0, "total_rd_expense": 67878, "formatted_rd": "67.878 triệu đồng"}, "organizations": {"total": 57, "active": 26, "reorganized_or_closed": 24, "merged_or_other": 7}, "support_policies": {"grand_total": 1189000000, "formatted_total": "1.189.000.000 đồng", "total_recipients": 40, "batch1_total": 934000000, "batch2_total": 55000000, "batch3_total": 191000000, "batch4_total": 9000000, "groups": {"enterprise_fund": 503000000, "iso_management": 453000000, "international_paper": 170000000, "intellectual_property": 63000000}}}};
  return res.status(200).json(data);
};
