import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useStatements } from '../../context/StatementContext'
import { LuChevronDown, LuChevronRight, LuTrendingUp, LuReceipt, LuShoppingBag } from 'react-icons/lu'

interface CategoryRow {
  category_id: number
  category_name: string
  subcategory_name: string
}

interface SpendRow {
  category_id: number
  category_name: string
  spent: number
}

interface TxRow {
  transaction_id: number
  transaction_date: string
  description: string
  amount: number
  merchant_name: string | null
  category_name: string | null
  bank_name: string
  account_type: string
}

interface SubcategorySpend {
  name: string
  spent: number
}

interface ParentCategory {
  name: string
  spent: number
  subcategories: SubcategorySpend[]
  color: string
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function formatCurrencyExact(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.abs(n))
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const COLORS = [
  '#6366f1', '#f97316', '#10b981', '#3b82f6',
  '#ec4899', '#eab308', '#06b6d4', '#a855f7',
  '#ef4444', '#84cc16',
]

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
  rent:          '🏡',
  utilities:     '💡',
  clothing:      '👕',
  restaurants:   '🍽️',
  car:           '🚗',
  phone:         '📱',
  internet:      '🌐',
  transfer:      '💸',
  giving:        '🤲',
  misc:          '🗂️',
  alcohol:       '🍷',
  gifts:         '🎁',
  books:         '📖',
  parking:       '🅿️',
}

function getEmoji(name: string) {
  const key = name.toLowerCase()
  for (const [k, emoji] of Object.entries(categoryEmojis)) {
    if (key.includes(k)) return emoji
  }
  return '📦'
}

function toTitleCase(s: string) {
  return s.replace(/\w\S*/g, (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

interface TooltipProps {
  active?: boolean
  payload?: { name: string; value: number }[]
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl shadow-md px-3 py-2 text-[12px]">
      <p className="font-medium text-gray-700">{toTitleCase(payload[0].name)}</p>
      <p className="text-gray-500">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[11px] text-gray-400">{label}</p>
      <p className="text-[18px] font-bold text-gray-900 leading-tight">{value}</p>
      {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
    </div>
  )
}

export default function Categories() {
  const { selectedId } = useStatements()

  const [categoryDefs, setCategoryDefs] = useState<CategoryRow[]>([])
  const [spendData, setSpendData] = useState<SpendRow[]>([])
  const [transactions, setTransactions] = useState<TxRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selectedParent, setSelectedParent] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => { if (data.data) setCategoryDefs(data.data) })
      .catch(err => console.error('Failed to fetch categories', err))
  }, [])

  useEffect(() => {
    if (!selectedId) return
    const fetchAll = async () => {
      setIsLoading(true)
      try {
        const [spendRes, txRes] = await Promise.all([
          fetch(`/api/dashboard/categories?statementId=${selectedId}`),
          fetch(`/api/transaction?scope=statement&statementId=${selectedId}`),
        ])
        const spendJson = await spendRes.json()
        const txJson = await txRes.json()
        if (spendJson.data) setSpendData(spendJson.data)
        if (txJson.data) setTransactions(txJson.data)
      } catch (err) {
        console.error('Failed to fetch data', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAll()
  }, [selectedId])

  // Build parent → subcategory structure from spend + category defs
  const parentMap = new Map<string, { spent: number; subs: Map<string, number> }>()
  for (const row of spendData) {
    const spent = Number(row.spent)
    if (spent <= 0) continue
    const def = categoryDefs.find(d => d.category_id === row.category_id)
    const parentName = def?.category_name ?? row.category_name ?? 'Other'
    const subName = def?.subcategory_name ?? row.category_name ?? 'Other'
    if (!parentMap.has(parentName)) parentMap.set(parentName, { spent: 0, subs: new Map() })
    const entry = parentMap.get(parentName)!
    entry.spent += spent
    entry.subs.set(subName, (entry.subs.get(subName) ?? 0) + spent)
  }

  const parents: ParentCategory[] = Array.from(parentMap.entries())
    .sort((a, b) => b[1].spent - a[1].spent)
    .map(([name, { spent, subs }], i) => ({
      name,
      spent,
      color: COLORS[i % COLORS.length],
      subcategories: Array.from(subs.entries())
        .map(([n, s]) => ({ name: n, spent: s }))
        .sort((a, b) => b.spent - a.spent),
    }))

  const totalSpent = parents.reduce((s, p) => s + p.spent, 0)
  const maxSpent = parents[0]?.spent ?? 1
  const selectedData = selectedParent ? parents.find(p => p.name === selectedParent) : null

  // Get transactions for selected category
  const categoryTxs = selectedData
    ? transactions.filter(t => {
        return t.category_name === selectedData.name ||
          categoryDefs.some(d => d.category_name === selectedData.name && d.category_name === t.category_name)
      }).filter(t => Number(t.amount) < 0) // expenses only
    : []

  // Stats for selected category
  const txCount = categoryTxs.length
  const avgTx = txCount > 0 ? categoryTxs.reduce((s, t) => s + Math.abs(Number(t.amount)), 0) / txCount : 0
  const biggestTx = categoryTxs.reduce<TxRow | null>((best, t) =>
    !best || Math.abs(Number(t.amount)) > Math.abs(Number(best.amount)) ? t : best, null)

  // Top merchants for selected category
  const merchantMap = new Map<string, number>()
  for (const tx of categoryTxs) {
    const name = tx.merchant_name ?? tx.description
    merchantMap.set(name, (merchantMap.get(name) ?? 0) + Math.abs(Number(tx.amount)))
  }
  const topMerchants = Array.from(merchantMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const toggleExpand = (name: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(name)) { next.delete(name) } else { next.add(name) }
      return next
    })
  }

  return (
    <div className="w-full flex flex-col gap-6 p-2 pb-8">

      <div>
        <p className="text-[12px] uppercase tracking-widest text-gray-400">Overview</p>
        <h1 className="text-4xl font-bold text-gray-900">Categories</h1>
      </div>

      {isLoading && <div className="text-[13px] text-gray-400">Loading…</div>}
      {!isLoading && parents.length === 0 && (
        <div className="text-[13px] text-gray-400">No spending data for this statement.</div>
      )}

      {!isLoading && parents.length > 0 && (
        <div className="flex gap-4">

          {/* ── Left 60% ──────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4 min-w-0" style={{ flex: '0 0 60%' }}>

            {/* Pie + summary */}
            <div className="rounded-2xl bg-clio-glass border border-white shadow-sm p-6">
              <h2 className="text-[17px] font-bold text-gray-900 mb-4">Spending mix</h2>
              <div className="flex items-center gap-8">
                <div style={{ width: 200, height: 200, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={parents}
                        dataKey="spent"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        onClick={d => {
                          const name = d?.name as string | undefined
                          if (name) setSelectedParent(selectedParent === name ? null : name)
                        }}
                      >
                        {parents.map(p => (
                          <Cell
                            key={p.name}
                            fill={p.color}
                            opacity={selectedParent && selectedParent !== p.name ? 0.3 : 1}
                            style={{ cursor: 'pointer' }}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-3 flex-1">
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-gray-400">Total spent</p>
                    <p className="text-[28px] font-bold text-gray-900 leading-tight">{formatCurrency(totalSpent)}</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {parents.slice(0, 5).map(p => (
                      <div
                        key={p.name}
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => setSelectedParent(selectedParent === p.name ? null : p.name)}
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                        <span className="text-[13px] text-gray-600">{toTitleCase(p.name)}</span>
                        <span className="text-[13px] font-medium text-gray-800 ml-auto">{formatCurrency(p.spent)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Category list */}
            <div className="rounded-2xl bg-clio-glass border border-white shadow-sm overflow-hidden">
              {parents.map((p, pi) => {
                const isExpanded = expanded.has(p.name)
                const isSelected = selectedParent === p.name
                const barPct = (p.spent / maxSpent) * 100
                return (
                  <div key={p.name}>
                    {pi > 0 && <div className="h-px bg-gray-100 mx-4" />}
                    <div
                      className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-colors
                        ${isExpanded ? 'bg-white/80 border-b border-gray-100' : 'hover:bg-white/50'}`}
                      onClick={() => {
                        setSelectedParent(isSelected ? null : p.name)
                        if (!isExpanded) toggleExpand(p.name)
                      }}
                    >
                      <button
                        className="text-gray-400 shrink-0"
                        onClick={e => { e.stopPropagation(); toggleExpand(p.name) }}
                      >
                        {isExpanded ? <LuChevronDown size={14} /> : <LuChevronRight size={14} />}
                      </button>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                      <span className="text-[14px]">{getEmoji(p.name)}</span>
                      <span className="text-[14px] font-medium text-gray-800 flex-1">{toTitleCase(p.name)}</span>
                      <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden shrink-0">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${barPct}%`, backgroundColor: p.color }} />
                      </div>
                      <span className="text-[14px] font-semibold text-gray-800 w-20 text-right shrink-0">
                        {formatCurrency(p.spent)}
                      </span>
                    </div>
                    {isExpanded && p.subcategories.map(sub => {
                      const subPct = (sub.spent / p.spent) * 100
                      return (
                        <div key={sub.name}>
                          <div className="h-px bg-gray-50 mx-4" />
                          <div className="flex items-center gap-3 px-5 py-2.5 bg-white/50 pl-14 border-l-2 ml-5" style={{ borderColor: p.color + '60' }}>
                            <span className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: p.color, opacity: 0.6 }} />
                            <span className="text-[13px]">{getEmoji(sub.name)}</span>
                            <span className="text-[13px] text-gray-600 flex-1">{toTitleCase(sub.name)}</span>
                            <div className="w-32 h-1 bg-gray-100 rounded-full overflow-hidden shrink-0">
                              <div className="h-full rounded-full"
                                style={{ width: `${subPct}%`, backgroundColor: p.color, opacity: 0.7 }} />
                            </div>
                            <span className="text-[13px] text-gray-600 w-20 text-right shrink-0">
                              {formatCurrency(sub.spent)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Right 40% ─────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4 min-w-0" style={{ flex: '0 0 40%' }}>
            {!selectedData ? (
              <div className="rounded-2xl bg-clio-glass border border-white shadow-sm flex items-center justify-center h-40">
                <p className="text-[13px] text-gray-400">Click a category to see details</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="rounded-2xl bg-clio-glass border border-white shadow-sm p-5">
                  <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-1">Category</p>
                  <div className="flex items-center gap-2 mb-5">
                    <span className="text-[22px]">{getEmoji(selectedData.name)}</span>
                    <h2 className="text-[24px] font-bold text-gray-900">{toTitleCase(selectedData.name)}</h2>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <StatCard
                      label="Total spent"
                      value={formatCurrency(selectedData.spent)}
                    />
                    <StatCard
                      label="% of total"
                      value={`${totalSpent > 0 ? Math.round((selectedData.spent / totalSpent) * 100) : 0}%`}
                    />
                    <StatCard
                      label="Transactions"
                      value={`${txCount}`}
                      sub={txCount > 0 ? `avg ${formatCurrency(avgTx)}` : undefined}
                    />
                  </div>
                </div>

                {/* Biggest transaction */}
                {biggestTx && (
                  <div className="rounded-2xl bg-clio-glass border border-white shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <LuTrendingUp size={14} className="text-gray-400" />
                      <h3 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Largest transaction</h3>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[15px] font-semibold text-gray-800">
                          {biggestTx.merchant_name ?? biggestTx.description}
                        </p>
                        <p className="text-[12px] text-gray-400">
                          {formatDate(biggestTx.transaction_date)} · {biggestTx.bank_name}
                        </p>
                      </div>
                      <span className="text-[18px] font-bold text-gray-900">
                        {formatCurrencyExact(Number(biggestTx.amount))}
                      </span>
                    </div>
                  </div>
                )}

                {/* Subcategory breakdown */}
                {selectedData.subcategories.length > 1 && (
                  <div className="rounded-2xl bg-clio-glass border border-white shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <LuReceipt size={14} className="text-gray-400" />
                      <h3 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Breakdown</h3>
                    </div>
                    <div className="flex flex-col gap-3">
                      {selectedData.subcategories.map(sub => {
                        const pct = Math.round((sub.spent / selectedData.spent) * 100)
                        return (
                          <div key={sub.name} className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-[12px]">{getEmoji(sub.name)}</span>
                                <span className="text-[13px] text-gray-700">{toTitleCase(sub.name)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-gray-400">{pct}%</span>
                                <span className="text-[13px] font-medium text-gray-800 w-16 text-right">
                                  {formatCurrency(sub.spent)}
                                </span>
                              </div>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, backgroundColor: selectedData.color }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Top merchants */}
                {topMerchants.length > 0 && (
                  <div className="rounded-2xl bg-clio-glass border border-white shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <LuShoppingBag size={14} className="text-gray-400" />
                      <h3 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Top merchants</h3>
                    </div>
                    <div className="flex flex-col gap-2">
                      {topMerchants.map(([name, amount], i) => {
                        const pct = Math.round((amount / selectedData.spent) * 100)
                        return (
                          <div key={name} className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-gray-400 w-4">{i + 1}</span>
                                <span className="text-[13px] text-gray-700 truncate">{name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-gray-400">{pct}%</span>
                                <span className="text-[13px] font-medium text-gray-800 w-16 text-right">
                                  {formatCurrency(amount)}
                                </span>
                              </div>
                            </div>
                            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full"
                                style={{ width: `${pct}%`, backgroundColor: selectedData.color, opacity: 0.7 }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Recent transactions */}
                {categoryTxs.length > 0 && (
                  <div className="rounded-2xl bg-clio-glass border border-white shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <LuReceipt size={14} className="text-gray-400" />
                      <h3 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">
                        Recent transactions
                      </h3>
                    </div>
                    <div className="flex flex-col gap-0">
                      {categoryTxs
                        .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
                        .slice(0, 6)
                        .map((tx, i) => (
                          <div key={tx.transaction_id}>
                            {i > 0 && <div className="h-px bg-gray-100" />}
                            <div className="flex items-center justify-between py-2.5">
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-gray-800 truncate">
                                  {tx.merchant_name ?? tx.description}
                                </p>
                                <p className="text-[11px] text-gray-400">
                                  {formatDate(tx.transaction_date)} · {tx.bank_name}
                                </p>
                              </div>
                              <span className="text-[13px] font-semibold text-gray-800 shrink-0 ml-3">
                                {formatCurrencyExact(Number(tx.amount))}
                              </span>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      )}
    </div>
  )
}