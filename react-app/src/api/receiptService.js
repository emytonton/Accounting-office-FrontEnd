import api from './api'

export async function listReceipts(tenantId, filters = {}) {
  const { data } = await api.get('/receipts', { params: { tenantId, ...filters } })
  return data.data
}

export async function getReceipt(id) {
  const { data } = await api.get(`/receipts/${id}`)
  return data.data
}

export async function createReceipt(payload) {
  const { data } = await api.post('/receipts', payload)
  return data.data
}

export async function cancelReceipt(id, reason, force = false) {
  const { data } = await api.patch(`/receipts/${id}/cancel`, { reason, ...(force ? { force: true } : {}) })
  return data.data
}

export async function downloadReceiptPdf(id, copy = false) {
  const resp = await api.get(`/receipts/${id}/pdf${copy ? '?copy=true' : ''}`, { responseType: 'blob' })
  return resp.data
}
