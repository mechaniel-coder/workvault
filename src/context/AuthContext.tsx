import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  getUser,
  handleAuthCallback,
  login,
  logout,
  signup,
  onAuthChange,
  type User,
  AuthError,
} from '@netlify/identity'

interface AuthContextType {
  user: User | null
  loading: boolean
  identityAvailable: boolean
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  signup: (email: string, password: string, name: string) => Promise<{ ok: boolean; error?: string; needsConfirmation?: boolean }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [identityAvailable, setIdentityAvailable] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        await handleAuthCallback()
        const currentUser = await getUser()
        if (mounted) setUser(currentUser)
      } catch {
        if (mounted) setIdentityAvailable(false)
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    const unsubscribe = onAuthChange((_event, currentUser) => {
      setUser(currentUser)
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  const handleLogin = async (email: string, password: string) => {
    try {
      const u = await login(email, password)
      setUser(u)
      return { ok: true }
    } catch (error) {
      if (error instanceof AuthError) {
        return { ok: false, error: error.status === 401 ? 'Invalid email or password' : error.message }
      }
      return { ok: false, error: 'Login failed. Identity may not be configured yet.' }
    }
  }

  const handleSignup = async (email: string, password: string, name: string) => {
    try {
      const u = await signup(email, password, { full_name: name })
      setUser(u)
      return { ok: true, needsConfirmation: !u.email && false }
    } catch (error) {
      if (error instanceof AuthError) {
        return { ok: false, error: error.message }
      }
      return { ok: false, error: 'Signup failed. Enable Identity in Netlify dashboard.' }
    }
  }

  const handleLogout = async () => {
    await logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        identityAvailable,
        login: handleLogin,
        signup: handleSignup,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
