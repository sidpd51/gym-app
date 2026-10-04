package common

import "testing"

func TestHasPermission_RoleCoverage(t *testing.T) {
	cases := []struct {
		role     Role
		wantSize int
	}{
		{RoleOwner, len(AllPermissions)},
		{RoleAdmin, len(AllPermissions) - 2}, // minus users:delete, settings:edit
		{RoleReceptionist, 20},
		{RoleTrainer, 9},
	}
	for _, c := range cases {
		if got := len(PermissionsFor(c.role)); got != c.wantSize {
			t.Errorf("%s: got %d permissions, want %d", c.role, got, c.wantSize)
		}
	}
}

func TestHasPermission_SpecificRules(t *testing.T) {
	cases := []struct {
		name string
		role Role
		perm Permission
		want bool
	}{
		{"owner has users:delete", RoleOwner, PermUsersDelete, true},
		{"owner has settings:edit", RoleOwner, PermSettingsEdit, true},
		{"admin lacks users:delete", RoleAdmin, PermUsersDelete, false},
		{"admin lacks settings:edit", RoleAdmin, PermSettingsEdit, false},
		{"admin has users:view", RoleAdmin, PermUsersView, true},
		{"admin has reports:view", RoleAdmin, PermReportsView, true},
		{"receptionist can mark attendance", RoleReceptionist, PermAttendanceMark, true},
		{"receptionist cannot delete members", RoleReceptionist, PermMembersDelete, false},
		{"receptionist cannot view audit logs", RoleReceptionist, PermAuditLogsView, false},
		{"trainer can view members", RoleTrainer, PermMembersView, true},
		{"trainer cannot create members", RoleTrainer, PermMembersCreate, false},
		{"trainer cannot view payments", RoleTrainer, PermPaymentsView, false},
		{"unknown role has no permissions", Role("GUEST"), PermDashboardView, false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := HasPermission(c.role, c.perm); got != c.want {
				t.Errorf("HasPermission(%s, %s) = %v, want %v", c.role, c.perm, got, c.want)
			}
		})
	}
}

func TestAllPermissionsHasNoDuplicates(t *testing.T) {
	seen := make(map[Permission]bool, len(AllPermissions))
	for _, p := range AllPermissions {
		if seen[p] {
			t.Errorf("duplicate permission %q in AllPermissions", p)
		}
		seen[p] = true
	}
}
