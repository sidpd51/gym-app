import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { AttendanceForm } from './components/AttendanceForm'

export function MarkAttendancePage() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit() {
    setSubmitted(true)
  }

  return (
    <div className="space-y-5">
      <div>
        <Link
          to="/attendance"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Attendance
        </Link>
        <h2 className="mt-2 text-xl font-semibold text-zinc-900">Mark Attendance</h2>
        <p className="mt-0.5 text-sm text-zinc-500">Record a member's check-in for a given date.</p>
      </div>

      <div className="max-w-lg rounded-lg border border-zinc-200 bg-white p-6">
        <AttendanceForm onSubmit={handleSubmit} submitted={submitted} />
      </div>
    </div>
  )
}
