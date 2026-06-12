/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

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
}

export type StatementFilter = 'current' | 'all' | 'range'

interface StatementContextValue {
  statements: Statement[]
  selectedId: number | null
  filter: StatementFilter
  rangeStart: string | null
  rangeEnd: string | null
  isLoading: boolean
  setSelectedId: (id: number | null) => void
  setFilter: (f: StatementFilter) => void
  setRangeStart: (d: string | null) => void
  setRangeEnd: (d: string | null) => void
  reload: () => Promise<void>
  // The statements actually used by the dashboard (filtered by mode)
  activeStatementIds: number[]
}

const StatementContext = createContext<StatementContextValue | null>(null)

export function useStatements() {
  const ctx = useContext(StatementContext)
  if (!ctx) throw new Error('useStatements must be used inside StatementProvider')
  return ctx
}

export function StatementProvider({ children }: { children: ReactNode }) {
  const [statements, setStatements] = useState<Statement[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [filter, setFilter] = useState<StatementFilter>('current')
  const [rangeStart, setRangeStart] = useState<string | null>(null)
  const [rangeEnd, setRangeEnd] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchStatements = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/statement/list')
      const result = await res.json()
      if (!result.data) return
      // API already orders by period_end DESC — newest first
      const list: Statement[] = result.data
      setStatements(list)
      // Auto-select the most recent complete statement on first load
      if (selectedId === null && list.length > 0) {
        const first = list.find(s => s.current_status === 'complete') ?? list[0]
        setSelectedId(first.statement_id)
      }
    } catch (err) {
      console.error('Failed to fetch statements', err)
    } finally {
      setIsLoading(false)
    }
  }, [selectedId])

  useEffect(() => { fetchStatements() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Derive which statement IDs the dashboard should use based on filter mode
  const activeStatementIds: number[] = (() => {
    if (filter === 'current') {
      return selectedId ? [selectedId] : []
    }
    if (filter === 'all') {
      return statements
        .filter(s => s.current_status === 'complete')
        .map(s => s.statement_id)
    }
    if (filter === 'range') {
      return statements
        .filter(s => {
          if (s.current_status !== 'complete') return false
          const end = new Date(s.period_end)
          if (rangeStart && end < new Date(rangeStart)) return false
          if (rangeEnd && end > new Date(rangeEnd)) return false
          return true
        })
        .map(s => s.statement_id)
    }
    return []
  })()

  return (
    <StatementContext.Provider value={{
      statements,
      selectedId,
      filter,
      rangeStart,
      rangeEnd,
      isLoading,
      setSelectedId,
      setFilter,
      setRangeStart,
      setRangeEnd,
      reload: fetchStatements,
      activeStatementIds,
    }}>
      {children}
    </StatementContext.Provider>
  )
}