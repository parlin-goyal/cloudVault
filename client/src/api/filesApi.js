import api from './axios'

/** Returns { files, stats } for the logged-in user. */
export async function fetchFiles(search = '') {
  const { data } = await api.get('/files', { params: search ? { search } : {} })
  return data
}

/** Uploads one file and reports progress (0–100) through onProgress. */
export async function uploadFile(file, onProgress) {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await api.post('/files', formData, {
    onUploadProgress: (event) => {
      if (event.total && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    },
  })
  return data.file
}

/** Asks the server for a temporary S3 download link, then starts the download. */
export async function downloadFile(fileId) {
  const { data } = await api.get(`/files/${fileId}/download`)
  const link = document.createElement('a')
  link.href = data.url
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
}

export async function deleteFile(fileId) {
  const { data } = await api.delete(`/files/${fileId}`)
  return data.message
}
