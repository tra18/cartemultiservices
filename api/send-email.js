const { Resend } = require('resend')

const resendApiKey = process.env.RESEND_API_KEY
const emailFrom = process.env.EMAIL_FROM
const replyTo = process.env.EMAIL_REPLY_TO

function toHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br />')
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!resendApiKey || !emailFrom) {
    return res.status(503).json({ error: 'Email service not configured' })
  }

  const { to, subject, text } = req.body ?? {}

  if (!to || !subject || !text) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const resend = new Resend(resendApiKey)
    const result = await resend.emails.send({
      from: emailFrom,
      to: [to],
      subject,
      text,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${toHtml(text)}</div>`,
      ...(replyTo ? { replyTo } : {}),
    })

    return res.status(200).json({ ok: true, id: result.data?.id ?? null })
  } catch (error) {
    console.error('Resend send failed', error)
    return res.status(500).json({ error: 'Email send failed' })
  }
}
