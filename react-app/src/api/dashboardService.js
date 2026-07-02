import api from './api'

export async function getDashboardStats(tenantId, competenceMonth, competenceYear) {
  const { data } = await api.get('/demands/dashboard', {
    params: { tenantId, competenceMonth, competenceYear },
  })
  return data.data
}
