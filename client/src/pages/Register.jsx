import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/AuthLayout'
import FormField from '../components/FormField'
import Spinner from '../components/Spinner'
import { getErrorMessage } from '../utils/errors'

const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{3,30}$/

function validate({ username, password, confirmPassword }) {
  if (!USERNAME_PATTERN.test(username.trim())) {
    return 'Username must be 3–30 characters: letters, numbers, dots, dashes or underscores.'
  }
  if (password.length < 8) return 'Password must be at least 8 characters long.'
  if (password.length > 72) return 'Password must be at most 72 characters long.'
  if (password !== confirmPassword) return 'Passwords do not match.'
  return ''
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    const validationError = validate(form)
    setError(validationError)
    if (validationError) return

    setSubmitting(true)
    try {
      const user = await register(form.username.trim(), form.password)
      toast.success(`Welcome, ${user.username}! Your account is ready.`)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed. Please try again.'))
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Your files are private and visible only to you."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>}

        <FormField
          id="username"
          label="Username"
          value={form.username}
          onChange={handleChange}
          autoComplete="username"
          hint="3–30 characters: letters, numbers, dots, dashes or underscores."
          autoFocus
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          value={form.password}
          onChange={handleChange}
          autoComplete="new-password"
          hint="At least 8 characters."
        />
        <FormField
          id="confirmPassword"
          label="Confirm password"
          type="password"
          value={form.confirmPassword}
          onChange={handleChange}
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting && <Spinner className="h-4 w-4" />}
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  )
}
