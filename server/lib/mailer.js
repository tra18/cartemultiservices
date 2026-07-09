import { Resend } from 'resend'
import { buildEmail } from './emailTemplates.js'

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

function normalizeRecipients(to) {
  if (Array.isArray(to)) {
    return to.map((value) => String(value).trim()).filter(Boolean)
  }
  if (typeof to === 'string' && to.trim()) {
    return [to.trim()]
  }
  return []
}

export async function sendTypedEmail(type, data = {}) {
  if (!resendApiKey || !emailFrom) {
    console.error('Email service not configured', { type })
    return { ok: false, error: 'Email service not configured' }
  }

  const email = buildEmail(type, data)
  const recipients = normalizeRecipients(email?.to)
  if (!recipients.length || !email?.subject || !email?.text) {
    console.error('Invalid email template', type)
    return { ok: false, error: 'Invalid email template' }
  }

  try {
    const resend = new Resend(resendApiKey)
    const result = await resend.emails.send({
      from: emailFrom,
      to: recipients,
      subject: email.subject,
      text: email.text,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${toHtml(email.text)}</div>`,
      ...(replyTo ? { replyTo } : {}),
    })

    if (result.error) {
      console.error('Resend API error', type, result.error)
      return { ok: false, error: result.error.message }
    }

    return { ok: true, id: result.data?.id ?? null, to: recipients }
  } catch (error) {
    console.error('Resend send failed', type, error)
    return { ok: false, error: error instanceof Error ? error.message : 'Send failed' }
  }
}
