import type { VercelRequest, VercelResponse } from '@vercel/node'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Resend } from 'resend'
import { buildSystemPrompt } from './lib/rag'

let _genAI: GoogleGenerativeAI | null = null
let _resend: Resend | null = null

function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set')
    _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  }
  return _genAI
}

function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set')
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const MAX_MESSAGES = 20
const MAX_TEXT_LENGTH = 2000

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  const allowedOrigin = 'https://kalle-hermosa-landscape.vercel.app'
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Vary', 'Origin')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'JSON body required' })
  }

  const { messages, lead } = req.body

  // Lead submission mode
  if (lead) {
    if (!lead.name || !lead.phone || !lead.serviceType || !lead.timeWindow) {
      return res.status(400).json({ error: 'Missing required lead fields' })
    }
    if ([lead.name, lead.phone, lead.serviceType, lead.timeWindow].some(f => typeof f !== 'string')) {
      return res.status(400).json({ error: 'Invalid lead field types' })
    }

    try {
      // Send email notification
      await getResend().emails.send({
        from: 'KH Widget <onboarding@resend.dev>',
        to: 'info@kellehermosalandscape.com',
        subject: `New Lead: ${esc(lead.name)} — ${esc(lead.serviceType)}`,
        html: `
          <h2>New Lead from Website Chat</h2>
          <p><strong>Name:</strong> ${esc(lead.name)}</p>
          <p><strong>Phone:</strong> ${esc(lead.phone)}</p>
          <p><strong>Service:</strong> ${esc(lead.serviceType)}</p>
          <p><strong>Preferred Time:</strong> ${esc(lead.timeWindow)}</p>
          ${lead.email ? `<p><strong>Email:</strong> ${esc(lead.email)}</p>` : ''}
        `,
      })

      // Send to Google Sheets via Make.com webhook
      if (process.env.LEAD_WEBHOOK_URL) {
        try {
          await fetch(process.env.LEAD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...lead,
              timestamp: new Date().toISOString(),
              source: 'website-chat',
            }),
          })
        } catch (webhookErr) {
          console.error('Webhook delivery failed (non-fatal):', webhookErr)
        }
      }

      // BOOKING_INTEGRATION: Wire in scheduling system here.
      // Options: Calendly API, Jobber, Housecall Pro, ServiceTitan.
      // Input available: lead.name, lead.phone, lead.serviceType, lead.timeWindow
      // Expected output: booking confirmation URL or appointment ID

      return res.status(200).json({ leadSaved: true })
    } catch (error) {
      console.error('Lead submission error:', error)
      return res.status(500).json({ error: 'Failed to save lead' })
    }
  }

  // Message mode
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' })
  }

  if (messages.length > MAX_MESSAGES) {
    return res.status(400).json({ error: 'Too many messages' })
  }

  const sanitizedMessages = messages.map((m: { role: string; text: string }) => ({
    role: m.role,
    text: String(m.text ?? '').slice(0, MAX_TEXT_LENGTH),
  }))

  try {
    const model = getGenAI().getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: buildSystemPrompt(),
    })

    const history = sanitizedMessages.slice(0, -1).map((m: { role: string; text: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }))

    const lastMessage = sanitizedMessages[sanitizedMessages.length - 1]

    const chat = model.startChat({ history })
    const result = await chat.sendMessage(lastMessage.text)
    const reply = result.response.text()

    return res.status(200).json({ reply })
  } catch (error) {
    console.error('Gemini error:', error)
    return res.status(500).json({ error: 'Failed to generate response' })
  }
}
