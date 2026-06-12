import { useState, useEffect } from 'react'
import AskClio from '../layout/AskClio'
import ContentCard from '../layout/ContentCard'
import Section from '../layout/Section'
import CategoryRow from '../layout/CategoryRow'
import NetThisMonthCard from '../layout/NetThisMonthCard'
import { useStatements } from '../../context/StatementContext'
import { useNavigate } from 'react-router-dom'
import { LuUpload } from 'react-icons/lu'

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
  const { selectedId, activeStatementIds, statements, filter } = useStatements()

  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [categories, setCategories] = useState<CategorySpend[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const primaryId = filter === 'current' ? selectedId : activeStatementIds[0] ?? null
  const activeStatement = statements.find(s => s.statement_id === primaryId)

  useEffect(() => {
    if (!primaryId) return

    const fetchDashboardData = async () => {
      setIsLoading(true)
      try {
        const [summaryRes, categoriesRes] = await Promise.all([
          fetch(`/api/dashboard/totals?statementId=${primaryId}`),
          fetch(`/api/dashboard/categories?statementId=${primaryId}`),
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
  }, [primaryId])

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const categoryColors = [
    '#ef4444',  // red
    '#ec4899',  // pink
    '#f97316',  // orange
    '#3b82f6',  // blue
    '#22c55e',  // green
    '#eab308',  // yellow
    '#06b6d4',  // cyan
    '#92400e',  // brown
    '#1a1a1a',  // black
    '#a855f7',  // purple
  ]

  // TODO: replace with real per-category budget once budgets are wired up
  const maxSpent = Math.max(...categories.map(c => Number(c.spent)), 1) * 1.1

  return (
    <div className="w-full h-full flex flex-col gap-6 p-2">

      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] uppercase tracking-widest text-gray-400">Welcome back</p>
          <h1 className="text-4xl font-bold text-gray-900">Hello, Tony</h1>
        </div>
        <div className="flex items-center gap-3">
          {activeStatement && (
            <div
              className="text-[13px] text-gray-600 bg-clio-glass border border-gray-200 rounded-xl px-3 py-2 shadow-sm"
              style={{ height: '42px', display: 'flex', alignItems: 'center' }}
            >
              {formatLabel(activeStatement)}
            </div>
          )}
          <button
            className="flex items-center gap-2 rounded-xl px-3 py-2 outline-none cursor-pointer shadow-sm"
            style={{ padding: '8px 14px', border: '1px solid #e5e7eb', backgroundColor: 'var(--clio-glass)', color: '#4b5563', fontSize: '14px' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f9fafb')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--clio-glass)')}
            onClick={() => navigate('/statements')}
          >
            <LuUpload size={14} /> Upload statement
          </button>
        </div>
      </div>

      <AskClio />

      {isLoading ? (
        <div className="text-sm text-gray-400">Loading…</div>
      ) : summary ? (
        <div className="grid grid-cols-2 gap-4">
          <ContentCard
            title="Total Income"
            amount={formatCurrency(summary.total_income)}
          />
          <NetThisMonthCard
            statementId={primaryId!}
            accountId={activeStatement?.account_id ?? 0}
          />
        </div>
      ) : (
        <div className="text-sm text-gray-400">
          {statements.length === 0
            ? 'Upload a bank statement using the sidebar to get started.'
            : 'No statement selected.'}
        </div>
      )}

      {categories.length > 0 && (
        <Section
          title="Top Categories"
          linkText="View All"
          onLinkClick={() => navigate('/categories')}
        >
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