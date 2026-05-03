import api from './api'

export async function login(identifier, password) {
  const { data } = await api.post('/auth/login', { identifier, password })
  return data.data
}

export async function logout() {
  try {
    await api.post('/auth/logout')
  } finally {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}

export async function forgotPassword(email) {
  await api.post('/auth/forgot-password', { email })
}

export async function validateResetCode(identifier, code) {
  const { data } = await api.post('/auth/reset-password/validate', { identifier, code })
  return data
}

export async function resetPassword(identifier, code, newPassword) {
  await api.post('/auth/reset-password', { identifier, code, newPassword })
}
