"use client"

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Check, AlertCircle, Smartphone, SwitchCamera, Camera } from 'lucide-react'
import { useAuth } from '@/app/providers'
import jsQR from 'jsqr'

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

interface UPIQRData {
  pa: string; // UPI ID
  pn: string; // Payee Name
  am?: string; // Amount
  tn?: string; // Transaction Note
  cu?: string; // Currency
}

export default function ScanPaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const category = searchParams.get('category')
  const { user } = useAuth()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScanning, setIsScanning] = useState(true)
  const [cameraError, setCameraError] = useState<string>('')
  const [scannedData, setScannedData] = useState<UPIQRData | null>(null)
  const [currentStep, setCurrentStep] = useState<'scanning' | 'category' | 'confirm' | 'success'>('scanning')
  const [selectedCategory, setSelectedCategory] = useState<string>(category || 'general')
  const [amount, setAmount] = useState<string>('')
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [currentCameraIndex, setCurrentCameraIndex] = useState<number>(0)
  const [scanningText, setScanningText] = useState('Initializing camera...')
  const [isCameraStarting, setIsCameraStarting] = useState(false)
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const isMountedRef = useRef<boolean>(true)

  if (!user) {
    router.push('/login')
    return null
  }

  // Check if user is on Android
  const isAndroid = () => {
    return /android/i.test(navigator.userAgent)
  }

  const stopCamera = () => {
    console.log('Stopping camera...')
    
    // Stop animation frame first
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = undefined
    }

    // Stop all media tracks
    if (streamRef.current) {
      console.log('Stopping stream tracks...')
      streamRef.current.getTracks().forEach(track => {
        console.log(`Stopping track: ${track.kind} - ${track.readyState}`)
        track.stop()
      })
      streamRef.current = null
    }

    // Clear video source but don't reset the element
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const checkCameraPermission = async (): Promise<boolean> => {
    try {
      // Create a temporary stream to check permission
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      // Get the tracks to check if they're active
      const videoTrack = stream.getVideoTracks()[0]
      const hasPermission = videoTrack.readyState === 'live'
      
      // Stop the temporary stream
      stream.getTracks().forEach(track => track.stop())
      
      console.log('Camera permission check:', hasPermission ? 'Granted' : 'Not granted')
      return hasPermission
    } catch (error: any) {
      console.log('Camera permission denied:', error.name)
      return false
    }
  }

  const getCameras = async (): Promise<MediaDeviceInfo[]> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const cameras = devices.filter(device => device.kind === 'videoinput' && device.deviceId !== '')
      console.log('Available cameras:', cameras.map(cam => ({ label: cam.label, deviceId: cam.deviceId.slice(0, 10) + '...' })))
      setAvailableCameras(cameras)
      return cameras
    } catch (error) {
      console.error('Error getting cameras:', error)
      return []
    }
  }

  const startCamera = async (deviceId?: string): Promise<boolean> => {
    if (isCameraStarting || !isMountedRef.current) {
      console.log('Camera is already starting or component unmounted, skipping...')
      return false
    }

    try {
      setIsCameraStarting(true)
      setScanningText('Starting camera...')
      setCameraError('')
      
      // Only stop previous camera if we're switching devices
      if (deviceId || !streamRef.current) {
        stopCamera()
      }

      console.log('Requesting camera access...')

      // Simple constraints
      const constraints: MediaStreamConstraints = {
        video: {
          ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'environment' })
        },
        audio: false
      }

      console.log('Camera constraints:', constraints)

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (!isMountedRef.current) {
        // Component unmounted while waiting for stream, clean up
        stream.getTracks().forEach(track => track.stop())
        return false
      }

      streamRef.current = stream
      
      // Monitor stream health
      stream.getVideoTracks().forEach(track => {
        track.addEventListener('ended', () => {
          console.log('Video track ended unexpectedly')
          if (isMountedRef.current && isScanning) {
            setCameraError('Camera stream ended unexpectedly. Please try again.')
            setIsScanning(false)
          }
        })
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        
        // Use a simpler approach to wait for video
        const waitForVideo = () => {
          return new Promise<void>((resolve) => {
            const video = videoRef.current
            if (video && video.readyState >= 2) { // HAVE_CURRENT_DATA or better
              resolve()
            } else {
              const onCanPlay = () => {
                video?.removeEventListener('canplay', onCanPlay)
                resolve()
              }
              video?.addEventListener('canplay', onCanPlay)
              // Fallback timeout
              setTimeout(resolve, 500)
            }
          })
        }

        await waitForVideo()

        // Start playback without waiting
        videoRef.current.play().catch(error => {
          console.warn('Video play warning:', error)
          // Non-fatal, continue anyway
        })
      }

      // Get available cameras
      await getCameras()

      console.log("Camera started successfully, stream active:", stream.active)
      setScanningText('Scanning QR code...')
      setHasCameraPermission(true)
      
      // Start QR scanning
      startQRScanning()
      return true
    } catch (error: any) {
      console.error("Camera start error:", error)
      
      if (!isMountedRef.current) return false

      let errorMessage = 'Failed to access camera'
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.'
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.'
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.'
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera constraints could not be satisfied.'
      }

      setCameraError(errorMessage)
      setIsScanning(false)
      setHasCameraPermission(false)
      return false
    } finally {
      if (isMountedRef.current) {
        setIsCameraStarting(false)
      }
    }
  }

  const switchCamera = async () => {
    if (availableCameras.length <= 1 || isCameraStarting) return

    const nextIndex = (currentCameraIndex + 1) % availableCameras.length
    const nextCamera = availableCameras[nextIndex]
    const success = await startCamera(nextCamera.deviceId)
    if (success) {
      setCurrentCameraIndex(nextIndex)
    }
  }

  const parseUPIQR = (data: string): UPIQRData | null => {
    try {
      console.log('Parsing QR data:', data)
      
      if (!data.startsWith('upi://pay')) {
        console.log('Not a UPI QR code')
        return null
      }

      const url = new URL(data)
      const params = new URLSearchParams(url.search)

      const upiData: UPIQRData = {
        pa: params.get('pa') || '',
        pn: params.get('pn') || '',
        am: params.get('am') || undefined,
        tn: params.get('tn') || undefined,
        cu: params.get('cu') || 'INR',
      }

      if (!upiData.pa) {
        console.log('Missing UPI ID (pa)')
        return null
      }

      if (!upiData.pa.includes('@')) {
        console.log('Invalid UPI ID format')
        return null
      }

      console.log('Valid UPI QR parsed:', upiData)
      return upiData
    } catch (error) {
      console.error('Error parsing UPI QR:', error)
      return null
    }
  }

  const startQRScanning = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    
    if (!video || !canvas || !streamRef.current) {
      console.log('QR scanning prerequisites not met')
      return
    }

    const context = canvas.getContext('2d')
    if (!context) {
      console.log('Canvas context not available')
      return
    }

    let lastScanTime = 0
    const SCAN_INTERVAL = 500 // Only scan every 500ms to reduce load

    const scan = () => {
      if (!isMountedRef.current || !isScanning || !streamRef.current?.active) {
        console.log('Stopping QR scan: component unmounted or stream inactive')
        return
      }

      try {
        const now = Date.now()
        if (now - lastScanTime < SCAN_INTERVAL) {
          // Skip this frame to reduce load
          animationFrameRef.current = requestAnimationFrame(scan)
          return
        }

        // Safe check for video readyState
        if (video.readyState && video.readyState >= video.HAVE_CURRENT_DATA) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          
          context.drawImage(video, 0, 0, canvas.width, canvas.height)
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
          const code = jsQR(imageData.data, imageData.width, imageData.height)
          
          if (code) {
            console.log('QR Code detected:', code.data)
            const upiData = parseUPIQR(code.data)
            
            if (upiData) {
              setScannedData(upiData)
              setAmount(upiData.am || '')
              setIsScanning(false)
              stopCamera()
              setCurrentStep('confirm')
              return
            } else {
              setScanningText('Not a valid UPI QR code')
              setTimeout(() => {
                if (isMountedRef.current && isScanning) {
                  setScanningText('Scanning QR code...')
                }
              }, 2000)
            }
          }
          
          lastScanTime = now
        }
        
        animationFrameRef.current = requestAnimationFrame(scan)
      } catch (error) {
        console.error('Error during QR scanning:', error)
        // Continue scanning despite errors
        animationFrameRef.current = requestAnimationFrame(scan)
      }
    }

    // Start scanning after a brief delay
    setTimeout(() => {
      if (isMountedRef.current && isScanning && streamRef.current?.active) {
        animationFrameRef.current = requestAnimationFrame(scan)
      }
    }, 1000)
  }

  const handleManualDemo = () => {
    const mockUPIQR = `upi://pay?pa=merchant@oksbi&pn=Merchant Store&am=500&tn=Payment for goods&cu=INR`
    const parsedData = parseUPIQR(mockUPIQR)
    
    if (parsedData) {
      setScannedData(parsedData)
      setAmount(parsedData.am || '')
      setIsScanning(false)
      stopCamera()
      setCurrentStep('confirm')
    }
  }

  const requestCameraAccess = async () => {
    setCameraError('')
    setIsScanning(true)
    await startCamera()
  }

  useEffect(() => {
    isMountedRef.current = true

    if (isScanning) {
      console.log('Initializing camera on mount...')
      startCamera()
    }

    return () => {
      console.log('Component unmounting, cleaning up...')
      isMountedRef.current = false
      stopCamera()
    }
  }, [isScanning])

  const handlePayment = () => {
    if (!scannedData || !amount) return

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount')
      return
    }

    const transaction = {
      id: Date.now(),
      type: 'sent' as const,
      name: scannedData.pn,
      upiId: scannedData.pa,
      emoji: categoryEmojis[selectedCategory] || '💳',
      amount: amountNum,
      time: new Date().toLocaleTimeString(),
      category: categoryNames[selectedCategory],
      timestamp: new Date().toISOString(),
      status: isAndroid() ? 'pending' : 'recorded',
    }

    console.log('UPI Transaction:', transaction)

    const savedTransactions = localStorage.getItem('scan_transactions')
    let transactions = savedTransactions ? JSON.parse(savedTransactions) : []
    transactions.unshift(transaction)
    localStorage.setItem('scan_transactions', JSON.stringify(transactions))

    if (isAndroid()) {
      const upiDeepLink = `upi://pay?pa=${scannedData.pa}&pn=${encodeURIComponent(scannedData.pn)}&am=${amount}&tn=${encodeURIComponent(scannedData.tn || `Payment for ${categoryNames[selectedCategory]}`)}&cu=INR`
      
      console.log('Redirecting to UPI app:', upiDeepLink)
      stopCamera()
      window.location.href = upiDeepLink

      setTimeout(() => {
        if (isMountedRef.current) {
          setCurrentStep('success')
        }
      }, 1000)
    } else {
      setCurrentStep('success')
    }

    setTimeout(() => {
      if (isMountedRef.current) {
        router.push('/')
      }
    }, 3000)
  }

  const handleBack = () => {
    stopCamera()
    if (currentStep === 'scanning') {
      router.back()
    } else if (currentStep === 'confirm') {
      setCurrentStep('scanning')
      setIsScanning(true)
    } else {
      router.push('/')
    }
  }

  const renderScanningStep = () => (
    <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
      {cameraError ? (
        <div className="flex flex-col items-center justify-center space-y-4 p-6 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
            <Camera className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-white">Camera Access Required</h2>
          <p className="text-gray-400 text-sm">{cameraError}</p>
          
          <div className="flex gap-3 mt-4">
            <button
              onClick={requestCameraAccess}
              className="px-6 py-2 bg-primary text-black rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors border border-white/20"
            >
              Refresh Page
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-white/20">
            <p className="text-gray-400 text-sm mb-2">Or continue with demo mode:</p>
            <button
              onClick={handleManualDemo}
              className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg font-semibold hover:bg-blue-500/30 transition-colors border border-blue-500/30 text-sm"
            >
              Use Demo QR Code
            </button>
          </div>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            onLoadedData={() => console.log('Video loaded data')}
            onCanPlay={() => console.log('Video can play')}
            onPlay={() => console.log('Video started playing')}
            onPause={() => console.log('Video paused')}
            onEnded={() => console.log('Video ended')}
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Scanner Frame Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-64 h-64">
              <div className="absolute inset-0 border-2 border-primary rounded-lg" />
              
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
            </div>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
          </div>

          {availableCameras.length > 1 && (
            <button
              onClick={switchCamera}
              disabled={isCameraStarting}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm border border-white/20 transition-all disabled:opacity-50"
              aria-label="Switch camera"
            >
              <SwitchCamera className="w-6 h-6" />
            </button>
          )}

          <button
            onClick={handleManualDemo}
            className="absolute top-4 left-4 bg-primary/80 hover:bg-primary text-black px-4 py-2 rounded-lg font-semibold text-sm backdrop-blur-sm border border-white/20 transition-all"
          >
            Test Demo
          </button>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center text-white/70">
            <p className="text-sm font-medium">
              {isCameraStarting ? 'Starting camera...' : scanningText}
            </p>
            <p className="text-xs mt-1">Point camera at UPI QR code</p>
          </div>

          {/* Stream status indicator */}
          {streamRef.current && (
            <div className="absolute top-20 right-20 bg-green-500/20 px-3 py-1 rounded-full border border-green-500/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-xs">Camera Active</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )

  const renderConfirmStep = () => (
    <div className="flex-1 bg-black p-6 overflow-y-auto">
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-white text-center mb-6">Confirm Payment</h2>
        
        {scannedData && (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-white font-semibold mb-3">Recipient Details</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-gray-400 text-sm">Name</p>
                  <p className="text-white font-medium">{scannedData.pn}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">UPI ID</p>
                  <p className="text-white font-medium text-sm break-all">{scannedData.pa}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{categoryEmojis[selectedCategory]}</span>
                  <span className="text-white">{categoryNames[selectedCategory]}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-white font-semibold mb-3">Amount</h3>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white text-2xl">₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                  step="1"
                  className="w-full bg-white/10 border border-white/20 rounded-lg py-4 px-12 text-white text-xl font-semibold placeholder-gray-400 focus:outline-none focus:border-primary"
                />
              </div>
              {scannedData.am && (
                <p className="text-gray-400 text-sm mt-2">
                  Suggested amount: ₹{scannedData.am}
                </p>
              )}
            </div>

            {scannedData.tn && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-2">Transaction Note</h3>
                <p className="text-gray-300 text-sm">{scannedData.tn}</p>
              </div>
            )}

            <div className={`rounded-xl p-4 border ${
              isAndroid() 
                ? 'bg-green-500/20 border-green-500/50' 
                : 'bg-yellow-500/20 border-yellow-500/50'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className={`w-5 h-5 ${isAndroid() ? 'text-green-500' : 'text-yellow-500'}`} />
                <p className={`font-semibold ${isAndroid() ? 'text-green-500' : 'text-yellow-500'}`}>
                  {isAndroid() ? 'Ready for UPI Payment' : 'Platform Limitation'}
                </p>
              </div>
              <p className={`text-sm ${isAndroid() ? 'text-green-400' : 'text-yellow-400'}`}>
                {isAndroid() 
                  ? 'You will be redirected to your UPI app to complete the payment.'
                  : 'UPI payments are only supported on Android devices. Transaction will be recorded only.'
                }
              </p>
            </div>

            <button
              onClick={handlePayment}
              disabled={!amount || parseFloat(amount) <= 0}
              className="w-full py-4 bg-primary text-black rounded-xl font-bold text-lg hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isAndroid() ? 'Continue to Payment' : 'Record Transaction'}
            </button>
          </div>
        )}
      </div>
    </div>
  )

  const renderSuccessStep = () => (
    <div className="flex-1 bg-black flex items-center justify-center p-6">
      <div className="text-center">
        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-12 h-12 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {isAndroid() ? 'Payment Initiated' : 'Transaction Recorded'}
        </h2>
        <p className="text-gray-300 mb-4">
          {isAndroid() 
            ? 'Redirecting to UPI app...' 
            : 'Transaction has been recorded successfully'
          }
        </p>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <p className="text-white font-semibold">₹{amount}</p>
          <p className="text-gray-400 text-sm">
            to {scannedData?.pn} • {categoryNames[selectedCategory]}
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex items-center gap-4 p-4 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <button
          onClick={handleBack}
          className="text-white hover:text-gray-300 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white">
            {currentStep === 'scanning' && 'Scan QR Code'}
            {currentStep === 'confirm' && 'Confirm Payment'}
            {currentStep === 'success' && 'Success'}
          </h1>
          <p className="text-xs text-gray-400">
            {currentStep === 'scanning' && 'Position the UPI QR code in frame'}
            {currentStep === 'confirm' && 'Review and confirm payment'}
            {currentStep === 'success' && 'Payment processing'}
          </p>
        </div>
      </div>

      {currentStep === 'scanning' && renderScanningStep()}
      {currentStep === 'confirm' && renderConfirmStep()}
      {currentStep === 'success' && renderSuccessStep()}
    </div>
  )
}