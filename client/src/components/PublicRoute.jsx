import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FullPageSpinner } from './Spinner'

/** Login and Register pages: logged-in users are sent straight to the dashboard. */
export default function PublicRoute() {
  const { user, loading } = useAuth()

  if (loading) return <FullPageSpinner />
  if (user) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
