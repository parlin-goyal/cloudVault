import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { uploadFile } from '../api/filesApi'
import { getErrorMessage } from '../utils/errors'
import { formatBytes } from '../utils/format'

const MAX_FILE_SIZE_MB = Number(import.meta.env.VITE_MAX_FILE_SIZE_MB) || 25
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
let uploadCounter = 0

/**
 * Drag-and-drop upload area. Files are uploaded one after another,
 * each with its own progress bar.
 */
export default function FileUpload({ onUploaded }) {
  const [queue, setQueue] = useState([]) // [{ key, name, size, progress, status, error }]
  const isUploading = queue.some((item) => item.status === 'uploading' || item.status === 'waiting')

  const updateItem = (key, changes) =>
    setQueue((items) => items.map((item) => (item.key === key ? { ...item, ...changes } : item)))

  const onDrop = useCallback(
    async (acceptedFiles, rejectedFiles) => {
      rejectedFiles.forEach(({ file, errors }) => {
        const tooLarge = errors.some((e) => e.code === 'file-too-large')
        toast.error(tooLarge ? `"${file.name}" is larger than ${MAX_FILE_SIZE_MB} MB.` : `"${file.name}" cannot be uploaded.`)
      })
      if (acceptedFiles.length === 0) return

      const newItems = acceptedFiles.map((file) => ({
        // (crypto.randomUUID is unavailable on plain-HTTP sites, so use a simple counter)
        key: `${file.name}-${file.size}-${++uploadCounter}`,
        file,
        name: file.name,
        size: file.size,
        progress: 0,
        status: 'waiting',
        error: null,
      }))
      setQueue((items) => [...newItems, ...items.filter((i) => i.status !== 'done')])

      for (const item of newItems) {
        updateItem(item.key, { status: 'uploading' })
        try {
          await uploadFile(item.file, (progress) => updateItem(item.key, { progress }))
          updateItem(item.key, { status: 'done', progress: 100 })
          toast.success(`"${item.name}" uploaded.`)
          onUploaded?.()
        } catch (error) {
          const message = getErrorMessage(error, 'Upload failed.')
          updateItem(item.key, { status: 'error', error: message })
          toast.error(message)
        }
      }

      // Clear finished uploads from the list after a short delay
      setTimeout(() => setQueue((items) => items.filter((i) => i.status !== 'done')), 2500)
    },
    [onUploaded],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: true,
  })

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Upload files</h2>

      <div
        {...getRootProps()}
        className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
        }`}
      >
        <input {...getInputProps()} aria-label="Choose files to upload" />
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0-4 4m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          </svg>
        </div>
        {isDragActive ? (
          <p className="text-sm font-medium text-blue-700">Drop the files here</p>
        ) : (
          <>
            <p className="text-sm font-medium text-slate-700">
              Drag and drop files here, or <span className="text-blue-600">browse</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Up to {MAX_FILE_SIZE_MB} MB per file · Encrypted at rest in Amazon S3
            </p>
          </>
        )}
      </div>

      {queue.length > 0 && (
        <ul className="mt-4 space-y-3">
          {queue.map((item) => (
            <li key={item.key} className="rounded-lg border border-slate-200 px-4 py-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium text-slate-700">{item.name}</span>
                <span className="shrink-0 text-xs text-slate-500">
                  {item.status === 'waiting' && 'Waiting…'}
                  {item.status === 'uploading' && `${item.progress}% of ${formatBytes(item.size)}`}
                  {item.status === 'done' && <span className="text-emerald-600">Uploaded</span>}
                  {item.status === 'error' && <span className="text-red-600">Failed</span>}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all ${item.status === 'error' ? 'bg-red-500' : item.status === 'done' ? 'bg-emerald-500' : 'bg-blue-600'}`}
                  style={{ width: `${item.status === 'error' ? 100 : item.progress}%` }}
                />
              </div>
              {item.error && <p className="mt-1.5 text-xs text-red-600">{item.error}</p>}
            </li>
          ))}
        </ul>
      )}

      {isUploading && <p className="mt-3 text-xs text-slate-500">Please keep this page open until uploads finish.</p>}
    </section>
  )
}
