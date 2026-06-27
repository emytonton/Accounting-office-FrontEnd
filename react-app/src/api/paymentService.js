import api from './api'

export async function listPayments(tenantId, filters = {}) {
  const { data } = await api.get('/payments', { params: { tenantId, ...filters } })
  return data.data
}

export async function getPayment(id) {
  const { data } = await api.get(`/payments/${id}`)
  return data.data
}

export async function getPaymentSummary(receiptId) {
  const { data } = await api.get(`/payments/summary/${receiptId}`)
  return data.data
}

export async function createPayment(payload) {
  const { data } = await api.post('/payments', payload)
  return data.data
}
