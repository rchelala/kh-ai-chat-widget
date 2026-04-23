import React from 'react'

interface SuggestionChipsProps {
  onChipClick: (text: string) => void
  onQuoteClick: () => void
}

const CHIPS = [
  { label: '🌿 Get a Quote', action: 'quote' as const },
  { label: '🔧 Services', text: 'What services do you offer?' },
  { label: '📞 Contact', text: 'How can I contact you?' },
  { label: '📅 Book', text: 'I want to book a service' },
]

export function SuggestionChips({ onChipClick, onQuoteClick }: SuggestionChipsProps) {
  return (
    <div className="kh-widget-chips">
      {CHIPS.map(chip => (
        <button
          key={chip.label}
          className="kh-widget-chip"
          onClick={() => {
            if ('action' in chip && chip.action === 'quote') {
              onQuoteClick()
            } else if ('text' in chip) {
              onChipClick(chip.text)
            }
          }}
        >
          {chip.label}
        </button>
      ))}
    </div>
  )
}
