"use client"

import { useState, useEffect } from 'react'
import { Search, Filter, Tag, ArrowUpDown } from 'lucide-react'
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

export default function TransactionHistory({ showFilters = false }: { showFilters?: boolean }) {
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

  // Filter/Sort States
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'sent' | 'received'>('all')
  const [filterCategory, setFilterCategory] = useState('All')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount-desc' | 'amount-asc'>('newest')

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

  // Dynamic unique categories list
  const uniqueCategories = Array.from(
    new Set(transactions.map((tx) => tx.category).filter(Boolean))
  )

  // Filter and Sort implementation
  const filteredAndSortedTransactions = transactions
    .filter((tx) => {
      // 1. Search term filter
      const matchesSearch =
        tx.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.category && tx.category.toLowerCase().includes(searchTerm.toLowerCase()))

      // 2. Type filter (sent / received)
      const matchesType = filterType === 'all' ? true : tx.type === filterType

      // 3. Category filter
      const matchesCategory = filterCategory === 'All' ? true : tx.category === filterCategory

      return matchesSearch && matchesType && matchesCategory
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return b.id - a.id
      }
      if (sortBy === 'oldest') {
        return a.id - b.id
      }
      if (sortBy === 'amount-desc') {
        return b.amount - a.amount
      }
      if (sortBy === 'amount-asc') {
        return a.amount - b.amount
      }
      return 0
    })

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="bg-card border border-border/70 rounded-xl p-2 shadow-sm space-y-2 shrink-0">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-border rounded-lg py-1.5 pl-8 pr-2.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-primary/50 text-foreground transition-all font-medium"
            />
          </div>

          {/* 3 Dropdowns in 3 Columns */}
          <div className="grid grid-cols-3 gap-1.5">
            {/* Type Filter */}
            <div className="relative">
              <Filter className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full bg-background border border-border rounded-lg pl-6.5 pr-2 py-1 text-[10px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 font-bold cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="sent">Sent</option>
                <option value="received">Received</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Tag className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-background border border-border rounded-lg pl-6.5 pr-2 py-1 text-[10px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 font-bold truncate cursor-pointer max-w-full"
              >
                <option value="All">All Categories</option>
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div className="relative">
              <ArrowUpDown className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-background border border-border rounded-lg pl-6.5 pr-2 py-1 text-[10px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 font-bold cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount-desc">₹ High to Low</option>
                <option value="amount-asc">₹ Low to High</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filteredAndSortedTransactions.length === 0 ? (
          <div className="text-center py-8 bg-card border border-border/60 rounded-2xl p-4">
            <p className="text-sm font-bold text-muted-foreground">No transactions found</p>
            <p className="text-xs text-muted-foreground/75 mt-1">Try adjusting your filters or search query</p>
          </div>
        ) : (
          filteredAndSortedTransactions.map((tx) => (
            <TransactionCard key={tx.id} transaction={tx} />
          ))
        )}
      </div>
    </div>
  )
}
