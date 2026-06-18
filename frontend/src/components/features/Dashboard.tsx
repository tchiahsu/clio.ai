import { useState, useEffect } from 'react'
import AskClio from '../layout/AskClio'
import SectionHeader from '../layout/SectionHeader'
import CategoryRow from '../layout/CategoryRow'
import NetThisMonthCard from '../layout/NetThisMonthCard'
import TotalSpendingCard from '../layout/TotalSpendingCard'
import GoalCard from '../layout/GoalCard'
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

interface Goal {
  goal_id: number
  title: string
  target_amount: number
  saved_amount: number
  deadline: string | null
}

interface BudgetItem {
  category_id: number
  category_name: string
  budgeted: number
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
  const [goals, setGoals] = useState<Goal[]>([])
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([])

  const activeStatement = statements.find(s => s.statement_id === selectedId)

  const displayName = !user || user.email === 'demo@clio.ai' ? 'Guest' : user.firstName

  useEffect(() => {
    if (!selectedId) return
    const fetchDashboardData = async () => {
      setIsLoading(true)
      try {
        const [summaryRes, categoriesRes, budgetsRes] = await Promise.all([
          fetch(`/api/dashboard/totals?statementId=${selectedId}`),
          fetch(`/api/dashboard/categories?statementId=${selectedId}`),
          fetch(`/api/budgets?statementId=${selectedId}`),
        ])
        const summaryData = await summaryRes.json()
        const categoriesData = await categoriesRes.json()
        const budgetsData = await budgetsRes.json()
        setSummary(summaryData.data ?? null)
        setCategories(categoriesData.data ?? [])
        setBudgetItems(budgetsData.data ?? [])
      } catch (err) {
        console.error('Failed to fetch dashboard data', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchDashboardData()
  }, [selectedId])

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const res = await fetch('/api/goals')
        const result = await res.json()
        setGoals(result.data ?? [])
      } catch {
        console.error('Failed to fetch goals')
      }
    }
    fetchGoals()
  }, [])

  const categoryColors = [
    '#ef4444', '#ec4899', '#f97316', '#3b82f6',
    '#22c55e', '#eab308', '#06b6d4', '#92400e',
    '#1a1a1a', '#a855f7',
  ]

  const mergedCategories = categories.map(c => {
    const budgetItem = budgetItems.find(
      b => b.category_name?.toLowerCase() === c.category_name?.toLowerCase()
    )
    return {
      ...c,
      budgeted: budgetItem ? Number(budgetItem.budgeted) : Number(c.spent) * 1.1,
    }
  })

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
          <TotalSpendingCard statementId={selectedId} totalExpenses={summary.total_expenses} linkText='Transactions' onLinkClick={() => navigate('/transactions')} />
          <NetThisMonthCard statementId={selectedId} accountId={activeStatement?.account_id ?? 0} linkText='Cash Flow' onLinkClick={() => navigate('/transactions')} />
        </div>
      ) : (
        <div className="text-sm text-gray-400">
          {statements.length === 0
            ? 'Upload a bank statement using the sidebar to get started.'
            : 'No statement selected.'}
        </div>
      )}

      {categories.length > 0 && (
        <div className="bg-clio-glass shadow-sm rounded-2xl border-white p-6">
          <SectionHeader
            title="Top Categories"
            linkText="View All"
            onLinkClick={() => navigate('/categories')}
          />
          <div className="grid grid-cols-2">
            {mergedCategories.slice(0, 6).map((c, i) => (
              <CategoryRow
                key={c.category_id}
                label={c.category_name ?? 'Uncategorized'}
                spent={Number(c.spent)}
                budget={c.budgeted}
                color={categoryColors[i % categoryColors.length]}
              />
            ))}
          </div>
        </div>
      )}

      {goals.length > 0 && (
        <div className="bg-clio-glass shadow-sm rounded-2xl border-white p-6">
          <SectionHeader
            title="Goals"
            linkText="All Goals"
            onLinkClick={() => navigate('/budgets')}
          />
          <div className="grid grid-cols-3 gap-4">
            {goals.slice(0, 3).map(g => (
              <GoalCard
                key={g.goal_id}
                title={g.title}
                savedAmount={Number(g.saved_amount)}
                targetAmount={Number(g.target_amount)}
                deadline={g.deadline}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  )
}