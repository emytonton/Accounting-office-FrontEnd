import api from './api'

export async function listDemandTypes(params = {}) {
  const { data } = await api.get('/demand-types', { params })
  return data.data
}

export async function getDemandType(id) {
  const { data } = await api.get(`/demand-types/${id}`)
  return data.data
}

export async function createDemandType(payload) {
  const { data } = await api.post('/demand-types', payload)
  return data.data
}

export async function updateDemandType(id, payload) {
  const { data } = await api.put(`/demand-types/${id}`, payload)
  return data.data
}

export async function addSubtaskTemplate(demandTypeId, payload) {
  const { data } = await api.post(`/demand-types/${demandTypeId}/subtask-templates`, payload)
  return data.data
}

export async function removeSubtaskTemplate(demandTypeId, templateId) {
  const { data } = await api.delete(`/demand-types/${demandTypeId}/subtask-templates/${templateId}`)
  return data.data
}
