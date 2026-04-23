import type { VercelRequest, VercelResponse } from '@vercel/node'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Resend } from 'resend'
import { buildSystemPrompt } from './lib/rag'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const resend = new Resend(process.env.RESEND_API_KEY!)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  const allowedOrigin = 'https://kalle-hermosa-landscape.vercel.app'
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { messages, lead } = req.body

  // Lead submission mode
  if (lead) {
    try {
      // Send email notification
      await resend.emails.send({
        from: 'KH Widget <onboarding@resend.dev>',
        to: 'info@kellehermosalandscape.com',
        subject: `New Lead: ${lead.name} — ${lead.serviceType}`,
        html: `
          <h2>New Lead from Website Chat</h2>
          <p><strong>Name:</strong> ${lead.name}</p>
          <p><strong>Phone:</strong> ${lead.phone}</p>
          <p><strong>Service:</strong> ${lead.serviceType}</p>
          <p><strong>Preferred Time:</strong> ${lead.timeWindow}</p>
          ${lead.email ? `<p><strong>Email:</strong> ${lead.email}</p>` : ''}
        `,
      })

      // Send to Google Sheets via Make.com webhook
      if (process.env.LEAD_WEBHOOK_URL) {
        await fetch(process.env.LEAD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...lead,
            timestamp: new Date().toISOString(),
            source: 'website-chat',
          }),
        })
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
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' })
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: buildSystemPrompt(),
    })

    const history = messages.slice(0, -1).map((m: { role: string; text: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }))

    const lastMessage = messages[messages.length - 1]

    const chat = model.startChat({ history })
    const result = await chat.sendMessage(lastMessage.text)
    const reply = result.response.text()

    return res.status(200).json({ reply })
  } catch (error) {
    console.error('Gemini error:', error)
    return res.status(500).json({ error: 'Failed to generate response' })
  }
}
