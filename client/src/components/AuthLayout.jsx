import Logo from './Logo'

/** Shared layout for the Login and Register pages. */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-br from-slate-50 via-white to-blue-50 px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <Logo size="h-10 w-10" />
        <span className="text-2xl font-semibold tracking-tight text-slate-900">CloudVault</span>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>

      {footer && <p className="mt-6 text-sm text-slate-600">{footer}</p>}
      <p className="mt-10 text-xs text-slate-400">Secure file storage powered by Amazon S3 and EC2</p>
    </div>
  )
}
