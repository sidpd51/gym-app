/* eslint-disable react-refresh/only-export-components */
import { createContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { AuthContextValue, AuthUser, ProfileUpdateData } from '../types/auth.types'
import { mockCredentials } from '../data/auth.mock'
import { usersMockData } from '@/features/users/data/users.mock'

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)

  function login(email: string, password: string): boolean {
    const cred = mockCredentials.find(
      (c) => c.email === email && c.devPassword === password
    )
    if (!cred) return false
    const found = usersMockData.find((u) => u.id === cred.userId)
    if (!found) return false
    setUser(found)
    return true
  }

  function logout() {
    setUser(null)
  }

  function updateProfile(data: ProfileUpdateData) {
    if (!user) return
    setUser({
      ...user,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone ?? user.phone,
    })
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}
