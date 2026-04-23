import { useState, useCallback, useRef, useEffect } from 'react'

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

type LeadField = 'name' | 'phone' | 'serviceType' | 'timeWindow' | 'email' | 'done'

const LEAD_FIELD_ORDER: LeadField[] = ['name', 'phone', 'serviceType', 'timeWindow', 'email', 'done']

const FIELD_PROMPTS: Record<Exclude<LeadField, 'done'>, string> = {
  name: "I'd love to get you a free quote! What's your name?",
  phone: "Great! And what's the best phone number to reach you?",
  serviceType: "What type of landscaping work are you looking for? (e.g., lawn maintenance, landscape design, irrigation)",
  timeWindow: "When would work best for you? (e.g., mornings, weekends, ASAP)",
  email: "Last one — what's your email address? (optional, type 'skip' to skip)",
}

let _msgId = 0
const nextId = () => String(++_msgId)

export function useChatAgent() {
  const [mode, setMode] = useState<ChatMode>('CHATTING')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [aiReplyCount, setAiReplyCount] = useState(0)
  const [leadData, setLeadData] = useState<LeadData>({})
  const [currentLeadField, setCurrentLeadField] = useState<LeadField>('name')
  const messagesRef = useRef<Message[]>([])
  const modeRef = useRef<ChatMode>('CHATTING')

  const addMessage = useCallback((role: Message['role'], text: string): Message => {
    const msg: Message = { id: nextId(), role, text }
    messagesRef.current = [...messagesRef.current, msg]
    setMessages(messagesRef.current)
    return msg
  }, [])

  const startLeadCapture = useCallback(() => {
    modeRef.current = 'LEAD_CAPTURE'
    setMode('LEAD_CAPTURE')
    setCurrentLeadField('name')
    addMessage('assistant', FIELD_PROMPTS.name)
  }, [addMessage])

  useEffect(() => {
    if (aiReplyCount >= 2 && modeRef.current === 'CHATTING') {
      startLeadCapture()
    }
  }, [aiReplyCount, startLeadCapture])

  const handleLeadMessage = useCallback(async (text: string, field: LeadField, lead: LeadData) => {
    addMessage('user', text)

    const fieldIndex = LEAD_FIELD_ORDER.indexOf(field)
    const updatedLead = { ...lead }

    if (field !== 'done') {
      if (!(field === 'email' && /^skip$/i.test(text.trim()))) {
        updatedLead[field] = text
      }
    }

    const nextField = LEAD_FIELD_ORDER[fieldIndex + 1] as LeadField

    if (nextField === 'done') {
      setCurrentLeadField('done')
      setIsLoading(true)
      try {
        await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lead: updatedLead }),
        })
        addMessage('assistant', `Thanks ${updatedLead.name || 'you'}! Someone from Kalle Hermosa will reach out within 24 hours. Is there anything else I can help you with?`)
        modeRef.current = 'CONFIRMED'
        setMode('CONFIRMED')
      } catch (err) {
        console.error('Lead submission failed:', err)
        addMessage('assistant', "Sorry, we had trouble saving your information. Please call us directly at 623-734-5830.")
        modeRef.current = 'CHATTING'
        setMode('CHATTING')
      } finally {
        setIsLoading(false)
      }
    } else {
      setCurrentLeadField(nextField)
      setLeadData(updatedLead)
      addMessage('assistant', FIELD_PROMPTS[nextField])
    }
  }, [addMessage])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    if (modeRef.current === 'LEAD_CAPTURE') {
      await handleLeadMessage(text, currentLeadField, leadData)
      return
    }

    addMessage('user', text)
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesRef.current.map(m => ({ role: m.role, text: m.text })),
        }),
      })

      if (!response.ok) throw new Error('API error')
      const data = await response.json()
      addMessage('assistant', data.reply)
      setAiReplyCount(prev => prev + 1)
    } catch {
      addMessage('assistant', "Sorry, I'm having trouble connecting right now. Please call us at 623-734-5830.")
    } finally {
      setIsLoading(false)
    }
  }, [addMessage, currentLeadField, handleLeadMessage, isLoading, leadData])

  return {
    mode,
    messages,
    isLoading,
    leadData,
    sendMessage,
    startLeadCapture,
  }
}
