import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/app/layouts/AppLayout'
import { AttendancePage } from '@/features/attendance/AttendancePage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { ExpensesPage } from '@/features/expenses/ExpensesPage'
import { LeadsPage } from '@/features/leads/LeadsPage'
import { MemberDetailsPage } from '@/features/members/MemberDetailsPage'
import { MembersPage } from '@/features/members/MembersPage'
import { MembershipsPage } from '@/features/memberships/MembershipsPage'
import { NotFoundPage } from '@/features/not-found/NotFoundPage'
import { PaymentsPage } from '@/features/payments/PaymentsPage'
import { ReportsPage } from '@/features/reports/ReportsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { TrainersPage } from '@/features/trainers/TrainersPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'members', element: <MembersPage /> },
      { path: 'members/:memberId', element: <MemberDetailsPage /> },
      { path: 'memberships', element: <MembershipsPage /> },
      { path: 'attendance', element: <AttendancePage /> },
      { path: 'payments', element: <PaymentsPage /> },
      { path: 'trainers', element: <TrainersPage /> },
      { path: 'leads', element: <LeadsPage /> },
      { path: 'expenses', element: <ExpensesPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
