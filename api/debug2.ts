import type { VercelRequest, VercelResponse } from '@vercel/node'

let importError: string | null = null

async function tryImports() {
  try {
    await import('@google/generative-ai')
  } catch (e) {
    importError = 'generative-ai: ' + String(e)
    return
  }
  try {
    await import('resend')
  } catch (e) {
    importError = 'resend: ' + String(e)
  }
}

const ready = tryImports()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ready
  res.status(200).json({ importError })
}
