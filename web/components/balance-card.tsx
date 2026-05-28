"use client"

import { useState } from 'react'
import { Eye, EyeOff, TrendingUp } from 'lucide-react'

export default function BalanceCard() {
  const [showBalance, setShowBalance] = useState(false)

  return (
    <div className="bg-gradient-to-br from-primary via-accent to-primary text-primary-foreground rounded-2xl p-6 shadow-lg animate-slide-in">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-sm font-medium opacity-90">Available Balance</p>
          <div className="flex items-center gap-2 mt-1">
            <h2 className="text-4xl font-black">
              {showBalance ? '₹12,420' : '••••••'}
            </h2>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              {showBalance ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
        <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold">
          Safe Mode 🛡️
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs opacity-75 mb-1">Spent This Week</p>
          <p className="text-2xl font-bold">₹2,450</p>
          <p className="text-xs opacity-75 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +12% from last week
          </p>
        </div>
        <div>
          <p className="text-xs opacity-75 mb-1">Budget Left</p>
          <p className="text-2xl font-bold">₹7,580</p>
          <p className="text-xs opacity-75 mt-1">67% of budget</p>
        </div>
      </div>
    </div>
  )
}
