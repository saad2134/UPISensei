"use client"

import { useState, useRef, useEffect } from 'react'
import { Send, Upload, Loader2, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: string | Date
}

interface UploadedFile {
  name: string
  type: string
  size: number
  id: string
  processing?: boolean
}

// Helper function to safely format timestamp
const formatTimestamp = (timestamp: string | Date): string => {
  try {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return '--:--';
  }
}

const MarkdownContent = ({ content }: { content: string }) => {
  return (
    <div className="markdown-readable prose prose-sm max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default function AIChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hey! I\'m your UPISensei AI Assistant. I can help analyze your spending patterns and answer questions about your finances. You can also upload PDF statements or CSV files for analysis.',
      timestamp: new Date().toISOString(),
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
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const fileIds: string[] = [];

      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          if (!file.processing) {
            fileIds.push(file.id);
          }
        }
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          fileIds: fileIds.length > 0 ? fileIds : undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const assistantMessageData = await response.json();

      const assistantMessage: Message = {
        ...assistantMessageData,
        timestamp: assistantMessageData.timestamp || new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      if (uploadedFiles.every(file => !file.processing)) {
        setUploadedFiles([]);
      }
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileError('')

    if (!file.name.match(/\.(pdf|csv)$/i)) {
      setFileError('Please upload only PDF or CSV files')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError('File size must be less than 5MB')
      return
    }

    const newFile: UploadedFile = {
      name: file.name,
      type: file.type,
      size: file.size,
      id: `local-${Date.now()}`,
      processing: true
    }

    setUploadedFiles(prev => [...prev, newFile])

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadedFiles(prev =>
        prev.map(f =>
          f.id === newFile.id ? { ...f, id: result.fileId, processing: false } : f
        )
      );

      if (uploadedFiles.length === 0) {
        setInput(`I've uploaded ${file.name}. Can you analyze my transactions?`);
      }

    } catch (error: any) {
      setFileError(error.message || 'Failed to upload file');
      setUploadedFiles(prev => prev.filter(f => f.id !== newFile.id));
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id))
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-card/30">
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
              {message.type === 'assistant' ? (
                <MarkdownContent content={message.content} />
              ) : (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              )}
              <span className="text-xs opacity-70 mt-1 block">
                {formatTimestamp(message.timestamp)}
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
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                    {file.processing && ' • Processing...'}
                  </p>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="p-1 hover:bg-background rounded transition-colors"
                  disabled={file.processing}
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
              accept=".pdf,.csv"
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
          Upload bank statements or transaction CSVs for analysis
        </p>
      </div>
    </div>
  )
}