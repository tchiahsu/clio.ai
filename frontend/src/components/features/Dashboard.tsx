import { useState, useEffect } from 'react'
import AskClio from '../layout/AskClio'
import ContentCard from '../layout/ContentCard'
import Section from '../layout/Section'
import CategoryRow from '../layout/CategoryRow'
import NetThisMonthCard from '../layout/NetThisMonthCard'
import { useStatements } from '../../context/StatementContext'
import { useNavigate } from 'react-router-dom'
import { BsBank2 } from 'react-icons/bs'

interface DashboardSummary {
  total_income: number
  total_expenses: number
  net: number
}

interface CategorySpend {
  category_id: number
  category_name: string
  spent: number
}

function formatLabel(s: { bank_name: string; account_type: string; period_end: string }) {
  const date = new Date(s.period_end).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  return `${s.bank_name} ${s.account_type} — ${date}`
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { selectedId, statements, user } = useStatements()

  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [categories, setCategories] = useState<CategorySpend[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const activeStatement = statements.find(s => s.statement_id === selectedId)

  // Derive display name from context user — no extra fetch needed
  const displayName = !user || user.email === 'demo@clio.ai' ? 'Guest' : user.firstName

  useEffect(() => {
    if (!selectedId) return
    const fetchDashboardData = async () => {
      setIsLoading(true)
      try {
        const [summaryRes, categoriesRes] = await Promise.all([
          fetch(`/api/dashboard/totals?statementId=${selectedId}`),
          fetch(`/api/dashboard/categories?statementId=${selectedId}`),
        ])
        const summaryData = await summaryRes.json()
        const categoriesData = await categoriesRes.json()
        setSummary(summaryData.data)
        setCategories(categoriesData.data)
      } catch (err) {
        console.error('Failed to fetch dashboard data', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchDashboardData()
  }, [selectedId])

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const categoryColors = [
    '#ef4444', '#ec4899', '#f97316', '#3b82f6',
    '#22c55e', '#eab308', '#06b6d4', '#92400e',
    '#1a1a1a', '#a855f7',
  ]

  const maxSpent = Math.max(...categories.map(c => Number(c.spent)), 1) * 1.1

  return (
    <div className="w-full h-full flex flex-col gap-6 p-2">

      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] uppercase tracking-widest text-gray-400">Welcome back</p>
          <h1 className="text-4xl font-bold text-gray-900">Hello, {displayName}</h1>
        </div>
        <div className="flex items-center gap-3">
          {activeStatement && (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white shadow-sm"
              style={{ background: 'linear-gradient(135deg, var(--clio-glass) 0%, rgba(255,255,255,0.7) 100%)' }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--clio-primary)', color: 'var(--clio-primary-foreground)' }}
              >
                <BsBank2 size={14} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest text-gray-400 leading-none mb-0.5">Statement</p>
                <p className="text-[13px] font-semibold text-gray-800 leading-tight">{formatLabel(activeStatement)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <AskClio />

      {isLoading ? (
        <div className="text-sm text-gray-400">Loading…</div>
      ) : summary && selectedId ? (
        <div className="grid grid-cols-2 gap-4">
          <ContentCard title="Total Income" amount={formatCurrency(summary.total_income)} />
          {/* Guard: only render NetThisMonthCard when selectedId is guaranteed non-null */}
          <NetThisMonthCard statementId={selectedId} accountId={activeStatement?.account_id ?? 0} />
        </div>
      ) : (
        <div className="text-sm text-gray-400">
          {statements.length === 0
            ? 'Upload a bank statement using the sidebar to get started.'
            : 'No statement selected.'}
        </div>
      )}

      {categories.length > 0 && (
        <Section title="Top Categories" linkText="View All" onLinkClick={() => navigate('/categories')}>
          <div className="grid grid-cols-2">
            {categories.slice(0, 6).map((c, i) => (
              <CategoryRow
                key={c.category_id}
                label={c.category_name ?? 'Uncategorized'}
                spent={Number(c.spent)}
                budget={maxSpent}
                color={categoryColors[i % categoryColors.length]}
              />
            ))}
          </div>
        </Section>
      )}

    </div>
  )
}