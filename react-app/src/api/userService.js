import api from './api'

export async function listUsers(tenantId) {
  const { data } = await api.get('/users', { params: { tenantId } })
  return data
}

export async function createUser(payload) {
  const { data } = await api.post('/users', payload)
  return data
}
