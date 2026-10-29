/**
 * 表单接收端（Vercel Serverless Function）
 *
 * 任选一种通知方式（都不用，则返回 501，前端降级为电话/邮件）：
 *
 * 方式 A（最快，推荐先上）：企业微信 / 钉钉群机器人
 *   MAIL_WEBHOOK     群机器人的完整 Webhook 地址
 *
 * 方式 B（推荐）：用你现有的邮箱直接发（腾讯企业邮 / 网易 / QQ 邮箱都行）
 *   SMTP_HOST        smtp.exmail.qq.com（腾讯企业邮）
 *   SMTP_PORT        465
 *   SMTP_SECURE      true（465 用 true，587 用 false）
 *   SMTP_USER        yiyatech@bj-ip.com
 *   SMTP_PASS        邮箱后台生成的「客户端专用密码 / 授权码」，不是登录密码
 *   MAIL_TO          收件人，默认 yiyatech@bj-ip.com
 *
 * 方式 C：Resend
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

  const content = [
    '【官网咨询】' + name,
    '手机：' + phone,
    '邮箱：' + (email || '（未填）'),
    '想聊：' + (topic || '（未选）'),
    '来源：' + (source || '（未知）'),
    '',
    message || '（未填项目情况）'
  ].join('\n');

  // 方式 A：群机器人（企业微信 / 钉钉 / 飞书，按 URL 自动识别消息格式）
  const hook = process.env.MAIL_WEBHOOK;
  if (hook) {
    const isFeishu = /feishu\.cn|larksuite\.com|lark\.suite/i.test(hook);
    const payload = isFeishu
      ? { msg_type: 'text', content: { text: content } }
      : { msgtype: 'text', text: { content: content } };

    try {
      const r = await fetch(hook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await r.json().catch(() => ({}));
      // 三家的成功标识字段名不一样：errcode / code / StatusCode
      const code = [data.errcode, data.code, data.StatusCode].find(v => typeof v === 'number');
      if (!r.ok || (typeof code === 'number' && code !== 0)) {
        return res.status(502).json({
          ok: false,
          error: 'WEBHOOK_FAILED',
          detail: JSON.stringify(data).slice(0, 200)
        });
      }
      return res.status(200).json({ ok: true, via: isFeishu ? 'feishu' : 'webhook' });
    } catch (e) {
      return res.status(502).json({ ok: false, error: 'WEBHOOK_FAILED', detail: String(e.message || e) });
    }
  }

  // 方式 B：SMTP，用现有邮箱发信（不需要改 DNS、不需要第三方账号）
  const smtpHost = process.env.SMTP_HOST;
  if (smtpHost) {
    let nodemailer;
    try {
      nodemailer = require('nodemailer');
    } catch (e) {
      return res.status(501).json({ ok: false, error: 'SMTP_DEP_MISSING' });
    }
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT || 465),
        secure: String(process.env.SMTP_SECURE || 'true') === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
      await transporter.sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to: process.env.MAIL_TO || 'yiyatech@bj-ip.com',
        replyTo: email || undefined,
        subject: '【官网咨询】' + name + ' · ' + (topic || '未分类'),
        text: content
      });
      return res.status(200).json({ ok: true, via: 'smtp' });
    } catch (e) {
      return res.status(502).json({ ok: false, error: 'SMTP_SEND_FAILED', detail: String(e.message || e) });
    }
  }

  // 方式 C：Resend
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return res.status(501).json({ ok: false, error: 'MAIL_NOT_CONFIGURED' });
  }



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
        text: content
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
