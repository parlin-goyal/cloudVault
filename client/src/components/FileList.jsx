import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { deleteFile, downloadFile } from '../api/filesApi'
import { getErrorMessage } from '../utils/errors'
import ConfirmDialog from './ConfirmDialog'
import FileItem from './FileItem'
import Spinner from './Spinner'

/** Table of the user's files with search, download and delete. */
export default function FileList({ files, loading, search, onSearchChange, onChanged }) {
  const [downloadingId, setDownloadingId] = useState(null)
  const [fileToDelete, setFileToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDownload(file) {
    setDownloadingId(file.id)
    try {
      await downloadFile(file.id)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Download failed.'))
    } finally {
      setDownloadingId(null)
    }
  }

  async function handleConfirmDelete() {
    setDeleting(true)
    try {
      const message = await deleteFile(fileToDelete.id)
      toast.success(message)
      setFileToDelete(null)
      onChanged?.()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Delete failed.'))
    } finally {
      setDeleting(false)
    }
  }

  const closeDialog = useCallback(() => setFileToDelete(null), [])

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold text-slate-900">My files</h2>
        <div className="relative w-full sm:w-72">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by file name"
            aria-label="Search files"
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-blue-600">
          <Spinner className="h-7 w-7" />
        </div>
      ) : files.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <p className="text-sm font-medium text-slate-700">{search ? 'No matching files' : 'No files yet'}</p>
          <p className="mt-1 text-sm text-slate-500">
            {search ? `No file names contain "${search}".` : 'Upload your first file using the area above.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead>
              <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <th scope="col" className="py-3 pl-5 pr-3">Name</th>
                <th scope="col" className="hidden w-28 px-3 py-3 text-right sm:table-cell">Size</th>
                <th scope="col" className="hidden w-48 px-3 py-3 md:table-cell">Uploaded</th>
                <th scope="col" className="w-44 py-3 pl-3 pr-5 text-right sm:w-48">Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <FileItem
                  key={file.id}
                  file={file}
                  downloading={downloadingId === file.id}
                  onDownload={handleDownload}
                  onDelete={setFileToDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(fileToDelete)}
        title="Delete file?"
        message={fileToDelete ? `"${fileToDelete.name}" will be permanently deleted from cloud storage. This cannot be undone.` : ''}
        busy={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={closeDialog}
      />
    </section>
  )
}
