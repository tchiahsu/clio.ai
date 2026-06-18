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
  uploaded_at?: string
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

  // fetchStatements has no deps — uses refs/setters only, no stale closure risk.
  // `silent` skips the loading flag so background polling doesn't flash the UI.
  const fetchStatements = async (silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      const res = await fetch('/api/statement/list')
      const result = await res.json()
      if (!result.data) return
      const list: Statement[] = result.data
      setStatements(list)
      // Reconcile the selection against the freshly-fetched list so the sidebar
      // never points at a statement that no longer exists (e.g. after its account
      // is deleted and the DB cascades the statements away).
      setSelectedId(prev => {
        if (!hasInitialized.current) {
          hasInitialized.current = true
          if (list.length === 0) return null
          const first = list.find(s => s.current_status === 'complete') ?? list[0]
          return first.statement_id
        }
        // Selection still valid → keep it.
        if (prev != null && list.some(s => s.statement_id === prev)) return prev
        // Selection was deleted (or never set) → fall back to a complete statement, else clear.
        const fallback = list.find(s => s.current_status === 'complete')
        return fallback ? fallback.statement_id : null
      })
    } catch (err) {
      console.error('Failed to fetch statements', err)
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  const reload = () => fetchStatements(false)

  useEffect(() => { reload() }, [])

  // Derive a *stable* boolean so the polling effect only re-runs when processing
  // actually starts or stops — not on every fetch. (Each fetch replaces the
  // statements array reference, so depending on `statements` directly would tear
  // down and recreate the interval every cycle → a runaway reload loop.)
  const anyProcessing = statements.some(
    s => s.current_status === 'processing' || s.current_status === 'queued'
  )

  // While any statement is processing, poll in the background so the UI reflects
  // backend completion/failure without a manual refresh. The interval is created
  // once when processing begins and torn down when it ends. A bounded attempt
  // count is a backstop so a stuck backend job can't poll forever.
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