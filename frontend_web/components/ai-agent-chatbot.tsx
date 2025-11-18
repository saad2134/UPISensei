"use client"

import { useState, useRef, useEffect } from 'react'
import { Send, Upload, Lightbulb, Loader } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
}

export default function AIAgentChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Hey! I\'m your UPISensei AI Guide. Upload your UPI transaction PDF and I\'ll analyze your spending patterns, find savings opportunities, and give you personalized financial advice.',
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'user',
          content: `Uploaded: ${file.name}`,
          timestamp: new Date(),
        },
      ])

      // Simulate AI analysis
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            type: 'bot',
            content: `Great! I've analyzed your UPI transactions from ${file.name}. Here's what I found:\n\n📊 **Key Insights:**\n• Total spending: ₹12,900\n• Average daily spending: ₹387\n• Highest category: Food (₹4,500)\n• Recurring payments: 3\n\n💰 **Savings Opportunities:**\n• Cancel Netflix subscription (₹249/month): ₹2,988/year\n• Reduce daily coffee (₹50/day): ₹1,500/month\n• Auto-pay utilities: Save on late fees\n\n🎯 **Recommendations:**\n1. Set spending limit on food to ₹3,500/month\n2. Create emergency fund with ₹5,000\n3. Track subscriptions regularly\n\nWhat would you like to explore further?`,
            timestamp: new Date(),
          },
        ])
        setIsLoading(false)
      }, 1500)
    } else {
      alert('Please upload a valid PDF file')
    }
  }

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const botResponses = [
        'Based on your patterns, I notice you spend most on weekends. Try setting daily budgets to control impulse purchases.',
        'Your electricity bills are slightly high. Consider switching off appliances and using LED lights to save ₹200-300/month.',
        'You have 3 recurring subscriptions totaling ₹749/month. Would you like to optimize them?',
        'Great question! Here\'s my analysis: Your spending trend shows a 15% increase this month compared to last month.',
        'I recommend creating separate wallets for essential vs discretionary spending to improve control.',
      ]

      const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)]

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: randomResponse,
          timestamp: new Date(),
        },
      ])
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="space-y-4 mt-6">
      {/* Chat Container */}
      <Card className="p-4 h-96 bg-card border border-border rounded-xl flex flex-col animate-slide-in">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg text-sm leading-relaxed ${
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-muted text-foreground rounded-bl-none border border-border'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted text-foreground px-4 py-2 rounded-lg text-sm flex items-center gap-2 border border-border">
                <Loader className="w-4 h-4 animate-spin" />
                Analyzing...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="space-y-2">
          {uploadedFile && (
            <div className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
              Loaded: {uploadedFile.name}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask me anything about your spending..."
              className="flex-1 px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="px-3 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* PDF Upload Section */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-dashed border-primary/30 rounded-xl hover:border-primary/60 transition-colors cursor-pointer animate-slide-in">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full text-center"
        >
          <Upload className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="font-bold text-foreground text-sm">Upload UPI Transaction PDF</p>
          <p className="text-xs text-muted-foreground mt-1">
            Drop your PDF here or click to browse
          </p>
          <p className="text-xs text-muted-foreground mt-2 italic">
            Our AI will analyze spending patterns and provide personalized insights
          </p>
        </button>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 bg-card border border-border rounded-lg hover:shadow-md transition-all animate-slide-in">
          <Lightbulb className="w-5 h-5 text-primary mb-2" strokeWidth={1.5} />
          <p className="font-bold text-xs text-foreground">Smart Analysis</p>
          <p className="text-xs text-muted-foreground mt-1">
            Get AI-powered spending insights
          </p>
        </Card>
        <Card className="p-4 bg-card border border-border rounded-lg hover:shadow-md transition-all animate-slide-in">
          <Upload className="w-5 h-5 text-secondary mb-2" />
          <p className="font-bold text-xs text-foreground">Easy Upload</p>
          <p className="text-xs text-muted-foreground mt-1">
            Just upload your UPI PDF
          </p>
        </Card>
      </div>
    </div>
  )
}
