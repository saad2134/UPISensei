"use client"

import { useState } from 'react'
import { Lightbulb, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import AIChatbot from './ai-chatbot'
import { cn } from '@/lib/utils'

export default function FloatingChatButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'fixed bottom-28 right-6 z-40',
          'w-16 h-16 rounded-full',
          'bg-white shadow-lg hover:shadow-xl',
          'flex items-center justify-center',
          'transition-all duration-300 hover:scale-110',
          'animate-bounce-subtle',
          'border border-gray-200'
        )}
        title="Chat with UPISensei"
      >
        <Lightbulb className="w-8 h-8 text-primary" strokeWidth={1.5} />
      </button>

      {/* Chat Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="border-b border-border/50 bg-gradient-to-r from-primary/10 to-accent/10 p-4">
            <SheetTitle className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
                <Lightbulb className="w-6 h-6 text-primary" strokeWidth={1.5} />
              </div>
              <span>UPISensei Agent
                <p className="text-xs text-muted-foreground">Your financial wisdom guide!</p></span>
            </SheetTitle>
          </SheetHeader>

          {/* Chatbot Component */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <AIChatbot />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
