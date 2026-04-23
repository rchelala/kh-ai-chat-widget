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
    <ul className="kh-widget-messages" role="log" aria-live="polite" aria-label="Chat messages">
      {messages.map(msg => (
        <li
          key={msg.id}
          className={`kh-widget-message kh-widget-message--${msg.role}`}
        >
          {msg.text}
        </li>
      ))}
      {isLoading && (
        <li className="kh-widget-message kh-widget-message--assistant" aria-label="Loading">
          <div className="kh-widget-typing">
            <span />
            <span />
            <span />
          </div>
        </li>
      )}
      <div ref={bottomRef} />
    </ul>
  )
}
