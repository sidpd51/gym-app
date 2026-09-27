import { useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NotificationRecord, NotificationTab } from './types/notification.types'
import { NOTIFICATION_TABS } from './types/notification.types'
import { notificationsMockData } from './data/notifications.mock'
import { NotificationSummary } from './components/NotificationSummary'
import { ExpiringMemberships } from './components/ExpiringMemberships'
import { ExpiredMemberships } from './components/ExpiredMemberships'
import { ReminderHistory } from './components/ReminderHistory'
import { CreateReminderDialog } from './components/CreateReminderDialog'

export function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<NotificationTab>('expiring')
  const [records, setRecords] = useState<NotificationRecord[]>(notificationsMockData)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogDefaultMemberId, setDialogDefaultMemberId] = useState('')
  const [dialogDefaultMembershipId, setDialogDefaultMembershipId] = useState('')

  function openDialog(memberId = '', membershipId = '') {
    setDialogDefaultMemberId(memberId)
    setDialogDefaultMembershipId(membershipId)
    setDialogOpen(true)
  }

  function handleCreated(record: NotificationRecord) {
    setRecords((prev) => [record, ...prev])
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Notifications</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Track expiring memberships and manage reminder records.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openDialog()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          <Plus size={15} aria-hidden="true" />
          Create Reminder
        </button>
      </div>

      {/* Summary cards */}
      <NotificationSummary />

      {/* Tabs */}
      <div>
        <div
          className="flex border-b border-zinc-200"
          role="tablist"
          aria-label="Notification sections"
        >
          {NOTIFICATION_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-b-2 border-zinc-900 text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="pt-5">
          {activeTab === 'expiring' && (
            <ExpiringMemberships
              onCreateReminder={(memberId, membershipId) => openDialog(memberId, membershipId)}
            />
          )}
          {activeTab === 'expired' && (
            <ExpiredMemberships
              onCreateReminder={(memberId, membershipId) => openDialog(memberId, membershipId)}
            />
          )}
          {activeTab === 'history' && <ReminderHistory records={records} />}
        </div>
      </div>

      {/* Create reminder dialog */}
      <CreateReminderDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={handleCreated}
        defaultMemberId={dialogDefaultMemberId}
        defaultMembershipId={dialogDefaultMembershipId}
      />
    </div>
  )
}
