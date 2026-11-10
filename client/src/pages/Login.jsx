import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/AuthLayout'
import FormField from '../components/FormField'
import Spinner from '../components/Spinner'
import { getErrorMessage } from '../utils/errors'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.username.trim() || !form.password) {
      setError('Please enter your username and password.')
      return
    }

    setSubmitting(true)
    try {
      const user = await login(form.username.trim(), form.password)
      toast.success(`Welcome back, ${user.username}!`)
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed. Please try again.'))
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Log in"
      subtitle="Access your files stored securely in the cloud."
      footer={
        <>
          New to CloudVault?{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:text-blue-700">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>}

        <FormField id="username" label="Username" value={form.username} onChange={handleChange} autoComplete="username" autoFocus />
        <FormField id="password" label="Password" type="password" value={form.password} onChange={handleChange} autoComplete="current-password" />

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting && <Spinner className="h-4 w-4" />}
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </AuthLayout>
  )
}
