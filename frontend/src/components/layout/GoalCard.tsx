import { LuTarget, LuTrash2, LuPencil } from 'react-icons/lu'

interface GoalCardProps {
  title: string
  savedAmount: number
  targetAmount: number
  deadline?: string | null
  showIcon?: boolean
  showEdit?: boolean
  onEdit?: () => void
  showDelete?: boolean
  onDelete?: () => void
}

export default function GoalCard({ title, savedAmount, targetAmount, deadline, showIcon, showEdit, onEdit, showDelete, onDelete }: GoalCardProps) {
  const percentage = Math.min((savedAmount / targetAmount) * 100, 100)

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  return (
    <div className="bg-clio-glass shadow-sm border-white rounded-2xl p-5 flex flex-col gap-3">

      <div className="flex items-center gap-2">
        {showIcon && <LuTarget size={16} style={{ color: '#1a1f36' }} />}
        <p className="text-[14px] font-medium text-gray-700">
          {title}
          {deadline && (
            <span className="text-[11px] text-gray-400 ml-1">
              · by {new Date(deadline).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </span>
          )}
        </p>
      </div>

      <div>
        <h3 className="text-3xl font-bold text-gray-900">{formatCurrency(savedAmount)}</h3>
        <p className="text-[13px] text-gray-400 mt-0.5">of {formatCurrency(targetAmount)}</p>
      </div>

      <div className="flex items-center gap-3 mt-1">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gray-900 transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-[12px] text-gray-400 shrink-0">{Math.round(percentage)}%</span>
      </div>

      <div className="flex items-center justify-between">
        {showEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-1 text-[13px] text-gray-500 hover:text-gray-700 transition-colors"
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              <LuPencil size={13} /> Edit
            </button>
          )}
        {showDelete && (
            <button
              onClick={onDelete}
              className="flex items-center gap-1 text-[13px] text-red-400 hover:text-red-600 transition-colors"
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              <LuTrash2 size={14} /> Delete
            </button>
          )}
      </div>

    </div>
  )
}