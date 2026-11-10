import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { fetchFiles } from '../api/filesApi'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import FileUpload from '../components/FileUpload'
import FileList from '../components/FileList'
import StatCard from '../components/StatCard'
import { getErrorMessage } from '../utils/errors'
import { formatBytes } from '../utils/format'

const FilesIcon = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path strokeLinejoin="round" d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
    <path strokeLinejoin="round" d="M14 3v5h5" />
  </svg>
)

const StorageIcon = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <ellipse cx="12" cy="6" rx="8" ry="3" />
    <path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
  </svg>
)

export default function Dashboard() {
  const { user } = useAuth()
  const [files, setFiles] = useState([])
  const [stats, setStats] = useState({ count: 0, totalBytes: 0 })
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // Wait until the user stops typing for 300 ms before searching
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  const loadFiles = useCallback(async () => {
    try {
      const data = await fetchFiles(debouncedSearch)
      setFiles(data.files)
      setStats(data.stats)
    } catch (error) {
      if (error.response?.status !== 401) toast.error(getErrorMessage(error, 'Could not load your files.'))
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Hello, {user.username}</h1>
          <p className="mt-1 text-sm text-slate-500">Upload, download and manage your files stored in Amazon S3.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard label="Total files" value={stats.count} icon={FilesIcon} />
          <StatCard label="Storage used" value={formatBytes(stats.totalBytes)} icon={StorageIcon} />
        </div>

        <FileUpload onUploaded={loadFiles} />

        <FileList files={files} loading={loading} search={search} onSearchChange={setSearch} onChanged={loadFiles} />
      </main>

      <footer className="pb-8 text-center text-xs text-slate-400">CloudVault · Amazon S3 · Amazon EC2 · AWS IAM</footer>
    </div>
  )
}
