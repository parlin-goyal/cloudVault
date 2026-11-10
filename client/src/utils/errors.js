/** Extracts a readable message from an Axios error. */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.response?.data?.message) return error.response.data.message
  if (error?.response?.status === 413) return 'File is too large.'
  if (error?.code === 'ERR_NETWORK') return 'Cannot reach the server. Check your connection.'
  return fallback
}
