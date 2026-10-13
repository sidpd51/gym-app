import type { User } from '@/features/users/types/user.types'

export type AuthUser = User

export interface ProfileUpdateData {
  firstName: string
  lastName: string
  phone?: string
}

export interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  updateProfile: (data: ProfileUpdateData) => void
}
