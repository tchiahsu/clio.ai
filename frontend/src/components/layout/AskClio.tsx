import { useState, useRef, useEffect } from "react";
import { LuSparkles, LuArrowUp, LuChevronDown, LuChevronUp } from 'react-icons/lu'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatSession {
  chat_id: string
  title: string
  created_at: string
}

interface ChatMessage {
  speaker_type: string
  message_content: string
}

const SUGGESTED_PROMPTS = [
  'How much did I spend on food this month?',
  'Am I on track with my budget?',
  'Where can I cut back?',
]

export default function AskClio() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "I'm your finance assistant. I can break down spending, flag unusual transactions, and help you hit your goals. Ask me anything.",
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [recentChats, setRecentChats] = useState<ChatSession[]>([])
  const [chatId, setChatId] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSend = async (text?: string) => {
    const query = text ?? input
    if (!query.trim()) return

    setIsExpanded(true) 

    if (text) setInput(text)

    const userMessage: Message = { role: 'user', content: query }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      let currentChatId = chatId
      if (!currentChatId) {
        const sessionRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: query.slice(0, 50) }),
        })
        const sessionData = await sessionRes.json()
        currentChatId = sessionData.data.chat_id
        setChatId(currentChatId)
      }

      const response = await fetch(`/api/chat/message?chatId=${currentChatId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: query }),
      })

      const data = await response.json()
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.aiData.message_content,
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
      }])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const fetchRecentChats = async () => {
      try {
        const response = await fetch('/api/chat/recent')
        const result = await response.json()
        setRecentChats(result.data)
      } catch {
        console.error('Failed to fetch recent chats')
      }
    }
    fetchRecentChats()
  }, [])

  const handleLoadChat = async (loadChatId: string) => {
    try {
      const response = await fetch(`/api/chat/messages?chatId=${loadChatId}`)
      const result = await response.json()
      setChatId(Number(loadChatId))
      const loaded: Message[] = result.data.map((m: ChatMessage) => ({
        role: (m.speaker_type === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.message_content,
      }))
      setMessages(loaded)
    } catch {
      console.error('Failed to load chat')
    }
  }

  return (
    <div className="bg-clio-glass border-clio-glass-border rounded-2xl p-5 flex flex-col gap-4 shadow-sm">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
            style={{ backgroundColor: '#1a1f36', color: '#f8f9fc' }}
          >
            <LuSparkles size={18} />
          </div>
          <div>
            <p className="text-[19px] font-semibold text-gray-900">Ask Clio</p>
            <p className="text-[14px] text-gray-500">Your AI finance assistant</p>
          </div>
        </div>
        <button
          className="flex items-center gap-1 rounded-xl shadow-xs"
          style={{ backgroundColor: 'var(--clio-glass)', border: '1px solid #ffffff', padding: '2px 6px', fontSize: '12px', color: '#6b7280' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f9fafb')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--clio-glass)')}
          onClick={() => setIsExpanded(prev => !prev)}
        >
          {isExpanded
            ? <><LuChevronUp size={14} /> Collapse</>
            : <><LuChevronDown size={14} /> Open chat</>
          }
        </button>
      </div>

      {isExpanded && (
        <div className="flex flex-col gap-2 mb-4">

          {/* Show chats only when no conversation has started */}
          {messages.length <= 1 && recentChats.map((chat) => (
            <div
              key={chat.chat_id}
              onClick={() => handleLoadChat(chat.chat_id)}
              className="text-[13px] px-4 py-3 rounded-xl shadow-sm bg-gray-100 text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors w-fit"
            >
              <p className="font-medium">{chat.title}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {new Date(chat.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          ))}

          {/* Message history */}
          {messages.slice(1).map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`text-[13px] px-4 py-3 rounded-2xl max-w-[85%] ${
                  msg.role === 'user'
                    ? 'text-white rounded-tr-sm'
                    : 'bg-white text-gray-700 rounded-tl-sm shadow-sm'
                }`}
                style={msg.role === 'user' ? { backgroundColor: '#1a1f36' } : {}}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="text-[13px] px-4 py-3 rounded-2xl bg-white text-gray-400 shadow-sm rounded-tl-sm">
                Thinking...
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 mt-auto">
        {isExpanded && (
          <div className="flex flex-wrap gap-2 mt-4">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                className="rounded-full hover:bg-gray-100 transition-colors shadow-sm"
                style={{ background: 'var(--clio-glass)', border: '2px solid #ffff', padding: '2px 8px', fontSize: '12px', color: '#6b7280' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#ffffff')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--clio-glass)')}
                onClick={() => handleSend(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 bg-white border-clio-glass-border rounded-full px-4 py-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask about your finances..."
            className="flex-1 bg-transparent text-[13px] text-gray-700 outline-none placeholder-gray-400"
          />
          <button
            onClick={() => handleSend()}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity"
            style={{ backgroundColor: '#1a1f36', color: '#f8f9fc', border: 'none', padding: 0 }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2d3452')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1a1f36')}
          >
            <LuArrowUp size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}