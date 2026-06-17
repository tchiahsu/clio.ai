import { useState } from 'react'
import { LuX } from 'react-icons/lu'

interface SetBudgetModalProps {
  category: string
  currentSpent: number
  previousSpent?: number
  currentBudget: number
  onSave: (amount: number) => void
  onClose: () => void
}

export default function SetBudgetModal({
  category,
  currentSpent,
  previousSpent,
  currentBudget,
  onSave,
  onClose,
}: SetBudgetModalProps) {
  const [amount, setAmount] = useState(currentBudget)

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl flex flex-col gap-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Set budget — <span className="capitalize">{category}</span>
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Use recent spend as a reference for your new budget.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <LuX size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-4 border-white shadow-sm">
            <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-1">Current Statement</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(currentSpent)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border-white shadow-sm">
            <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-1">Previous Statement</p>
            {previousSpent !== undefined ? (
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(previousSpent)}</p>
            ) : (
              <p className="text-sm text-gray-400 mt-3">No previous data found</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Monthly budget</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            className="w-full bg-gray-50 shadow-sm rounded-xl px-4 py-3 text-gray-900 text-lg outline-none border border-transparent focus:border-gray-300 transition-colors"
          />
        </div>

        <div className="flex items-center justify-end gap-3 mt-2">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px' }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(amount)}
            className="text-sm font-semibold text-white rounded-xl"
            style={{ backgroundColor: '#1a1f36', padding: '10px 24px', border: 'none', cursor: 'pointer' }}
          >
            Save
          </button>
        </div>

      </div>
    </div>
  )
}