import { useState, useEffect } from "react"
import AskClio from "../layout/AskClio"
import ContentCard from "../layout/ContentCard"
import Section from "../layout/Section"
import CategoryRow from "../layout/CategoryRow"
import NetThisMonthCard from '../layout/NetThisMonthCard'
import { LuUpload } from "react-icons/lu"
import { useNavigate } from "react-router-dom"

interface Statement {
  statement_id: number
  account_id: number  
  file_name: string
  period_end: string
  current_status: string
  bank_name: string
  account_number: string
  account_type: string
}

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


export default function Dashboard() {
  const navigate = useNavigate()

  const [statements, setStatements] = useState<Statement[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [categories, setCategories] = useState<CategorySpend[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
  const fetchStatements = async () => {
      try {
        const res = await fetch('/api/statement/list')
        const result = await res.json()
        if (!result.data) return  // add this line
        setStatements(result.data)
        if (result.data.length > 0) {
          setSelectedId(result.data[0].statement_id)
        }
      } catch (err) {
        console.error('Failed to fetch statements', err)
      }
    }
    fetchStatements()
  }, [])

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

  const formatLabel = (s: Statement) => {
    const date = new Date(s.period_end).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    return `${s.bank_name} ${s.account_type} — ${date}`
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const categoryColors: Record<string, string> = {
    food: '#f97316',
    transport: '#10b981',
    shopping: '#a855f7',
    entertainment: '#3b82f6',
    bills: '#ef4444',
    health: '#06b6d4',
    travel: '#f59e0b',
  }

  const getCategoryColor = (name: string) => {
    const key = name?.toLowerCase()
    return categoryColors[key] ?? '#6b7280'
  }

  const maxSpent = Math.max(...categories.map(c => Number(c.spent)), 1)

  return (
    <div className="w-full h-full flex flex-col gap-6 p-2">

      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] uppercase tracking-widest text-gray-400">Welcome back</p>
          <h1 className="text-4xl font-bold text-gray-900">Hello, Tony</h1>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="text-[13px] text-gray-600 bg-clio-glass border-gray-200 rounded-xl px-3 py-2 outline-none cursor-pointer hover:bg-gray-100 transition-colors shadow-sm"
            style={{ height: '42px'}}
            value={selectedId ?? ''}
            onChange={e => setSelectedId(Number(e.target.value))}
          >
            {statements.map(s => (
              <option key={s.statement_id} value={s.statement_id}>
                {formatLabel(s)}
              </option>
            ))}
          </select>
          <button
            className="flex items-center gap-2 text-gray-600 bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none cursor-pointer shadow-sm"
            style={{ padding: '8px 14px', border: '1px solid #e5e7eb', backgroundColor: 'var(--clio-glass)', color: '#4b5563', fontSize: '14px'  }}
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
        <div className="text-sm text-gray-400">Loading...</div>
      ) : summary ? (
        <div className="grid grid-cols-2 gap-4">
          <ContentCard
            title="Total Income"
            amount={formatCurrency(summary.total_income)}
          />
          {/* <ContentCard
            title="Total Expenses"
            amount={formatCurrency(summary.total_expenses)}
          /> */}
          <NetThisMonthCard
            statementId={selectedId!}
            accountId={statements.find(s => s.statement_id === selectedId)?.account_id ?? 0}
          />
        </div>
      ) : (
        <div className="text-sm text-gray-400">No statement selected.</div>
      )}

      {categories.length > 0 && (
        <Section
          title="Top Categories"
          linkText="View All"
          onLinkClick={() => navigate('/categories')}
        >
          <div className="grid grid-cols-2 gap-x-8">
            {categories.slice(0, 6).map(c => (
              <CategoryRow
                key={c.category_id}
                label={c.category_name ?? 'Uncategorized'}
                spent={Number(c.spent)}
                budget={maxSpent}
                color={getCategoryColor(c.category_name)}
              />
            ))}
          </div>
        </Section>
      )}

    </div>
  )
}