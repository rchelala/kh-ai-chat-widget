import React from 'react'
import type { Message } from '../hooks/useChatAgent'

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div className="kh-widget-messages">
      {messages.map(msg => (
        <div
          key={msg.id}
          className={`kh-widget-message kh-widget-message--${msg.role}`}
        >
          {msg.text}
        </div>
      ))}
      {isLoading && (
        <div className="kh-widget-message kh-widget-message--assistant">
          <div className="kh-widget-typing">
            <span />
            <span />
            <span />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
