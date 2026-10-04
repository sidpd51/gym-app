-- name: ReportActiveMemberCount :one
SELECT COUNT(*)::bigint FROM members WHERE status = 'ACTIVE';

-- name: ReportNewMemberCount :one
SELECT COUNT(*)::bigint FROM members
WHERE joining_date >= $1 AND joining_date <= $2;

-- name: ReportAttendanceCount :one
SELECT COUNT(*)::bigint FROM attendance
WHERE attendance_date >= $1 AND attendance_date <= $2;

-- name: ReportNewLeadCount :one
SELECT COUNT(*)::bigint FROM leads
WHERE created_at::date >= $1 AND created_at::date <= $2;

-- name: ReportRevenueByMonth :many
SELECT TO_CHAR(payment_date, 'Mon ''YY') AS month,
       DATE_TRUNC('month', payment_date)::date AS month_date,
       COALESCE(SUM(amount), 0)::numeric AS revenue
FROM payments
WHERE status = 'COMPLETED'
  AND payment_date >= $1 AND payment_date <= $2
GROUP BY month, month_date
ORDER BY month_date;

-- name: ReportExpensesByMonth :many
SELECT TO_CHAR(expense_date, 'Mon ''YY') AS month,
       DATE_TRUNC('month', expense_date)::date AS month_date,
       COALESCE(SUM(amount), 0)::numeric AS expenses
FROM expenses
WHERE expense_date >= $1 AND expense_date <= $2
GROUP BY month, month_date
ORDER BY month_date;
