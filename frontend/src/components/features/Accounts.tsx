import { useState, useEffect } from 'react'
import { BsBank2, BsCreditCard2Front } from 'react-icons/bs'
import { LuTrash2 } from 'react-icons/lu'
import SectionHeader from '../layout/SectionHeader'
import DeleteAccountModal from '../layout/DeleteAccountModal'
import { useStatements } from '../../context/StatementContext'


interface Account {
  account_id: number
  bank_name: string
  account_type: string
  account_number: number
  account_total: number
}

interface AccountSummary {
  account_total: number
  spent_this_month: number
  account_number: number
  bank_name: string
  account_type: string
}

interface Transaction {
  transaction_id: number
  transaction_date: string
  description: string
  amount: number
  merchant_name: string | null
  category_name: string | null
}

export default function Accounts() {
  const { reload: reloadStatements, selectedPeriod, months } = useStatements()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [summary, setSummary] = useState<AccountSummary | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch('/api/accounts')
        const result = await res.json()
        const data: Account[] = result.data ?? []
        setAccounts(data)
        if (data.length > 0) setSelectedId(data[0].account_id)
      } catch {
        console.error('Failed to fetch accounts')
      }
    }
    fetchAccounts()
  }, [])

  useEffect(() => {
    if (!selectedId || !selectedPeriod) return
    const { year, month } = selectedPeriod
    const fetchAccountData = async () => {
      setIsLoading(true)
      try {
        const [summaryRes, transactionsRes] = await Promise.all([
          fetch(`/api/accounts/${selectedId}/summary?year=${year}&month=${month}`),
          fetch(`/api/accounts/${selectedId}/transactions?year=${year}&month=${month}`),
        ])
        const summaryData = await summaryRes.json()
        const transactionsData = await transactionsRes.json()
        setSummary(summaryData.data)
        setTransactions(transactionsData.data)
      } catch {
        console.error('Failed to fetch account data')
      } finally {
        setIsLoading(false)
      }
    }
    fetchAccountData()
  }, [selectedId, selectedPeriod])

  const activeMonth = months.find(m => selectedPeriod && m.year === selectedPeriod.year && m.month === selectedPeriod.month)

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const maskAccountNumber = (n: number) =>
    `•••• ${String(n).slice(-4)}`

  const refetchAccounts = async () => {
    const res = await fetch('/api/accounts')
    const result = await res.json()
    setAccounts(result.data ?? [])
  }

  const getAccountIcon = (accountType: string) => {
    const type = accountType.toLowerCase()
    if (type.includes('credit')) return <BsCreditCard2Front size={16} />
    return <BsBank2 size={16} />
  }

  return (
    <div className="w-full h-full flex flex-col gap-6 p-2">
      <div>
        <p className="text-[12px] uppercase tracking-widest text-gray-400">Overview</p>
        <h1 className="text-4xl font-bold text-gray-900">Accounts</h1>
        <p className="text-sm text-gray-400 mt-1">Click an account to see activity.</p>
      </div>

      <div className="flex gap-4">
        <div className="bg-clio-glass border-white shadow-sm rounded-2xl p-5 flex flex-col gap-3 shrink-0 h-fit">
          <div className="flex items-center justify-between">
            <SectionHeader title="Your accounts" />
          </div>

          {accounts.map(a => (
            <button
              key={a.account_id}
              onClick={() => setSelectedId(a.account_id)}
              className="flex items-center gap-3 rounded-xl transition-colors w-full text-left shadow-sm"
              style={{
                backgroundColor: selectedId === a.account_id ? '#1a1f36' : 'var(--clio-glass)',
                color: selectedId === a.account_id ? '#f8f9fc' : '#374151',
                border: 'none',
                cursor: 'pointer',
                padding: '14px 16px',
              }}
            >
              {getAccountIcon(a.account_type)}
              <div className="flex-1">
                <p className="text-[14px] font-medium">{a.bank_name} {a.account_type}</p>
                <p className="text-[11px] opacity-60">{maskAccountNumber(a.account_number)}</p>
              </div>
              <span
                className="text-[14px] font-semibold"
                style={{ color: selectedId === a.account_id ? '#f8f9fc' : Number(a.account_total) >= 0 ? '#34a870' : '#ef4444' }}
              >
                {formatCurrency(Math.abs(Number(a.account_total)))}
              </span>
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col gap-4">
          {isLoading ? (
            <div className="text-sm text-gray-400">Loading...</div>
          ) : summary ? (
            <>
              <div className="bg-clio-glass border-white shadow-sm rounded-2xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-1">
                      {summary.account_type}
                    </p>
                    <h2 className="text-3xl font-bold text-gray-900">{summary.bank_name}</h2>
                    <p className="text-sm text-gray-400">{maskAccountNumber(summary.account_number)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDeletingAccount(true)}
                      className="flex items-center gap-1 text-[13px] text-red-400 hover:text-red-600 transition-colors rounded-xl"
                      style={{ border: 'none', cursor: 'pointer', padding: '8px 14px' }}
                    >
                      <LuTrash2 size={13} /> Delete
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-clio-glass shadow-sm rounded-2xl p-4 flex flex-col gap-1">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Balance</p>
                    <h2
                      className="text-3xl font-bold"
                      style={{ color: Number(summary.account_total) >= 0 ? '#34a870' : '#ef4444' }}
                    >
                      {formatCurrency(Number(summary.account_total))}
                    </h2>
                  </div>
                  <div className="bg-clio-glass shadow-sm rounded-2xl p-4 flex flex-col gap-1">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
                      Spent in {activeMonth?.label ?? 'month'}
                    </p>
                    <h2 className="text-3xl font-bold text-gray-900">
                      {formatCurrency(Number(summary.spent_this_month))}
                    </h2>
                  </div>

                </div>
              </div>

              <div className="bg-clio-glass border-white shadow-sm rounded-2xl p-6">
                <SectionHeader title="Transactions" />
                {transactions.length === 0 ? (
                  <p className="text-sm text-gray-400">No transactions on this account.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {transactions.map(t => (
                      <div key={t.transaction_id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                        <div>
                          <p className="text-[15px] font-medium text-gray-800">
                            {t.merchant_name ?? t.description}
                          </p>
                          <p className="text-[13px] text-gray-400">
                            {new Date(t.transaction_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {t.category_name && ` · ${t.category_name}`}
                          </p>
                        </div>
                        <span
                          className="text-[16px] font-semibold"
                          style={{ color: Number(t.amount) >= 0 ? '#34a870' : '#374151' }}
                        >
                          {Number(t.amount) >= 0 ? '+' : ''}{formatCurrency(Number(t.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-400">Select an account to view details.</div>
          )}
        </div>
      </div>

      {deletingAccount && summary && selectedId && (
        <DeleteAccountModal
          bankName={summary.bank_name}
          accountType={summary.account_type}
          onClose={() => setDeletingAccount(false)}
          onConfirm={async () => {
            await fetch(`/api/accounts/${selectedId}`, { method: 'DELETE' })
            setDeletingAccount(false)
            setSelectedId(null)
            setSummary(null)
            setTransactions([])
            await refetchAccounts()
            // The DB cascades the account's statements/transactions on delete, so
            // refresh the shared statement state to keep the sidebar selector in sync.
            await reloadStatements()
          }}
        />
      )}
    </div>
  )
}