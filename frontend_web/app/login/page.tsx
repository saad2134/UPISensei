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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center px-4">
      <div className="w-full max-w-md pt-8 pb-8">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="/icon.svg"
            alt="Icon"
            className="w-20 h-20 mx-auto mb-4"
          />

          <h1 className="text-3xl font-bold text-foreground mb-2">UPISensei</h1>
          <p className="text-muted-foreground">Your Financial Wisdom Guide</p>
        </div>

        {/* Login Form */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Welcome Back</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold rounded-lg hover:shadow-lg transition-all duration-300"
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground text-center mb-4">
              Don't have an account?
            </p>
            <Link href="/signup">
              <Button
                variant="outline"
                className="w-full"
              >
                Create Account
              </Button>
            </Link>
          </div>

          {/* Demo Credentials Info */}
          <div className="mt-4 p-3 rounded-lg bg-secondary/20 border border-secondary/50">
            <p className="text-xs font-medium text-foreground mb-2">Demo Credentials:</p>
            <p className="text-xs text-muted-foreground">Email: demo@upisensei.com</p>
            <p className="text-xs text-muted-foreground">Password: demo123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
