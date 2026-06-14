/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react'

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

export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
}

interface StatementContextValue {
  statements: Statement[]
  selectedId: number | null
  isLoading: boolean
  user: User | null
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
  const [user, setUser] = useState<User | null>(null)
  const hasInitialized = useRef(false)

  // Fetch user once
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => { if (data.ok) setUser(data.user) })
      .catch(err => console.error('Failed to fetch user', err))
  }, [])

  // fetchStatements has no deps — uses refs/setters only, no stale closure risk
  const reload = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/statement/list')
      const result = await res.json()
      if (!result.data) return
      const list: Statement[] = result.data
      setStatements(list)
      if (!hasInitialized.current && list.length > 0) {
        hasInitialized.current = true
        const first = list.find(s => s.current_status === 'complete') ?? list[0]
        setSelectedId(first.statement_id)
      } else {
        hasInitialized.current = true
      }
    } catch (err) {
      console.error('Failed to fetch statements', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { reload() }, []) 

  return (
    <StatementContext.Provider value={{
      statements,
      selectedId,
      isLoading,
      user,
      setSelectedId,
      reload,
    }}>
      {children}
    </StatementContext.Provider>
  )
}