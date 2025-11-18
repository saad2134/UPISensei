"use client"

import { Home, Scan, User } from 'lucide-react'
import { useState } from 'react'

interface NavigationProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  const [scannerOpen, setScannerOpen] = useState(false)
  const [isSupported, setIsSupported] = useState(true)

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'profile', label: 'Profile', icon: User },
  ]

  const handleScannerClick = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const hasCamera = devices.some(device => device.kind === 'videoinput')

      if (!hasCamera) {
        setIsSupported(false)
        return
      }

      setScannerOpen(true)
    } catch (error) {
      console.log("[v0] Camera access error:", error)
      setIsSupported(false)
    }
  }

  const handleCloseScan = () => {
    setScannerOpen(false)
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-around">
          {/* Dashboard Tab */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 flex flex-col items-center justify-center py-4 px-2 transition-colors relative ${activeTab === 'dashboard' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            {activeTab === 'dashboard' && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full" />
            )}
            <Home className="w-6 h-6 mb-1" />
            <span className="text-xs font-bold">Dashboard</span>
          </button>

          <button
            onClick={handleScannerClick}
            className="flex flex-col items-center justify-center -translate-y-6 relative group"
            aria-label="Scan QR code"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-primary via-accent to-secondary rounded-md flex items-center justify-center shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95">
              <Scan className="w-7 h-7 text-white" />
            </div>
            <span className="text-xs font-bold mt-1 text-primary">Scan</span>

            {/* Pulsing glow effect */}
            <div className="absolute inset-0 w-16 h-16 rounded-md border-2 border-primary opacity-0 group-hover:opacity-100 animate-pulse" style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
          </button>

          {/* Profile Tab */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex flex-col items-center justify-center py-4 px-2 transition-colors relative ${activeTab === 'profile' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
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

      {/* Scanner Modal */}
      {scannerOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
            <h2 className="text-white text-lg font-bold">Scan QR Code</h2>
            <button
              onClick={handleCloseScan}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scanner Area */}
          <div className="w-72 h-72 border-4 border-primary rounded-2xl relative overflow-hidden shadow-2xl">
            <video
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              onError={() => {
                console.log("[v0] Camera stream error")
                setIsSupported(false)
              }}
            />

            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-secondary" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-secondary" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-secondary" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-secondary" />

            {/* Scanning line animation */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-b from-secondary via-primary to-transparent animate-pulse" style={{ animation: 'slideDown 2s ease-in-out infinite' }} />
          </div>

          {/* Instructions */}
          <p className="text-white text-center mt-8 text-sm font-medium">
            Position QR code within frame
          </p>

          {/* Close button */}
          <button
            onClick={handleCloseScan}
            className="mt-12 px-8 py-3 bg-primary hover:bg-accent text-white font-bold rounded-full transition-all transform active:scale-95"
          >
            Close Scanner
          </button>

          {/* Error message if camera not supported */}
          {!isSupported && (
            <div className="absolute bottom-4 left-4 right-4 bg-red-500/90 text-white p-4 rounded-lg text-sm font-medium">
              Camera access not available on this device
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          0% {
            transform: translateY(-100%);
          }
          50% {
            transform: translateY(300px);
          }
          100% {
            transform: translateY(-100%);
          }
        }
      `}</style>
    </>
  )
}
