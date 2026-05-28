"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const success = await login(email, password)

    if (success) {
      router.push('/')
    } else {
      setError('Invalid email or password. Demo: demo@upisensei.com / demo123')
    }

    setLoading(false)
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Upper Purple Brand Header */}
      <div className="bg-[#5f259f] px-6 pt-12 pb-16 text-white relative rounded-b-[40px] shadow-lg shrink-0 overflow-hidden">
        {/* Subtle background circles for depth */}
        <div className="absolute top-[-10%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute bottom-[-30%] left-[-10%] w-56 h-56 bg-accent/20 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl mb-4 border-2 border-white/20 animate-bounce-subtle">
            <img
              src="/icon.svg"
              alt="UPISensei Logo"
              className="w-14 h-14 object-contain"
              onError={(e) => {
                // Fallback emoji if icon doesn't load
                (e.target as HTMLElement).style.display = 'none';
                const parent = (e.target as HTMLElement).parentElement;
                if (parent) {
                  const span = document.createElement('span');
                  span.className = 'text-4xl';
                  span.innerText = '💳';
                  parent.appendChild(span);
                }
              }}
            />
          </div>
          <h1 className="text-3xl font-black tracking-tight drop-shadow-md">UPISensei</h1>
          <p className="text-white/80 text-sm mt-1 font-medium">Your AI-Driven UPI Spend Intelligence Guide</p>
        </div>
      </div>

      {/* Form Content Area */}
      <div className="flex-1 px-6 pt-6 pb-8 flex flex-col justify-between -translate-y-8">
        <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-foreground">Welcome Back</h2>
            <p className="text-muted-foreground text-xs font-medium">Enter your credentials to secure your session</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-3.5 rounded-xl border border-border bg-muted/30 text-foreground placeholder-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3.5 rounded-xl border border-border bg-muted/30 text-foreground placeholder-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-medium"
                required
              />
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs font-medium text-destructive leading-relaxed">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 bg-[#5f259f] hover:bg-[#4d1d82] text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
            >
              {loading ? 'Verifying Account...' : 'PROCEED SECURELY'}
            </Button>
          </form>

          {/* Quick Demo Assist */}
          <div className="p-3.5 rounded-2xl bg-secondary border border-secondary-foreground/10 flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div>
              <p className="text-xs font-bold text-secondary-foreground">Sensei Sandbox Demo Account</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium leading-normal">
                Email: <span className="font-bold font-mono text-secondary-foreground select-all">demo@upisensei.com</span>
                <br />
                Password: <span className="font-bold font-mono text-secondary-foreground select-all">demo123</span>
              </p>
            </div>
          </div>
        </div>

        {/* Create Account Link */}
        <div className="text-center space-y-3 mt-6">
          <p className="text-xs text-muted-foreground font-medium">New to UPISensei?</p>
          <Link href="/signup" className="block w-full">
            <Button
              variant="outline"
              className="w-full py-3.5 rounded-2xl border-primary/30 hover:border-primary text-primary font-bold hover:bg-primary/5 transition-all"
            >
              CREATE NEW ACCOUNT
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
