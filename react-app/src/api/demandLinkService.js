import api from './api'

export async function getLinksCatalog(companyId) {
  const { data } = await api.get(`/companies/${companyId}/demand-type-links/catalog`)
  return data.data
}

export async function createLink(companyId, payload) {
  const { data } = await api.post(`/companies/${companyId}/demand-type-links`, payload)
  return data.data
}

export async function updateLink(companyId, linkId, payload) {
  const { data } = await api.patch(`/companies/${companyId}/demand-type-links/${linkId}`, payload)
  return data.data
}

export async function deleteLink(companyId, linkId) {
  const { data } = await api.delete(`/companies/${companyId}/demand-type-links/${linkId}`)
  return data.data
}
