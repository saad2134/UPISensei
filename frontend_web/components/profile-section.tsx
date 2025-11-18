"use client"

import { useAuth } from '@/app/providers'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Mail, Phone, User, LogOut } from 'lucide-react'

export default function ProfileSection() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary via-accent to-secondary mx-auto mb-4 flex items-center justify-center">
            <span className="text-4xl">👤</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Not Logged In</h2>
          <p className="text-muted-foreground mb-6">Please log in to view your profile</p>
          <Button onClick={() => router.push('/login')} className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center flex-shrink-0">
            <span className="text-4xl">👤</span>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground mb-2">{user.name}</h1>
            <p className="text-muted-foreground">UPISensei Member</p>
          </div>
        </div>

        {/* User Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email Card */}
          <div className="bg-muted/50 border border-border rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground mb-1">Email Address</p>
                <p className="text-foreground font-semibold break-all">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Phone Card */}
          <div className="bg-muted/50 border border-border rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Phone className="w-5 h-5 text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground mb-1">Phone Number</p>
                <p className="text-foreground font-semibold">{user.phone}</p>
              </div>
            </div>
          </div>

          {/* User ID Card */}
          <div className="bg-muted/50 border border-border rounded-xl p-4 md:col-span-2">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <User className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground mb-1">User ID</p>
                <p className="text-foreground font-semibold break-all font-mono text-sm">{user.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-foreground mb-4">Account Actions</h2>
        <div className="space-y-3">
          <Button
            onClick={handleLogout}
            className="w-full py-2 bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground font-semibold rounded-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Account Stats */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-foreground mb-4">Account Overview</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-2xl font-bold text-primary">5</p>
            <p className="text-xs text-muted-foreground mt-1">Transactions</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-secondary/5 border border-secondary/20">
            <p className="text-2xl font-bold text-secondary">2,450</p>
            <p className="text-xs text-muted-foreground mt-1">Total Spent</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-accent/5 border border-accent/20">
            <p className="text-2xl font-bold text-accent">12</p>
            <p className="text-xs text-muted-foreground mt-1">Days Active</p>
          </div>
        </div>
      </div>
    </div>
  )
}
