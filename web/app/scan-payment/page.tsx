"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Check, Smartphone, Camera, Image, Lock, Shield, RefreshCw, CreditCard, ChevronDown, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/app/providers'
import jsQR from 'jsqr'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

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
  pa: string;
  pn: string;
  am?: string;
  tn?: string;
  cu?: string;
}

interface WorkerMessage {
  type: 'scan';
  imageData: ImageData;
  id: number;
}

interface WorkerResponse {
  type: 'result';
  data: string | null;
  id: number;
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
  const [currentStep, setCurrentStep] = useState<'scanning' | 'category' | 'confirm' | 'pin' | 'success'>('scanning')
  const [pinInputs, setPinInputs] = useState<string[]>([])
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>(category || 'general')
  const [amount, setAmount] = useState<string>('')
  const [scanningText, setScanningText] = useState('Initializing camera...')
  const [isCameraStarting, setIsCameraStarting] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const isMountedRef = useRef<boolean>(true)
  const [debugMode, setDebugMode] = useState(false)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showInvalidQRDialog, setShowInvalidQRDialog] = useState(false)
  const [invalidQRMessage, setInvalidQRMessage] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  const barcodeDetectorRef = useRef<any>(null)
  const workerRef = useRef<Worker | null>(null)
  const pendingScansRef = useRef<Map<number, { resolve: (data: string | null) => void; reject: (err: Error) => void }>>(new Map())
  const scanCounterRef = useRef(0)
  const lastValidScanRef = useRef<string>('')
  const lastScanTimeRef = useRef(0)
  const isInitialMountRef = useRef(true)

  if (!user) {
    router.push('/login')
    return null
  }

  const isAndroid = () => {
    return /android/i.test(navigator.userAgent)
  }

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = undefined
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const parseUPIQR = (data: string): UPIQRData | null => {
    if (!data.startsWith('upi://pay')) {
      return null
    }

    try {
      const url = new URL(data)
      const params = new URLSearchParams(url.search)

      const upiData: UPIQRData = {
        pa: params.get('pa') || '',
        pn: params.get('pn') || '',
        am: params.get('am') || undefined,
        tn: params.get('tn') || undefined,
        cu: params.get('cu') || 'INR',
      }

      if (!upiData.pa || !upiData.pa.includes('@')) {
        return null
      }

      return upiData
    } catch {
      return null
    }
  }

  const initBarcodeDetector = async () => {
    if ('BarcodeDetector' in window) {
      try {
        const formats = await (window as any).BarcodeDetector.getSupportedFormats()
        if (formats.includes('qr_code')) {
          barcodeDetectorRef.current = new (window as any).BarcodeDetector({
            formats: ['qr_code']
          })
          return true
        }
      } catch {
        console.log('BarcodeDetector not available')
      }
    }
    return false
  }

  const initWorker = () => {
    if (typeof window !== 'undefined' && !workerRef.current) {
      const workerCode = `
        self.onmessage = function(e) {
          if (e.data.type === 'scan') {
            const { imageData } = e.data
            try {
              importScripts('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js')
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
              })
              self.postMessage({ type: 'result', data: code?.data || null, id: e.data.id })
            } catch (err) {
              self.postMessage({ type: 'result', data: null, id: e.data.id })
            }
          }
        }
      `
      const blob = new Blob([workerCode], { type: 'application/javascript' })
      workerRef.current = new Worker(URL.createObjectURL(blob))
      
      workerRef.current.onmessage = (e: MessageEvent) => {
        const data = e.data as { type: string; data: string | null; id: number }
        const pending = pendingScansRef.current.get(data.id)
        if (pending) {
          pending.resolve(data.data)
          pendingScansRef.current.delete(data.id)
        }
      }
    }
  }

  const scanWithWorker = (imageData: ImageData): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      const id = ++scanCounterRef.current
      pendingScansRef.current.set(id, { resolve: (data: string | null) => resolve(data), reject })
      
      if (workerRef.current) {
        workerRef.current.postMessage({
          type: 'scan',
          imageData,
          id
        })
      } else {
        reject(new Error('Worker not initialized'))
      }
    })
  }

  const enhanceImageContrast = (ctx: CanvasRenderingContext2D, width: number, height: number): ImageData => {
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
      const threshold = 128
      const val = avg > threshold ? 255 : 0
      data[i] = val
      data[i + 1] = val
      data[i + 2] = val
    }
    
    return imageData
  }

  const processFrame = useCallback(async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    
    if (!video || !canvas || !streamRef.current || !isMountedRef.current || !isScanning) {
      return
    }

    if (video.readyState < video.HAVE_CURRENT_DATA) {
      animationFrameRef.current = requestAnimationFrame(processFrame)
      return
    }

    const now = Date.now()
    if (now - lastScanTimeRef.current < 8) {
      animationFrameRef.current = requestAnimationFrame(processFrame)
      return
    }
    lastScanTimeRef.current = now

    const scanRegion = Math.min(video.videoWidth, video.videoHeight) * 0.6
    const sx = (video.videoWidth - scanRegion) / 2
    const sy = (video.videoHeight - scanRegion) / 2

    canvas.width = scanRegion
    canvas.height = scanRegion

    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) {
      animationFrameRef.current = requestAnimationFrame(processFrame)
      return
    }

    context.drawImage(video, sx, sy, scanRegion, scanRegion, 0, 0, scanRegion, scanRegion)
    
    let qrData: string | null = null

    if (barcodeDetectorRef.current) {
      try {
        const bitmap = await createImageBitmap(canvas)
        const barcodes = await barcodeDetectorRef.current.detect(bitmap)
        if (barcodes.length > 0 && barcodes[0].rawValue) {
          qrData = barcodes[0].rawValue
        }
        bitmap.close()
      } catch {
        qrData = null
      }
    }

    if (!qrData && workerRef.current) {
      try {
        const imageData = context.getImageData(0, 0, scanRegion, scanRegion)
        const enhancedData = enhanceImageContrast(context, scanRegion, scanRegion)
        qrData = await scanWithWorker(enhancedData)
      } catch {
        qrData = null
      }
    }

              if (qrData && qrData !== lastValidScanRef.current) {
                const upiData = parseUPIQR(qrData)
                if (upiData) {
                  lastValidScanRef.current = qrData
                  setScannedData(upiData)
                  setAmount(upiData.am || '')
                  setIsScanning(false)
                  setIsFullscreen(false)
                  stopCamera()
                  setCurrentStep('confirm')
                  return
                } else {
                  lastValidScanRef.current = qrData
                  setInvalidQRMessage('This QR code is not a valid UPI payment QR code.')
                  setShowInvalidQRDialog(true)
                  lastValidScanRef.current = ''
                  setTimeout(() => {
                    if (isMountedRef.current && isScanning) {
                      lastValidScanRef.current = ''
                    }
                  }, 3000)
                }
              }

    animationFrameRef.current = requestAnimationFrame(processFrame)
  }, [isScanning])

  const startCamera = async (): Promise<boolean> => {
    if (isCameraStarting || !isMountedRef.current) {
      return false
    }

    try {
      setIsCameraStarting(true)
      setScanningText('Starting camera...')
      setCameraError('')
      
      stopCamera()

      const hasBarcodeDetector = await initBarcodeDetector()
      if (hasBarcodeDetector) {
        console.log('Using native BarcodeDetector API for fast scanning')
      } else {
        console.log('BarcodeDetector not available, using jsQR with Web Worker')
        initWorker()
      }

      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'environment',
        },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (!isMountedRef.current) {
        stream.getTracks().forEach(track => track.stop())
        return false
      }

      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await new Promise<void>((resolve) => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            resolve()
          } else {
            videoRef.current?.addEventListener('canplay', () => resolve(), { once: true })
            setTimeout(resolve, 1000)
          }
        })
        videoRef.current.play().catch(() => {})
      }

      console.log('Camera started successfully')
      setScanningText('Ready - point at QR code')
      setIsFullscreen(true)
      
      setTimeout(() => {
        if (isMountedRef.current && isScanning) {
          animationFrameRef.current = requestAnimationFrame(processFrame)
        }
      }, 50)

      return true
    } catch (error: any) {
      if (!isMountedRef.current) return false

      let errorMessage = 'Failed to access camera'
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.'
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.'
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.'
      }

      setCameraError(errorMessage)
      setIsScanning(false)
      return false
    } finally {
      if (isMountedRef.current) {
        setIsCameraStarting(false)
      }
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessingImage(true)
    setScanningText('Processing image...')

    try {
      const imageBitmap = await createImageBitmap(file)
      const canvas = canvasRef.current
      if (!canvas) {
        setIsProcessingImage(false)
        return
      }

      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) {
        setIsProcessingImage(false)
        return
      }

      canvas.width = imageBitmap.width
      canvas.height = imageBitmap.height
      context.drawImage(imageBitmap, 0, 0)

      let qrData: string | null = null

      if (barcodeDetectorRef.current) {
        try {
          const barcodes = await barcodeDetectorRef.current.detect(imageBitmap)
          if (barcodes.length > 0) {
            qrData = barcodes[0].rawValue
          }
        } catch {
          qrData = null
        }
      }

      if (!qrData) {
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        })
        qrData = code?.data || null
      }

      if (qrData) {
        const upiData = parseUPIQR(qrData)
        
        if (upiData) {
          setScannedData(upiData)
          setAmount(upiData.am || '')
          setIsFullscreen(false)
          stopCamera()
          setCurrentStep('confirm')
        } else {
          setInvalidQRMessage('This image does not contain a valid UPI QR code.')
          setShowInvalidQRDialog(true)
        }
      } else {
        setInvalidQRMessage('No QR code found in the selected image.')
        setShowInvalidQRDialog(true)
      }
    } catch {
      setInvalidQRMessage('Error processing the image. Please try another one.')
      setShowInvalidQRDialog(true)
    } finally {
      setIsProcessingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleManualDemo = () => {
    const mockUPIQR = `upi://pay?pa=merchant@oksbi&pn=Merchant Store&am=500&tn=Payment for goods&cu=INR`
    const parsedData = parseUPIQR(mockUPIQR)
    
    if (parsedData) {
      setScannedData(parsedData)
      setAmount(parsedData.am || '')
      setIsScanning(false)
      setIsFullscreen(false)
      stopCamera()
      setCurrentStep('confirm')
    }
  }

  useEffect(() => {
    isMountedRef.current = true

    if (isScanning && !streamRef.current) {
      startCamera()
    }

    return () => {
      isMountedRef.current = false
      stopCamera()
    }
  }, [isScanning])

  const handleProceedToPay = () => {
    if (!scannedData || !amount) return

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setInvalidQRMessage('Please enter a valid amount')
      setShowInvalidQRDialog(true)
      return
    }

    setPinInputs([])
    setCurrentStep('pin')
  }

  const handleLaunchUPIApp = (appScheme: string) => {
    const amountNum = parseFloat(amount)
    
    // Save transaction to local storage
    const transaction = {
      id: Date.now(),
      type: 'sent' as const,
      name: scannedData?.pn || 'Merchant Store',
      upiId: scannedData?.pa || 'merchant@upi',
      emoji: categoryEmojis[selectedCategory] || '💳',
      amount: amountNum,
      time: 'Just now',
      category: categoryNames[selectedCategory] || 'General',
      timestamp: new Date().toISOString(),
      status: 'recorded',
    }

    const savedTransactions = localStorage.getItem('scan_transactions')
    let transactions = savedTransactions ? JSON.parse(savedTransactions) : []
    transactions.unshift(transaction)
    localStorage.setItem('scan_transactions', JSON.stringify(transactions))

    // Construct deep link
    const pa = scannedData?.pa || '';
    const pn = scannedData?.pn || 'Merchant';
    const am = amount;
    const cu = scannedData?.cu || 'INR';
    const tn = scannedData?.tn || 'Payment';
    
    const queryParams = `pa=${pa}&pn=${encodeURIComponent(pn)}&am=${am}&cu=${cu}&tn=${encodeURIComponent(tn)}`;
    let deepLink = '';
    if (appScheme === 'gpay') {
      deepLink = `tez://upi/pay?${queryParams}`;
    } else if (appScheme === 'phonepe') {
      deepLink = `phonepe://pay?${queryParams}`;
    } else if (appScheme === 'paytm') {
      deepLink = `paytmmp://pay?${queryParams}`;
    } else {
      deepLink = `upi://pay?${queryParams}`;
    }

    // Trigger Speech synthesis for deep linking launch
    try {
      if ('speechSynthesis' in window) {
        const text = `Opening UPI app to pay ${amountNum} rupees to ${transaction.name}.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {}

    // Open UPI deep link
    window.location.href = deepLink;

    // Show success redirect screen
    setCurrentStep('success');

    setTimeout(() => {
      if (isMountedRef.current) {
        router.push('/');
      }
    }, 3500);
  }

  const handleBack = () => {
    stopCamera()
    setIsFullscreen(false)
    if (currentStep === 'scanning') {
      router.back()
    } else if (currentStep === 'confirm') {
      lastValidScanRef.current = ''
      setCurrentStep('scanning')
      setIsScanning(true)
      setScanningText('Initializing camera...')
    } else if (currentStep === 'pin') {
      setCurrentStep('confirm')
    } else {
      router.push('/')
    }
  }

  const renderScanningStep = () => (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50' : 'flex-1'} overflow-hidden bg-black flex items-center justify-center`}>
      {cameraError ? (
        <div className="flex flex-col items-center justify-center space-y-4 p-6 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
            <Camera className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-white">Camera Access Required</h2>
          <p className="text-gray-400 text-sm">{cameraError}</p>
          
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary text-black rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Allow Camera Access
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-white/20">
            <p className="text-gray-400 text-sm mb-2">Or try demo mode:</p>
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
            className="w-full h-full object-contain"
          />
          <canvas ref={canvasRef} className={debugMode ? 'absolute bottom-0 right-0 w-48 h-48 border-2 border-white z-50 bg-black' : 'hidden'} />
          
          {/*
          <div className={`absolute top-4 flex gap-2 ${isFullscreen ? 'z-50' : ''}`}>
            <button
              onClick={() => setDebugMode(!debugMode)}
              className="bg-black/50 hover:bg-black/70 text-white px-2 py-1 rounded text-xs backdrop-blur-sm border border-white/20"
            >
              Debug: {debugMode ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="bg-black/50 hover:bg-black/70 text-white px-2 py-1 rounded text-xs backdrop-blur-sm border border-white/20"
            >
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </button>
          </div>
          */}
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-72 h-72">
              <div className="absolute inset-0 border-2 border-primary rounded-lg" />
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
            id="image-upload"
          />
          
          <label
            htmlFor="image-upload"
            className={`absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm border border-white/20 transition-all cursor-pointer ${isProcessingImage ? 'opacity-50 cursor-not-allowed' : ''} ${isFullscreen ? 'z-50' : ''}`}
            aria-label="Choose image from gallery"
          >
            <Image className="w-6 h-6" />
          </label>

          {/*
          <button
            onClick={handleManualDemo}
            className={`absolute top-4 left-4 bg-primary/80 hover:bg-primary text-black px-4 py-2 rounded-lg font-semibold text-sm backdrop-blur-sm border border-white/20 transition-all ${isFullscreen ? 'z-50' : ''}`}
          >
            Test Demo
          </button>
          */}

          <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 ${isFullscreen ? 'z-50' : ''}`}>
            {streamRef.current && (
              <div className="bg-green-500/20 px-4 py-2 rounded-full border border-green-500/50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-400 text-xs font-medium">Camera Active</span>
                </div>
              </div>
            )}
            <div className="text-center text-white/70">
              <p className="text-sm font-medium">
                {isCameraStarting ? 'Starting camera...' : isProcessingImage ? 'Processing image...' : scanningText}
              </p>
              <p className="text-xs mt-1">Point camera at UPI QR code</p>
              <p className="text-xs mt-1 text-gray-400">or tap the gallery icon to choose from device</p>
            </div>
          </div>
        </>
      )}
    </div>
  )

  const handlePinKeyPress = (val: string) => {
    if (val === 'back') {
      setPinInputs(prev => prev.slice(0, -1))
    } else if (pinInputs.length < 4) {
      setPinInputs(prev => [...prev, val])
    }
  }

  const renderConfirmStep = () => (
    <div className="flex-1 bg-background text-foreground p-5 overflow-y-auto flex flex-col justify-between">
      <div className="max-w-md mx-auto w-full space-y-5">
        
        {/* Invoice Header Recipient Card */}
        {scannedData && (
          <div className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-lg text-primary shrink-0 select-none">
                {scannedData.pn ? scannedData.pn[0].toUpperCase() : 'M'}
              </div>
              <div className="min-w-0">
                <p className="font-black text-sm text-foreground truncate">{scannedData.pn || 'Merchant Store'}</p>
                <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px]">{scannedData.pa}</p>
              </div>
            </div>
            
            {/* Category tag Selector */}
            <div className="border-t border-border/80 pt-3 flex flex-col gap-1.5">
              <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground pl-1">Transaction Category</span>
              <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full select-none">
                {Object.entries(categoryNames).map(([key, name]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-full border shrink-0 transition-all ${
                      selectedCategory === key 
                        ? 'bg-primary/15 border-primary text-primary' 
                        : 'bg-muted/50 border-border text-muted-foreground hover:border-muted-foreground/30'
                    }`}
                  >
                    <span className="mr-1">{categoryEmojis[key]}</span>
                    <span>{name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Amount Input Card */}
        <div className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Enter Amount</span>
            {scannedData?.am && (
              <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Suggested: ₹{scannedData.am}</span>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl font-black text-muted-foreground font-mono">₹</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="1"
              step="1"
              className="w-full bg-muted/30 border border-border rounded-2xl py-4 pl-10 pr-4 text-foreground text-2xl font-black placeholder-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono"
            />
          </div>
          
          {/* Quick chip amounts */}
          <div className="flex gap-2">
            {[100, 500, 1000, 2000].map(val => (
              <button
                key={val}
                onClick={() => setAmount(val.toString())}
                className="flex-1 py-1.5 border border-border hover:border-primary hover:text-primary rounded-xl text-[10px] font-bold transition-all bg-card shadow-2xs"
              >
                +₹{val}
              </button>
            ))}
          </div>
        </div>



        {/* Security Warning */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-bold text-primary">UPISensei Safe Check</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed font-medium">
              You are paying in a simulated environment. The transaction will be securely logged to your dashboard stats.
            </p>
          </div>
        </div>

      </div>

      <button
        onClick={handleProceedToPay}
        disabled={!amount || parseFloat(amount) <= 0}
        className="w-full py-4 mt-6 bg-[#5f259f] hover:bg-[#4d1d82] text-white rounded-2xl font-bold text-sm shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        PROCEED TO PAY
      </button>
    </div>
  )

  const renderPinStep = () => (
    <div className="flex-1 bg-slate-950 text-white flex flex-col justify-between p-5 overflow-y-auto">
      <div className="text-center py-4 space-y-2 shrink-0">
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Select UPI App to Pay</p>
        <h3 className="text-lg font-black text-white">{scannedData?.pn || 'Merchant Store'}</h3>
        <p className="text-[10px] text-slate-400 font-mono truncate max-w-[250px] mx-auto">{scannedData?.pa}</p>
        <h2 className="text-3xl font-black text-[#a855f7] font-mono mt-1">₹{parseFloat(amount).toLocaleString()}</h2>
      </div>

      <div className="flex flex-col gap-3 my-4">
        <button
          onClick={() => handleLaunchUPIApp('phonepe')}
          className="flex items-center gap-3 w-full bg-slate-900 border border-slate-800 hover:border-[#5f259f] p-3 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center font-bold text-white shrink-0">
            PP
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-white">Pay via PhonePe</p>
            <p className="text-[10px] text-slate-400">Launch PhonePe application</p>
          </div>
        </button>

        <button
          onClick={() => handleLaunchUPIApp('gpay')}
          className="flex items-center gap-3 w-full bg-slate-900 border border-slate-800 hover:border-blue-500 p-3 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center font-bold text-white shrink-0">
            GP
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-white">Pay via Google Pay (GPay)</p>
            <p className="text-[10px] text-slate-400">Launch Google Pay application</p>
          </div>
        </button>

        <button
          onClick={() => handleLaunchUPIApp('paytm')}
          className="flex items-center gap-3 w-full bg-slate-900 border border-slate-800 hover:border-cyan-500 p-3 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center font-bold text-white shrink-0">
            PT
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-white">Pay via Paytm</p>
            <p className="text-[10px] text-slate-400">Launch Paytm application</p>
          </div>
        </button>

        <button
          onClick={() => handleLaunchUPIApp('default')}
          className="flex items-center gap-3 w-full bg-slate-900 border border-slate-800 hover:border-green-500 p-3 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center font-bold text-white shrink-0">
            UPI
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-white">Default UPI App Chooser</p>
            <p className="text-[10px] text-slate-400">Let system choose available UPI apps</p>
          </div>
        </button>
      </div>

      <div className="space-y-4 shrink-0">
        <button
          onClick={() => setCurrentStep('confirm')}
          className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl border border-slate-800 text-xs shadow-md transition-colors"
        >
          BACK TO DETAILS
        </button>
      </div>
    </div>
  )

  const renderSuccessStep = () => (
    <div className="flex-1 bg-slate-900 flex flex-col justify-center items-center p-6 text-center">
      <div className="space-y-6 max-w-sm w-full flex flex-col items-center">
        
        {/* Animated green check ring */}
        <div className="w-20 h-20 bg-green-500/10 border-2 border-green-500 rounded-full flex items-center justify-center text-green-500 animate-scale-up">
          <Check className="w-10 h-10 stroke-[3.5]" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-black text-white">Payment Successful</h2>
          <p className="text-slate-400 text-xs font-semibold">Rupees paid successfully</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 w-full space-y-1 text-center">
          <p className="text-2xl font-black text-white font-mono">₹{parseFloat(amount).toLocaleString()}</p>
          <p className="text-xs text-slate-300">
            to {scannedData?.pn || 'Merchant Store'}
          </p>
          <p className="text-[10px] text-primary/80 font-semibold tracking-wider uppercase mt-1">
            {categoryNames[selectedCategory]}
          </p>
          <p className="text-[10px] text-slate-500 pt-2 font-mono border-t border-white/5 mt-2">
            Transaction ID: UPIS-TX-98402
          </p>
        </div>
        
        <p className="text-xs text-slate-400 font-medium">Redirecting you to dashboard...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center gap-4 p-4 bg-[#5f259f] text-white shrink-0 shadow-sm relative z-30">
        <button
          onClick={handleBack}
          className="text-white hover:text-white/80 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-sm font-black uppercase tracking-wider">
            {currentStep === 'scanning' && 'Scan QR Code'}
            {currentStep === 'confirm' && 'Confirm Details'}
            {currentStep === 'pin' && 'Enter UPI PIN'}
            {currentStep === 'success' && 'Payment Status'}
          </h1>
          <p className="text-[10px] text-white/70 font-medium">
            {currentStep === 'scanning' && 'Point camera at any UPI QR code'}
            {currentStep === 'confirm' && 'Review and tag before paying'}
            {currentStep === 'pin' && 'Secure connection with SBI'}
            {currentStep === 'success' && 'Transfer completed'}
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {currentStep === 'scanning' && renderScanningStep()}
        {currentStep === 'confirm' && renderConfirmStep()}
        {currentStep === 'pin' && renderPinStep()}
        {currentStep === 'success' && renderSuccessStep()}
      </div>

      <Dialog open={showInvalidQRDialog} onOpenChange={setShowInvalidQRDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white rounded-3xl w-[90%] sm:max-w-md">
          <DialogHeader>
            <div className="bg-red-500/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/10">
              <Image className="w-6 h-6 text-red-500" />
            </div>
            <DialogTitle className="text-center font-black">Invalid QR Code</DialogTitle>
            <DialogDescription className="text-center text-slate-400 text-xs">
              {invalidQRMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setShowInvalidQRDialog(false)}
              className="w-full bg-[#5f259f] hover:bg-[#4d1d82] text-white font-bold rounded-xl py-3 border-none shadow-sm"
            >
              Try Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
