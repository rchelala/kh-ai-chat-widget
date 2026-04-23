import React from 'react'
import { MessageList } from './MessageList'
import { SuggestionChips } from './SuggestionChips'
import type { Message } from '../hooks/useChatAgent'

interface ChatPanelProps {
  messages: Message[]
  isLoading: boolean
  onClose: () => void
  onSendMessage: (text: string) => void
  onStartLeadCapture: () => void
  showChips: boolean
}

export function ChatPanel({
  messages,
  isLoading,
  onClose,
  onSendMessage,
  onStartLeadCapture,
  showChips,
}: ChatPanelProps) {
  const [input, setInput] = React.useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    onSendMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const text = input.trim()
      if (!text || isLoading) return
      setInput('')
      onSendMessage(text)
    }
  }

  return (
    <div className="kh-widget-panel">
      {/* Header */}
      <div className="kh-widget-header">
        <div className="kh-widget-header-info">
          <div className="kh-widget-avatar">🌿</div>
          <div>
            <div className="kh-widget-header-name">Kalle Hermosa</div>
            <div className="kh-widget-header-status">● Online · Replies instantly</div>
          </div>
        </div>
        <button className="kh-widget-close" onClick={onClose} aria-label="Close chat">✕</button>
      </div>

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Suggestion chips — shown when showChips is true */}
      {showChips && (
        <SuggestionChips
          onChipClick={onSendMessage}
          onQuoteClick={onStartLeadCapture}
        />
      )}

      {/* Input */}
      <form className="kh-widget-input-bar" onSubmit={handleSubmit}>
        <input
          className="kh-widget-input"
          type="text"
          placeholder="Type a message…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          autoComplete="off"
          autoFocus
        />
        <button
          type="submit"
          className="kh-widget-send"
          disabled={isLoading || !input.trim()}
          aria-label="Send message"
        >
          ➤
        </button>
      </form>
    </div>
  )
}
