import { membersMockData } from '@/features/members/data/members.mock'
import { membershipPlansMockData } from '@/features/membership-plans/data/membership-plans.mock'
import { membershipsMockData } from '@/features/memberships/data/memberships.mock'
import { paymentsMockData } from '@/features/payments/data/payments.mock'
import { trainersMockData } from '@/features/trainers/data/trainers.mock'
import { leadsMockData } from '@/features/leads/data/leads.mock'
import { expensesMockData } from '@/features/expenses/data/expenses.mock'
import { inventoryMockData } from '@/features/inventory/data/inventory.mock'
import { equipmentMockData } from '@/features/equipment/data/equipment.mock'
import type { GlobalSearchResult, SearchGroup, SearchPermissions, SearchResultType } from '../types/search.types'

const MAX_PER_CATEGORY = 5

function match(q: string, ...fields: (string | undefined)[]): boolean {
  return fields.some((f) => f?.toLowerCase().includes(q))
}

function searchMembers(q: string): GlobalSearchResult[] {
  return membersMockData
    .filter((m) =>
      match(q, m.firstName, m.lastName, `${m.firstName} ${m.lastName}`, m.memberCode, m.phone, m.email)
    )
    .slice(0, MAX_PER_CATEGORY)
    .map((m) => ({
      id: m.id,
      title: `${m.firstName} ${m.lastName}`,
      subtitle: `${m.memberCode} · ${m.membershipPlan ?? 'No plan'}`,
      to: `/members/${m.id}`,
      type: 'members' as SearchResultType,
    }))
}

function searchMembershipPlans(q: string): GlobalSearchResult[] {
  return membershipPlansMockData
    .filter((p) => match(q, p.name, p.description))
    .slice(0, MAX_PER_CATEGORY)
    .map((p) => ({
      id: p.id,
      title: p.name,
      subtitle: `${p.durationInDays} days · ₹${p.price.toLocaleString('en-IN')}`,
      to: `/membership-plans/${p.id}/edit`,
      type: 'membershipPlans' as SearchResultType,
    }))
}

function searchMemberships(q: string): GlobalSearchResult[] {
  const membersById = new Map(membersMockData.map((m) => [m.id, m]))
  return membershipsMockData
    .filter((ms) => {
      const member = membersById.get(ms.memberId)
      const memberName = member ? `${member.firstName} ${member.lastName}` : ''
      return match(q, ms.planName, memberName, ms.id)
    })
    .slice(0, MAX_PER_CATEGORY)
    .map((ms) => {
      const member = membersById.get(ms.memberId)
      const memberName = member ? `${member.firstName} ${member.lastName}` : ms.memberId
      return {
        id: ms.id,
        title: `${memberName} — ${ms.planName}`,
        subtitle: `${ms.startDate} to ${ms.endDate}`,
        to: `/members/${ms.memberId}`,
        type: 'memberships' as SearchResultType,
      }
    })
}

function searchPayments(q: string): GlobalSearchResult[] {
  const membersById = new Map(membersMockData.map((m) => [m.id, m]))
  return paymentsMockData
    .filter((p) => {
      const member = membersById.get(p.memberId)
      const memberName = member ? `${member.firstName} ${member.lastName}` : ''
      return match(q, p.id, memberName, p.paymentDate, p.paymentMethod)
    })
    .slice(0, MAX_PER_CATEGORY)
    .map((p) => {
      const member = membersById.get(p.memberId)
      const memberName = member ? `${member.firstName} ${member.lastName}` : p.memberId
      return {
        id: p.id,
        title: `${p.id} · ${memberName}`,
        subtitle: `₹${p.amount.toLocaleString('en-IN')} · ${p.paymentDate}`,
        to: `/payments/${p.id}`,
        type: 'payments' as SearchResultType,
      }
    })
}

function searchTrainers(q: string): GlobalSearchResult[] {
  return trainersMockData
    .filter((t) =>
      match(q, t.firstName, t.lastName, `${t.firstName} ${t.lastName}`, t.trainerCode, t.phone, t.specialization)
    )
    .slice(0, MAX_PER_CATEGORY)
    .map((t) => ({
      id: t.id,
      title: `${t.firstName} ${t.lastName}`,
      subtitle: `${t.trainerCode} · ${t.specialization ?? 'General'}`,
      to: `/trainers/${t.id}`,
      type: 'trainers' as SearchResultType,
    }))
}

function searchLeads(q: string): GlobalSearchResult[] {
  return leadsMockData
    .filter((l) => match(q, l.name, l.leadCode, l.phone, l.email))
    .slice(0, MAX_PER_CATEGORY)
    .map((l) => ({
      id: l.id,
      title: l.name,
      subtitle: `${l.leadCode} · ${l.status}`,
      to: `/leads/${l.id}`,
      type: 'leads' as SearchResultType,
    }))
}

function searchExpenses(q: string): GlobalSearchResult[] {
  return expensesMockData
    .filter((e) => match(q, e.description, e.expenseCode, e.vendor))
    .slice(0, MAX_PER_CATEGORY)
    .map((e) => ({
      id: e.id,
      title: e.description,
      subtitle: `${e.expenseCode} · ₹${e.amount.toLocaleString('en-IN')}`,
      to: `/expenses/${e.id}`,
      type: 'expenses' as SearchResultType,
    }))
}

function searchInventory(q: string): GlobalSearchResult[] {
  return inventoryMockData
    .filter((i) => match(q, i.name, i.itemCode, i.description))
    .slice(0, MAX_PER_CATEGORY)
    .map((i) => ({
      id: i.id,
      title: i.name,
      subtitle: `${i.itemCode} · Stock: ${i.currentStock} ${i.unit}`,
      to: `/inventory/${i.id}`,
      type: 'inventory' as SearchResultType,
    }))
}

function searchEquipment(q: string): GlobalSearchResult[] {
  return equipmentMockData
    .filter((e) => match(q, e.name, e.equipmentCode, e.brand, e.model, e.location))
    .slice(0, MAX_PER_CATEGORY)
    .map((e) => ({
      id: e.id,
      title: e.name,
      subtitle: `${e.equipmentCode} · ${e.brand ?? ''} ${e.model ?? ''}`.trim(),
      to: `/equipment/${e.id}`,
      type: 'equipment' as SearchResultType,
    }))
}

const GROUP_LABELS: Record<SearchResultType, string> = {
  members: 'Members',
  membershipPlans: 'Membership Plans',
  memberships: 'Memberships',
  payments: 'Payments',
  trainers: 'Trainers',
  leads: 'Leads',
  expenses: 'Expenses',
  inventory: 'Inventory',
  equipment: 'Equipment',
}

export function searchAll(
  query: string,
  permissions: SearchPermissions
): Partial<Record<SearchResultType, SearchGroup>> {
  const q = query.trim().toLowerCase()
  if (!q) return {}

  const groups: Partial<Record<SearchResultType, SearchGroup>> = {}

  const runners: Array<[SearchResultType, keyof SearchPermissions, (q: string) => GlobalSearchResult[]]> = [
    ['members', 'members', searchMembers],
    ['membershipPlans', 'membershipPlans', searchMembershipPlans],
    ['memberships', 'memberships', searchMemberships],
    ['payments', 'payments', searchPayments],
    ['trainers', 'trainers', searchTrainers],
    ['leads', 'leads', searchLeads],
    ['expenses', 'expenses', searchExpenses],
    ['inventory', 'inventory', searchInventory],
    ['equipment', 'equipment', searchEquipment],
  ]

  for (const [type, permKey, fn] of runners) {
    if (!permissions[permKey]) continue
    const results = fn(q)
    if (results.length > 0) {
      groups[type] = { label: GROUP_LABELS[type], results }
    }
  }

  return groups
}
