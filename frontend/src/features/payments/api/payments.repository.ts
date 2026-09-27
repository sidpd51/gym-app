import type { Payment } from '../types/payment.types'
import { paymentsMockData } from '../data/payments.mock'

export interface PaymentRepository {
  list(): Payment[]
  getById(id: string): Payment | undefined
  listByMemberId(memberId: string): Payment[]
}

export const mockPaymentRepository: PaymentRepository = {
  list: () => paymentsMockData,
  getById: (id) => paymentsMockData.find((item) => item.id === id),
  listByMemberId: (memberId) => paymentsMockData.filter((item) => item.memberId === memberId),
}

export const paymentRepository: PaymentRepository = mockPaymentRepository
