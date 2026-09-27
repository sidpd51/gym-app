import { userRepository } from '../api/users.repository'
import type { User } from '../types/user.types'

export function useUsers(): { users: User[] } {
  return { users: userRepository.list() }
}

export function useUser(id: string | undefined): { user: User | undefined } {
  return { user: id ? userRepository.getById(id) : undefined }
}
