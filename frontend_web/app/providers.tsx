"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface User {
  id: string
  email: string
  name: string
  phone: string
}

export interface AuthContextType {
  user: User | null
  isLoggedIn: boolean
  login: (email: string, password: string) => Promise<boolean>
  signup: (email: string, password: string, name: string, phone: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Demo account credentials
const DEMO_ACCOUNT = {
  email: 'demo@upisensei.com',
  password: 'demo123',
  name: 'Alex Johnson',
  phone: '+91 98765 43210',
  id: 'user_001'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const login = async (email: string, password: string): Promise<boolean> => {
    // Demo login - accepts demo credentials
    if (email === DEMO_ACCOUNT.email && password === DEMO_ACCOUNT.password) {
      setUser({
        id: DEMO_ACCOUNT.id,
        email: DEMO_ACCOUNT.email,
        name: DEMO_ACCOUNT.name,
        phone: DEMO_ACCOUNT.phone,
      })
      return true
    }
    return false
  }

  const signup = async (email: string, password: string, name: string, phone: string): Promise<boolean> => {
    // Simple signup - creates a new user
    if (email && password && name && phone) {
      setUser({
        id: `user_${Date.now()}`,
        email,
        name,
        phone,
      })
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
