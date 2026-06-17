import { useState } from 'react'
import { LuX } from 'react-icons/lu'

interface CreateGoalModalProps {
  onClose: () => void
  onSave: (goal: { title: string; targetAmount: number; savedAmount: number; deadline: string | null }) => void
}

export default function CreateGoalModal({ onClose, onSave }: CreateGoalModalProps) {
  const [title, setTitle] = useState('')
  const [targetAmount, setTargetAmount] = useState<number>(0)
  const [savedAmount, setSavedAmount] = useState<number>(0)
  const [deadline, setDeadline] = useState('')

  const handleSave = () => {
    if (!title.trim() || targetAmount <= 0) return
    onSave({
      title: title.trim(),
      targetAmount,
      savedAmount,
      deadline: deadline || null,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl flex flex-col gap-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Create a savings goal</h2>
            <p className="text-sm text-gray-400 mt-0.5">Save toward a trip, a purchase, or your emergency fund.</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <LuX size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Goal name</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Write your new goal here!"
            className="w-full bg-gray-50 rounded-xl px-4 py-3 text-gray-900 outline-none border border-transparent focus:border-gray-300 transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Target amount</label>
            <input
              type="number"
              value={targetAmount || ''}
              onChange={e => setTargetAmount(Number(e.target.value))}
              placeholder="0"
              className="w-full bg-gray-50 rounded-xl px-4 py-3 text-gray-900 outline-none border border-transparent focus:border-gray-300 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Already saved</label>
            <input
              type="number"
              value={savedAmount || ''}
              onChange={e => setSavedAmount(Number(e.target.value))}
              placeholder="0"
              className="w-full bg-gray-50 rounded-xl px-4 py-3 text-gray-900 outline-none border border-transparent focus:border-gray-300 transition-colors"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">
            Deadline <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            className="w-full bg-gray-50 rounded-xl px-4 py-3 text-gray-900 outline-none border border-transparent focus:border-gray-300 transition-colors"
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
            onClick={handleSave}
            className="text-sm font-semibold text-white rounded-xl"
            style={{ backgroundColor: '#1a1f36', padding: '10px 24px', border: 'none', cursor: 'pointer' }}
          >
            Create goal
          </button>
        </div>
      </div>
    </div>
  )
}