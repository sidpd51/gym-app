import type { MemberTrainerAssignment } from '../types/member-trainer.types'

// Trainer ID reference:
//   tr001 = Amit Sharma   (ACTIVE)
//   tr002 = Priya Desai   (ACTIVE)
//   tr003 = Rahul Verma   (ACTIVE)
//   tr004 = Vikram Das    (ACTIVE)
//   tr006 = Suresh Pillai (ACTIVE)
//   tr008 = Arjun Reddy   (ACTIVE)
//
// Members m016–m020 have no assignment — use them to test "Assign Trainer" flow.

export const memberTrainerAssignmentsMockData: MemberTrainerAssignment[] = [
  // ── m001 (Rahul Kumar) — history + current ───────────────────────────────
  {
    id: 'MTA-001',
    memberId: 'm001',
    trainerId: 'tr003',
    startDate: '2025-01-05',
    endDate: '2025-12-31',
    status: 'ENDED',
  },
  {
    id: 'MTA-002',
    memberId: 'm001',
    trainerId: 'tr001',
    startDate: '2026-01-01',
    status: 'ACTIVE',
  },

  // ── m002 (Priya Sharma) ──────────────────────────────────────────────────
  {
    id: 'MTA-003',
    memberId: 'm002',
    trainerId: 'tr002',
    startDate: '2026-02-01',
    status: 'ACTIVE',
  },

  // ── m003 (Amit Singh) — history + current ───────────────────────────────
  {
    id: 'MTA-004',
    memberId: 'm003',
    trainerId: 'tr001',
    startDate: '2025-12-01',
    endDate: '2026-05-31',
    status: 'ENDED',
  },
  {
    id: 'MTA-005',
    memberId: 'm003',
    trainerId: 'tr003',
    startDate: '2026-06-01',
    status: 'ACTIVE',
  },

  // ── m004 (Rohit Das) ─────────────────────────────────────────────────────
  {
    id: 'MTA-006',
    memberId: 'm004',
    trainerId: 'tr001',
    startDate: '2026-01-15',
    status: 'ACTIVE',
  },

  // ── m005 (Sunita Patel) ───────────────────────────────────────────────────
  {
    id: 'MTA-007',
    memberId: 'm005',
    trainerId: 'tr002',
    startDate: '2026-07-01',
    status: 'ACTIVE',
  },

  // ── m006 (Vikram Verma) — history + current ──────────────────────────────
  {
    id: 'MTA-008',
    memberId: 'm006',
    trainerId: 'tr001',
    startDate: '2025-07-01',
    endDate: '2025-12-31',
    status: 'ENDED',
  },
  {
    id: 'MTA-009',
    memberId: 'm006',
    trainerId: 'tr003',
    startDate: '2026-01-01',
    status: 'ACTIVE',
  },

  // ── m007 (Neha Gupta) ─────────────────────────────────────────────────────
  {
    id: 'MTA-010',
    memberId: 'm007',
    trainerId: 'tr001',
    startDate: '2026-02-20',
    status: 'ACTIVE',
  },

  // ── m008 (Deepak Joshi) ───────────────────────────────────────────────────
  {
    id: 'MTA-011',
    memberId: 'm008',
    trainerId: 'tr002',
    startDate: '2026-03-10',
    status: 'ACTIVE',
  },

  // ── m009 (Kavita Mehta) ───────────────────────────────────────────────────
  {
    id: 'MTA-012',
    memberId: 'm009',
    trainerId: 'tr003',
    startDate: '2026-04-15',
    status: 'ACTIVE',
  },

  // ── m010 (Suresh Reddy) ───────────────────────────────────────────────────
  {
    id: 'MTA-013',
    memberId: 'm010',
    trainerId: 'tr001',
    startDate: '2026-05-01',
    status: 'ACTIVE',
  },

  // ── m011 (Anita Bose) ─────────────────────────────────────────────────────
  {
    id: 'MTA-014',
    memberId: 'm011',
    trainerId: 'tr002',
    startDate: '2026-06-15',
    status: 'ACTIVE',
  },

  // ── m012 (Karan Malhotra) ─────────────────────────────────────────────────
  {
    id: 'MTA-015',
    memberId: 'm012',
    trainerId: 'tr003',
    startDate: '2026-07-20',
    status: 'ACTIVE',
  },

  // ── m013 (Meera Nair) — history + current ────────────────────────────────
  {
    id: 'MTA-016',
    memberId: 'm013',
    trainerId: 'tr002',
    startDate: '2026-01-01',
    endDate: '2026-08-04',
    status: 'ENDED',
  },
  {
    id: 'MTA-017',
    memberId: 'm013',
    trainerId: 'tr001',
    startDate: '2026-08-05',
    status: 'ACTIVE',
  },

  // ── m014 (Ajay Tiwari) ────────────────────────────────────────────────────
  {
    id: 'MTA-018',
    memberId: 'm014',
    trainerId: 'tr002',
    startDate: '2026-09-01',
    status: 'ACTIVE',
  },

  // ── m015 (Pooja Iyer) ─────────────────────────────────────────────────────
  {
    id: 'MTA-019',
    memberId: 'm015',
    trainerId: 'tr003',
    startDate: '2026-09-15',
    status: 'ACTIVE',
  },

  // ── m016–m020: no assignments — test "Assign Trainer" flow ────────────────
]
