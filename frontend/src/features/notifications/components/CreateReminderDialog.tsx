import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMembers } from '@/features/members/hooks/useMembers'
import { useMemberships } from '@/features/memberships/hooks/useMemberships'
import type { NotificationRecord } from '../types/notification.types'
import { createReminderSchema, type CreateReminderFormValues } from '../schemas/notification.schema'
import { CHANNEL_LABELS } from '../utils/notification.utils'

const CHANNELS = ['SMS', 'WHATSAPP', 'EMAIL', 'IN_APP'] as const
const SIMULATED_CHANNELS = new Set(['SMS', 'WHATSAPP', 'EMAIL'])

interface CreateReminderDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (record: NotificationRecord) => void
  defaultMemberId?: string
  defaultMembershipId?: string
}

function inputCls(hasError: boolean) {
  return cn(
    'w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2',
    hasError
      ? 'border-red-300 bg-red-50 focus:ring-red-400'
      : 'border-zinc-200 bg-white focus:ring-blue-500'
  )
}

export function CreateReminderDialog({
  open,
  onClose,
  onCreated,
  defaultMemberId = '',
  defaultMembershipId = '',
}: CreateReminderDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateReminderFormValues>({
    resolver: zodResolver(createReminderSchema),
    defaultValues: {
      memberId: defaultMemberId,
      membershipId: defaultMembershipId,
      channel: 'SMS',
      message: '',
    },
  })

  const { members } = useMembers()
  const { memberships } = useMemberships()

  const selectedMemberId = watch('memberId')
  const selectedChannel = watch('channel')

  const memberMemberships = memberships.filter(
    (ms) => ms.memberId === selectedMemberId && ms.status !== 'CANCELLED'
  )

  useEffect(() => {
    if (open) {
      reset({
        memberId: defaultMemberId,
        membershipId: defaultMembershipId,
        channel: 'SMS',
        message: '',
      })
    }
  }, [open, defaultMemberId, defaultMembershipId, reset])

  function onSubmit(data: CreateReminderFormValues) {
    const newRecord: NotificationRecord = {
      id: `notif${Date.now()}`,
      memberId: data.memberId,
      membershipId: data.membershipId,
      type: 'CUSTOM',
      channel: data.channel,
      status: 'PENDING',
      message: data.message,
      createdAt: new Date().toISOString(),
    }
    onCreated(newRecord)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create reminder"
        className="relative w-full max-w-lg rounded-xl border border-zinc-200 bg-white shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-900">Create Reminder</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:text-zinc-700"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4 px-5 py-5">
            {SIMULATED_CHANNELS.has(selectedChannel) && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>
                  This is a simulated reminder. No actual {CHANNEL_LABELS[selectedChannel]}{' '}
                  message will be sent.
                </span>
              </div>
            )}

            {/* Member */}
            <div>
              <label htmlFor="memberId" className="block text-sm font-medium text-zinc-700">
                Member <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <div className="mt-1">
                <Controller
                  name="memberId"
                  control={control}
                  render={({ field }) => (
                    <select
                      id="memberId"
                      className={inputCls(!!errors.memberId)}
                      value={field.value}
                      onChange={(e) => {
                        field.onChange(e)
                        setValue('membershipId', '')
                      }}
                    >
                      <option value="">Select a member…</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.firstName} {m.lastName}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>
              {errors.memberId && (
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {errors.memberId.message}
                </p>
              )}
            </div>

            {/* Membership */}
            <div>
              <label htmlFor="membershipId" className="block text-sm font-medium text-zinc-700">
                Membership <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <div className="mt-1">
                <select
                  id="membershipId"
                  className={inputCls(!!errors.membershipId)}
                  disabled={!selectedMemberId}
                  {...register('membershipId')}
                >
                  <option value="">
                    {selectedMemberId ? 'Select a membership…' : 'Select a member first'}
                  </option>
                  {memberMemberships.map((ms) => (
                    <option key={ms.id} value={ms.id}>
                      {ms.planName} — {ms.status} (ends {ms.endDate})
                    </option>
                  ))}
                </select>
              </div>
              {errors.membershipId && (
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {errors.membershipId.message}
                </p>
              )}
            </div>

            {/* Channel */}
            <div>
              <label htmlFor="channel" className="block text-sm font-medium text-zinc-700">
                Channel <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <div className="mt-1">
                <select
                  id="channel"
                  className={inputCls(!!errors.channel)}
                  {...register('channel')}
                >
                  {CHANNELS.map((ch) => (
                    <option key={ch} value={ch}>
                      {CHANNEL_LABELS[ch]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-zinc-700">
                Message <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <div className="mt-1">
                <textarea
                  id="message"
                  rows={4}
                  placeholder="Type your reminder message here…"
                  className={cn(inputCls(!!errors.message), 'resize-none')}
                  {...register('message')}
                />
              </div>
              {errors.message && (
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {errors.message.message}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-zinc-200 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Create Reminder
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
