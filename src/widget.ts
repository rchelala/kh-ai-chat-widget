import React from 'react'
import ReactDOM from 'react-dom/client'
import ChatWidget from './ChatWidget'
import './index.css'

const container = document.createElement('div')
container.id = 'kh-widget-root'
document.body.appendChild(container)

ReactDOM.createRoot(container).render(React.createElement(ChatWidget))
