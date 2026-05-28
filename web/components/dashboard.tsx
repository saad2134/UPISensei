"use client"

import { useState } from 'react'
import { useAuth } from '@/app/providers'
import { useRouter } from 'next/navigation'
import Header from './header'
import Navigation from './navigation'
import SpendingStatsCard from './spending-stats-card'
import WeeklySpendingChart from './weekly-spending-chart'
import GenZJoke from './gen-z-joke'
import TransactionHistory from './transaction-history'
import FloatingChatButton from './floating-chat-button'
import MenuSection from './menu-section'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const { user, isLoggedIn } = useAuth()
  const router = useRouter()

  if (!isLoggedIn) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pb-24">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 pt-4 pb-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <SpendingStatsCard />
            <WeeklySpendingChart />
            <GenZJoke />
            <TransactionHistory />
          </div>
        )}

        {activeTab === 'menu' && (
          <MenuSection />
        )}
      </main>

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <FloatingChatButton />
    </div>
  )
}
