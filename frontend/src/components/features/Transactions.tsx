import { useState, useEffect } from 'react'
import { useStatements } from '../../context/StatementContext'
import { LuSearch, LuSlidersHorizontal, LuArrowUpDown, LuX } from 'react-icons/lu'
import { FaCheck } from 'react-icons/fa'
import { MdEdit } from "react-icons/md";

interface Transaction {
  transaction_id: number
  transaction_date: string
  description: string
  amount: number
  bank_name: string
  account_type: string
  account_number: string
  merchant_name: string | null
  category_name: string | null
  category_confidence: number
  statement_id: number
}

interface Category {
  category_id: number
  category_name: string
}

type SortDir = 'asc' | 'desc'

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.abs(n))
}

function formatDateHeader(d: string) {
  const date = new Date(d)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  if (sameDay(date, today)) return 'Today'
  if (sameDay(date, yesterday)) return 'Yesterday'
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' }).toUpperCase()
}

function formatDetailDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
}

function getInitialColor(name: string) {
  const colors = ['#6366f1','#f97316','#10b981','#3b82f6','#ec4899','#eab308','#06b6d4','#a855f7','#ef4444','#84cc16']
  let hash = 0
  for (const c of (name ?? '')) hash = c.charCodeAt(0) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}


const categoryEmojis: Record<string, string> = {
  food:          '🍔',
  dining:        '🍽️',
  groceries:     '🛒',
  transport:     '🚗',
  shopping:      '🛍️',
  entertainment: '🎬',
  bills:         '📄',
  health:        '💊',
  travel:        '✈️',
  housing:       '🏠',
  income:        '💰',
  salary:        '💼',
  subscriptions: '🔄',
  education:     '📚',
  fitness:       '💪',
  beauty:        '💅',
  pets:          '🐾',
  charity:       '❤️',
  taxes:         '🧾',
  insurance:     '🛡️',
}

function getCategoryEmoji(name: string | null) {
  if (!name) return '📦'
  const key = name.toLowerCase()
  for (const [k, emoji] of Object.entries(categoryEmojis)) {
    if (key.includes(k)) return emoji
  }
  return '📦'
}
function CategoryBadge({ name }: { name: string | null }) {
  if (!name) return null
  const color = getInitialColor(name)
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide shrink-0"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {getCategoryEmoji(name)} {name}
    </span>
  )
}

const btnStyle = {
  padding: '8px 14px',
  border: '1px solid #e5e7eb',
  backgroundColor: 'var(--clio-glass)',
  color: '#4b5563',
  fontSize: '13px',
}

export default function Transactions() {
  const { selectedId, filter, activeStatementIds } = useStatements()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false)
  const [updatingCategory, setUpdatingCategory] = useState(false)

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => { if (data.data) setCategories(data.data) })
      .catch(err => console.error('Failed to fetch categories', err))
  }, [])

  useEffect(() => {
    const fetch_ = async () => {
      setIsLoading(true)
      try {
        let url: string
        if (filter === 'all') url = '/api/transaction?scope=all'
        else if (filter === 'current' && selectedId) url = `/api/transaction?scope=statement&statementId=${selectedId}`
        else url = '/api/transaction?scope=latest'

        const res = await fetch(url)
        const data = await res.json()
        let rows: Transaction[] = data.data ?? []
        if (filter === 'range' && activeStatementIds.length > 0)
          rows = rows.filter(t => activeStatementIds.includes(t.statement_id))
        setTransactions(rows)
        setSelectedTx(null)
      } catch (err) {
        console.error('Failed to fetch transactions', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetch_()
  }, [selectedId, filter, activeStatementIds])

  const filterCategories = ['All', ...Array.from(new Set(transactions.map(t => t.category_name ?? 'Uncategorized'))).sort()]

  const filtered = transactions.filter(t => {
    const name = (t.merchant_name ?? t.description ?? '').toLowerCase()
    const matchSearch = name.includes(search.toLowerCase())
    const matchCat = categoryFilter === 'All' || (t.category_name ?? 'Uncategorized') === categoryFilter
    return matchSearch && matchCat
  })

  const sorted = [...filtered].sort((a, b) => {
    const cmp = new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    return sortDir === 'asc' ? cmp : -cmp
  })

  const grouped: { date: string; items: Transaction[] }[] = []
  for (const tx of sorted) {
    const last = grouped[grouped.length - 1]
    if (last && last.date === tx.transaction_date) last.items.push(tx)
    else grouped.push({ date: tx.transaction_date, items: [tx] })
  }

  const similarTxs = selectedTx
    ? transactions.filter(t =>
        t.transaction_id !== selectedTx.transaction_id &&
        (t.merchant_name ?? t.description) === (selectedTx.merchant_name ?? selectedTx.description)
      )
    : []

  const similarGrouped: { month: string; total: number; items: Transaction[] }[] = []
  for (const tx of similarTxs) {
    const month = new Date(tx.transaction_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const last = similarGrouped[similarGrouped.length - 1]
    if (last && last.month === month) { last.items.push(tx); last.total += Math.abs(Number(tx.amount)) }
    else similarGrouped.push({ month, total: Math.abs(Number(tx.amount)), items: [tx] })
  }

  const handleCategoryChange = async (categoryId: number, categoryName: string) => {
    if (!selectedTx) return
    setUpdatingCategory(true)
    try {
      const res = await fetch(
        `/api/transaction/category?transactionId=${selectedTx.transaction_id}&categoryId=${categoryId}`,
        { method: 'PATCH' }
      )
      if (res.ok) {
        // Update locally
        const updated = { ...selectedTx, category_name: categoryName }
        setSelectedTx(updated)
        setTransactions(prev => prev.map(t =>
          t.transaction_id === selectedTx.transaction_id
            ? { ...t, category_name: categoryName }
            : t
        ))
        setCategoryPickerOpen(false)
      }
    } catch (err) {
      console.error('Failed to update category', err)
    } finally {
      setUpdatingCategory(false)
    }
  }

  const isIncome = (n: number) => Number(n) > 0

  return (
    <div className="w-full h-full flex flex-col gap-4 p-2">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[12px] uppercase tracking-widest text-gray-400">Activity</p>
          <h1 className="text-4xl font-bold text-gray-900">Transactions</h1>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div
            className="flex items-center gap-2 rounded-xl outline-none shadow-sm"
            style={{ ...btnStyle, padding: '7px 12px' }}
          >
            <LuSearch size={14} className="text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search transactions"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-40 text-[13px] bg-transparent outline-none text-gray-700 placeholder-gray-400"
            />
            {search && (
              <button onClick={() => setSearch('')}>
                <LuX size={12} className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Filter */}
          <div className="relative">
            <button
              onClick={() => { setFilterOpen(o => !o); setCategoryPickerOpen(false) }}
              className="flex items-center justify-center gap-2 rounded-xl outline-none cursor-pointer shadow-sm shrink-0"
              style={categoryFilter !== 'All'
                ? { ...btnStyle, width: '130px', justifyContent: 'center', backgroundColor: 'var(--clio-primary)', color: 'var(--clio-primary-foreground)', borderColor: 'var(--clio-primary)' }
                : { ...btnStyle, width: '130px', justifyContent: 'center' }
              }
              onMouseEnter={e => { if (categoryFilter === 'All') e.currentTarget.style.backgroundColor = '#f9fafb' }}
              onMouseLeave={e => { if (categoryFilter === 'All') e.currentTarget.style.backgroundColor = 'var(--clio-glass)' }}
            >
              <LuSlidersHorizontal size={14} />
              {categoryFilter === 'All' ? 'Filter' : categoryFilter}
              {categoryFilter !== 'All' && (
                <LuX size={11} onClick={e => { e.stopPropagation(); setCategoryFilter('All') }} />
              )}
            </button>
            {filterOpen && (
              <div className="absolute left-0 z-30 mt-1 rounded-xl bg-white border border-gray-100 shadow-lg overflow-hidden w-52 max-h-52 overflow-y-auto p-3 flex flex-col gap-2">
                {filterCategories.map(c => {
                  const isActive = categoryFilter === c
                  return (
                    <button
                      key={c}
                      onClick={() => { setCategoryFilter(c); setFilterOpen(false) }}
                      className="w-full text-left px-3 py-2 text-[12px] transition-colors flex items-center gap-2 hover:bg-gray-50 rounded-full"
                      style={isActive ? { backgroundColor: 'rgba(99,102,241,0.1)' } : {}}
                    >
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                        style={isActive
                          ? { backgroundColor: 'rgba(99,102,241,0.15)', color: '#6366f1' }
                          : { backgroundColor: 'rgba(107,114,128,0.1)', color: '#6b7280' }
                        }
                      >
                        {c}
                      </span>
                      {isActive && <span className="ml-auto mr-2 text-[10px] text-indigo-500"><FaCheck /></span>}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Sort toggle */}
          <button
            onClick={() => { setSortDir(d => d === 'desc' ? 'asc' : 'desc'); setFilterOpen(false); setCategoryPickerOpen(false) }}
            className="flex items-center justify-center gap-2 rounded-xl outline-none cursor-pointer shadow-sm shrink-0"
            style={{ ...btnStyle, width: '130px' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f9fafb')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--clio-glass)')}
          >
            <LuArrowUpDown size={14} />
            {sortDir === 'desc' ? 'Latest first' : 'Earliest first'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* ── Left 60% ─────────────────────────────────────────────────── */}
        <div className="flex flex-col min-w-0" style={{ flex: '0 0 60%' }}>
          <div className="rounded-2xl bg-clio-glass border border-white shadow-sm overflow-hidden flex flex-col h-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-40 text-[13px] text-gray-400">Loading…</div>
            ) : sorted.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-[13px] text-gray-400">No transactions found</div>
            ) : (
              <div className="overflow-y-auto flex-1">
                {grouped.map(({ date, items }) => (
                  <div key={date}>
                    <div className="px-4 pt-4 pb-1">
                      <span className="text-[11px] font-semibold tracking-widest text-gray-400">
                        {formatDateHeader(date)}
                      </span>
                    </div>
                    {items.map((tx, i) => {
                      const name = tx.merchant_name ?? tx.description ?? 'Unknown'
                      const isSelected = selectedTx?.transaction_id === tx.transaction_id
                      const income = isIncome(tx.amount)
                      return (
                        <div key={tx.transaction_id}>
                          {i > 0 && <div className="h-px bg-gray-100 mx-4" />}
                          <div
                            onClick={() => setSelectedTx(tx)}
                            className={`group flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors
                              ${isSelected ? 'bg-gray-100' : 'hover:bg-white/60'}`}
                          >
                            <div className={`w-0.5 h-6 rounded-full shrink-0 transition-colors ${isSelected ? 'bg-clio-primary' : 'bg-transparent group-hover:bg-gray-300'}`} />
                            {/* Single line: name · account · category · amount */}
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-[13px] font-medium text-gray-800 truncate min-w-0 shrink">{name}</span>
                              <span className="text-[11px] text-gray-400 shrink-0">·</span>
                              <span className="text-[11px] text-gray-400 truncate shrink-0">
                                {tx.bank_name} {tx.account_type}
                              </span>
                              {tx.category_name && (
                                <>
                                  <span className="text-[11px] text-gray-400 shrink-0">·</span>
                                  <CategoryBadge name={tx.category_name} />
                                </>
                              )}
                            </div>
                            <span
                              className="text-[13px] font-semibold shrink-0"
                              style={{ color: income ? '#16a34a' : '#111827' }}
                            >
                              {income ? '+' : ''}{formatCurrency(tx.amount)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right 40% ────────────────────────────────────────────────── */}
        <div className="flex flex-col min-w-0" style={{ flex: '0 0 40%' }}>
          <div className="rounded-2xl bg-clio-glass border border-white shadow-sm overflow-y-auto h-full">
            {!selectedTx ? (
              <div className="flex items-center justify-center h-full p-6 text-center">
                <p className="text-[13px] text-gray-400 leading-relaxed">
                  Pick a transaction on the left to inspect it here.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 p-5">

                {/* Date */}
                <p className="text-[12px] text-gray-400">{formatDetailDate(selectedTx.transaction_date)}</p>

                {/* Name + amount */}
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-[20px] font-bold text-gray-900 leading-tight">
                    {selectedTx.merchant_name ?? selectedTx.description}
                  </h2>
                  <span
                    className="text-[20px] font-bold shrink-0"
                    style={{ color: isIncome(selectedTx.amount) ? '#16a34a' : '#111827' }}
                  >
                    {isIncome(selectedTx.amount) ? '+' : ''}{formatCurrency(selectedTx.amount)}
                  </span>
                </div>

                {/* Category + Account grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] text-gray-400 mb-1">Category</p>
                    <div className="relative">
                      <button
                        onClick={() => { setCategoryPickerOpen(o => !o); setFilterOpen(false) }}
                        disabled={updatingCategory}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/70 transition-colors disabled:opacity-40 border border-transparent hover:border-gray-200"
                      >
                        <CategoryBadge name={selectedTx.category_name} />
                        {!selectedTx.category_name && <span className="text-[12px] text-gray-400">—</span>}
                        <span className="text-[12px] text-gray-400 shrink-0"><MdEdit /></span>
                      </button>
                      {categoryPickerOpen && (
                        <div className="absolute flex flex-col gap-2 px-3 py-3 left-0 z-30 mt-1 rounded-xl bg-white border border-gray-100 shadow-lg overflow-hidden w-52 max-h-52 overflow-y-auto">
                          {Array.from(new Map(categories.map(c => [c.category_name, c])).values()).map(c => {
                            const color = getInitialColor(c.category_name)
                            const isActive = selectedTx.category_name === c.category_name
                            return (
                              <button
                                key={c.category_id}
                                onClick={() => handleCategoryChange(c.category_id, c.category_name)}
                                className="w-full text-left px-3 py-2 text-[12px] transition-colors flex items-center gap-2 hover:bg-gray-50"
                                style={isActive ? { backgroundColor: `${color}15` } : {}}
                              >
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                                  style={{ backgroundColor: `${color}20`, color }}
                                >
                                  {getCategoryEmoji(c.category_name)} {c.category_name}
                                </span>
                                {isActive && <span className="ml-auto mr-2 text-[10px]" style={{ color }}><FaCheck /></span>}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 mb-1">Account</p>
                    <span className="text-[12px] font-medium text-gray-700">
                      {selectedTx.bank_name} {selectedTx.account_type}
                    </span>
                  </div>
                </div>

                {/* Extra detail rows */}
                <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
                  {[
                    { label: 'Type',      value: isIncome(selectedTx.amount) ? 'Income' : 'Expense' },
                    { label: 'Reference', value: `T${selectedTx.transaction_id}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-[12px] text-gray-400">{label}</span>
                      <span className="text-[12px] font-medium text-gray-700">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Similar transactions */}
                {similarTxs.length > 0 && (
                  <div className="pt-3 border-t border-gray-100 flex flex-col gap-3">
                    <h3 className="text-[14px] font-bold text-gray-800">Similar transactions</h3>
                    {similarGrouped.map(({ month, total, items }) => (
                      <div key={month}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12px] font-semibold text-gray-700">{month}</span>
                          <span className="text-[12px] font-semibold text-gray-700">{formatCurrency(total)}</span>
                        </div>
                        {items.map(tx => (
                          <div
                            key={tx.transaction_id}
                            onClick={() => setSelectedTx(tx)}
                            className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-white/50 rounded-lg px-1 transition-colors"
                          >
                            <span className="text-[11px] text-gray-500 shrink-0">
                              {new Date(tx.transaction_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            <span className="text-[11px] text-gray-400 truncate flex-1">{tx.bank_name}</span>
                            <CategoryBadge name={tx.category_name} />
                            <span className="text-[12px] font-medium text-gray-700 shrink-0">{formatCurrency(tx.amount)}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}