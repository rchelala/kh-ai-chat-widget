import React from 'react'

interface SuggestionChipsProps {
  onChipClick: (text: string) => void
  onQuoteClick: () => void
}

const CHIPS = [
  { label: '🌿 Get a Quote', action: 'quote' },
  { label: '🔧 Services', text: 'What services do you offer?' },
  { label: '📞 Contact', text: 'How can I contact you?' },
  { label: '📅 Book', action: 'quote' },
] as const

export function SuggestionChips({ onChipClick, onQuoteClick }: SuggestionChipsProps) {
  return (
    <div className="kh-widget-chips">
      {CHIPS.map(chip => (
        <button
          key={chip.label}
          className="kh-widget-chip"
          onClick={() => {
            if (chip.action === 'quote') {
              onQuoteClick()
            } else {
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
