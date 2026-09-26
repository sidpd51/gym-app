import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/app/layouts/AppLayout'
import { AttendancePage } from '@/features/attendance/AttendancePage'
import { MarkAttendancePage } from '@/features/attendance/MarkAttendancePage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { ExpensesPage } from '@/features/expenses/ExpensesPage'
import { CreateLeadPage } from '@/features/leads/CreateLeadPage'
import { EditLeadPage } from '@/features/leads/EditLeadPage'
import { LeadDetailsPage } from '@/features/leads/LeadDetailsPage'
import { LeadsPage } from '@/features/leads/LeadsPage'
import { CreateMemberPage } from '@/features/members/CreateMemberPage'
import { MemberDetailsPage } from '@/features/members/MemberDetailsPage'
import { MembersPage } from '@/features/members/MembersPage'
import { TrainerAssignmentPage } from '@/features/member-trainer/TrainerAssignmentPage'
import { CreateMembershipPage } from '@/features/memberships/CreateMembershipPage'
import { MembershipsPage } from '@/features/memberships/MembershipsPage'
import { CreateMembershipPlanPage } from '@/features/membership-plans/CreateMembershipPlanPage'
import { EditMembershipPlanPage } from '@/features/membership-plans/EditMembershipPlanPage'
import { MembershipPlansPage } from '@/features/membership-plans/MembershipPlansPage'
import { NotFoundPage } from '@/features/not-found/NotFoundPage'
import { PaymentDetailsPage } from '@/features/payments/PaymentDetailsPage'
import { PaymentsPage } from '@/features/payments/PaymentsPage'
import { RecordPaymentPage } from '@/features/payments/RecordPaymentPage'
import { ReportsPage } from '@/features/reports/ReportsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { CreateTrainerPage } from '@/features/trainers/CreateTrainerPage'
import { EditTrainerPage } from '@/features/trainers/EditTrainerPage'
import { TrainerDetailsPage } from '@/features/trainers/TrainerDetailsPage'
import { TrainersPage } from '@/features/trainers/TrainersPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'members', element: <MembersPage /> },
      { path: 'members/new', element: <CreateMemberPage /> },
      { path: 'members/:memberId/membership/new', element: <CreateMembershipPage /> },
      { path: 'members/:memberId/trainer/assign', element: <TrainerAssignmentPage /> },
      { path: 'members/:memberId', element: <MemberDetailsPage /> },
      { path: 'memberships', element: <MembershipsPage /> },
      { path: 'membership-plans', element: <MembershipPlansPage /> },
      { path: 'membership-plans/new', element: <CreateMembershipPlanPage /> },
      { path: 'membership-plans/:planId/edit', element: <EditMembershipPlanPage /> },
      { path: 'attendance', element: <AttendancePage /> },
      { path: 'attendance/new', element: <MarkAttendancePage /> },
      { path: 'payments', element: <PaymentsPage /> },
      { path: 'payments/new', element: <RecordPaymentPage /> },
      { path: 'payments/:paymentId', element: <PaymentDetailsPage /> },
      { path: 'trainers', element: <TrainersPage /> },
      { path: 'trainers/new', element: <CreateTrainerPage /> },
      { path: 'trainers/:trainerId/edit', element: <EditTrainerPage /> },
      { path: 'trainers/:trainerId', element: <TrainerDetailsPage /> },
      { path: 'leads', element: <LeadsPage /> },
      { path: 'leads/new', element: <CreateLeadPage /> },
      { path: 'leads/:leadId/edit', element: <EditLeadPage /> },
      { path: 'leads/:leadId', element: <LeadDetailsPage /> },
      { path: 'expenses', element: <ExpensesPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
