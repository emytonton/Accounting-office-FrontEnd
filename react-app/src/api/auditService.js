import api from './api'

export async function listAuditLogs(tenantId, params = {}) {
  const { data } = await api.get('/audit-logs', { params: { tenantId, ...params } })
  return data.data
}
