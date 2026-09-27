import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/app/layouts/AppLayout'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ProfilePage } from '@/features/auth/pages/ProfilePage'
import { AttendancePage } from '@/features/attendance/AttendancePage'
import { MarkAttendancePage } from '@/features/attendance/MarkAttendancePage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { CreateExpensePage } from '@/features/expenses/CreateExpensePage'
import { EditExpensePage } from '@/features/expenses/EditExpensePage'
import { ExpenseDetailsPage } from '@/features/expenses/ExpenseDetailsPage'
import { ExpensesPage } from '@/features/expenses/ExpensesPage'
import { CreateInventoryItemPage } from '@/features/inventory/CreateInventoryItemPage'
import { EditInventoryItemPage } from '@/features/inventory/EditInventoryItemPage'
import { InventoryItemDetailsPage } from '@/features/inventory/InventoryItemDetailsPage'
import { InventoryPage } from '@/features/inventory/InventoryPage'
import { AddMaintenancePage } from '@/features/equipment/AddMaintenancePage'
import { CreateEquipmentPage } from '@/features/equipment/CreateEquipmentPage'
import { EditEquipmentPage } from '@/features/equipment/EditEquipmentPage'
import { EquipmentDetailsPage } from '@/features/equipment/EquipmentDetailsPage'
import { EquipmentPage } from '@/features/equipment/EquipmentPage'
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
import { UnauthorizedPage } from '@/features/auth/pages/UnauthorizedPage'
import { PaymentDetailsPage } from '@/features/payments/PaymentDetailsPage'
import { PaymentsPage } from '@/features/payments/PaymentsPage'
import { RecordPaymentPage } from '@/features/payments/RecordPaymentPage'
import { NotificationsPage } from '@/features/notifications/NotificationsPage'
import { ReportsPage } from '@/features/reports/ReportsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { CreateTrainerPage } from '@/features/trainers/CreateTrainerPage'
import { EditTrainerPage } from '@/features/trainers/EditTrainerPage'
import { TrainerDetailsPage } from '@/features/trainers/TrainerDetailsPage'
import { TrainersPage } from '@/features/trainers/TrainersPage'
import { CreateUserPage } from '@/features/users/pages/CreateUserPage'
import { EditUserPage } from '@/features/users/pages/EditUserPage'
import { UserDetailsPage } from '@/features/users/pages/UserDetailsPage'
import { UsersPage } from '@/features/users/pages/UsersPage'
import { AuditLogsPage } from '@/features/audit-logs/AuditLogsPage'
import { AuditLogDetailsPage } from '@/features/audit-logs/AuditLogDetailsPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <ProtectedRoute requiredPermission="dashboard:view"><DashboardPage /></ProtectedRoute> },
      { path: 'members', element: <ProtectedRoute requiredPermission="members:view"><MembersPage /></ProtectedRoute> },
      { path: 'members/new', element: <ProtectedRoute requiredPermission="members:create"><CreateMemberPage /></ProtectedRoute> },
      { path: 'members/:memberId/membership/new', element: <ProtectedRoute requiredPermission="memberships:create"><CreateMembershipPage /></ProtectedRoute> },
      { path: 'members/:memberId/trainer/assign', element: <ProtectedRoute requiredPermission="members:edit"><TrainerAssignmentPage /></ProtectedRoute> },
      { path: 'members/:memberId', element: <ProtectedRoute requiredPermission="members:view"><MemberDetailsPage /></ProtectedRoute> },
      { path: 'memberships', element: <ProtectedRoute requiredPermission="memberships:view"><MembershipsPage /></ProtectedRoute> },
      { path: 'membership-plans', element: <ProtectedRoute requiredPermission="membership-plans:view"><MembershipPlansPage /></ProtectedRoute> },
      { path: 'membership-plans/new', element: <ProtectedRoute requiredPermission="membership-plans:create"><CreateMembershipPlanPage /></ProtectedRoute> },
      { path: 'membership-plans/:planId/edit', element: <ProtectedRoute requiredPermission="membership-plans:edit"><EditMembershipPlanPage /></ProtectedRoute> },
      { path: 'attendance', element: <ProtectedRoute requiredPermission="attendance:view"><AttendancePage /></ProtectedRoute> },
      { path: 'attendance/new', element: <ProtectedRoute requiredPermission="attendance:mark"><MarkAttendancePage /></ProtectedRoute> },
      { path: 'payments', element: <ProtectedRoute requiredPermission="payments:view"><PaymentsPage /></ProtectedRoute> },
      { path: 'payments/new', element: <ProtectedRoute requiredPermission="payments:record"><RecordPaymentPage /></ProtectedRoute> },
      { path: 'payments/:paymentId', element: <ProtectedRoute requiredPermission="payments:view"><PaymentDetailsPage /></ProtectedRoute> },
      { path: 'trainers', element: <ProtectedRoute requiredPermission="trainers:view"><TrainersPage /></ProtectedRoute> },
      { path: 'trainers/new', element: <ProtectedRoute requiredPermission="trainers:create"><CreateTrainerPage /></ProtectedRoute> },
      { path: 'trainers/:trainerId/edit', element: <ProtectedRoute requiredPermission="trainers:edit"><EditTrainerPage /></ProtectedRoute> },
      { path: 'trainers/:trainerId', element: <ProtectedRoute requiredPermission="trainers:view"><TrainerDetailsPage /></ProtectedRoute> },
      { path: 'leads', element: <ProtectedRoute requiredPermission="leads:view"><LeadsPage /></ProtectedRoute> },
      { path: 'leads/new', element: <ProtectedRoute requiredPermission="leads:create"><CreateLeadPage /></ProtectedRoute> },
      { path: 'leads/:leadId/edit', element: <ProtectedRoute requiredPermission="leads:edit"><EditLeadPage /></ProtectedRoute> },
      { path: 'leads/:leadId', element: <ProtectedRoute requiredPermission="leads:view"><LeadDetailsPage /></ProtectedRoute> },
      { path: 'expenses', element: <ProtectedRoute requiredPermission="expenses:view"><ExpensesPage /></ProtectedRoute> },
      { path: 'expenses/new', element: <ProtectedRoute requiredPermission="expenses:create"><CreateExpensePage /></ProtectedRoute> },
      { path: 'expenses/:expenseId/edit', element: <ProtectedRoute requiredPermission="expenses:edit"><EditExpensePage /></ProtectedRoute> },
      { path: 'expenses/:expenseId', element: <ProtectedRoute requiredPermission="expenses:view"><ExpenseDetailsPage /></ProtectedRoute> },
      { path: 'inventory', element: <ProtectedRoute requiredPermission="inventory:view"><InventoryPage /></ProtectedRoute> },
      { path: 'inventory/new', element: <ProtectedRoute requiredPermission="inventory:create"><CreateInventoryItemPage /></ProtectedRoute> },
      { path: 'inventory/:itemId/edit', element: <ProtectedRoute requiredPermission="inventory:edit"><EditInventoryItemPage /></ProtectedRoute> },
      { path: 'inventory/:itemId', element: <ProtectedRoute requiredPermission="inventory:view"><InventoryItemDetailsPage /></ProtectedRoute> },
      { path: 'equipment', element: <ProtectedRoute requiredPermission="equipment:view"><EquipmentPage /></ProtectedRoute> },
      { path: 'equipment/new', element: <ProtectedRoute requiredPermission="equipment:create"><CreateEquipmentPage /></ProtectedRoute> },
      { path: 'equipment/:equipmentId/edit', element: <ProtectedRoute requiredPermission="equipment:edit"><EditEquipmentPage /></ProtectedRoute> },
      { path: 'equipment/:equipmentId/maintenance/new', element: <ProtectedRoute requiredPermission="equipment:maintenance"><AddMaintenancePage /></ProtectedRoute> },
      { path: 'equipment/:equipmentId', element: <ProtectedRoute requiredPermission="equipment:view"><EquipmentDetailsPage /></ProtectedRoute> },
      { path: 'reports', element: <ProtectedRoute requiredPermission="reports:view"><ReportsPage /></ProtectedRoute> },
      { path: 'notifications', element: <ProtectedRoute requiredPermission="notifications:view"><NotificationsPage /></ProtectedRoute> },
      { path: 'settings', element: <ProtectedRoute requiredPermission="settings:view"><SettingsPage /></ProtectedRoute> },
      { path: 'profile', element: <ProtectedRoute requiredPermission="profile:view"><ProfilePage /></ProtectedRoute> },
      { path: 'users', element: <ProtectedRoute requiredPermission="users:view"><UsersPage /></ProtectedRoute> },
      { path: 'users/new', element: <ProtectedRoute requiredPermission="users:create"><CreateUserPage /></ProtectedRoute> },
      { path: 'users/:userId/edit', element: <ProtectedRoute requiredPermission="users:edit"><EditUserPage /></ProtectedRoute> },
      { path: 'users/:userId', element: <ProtectedRoute requiredPermission="users:view"><UserDetailsPage /></ProtectedRoute> },
      { path: 'audit-logs', element: <ProtectedRoute requiredPermission="audit-logs:view"><AuditLogsPage /></ProtectedRoute> },
      { path: 'audit-logs/:auditLogId', element: <ProtectedRoute requiredPermission="audit-logs:view"><AuditLogDetailsPage /></ProtectedRoute> },
      { path: 'unauthorized', element: <UnauthorizedPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
