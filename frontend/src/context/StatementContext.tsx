/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'

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

interface StatementContextValue {
  statements: Statement[]
  selectedId: number | null
  isLoading: boolean
  setSelectedId: (id: number | null) => void
  reload: () => Promise<void>
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
  const [isLoading, setIsLoading] = useState(false)
  const hasInitialized = useRef(false)

  const fetchStatements = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/statement/list')
      const result = await res.json()
      if (!result.data) return
      const list: Statement[] = result.data
      setStatements(list)
      // Only auto-select on first load — never override a user's explicit null selection
      if (!hasInitialized.current && list.length > 0) {
        const first = list.find(s => s.current_status === 'complete') ?? list[0]
        setSelectedId(first.statement_id)
      }
      hasInitialized.current = true
    } catch (err) {
      console.error('Failed to fetch statements', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchStatements() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <StatementContext.Provider value={{
      statements,
      selectedId,
      isLoading,
      setSelectedId,
      reload: fetchStatements,
    }}>
      {children}
    </StatementContext.Provider>
  )
}