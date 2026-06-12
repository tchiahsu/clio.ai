import { NavLink, useNavigate } from 'react-router-dom'
import { MdOutlineDashboard } from 'react-icons/md'
import {
  LuWallet, LuArrowLeftRight, LuTarget, LuFileText,
  LuPlus, LuUpload, LuSparkles, LuMessageSquare,
  LuChevronDown, LuLoader, LuLogOut, LuLogIn
} from 'react-icons/lu'
import { RiPieChartLine } from 'react-icons/ri'
import { useRef, useState, useEffect } from 'react'
import { useStatements } from '../../context/StatementContext'

const navItems = [
  { name: 'Dashboard',    path: '/dashboard',    icon: <MdOutlineDashboard /> },
  { name: 'Accounts',     path: '/accounts',     icon: <LuWallet /> },
  { name: 'Transactions', path: '/transactions', icon: <LuArrowLeftRight /> },
  { name: 'Budgets',      path: '/budgets',      icon: <LuTarget /> },
  { name: 'Statements',   path: '/statements',   icon: <LuFileText /> },
  { name: 'Categories',   path: '/categories',   icon: <RiPieChartLine /> },
]

function formatLabel(s: { bank_name: string; account_type: string; period_end: string }) {
  const date = new Date(s.period_end).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  return `${s.bank_name} ${s.account_type} — ${date}`
}

interface User {
  id: number
  email: string
  firstName: string
  lastName: string
}

interface Chat {
  chat_id: number
  title: string
  created_at: string
}

function SectionHeader({
  label, open, onToggle, action
}: {
  label: string
  open: boolean
  onToggle: () => void
  action?: React.ReactNode
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg
        text-[12px] font-medium text-clio-muted-foreground hover:text-clio-primary transition-colors"
    >
      <span className="flex items-center gap-2">
        <LuChevronDown
          size={13}
          className={`transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
        />
        {label}
      </span>
      {action && <span onClick={e => e.stopPropagation()}>{action}</span>}
    </button>
  )
}

export default function Sidebar() {
  const navigate = useNavigate()
  const { statements, selectedId, setSelectedId, isLoading, reload } = useStatements()

  const [menuOpen, setMenuOpen]               = useState(false)
  const [chatsOpen, setChatsOpen]             = useState(true)
  const [statementsOpen, setStatementsOpen]   = useState(true)
  const [uploading, setUploading]             = useState(false)
  const [user, setUser]                       = useState<User | null>(null)
  const [chats, setChats]                     = useState<Chat[]>([])
  const [creatingChat, setCreatingChat]       = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => { if (data.ok) setUser(data.user) })
      .catch(err => console.error('Failed to fetch user', err))
  }, [])

  useEffect(() => {
    fetch('/api/chat/recent')
      .then(r => r.json())
      .then(data => { if (data.data) setChats(data.data) })
      .catch(err => console.error('Failed to fetch chats', err))
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      navigate('/login')
    } catch (err) {
      console.error('Logout failed', err)
    }
  }

  const handleNewChat = async () => {
    setCreatingChat(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat' }),
      })
      const data = await res.json()
      if (data.data?.chat_id) {
        setChats(prev => [data.data, ...prev])
        navigate(`/chat/${data.data.chat_id}`)
      }
    } catch (err) {
      console.error('Failed to create chat', err)
    } finally {
      setCreatingChat(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/statement/upload', { method: 'POST', body: formData })
      const result = await res.json()
      if (!res.ok) { alert(result.error ?? 'Upload failed'); return }
      const statementId: number = result.statementId
      await pollUntilComplete(statementId)
      await reload()
      setSelectedId(statementId)
    } catch (err) {
      console.error('Upload failed', err)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function pollUntilComplete(statementId: number, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 2000))
      try {
        const res = await fetch(`/api/statement/status?statementId=${statementId}`)
        const data = await res.json()
        const status = data.data?.current_status
        if (status === 'complete' || status === 'failed') return
      } catch { /* network blip */ }
    }
  }

  const completeStatements = statements.filter(s => s.current_status === 'complete')



  return (
    <>
      {/* ── Desktop sidebar ───────────────────────────────────────────────── */}
      <div className="hidden md:flex w-70 self-stretch rounded-2xl p-4 flex-col gap-1 bg-clio-glass border border-clio-glass-border backdrop-blur-xl shadow-lg h-full overflow-hidden">

        {/* Logo */}
        <div className="flex items-center gap-3 px-2 mb-4 mt-1 shrink-0">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg bg-clio-primary text-clio-primary-foreground shrink-0">
            <LuSparkles />
          </div>
          <div>
            <div className="text-xl font-semibold text-clio-primary leading-tight">Clio</div>
            <div className="text-[12px] tracking-widest text-clio-muted-foreground">Finance AI</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 shrink-0">
          {navItems.map(({ name, path, icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px]
                no-underline transition-all duration-150
                ${isActive
                  ? 'bg-clio-primary text-clio-primary-foreground'
                  : 'text-[#757a8a] hover:bg-white/60 hover:text-gray-800'
                }`
              }
            >
              <span className="text-[18px]">{icon}</span>
              {name}
            </NavLink>
          ))}
        </nav>

        <div className="h-px bg-clio-glass-border mx-2 my-2 shrink-0" />

        {/* ── Chats collapsible ──────────────────────────────────────────── */}
        <div className="flex flex-col min-h-0">
          <SectionHeader
            label="Chats"
            open={chatsOpen}
            onToggle={() => setChatsOpen(o => !o)}
            action={
              <button
                onClick={handleNewChat}
                disabled={creatingChat}
                className="w-5 h-5 flex items-center justify-center rounded-md
                  text-clio-muted-foreground hover:text-clio-primary hover:bg-white/60
                  transition-colors disabled:opacity-40"
                title="New chat"
              >
                {creatingChat
                  ? <LuLoader size={13} className="animate-spin" />
                  : <LuPlus size={13} />
                }
              </button>
            }
          />
          {chatsOpen && (
            <div className="flex flex-col gap-0.5 max-h-25 overflow-scroll mt-0.5 px-1">
              {chats.length === 0 ? (
                <p className="px-3 py-0.5 text-[12px] text-clio-muted-foreground italic">No chats yet</p>
              ) : chats.map(chat => (
                <NavLink
                  key={chat.chat_id}
                  to={`/chat/${chat.chat_id}`}
                  className={({ isActive }) =>
                    `px-3 py-0.5 text-[12px] rounded-lg truncate no-underline transition-colors block
                    ${isActive
                      ? 'bg-clio-primary/10 text-clio-primary font-medium'
                      : 'text-clio-foreground-70 hover:bg-white/50 hover:text-gray-800'
                    }`
                  }
                >
                  <span className="flex items-center gap-2">
                    <LuMessageSquare size={13} className="shrink-0 opacity-50" />
                    {chat.title}
                  </span>
                </NavLink>
              ))}
            </div>
          )}
        </div>

        <div className="h-px bg-clio-glass-border mx-2 my-2 shrink-0" />

        {/* ── Statements collapsible ─────────────────────────────────────── */}
        <div className="flex flex-col min-h-0">
          <SectionHeader
            label="Statements"
            open={statementsOpen}
            onToggle={() => setStatementsOpen(o => !o)}
            action={
              <div className="flex flex-row gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                />
                {statements.some(s => s.current_status === 'processing' || s.current_status === 'queued') && (
                  <span className="text-[11px] text-amber-500 flex items-center gap-1">
                    <LuLoader size={10} className="animate-spin" />
                    {statements.filter(s => s.current_status !== 'complete' && s.current_status !== 'failed').length}
                  </span>
                )}
                <button
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-5 h-5 flex items-center justify-center rounded-md
                    text-clio-muted-foreground hover:text-clio-primary hover:bg-white/60
                    transition-colors disabled:opacity-40"
                  title="Upload statement"
                >
                  {uploading
                    ? <LuLoader size={13} className="animate-spin" />
                    : <LuUpload size={13} />
                  }
                </button>
              </div>
            }
          />
          {statementsOpen && (
            <div className="flex flex-col gap-2 max-h-25 overflow-y-auto mt-2 px-1">
              {isLoading ? (
                <div className="px-3 py-1.5 text-[12px]! text-clio-muted-foreground flex items-center gap-1.5">
                  <LuLoader size={11} className="animate-spin" /> Loading…
                </div>
              ) : completeStatements.length === 0 ? (
                <p className="px-3 py-1.5 text-[12px]! text-clio-muted-foreground italic">
                  No statements yet — upload a PDF above
                </p>
              ) : completeStatements.map(s => (
                <button
                  key={s.statement_id}
                  onClick={() => setSelectedId(s.statement_id)}
                  className={`w-full text-left px-3 py-1.5 text-[12px]! rounded-lg truncate transition-colors
                    ${s.statement_id === selectedId
                      ? 'bg-clio-primary/10 text-clio-primary font-medium'
                      : 'text-clio-foreground-70 hover:bg-white/50 hover:text-gray-800'
                    }`}
                >
                  <span className="flex items-center gap-2 px-3">
                    <LuFileText size={13} className="shrink-0 opacity-50" />
                    {formatLabel(s)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        <div className="h-px bg-clio-glass-border mx-2 mb-2 shrink-0" />

      {/* ── User row ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-2 pb-1 shrink-0">
          {!user ? (
            <span className="inline-block text-[10px] tracking-wide font-semibold px-2 py-1 rounded-full"
              style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
              Guest
            </span>
          ) : user.email === 'demo@clio.ai' ? (
            <span className="inline-block text-[10px] tracking-wide font-semibold px-2 py-1 rounded-full"
              style={{ backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#ca8a04' }}>
              Demo
            </span>
          ) : (
            <span className="inline-block text-[10px] tracking-wide font-semibold px-2 py-1 rounded-full"
              style={{ backgroundColor: 'rgba(52, 168, 112, 0.15)', color: '#34a870' }}>
              Signed In
            </span>
          )}
          {!user ? (
            <button
              onClick={() => navigate('/login')}
              className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0
                text-clio-muted-foreground hover:text-green-500 hover:bg-green-50 transition-colors"
              title="Sign in"
            >
              <LuLogIn size={13} />
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0
                text-clio-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Sign out"
            >
              <LuLogOut size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile hamburger ──────────────────────────────────────────────── */}
      <div className="md:hidden fixed bottom-4 right-4 z-50 bg-white border rounded-2xl">
        {menuOpen && (
          <div className="absolute bottom-14 right-0 bg-white border border-gray-100 rounded-2xl shadow-lg p-2 flex flex-col gap-1 w-48">
            {navItems.map(({ name, path, icon }) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-[13px]
                  no-underline transition-all duration-200
                  ${isActive ? 'bg-gray-200 text-gray-900' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'}`
                }
              >
                <span className="text-[18px]">{icon}</span>
                {name}
              </NavLink>
            ))}
            <div className="h-px bg-gray-100 mx-2 my-1" />
            <button
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-700 w-full text-left"
              onClick={() => { fileInputRef.current?.click(); setMenuOpen(false) }}
            >
              <LuUpload size={16} />
              <span className="text-[13px]">Upload Statement</span>
            </button>
            <button
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] text-gray-400 hover:bg-gray-50 hover:text-gray-700 w-full text-left"
              onClick={() => { handleNewChat(); setMenuOpen(false) }}
            >
              <LuMessageSquare size={16} />
              <span className="text-[13px]">New Chat</span>
            </button>
            <div className="h-px bg-gray-100 mx-2 my-1" />
            <button
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] text-red-400 hover:bg-red-50 w-full text-left"
              onClick={handleLogout}
            >
              <LuLogOut size={16} />
              <span className="text-[13px]">Sign out</span>
            </button>
          </div>
        )}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center gap-1.5 bg-white shadow-lg"
        >
          <span className={`block w-5 h-0.5 bg-gray-500 transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-5 h-0.5 bg-gray-500 transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-gray-500 transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>
    </>
  )
}