import React from 'react'
import ReactDOM from 'react-dom/client'
import ChatWidget from './ChatWidget'
import './index.css'

/**
 * Mount the chat widget into the client's page.
 * This IIFE is called by: <script src="https://kh-chat-widget.vercel.app/widget.js" defer></script>
 */
(function () {
  // Create container
  const container = document.createElement('div')
  container.id = 'kh-widget-root'
  document.body.appendChild(container)

  // Mount React component
  const root = ReactDOM.createRoot(container)
  root.render(React.createElement(ChatWidget))
})()
