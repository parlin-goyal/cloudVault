import { formatBytes, formatDate, getFileType } from '../utils/format'
import Spinner from './Spinner'

/** One row in the file table. */
export default function FileItem({ file, downloading, onDownload, onDelete }) {
  const type = getFileType(file.mimeType || '', file.name)

  return (
    <tr className="border-t border-slate-100 hover:bg-slate-50/70">
      <td className="max-w-0 py-3 pl-5 pr-3">
        <div className="flex items-center gap-3">
          <span className={`w-11 shrink-0 rounded-md py-1 text-center text-[10px] font-bold tracking-wide ${type.color}`}>
            {type.label}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800" title={file.name}>
              {file.name}
            </p>
            <p className="text-xs text-slate-500 sm:hidden">
              {formatBytes(file.size)} · {formatDate(file.uploadedAt)}
            </p>
          </div>
        </div>
      </td>
      <td className="hidden whitespace-nowrap px-3 py-3 text-right text-sm text-slate-600 sm:table-cell">{formatBytes(file.size)}</td>
      <td className="hidden whitespace-nowrap px-3 py-3 text-sm text-slate-500 md:table-cell">{formatDate(file.uploadedAt)}</td>
      <td className="whitespace-nowrap py-3 pl-3 pr-5 text-right">
        <div className="inline-flex gap-2">
          <button
            type="button"
            onClick={() => onDownload(file)}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-50 disabled:opacity-60"
          >
            {downloading && <Spinner className="h-3.5 w-3.5" />}
            Download
          </button>
          <button
            type="button"
            onClick={() => onDelete(file)}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  )
}
