import { useState, useEffect } from 'react'
import AskClio from '../layout/AskClio'
import SectionHeader from '../layout/SectionHeader'
import CategoryRow from '../layout/CategoryRow'
import NetThisMonthCard from '../layout/NetThisMonthCard'
import TotalSpendingCard from '../layout/TotalSpendingCard'
import GoalCard from '../layout/GoalCard'
import { useStatements } from '../../context/StatementContext'
import { useAuth } from '../../context/AuthContext'
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

export default function Dashboard() {
  const navigate = useNavigate()
  const { selectedPeriod, months, statements } = useStatements()
  const { user } = useAuth()

  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [categories, setCategories] = useState<CategorySpend[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [goals, setGoals] = useState<Goal[]>([])
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([])

  const activeMonth = months.find(m => selectedPeriod && m.year === selectedPeriod.year && m.month === selectedPeriod.month)

  // Statements behind the selected month — surfaced on hover over the month pill.
  const monthStatements = statements.filter(s => {
    if (s.current_status !== 'complete' || !selectedPeriod) return false
    const [y, m] = s.period_start.split('-').map(Number)
    return y === selectedPeriod.year && m === selectedPeriod.month
  })

  const displayName = !user || user.email === 'demo@example.com' ? 'Guest' : user.firstName

  useEffect(() => {
    if (!selectedPeriod) return
    const { year, month } = selectedPeriod
    const fetchDashboardData = async () => {
      setIsLoading(true)
      try {
        const [summaryRes, categoriesRes, budgetsRes] = await Promise.all([
          fetch(`/api/dashboard/totals?year=${year}&month=${month}`),
          fetch(`/api/dashboard/categories?year=${year}&month=${month}`),
          fetch(`/api/budgets?year=${year}&month=${month}`),
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
  }, [selectedPeriod])

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
          {activeMonth && (
            <div className="relative group">
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white shadow-sm cursor-default"
                style={{ background: 'linear-gradient(135deg, var(--clio-glass) 0%, rgba(255,255,255,0.7) 100%)' }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'var(--clio-primary)', color: 'var(--clio-primary-foreground)' }}
                >
                  <BsBank2 size={14} />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-gray-400 leading-none mb-0.5">Viewing</p>
                  <p className="text-[13px] font-semibold text-gray-800 leading-tight">
                    {activeMonth.label} · all accounts
                  </p>
                </div>
              </div>

              {/* Hover: the statements that make up this month */}
              <div className="absolute right-0 top-full mt-2 z-30 w-64 rounded-xl bg-white border border-gray-100 shadow-lg p-3
                opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">
                  {activeMonth.label} · {monthStatements.length} {monthStatements.length === 1 ? 'statement' : 'statements'}
                </p>
                <div className="flex flex-col gap-1.5">
                  {monthStatements.map(s => (
                    <div key={s.statement_id} className="flex items-center gap-2 text-[12px] text-gray-700">
                      <BsBank2 size={11} className="text-gray-400 shrink-0" />
                      <span className="truncate">{s.bank_name} {s.account_type}</span>
                    </div>
                  ))}
                  {monthStatements.length === 0 && (
                    <span className="text-[12px] text-gray-400">No statements</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <AskClio />

      {isLoading ? (
        <div className="text-sm text-gray-400">Loading…</div>
      ) : summary && selectedPeriod ? (
        <div className="grid grid-cols-2 gap-4">
          <TotalSpendingCard year={selectedPeriod.year} month={selectedPeriod.month} totalExpenses={summary.total_expenses} linkText='Transactions' onLinkClick={() => navigate('/transactions')} />
          <NetThisMonthCard year={selectedPeriod.year} month={selectedPeriod.month} linkText='Cash Flow' onLinkClick={() => navigate('/transactions')} />
        </div>
      ) : (
        <div className="text-sm text-gray-400">
          {months.length === 0
            ? 'Upload a bank statement using the sidebar to get started.'
            : 'No month selected.'}
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