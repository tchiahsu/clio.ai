import { NavLink } from 'react-router-dom';
import { MdOutlineDashboard } from "react-icons/md";
import { LuWallet, LuArrowLeftRight, LuTarget, LuFileText, LuPlus, LuUpload, LuSparkles, LuMessageSquare } from "react-icons/lu";
import { RiPieChartLine } from "react-icons/ri";
import { useRef, useState } from 'react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: <MdOutlineDashboard /> },
  { name: 'Accounts', path: '/accounts', icon: <LuWallet /> },
  { name: 'Transactions', path: '/transactions', icon: <LuArrowLeftRight /> },
  { name: 'Budgets', path: '/budgets', icon: <LuTarget /> },
  { name: 'Statements', path: '/statements', icon: <LuFileText /> },
  { name: 'Categories', path: '/categories', icon: <RiPieChartLine /> },
];

const dummyStatements = [
  'Chase Checking - Jan 2025',
  'BofA Savings - Aug 2024',
  'Chase Credit - Dec 2024',
];

export default function Sidebar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <div className="hidden md:flex w-70 self-stretch rounded-2xl p-4 flex-col gap-1 bg-clio-glass border border-clio-glass-border backdrop-blur-xl shadow-lg">

        <div className="flex items-center gap-4 px-2 mb-6 mt-2">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl
            bg-clio-primary text-clio-primary-foreground">
            <LuSparkles />
          </div>
          <div>
            <div className="text-2xl font-semibold text-clio-primary">Clio</div>
            <div className="text-[12px] uppercase tracking-widest text-clio-muted-foreground">Finance AI</div>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {navItems.map(({ name, path, icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-xl text-[14px]
                no-underline transition-all duration-200
                ${isActive
                  ? 'bg-clio-primary text-clio-primary-foreground'
                  : 'text-[#757a8a] hover:bg-white hover:text-black'
                }`
              }
            >
              <span className="text-[18px]">{icon}</span>
              {name}
            </NavLink>
          ))}
        </nav>


        <div className="flex items-center justify-between px-3 mt-8 pb-1">
          <div className="flex items-center gap-1.5 text-[12px] uppercase tracking-widest text-clio-muted-foreground">
            <LuMessageSquare size={14} />
            Chats
          </div>
          <button
            className="flex items-center gap-1 rounded-full px-4 min-w-15 justify-center font-semibold"
            style={{ backgroundColor: '#1a1f36', color: '#f8f9fc', fontSize: '11px', padding: '4px 6px' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#373a47')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1a1f36')}
          >
            <LuPlus size={12} /> New
          </button>
        </div>

        <div className="flex-1" />

        <div className="flex items-center justify-between px-3 pb-1">
          <span className="text-[12px] uppercase tracking-widest text-clio-muted-foreground">
            Statements
          </span>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => console.log(e.target.files)}
          />
          <button
            className="flex items-center gap-1 rounded-full px-4 py-4 min-w-17.5 justify-center font-semibold"
            style={{ backgroundColor: '#1a1f36', color: '#f8f9fc', fontSize: '11px', padding: '4px 6px' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#373a47')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1a1f36')}
            onClick={() => fileInputRef.current?.click()}
          >
            <LuUpload size={12} /> Upload
          </button>
        </div>

        {dummyStatements.map((s) => (
          <NavLink
            key={s}
            to="/statements"
            className="px-3 py-1.5 text-[13px] rounded-lg cursor-pointer hover:bg-white/50 text-clio-foreground-70 no-underline block"
          >
            {s}
          </NavLink>
        ))}
        
        <div className="rounded-2xl p-3.5 bg-glass-inset border border-clio-glass-border mt-8 shadow-sm">
          <div className="text-[11px] text-clio-muted-foreground mb-0.5">Signed in as</div>
          <div className="text-[15px] font-semibold text-clio-primary">Tony Stark</div>
          <button
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 mt-2 min-w-17.5 justify-center font-semibold"
            style={{ backgroundColor: 'rgba(52, 168, 112, 0.15)', color: '#34a870', fontSize: '11px', padding: '4px 10px' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(52, 168, 112, 0.35)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(52, 168, 112, 0.15)')}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-clio-success" /> Demo mode
          </button>
        </div>

      </div>

      {/* Hamburger mobile button — fixed bottom right */}
      <div className="md:hidden fixed bottom-4 right-4 z-50 bg-white border rounded-2xl">

        {/* Expanded menu — grows upward */}
        {menuOpen && (
          <div className="absolute bottom-14 right-0
            bg-white border border-gray-100
            rounded-2xl shadow-lg p-2 flex flex-col gap-1 w-44">

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
              onClick={() => { fileInputRef.current?.click(); setMenuOpen(false); }}
            >
              <LuUpload size={16} />
              <span className="text-[13px]">Upload Statement</span>
            </button>

            <button
              className="flex items-center gap-3 px-3 py-2 mt-1 rounded-xl text-[13px] text-gray-400 hover:bg-gray-50 hover:text-gray-700 w-full text-left"
              onClick={() => setMenuOpen(false)}
            >
              <LuMessageSquare size={16} />
              <span className="text-[13px]">New Chat</span>
            </button>
          </div>
        )}

        {/* Hamburger button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center gap-1.5
            bg-white shadow-lg"
        >
          <span className={`block w-5 h-0.5 bg-gray-500 transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-5 h-0.5 bg-gray-500 transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-gray-500 transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>

      </div>
    </>
  )
}