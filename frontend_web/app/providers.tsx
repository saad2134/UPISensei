"use client"

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'

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
  name: 'Saad Ahmed',
  phone: '+91 9876543210',
  id: 'user_001'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem('auth_user')
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
      } catch (error) {
        console.error('Failed to parse stored user:', error)
        localStorage.removeItem('auth_user')
      }
    }
    setIsHydrated(true)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    // Demo login - accepts demo credentials
    if (email === DEMO_ACCOUNT.email && password === DEMO_ACCOUNT.password) {
      const newUser = {
        id: DEMO_ACCOUNT.id,
        email: DEMO_ACCOUNT.email,
        name: DEMO_ACCOUNT.name,
        phone: DEMO_ACCOUNT.phone,
      }
      setUser(newUser)
      localStorage.setItem('auth_user', JSON.stringify(newUser))
      return true
    }
    return false
  }

  const signup = async (email: string, password: string, name: string, phone: string): Promise<boolean> => {
    // Simple signup - creates a new user
    if (email && password && name && phone) {
      const newUser = {
        id: `user_${Date.now()}`,
        email,
        name,
        phone,
      }
      setUser(newUser)
      localStorage.setItem('auth_user', JSON.stringify(newUser))
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('auth_user')
  }

  if (!isHydrated) {
    return <div /> // Silent loading state
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
