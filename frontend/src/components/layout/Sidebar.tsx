import { NavLink, useNavigate } from 'react-router-dom'
import { MdOutlineDashboard } from 'react-icons/md'
import {
  LuWallet, LuArrowLeftRight, LuTarget, LuFileText,
  LuUpload, LuSparkles, LuMessageSquare,
  LuChevronDown, LuLoader, LuLogOut, LuLogIn, LuTrash2
} from 'react-icons/lu'
import { RiPieChartLine } from 'react-icons/ri'
import { useRef, useState, useEffect } from 'react'
import { useStatements } from '../../context/StatementContext'
import { FaCircleArrowDown } from "react-icons/fa6";

const navItems = [
  { name: 'Dashboard',    path: '/dashboard',    icon: <MdOutlineDashboard /> },
  { name: 'Accounts',     path: '/accounts',     icon: <LuWallet /> },
  { name: 'Categories',   path: '/categories',   icon: <RiPieChartLine /> },
  { name: 'Transactions', path: '/transactions', icon: <LuArrowLeftRight /> },
  { name: 'Budgets',      path: '/budgets',      icon: <LuTarget /> },
  { name: 'Statements',   path: '/statements',   icon: <LuFileText /> },
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
  const [uploading, setUploading]             = useState(false)
  const [user, setUser]                       = useState<User | null>(null)
  const [chats, setChats]                     = useState<Chat[]>([])
  const [statementPickerOpen, setStatementPickerOpen] = useState(false)
  const [activeChatId, setActiveChatId]       = useState<number | null>(null)
  const [canScrollChats, setCanScrollChats]   = useState(false)

  const fileInputRef       = useRef<HTMLInputElement>(null)
  const statementPickerRef = useRef<HTMLDivElement>(null)
  const chatListRef        = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => { if (data.ok) setUser(data.user) })
      .catch(err => console.error('Failed to fetch user', err))
  }, [])

  useEffect(() => {
    fetch('/api/chat/history')
      .then(r => r.json())
      .then(data => { if (data.data) setChats(data.data) })
      .catch(err => console.error('Failed to fetch chats', err))
  }, [])

  // Refresh chats when a new chat is created in AskClio
  useEffect(() => {
    const refresh = () => {
      fetch('/api/chat/history')
        .then(r => r.json())
        .then(data => { if (data.data) setChats(data.data) })
        .catch(err => console.error('Failed to refresh chats', err))
    }
    window.addEventListener('chat-created', refresh)
    return () => window.removeEventListener('chat-created', refresh)
  }, [])

  // Track active chat from AskClio
  useEffect(() => {
    const onChatChanged = (e: Event) => {
      const chatId = (e as CustomEvent).detail?.chatId ?? null
      setActiveChatId(chatId)
    }
    window.addEventListener('chat-changed', onChatChanged)
    return () => window.removeEventListener('chat-changed', onChatChanged)
  }, [])

  // Detect if chat list is scrollable — re-run when chats change or section opens
  useEffect(() => {
    const el = chatListRef.current
    if (!el) return
    const check = () => setCanScrollChats(el.scrollHeight > el.clientHeight)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [chats, chatsOpen])

  // Close statement dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statementPickerRef.current && !statementPickerRef.current.contains(e.target as Node)) {
        setStatementPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      navigate('/login')
    } catch (err) {
      console.error('Logout failed', err)
    }
  }

  const handleDeleteChat = async (chatId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await fetch(`/api/chat?chatId=${chatId}`, { method: 'DELETE' })
      setChats(prev => prev.filter(c => c.chat_id !== chatId))
      if (chatId === activeChatId) {
        window.dispatchEvent(new Event('chat-reset'))
      }
    } catch (err) {
      console.error('Failed to delete chat', err)
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
  const selectedStatement = completeStatements.find(s => s.statement_id === selectedId)

  return (
    <>
      {/* ── Desktop sidebar ───────────────────────────────────────────────── */}
      <div className="hidden md:flex w-70 self-stretch rounded-2xl p-4 flex-col gap-1 bg-clio-glass border border-clio-glass-border backdrop-blur-xl shadow-lg">

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
          />
          {chatsOpen && (
            <div className="flex flex-col">
              <div
                ref={chatListRef}
                className="flex flex-col gap-0.5 max-h-40 overflow-y-auto mt-0.5 px-1"
              >
                {chats.length === 0 ? (
                  <p className="px-3 py-1.5 text-[12px] text-clio-muted-foreground italic">No chats yet</p>
                ) : chats.map(chat => (
                  <div
                    key={chat.chat_id}
                    className="group flex items-center gap-1 rounded-lg hover:bg-gray-200 pl-2 transition-colors"
                  >
                    <button
                      onClick={() => navigate(`/dashboard?chatId=${chat.chat_id}`)}
                      className="flex-1 flex items-center gap-2 px-3 py-1.5 text-[12px]! truncate text-left text-clio-foreground-70 hover:text-gray-800 min-w-0"
                    >
                      <LuMessageSquare size={13} className="shrink-0 opacity-50" />
                      <span className="truncate">{chat.title}</span>
                    </button>
                    <button
                      onClick={e => handleDeleteChat(chat.chat_id, e)}
                      className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 hover:bg-red-50 mr-1"
                      title="Delete chat"
                    >
                      <LuTrash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
              {canScrollChats && (
                <div className="flex justify-center py-2 pointer-events-none">
                  <span className="animate-bounce text-gray-400 text-[13px]"><FaCircleArrowDown /></span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1" />

        <div className="h-px bg-clio-glass-border mx-2 mb-2 shrink-0" />

        {/* ── Statement selector card ────────────────────────────────────── */}
        <div className="rounded-2xl p-3.5 bg-glass-inset border border-clio-glass-border shadow-sm flex flex-col gap-2 shrink-0 mx-0.5 mb-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px]! uppercase tracking-widest text-clio-muted-foreground">Statement</span>
            <div className="flex items-center gap-1.5">
              {statements.some(s => s.current_status === 'processing' || s.current_status === 'queued') && (
                <span className="text-[11px]! text-amber-500 flex items-center gap-1">
                  <LuLoader size={10} className="animate-spin" />
                  {statements.filter(s => s.current_status !== 'complete' && s.current_status !== 'failed').length}
                </span>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf" onChange={handleFileUpload} />
              <button
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="w-5 h-5 flex items-center justify-center rounded-md text-clio-muted-foreground hover:text-clio-primary hover:bg-white/60 transition-colors disabled:opacity-40"
                title="Upload statement"
              >
                {uploading ? <LuLoader size={11} className="animate-spin" /> : <LuUpload size={11} />}
              </button>
            </div>
          </div>

          {/* Dropdown */}
          <div className="relative" ref={statementPickerRef}>
            <button
              onClick={() => setStatementPickerOpen(o => !o)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl
                text-[12px]! bg-white/40 hover:bg-white/60 transition-colors border border-white/50"
            >
              <span className="text-clio-foreground-70 truncate">
                {isLoading ? 'Loading…'
                  : selectedStatement ? formatLabel(selectedStatement)
                  : completeStatements.length === 0 ? 'No statements yet'
                  : 'Select a statement'}
              </span>
              <LuChevronDown size={12} className={`text-clio-muted-foreground transition-transform shrink-0 ml-1 ${statementPickerOpen ? 'rotate-180' : ''}`} />
            </button>

            {statementPickerOpen && (
              <div
                className="absolute left-0 right-0 flex flex-col gap-2 z-20 p-3 bottom-full mb-1 rounded-xl border border-clio-glass-border shadow-lg overflow-hidden max-h-48 overflow-y-auto"
                style={{ backgroundColor: 'white' }}
              >
                {completeStatements.map(s => {
                  const isSelected = s.statement_id === selectedId
                  return (
                    <button
                      key={s.statement_id}
                      onClick={() => { setSelectedId(s.statement_id); setStatementPickerOpen(false) }}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 text-[12px]! text-left rounded-xl"
                      style={{
                        backgroundColor: isSelected ? '#f3f4f6' : 'white',
                        color: '#374151',
                        fontWeight: isSelected ? 600 : 400,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f3f4f6' }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = isSelected ? '#f3f4f6' : 'white' }}
                    >
                      <span className="truncate ml-2">{formatLabel(s)}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

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