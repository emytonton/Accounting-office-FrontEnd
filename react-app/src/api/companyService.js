import api from './api'

export async function listCompanies(tenantId, filters = {}) {
  const { data } = await api.get('/companies', { params: { tenantId, ...filters } })
  return data.data
}

export async function createCompany(payload) {
  const { data } = await api.post('/companies', payload)
  return data.data
}

export async function updateCompany(id, payload) {
  const { data } = await api.put(`/companies/${id}`, payload)
  return data.data
}

export async function inactivateCompany(id, force = false) {
  const { data } = await api.patch(`/companies/${id}/inactivate`, force ? { force: true } : {})
  return data.data
}
