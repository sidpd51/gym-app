package common

// Role mirrors the user_role enum in the database and the UserRole type in
// frontend/src/features/users/types/user.types.ts.
type Role string

const (
	RoleOwner        Role = "OWNER"
	RoleAdmin        Role = "ADMIN"
	RoleReceptionist Role = "RECEPTIONIST"
	RoleTrainer      Role = "TRAINER"
)

// Permission mirrors the Permission string-literal union in
// frontend/src/features/auth/permissions/permissions.ts verbatim.
type Permission string

const (
	PermDashboardView       Permission = "dashboard:view"
	PermMembersView         Permission = "members:view"
	PermMembersCreate       Permission = "members:create"
	PermMembersEdit         Permission = "members:edit"
	PermMembersDelete       Permission = "members:delete"
	PermMembershipsView     Permission = "memberships:view"
	PermMembershipsCreate   Permission = "memberships:create"
	PermPlansView           Permission = "membership-plans:view"
	PermPlansCreate         Permission = "membership-plans:create"
	PermPlansEdit           Permission = "membership-plans:edit"
	PermPlansDelete         Permission = "membership-plans:delete"
	PermAttendanceView      Permission = "attendance:view"
	PermAttendanceMark      Permission = "attendance:mark"
	PermPaymentsView        Permission = "payments:view"
	PermPaymentsRecord      Permission = "payments:record"
	PermTrainersView        Permission = "trainers:view"
	PermTrainersCreate      Permission = "trainers:create"
	PermTrainersEdit        Permission = "trainers:edit"
	PermTrainersDelete      Permission = "trainers:delete"
	PermLeadsView           Permission = "leads:view"
	PermLeadsCreate         Permission = "leads:create"
	PermLeadsEdit           Permission = "leads:edit"
	PermLeadsDelete         Permission = "leads:delete"
	PermExpensesView        Permission = "expenses:view"
	PermExpensesCreate      Permission = "expenses:create"
	PermExpensesEdit        Permission = "expenses:edit"
	PermExpensesDelete      Permission = "expenses:delete"
	PermInventoryView       Permission = "inventory:view"
	PermInventoryCreate     Permission = "inventory:create"
	PermInventoryEdit       Permission = "inventory:edit"
	PermInventoryDelete     Permission = "inventory:delete"
	PermEquipmentView       Permission = "equipment:view"
	PermEquipmentCreate     Permission = "equipment:create"
	PermEquipmentEdit       Permission = "equipment:edit"
	PermEquipmentDelete     Permission = "equipment:delete"
	PermEquipmentMaintain   Permission = "equipment:maintenance"
	PermReportsView         Permission = "reports:view"
	PermUsersView           Permission = "users:view"
	PermUsersCreate         Permission = "users:create"
	PermUsersEdit           Permission = "users:edit"
	PermUsersDelete         Permission = "users:delete"
	PermSettingsView        Permission = "settings:view"
	PermSettingsEdit        Permission = "settings:edit"
	PermNotificationsView   Permission = "notifications:view"
	PermNotificationsCreate Permission = "notifications:create"
	PermProfileView         Permission = "profile:view"
	PermProfileUpdate       Permission = "profile:update"
	PermAuditLogsView       Permission = "audit-logs:view"
)

// AllPermissions lists every defined permission in declaration order.
var AllPermissions = []Permission{
	PermDashboardView,
	PermMembersView, PermMembersCreate, PermMembersEdit, PermMembersDelete,
	PermMembershipsView, PermMembershipsCreate,
	PermPlansView, PermPlansCreate, PermPlansEdit, PermPlansDelete,
	PermAttendanceView, PermAttendanceMark,
	PermPaymentsView, PermPaymentsRecord,
	PermTrainersView, PermTrainersCreate, PermTrainersEdit, PermTrainersDelete,
	PermLeadsView, PermLeadsCreate, PermLeadsEdit, PermLeadsDelete,
	PermExpensesView, PermExpensesCreate, PermExpensesEdit, PermExpensesDelete,
	PermInventoryView, PermInventoryCreate, PermInventoryEdit, PermInventoryDelete,
	PermEquipmentView, PermEquipmentCreate, PermEquipmentEdit, PermEquipmentDelete, PermEquipmentMaintain,
	PermReportsView,
	PermUsersView, PermUsersCreate, PermUsersEdit, PermUsersDelete,
	PermSettingsView, PermSettingsEdit,
	PermNotificationsView, PermNotificationsCreate,
	PermProfileView, PermProfileUpdate,
	PermAuditLogsView,
}

// rolePermissions mirrors the TS source — see note above.
var rolePermissions = map[Role]map[Permission]struct{}{
	RoleOwner:        permSet(AllPermissions),
	RoleAdmin:        permSet(filterPerms(AllPermissions, PermUsersDelete, PermSettingsEdit)),
	RoleReceptionist: permSet([]Permission{
		PermDashboardView,
		PermMembersView, PermMembersCreate, PermMembersEdit,
		PermMembershipsView, PermMembershipsCreate,
		PermPlansView,
		PermAttendanceView, PermAttendanceMark,
		PermPaymentsView, PermPaymentsRecord,
		PermTrainersView,
		PermLeadsView, PermLeadsCreate, PermLeadsEdit,
		PermInventoryView,
		PermNotificationsView, PermNotificationsCreate,
		PermProfileView, PermProfileUpdate,
	}),
	RoleTrainer: permSet([]Permission{
		PermDashboardView,
		PermMembersView,
		PermMembershipsView,
		PermAttendanceView, PermAttendanceMark,
		PermTrainersView,
		PermNotificationsView,
		PermProfileView, PermProfileUpdate,
	}),
}

// HasPermission reports whether the role is granted the given permission.
func HasPermission(role Role, perm Permission) bool {
	perms, ok := rolePermissions[role]
	if !ok {
		return false
	}
	_, ok = perms[perm]
	return ok
}

// PermissionsFor returns the set of permissions granted to a role.
// Returned slice is a copy — safe to modify.
func PermissionsFor(role Role) []Permission {
	perms, ok := rolePermissions[role]
	if !ok {
		return nil
	}
	out := make([]Permission, 0, len(perms))
	for p := range perms {
		out = append(out, p)
	}
	return out
}

func permSet(ps []Permission) map[Permission]struct{} {
	m := make(map[Permission]struct{}, len(ps))
	for _, p := range ps {
		m[p] = struct{}{}
	}
	return m
}

func filterPerms(ps []Permission, exclude ...Permission) []Permission {
	drop := permSet(exclude)
	out := make([]Permission, 0, len(ps))
	for _, p := range ps {
		if _, skip := drop[p]; skip {
			continue
		}
		out = append(out, p)
	}
	return out
}
