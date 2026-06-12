interface CategoryRowProps {
  label: string
  spent: number
  budget: number
  color: string
}

export default function CategoryRow({ label, spent, budget, color }: CategoryRowProps) {
  const percentage = Math.min((spent / budget) * 100, 100)
  const isOverBudget = spent > budget

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="bg-clio-glass shadow-smrounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[13px] uppercase font-semibold text-gray-800">{label}</span>
        <span
          className="text-[13px] font-medium"
          style={{ color: isOverBudget ? '#dc5050' : '#6b7280' }}
        >
          {formatCurrency(spent)} / {formatCurrency(budget)}
        </span>
      </div>

      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            background: isOverBudget
              ? 'linear-gradient(to right, #dc5050, #fca5a5)'
              : `linear-gradient(to right, ${color} 40%, #e5e7eb)`,
          }}
        />
      </div>
    </div>
  )
}