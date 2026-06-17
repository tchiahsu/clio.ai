import { useState } from 'react'
import { LuX } from 'react-icons/lu'

interface SetGoalFundsModalProps {
  goalTitle: string
  currentSaved: number
  onClose: () => void
  onSave: (newSavedAmount: number) => void
}

export default function SetGoalFundsModal({ goalTitle, currentSaved, onClose, onSave }: SetGoalFundsModalProps) {
  const [amount, setAmount] = useState<number>(0)

  const handleAdd = () => {
    if (amount <= 0) return
    onSave(currentSaved + amount)
  }

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
          <h2 className="text-xl font-semibold text-gray-900">Add to {goalTitle}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <LuX size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Amount</label>
          <input
            type="number"
            value={amount || ''}
            onChange={e => setAmount(Number(e.target.value))}
            placeholder="0"
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
            onClick={handleAdd}
            className="text-sm font-semibold text-white rounded-xl"
            style={{ backgroundColor: '#1a1f36', padding: '10px 24px', border: 'none', cursor: 'pointer' }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}