import { PieChart, Pie } from 'recharts'

interface CategoryBudgetCardProps {
  label: string
  spent: number
  budget: number
  color: string
}

const categoryEmojis: Record<string, string> = {
  food: '🍔', dining: '🍽️', groceries: '🛒', transport: '🚗',
  shopping: '🛍️', entertainment: '🎬', bills: '📄', health: '💊',
  travel: '✈️', housing: '🏠', income: '💰', salary: '💼',
  subscriptions: '🔄', education: '📚', fitness: '💪', beauty: '💅',
  pets: '🐾', charity: '❤️', taxes: '🧾', insurance: '🛡️',
  rent: '🏡', utilities: '💡', clothing: '👕', restaurants: '🍽️', car: '🚗',
  phone: '📱', internet: '🌐', transfer: '💸', giving: '🤲', misc: '🗂️',
  alcohol: '🍷', gifts: '🎁', books: '📖', parking: '🅿️',
}

export default function CategoryBudgetCard({ label, spent, budget, color }: CategoryBudgetCardProps) {
  const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
  const isOverBudget = spent > budget
  const left = budget - spent
  const emoji = categoryEmojis[label.toLowerCase()] ?? '📦'

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  const chartData = [
    { value: Math.min(spent, budget), fill: color },
    { value: Math.max(budget - spent, 0), fill: '#f3f4f6' },
  ]

  const overData = [
    { value: 100, fill: '#ef4444' },
  ]

  return (
    <div className="bg-clio-glass border-white rounded-2xl p-5 flex gap-4 items-center shadow-sm">

      <div style={{ width: 80, height: 80, position: 'relative', flexShrink: 0 }}>
        <PieChart width={80} height={80}>
          <Pie
            data={isOverBudget ? overData : chartData}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={28}
            outerRadius={38}
            startAngle={90}
            endAngle={-270}
            paddingAngle={isOverBudget ? 0 : 2}
          />
        </PieChart>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '14px',
            fontWeight: 700,
            color: isOverBudget ? '#ef4444' : '#1a1f36',
          }}
        >
          {Math.round(isOverBudget ? (spent / budget) * 100 : percentage)}%
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[20px]">{emoji}</span>
            <span className="text-[18px] font-semibold text-gray-800 capitalize">{label}</span>
          </div>
          <div className="text-right">
            <span className="text-[18px] font-bold text-gray-900">{formatCurrency(spent)}</span>
            <span className="text-[14px] text-gray-400"> / {formatCurrency(budget)}</span>
          </div>
        </div>

        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${isOverBudget ? 100 : percentage}%`,
              background: isOverBudget 
                ? 'linear-gradient(to right, #ef4444 40%, #e5e7eb)'
                : `linear-gradient(to right, ${color} 40%, #e5e7eb)`,
            }}
          />
        </div>

        {budget > 0 && (
          isOverBudget ? (
            <div
              className="inline-flex items-center gap-1 text-[12px] font-medium rounded-full w-fit mt-0.5"
              style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '2px 8px' }}
            >
              ⚠ Over budget by {formatCurrency(Math.abs(left))}
            </div>
          ) : (
            <p className="text-[12px] text-gray-400">{formatCurrency(left)} left this month</p>
          )
        )}
      </div>

    </div>
  )
}