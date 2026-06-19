import { Navigate, Outlet } from 'react-router-dom'
import { LuLoader } from 'react-icons/lu'
import { useAuth } from '../../context/AuthContext'

/**
 * Gate for authenticated routes. While the session is being resolved we show a
 * spinner; once resolved, unauthenticated users are redirected to /login and
 * authenticated users get the nested routes.
 */
export default function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-clio-muted-foreground">
        <LuLoader size={22} className="animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}
