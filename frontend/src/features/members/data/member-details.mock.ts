import type { MemberSupplementalData } from '../types/member.types'

export const memberSupplementalData: Record<string, MemberSupplementalData> = {
  m001: {
    membershipHistory: [
      { id: 'mh-m001-2', plan: 'Annual', startDate: '2026-01-05', endDate: '2026-12-31', amount: 12000, status: 'ACTIVE' },
      { id: 'mh-m001-1', plan: 'Annual', startDate: '2025-01-05', endDate: '2025-12-31', amount: 11000, status: 'EXPIRED' },
    ],
    attendanceSummary: { visitsThisMonth: 18, lastVisitDate: '2026-09-25', averageVisitsPerWeek: 4.5 },
    paymentHistory: [
      { receiptId: 'R-1024', plan: 'Annual', amount: 12000, method: 'UPI', date: '2026-01-05' },
      { receiptId: 'R-0891', plan: 'Annual', amount: 11000, method: 'Cash', date: '2025-01-05' },
    ],
  },

  m002: {
    membershipHistory: [
      { id: 'mh-m002-7', plan: 'Monthly', startDate: '2026-10-01', endDate: '2026-10-30', amount: 1500, status: 'ACTIVE' },
      { id: 'mh-m002-6', plan: 'Monthly', startDate: '2026-09-01', endDate: '2026-09-30', amount: 1500, status: 'EXPIRED' },
      { id: 'mh-m002-5', plan: 'Monthly', startDate: '2026-08-01', endDate: '2026-08-31', amount: 1500, status: 'EXPIRED' },
    ],
    attendanceSummary: { visitsThisMonth: 12, lastVisitDate: '2026-09-24', averageVisitsPerWeek: 3.0 },
    paymentHistory: [
      { receiptId: 'R-1098', plan: 'Monthly', amount: 1500, method: 'UPI', date: '2026-10-01' },
      { receiptId: 'R-1067', plan: 'Monthly', amount: 1500, method: 'UPI', date: '2026-09-01' },
      { receiptId: 'R-1041', plan: 'Monthly', amount: 1500, method: 'UPI', date: '2026-08-01' },
    ],
  },

  m003: {
    membershipHistory: [
      { id: 'mh-m003-2', plan: 'Quarterly', startDate: '2026-08-20', endDate: '2026-11-20', amount: 4000, status: 'ACTIVE' },
      { id: 'mh-m003-1', plan: 'Quarterly', startDate: '2026-05-20', endDate: '2026-08-19', amount: 4000, status: 'EXPIRED' },
    ],
    attendanceSummary: { visitsThisMonth: 10, lastVisitDate: '2026-09-22', averageVisitsPerWeek: 2.5 },
    paymentHistory: [
      { receiptId: 'R-1071', plan: 'Quarterly', amount: 4000, method: 'Net Banking', date: '2026-08-20' },
      { receiptId: 'R-1008', plan: 'Quarterly', amount: 4000, method: 'Net Banking', date: '2026-05-20' },
    ],
  },

  m004: {
    membershipHistory: [
      { id: 'mh-m004-3', plan: 'Monthly', startDate: '2026-07-10', endDate: '2026-08-10', amount: 1500, status: 'EXPIRED' },
      { id: 'mh-m004-2', plan: 'Monthly', startDate: '2026-06-10', endDate: '2026-07-09', amount: 1500, status: 'EXPIRED' },
      { id: 'mh-m004-1', plan: 'Monthly', startDate: '2025-06-10', endDate: '2025-07-09', amount: 1500, status: 'EXPIRED' },
    ],
    attendanceSummary: { visitsThisMonth: 0, lastVisitDate: '2026-08-08', averageVisitsPerWeek: 0 },
    paymentHistory: [
      { receiptId: 'R-1059', plan: 'Monthly', amount: 1500, method: 'Cash', date: '2026-07-10' },
      { receiptId: 'R-1029', plan: 'Monthly', amount: 1500, method: 'Cash', date: '2026-06-10' },
    ],
  },

  m005: {
    membershipHistory: [
      { id: 'mh-m005-2', plan: 'Half-Yearly', startDate: '2026-07-01', endDate: '2027-01-01', amount: 7000, status: 'ACTIVE' },
      { id: 'mh-m005-1', plan: 'Half-Yearly', startDate: '2026-01-01', endDate: '2026-06-30', amount: 7000, status: 'EXPIRED' },
    ],
    attendanceSummary: { visitsThisMonth: 22, lastVisitDate: '2026-09-26', averageVisitsPerWeek: 5.0 },
    paymentHistory: [
      { receiptId: 'R-1053', plan: 'Half-Yearly', amount: 7000, method: 'Card', date: '2026-07-01' },
      { receiptId: 'R-0943', plan: 'Half-Yearly', amount: 7000, method: 'Card', date: '2026-01-01' },
    ],
  },

  m006: {
    membershipHistory: [
      { id: 'mh-m006-2', plan: 'Annual', startDate: '2025-11-12', endDate: '2026-11-12', amount: 12000, status: 'SUSPENDED' },
      { id: 'mh-m006-1', plan: 'Monthly', startDate: '2025-09-12', endDate: '2025-10-12', amount: 1500, status: 'EXPIRED' },
    ],
    attendanceSummary: { visitsThisMonth: 0, lastVisitDate: '2026-07-15', averageVisitsPerWeek: 0 },
    paymentHistory: [
      { receiptId: 'R-0978', plan: 'Annual', amount: 12000, method: 'UPI', date: '2025-11-12' },
      { receiptId: 'R-0954', plan: 'Monthly', amount: 1500, method: 'UPI', date: '2025-09-12' },
    ],
  },

  m007: {
    membershipHistory: [
      { id: 'mh-m007-5', plan: 'Monthly', startDate: '2026-09-18', endDate: '2026-10-18', amount: 1500, status: 'ACTIVE' },
      { id: 'mh-m007-4', plan: 'Monthly', startDate: '2026-08-18', endDate: '2026-09-17', amount: 1500, status: 'EXPIRED' },
      { id: 'mh-m007-3', plan: 'Monthly', startDate: '2026-07-18', endDate: '2026-08-17', amount: 1500, status: 'EXPIRED' },
    ],
    attendanceSummary: { visitsThisMonth: 8, lastVisitDate: '2026-09-23', averageVisitsPerWeek: 2.0 },
    paymentHistory: [
      { receiptId: 'R-1082', plan: 'Monthly', amount: 1500, method: 'Cash', date: '2026-09-18' },
      { receiptId: 'R-1055', plan: 'Monthly', amount: 1500, method: 'Cash', date: '2026-08-18' },
      { receiptId: 'R-1028', plan: 'Monthly', amount: 1500, method: 'Cash', date: '2026-07-18' },
    ],
  },

  m008: {
    membershipHistory: [
      { id: 'mh-m008-3', plan: 'Quarterly', startDate: '2026-07-28', endDate: '2026-10-28', amount: 4000, status: 'ACTIVE' },
      { id: 'mh-m008-2', plan: 'Quarterly', startDate: '2026-04-28', endDate: '2026-07-27', amount: 4000, status: 'EXPIRED' },
      { id: 'mh-m008-1', plan: 'Quarterly', startDate: '2026-01-28', endDate: '2026-04-27', amount: 4000, status: 'EXPIRED' },
    ],
    attendanceSummary: { visitsThisMonth: 14, lastVisitDate: '2026-09-25', averageVisitsPerWeek: 3.5 },
    paymentHistory: [
      { receiptId: 'R-1060', plan: 'Quarterly', amount: 4000, method: 'UPI', date: '2026-07-28' },
      { receiptId: 'R-1010', plan: 'Quarterly', amount: 4000, method: 'UPI', date: '2026-04-28' },
      { receiptId: 'R-0955', plan: 'Quarterly', amount: 4000, method: 'UPI', date: '2026-01-28' },
    ],
  },

  m009: {
    membershipHistory: [
      { id: 'mh-m009-2', plan: 'Half-Yearly', startDate: '2026-02-22', endDate: '2026-08-22', amount: 7000, status: 'EXPIRED' },
      { id: 'mh-m009-1', plan: 'Half-Yearly', startDate: '2025-08-22', endDate: '2026-02-21', amount: 7000, status: 'EXPIRED' },
    ],
    attendanceSummary: { visitsThisMonth: 0, lastVisitDate: '2026-08-20', averageVisitsPerWeek: 0 },
    paymentHistory: [
      { receiptId: 'R-0998', plan: 'Half-Yearly', amount: 7000, method: 'Net Banking', date: '2026-02-22' },
      { receiptId: 'R-0921', plan: 'Half-Yearly', amount: 7000, method: 'Net Banking', date: '2025-08-22' },
    ],
  },

  m010: {
    membershipHistory: [
      { id: 'mh-m010-1', plan: 'Annual', startDate: '2026-03-08', endDate: '2027-03-08', amount: 12000, status: 'ACTIVE' },
    ],
    attendanceSummary: { visitsThisMonth: 20, lastVisitDate: '2026-09-26', averageVisitsPerWeek: 5.0 },
    paymentHistory: [
      { receiptId: 'R-1002', plan: 'Annual', amount: 12000, method: 'Card', date: '2026-03-08' },
    ],
  },

  m011: {
    membershipHistory: [
      { id: 'mh-m011-4', plan: 'Monthly', startDate: '2026-09-14', endDate: '2026-10-14', amount: 1500, status: 'ACTIVE' },
      { id: 'mh-m011-3', plan: 'Monthly', startDate: '2026-08-14', endDate: '2026-09-13', amount: 1500, status: 'EXPIRED' },
      { id: 'mh-m011-2', plan: 'Monthly', startDate: '2026-07-14', endDate: '2026-08-13', amount: 1500, status: 'EXPIRED' },
    ],
    attendanceSummary: { visitsThisMonth: 6, lastVisitDate: '2026-09-21', averageVisitsPerWeek: 1.5 },
    paymentHistory: [
      { receiptId: 'R-1079', plan: 'Monthly', amount: 1500, method: 'UPI', date: '2026-09-14' },
      { receiptId: 'R-1048', plan: 'Monthly', amount: 1500, method: 'UPI', date: '2026-08-14' },
      { receiptId: 'R-1019', plan: 'Monthly', amount: 1500, method: 'UPI', date: '2026-07-14' },
    ],
  },

  m012: {
    membershipHistory: [
      { id: 'mh-m012-1', plan: 'Quarterly', startDate: '2025-09-05', endDate: '2025-12-05', amount: 4000, status: 'CANCELLED' },
    ],
    attendanceSummary: { visitsThisMonth: 0, lastVisitDate: '2025-11-10', averageVisitsPerWeek: 0 },
    paymentHistory: [
      { receiptId: 'R-0935', plan: 'Quarterly', amount: 4000, method: 'Card', date: '2025-09-05' },
    ],
  },

  m013: {
    membershipHistory: [
      { id: 'mh-m013-2', plan: 'Annual', startDate: '2026-02-17', endDate: '2027-02-17', amount: 12000, status: 'ACTIVE' },
      { id: 'mh-m013-1', plan: 'Annual', startDate: '2025-02-17', endDate: '2026-02-16', amount: 11000, status: 'EXPIRED' },
    ],
    attendanceSummary: { visitsThisMonth: 16, lastVisitDate: '2026-09-24', averageVisitsPerWeek: 4.0 },
    paymentHistory: [
      { receiptId: 'R-0999', plan: 'Annual', amount: 12000, method: 'Net Banking', date: '2026-02-17' },
      { receiptId: 'R-0876', plan: 'Annual', amount: 11000, method: 'Net Banking', date: '2025-02-17' },
    ],
  },

  m014: {
    membershipHistory: [
      { id: 'mh-m014-1', plan: 'Half-Yearly', startDate: '2026-04-25', endDate: '2026-10-25', amount: 7000, status: 'ACTIVE' },
    ],
    attendanceSummary: { visitsThisMonth: 11, lastVisitDate: '2026-09-25', averageVisitsPerWeek: 2.8 },
    paymentHistory: [
      { receiptId: 'R-1014', plan: 'Half-Yearly', amount: 7000, method: 'UPI', date: '2026-04-25' },
    ],
  },

  m015: {
    membershipHistory: [
      { id: 'mh-m015-3', plan: 'Monthly', startDate: '2026-08-03', endDate: '2026-09-03', amount: 1500, status: 'EXPIRED' },
      { id: 'mh-m015-2', plan: 'Monthly', startDate: '2026-07-03', endDate: '2026-08-02', amount: 1500, status: 'EXPIRED' },
      { id: 'mh-m015-1', plan: 'Monthly', startDate: '2025-10-03', endDate: '2025-11-02', amount: 1500, status: 'EXPIRED' },
    ],
    attendanceSummary: { visitsThisMonth: 0, lastVisitDate: '2026-09-01', averageVisitsPerWeek: 0 },
    paymentHistory: [
      { receiptId: 'R-1062', plan: 'Monthly', amount: 1500, method: 'Cash', date: '2026-08-03' },
      { receiptId: 'R-1033', plan: 'Monthly', amount: 1500, method: 'Cash', date: '2026-07-03' },
    ],
  },

  m016: {
    membershipHistory: [
      { id: 'mh-m016-3', plan: 'Quarterly', startDate: '2026-07-19', endDate: '2026-10-19', amount: 4000, status: 'ACTIVE' },
      { id: 'mh-m016-2', plan: 'Quarterly', startDate: '2026-04-19', endDate: '2026-07-18', amount: 4000, status: 'EXPIRED' },
      { id: 'mh-m016-1', plan: 'Quarterly', startDate: '2026-01-19', endDate: '2026-04-18', amount: 4000, status: 'EXPIRED' },
    ],
    attendanceSummary: { visitsThisMonth: 9, lastVisitDate: '2026-09-22', averageVisitsPerWeek: 2.3 },
    paymentHistory: [
      { receiptId: 'R-1058', plan: 'Quarterly', amount: 4000, method: 'UPI', date: '2026-07-19' },
      { receiptId: 'R-1007', plan: 'Quarterly', amount: 4000, method: 'UPI', date: '2026-04-19' },
      { receiptId: 'R-0957', plan: 'Quarterly', amount: 4000, method: 'UPI', date: '2026-01-19' },
    ],
  },

  m017: {
    membershipHistory: [
      { id: 'mh-m017-1', plan: 'Annual', startDate: '2026-05-30', endDate: '2027-05-30', amount: 12000, status: 'ACTIVE' },
    ],
    attendanceSummary: { visitsThisMonth: 13, lastVisitDate: '2026-09-25', averageVisitsPerWeek: 3.3 },
    paymentHistory: [
      { receiptId: 'R-1025', plan: 'Annual', amount: 12000, method: 'Card', date: '2026-05-30' },
    ],
  },

  m018: {
    membershipHistory: [
      { id: 'mh-m018-2', plan: 'Monthly', startDate: '2026-08-07', endDate: '2026-09-07', amount: 1500, status: 'SUSPENDED' },
      { id: 'mh-m018-1', plan: 'Monthly', startDate: '2026-07-07', endDate: '2026-08-06', amount: 1500, status: 'EXPIRED' },
    ],
    attendanceSummary: { visitsThisMonth: 0, lastVisitDate: '2026-08-25', averageVisitsPerWeek: 0 },
    paymentHistory: [
      { receiptId: 'R-1064', plan: 'Monthly', amount: 1500, method: 'Cash', date: '2026-08-07' },
      { receiptId: 'R-1035', plan: 'Monthly', amount: 1500, method: 'Cash', date: '2026-07-07' },
    ],
  },

  m019: {
    membershipHistory: [
      { id: 'mh-m019-2', plan: 'Half-Yearly', startDate: '2026-03-22', endDate: '2026-09-22', amount: 7000, status: 'ACTIVE' },
      { id: 'mh-m019-1', plan: 'Half-Yearly', startDate: '2025-09-22', endDate: '2026-03-21', amount: 7000, status: 'EXPIRED' },
    ],
    attendanceSummary: { visitsThisMonth: 7, lastVisitDate: '2026-09-20', averageVisitsPerWeek: 1.8 },
    paymentHistory: [
      { receiptId: 'R-1004', plan: 'Half-Yearly', amount: 7000, method: 'UPI', date: '2026-03-22' },
      { receiptId: 'R-0924', plan: 'Half-Yearly', amount: 7000, method: 'UPI', date: '2025-09-22' },
    ],
  },

  m020: {
    membershipHistory: [
      { id: 'mh-m020-1', plan: 'Annual', startDate: '2025-07-15', endDate: '2026-07-14', amount: 12000, status: 'CANCELLED' },
    ],
    attendanceSummary: { visitsThisMonth: 0, lastVisitDate: '2025-10-30', averageVisitsPerWeek: 0 },
    paymentHistory: [
      { receiptId: 'R-0908', plan: 'Annual', amount: 12000, method: 'Net Banking', date: '2025-07-15' },
    ],
  },
}
