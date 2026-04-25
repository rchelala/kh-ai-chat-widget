import type { VercelRequest, VercelResponse } from '@vercel/node'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Resend } from 'resend'
import { buildSystemPrompt } from './lib/rag'

export default function handler(req: VercelRequest, res: VercelResponse) {
  let promptLen = 0
  try { promptLen = buildSystemPrompt().length } catch {}
  res.status(200).json({
    ok: true,
    hasGenAI: typeof GoogleGenerativeAI === 'function',
    hasResend: typeof Resend === 'function',
    promptLen,
  })
}
