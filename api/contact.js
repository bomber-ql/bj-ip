/**
 * 表单接收端（Vercel Serverless Function）
 *
 * 需要配置环境变量：
 *   RESEND_API_KEY   Resend 的 API Key（https://resend.com）
 *   MAIL_FROM        发件人，必须是 Resend 里已验证的域名，如 "官网表单 <noreply@bj-ip.com>"
 *   MAIL_TO          收件人，默认 yiyatech@bj-ip.com
 *
 * 未配置时返回 501，前端会引导用户改用电话或邮件，不会出现“点了没反应”。
 */

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  const clean = (v, max) => String(v == null ? '' : v).trim().slice(0, max);

  const name    = clean(body.name, 40);
  const phone   = clean(body.phone, 30);
  const email   = clean(body.email, 80);
  const topic   = clean(body.topic, 60);
  const message = clean(body.message, 2000);
  const source  = clean(body.source, 60);

  if (String(body._gotcha || '').trim()) {
    return res.status(200).json({ ok: true });   // 蜜罐：假装成功
  }
  if (!name || !phone) {
    return res.status(400).json({ ok: false, error: '请填写称呼和手机' });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return res.status(501).json({ ok: false, error: 'MAIL_NOT_CONFIGURED' });
  }

  const lines = [
    '称呼：' + name,
    '手机：' + phone,
    '邮箱：' + (email || '（未填）'),
    '想聊：' + (topic || '（未选）'),
    '来源：' + (source || '（未知）'),
    '',
    '项目情况：',
    message || '（未填）'
  ];

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || 'noreply@bj-ip.com',
        to: [process.env.MAIL_TO || 'yiyatech@bj-ip.com'],
        reply_to: email || undefined,
        subject: '【官网咨询】' + name + ' · ' + (topic || '未分类'),
        text: lines.join('\n')
      })
    });

    if (!r.ok) {
      return res.status(502).json({ ok: false, error: 'MAIL_SEND_FAILED' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ ok: false, error: 'MAIL_SEND_FAILED' });
  }
};
