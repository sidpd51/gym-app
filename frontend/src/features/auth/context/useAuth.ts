import { useContext } from 'react'
import type { AuthContextValue } from '../types/auth.types'
import { AuthContext } from './AuthContext'

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
