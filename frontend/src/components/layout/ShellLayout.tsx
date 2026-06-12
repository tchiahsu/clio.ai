import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"

interface ShellLayoutProps {
  children?: React.ReactNode;
}

export default function ShellLayout({ children }: ShellLayoutProps) {
  return (
    <div className="flex h-screen p-7 gap-5">
      <Sidebar />
      <main className="flex-1 rounded-2xl p-8 overflow-y-auto pb-24 md:pb-8">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}