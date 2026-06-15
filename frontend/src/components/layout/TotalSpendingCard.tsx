import { useEffect, useState } from 'react';
import SectionHeader from '../layout/SectionHeader';

interface TotalSpendingCardProps {
  statementId: number
  totalExpenses: number
  linkText: string
  onLinkClick?: () => void
}

export default function TotalSpendingCard({ statementId, totalExpenses, linkText, onLinkClick }: TotalSpendingCardProps) {
  const [totalBudgeted, setTotalBudgeted] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!statementId) return
    const fetchBudget = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/budgets?statementId=${statementId}`)
        const result = await res.json()
        setTotalBudgeted(Number(result.total_budgeted))
      } catch {
        console.error('Failed to fetch budget')
      } finally {
        setIsLoading(false)
      }
    }
    fetchBudget()
  }, [statementId])

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const left = totalBudgeted !== null ? totalBudgeted - totalExpenses : null
  const progress = totalBudgeted ? Math.min((totalExpenses / totalBudgeted) * 100, 100) : 0
  const isOverBudget = left !== null && left < 0

  if (isLoading) return (
    <div className="bg-white rounded-2xl p-6 flex items-center justify-center h-[200px]">
      <p className="text-sm text-gray-400">Loading...</p>
    </div>
  )

  return (
    <div className="bg-clio-glass shadow-sm border-white rounded-2xl p-6 flex flex-col gap-3">
      <SectionHeader title="Total Spending" linkText={linkText} onLinkClick={onLinkClick} />
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold text-gray-900">
          {formatCurrency(totalExpenses)}
        </span>
      </div>

      {left !== null && totalBudgeted !== null && (
        <span className="text-sm text-gray-400">
          {isOverBudget
            ? <><span className="font-semibold text-red-500">{formatCurrency(Math.abs(left))}</span> over budget</>
            : <><span className="font-semibold text-gray-700">{formatCurrency(left)}</span> left</>
          }
          {' '}out of <span className="font-semibold text-gray-700">{formatCurrency(totalBudgeted)}</span> budgeted
        </span>
      )}

      {/* Progress bar */}
      {totalBudgeted !== null && (
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-1">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: isOverBudget
                ? '#ef4444'
                : 'linear-gradient(to right, #1a1f36, #6b7280)',
            }}
          />
        </div>
      )}

      {/* under/over budget badge */}
      {left !== null && (
        <div
          className="inline-flex items-center gap-1 text-[11px] font-medium rounded-full w-fit"
          style={{
            backgroundColor: isOverBudget ? 'rgba(239,68,68,0.1)' : 'rgba(52,168,112,0.15)',
            color: isOverBudget ? '#ef4444' : '#34a870',
            padding: '4px 10px',
          }}
        >
          {isOverBudget ? '↗' : '↘'} {isOverBudget
            ? `${formatCurrency(Math.abs(left))} over budget`
            : `${formatCurrency(left)} under budget`
          }
        </div>
      )}

    </div>
  )
}