import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface DailyTotal {
  transaction_date: string
  daily_income: number
  daily_spending: number
}

interface BudgetOverview {
  date: string
  total_income: number
  total_expenses: number
  savings: number
}

interface NetThisMonthCardProps {
  statementId: number
  accountId: number
}

interface TooltipProps {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}

export default function NetThisMonthCard({ statementId, accountId }: NetThisMonthCardProps) {
  const [dailyData, setDailyData] = useState<DailyTotal[]>([])
  const [overview, setOverview] = useState<BudgetOverview[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!statementId || !accountId) return

    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [dailyRes, overviewRes] = await Promise.all([
          fetch(`/api/dashboard/daily?statementId=${statementId}`),
          fetch(`/api/dashboard/accounts/${accountId}/budget`),
        ])
        const dailyData = await dailyRes.json()
        const overviewData = await overviewRes.json()
        setDailyData(dailyData.data)
        setOverview(overviewData.data)
      } catch {
        console.error('Failed to fetch net this month data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [statementId, accountId])

  const current = overview[0]
  const previous = overview[1]

  const net = current ? Number(current.savings) : 0
  const prevNet = previous ? Number(previous.savings) : 0
  const percentChange = prevNet !== 0
    ? ((net - prevNet) / Math.abs(prevNet)) * 100
    : 0
  const isPositiveChange = percentChange >= 0

  const netWhole = Math.floor(Math.abs(net)).toLocaleString()
  const netCents = Math.abs(net).toFixed(2).split('.')[1]
  const isNegative = net < 0

  const chartData = dailyData.map(d => ({
    date: new Date(d.transaction_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    income: Number(d.daily_income),
    spending: Number(d.daily_spending),
  }))

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-xl shadow-md p-3 text-[12px]">
          <p className="font-medium text-gray-700 mb-1">{label}</p>
          <p style={{ color: '#16a34a' }}>income : {payload[0]?.value}</p>
          <p style={{ color: '#dc2626' }}>spending : {payload[1]?.value}</p>
        </div>
      )
    }
    return null
  }

  if (isLoading) return (
    <div className="bg-white rounded-2xl p-6 flex items-center justify-center h-70">
      <p className="text-sm text-gray-400">Loading...</p>
    </div>
  )

  return (
    <div className="bg-clio-glass shadow-sm border-white rounded-2xl p-6 flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">
          Net this month
        </p>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-gray-900">
            {isNegative ? '-' : ''}${netWhole}
          </span>
          <span className="text-lg text-gray-900">.{netCents}</span>
        </div>
      </div>

      {/* % change */}
      {previous && (
        <div className="flex items-center gap-1 text-[12px]" style={{ color: isPositiveChange ? '#16a34a' : '#dc2626' }}>
          <span>{isPositiveChange ? '↗' : '↘'}</span>
          <span>{Math.abs(percentChange).toFixed(2)}% vs ${Math.abs(prevNet).toLocaleString('en-US', { minimumFractionDigits: 2 })} last period</span>
        </div>
      )}

      {/* Line chart */}
      {chartData.length > 0 && (
        <div style={{ width: '100%', height: 140, minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#16a34a"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#16a34a' }}
              />
              <Line
                type="monotone"
                dataKey="spending"
                stroke="#dc2626"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#dc2626' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}