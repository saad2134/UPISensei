"use client"

import { ArrowLeft } from 'lucide-react'

interface Category {
  id: string
  name: string
  emoji: string
}

interface CategorySelectorProps {
  onSelectCategory: (category: string) => void
  onBack: () => void
  categories: Category[]
}

export default function CategorySelector({ onSelectCategory, onBack, categories }: CategorySelectorProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center">
      <div className="bg-card rounded-t-3xl w-full max-w-2xl border-t border-border animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center gap-4 p-6 border-b border-border">
          <button
            onClick={onBack}
            className="text-foreground hover:text-muted-foreground transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-foreground">Select Category</h2>
            <p className="text-sm text-muted-foreground">Choose a category for your payment</p>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-border bg-background hover:border-primary hover:bg-accent/50 transition-all duration-200 active:scale-95"
              >
                <span className="text-2xl">{category.emoji}</span>
                <span className="text-sm font-medium text-foreground text-center">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Safe area spacer */}
        <div className="h-8" />
      </div>
    </div>
  )
}