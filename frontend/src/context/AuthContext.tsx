/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
}

export interface RegisterInput {
  email: string
  password: string
  firstName: string
  lastName: string
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  loginAsDemo: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Resolve the full user from the session cookie. /api/auth/me 401s when there
  // is no valid session — that just means "not logged in", not an error.
  const fetchMe = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (!res.ok) { setUser(null); return }
      const data = await res.json()
      setUser(data.ok ? data.user : null)
    } catch {
      setUser(null)
    }
  }

  useEffect(() => {
    fetchMe().finally(() => setLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error ?? 'Login failed')
    // Login only returns id+email; fetch /me for the full profile.
    await fetchMe()
  }

  const register = async (input: RegisterInput) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(input),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error ?? 'Registration failed')
    await fetchMe()
  }

  const loginAsDemo = async () => {
    const res = await fetch('/api/auth/demo', { method: 'POST', credentials: 'include' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error ?? 'Demo login failed')
    await fetchMe()
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch (err) {
      console.error('Logout request failed', err)
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginAsDemo, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
