/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { AuthContextValue, AuthUser, ProfileUpdateData } from '../types/auth.types'
import type { User } from '@/features/users/types/user.types'
import { apiClient } from '@/lib/api'

// Backend /auth/me and /auth/login return this shape.
interface BackendUser {
  id: string
  userCode: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  role: User['role']
  status: User['status']
  lastLoginAt: string | null
  createdAt: string
}

function mapBackendUser(payload: BackendUser): AuthUser {
  return {
    id: payload.id,
    userCode: payload.userCode,
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    phone: payload.phone ?? undefined,
    role: payload.role,
    status: payload.status,
    lastLoginAt: payload.lastLoginAt ?? undefined,
    createdAt: payload.createdAt,
  }
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restore an existing session from the httpOnly cookie issued by the backend.
  useEffect(() => {
    let active = true

    apiClient
      .get<BackendUser>('/api/v1/auth/me')
      .then((payload) => {
        if (active) setUser(mapBackendUser(payload))
      })
      .catch(() => {
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  async function login(email: string, password: string): Promise<boolean> {
    try {
      const payload = await apiClient.post<BackendUser>('/api/v1/auth/login', {
        email,
        password,
      })
      setUser(mapBackendUser(payload))
      return true
    } catch {
      return false
    }
  }

  async function logout(): Promise<void> {
    try {
      await apiClient.post('/api/v1/auth/logout')
    } catch {
      // Ignore transport errors; local session is still cleared.
    }
    setUser(null)
  }

  function updateProfile(data: ProfileUpdateData) {
    // Keep the existing optimistic local behaviour. Backend profile updates can
    // be wired separately when the wider app integration is complete.
    if (!user) return
    setUser({
      ...user,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone ?? user.phone,
    })
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}