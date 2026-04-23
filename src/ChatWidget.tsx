import React from 'react'
import { ChatBubble } from './components/ChatBubble'
import { ChatPanel } from './components/ChatPanel'
import { useChatAgent } from './hooks/useChatAgent'

const WELCOME_MESSAGE = "👋 Hi! I'm the AI assistant for Kalle Hermosa Landscape. I can answer questions, give info on our services, or help you get a free quote!"

export function ChatWidget() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [hasUnread, setHasUnread] = React.useState(true)
  const [showChips, setShowChips] = React.useState(false)
  const { messages, isLoading, sendMessage, startLeadCapture } = useChatAgent()

  const handleOpen = () => {
    setIsOpen(true)
    setHasUnread(false)
    // Show chips after a brief delay to feel natural
    setTimeout(() => setShowChips(true), 300)
  }

  const handleSendMessage = (text: string) => {
    setShowChips(false) // hide chips once user engages
    sendMessage(text)
  }

  const handleStartLeadCapture = () => {
    setShowChips(false)
    startLeadCapture()
  }

  // Determine what messages to display — prepend welcome if no messages yet
  const displayMessages = messages.length === 0
    ? [{ id: 'welcome', role: 'assistant' as const, text: WELCOME_MESSAGE }]
    : messages

  return (
    <div className="kh-widget-container">
      {isOpen && (
        <ChatPanel
          messages={displayMessages}
          isLoading={isLoading}
          onClose={() => setIsOpen(false)}
          onSendMessage={handleSendMessage}
          onStartLeadCapture={handleStartLeadCapture}
          showChips={showChips && messages.length === 0}
        />
      )}
      <ChatBubble onClick={handleOpen} hasUnread={hasUnread} />
    </div>
  )
}
