import { Lightbulb, Bell } from 'lucide-react'

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img
            src="/icon.svg"
            alt="Icon"
            className="w-10 h-10 mx-auto"
          />


          <div>
            <h1 className="font-black text-lg tracking-tight text-foreground">UPISensei</h1>
            <p className="text-xs text-muted-foreground">Financial Wisdom</p>
          </div>
        </div>

        {/* Notifications */}
        <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
        </button>
      </div>
    </header>
  )
}
