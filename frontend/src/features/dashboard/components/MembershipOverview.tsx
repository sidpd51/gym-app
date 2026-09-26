import type { MembershipPlanCount } from '../types/dashboard.types'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

const PLAN_COLORS: Record<string, string> = {
  Monthly: '#3b82f6',
  Quarterly: '#10b981',
  'Half-Yearly': '#f59e0b',
  Annual: '#8b5cf6',
}

interface MembershipOverviewProps {
  data: MembershipPlanCount[]
}

export function MembershipOverview({ data }: MembershipOverviewProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0)

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-zinc-900">Membership Distribution</h3>
      <p className="mt-0.5 text-xs text-zinc-500">
        {total.toLocaleString('en-IN')} active members
      </p>
      <figure className="mt-4" aria-label="Membership distribution chart">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={85}
              dataKey="count"
              nameKey="plan"
              paddingAngle={2}
            >
              {data.map((item) => (
                <Cell
                  key={item.plan}
                  fill={PLAN_COLORS[item.plan] ?? '#a1a1aa'}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [String(value), String(name)] as [string, string]}
              contentStyle={{
                borderRadius: '6px',
                border: '1px solid #e4e4e7',
                fontSize: '12px',
                boxShadow: 'none',
              }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
          </PieChart>
        </ResponsiveContainer>
      </figure>
    </div>
  )
}
