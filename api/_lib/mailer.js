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

export async function sendTypedEmail(type, data = {}) {
  if (!resendApiKey || !emailFrom) {
    console.error('Email service not configured')
    return { ok: false }
  }

  const email = buildEmail(type, data)
  if (!email?.to || !email.subject || !email.text) {
    console.error('Invalid email template', type)
    return { ok: false }
  }

  try {
    const resend = new Resend(resendApiKey)
    const result = await resend.emails.send({
      from: emailFrom,
      to: [email.to],
      subject: email.subject,
      text: email.text,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${toHtml(email.text)}</div>`,
      ...(replyTo ? { replyTo } : {}),
    })

    if (result.error) {
      console.error('Resend API error', result.error)
      return { ok: false, error: result.error.message }
    }

    return { ok: true, id: result.data?.id ?? null }
  } catch (error) {
    console.error('Resend send failed', error)
    return { ok: false }
  }
}
