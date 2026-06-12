interface CategoryRowProps {
  label: string
  spent: number
  budget: number
  color: string
}

export default function CategoryRow({ label, spent, budget, color } : CategoryRowProps) {
  const percentage = Math.min((spent / budget) * 100, 100)
  const isOverBudget = spent > budget

  return (
    <div className="flex flex-col gap-1 mb-4">
      <div className="flex items-center justify-between">
        <span
          className="text-sm font-medium"
          style={{ color: isOverBudget? '#dc5050' : '#374151' }}
        >
          ${spent} / ${budget}
        </span>
      </div>

      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transitiona-all duration-500"
          style={{
            width: `${percentage}%`,
            backgroundColor: isOverBudget ? '#dc5050' : color,
          }}
        />
      </div>
    </div>
  )
}