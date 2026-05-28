"use client"

import { useState } from 'react'
import TransactionCard from './transaction-card'
import MemeCard from './meme-card'
import TapRevealCard from './tap-reveal-card'

export default function ChatFeed() {
  const [transactions] = useState([
    {
      id: 1,
      type: 'sent',
      name: 'Chai at Starbucks',
      emoji: '☕',
      amount: 120,
      time: '10 mins ago',
      category: 'Food & Drinks',
    },
    {
      id: 2,
      type: 'received',
      name: 'Zara sent you money',
      emoji: '👸',
      amount: 500,
      time: '2 hours ago',
      category: 'Friends',
    },
    {
      id: 3,
      type: 'sent',
      name: 'Netflix subscription',
      emoji: '🎬',
      amount: 199,
      time: 'Yesterday',
      category: 'Entertainment',
    },
  ])

  return (
    <div className="space-y-4">
      {/* Insight Card */}
      <MemeCard
        type="insight"
        title="Your Spending Pattern 📊"
        message="Bhai you spent ₹650 on coffee this month. That's literally a course on Udemy 💀"
      />

      {/* Transactions */}
      {transactions.map((tx) => (
        <TransactionCard key={tx.id} transaction={tx} />
      ))}

      {/* Spending Warning */}
      <MemeCard
        type="warning"
        title="Spending Alert 🚨"
        message="You're on pace to spend ₹15k this month. Your budget was ₹10k. Time to touch grass fr fr 🌱"
      />

      {/* Tap to Reveal - Category Breakdown */}
      <TapRevealCard
        title="Category Breakdown 🎯"
        hidden="Tap to reveal where your money actually went..."
        revealed={
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                <span className="text-lg">🍕</span> Food
              </span>
              <span className="text-lg font-bold text-primary">₹1,200</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: '45%' }}
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <span className="text-lg">🎮</span> Gaming
              </span>
              <span className="text-lg font-bold text-secondary">₹850</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-secondary h-2 rounded-full"
                style={{ width: '32%' }}
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <span className="text-lg">🎓</span> Education
              </span>
              <span className="text-lg font-bold text-accent">₹400</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-accent h-2 rounded-full"
                style={{ width: '15%' }}
              />
            </div>
          </div>
        }
      />

      {/* Daily Challenge */}
      <MemeCard
        type="challenge"
        title="Today's Challenge 🎪"
        message="Don't spend on food for the next 2 hours. You got this? 🏆"
      />
    </div>
  )
}
