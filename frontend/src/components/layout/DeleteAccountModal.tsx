import { LuX } from 'react-icons/lu'

interface DeleteAccountModalProps {
  bankName: string
  accountType: string
  onClose: () => void
  onConfirm: () => void
}

export default function DeleteAccountModal({ bankName, accountType, onClose, onConfirm }: DeleteAccountModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col gap-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Delete account</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <LuX size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-500">
          Are you sure you want to delete <span className="font-semibold text-gray-700">"{bankName}</span> <span className="font-semibold text-gray-700">{accountType}"</span>? All transactions and statements linked to this account will also be deleted. This cannot be undone.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="text-sm font-semibold text-white rounded-xl"
            style={{ backgroundColor: '#ef4444', padding: '10px 24px', border: 'none', cursor: 'pointer' }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}