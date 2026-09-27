import { membershipsMockData } from '@/features/memberships/data/memberships.mock'
import { membersMockData } from '@/features/members/data/members.mock'

export const REFERENCE_DATE = '2026-09-27'

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('T')[0].split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function daysFromReference(dateStr: string): number {
  const ref = new Date(2026, 8, 27)
  const target = parseDate(dateStr)
  return Math.round((target.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24))
}

export interface ExpiringMembership {
  id: string
  memberId: string
  memberName: string
  planName: string
  endDate: string
  daysUntilExpiry: number
}

export interface ExpiredMembership {
  id: string
  memberId: string
  memberName: string
  planName: string
  endDate: string
  daysExpired: number
}

export function getExpiringMemberships(windowDays: number): ExpiringMembership[] {
  return membershipsMockData
    .filter((ms) => ms.status === 'ACTIVE')
    .map((ms) => ({
      id: ms.id,
      memberId: ms.memberId,
      memberName: getMemberName(ms.memberId),
      planName: ms.planName,
      endDate: ms.endDate,
      daysUntilExpiry: daysFromReference(ms.endDate),
    }))
    .filter((ms) => ms.daysUntilExpiry >= 0 && ms.daysUntilExpiry <= windowDays)
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
}

export function getExpiredMemberships(): ExpiredMembership[] {
  return membershipsMockData
    .filter((ms) => ms.status === 'EXPIRED')
    .map((ms) => ({
      id: ms.id,
      memberId: ms.memberId,
      memberName: getMemberName(ms.memberId),
      planName: ms.planName,
      endDate: ms.endDate,
      daysExpired: Math.abs(daysFromReference(ms.endDate)),
    }))
    .sort((a, b) => a.daysExpired - b.daysExpired)
}

export function getMemberName(memberId: string): string {
  const member = membersMockData.find((m) => m.id === memberId)
  return member ? `${member.firstName} ${member.lastName}` : memberId
}

export function formatExpiryDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
