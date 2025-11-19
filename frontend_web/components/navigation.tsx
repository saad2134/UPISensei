"use client"

import { Home, Scan, User } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CategorySelector from './category-selector'

interface NavigationProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const categoryEmojis: Record<string, string> = {
  food: '🍔',
  grocery: '🛒',
  bills: '💡',
  transport: '🚕',
  shopping: '🛍️',
  entertainment: '🎬',
  general: '💳',
  transfers: '🔄',
}

const categoryNames: Record<string, string> = {
  food: 'Food & Dining',
  grocery: 'Grocery',
  bills: 'Bills & Utilities',
  transport: 'Transport',
  shopping: 'Shopping',
  entertainment: 'Entertainment',
  general: 'General',
  transfers: 'Transfers',
}

export default function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  const [isSupported, setIsSupported] = useState(true)
  const [showCategorySelector, setShowCategorySelector] = useState(false)
  const router = useRouter()

  const handleScannerClick = async () => {
    try {
      // Check camera availability
      const devices = await navigator.mediaDevices.enumerateDevices()
      const hasCamera = devices.some(device => device.kind === 'videoinput')
      
      if (!hasCamera) {
        setIsSupported(false)
        alert('No camera found on this device.')
        return
      }

      // Check Android for UPI support
      const isAndroid = /android/i.test(navigator.userAgent)
      if (!isAndroid) {
        const proceed = confirm('UPI payments work best on Android devices. You can still scan and record transactions. Continue?')
        if (!proceed) return
      }
      
      setShowCategorySelector(true)
    } catch (error) {
      console.log("[v0] Camera access error:", error)
      setIsSupported(false)
      alert('Unable to access camera. Please check permissions.')
    }
  }

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category)
    setShowCategorySelector(false)
    
    // Navigate to scan payment page with the selected category
    router.push(`/scan-payment?category=${category}`)
  }

  const [selectedCategory, setSelectedCategory] = useState<string>('general')

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-around">
          {/* Dashboard Tab */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 flex flex-col items-center justify-center py-4 px-2 transition-colors relative ${
              activeTab === 'dashboard' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {activeTab === 'dashboard' && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full" />
            )}
            <Home className="w-6 h-6 mb-1" />
            <span className="text-xs font-bold">Dashboard</span>
          </button>

          {/* Scan Button - Central FAB */}
          <button
            onClick={handleScannerClick}
            className="flex flex-col items-center justify-center -translate-y-6 relative group"
            aria-label="Scan QR code"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-primary via-accent to-secondary rounded-full flex items-center justify-center shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95">
              <Scan className="w-7 h-7 text-white" />
            </div>
            <span className="text-xs font-bold mt-1 text-primary">Scan</span>
            
            {/* Pulsing glow effect */}
            <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-primary opacity-0 group-hover:opacity-100 animate-pulse" />
          </button>

          {/* Profile Tab */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex flex-col items-center justify-center py-4 px-2 transition-colors relative ${
              activeTab === 'profile' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {activeTab === 'profile' && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full" />
            )}
            <User className="w-6 h-6 mb-1" />
            <span className="text-xs font-bold">Profile</span>
          </button>
        </div>
      </nav>

      {/* Category Selector Modal */}
      {showCategorySelector && (
        <CategorySelector
          onSelectCategory={handleCategorySelect}
          onBack={() => setShowCategorySelector(false)}
          categories={Object.entries(categoryNames).map(([key, name]) => ({
            id: key,
            name,
            emoji: categoryEmojis[key] || '💳'
          }))}
        />
      )}
    </>
  )
}