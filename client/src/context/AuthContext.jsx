import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { fetchCurrentUser, loginUser, logoutUser, registerUser } from '../api/authApi'
import { setUnauthorizedHandler } from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // true until we know whether the user is logged in

  // On page load, ask the server whether the login cookie is still valid.
  useEffect(() => {
    fetchCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  // If any API call returns 401 (session expired), log the user out.
  const userRef = useRef(null)
  useEffect(() => {
    userRef.current = user
  }, [user])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (userRef.current) {
        toast.error('Your session has expired. Please log in again.', { id: 'session-expired' })
      }
      setUser(null)
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  const login = useCallback(async (username, password) => {
    const loggedIn = await loginUser(username, password)
    setUser(loggedIn)
    return loggedIn
  }, [])

  const register = useCallback(async (username, password) => {
    const created = await registerUser(username, password)
    setUser(created)
    return created
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutUser()
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
