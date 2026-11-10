export default function Logo({ size = 'h-8 w-8' }) {
  return (
    <span className={`inline-flex ${size} items-center justify-center rounded-lg bg-linear-to-br from-blue-600 to-sky-500 shadow-sm`}>
      <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill="white" aria-hidden="true">
        <path d="M7 18h10.5a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 7.4 10.7 3.7 3.7 0 0 0 7 18z" />
      </svg>
    </span>
  )
}
