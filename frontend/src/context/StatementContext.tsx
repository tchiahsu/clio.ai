/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useRef, useMemo, type ReactNode } from 'react'

export interface Statement {
  statement_id: number
  account_id: number
  file_name: string
  period_start: string
  period_end: string
  current_status: string
  bank_name: string
  account_number: string
  account_type: string
  uploaded_at?: string
}

// The app is month-centric: the user selects a month/year and every page shows
// that month across all of their accounts. A period is identified by its year
// and 1-12 month.
export interface Period {
  year: number
  month: number
}

export interface MonthOption extends Period {
  key: string        // 'YYYY-MM', used for selection equality and React keys
  label: string      // 'June 2026'
  count: number      // statements available in this month
}

interface StatementContextValue {
  statements: Statement[]
  months: MonthOption[]
  selectedPeriod: Period | null
  isLoading: boolean
  setSelectedPeriod: (p: Period) => void
  reload: () => Promise<void>
}

const StatementContext = createContext<StatementContextValue | null>(null)

export function useStatements() {
  const ctx = useContext(StatementContext)
  if (!ctx) throw new Error('useStatements must be used inside StatementProvider')
  return ctx
}

const periodKey = (year: number, month: number) => `${year}-${String(month).padStart(2, '0')}`

/** Derive the distinct months (newest first) from the user's complete statements. */
function deriveMonths(statements: Statement[]): MonthOption[] {
  const map = new Map<string, MonthOption>()
  for (const s of statements) {
    if (s.current_status !== 'complete') continue
    // period_start is a 'YYYY-MM-DD' date string; parse the calendar parts
    // directly to avoid timezone shifting the month.
    const [y, m] = s.period_start.split('-').map(Number)
    if (!y || !m) continue
    const key = periodKey(y, m)
    const existing = map.get(key)
    if (existing) {
      existing.count += 1
    } else {
      const label = new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      map.set(key, { year: y, month: m, key, label, count: 1 })
    }
  }
  return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key))
}

export function StatementProvider({ children }: { children: ReactNode }) {
  const [statements, setStatements] = useState<Statement[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const hasInitialized = useRef(false)

  const months = useMemo(() => deriveMonths(statements), [statements])

  const fetchStatements = async (silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      const res = await fetch('/api/statement/list')
      const result = await res.json()
      if (!result.data) return
      const list: Statement[] = result.data
      setStatements(list)
    } catch (err) {
      console.error('Failed to fetch statements', err)
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  const reload = () => fetchStatements(false)

  useEffect(() => { reload() }, [])

  // Reconcile the selected period against the available months: pick the newest
  // on first load, and if the current selection disappears (e.g. its statements
  // were deleted) fall back to the newest remaining month.
  useEffect(() => {
    if (months.length === 0) {
      setSelectedPeriod(null)
      hasInitialized.current = false
      return
    }
    setSelectedPeriod(prev => {
      if (!hasInitialized.current) {
        hasInitialized.current = true
        return { year: months[0].year, month: months[0].month }
      }
      const stillValid = prev && months.some(m => m.year === prev.year && m.month === prev.month)
      return stillValid ? prev : { year: months[0].year, month: months[0].month }
    })
  }, [months])

  // While any statement is processing, poll in the background so the UI reflects
  // backend completion/failure without a manual refresh.
  const anyProcessing = statements.some(
    s => s.current_status === 'processing' || s.current_status === 'queued'
  )
  useEffect(() => {
    if (!anyProcessing) return
    let attempts = 0
    const MAX_ATTEMPTS = 75 // ~5 min at 4s intervals
    const id = setInterval(() => {
      if (++attempts > MAX_ATTEMPTS) {
        clearInterval(id)
        console.warn('Stopped polling statements after timeout; some may still be processing')
        return
      }
      fetchStatements(true)
    }, 4000)
    return () => clearInterval(id)
  }, [anyProcessing])

  return (
    <StatementContext.Provider value={{
      statements,
      months,
      selectedPeriod,
      isLoading,
      setSelectedPeriod,
      reload,
    }}>
      {children}
    </StatementContext.Provider>
  )
}
