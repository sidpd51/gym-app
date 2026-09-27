import type { User } from '../types/user.types'
import { usersMockData } from '../data/users.mock'

export interface UserRepository {
  list(): User[]
  getById(id: string): User | undefined
}

export const mockUserRepository: UserRepository = {
  list: () => usersMockData,
  getById: (id) => usersMockData.find((item) => item.id === id),
}

export const userRepository: UserRepository = mockUserRepository
