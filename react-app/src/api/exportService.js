import api from './api'

export async function exportCsv(tenantId, type, filters = {}) {
  const resp = await api.get('/export/csv', {
    params: { tenantId, type, ...filters },
    responseType: 'blob',
  })
  return resp.data
}
