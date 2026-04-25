import type { VercelRequest, VercelResponse } from '@vercel/node'
import fs from 'fs'
import path from 'path'

export default function handler(req: VercelRequest, res: VercelResponse) {
  const cwd = process.cwd()
  const knowledgePath = path.join(cwd, 'knowledge/business.txt')
  const knowledgeExists = fs.existsSync(knowledgePath)

  res.status(200).json({
    ok: true,
    cwd,
    knowledgePath,
    knowledgeExists,
    node: process.version,
    env: {
      hasGemini: !!process.env.GEMINI_API_KEY,
      hasResend: !!process.env.RESEND_API_KEY,
    },
  })
}
