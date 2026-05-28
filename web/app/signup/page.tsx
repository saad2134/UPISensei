"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { signup } = useAuth()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setError('All fields are required')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    const success = await signup(formData.email, formData.password, formData.name, formData.phone)
    
    if (success) {
      router.push('/')
    } else {
      setError('Failed to create account. Please try again.')
    }
    
    setLoading(false)
  }

  return (
    <div className="flex-1 flex flex-col bg-background overflow-y-auto">
      {/* Upper Purple Brand Header */}
      <div className="bg-[#5f259f] px-6 pt-10 pb-14 text-white relative rounded-b-[40px] shadow-lg shrink-0 overflow-hidden">
        {/* Subtle background circles for depth */}
        <div className="absolute top-[-10%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute bottom-[-35%] left-[-15%] w-56 h-56 bg-accent/20 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative flex flex-col items-center text-center">
          <h1 className="text-3xl font-black tracking-tight drop-shadow-md">Create Account</h1>
          <p className="text-white/80 text-sm mt-1 font-medium">Join UPISensei to track & master your spending</p>
        </div>
      </div>

      {/* Form Content Area */}
      <div className="flex-1 px-6 pt-6 pb-8 flex flex-col justify-between -translate-y-6">
        <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-xl space-y-4">
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Saad Ahmed"
                className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-foreground placeholder-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-medium"
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-foreground placeholder-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-medium"
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 9876543210"
                className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-foreground placeholder-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-medium"
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••"
                className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-foreground placeholder-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-medium"
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••"
                className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-foreground placeholder-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-medium"
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs font-medium text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 bg-[#5f259f] hover:bg-[#4d1d82] text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
            >
              {loading ? 'Creating Wallet...' : 'PROCEED & REGISTER'}
            </Button>
          </form>
        </div>

        {/* Existing account login Link */}
        <div className="text-center space-y-3 mt-6">
          <p className="text-xs text-muted-foreground font-medium">Already have an account?</p>
          <Link href="/login" className="block w-full">
            <Button
              variant="outline"
              className="w-full py-3.5 rounded-2xl border-primary/30 hover:border-primary text-primary font-bold hover:bg-primary/5 transition-all"
            >
              BACK TO LOGIN
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
