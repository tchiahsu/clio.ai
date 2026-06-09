import { NavLink } from 'react-router-dom';
import { MdOutlineDashboard } from "react-icons/md";
import { LuWallet, LuArrowLeftRight, LuTarget, LuFileText, LuPlus, LuUpload, LuSparkles, LuMessageSquare } from "react-icons/lu";
import { RiPieChartLine } from "react-icons/ri";

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
  return (
    <div className="w-70 self-stretch rounded-2xl p-4 flex flex-col gap-1
      bg-clio-glass border border-clio-glass-border">

      <div className="flex items-center gap-4 px-2 mb-6">
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
              `flex items-center gap-3 px-3 py-3 rounded-xl text-[15px]
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


      <div className="flex items-center justify-between px-3 pt-8 pb-1">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-clio-muted-foreground">
          <LuMessageSquare size={14} />
          Chats
        </div>
        <button
          className="flex items-center gap-1 rounded-full px-4 min-w-15 justify-center font-semibold"
          style={{ backgroundColor: '#1a1f36', color: '#f8f9fc', fontSize: '11px', padding: '4px 6px' }}
        >
          <LuPlus size={12} /> New
        </button>
      </div>

      <div className="flex items-center justify-between px-3 pb-1 mt-6">
        <span className="text-[11px] uppercase tracking-widest text-clio-muted-foreground">
          Statements
        </span>
        <button
          className="flex items-center gap-1 rounded-full px-4 py-4 min-w-17.5 justify-center font-semibold"
          style={{ backgroundColor: '#1a1f36', color: '#f8f9fc', fontSize: '11px', padding: '4px 6px' }}
        >
          <LuUpload size={12} /> Upload
        </button>
      </div>

      {dummyStatements.map((s) => (
        <div key={s} className="px-3 py-1.5 text-[13px] rounded-lg cursor-pointer hover:bg-white/50
          text-clio-foreground-70">
          {s}
        </div>
      ))}

      <div className="flex-1" />
      <div className="border-t border-white/40 my-2" />

      <div className="rounded-2xl p-3.5 bg-glass-inset border border-clio-glass-border">
        <div className="text-[11px] text-clio-muted-foreground mb-0.5">Signed in as</div>
        <div className="text-[15px] font-semibold text-clio-primary">Tony Stark</div>
        <div className="inline-flex items-center gap-1.5 text-[11px] font-medium rounded-full px-2.5 py-1 mt-2
          bg-clio-success-bg text-clio-success">
          <span className="w-1.5 h-1.5 rounded-full bg-clio-success" />
          Demo mode
        </div>
      </div>

    </div>
  )
}