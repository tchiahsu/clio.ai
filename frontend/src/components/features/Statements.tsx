import { useState, useEffect, useRef } from 'react'
import { useStatements } from '../../context/StatementContext'
import { useNavigate } from 'react-router-dom'
import { LuUpload, LuFileText, LuTrash2, LuPencil, LuCheck, LuX, LuLoader } from 'react-icons/lu'

interface Statement {
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

interface GroupedStatements {
  [year: string]: Statement[]
}

function formatLabel(s: Statement) {
  const date = new Date(s.period_end).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  return `${s.bank_name} ${s.account_type} — ${date}`
}

function formatUploadDate(s: Statement) {
  const date = s.uploaded_at ?? s.period_end
  return new Date(date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
}

export default function Statements() {
  const navigate = useNavigate()
  const { setSelectedId } = useStatements()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [statements, setStatements] = useState<Statement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchStatements = async () => {
    try {
      const res = await fetch('/api/statement/list')
      const data = await res.json()
      if (data.data) setStatements(data.data)
    } catch (err) {
      console.error('Failed to fetch statements', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchStatements() }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/statement/upload', { method: 'POST', body: formData })
      const result = await res.json()
      if (!res.ok) { alert(result.error ?? 'Upload failed'); return }
      // Poll until complete then reload
      const statementId: number = result.statementId
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000))
        const statusRes = await fetch(`/api/statement/status?statementId=${statementId}`)
        const statusData = await statusRes.json()
        const status = statusData.data?.current_status
        if (status === 'complete' || status === 'failed') break
      }
      await fetchStatements()
    } catch (err) {
      console.error('Upload failed', err)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (statementId: number) => {
    if (!confirm('Delete this statement and all its transactions?')) return
    setDeletingId(statementId)
    try {
      await fetch(`/api/statement?statementId=${statementId}`, { method: 'DELETE' })
      setStatements(prev => prev.filter(s => s.statement_id !== statementId))
    } catch (err) {
      console.error('Delete failed', err)
    } finally {
      setDeletingId(null)
    }
  }

  const startRename = (s: Statement) => {
    setEditingId(s.statement_id)
    setEditingName(formatLabel(s))
  }

  const cancelRename = () => {
    setEditingId(null)
    setEditingName('')
  }

  // Group statements by year of period_end, newest year first
  const grouped: GroupedStatements = {}
  statements
    .filter(s => s.current_status === 'complete')
    .forEach(s => {
      const year = new Date(s.period_end).getFullYear().toString()
      if (!grouped[year]) grouped[year] = []
      grouped[year].push(s)
    })
  const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a))

  const processing = statements.filter(
    s => s.current_status === 'processing' || s.current_status === 'queued'
  )

  return (
    <div className="w-full h-full flex flex-col gap-6 p-2">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] uppercase tracking-widest text-gray-400">Library</p>
          <h1 className="text-4xl font-bold text-gray-900">Bank Statements</h1>
          <p className="text-[13px] text-gray-400 mt-1">Grouped by statement year. Rename or delete anytime.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="application/pdf"
            onChange={handleUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-xl outline-none cursor-pointer shadow-sm disabled:opacity-50"
            style={{ padding: '8px 14px', border: '1px solid #e5e7eb', backgroundColor: 'var(--clio-glass)', color: '#4b5563', fontSize: '14px' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f9fafb')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--clio-glass)')}
          >
            {uploading
              ? <><LuLoader size={14} className="animate-spin" /> Uploading…</>
              : <><LuUpload size={14} /> Upload statement</>
            }
          </button>
        </div>
      </div>

      {/* Processing banner */}
      {processing.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-[13px] text-amber-700"
          style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
          <LuLoader size={13} className="animate-spin shrink-0" />
          {processing.length} statement{processing.length !== 1 ? 's' : ''} processing — this may take a minute…
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="text-[13px] text-gray-400 flex items-center gap-2">
          <LuLoader size={13} className="animate-spin" /> Loading statements…
        </div>
      )}

      {/* Empty state */}
      {!isLoading && years.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
          <LuFileText size={32} className="text-gray-300" />
          <p className="text-[15px] font-medium text-gray-500">No statements yet</p>
          <p className="text-[13px] text-gray-400">Upload a PDF bank statement to get started</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium"
            style={{ backgroundColor: 'var(--clio-primary)', color: 'var(--clio-primary-foreground)' }}
          >
            <LuUpload size={13} /> Upload statement
          </button>
        </div>
      )}

      {/* Grouped year sections */}
      <div className="flex flex-col gap-4">
        {years.map(year => (
          <div
            key={year}
            className="rounded-2xl p-5 flex flex-col gap-1"
            style={{ backgroundColor: 'var(--clio-glass)', border: '1px solid rgba(255,255,255,0.6)' }}
          >
            {/* Year header */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[22px] font-bold text-gray-900">{year}</h2>
              <span className="text-[12px] text-gray-400">
                {grouped[year].length} file{grouped[year].length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Statement rows */}
            <div className="flex flex-col gap-1">
              {grouped[year].map((s, i) => (
                <div key={s.statement_id}>
                  {i > 0 && <div className="h-px bg-gray-100 mx-1 my-1" />}

                  {editingId === s.statement_id ? (
                    /* Rename row */
                    <div className="flex items-center gap-3 px-2 py-2.5">
                      <LuFileText size={16} className="text-gray-400 shrink-0" />
                      <input
                        autoFocus
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') cancelRename(); if (e.key === 'Escape') cancelRename() }}
                        className="flex-1 text-[14px] rounded-lg px-2 py-1 border border-clio-glass-border bg-white outline-none"
                      />
                      <button
                        onClick={cancelRename}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-green-500 hover:bg-green-50 transition-colors"
                      >
                        <LuCheck size={14} />
                      </button>
                      <button
                        onClick={cancelRename}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                      >
                        <LuX size={14} />
                      </button>
                    </div>
                  ) : (
                    /* Normal row */
                    <div
                      className="flex items-center gap-3 px-2 py-2.5 rounded-xl cursor-pointer transition-colors hover:bg-white/60"
                      onClick={() => { setSelectedId(s.statement_id); navigate('/transactions') }}
                    >
                      <LuFileText size={16} className="text-gray-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-medium text-gray-800 truncate">
                          {formatLabel(s)}
                        </div>
                        <div className="text-[12px] text-gray-400">
                          Uploaded {formatUploadDate(s)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={e => { e.stopPropagation(); startRename(s) }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <LuPencil size={13} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(s.statement_id) }}
                          disabled={deletingId === s.statement_id}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                        >
                          {deletingId === s.statement_id
                            ? <LuLoader size={13} className="animate-spin" />
                            : <LuTrash2 size={13} />
                          }
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}