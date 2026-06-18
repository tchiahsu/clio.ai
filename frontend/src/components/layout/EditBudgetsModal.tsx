import { useState } from 'react'
import { LuX } from 'react-icons/lu'

interface CategoryBudgetItem {
  category_id: number
  category_name: string
  spent: number
  budgeted: number
  previousSpent?: number
}

interface EditBudgetsModalProps {
  categories: CategoryBudgetItem[]
  onClose: () => void
  onSave: (updates: { categoryName: string; amount: number }[]) => void
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

export default function EditBudgetsModal({ categories, onClose, onSave }: EditBudgetsModalProps) {
  const [amounts, setAmounts] = useState<Record<string, number>>(
    Object.fromEntries(categories.map(c => [c.category_name, c.budgeted]))
  )

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  const handleSave = () => {
    const updates = categories.map(c => ({
      categoryName: c.category_name,
      amount: amounts[c.category_name] ?? c.budgeted,
    }))
    onSave(updates)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl flex flex-col gap-5 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Edit budgets</h2>
            <p className="text-sm text-gray-700 mt-2">
              Compare last statement's spending and set this statement's target for each category.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <LuX size={20} />
          </button>
        </div>

        <div className="grid grid-cols-[1fr_120px_180px] gap-4 px-2">
          <span className="text-[12px] uppercase tracking-widest text-gray-700">Category</span>
          <span className="text-[12px] uppercase tracking-widest text-gray-700 text-right">Previous</span>
          <span className="text-[12px] uppercase tracking-widest text-gray-700 text-right">This statement target</span>
        </div>

        <div className="flex flex-col gap-3">
          {categories.map(c => (
            <div
              key={c.category_name}
              className="grid grid-cols-[1fr_120px_180px] gap-4 items-center bg-gray-50 shadow-sm rounded-2xl px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-[20px]">{categoryEmojis[c.category_name.toLowerCase()] ?? '📦'}</span>
                <div>
                  <p className="text-[14px] font-semibold text-gray-800 capitalize">{c.category_name}</p>
                  <p className="text-[11px] text-gray-400">Now: {formatCurrency(c.spent)}</p>
                </div>
              </div>

              <p className="text-[14px] font-semibold text-gray-700 text-right">
                {c.previousSpent !== undefined ? formatCurrency(c.previousSpent) : '—'}
              </p>

              <div className="flex justify-end">
                <input
                  type="number"
                  value={amounts[c.category_name] || ''}
                  onChange={e => setAmounts(prev => ({ ...prev, [c.category_name]: Number(e.target.value) }))}
                  className="w-38 bg-white shadow-sm rounded-xl px-4 py-2 text-[14px] text-gray-900 text-right outline-none border border-gray-200 focus:border-gray-400 transition-colors"
                />
              </div>
            </div>
          ))}
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
            onClick={handleSave}
            className="text-sm font-semibold text-white rounded-xl"
            style={{ backgroundColor: '#1a1f36', padding: '10px 24px', border: 'none', cursor: 'pointer' }}
          >
            Save all
          </button>
        </div>
      </div>
    </div>
  )
}