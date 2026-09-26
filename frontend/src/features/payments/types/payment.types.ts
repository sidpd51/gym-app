export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER'
export type PaymentStatus = 'COMPLETED' | 'PENDING' | 'REFUNDED'

export interface Payment {
  id: string
  memberId: string
  membershipId?: string
  amount: number
  paymentMethod: PaymentMethod
  paymentDate: string
  status: PaymentStatus
  reference?: string
  notes?: string
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  UPI: 'UPI',
  CARD: 'Card',
  BANK_TRANSFER: 'Bank Transfer',
}
