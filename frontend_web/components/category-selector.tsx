"use client"

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'

interface CategorySelectorProps {
  onSelectCategory: (category: string) => void
  onBack: () => void
}

const categories = [
  {
    id: 'food',
    name: 'Food & Dining',
    icon: '🍔',
    color: 'from-orange-400 to-red-500',
  },
  {
    id: 'grocery',
    name: 'Grocery',
    icon: '🛒',
    color: 'from-green-400 to-emerald-500',
  },
  {
    id: 'bills',
    name: 'Bills & Utilities',
    icon: '💡',
    color: 'from-blue-400 to-cyan-500',
  },
  {
    id: 'transport',
    name: 'Transport',
    icon: '🚕',
    color: 'from-yellow-400 to-amber-500',
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: '🛍️',
    color: 'from-pink-400 to-rose-500',
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    icon: '🎬',
    color: 'from-purple-400 to-violet-500',
  },
]

export default function CategorySelector({ onSelectCategory, onBack }: CategorySelectorProps) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-gradient-to-b from-black/60 to-transparent">
        <button
          onClick={onBack}
          className="text-white hover:text-gray-300 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-white text-lg font-bold">Select Category</h2>
      </div>

      {/* Category Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className="group relative"
            >
              <div
                className={`bg-gradient-to-br ${category.color} p-6 rounded-2xl flex flex-col items-center justify-center gap-3 transform transition-all hover:scale-105 active:scale-95 shadow-lg hover:shadow-2xl`}
              >
                <span className="text-5xl">{category.icon}</span>
                <p className="text-white font-bold text-sm text-center text-balance">
                  {category.name}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 bg-gradient-to-t from-black/60 to-transparent text-center">
        <p className="text-white text-sm font-medium">
          Tap a category to proceed with payment scan
        </p>
      </div>
    </div>
  )
}
