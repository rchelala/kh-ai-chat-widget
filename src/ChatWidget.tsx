import React, { useState } from 'react'

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="kh-widget-container">
      <button
        className="kh-widget-bubble"
        onClick={() => setIsOpen(!isOpen)}
        title="Chat with us"
      >
        💬
      </button>

      {isOpen && (
        <div className="kh-widget-panel">
          <div className="kh-widget-header">
            <h3>Kalle Hermosa Landscape</h3>
            <button
              className="kh-widget-close"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>
          <div className="kh-widget-messages">
            <p>Hello! How can we help with your landscaping needs today?</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatWidget
