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
import ProfileSection from './profile-section'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const { user, isLoggedIn } = useAuth()
  const router = useRouter()

  if (!isLoggedIn) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted pb-24">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 pt-4 pb-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Spending Stats Card */}
            <SpendingStatsCard />

            {/* Pie Chart Section */}
            <WeeklySpendingChart />

            {/* Gen-Z Joke */}
            <GenZJoke />

            {/* Transaction History */}
            <TransactionHistory />
          </div>
        )}

        {activeTab === 'profile' && (
          <ProfileSection />
        )}
      </main>

      {/* Bottom Navigation */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      <FloatingChatButton />
    </div>
  )
}
