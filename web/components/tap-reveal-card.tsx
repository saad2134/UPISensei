"use client"

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface TapRevealProps {
  title: string
  hidden: string
  revealed: React.ReactNode
}

export default function TapRevealCard({ title, hidden, revealed }: TapRevealProps) {
  const [isRevealed, setIsRevealed] = useState(false)

  return (
    <button
      onClick={() => setIsRevealed(!isRevealed)}
      className="w-full bg-card border border-border rounded-xl p-4 text-left hover:border-primary/50 transition-all animate-slide-in"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="font-black text-sm text-foreground mb-1">{title}</p>
          {!isRevealed ? (
            <p className="text-sm text-muted-foreground italic">{hidden}</p>
          ) : (
            <div className="mt-3">{revealed}</div>
          )}
        </div>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${
            isRevealed ? 'rotate-180' : ''
          }`}
        />
      </div>
    </button>
  )
}
