import { apiClient } from '@/lib/api'
import type { ListQueryParams, PaginatedResponse } from '@/lib/api'
import type { Payment, PaymentMethod, PaymentStatus } from '../types/payment.types'
import { paymentsMockData } from '../data/payments.mock'

// Backend payment Response (internal/modules/payment/payment.go).
// shopspring/decimal serializes as a JSON string; accept number too.
export interface BackendPayment {
  id: string
  memberId: string
  membershipId: string | null
  amount: number | string
  paymentMethod: PaymentMethod
  paymentDate: string
  status: PaymentStatus
  reference: string | null
  notes: string | null
  createdAt: string
}

export function mapBackendPayment(payload: BackendPayment): Payment {
  return {
    id: payload.id,
    memberId: payload.memberId,
    membershipId: payload.membershipId ?? undefined,
    amount: Number(payload.amount),
    paymentMethod: payload.paymentMethod,
    paymentDate: payload.paymentDate,
    status: payload.status,
    reference: payload.reference ?? undefined,
    notes: payload.notes ?? undefined,
  }
}

export interface PaymentListQuery extends ListQueryParams {
  status?: PaymentStatus
  memberId?: string
  fromDate?: string
  toDate?: string
}

export interface CreatePaymentInput {
  memberId: string
  membershipId?: string
  amount: number
  paymentMethod: PaymentMethod
  paymentDate: string
  status?: PaymentStatus
  reference?: string
  notes?: string
}

export interface PaymentRepository {
  list(query?: PaymentListQuery): Promise<PaginatedResponse<Payment>>
  getById(id: string): Promise<Payment>
  listByMemberId(memberId: string): Promise<Payment[]>
  create(input: CreatePaymentInput): Promise<Payment>
}

function toQuery(query?: PaymentListQuery): ListQueryParams {
  return {
    page: query?.page ?? 1,
    pageSize: query?.pageSize ?? 100,
    status: query?.status,
    memberId: query?.memberId,
    fromDate: query?.fromDate,
    toDate: query?.toDate,
  }
}

export const apiPaymentRepository: PaymentRepository = {
  async list(query?: PaymentListQuery): Promise<PaginatedResponse<Payment>> {
    const res = await apiClient.get<PaginatedResponse<BackendPayment>>(
      '/api/v1/payments',
      toQuery(query),
    )
    return {
      meta: res.meta,
      data: res.data.map(mapBackendPayment),
    }
  },

  async getById(id: string): Promise<Payment> {
    const res = await apiClient.get<BackendPayment>(`/api/v1/payments/${id}`)
    return mapBackendPayment(res)
  },

  async listByMemberId(memberId: string): Promise<Payment[]> {
    const res = await apiClient.get<PaginatedResponse<BackendPayment>>('/api/v1/payments', {
      page: 1,
      pageSize: 100,
      memberId,
    })
    return res.data.map(mapBackendPayment)
  },

  async create(input: CreatePaymentInput): Promise<Payment> {
    const res = await apiClient.post<BackendPayment>('/api/v1/payments', {
      memberId: input.memberId,
      membershipId: input.membershipId || undefined,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      paymentDate: input.paymentDate,
      status: input.status,
      reference: input.reference || undefined,
      notes: input.notes || undefined,
    })
    return mapBackendPayment(res)
  },
}

// Kept for unit tests / offline reference. No longer the default.
export const mockPaymentRepository = {
  list: (): Payment[] => paymentsMockData,
  getById: (id: string): Payment | undefined => paymentsMockData.find((p) => p.id === id),
  listByMemberId: (memberId: string): Payment[] =>
    paymentsMockData.filter((p) => p.memberId === memberId),
}

export const paymentRepository: PaymentRepository = apiPaymentRepository
