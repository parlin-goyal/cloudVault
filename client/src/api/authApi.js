import api from './axios'

export async function registerUser(username, password) {
  const { data } = await api.post('/auth/register', { username, password })
  return data.user
}

export async function loginUser(username, password) {
  const { data } = await api.post('/auth/login', { username, password })
  return data.user
}

export async function logoutUser() {
  await api.post('/auth/logout')
}

export async function fetchCurrentUser() {
  const { data } = await api.get('/auth/me')
  return data.user
}
