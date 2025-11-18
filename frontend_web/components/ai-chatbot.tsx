"use client"

import { useState, useRef, useEffect } from 'react'
import { Send, Upload, Loader2, FileText, X, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface UploadedFile {
  name: string
  type: string
  size: number
  id: string
}

export default function AIChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hey! I\'m your UPISensei AI Assistant. You can chat about your finances, and I can help analyze transaction PDFs. What would you like to know?',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [fileError, setFileError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() && uploadedFiles.length === 0) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input || (uploadedFiles.length > 0 ? `Analyzing ${uploadedFiles.length} file(s)...` : ''),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: generateResponse(input, uploadedFiles),
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsLoading(false)
      setUploadedFiles([])
    }, 1500)
  }

  const generateResponse = (userInput: string, files: UploadedFile[]): string => {
    if (files.length > 0) {
      return `I've analyzed your uploaded file(s): ${files.map(f => f.name).join(', ')}. Based on the transaction data, I can see your spending patterns. What specific insights would you like? I can help with:\n\n• Budget optimization suggestions\n• Category-wise spending breakdown\n• Unusual spending patterns\n• Monthly vs. yearly comparisons`
    }
    
    if (userInput.toLowerCase().includes('budget')) {
      return "Based on your typical spending, I'd recommend allocating:\n• Food & Dining: 25%\n• Entertainment: 15%\n• Shopping: 20%\n• Savings: 40%\n\nWould you like me to help you track specific categories?"
    }
    
    if (userInput.toLowerCase().includes('spending')) {
      return "Your recent spending shows a mix of daily essentials and entertainment. You're doing great on savings! Want me to identify areas where you could cut back?"
    }

    return "That's a great question! To give you personalized advice, could you share more details? Or you can upload your transaction PDF and I'll analyze your spending patterns for you."
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileError('')

    // Validate file type
    if (!file.type.includes('pdf') && !file.type.includes('spreadsheet')) {
      setFileError('Please upload a PDF or spreadsheet file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File size must be less than 5MB')
      return
    }

    const newFile: UploadedFile = {
      name: file.name,
      type: file.type,
      size: file.size,
      id: Date.now().toString(),
    }

    setUploadedFiles(prev => [...prev, newFile])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id))
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-card/30">
      <div className="border-b border-border/50 bg-card/80 p-4 flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
          <Lightbulb className="w-6 h-6 text-primary" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="font-semibold text-foreground">UPISensei</h2>
          <p className="text-xs text-muted-foreground">Your financial wisdom guide</p>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3 animate-slide-in',
              message.type === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-xs lg:max-w-md px-4 py-3 rounded-lg',
                message.type === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-none'
                  : 'bg-muted text-foreground rounded-bl-none'
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="bg-muted text-foreground px-4 py-3 rounded-lg rounded-bl-none flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* File Uploads Preview */}
      {uploadedFiles.length > 0 && (
        <div className="px-4 py-3 border-t border-border/50 bg-card/50">
          <div className="space-y-2">
            {uploadedFiles.map(file => (
              <div key={file.id} className="flex items-center gap-2 bg-muted/50 p-2 rounded">
                <FileText className="w-4 h-4 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="p-1 hover:bg-background rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {fileError && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-xs border-t border-destructive/20">
          {fileError}
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-border/50 bg-card/50 p-4 space-y-3">
        <form onSubmit={handleSendMessage} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ask about your spending..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg bg-input border border-border text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || (!input.trim() && uploadedFiles.length === 0)}
              className="rounded-lg"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>

          {/* File Upload Button */}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.xlsx,.xls,.csv"
              onChange={handleFileUpload}
              disabled={isLoading}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="flex-1 gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload PDF/CSV
            </Button>
          </div>
        </form>
        <p className="text-xs text-muted-foreground text-center">
          Upload transaction PDFs to analyze your spending
        </p>
      </div>
    </div>
  )
}
