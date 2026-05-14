import api from './api'

export async function listDemands(params = {}) {
  const { data } = await api.get('/demands', { params })
  return data.data
}

export async function getDemand(id) {
  const { data } = await api.get(`/demands/${id}`)
  return data.data
}

export async function openCompetence(payload) {
  const { data } = await api.post('/demands/open-competence', payload)
  return data.data
}

export async function updateDemandStatus(id, status) {
  const { data } = await api.patch(`/demands/${id}/status`, { status })
  return data.data
}

export async function updateSubtask(demandId, subtaskId, completed) {
  const { data } = await api.patch(`/demands/${demandId}/subtasks/${subtaskId}`, { completed })
  return data.data
}
