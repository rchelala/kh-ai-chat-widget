import React from 'react'

interface ChatBubbleProps {
  onClick: () => void
  hasUnread: boolean
}

export function ChatBubble({ onClick, hasUnread }: ChatBubbleProps) {
  const [showTooltip, setShowTooltip] = React.useState(true)

  React.useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 4000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="kh-widget-bubble-wrapper">
      {showTooltip && (
        <div className="kh-widget-tooltip" role="tooltip" id="kh-widget-tooltip">
          💬 Chat with us
        </div>
      )}
      <button
        className="kh-widget-bubble"
        onClick={onClick}
        aria-label="Open chat"
        aria-describedby={showTooltip ? 'kh-widget-tooltip' : undefined}
      >
        💬
        {hasUnread && <span className="kh-widget-badge" />}
      </button>
    </div>
  )
}
