import api from './api'

export async function listUsers(tenantId) {
  const { data } = await api.get('/users', { params: { tenantId, includeInactive: true } })
  return data.data
}

export async function createUser(payload) {
  const { data } = await api.post('/users', payload)
  return data.data
}

export async function updateUser(id, payload) {
  const { data } = await api.put(`/users/${id}`, payload)
  return data.data
}

export async function inactivateUser(id) {
  const { data } = await api.patch(`/users/${id}/inactivate`)
  return data.data
}

export async function reactivateUser(id) {
  const { data } = await api.patch(`/users/${id}/reactivate`)
  return data.data
}
