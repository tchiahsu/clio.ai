import { FaPen } from "react-icons/fa6";

interface CategoryRowProps {
  label: string
  spent: number
  budget: number
  color: string
  showDot?: boolean
  showEditButton?: boolean
  onEdit?: () => void
  showBackground?: boolean 
}

export default function CategoryRow({ label, spent, budget, color, showDot, showEditButton, onEdit, showBackground }: CategoryRowProps) {
  const percentage = Math.min((spent / budget) * 100, 100)
  const isOverBudget = spent > budget

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  return (
      <div className={`rounded-2xl p-5 flex flex-col gap-3 mb-4 ${showBackground ? 'bg-clio-glass shadow-sm border-white' : ''}`}>      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showDot && (
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
          )}
          <span className="text-[13px] uppercase font-semibold text-gray-800">{label}</span>
          {showEditButton && (
            <button
              onClick={onEdit}
              className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
              style={{ background: 'none', border: 'none', padding: '0 4px', cursor: 'pointer' }}
            >
              <FaPen size={10} /> Set budget
            </button>
          )}
        </div>

        {showEditButton ? (
          <div className="text-right">
            <span className="text-[13px] font-medium" style={{ color: isOverBudget ? '#dc5050' : '#6b7280' }}>
              {formatCurrency(spent)}
            </span>
            <span className="text-[11px] text-gray-400"> / {formatCurrency(budget)} budget</span>
            {isOverBudget && (
              <span className="text-[11px] text-red-400"> · over {formatCurrency(spent - budget)}</span>
            )}
          </div>
        ) : (
          <span className="text-[13px] font-medium" style={{ color: isOverBudget ? '#dc5050' : '#6b7280' }}>
            {formatCurrency(spent)} / {formatCurrency(budget)}
          </span>
        )}

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