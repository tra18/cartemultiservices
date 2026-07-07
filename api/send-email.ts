import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY
const emailFrom = process.env.EMAIL_FROM
const replyTo = process.env.EMAIL_REPLY_TO

type RequestBody = {
  to?: string
  subject?: string
  text?: string
}

function toHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br />')
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, {
      status: 405,
      headers: { Allow: 'POST' },
    })
  }

  if (!resendApiKey || !emailFrom) {
    return Response.json({ error: 'Email service not configured' }, { status: 503 })
  }

  let body: RequestBody
  try {
    body = (await request.json()) as RequestBody
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { to, subject, text } = body

  if (!to || !subject || !text) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
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

    return Response.json({ ok: true, id: result.data?.id ?? null })
  } catch (error) {
    console.error('Resend send failed', error)
    return Response.json({ error: 'Email send failed' }, { status: 500 })
  }
}
