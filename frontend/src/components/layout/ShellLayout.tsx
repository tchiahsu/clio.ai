import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"

interface ShellLayoutProps {
  children?: React.ReactNode;
}

export default function ShellLayout({ children }: ShellLayoutProps) {
  return (
    <div className="flex h-screen bg-[#EEF2FA] p-7 gap-5">
      <Sidebar />
      <main className="flex-1 bg-white rounded-2xl p-8 min-h-full">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}