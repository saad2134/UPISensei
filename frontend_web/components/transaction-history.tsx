"use client"

import { useState, useEffect } from 'react'
import TransactionCard from './transaction-card'

interface Transaction {
  id: number
  type: 'sent' | 'received'
  name: string
  emoji: string
  amount: number
  time: string
  category: string
}

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 1,
      type: 'sent',
      name: 'Swiggy - Chai & Samosa',
      emoji: '🍕',
      amount: 340,
      time: '2 hours ago',
      category: 'Food & Drinks',
    },
    {
      id: 2,
      type: 'sent',
      name: 'Uber - Office Commute',
      emoji: '🚗',
      amount: 285,
      time: '5 hours ago',
      category: 'Transport',
    },
    {
      id: 3,
      type: 'received',
      name: 'Salary Credited',
      emoji: '💰',
      amount: 50000,
      time: 'Yesterday',
      category: 'Income',
    },
    {
      id: 4,
      type: 'sent',
      name: 'Netflix Subscription',
      emoji: '🎬',
      amount: 199,
      time: '2 days ago',
      category: 'Entertainment',
    },
    {
      id: 5,
      type: 'sent',
      name: 'Zara - Shopping',
      emoji: '👗',
      amount: 1250,
      time: '3 days ago',
      category: 'Shopping',
    },
  ])

  useEffect(() => {
    const savedTransactions = localStorage.getItem('scan_transactions')
    if (savedTransactions) {
      try {
        const parsed = JSON.parse(savedTransactions)
        setTransactions([...parsed, ...transactions])
      } catch (error) {
        console.error('Failed to parse saved transactions:', error)
      }
    }
  }, [])

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">History of Transactions</h3>
        {/* <a href="#" className="text-sm text-primary hover:text-accent transition-colors font-medium">
          View all
        </a> */}
      </div>

      <div className="space-y-3">
        {transactions.map((tx) => (
          <TransactionCard key={tx.id} transaction={tx} />
        ))}
      </div>
    </div>
  )
}
