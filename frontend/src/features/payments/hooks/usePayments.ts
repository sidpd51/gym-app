import { paymentRepository } from '../api/payments.repository'
import type { Payment } from '../types/payment.types'

export function usePayments(): { payments: Payment[] } {
  return { payments: paymentRepository.list() }
}

export function usePayment(id: string | undefined): { payment: Payment | undefined } {
  return { payment: id ? paymentRepository.getById(id) : undefined }
}

export function useMemberPayments(memberId: string | undefined): { payments: Payment[] } {
  return { payments: memberId ? paymentRepository.listByMemberId(memberId) : [] }
}
