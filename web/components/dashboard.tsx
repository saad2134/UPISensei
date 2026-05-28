"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  User as UserIcon, Scan, Bell, HelpCircle, MapPin, ChevronDown, Search,
  Smartphone, Tv, BarChart3, MessageSquare, History, Sparkles, Lock,
  Shield, Check, Wallet, ChevronRight, Moon, Sun, Monitor, LogOut,
  Trophy, Zap, RefreshCw, X, CreditCard, ArrowRight, Award, Flame, Target
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import SpendingStatsCard from './spending-stats-card'
import WeeklySpendingChart from './weekly-spending-chart'
import TransactionHistory from './transaction-history'
import AIChatbot from './ai-chatbot'
import GameificationSection from './gamification-section'
import GenZJoke from './gen-z-joke'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('home')
  const { user, logout, isLoggedIn } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Drawer & Dialog states
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false)
  const [showCheckBalance, setShowCheckBalance] = useState(false)
  const [pinInputs, setPinInputs] = useState<string[]>([])
  const [balanceChecked, setBalanceChecked] = useState(false)
  const [checkingBalanceLoading, setCheckingBalanceLoading] = useState(false)

  // Transfer Simulation states
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferType, setTransferType] = useState<'mobile' | 'upi' | 'recharge'>('mobile')
  const [transferTarget, setTransferTarget] = useState('')
  const [transferName, setTransferName] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [selectedBank, setSelectedBank] = useState('State Bank of India')
  const [isProcessingTransfer, setIsProcessingTransfer] = useState(false)
  const [transferStep, setTransferStep] = useState<'details' | 'pin' | 'success'>('details')

  // Banner Carousel Index
  const [carouselIndex, setCarouselIndex] = useState(0)
  const banners = [
    { title: "AI Spending Insights", desc: "UPISensei monitors your habits to save up to 25%", bg: "from-[#5f259f] to-[#350f5c]", icon: "✨" },
    { title: "Weekly Chai Challenge", desc: "Keep your chai budget under ₹200 this week!", bg: "from-[#5f259f] to-[#350f5c]", icon: "☕" },
    { title: "Upload PDF Statement", desc: "Gain total overview by importing bank sheets directly", bg: "from-[#5f259f] to-[#350f5c]", icon: "📄" }
  ]

  useEffect(() => {
    setMounted(true)
    // Auto cycle banners
    const timer = setInterval(() => {
      setCarouselIndex(prev => (prev + 1) % banners.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  // Check login
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login')
    }
  }, [isLoggedIn, router])

  if (!isLoggedIn || !user) return null

  // Handle PIN Input
  const handlePinKeyPress = (val: string) => {
    if (val === 'back') {
      setPinInputs(prev => prev.slice(0, -1))
    } else if (pinInputs.length < 4) {
      setPinInputs(prev => [...prev, val])
    }
  }

  // Handle Balance Submit
  const handleBalanceSubmit = () => {
    if (pinInputs.length < 4) return
    setCheckingBalanceLoading(true)
    setTimeout(() => {
      setCheckingBalanceLoading(false)
      setBalanceChecked(true)
      // Play a subtle ding sound or speak if supported
      try {
        if ('speechSynthesis' in window) {
          const u = new SpeechSynthesisUtterance("Account balance verified")
          u.volume = 0.5; u.rate = 1.1; window.speechSynthesis.speak(u)
        }
      } catch (e) { }
    }, 1500)
  }

  // Handle simulated transfer payment by launching specific UPI app via deep linking
  const handleLaunchUPIApp = (appScheme: string) => {
    // Save transaction to local storage
    const amountNum = parseFloat(transferAmount) || 0
    const upiId = transferType === 'recharge' ? 'recharge@upi' : transferTarget.includes('@') ? transferTarget : `${transferTarget}@upi`
    const transaction = {
      id: Date.now(),
      type: transferType === 'recharge' ? 'sent' : 'sent',
      name: transferType === 'recharge' ? `Mobile Recharge (${transferTarget})` : transferName || transferTarget,
      upiId,
      emoji: transferType === 'recharge' ? '📱' : '💸',
      amount: amountNum,
      time: 'Just now',
      category: transferType === 'recharge' ? 'Bills & Utilities' : 'Transfers',
      timestamp: new Date().toISOString(),
      status: 'recorded'
    }

    const savedTransactions = localStorage.getItem('scan_transactions')
    let txs = savedTransactions ? JSON.parse(savedTransactions) : []
    txs.unshift(transaction)
    localStorage.setItem('scan_transactions', JSON.stringify(txs))

    // Construct deep link URL
    const queryParams = `pa=${upiId}&pn=${encodeURIComponent(transaction.name)}&am=${amountNum}&cu=INR&tn=${encodeURIComponent('UPISensei Transfer')}`
    let deepLink = ''
    if (appScheme === 'gpay') {
      deepLink = `tez://upi/pay?${queryParams}`
    } else if (appScheme === 'phonepe') {
      deepLink = `phonepe://pay?${queryParams}`
    } else if (appScheme === 'paytm') {
      deepLink = `paytmmp://pay?${queryParams}`
    } else {
      deepLink = `upi://pay?${queryParams}`
    }

    // Speech chime simulation
    try {
      if ('speechSynthesis' in window) {
        const speechText = `Opening UPI App to pay rupees ${amountNum} to ${transaction.name}`
        const utterance = new SpeechSynthesisUtterance(speechText)
        utterance.rate = 1.05
        window.speechSynthesis.speak(utterance)
      }
    } catch (err) { }

    // Redirect to Android/iOS UPI application chooser / specific app
    window.location.href = deepLink

    setTransferStep('success')
  }

  const resetTransferState = () => {
    setShowTransferModal(false)
    setTransferTarget('')
    setTransferName('')
    setTransferAmount('')
    setTransferStep('details')
    setPinInputs([])
  }

  const resetBalanceState = () => {
    setShowCheckBalance(false)
    setBalanceChecked(false)
    setPinInputs([])
  }

  return (
    <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden bg-background text-foreground">

      {/* PhonePe Purple Header */}
      <header className="bg-transparent px-4 py-3 flex items-center justify-between shrink-0 relative z-30">
        <button
          onClick={() => setShowSettingsDrawer(true)}
          className="w-10 h-10 rounded-md bg-primary/10 dark:bg-white/10 hover:bg-primary/20 dark:hover:bg-white/20 border border-primary/20 dark:border-white/20 flex items-center justify-center font-bold text-sm shrink-0 transition-transform active:scale-95 text-primary dark:text-white"
        >
          {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : <UserIcon className="w-5 h-5" />}
        </button>

        <button
          onClick={() => {
            setActiveTab('chat');
            setTimeout(() => {
              alert("Use the input below to ask the AI Chat about your transactions, or upload bank statement files (PDF/CSV) directly.");
            }, 400);
          }}
          className="w-10 h-10 rounded-md bg-primary/10 dark:bg-white/10 hover:bg-primary/20 dark:hover:bg-white/20 border border-primary/20 dark:border-white/20 flex items-center justify-center font-bold text-lg shrink-0 transition-transform active:scale-95 text-primary dark:text-white"
          title="AI Financial Guide Help"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </header>

      {/* Main App Screens Container */}
      <main className={`flex-1 min-h-0 ${activeTab === 'chat' ? 'flex flex-col pb-[64px]' : 'overflow-y-auto pb-20'}`}>

        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <div className="p-4 space-y-5 animate-slide-in">

            {/* Banner Slideshow Carousel */}
            <div className="relative p-[1.5px] rounded-2xl overflow-hidden shadow-md bg-slate-900/10 dark:bg-slate-900/50">
              {/* Moving Border Effect */}
              <div className="absolute inset-[-1000%] bg-[conic-gradient(from_0deg,transparent_20%,#ffd700_40%,#c084fc_60%,transparent_80%)] animate-[spin_5s_linear_infinite]" />
              
              {/* Inner Carousel Content */}
              <div className="relative rounded-[15px] overflow-hidden bg-[#350f5c]">
                <div className={`bg-gradient-to-r ${banners[carouselIndex].bg} text-white p-5 flex items-center justify-between h-[120px] transition-all duration-500`}>
                  <div className="space-y-1.5 max-w-[70%]">
                    <span className="text-[10px] uppercase font-bold text-accent tracking-wider bg-white/10 px-2 py-0.5 rounded-full inline-block">
                      UPISensei Tip
                    </span>
                    <h4 className="text-sm font-black leading-tight">{banners[carouselIndex].title}</h4>
                    <p className="text-[11px] text-white/80 font-medium leading-normal">{banners[carouselIndex].desc}</p>
                  </div>
                  <div className="text-4xl pr-2 select-none animate-bounce-subtle">
                    {banners[carouselIndex].icon}
                  </div>
                </div>

                {/* Dots */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {banners.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCarouselIndex(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${carouselIndex === i ? 'bg-white w-3' : 'bg-white/40'}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Transfer Money Grid Section */}
            <div className="bg-card border border-border/70 rounded-2xl p-4 shadow-sm space-y-3.5">
              <h3 className="text-xs font-black uppercase text-muted-foreground tracking-wider">Transfer Money</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setTransferType('mobile');
                    setTransferTarget('');
                    setTransferName('');
                    setTransferAmount('');
                    setTransferStep('details');
                    setShowTransferModal(true);
                  }}
                  className="flex flex-col items-center text-center gap-2 group"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm border border-primary/10 group-hover:scale-105 active:scale-95 transition-transform duration-200">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold leading-tight">To Mobile Number</span>
                </button>

                <button
                  onClick={() => {
                    setTransferType('upi');
                    setTransferTarget('');
                    setTransferName('');
                    setTransferAmount('');
                    setTransferStep('details');
                    setShowTransferModal(true);
                  }}
                  className="flex flex-col items-center text-center gap-2 group"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm border border-primary/10 group-hover:scale-105 active:scale-95 transition-transform duration-200">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold leading-tight">To Bank / UPI ID</span>
                </button>
              </div>
            </div>





            {/* Financial Insights Card */}
            <div className="bg-card border border-border/70 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase text-muted-foreground tracking-wider">Financial Insights</h3>
                <button
                  onClick={() => setActiveTab('analysis')}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  View Analytics
                </button>
              </div>
              <GenZJoke />
            </div>

            {/* Recent Quick Transactions History */}
            <div className="bg-card border border-border/70 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase text-muted-foreground tracking-wider">Recent Transactions</h3>
                <button
                  onClick={() => setActiveTab('history')}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  View All
                </button>
              </div>
              <TransactionHistory />
            </div>

          </div>
        )}

        {/* TAB 2: ANALYSIS */}
        {activeTab === 'analysis' && (
          <div className="p-4 space-y-5 animate-slide-in">
            <h2 className="text-lg font-black text-foreground">Spending Analytics</h2>

            {/* Account Overview */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider pl-1">Account Overview</span>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-card border border-border/60 p-3 rounded-2xl">
                  <p className="text-xs text-muted-foreground font-bold">Total Spent</p>
                  <p className="text-base font-black text-primary mt-1">₹3,450</p>
                </div>
                <div className="bg-card border border-border/60 p-3 rounded-2xl">
                  <p className="text-xs text-muted-foreground font-bold">Level XP</p>
                  <p className="text-base font-black text-secondary-foreground mt-1">12 Pro</p>
                </div>
              </div>
            </div>

            <SpendingStatsCard />
            <WeeklySpendingChart />
            <GameificationSection />
          </div>
        )}

        {/* TAB 3: CHATBOT */}
        {activeTab === 'chat' && (
          <div className="flex-1 min-h-0 flex flex-col animate-slide-in">
            <AIChatbot />
          </div>
        )}

        {/* TAB 4: TRANSACTION HISTORY */}
        {activeTab === 'history' && (
          <div className="p-4 space-y-4 animate-slide-in">
            <h2 className="text-lg font-black text-foreground">Transaction History</h2>
            <TransactionHistory showFilters={true} />
          </div>
        )}

      </main>

      {/* Bottom Sticky Tab Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border backdrop-blur-md z-45 w-full overflow-visible">
        <div className="max-w-md mx-auto flex items-center justify-around py-1 overflow-visible">

          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-0.5 text-[9px] font-bold transition-all py-0.5 px-3 ${activeTab === 'home' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <Wallet className="w-5.5 h-5.5" />
            <span>Home</span>
          </button>

          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex flex-col items-center gap-0.5 text-[9px] font-bold transition-all py-0.5 px-3 ${activeTab === 'analysis' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <BarChart3 className="w-5.5 h-5.5" />
            <span>Analytics</span>
          </button>

          <button
            onClick={() => router.push('/scan-payment')}
            className="flex flex-col items-center justify-center -translate-y-3.5 relative group shrink-0"
            aria-label="Scan QR code"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-primary via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95">
              <Scan className="w-7 h-7 text-white" />
            </div>
            <span className="text-[9px] font-extrabold mt-0.5 text-primary">Scan</span>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-14 rounded-2xl border-2 border-primary opacity-0 group-hover:opacity-100 animate-pulse" />
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex flex-col items-center gap-0.5 text-[9px] font-bold transition-all py-0.5 px-3 ${activeTab === 'chat' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <MessageSquare className="w-5.5 h-5.5" />
            <span>AI Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center gap-0.5 text-[9px] font-bold transition-all py-0.5 px-3 ${activeTab === 'history' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <History className="w-5.5 h-5.5" />
            <span>History</span>
          </button>
        </div>
      </nav>

      <Sheet open={showSettingsDrawer} onOpenChange={setShowSettingsDrawer}>
        <SheetContent side="left" className="w-[85%] sm:max-w-xs p-0 flex flex-col bg-background border-r border-border">
          <SheetTitle className="sr-only">Profile Settings Menu</SheetTitle>
          <SheetDescription className="sr-only">Access and configure your UPISensei profile and appearance options</SheetDescription>

          {/* Header */}
          <div className="bg-[#5f259f] text-white p-3.5 pt-6 space-y-2.5 relative overflow-hidden shrink-0">
            <div className="absolute top-[-10%] right-[-10%] w-20 h-20 bg-white/10 rounded-full blur-md" />

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 border border-white/20 flex items-center justify-center font-bold text-sm text-white animate-pulse-glow">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-sm truncate">{user.name}</h3>
                <p className="text-[9px] text-white/70 font-medium truncate font-mono">{user.phone}</p>
              </div>
            </div>

            <div className="bg-white/15 rounded-lg px-2.5 py-1 border border-white/10 text-[10px] font-semibold flex items-center gap-1.5 w-fit">
              <Shield className="w-3.5 h-3.5 text-accent animate-bounce-subtle" />
              <span>KYC Verified Wallet</span>
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">

            {/* Account Settings */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider pl-1">Personal Details</span>
              <div className="bg-card border border-border/60 rounded-2xl p-3 space-y-3 text-xs">
                <div>
                  <p className="text-muted-foreground font-semibold">Registered Email</p>
                  <p className="font-bold text-foreground truncate">{user.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold">User Unique ID</p>
                  <p className="font-mono text-[10px] text-foreground font-bold select-all">{user.id}</p>
                </div>
              </div>
            </div>

            {/* Appearance Settings */}
            <div className="space-y-3">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider pl-1">Appearance Settings</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setTheme('light')}
                  className={`py-2 px-1 text-center rounded-xl border flex flex-col items-center gap-1.5 transition-all text-[10px] font-bold ${mounted && theme === 'light' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card'
                    }`}
                >
                  <Sun className="w-4 h-4" />
                  <span>Light</span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`py-2 px-1 text-center rounded-xl border flex flex-col items-center gap-1.5 transition-all text-[10px] font-bold ${mounted && theme === 'dark' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card'
                    }`}
                >
                  <Moon className="w-4 h-4" />
                  <span>Dark</span>
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`py-2 px-1 text-center rounded-xl border flex flex-col items-center gap-1.5 transition-all text-[10px] font-bold ${mounted && theme === 'system' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card'
                    }`}
                >
                  <Monitor className="w-4 h-4" />
                  <span>System</span>
                </button>
              </div>
            </div>

          </div>

          {/* Footer logout */}
          <div className="p-4 border-t border-border bg-card shrink-0">
            <Button
              onClick={() => {
                logout()
                router.push('/login')
              }}
              className="w-full py-3 bg-red-800 hover:bg-red-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2 border-none shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>SECURE LOGOUT</span>
            </Button>
          </div>

        </SheetContent>
      </Sheet>

      {/* DIALOG 1: CHECK BALANCE (UPI PIN KEYPAD) */}
      <Dialog open={showCheckBalance} onOpenChange={setShowCheckBalance}>
        <DialogContent className="w-[90%] sm:max-w-md bg-slate-950 text-white border-slate-900 rounded-3xl p-5 shadow-2xl overflow-hidden flex flex-col gap-6">
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg font-black tracking-tight text-center text-white">UPISensei Secure PIN</DialogTitle>
            <DialogDescription className="text-center text-slate-400 text-xs">
              State Bank of India • Account ending in XXXX
            </DialogDescription>
          </DialogHeader>

          {/* Center screen */}
          <div className="flex-1 flex flex-col items-center justify-center py-4 space-y-4">

            {checkingBalanceLoading ? (
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                <span className="text-xs text-slate-400 font-bold">Connecting to Bank Securely...</span>
              </div>
            ) : balanceChecked ? (
              <div className="text-center bg-white/5 border border-white/10 rounded-2xl p-6 w-full animate-pulse-glow">
                <p className="text-xs text-slate-400 font-bold">Available Bank Balance</p>
                <p className="text-4xl font-black text-green-400 mt-1">₹12,420</p>
                <p className="text-[10px] text-slate-500 mt-2 font-mono">Reference ID: SBI-UPIS-8394</p>
                <Button
                  onClick={resetBalanceState}
                  className="mt-4 bg-[#5f259f] hover:bg-[#4d1d82] text-white font-bold text-xs rounded-xl px-6 py-2 border-none shadow-md"
                >
                  OK, DONE
                </Button>
              </div>
            ) : (
              <div className="space-y-4 w-full flex flex-col items-center">
                <p className="text-xs font-semibold text-slate-300">ENTER 4-DIGIT UPI PIN</p>
                <div className="flex justify-center gap-4">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className={`w-4 h-4 rounded-full border-2 transition-all ${pinInputs.length > idx ? 'bg-primary border-primary scale-110' : 'border-slate-700 bg-transparent'
                        }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Security details bottom alert */}
          {!checkingBalanceLoading && !balanceChecked && (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-[10px] text-slate-400 font-medium">
              <Lock className="w-4 h-4 text-green-400 shrink-0" />
              <span>PIN is secured device-side. UPISensei never stores bank codes.</span>
            </div>
          )}

          {/* Keypad */}
          {!checkingBalanceLoading && !balanceChecked && (
            <div className="grid grid-cols-3 gap-y-3 gap-x-6 text-center select-none pt-2 shrink-0 border-t border-slate-900">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(val => (
                <button
                  key={val}
                  onClick={() => handlePinKeyPress(val)}
                  className="py-2.5 text-lg font-black rounded-xl hover:bg-white/10 active:scale-90 transition-all font-mono"
                >
                  {val}
                </button>
              ))}
              <button
                onClick={resetBalanceState}
                className="py-2.5 text-xs text-red-400 font-bold hover:bg-red-500/10 rounded-xl transition-all"
              >
                CANCEL
              </button>
              <button
                onClick={() => handlePinKeyPress('0')}
                className="py-2.5 text-lg font-black rounded-xl hover:bg-white/10 active:scale-90 transition-all font-mono"
              >
                0
              </button>
              <button
                onClick={pinInputs.length === 4 ? handleBalanceSubmit : () => handlePinKeyPress('back')}
                className={`py-2.5 rounded-xl transition-all flex items-center justify-center ${pinInputs.length === 4
                    ? 'bg-green-500 hover:bg-green-600 text-slate-950 font-black'
                    : 'text-slate-400 font-black hover:bg-white/10'
                  }`}
              >
                {pinInputs.length === 4 ? <Check className="w-5 h-5 stroke-[3]" /> : '⌫'}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: SIMULATED TRANSFER MODAL (To Mobile, Bank/UPI, Recharge) */}
      <Dialog open={showTransferModal} onOpenChange={(open) => !open && resetTransferState()}>
        <DialogContent className="w-[90%] sm:max-w-md bg-slate-950 text-white border-slate-900 rounded-3xl p-5 shadow-2xl overflow-hidden flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-center text-white">
              {transferType === 'mobile' && 'Transfer to Mobile Number'}
              {transferType === 'upi' && 'Transfer to Bank/UPI ID'}
              {transferType === 'recharge' && 'Simulate Mobile Recharge'}
            </DialogTitle>
            <DialogDescription className="text-center text-slate-400 text-xs">
              Simulated sandbox payment environment
            </DialogDescription>
          </DialogHeader>

          {/* STEP 1: ENTER DETAILS */}
          {transferStep === 'details' && (
            <div className="space-y-4 py-2 flex-1 overflow-y-auto">

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {transferType === 'mobile' && 'Recipient Phone Number'}
                  {transferType === 'upi' && 'Recipient UPI ID / VPA'}
                  {transferType === 'recharge' && 'Biller Phone / Subscriber ID'}
                </label>
                <input
                  type="text"
                  value={transferTarget}
                  onChange={(e) => setTransferTarget(e.target.value)}
                  placeholder={
                    transferType === 'mobile' ? 'e.g. +91 9876543210' :
                      transferType === 'upi' ? 'e.g. merchant@oksbi' : 'e.g. Airtel 9876543210'
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-all font-semibold font-mono"
                />
              </div>

              {transferType !== 'recharge' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Recipient Display Name</label>
                  <input
                    type="text"
                    value={transferName}
                    onChange={(e) => setTransferName(e.target.value)}
                    placeholder="e.g. Swiggy Food Store"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-all font-semibold"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Amount (INR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg font-mono">₹</span>
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-8 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-all font-bold font-mono"
                  />
                </div>
              </div>



              <Button
                onClick={() => setTransferStep('pin')}
                disabled={!transferTarget || !transferAmount || parseFloat(transferAmount) <= 0}
                className="w-full py-4 mt-2 bg-[#5f259f] hover:bg-[#4d1d82] text-white font-bold rounded-2xl shadow-lg border-none"
              >
                PROCEED TO PAY
              </Button>
            </div>
          )}

          {/* STEP 2: SELECT UPI APP FOR DEEP LINKING */}
          {transferStep === 'pin' && (
            <div className="space-y-5 py-2">
              <div className="text-center space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Select UPI App to Pay</p>
                <p className="text-base font-black text-white">{transferType === 'recharge' ? `Mobile Recharge (${transferTarget})` : transferName || transferTarget}</p>
                <p className="text-2xl font-black text-[#a855f7] font-mono mt-0.5">₹{parseFloat(transferAmount).toLocaleString()}</p>
              </div>

              <div className="flex flex-col gap-3">
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

              <div className="flex gap-2.5 pt-2">
                <Button
                  onClick={() => setTransferStep('details')}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl border border-slate-800 text-xs shadow-md"
                >
                  BACK TO DETAILS
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS CONFIRMATION */}
          {transferStep === 'success' && (
            <div className="text-center py-6 space-y-6 flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-green-500/10 border-2 border-green-500 rounded-full flex items-center justify-center text-green-500 scale-up-animation">
                <Check className="w-10 h-10 stroke-[3.5]" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-white">Payment Successful</h3>
                <p className="text-slate-400 text-xs font-semibold">Funds transferred successfully</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 w-full text-center space-y-1">
                <p className="text-lg font-black text-white font-mono">₹{parseFloat(transferAmount).toLocaleString()}</p>
                <p className="text-[11px] text-slate-300">
                  to {transferType === 'recharge' ? `Mobile Recharge (${transferTarget})` : transferName || transferTarget}
                </p>
                <p className="text-[10px] text-slate-500 pt-1 font-mono">Transaction ID: UPI-SBI-98402</p>
              </div>

              <Button
                onClick={resetTransferState}
                className="w-full py-3.5 bg-green-500 hover:bg-green-600 text-slate-950 font-bold rounded-2xl border-none"
              >
                CONTINUE
              </Button>
            </div>
          )}

        </DialogContent>
      </Dialog>

    </div>
  )
}
