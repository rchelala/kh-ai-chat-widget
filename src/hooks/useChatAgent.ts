import { useState, useCallback } from 'react'

export type ChatMode = 'CHATTING' | 'LEAD_CAPTURE' | 'CONFIRMED'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
}

export interface LeadData {
  name?: string
  phone?: string
  serviceType?: string
  timeWindow?: string
  email?: string
}

// Which lead field we're currently collecting
type LeadField = 'name' | 'phone' | 'serviceType' | 'timeWindow' | 'email' | 'done'

const LEAD_FIELD_ORDER: LeadField[] = ['name', 'phone', 'serviceType', 'timeWindow', 'email', 'done']

const FIELD_PROMPTS: Record<Exclude<LeadField, 'done'>, string> = {
  name: "I'd love to get you a free quote! What's your name?",
  phone: "Great! And what's the best phone number to reach you?",
  serviceType: "What type of landscaping work are you looking for? (e.g., lawn maintenance, landscape design, irrigation)",
  timeWindow: "When would work best for you? (e.g., mornings, weekends, ASAP)",
  email: "Last one — what's your email address? (optional, press Skip to skip)",
}

export function useChatAgent() {
  const [mode, setMode] = useState<ChatMode>('CHATTING')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [aiReplyCount, setAiReplyCount] = useState(0)
  const [leadData, setLeadData] = useState<LeadData>({})
  const [currentLeadField, setCurrentLeadField] = useState<LeadField>('name')

  const addMessage = useCallback((role: Message['role'], text: string): Message => {
    const msg: Message = { id: Date.now().toString(), role, text }
    setMessages(prev => [...prev, msg])
    return msg
  }, [])

  const startLeadCapture = useCallback(() => {
    setMode('LEAD_CAPTURE')
    setCurrentLeadField('name')
    addMessage('assistant', FIELD_PROMPTS.name)
  }, [addMessage])

  // Handle a message sent during lead capture mode
  const handleLeadMessage = useCallback(async (text: string) => {
    addMessage('user', text)

    const fieldIndex = LEAD_FIELD_ORDER.indexOf(currentLeadField)
    const updatedLead = { ...leadData }

    if (currentLeadField !== 'done') {
      // Skip email if user types "skip" or similar
      if (currentLeadField === 'email' && /^skip$/i.test(text.trim())) {
        // no-op, just advance
      } else {
        updatedLead[currentLeadField] = text
      }
      setLeadData(updatedLead)
    }

    const nextField = LEAD_FIELD_ORDER[fieldIndex + 1] as LeadField

    if (nextField === 'done') {
      // All fields collected — submit lead
      setCurrentLeadField('done')
      addMessage('assistant', `Thanks ${updatedLead.name || 'you'}! Someone from Kalle Hermosa will reach out within 24 hours. Is there anything else I can help you with?`)

      // Submit to API
      try {
        await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lead: updatedLead }),
        })
      } catch (err) {
        console.error('Lead submission failed:', err)
      }

      setMode('CONFIRMED')
    } else {
      setCurrentLeadField(nextField)
      // Show next prompt (skip email prompt with skip option)
      if (nextField === 'email') {
        addMessage('assistant', FIELD_PROMPTS.email)
      } else {
        addMessage('assistant', FIELD_PROMPTS[nextField])
      }
    }
  }, [addMessage, currentLeadField, leadData])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    // If in lead capture mode, handle as lead flow
    if (mode === 'LEAD_CAPTURE' || (mode === 'CONFIRMED' && currentLeadField !== 'done')) {
      if (mode === 'LEAD_CAPTURE') {
        await handleLeadMessage(text)
        return
      }
    }

    addMessage('user', text)
    setIsLoading(true)

    try {
      const allMessages = [...messages, { id: Date.now().toString(), role: 'user' as const, text }]
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, text: m.text })),
        }),
      })

      if (!response.ok) throw new Error('API error')
      const data = await response.json()
      addMessage('assistant', data.reply)

      const newCount = aiReplyCount + 1
      setAiReplyCount(newCount)

      // Trigger lead capture after 2 AI replies
      if (newCount >= 2 && mode === 'CHATTING') {
        setTimeout(() => startLeadCapture(), 500)
      }
    } catch {
      addMessage('assistant', "Sorry, I'm having trouble connecting right now. Please call us at 623-734-5830.")
    } finally {
      setIsLoading(false)
    }
  }, [addMessage, aiReplyCount, handleLeadMessage, isLoading, messages, mode, currentLeadField, startLeadCapture])

  return {
    mode,
    messages,
    isLoading,
    leadData,
    sendMessage,
    startLeadCapture,
  }
}
