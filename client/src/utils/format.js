/** 1536 -> "1.5 KB" */
export function formatBytes(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1024
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i += 1
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[i]}`
}

/** ISO date -> "10 Nov 2026, 5:30 pm" in the viewer's local time zone */
export function formatDate(isoString) {
  return new Date(isoString).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** Short label and colour for the file-type badge */
export function getFileType(mimeType = '', name = '') {
  const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : ''
  if (mimeType.startsWith('image/')) return { label: 'IMG', color: 'bg-violet-100 text-violet-700' }
  if (mimeType.startsWith('video/')) return { label: 'VID', color: 'bg-rose-100 text-rose-700' }
  if (mimeType.startsWith('audio/')) return { label: 'AUD', color: 'bg-amber-100 text-amber-700' }
  if (mimeType === 'application/pdf' || ext === 'pdf') return { label: 'PDF', color: 'bg-red-100 text-red-700' }
  if (/zip|compressed|tar|rar|7z/.test(mimeType) || ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext))
    return { label: 'ZIP', color: 'bg-yellow-100 text-yellow-800' }
  if (/word|document/.test(mimeType) || ['doc', 'docx'].includes(ext)) return { label: 'DOC', color: 'bg-blue-100 text-blue-700' }
  if (/sheet|excel|csv/.test(mimeType) || ['xls', 'xlsx', 'csv'].includes(ext))
    return { label: 'XLS', color: 'bg-emerald-100 text-emerald-700' }
  if (/presentation|powerpoint/.test(mimeType) || ['ppt', 'pptx'].includes(ext))
    return { label: 'PPT', color: 'bg-orange-100 text-orange-700' }
  if (mimeType.startsWith('text/') || ['txt', 'md', 'json', 'js', 'py'].includes(ext))
    return { label: 'TXT', color: 'bg-slate-200 text-slate-700' }
  return { label: 'FILE', color: 'bg-slate-100 text-slate-600' }
}
