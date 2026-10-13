import { useApiDetail, useApiList, useApiQuery } from '@/lib/api/useApi'
import type { ApiError, PaginatedResponse } from '@/lib/api'
import { paymentRepository, type PaymentListQuery } from '../api/payments.repository'
import type { Payment } from '../types/payment.types'

interface PaymentsResult {
  payments: Payment[]
  meta: PaginatedResponse<Payment>['meta'] | null
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

/**
 * Async payment list backed by GET /api/v1/payments.
 * `payments` defaults to [] while loading so existing cross-feature
 * consumers (reports, search, reminders) keep working during fetch.
 */
export function usePayments(query?: PaymentListQuery): PaymentsResult {
  const normalized: PaymentListQuery = {
    page: 1,
    pageSize: 100,
    ...query,
  }
  const { data, meta, isLoading, error, refetch } = useApiList<Payment>(normalized, (q) =>
    paymentRepository.list(q as PaymentListQuery),
  )
  return { payments: data ?? [], meta, isLoading, error, refetch }
}

interface PaymentResult {
  payment: Payment | null
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

/** Async payment detail backed by GET /api/v1/payments/{id}. */
export function usePayment(id: string | undefined): PaymentResult {
  const { data, isLoading, error, refetch } = useApiDetail<Payment>(id, (paymentId) =>
    paymentRepository.getById(paymentId),
  )
  return { payment: data, isLoading, error, refetch }
}

interface MemberPaymentsResult {
  payments: Payment[]
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

/** Async member-scoped payment list backed by GET /api/v1/payments?memberId=. */
export function useMemberPayments(memberId: string | undefined): MemberPaymentsResult {
  const { data, isLoading, error, refetch } = useApiQuery<Payment[]>(
    () => paymentRepository.listByMemberId(memberId!),
    memberId ?? '',
  )
  return { payments: data ?? [], isLoading, error, refetch }
}
