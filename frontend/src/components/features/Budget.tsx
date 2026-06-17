import { useState, useEffect } from 'react'
import ContentCard from '../layout/ContentCard'
import CategoryRow from '../layout/CategoryRow'
import SectionHeader from '../layout/SectionHeader'
import SetBudgetModal from '../layout/SetBudgetModal'
import SetGoalFundsModal from '../layout/SetGoalFundsModal'
import GoalCard from '../layout/GoalCard'
import CreateGoalModal from '../layout/CreateGoalModal'
import DeleteGoalModal from '../layout/DeleteGoalModal' 
import { useStatements } from '../../context/StatementContext'
import { PieChart, Pie, Tooltip } from 'recharts'
import { LuPlus } from 'react-icons/lu'


interface BudgetOverview {
  statement_id: number
  date: string
  total_income: number
  total_expenses: number
  savings: number
}

interface CategorySpend {
  category_id: number
  category_name: string
  spent: number
}

interface BudgetItem {
  category_id: number 
  category_name: string
  budgeted: number
  spent: number
}

interface Goal {
  goal_id: number
  title: string
  target_amount: number
  saved_amount: number
  deadline: string | null
}

export default function Budget() {
  const { selectedId, statements } = useStatements()
  const [overview, setOverview] = useState<BudgetOverview[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<CategorySpend[]>([])
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([])
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [previousCategories, setPreviousCategories] = useState<CategorySpend[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [addingFundsGoal, setAddingFundsGoal] = useState<Goal | null>(null)
  const [creatingGoal, setCreatingGoal] = useState(false)
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null)

  const activeStatement = statements.find(s => s.statement_id === selectedId)

  useEffect(() => {
    if (!activeStatement?.account_id) return
    const fetchOverview = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/dashboard/accounts/${activeStatement.account_id}/budget`)
        const result = await res.json()
        setOverview(result.data)
      } catch {
        console.error('Failed to fetch budget overview')
      } finally {
        setIsLoading(false)
      }
    }
    fetchOverview()
  }, [activeStatement?.account_id])

  const current = overview[0]
  const previous = overview[1]

  useEffect(() => {
    if (!selectedId) return
    const fetchCategoryData = async () => {
      try {
        const [categoriesRes, budgetsRes] = await Promise.all([
          fetch(`/api/dashboard/categories?statementId=${selectedId}`),
          fetch(`/api/budgets?statementId=${selectedId}`),
        ])
        const categoriesData = await categoriesRes.json()
        const budgetsData = await budgetsRes.json()
        setCategories(categoriesData.data)
        setBudgetItems(budgetsData.data)
      } catch {
        console.error('Failed to fetch category data')
      }
    }
    fetchCategoryData()
  }, [selectedId])
  

  useEffect(() => {
    if (!previous?.statement_id) return
    const fetchPreviousCategories = async () => {
      try {
        const res = await fetch(`/api/dashboard/categories?statementId=${previous.statement_id}`)
        const result = await res.json()
        setPreviousCategories(result.data)
      } catch {
        console.error('Failed to fetch previous categories')
      }
    }
    fetchPreviousCategories()
  }, [previous?.statement_id])

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const res = await fetch('/api/goals')
        const result = await res.json()
        setGoals(result.data)
      } catch {
        console.error('Failed to fetch goals')
      }
    }
    fetchGoals()
  }, [])

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const calcChange = (curr: number, prev: number) => {
    if (!prev) return null
    const pct = ((curr - prev) / Math.abs(prev)) * 100
    return pct
  }

  const formatBadge = (pct: number | null, inverse = false) => {
    if (pct === null) return null
    const isPositive = inverse ? pct <= 0 : pct >= 0
    return {
      text: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}% vs last month`,
      variant: (isPositive ? 'success' : 'danger') as 'success' | 'danger',
    }
  }

  if (isLoading) return (
    <div className="w-full h-full flex flex-col gap-6 p-2">
      <div className="text-sm text-gray-400">Loading...</div>
    </div>
  )

  const mergedCategories = categories.map(c => {
    const budgetItem = budgetItems.find(
      b => b.category_name.toLowerCase() === c.category_name?.toLowerCase()
    )
    return {
      ...c,
      budgeted: budgetItem ? Number(budgetItem.budgeted) : 0,
      category_id: budgetItem?.category_id ?? c.category_id,  // add this
    }
  })

  const editingItem = mergedCategories.find(c => c.category_name === editingCategory)

  const categoryColors = [
    '#3b82f6', '#ef4444', '#10b981', '#a855f7',
    '#f97316', '#eab308', '#06b6d4', '#ec4899',
    '#22c55e', '#1a1a1a',
  ]

  const previousSpentForCategory = previousCategories.find(
    c => c.category_name?.toLowerCase() === editingItem?.category_name?.toLowerCase()
  )

  return (
    <div className="w-full h-full flex flex-col gap-6 p-2">

      <div>
        <p className="text-[12px] uppercase tracking-widest text-gray-400">Plan</p>
        <h1 className="text-4xl font-bold text-gray-900">Budget Overview</h1>
        <p className="text-sm text-gray-400 mt-1">Track your spending and manage your finances.</p>
      </div>

      {current ? (
        <div className="grid grid-cols-3 gap-4">
          <ContentCard
            title="Total Income"
            amount={formatCurrency(Number(current.total_income))}
            badge={formatBadge(calcChange(Number(current.total_income), Number(previous?.total_income))) ?? undefined}
          />
          <ContentCard
            title="Total Spend vs Last Month"
            amount={formatCurrency(Number(current.total_expenses))}
            badge={formatBadge(calcChange(Number(current.total_expenses), Number(previous?.total_expenses)), true) ?? undefined}
          />
          <ContentCard
            title="Total Saved vs Last Month"
            amount={formatCurrency(Number(current.savings))}
            badge={formatBadge(calcChange(Number(current.savings), Number(previous?.savings))) ?? undefined}
          />
        </div>
      ) : (
        <div className="text-sm text-gray-400">No statement data available.</div>
      )}

      {mergedCategories.length > 0 && (
        <div className="bg-clio-glass shadow-sm border-white  rounded-2xl p-6">
          <SectionHeader title="Spending by category" />
          <div className="flex flex-col items-center gap-6">
            <div style={{  width: '300px', height: '300px' }}>
              <PieChart width={300} height={300}>
                <Pie
                  data={mergedCategories.map((c, i) => ({ 
                    ...c, 
                    spent: Number(c.spent),
                    fill: categoryColors[i % categoryColors.length]
                  }))}
                  dataKey="spent"
                  nameKey="category_name"
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={130}
                  paddingAngle={2}
                >
                </Pie>
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '1px solid white',
                    borderRadius: '12px',
                    fontSize: '13px',
                  }}
                  itemStyle={{ color: '#1a1a1a' }}
                  formatter={(value) => {
                    if (typeof value !== 'number') return ''
                    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
                  }}
                />
              </PieChart>
            </div>

            <div className="w-full flex flex-col">
              {mergedCategories.map((c, i) => (
                <CategoryRow
                  key={c.category_name}
                  label={c.category_name ?? 'Uncategorized'}
                  spent={Number(c.spent)}
                  budget={Number(c.budgeted)}
                  color={categoryColors[i % categoryColors.length]}
                  showDot
                  showEditButton
                  onEdit={() => setEditingCategory(c.category_name)}
                  showBackground
                />
              ))}
            </div>

          </div>
        </div>
      )}

      {goals.length > 0 && (
        <div className="bg-clio-glass shadow-sm rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <SectionHeader title="Savings Goals" />
            <button
              onClick={() => setCreatingGoal(true)}
              className="flex items-center gap-1 font-semibold text-white rounded-xl"
              style={{ backgroundColor: '#1a1f36', padding: '6px 12px', border: 'none', cursor: 'pointer', fontSize: '13px' }}
            >
              <LuPlus size={14} /> New goal
            </button>
          </div>
          <div className={goals.length <= 3 
            ? "grid grid-cols-3 gap-4" 
            : "flex gap-4 overflow-x-auto pb-2"
          }>
            {goals.map(g => (
              <div key={g.goal_id} className={goals.length > 3 ? "min-w-[280px]" : ""}>
                <GoalCard
                  title={g.title}
                  savedAmount={Number(g.saved_amount)}
                  targetAmount={Number(g.target_amount)}
                  deadline={g.deadline}
                  showIcon
                  showAddFunds
                  onAddFunds={() => setAddingFundsGoal(g)}
                  showDelete
                  onDelete={() => setDeletingGoal(g)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {editingItem && selectedId && (
        <SetBudgetModal
          category={editingItem.category_name}
          currentSpent={Number(editingItem.spent)}
          previousSpent={previousSpentForCategory ? Number(previousSpentForCategory.spent) : undefined}
          currentBudget={Number(editingItem.budgeted)}
          onClose={() => setEditingCategory(null)}
          onSave={async (amount) => {
            console.log('categoryId:', editingItem.category_id)
            await fetch('/api/budgets', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                categoryId: editingItem.category_id,
                statementId: selectedId,
                amount,
              }),
            })
            setEditingCategory(null)
            const res = await fetch(`/api/budgets?statementId=${selectedId}`)
            const result = await res.json()
            setBudgetItems(result.data)
          }}
        />
      )}

      {addingFundsGoal && (
        <SetGoalFundsModal
          goalTitle={addingFundsGoal.title}
          currentSaved={Number(addingFundsGoal.saved_amount)}
          onClose={() => setAddingFundsGoal(null)}
          onSave={async (newSavedAmount) => {
            await fetch(`/api/goals/${addingFundsGoal.goal_id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: addingFundsGoal.title,
                targetAmount: addingFundsGoal.target_amount,
                savedAmount: newSavedAmount,
                deadline: addingFundsGoal.deadline,
              }),
            })
            setAddingFundsGoal(null)
            const res = await fetch('/api/goals')
            const result = await res.json()
            setGoals(result.data)
          }}
        />
      )}

      {creatingGoal && (
        <CreateGoalModal
          onClose={() => setCreatingGoal(false)}
          onSave={async (goal) => {
            await fetch('/api/goals', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(goal),
            })
            setCreatingGoal(false)
            const res = await fetch('/api/goals')
            const result = await res.json()
            setGoals(result.data)
          }}
        />
      )}

      {deletingGoal && (
        <DeleteGoalModal
          title={deletingGoal.title}
          onClose={() => setDeletingGoal(null)}
          onConfirm={async () => {
            await fetch(`/api/goals/${deletingGoal.goal_id}`, { method: 'DELETE' })
            setDeletingGoal(null)
            const res = await fetch('/api/goals')
            const result = await res.json()
            setGoals(result.data)
          }}
        />
      )}
    </div>
  )
}