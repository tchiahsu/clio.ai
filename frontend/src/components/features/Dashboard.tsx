import { useState, useEffect } from 'react'
import AskClio from '../layout/AskClio'
import ContentCard from '../layout/ContentCard'
import Section from '../layout/Section'
import CategoryRow from '../layout/CategoryRow'
import NetThisMonthCard from '../layout/NetThisMonthCard'
import { useStatements } from '../../context/StatementContext'
import { useNavigate } from 'react-router-dom'

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
  const { selectedId, statements } = useStatements()

  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [categories, setCategories] = useState<CategorySpend[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const activeStatement = statements.find(s => s.statement_id === selectedId)

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
        </div>
      </div>

      <AskClio />

      {isLoading ? (
        <div className="text-sm text-gray-400">Loading…</div>
      ) : summary ? (
        <div className="grid grid-cols-2 gap-4">
          <ContentCard title="Total Income" amount={formatCurrency(summary.total_income)} />
          <NetThisMonthCard statementId={selectedId!} accountId={activeStatement?.account_id ?? 0} />
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