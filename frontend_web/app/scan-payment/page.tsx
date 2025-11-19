"use client"

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Check, AlertCircle, Smartphone } from 'lucide-react'
import { useAuth } from '@/app/providers'

const categoryEmojis: Record<string, string> = {
  food: '🍔',
  grocery: '🛒',
  bills: '💡',
  transport: '🚕',
  shopping: '🛍️',
  entertainment: '🎬',
}

const categoryNames: Record<string, string> = {
  food: 'Food & Dining',
  grocery: 'Grocery',
  bills: 'Bills & Utilities',
  transport: 'Transport',
  shopping: 'Shopping',
  entertainment: 'Entertainment',
}

export default function ScanPaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const category = searchParams.get('category') || 'food'
  const { user } = useAuth()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)
  const [cameraError, setCameraError] = useState<string>('')
  const [scannedData, setScannedData] = useState<string>('')

  if (!user) {
    router.push('/login')
    return null
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
  }

  useEffect(() => {
    if (!videoRef.current || cameraError) return

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          console.log("[v0] Camera started successfully")
        }
      } catch (error: any) {
        console.error("[v0] Camera error:", error)
        let errorMessage = 'Camera access denied'
        
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow camera access to scan QR codes.'
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device.'
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Camera is already in use by another application.'
        }
        
        setCameraError(errorMessage)
        setIsScanning(false)
      }
    }

    startCamera()

    return () => {
      stopCamera()
    }
  }, [cameraError])

  useEffect(() => {
    if (!isScanning || cameraError) return

    const scanTimer = setTimeout(() => {
      const mockQRData = `upi://pay?pa=merchant@upi&pn=Merchant&am=500&tn=Payment`
      setScannedData(mockQRData)
      setIsScanning(false)
      stopCamera()

      // Record transaction with category
      const transaction = {
        id: Date.now(),
        type: 'sent' as const,
        name: `${categoryNames[category]} Payment`,
        emoji: categoryEmojis[category] || '💳',
        amount: Math.floor(Math.random() * 5000) + 100,
        time: 'Just now',
        category: categoryNames[category] || category,
      }

      const savedTransactions = localStorage.getItem('scan_transactions')
      let transactions = savedTransactions ? JSON.parse(savedTransactions) : []
      transactions.unshift(transaction)
      localStorage.setItem('scan_transactions', JSON.stringify(transactions))

      setShowSuccess(true)

      setTimeout(() => {
        router.push('/')
      }, 2000)
    }, 3000)

    return () => clearTimeout(scanTimer)
  }, [isScanning, category, cameraError])

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <button
          onClick={() => router.back()}
          className="text-white hover:text-gray-300 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white">Scanning QR Code</h1>
          <p className="text-xs text-gray-400">{categoryNames[category]}</p>
        </div>
      </div>

      {/* Camera/Scanner View */}
      <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
        {cameraError ? (
          <div className="flex flex-col items-center justify-center space-y-4 p-6 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-white">Camera Access Required</h2>
            <p className="text-gray-400 text-sm">{cameraError}</p>
            <div className="mt-4 p-4 bg-white/10 rounded-lg border border-white/20">
              <p className="text-white text-sm mb-3">To enable camera access:</p>
              <ol className="text-white text-xs text-left space-y-2">
                <li>1. Refresh the page</li>
                <li>2. Allow camera when prompted</li>
                <li>3. Try scanning again</li>
              </ol>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-primary text-black rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        ) : isScanning ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Scanner Frame Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-64 h-64">
                <div className="absolute inset-0 border-2 border-primary rounded-lg" />
                
                {/* Corner brackets */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
              </div>
              
              {/* Scanning Line Animation */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
            </div>

            {/* Category Badge */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{categoryEmojis[category]}</span>
                <span className="text-white font-semibold">{categoryNames[category]}</span>
              </div>
            </div>

            {/* Scanning Text */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center text-white/70">
              <p className="text-sm font-medium">Hold steady...</p>
              <p className="text-xs mt-1">Scanning QR code</p>
            </div>
          </>
        ) : showSuccess ? (
          // Success State
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center">
              <Check className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white text-center">Payment Recorded</h2>
            <p className="text-gray-300 text-center">
              Your {categoryNames[category]} payment has been saved
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
