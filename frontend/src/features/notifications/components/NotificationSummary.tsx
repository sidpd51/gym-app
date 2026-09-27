import { AlertTriangle, Bell, CheckCircle2, Clock } from 'lucide-react'
import { StatCard } from '@/features/dashboard/components/StatCard'
import { useNotifications } from '../hooks/useNotifications'
import { getExpiringMemberships, getExpiredMemberships } from '../utils/expiry.utils'

export function NotificationSummary() {
  const { notifications } = useNotifications()
  const expiringSoon = getExpiringMemberships(7).length
  const expired = getExpiredMemberships().length
  const pending = notifications.filter((n) => n.status === 'PENDING').length
  const sent = notifications.filter((n) => n.status === 'SENT').length

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatCard
        title="Expiring Soon"
        value={expiringSoon}
        description="Within 7 days"
        icon={Clock}
        iconContainerClassName="bg-amber-100"
        iconColorClassName="text-amber-600"
      />
      <StatCard
        title="Expired Memberships"
        value={expired}
        description="Needs renewal"
        icon={AlertTriangle}
        iconContainerClassName="bg-red-100"
        iconColorClassName="text-red-600"
      />
      <StatCard
        title="Reminders Pending"
        value={pending}
        description="Awaiting delivery"
        icon={Bell}
        iconContainerClassName="bg-blue-100"
        iconColorClassName="text-blue-600"
      />
      <StatCard
        title="Reminders Sent"
        value={sent}
        description="All time"
        icon={CheckCircle2}
        iconContainerClassName="bg-green-100"
        iconColorClassName="text-green-600"
      />
    </div>
  )
}
