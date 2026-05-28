"use client"

import { useState } from 'react'
import { Zap, Target, Trophy } from 'lucide-react'
import AchievementBadge from './achievement-badge'
import SpendingChallenge from './spending-challenge'

interface GameificationProps {
  expandedView?: boolean
}

export default function GameificationSection({ expandedView = false }: GameificationProps) {
  const [achievements] = useState([
    { id: 1, icon: '🎯', title: 'Budget Master', description: 'Stayed under budget for 4 weeks', locked: false },
    { id: 2, icon: '⚡', title: 'Speed Spender', description: 'Made 10 transactions in a day', locked: false },
    { id: 3, icon: '💎', title: 'Premium Saver', description: 'Save ₹10k this month', locked: true },
    { id: 4, icon: '🌟', title: 'Social Butterfly', description: 'Split bills with 5 friends', locked: false },
  ])

  return (
    <div className="space-y-4 mt-6">
      {/* XP Progress */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm text-foreground">Level 12 - Money Pro</span>
          </div>
          <span className="text-xs font-bold text-primary bg-white/50 dark:bg-black/20 px-2 py-1 rounded-full">
            420 XP to Level 13
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-3">
          <div
            className="bg-gradient-to-r from-primary to-accent h-3 rounded-full"
            style={{ width: '72%' }}
          />
        </div>
      </div>

      {/* Weekly Challenges */}
      <div>
        <h3 className="font-black text-sm text-foreground mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Weekly Challenges
        </h3>
        <div className="space-y-2">
          <SpendingChallenge
            title="Chai Champion"
            description="Limit chai purchases to ₹200 this week"
            progress={150}
            target={200}
            emoji="☕"
          />
          <SpendingChallenge
            title="Student Savvy"
            description="No online shopping for 5 days"
            progress={3}
            target={5}
            emoji="🛍️"
          />
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h3 className="font-black text-sm text-foreground mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-secondary" />
          Achievements
        </h3>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {achievements.map((badge) => (
            <AchievementBadge key={badge.id} achievement={badge} />
          ))}
        </div>
      </div>

      {/* Streak */}
      <div className="bg-gradient-to-r from-secondary to-primary/30 rounded-xl p-4 border border-secondary/30">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🔥</span>
          <div>
            <p className="font-black text-lg text-foreground">7-Day Streak</p>
            <p className="text-sm text-muted-foreground">Keep it going! One more day = 100 XP</p>
          </div>
        </div>
      </div>
    </div>
  )
}
