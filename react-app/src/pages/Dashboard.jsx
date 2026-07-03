import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { getDashboardStats } from '../api/dashboardService'
import { listCompanies } from '../api/companyService'
import { listDemands } from '../api/demandService'
import { listReceipts } from '../api/receiptService'
import { listDemandTypes } from '../api/demandTypeService'
import { useAuth } from '../context/AuthContext'

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const SECTOR_LABELS = { Fiscal: 'Fiscal', DP: 'Pessoal', 'Contábil': 'Contábil' }
const SECTOR_BADGE  = { Fiscal: 'b-orange', DP: 'b-blue', 'Contábil': 'b-purple' }

function getCompetenceOptions() {
  const now = new Date()
  const opts = []
  for (let i = -5; i <= 2; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    opts.push({ month: d.getMonth() + 1, year: d.getFullYear() })
  }
  return opts.reverse()
}

function fmtCurrency(val) {
  if (val >= 1000) return `R$ ${(val / 1000).toFixed(1).replace('.', ',')}k`
  return `R$ ${Number(val).toFixed(2).replace('.', ',')}`
}

function daysSince(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

const CIRC = 2 * Math.PI * 40

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const tenantId = user?.tenantId

  const now = new Date()
  const [competence, setCompetence] = useState({ month: now.getMonth() + 1, year: now.getFullYear() })
  const [loading, setLoading] = useState(true)

  const [stats, setStats]         = useState(null)
  const [companies, setCompanies] = useState([])
  const [demands, setDemands]     = useState([])
  const [receipts, setReceipts]   = useState([])
  const [types, setTypes]         = useState([])

  useEffect(() => {
    if (!tenantId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      const [sRes, cRes, dRes, rRes, tRes] = await Promise.allSettled([
        getDashboardStats(tenantId, competence.month, competence.year),
        listCompanies(tenantId, { situation: 'active', limit: 1000 }),
        listDemands({ tenantId, competenceMonth: competence.month, competenceYear: competence.year, limit: 500 }),
        listReceipts(tenantId, { competenceMonth: competence.month, competenceYear: competence.year }),
        listDemandTypes({ tenantId }),
      ])
      if (cancelled) return

      if (sRes.status === 'fulfilled') setStats(sRes.value)
      if (cRes.status === 'fulfilled') setCompanies(cRes.value?.items ?? [])
      if (dRes.status === 'fulfilled') setDemands(Array.isArray(dRes.value) ? dRes.value : dRes.value?.items ?? [])
      if (rRes.status === 'fulfilled') setReceipts(rRes.value?.items ?? rRes.value ?? [])
      if (tRes.status === 'fulfilled') setTypes(tRes.value?.items ?? tRes.value ?? [])
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [tenantId, competence.month, competence.year])

  const overall   = stats?.overall ?? {}
  const bySector  = stats?.bySector ?? []

  const today   = new Date()
  const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  const atRisk  = demands.filter(d => {
    if (!d.dueDate || d.status === 'completed' || d.isOverdue) return false
    const due = new Date(d.dueDate)
    return due >= today && due <= in7Days
  }).length

  const overdueDemands = demands.filter(d => d.isOverdue)

  const quitadoAmt  = receipts.filter(r => r.paidAt).reduce((s, r) => s + Number(r.amount), 0)
  const pendenteAmt = receipts.filter(r => !r.paidAt && r.status === 'active').reduce((s, r) => s + Number(r.amount), 0)
  const totalAmt    = quitadoAmt + pendenteAmt
  const quitadoArc  = totalAmt > 0 ? (quitadoAmt / totalAmt) * CIRC : 0

  const maxSectorCount = Math.max(...bySector.map(s => s.counts.total), 1)

  const typeMap    = useMemo(() => new Map(types.map(t => [t.id, t])), [types])
  const companyMap = useMemo(() => new Map(companies.map(c => [c.id, c])), [companies])

  const competenceOptions = useMemo(getCompetenceOptions, [])
  const competenceKey     = `${competence.year}-${competence.month}`

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <div className="header-band">
          <div className="header-left">
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Visão geral da operação</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 46 }}>
            <span style={{ fontSize: 13, color: '#6B7280' }}>Competência:</span>
            <select
              className="fi fi-w"
              style={{ height: 38 }}
              value={competenceKey}
              onChange={e => {
                const [y, m] = e.target.value.split('-').map(Number)
                setCompetence({ month: m, year: y })
              }}
            >
              {competenceOptions.map(o => (
                <option key={`${o.year}-${o.month}`} value={`${o.year}-${o.month}`}>
                  {MONTH_NAMES[o.month - 1]} / {o.year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="content">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 80, color: '#6B7280', fontSize: 15 }}>
              Carregando dados...
            </div>
          ) : (
            <>
              {/* ── Stat Cards ── */}
              <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
                <div className="stat-card stat-blue">
                  <div className="stat-label">Empresas Ativas</div>
                  <div className="stat-value">{companies.length}</div>
                  <div className="stat-sub">no seu escritório</div>
                </div>
                <div className="stat-card stat-green">
                  <div className="stat-label">Demandas Concluídas</div>
                  <div className="stat-value">{overall.completed ?? 0}</div>
                  <div className="stat-sub">de {overall.total ?? 0} geradas</div>
                </div>
                <div className="stat-card stat-yellow">
                  <div className="stat-label">Demandas Pendentes</div>
                  <div className="stat-value">{(overall.pending ?? 0) + (overall.inProgress ?? 0)}</div>
                  <div className="stat-sub">{overall.inProgress ?? 0} em andamento</div>
                </div>
                <div className="stat-card stat-red">
                  <div className="stat-label">Em Atraso</div>
                  <div className="stat-value">{overall.overdue ?? 0}</div>
                  <div className="stat-sub">nesta competência</div>
                </div>
                <div className="stat-card" style={{ borderTop: '3px solid #7C3AED' }}>
                  <div className="stat-label">⚡ Risco de Prazo</div>
                  <div className="stat-value" style={{ color: '#7C3AED' }}>{atRisk}</div>
                  <div className="stat-sub">prazo nos próximos 7 dias</div>
                </div>
              </div>

              {/* ── Charts ── */}
              <div className="charts-grid">
                {/* Bar Chart — Demandas por Setor */}
                <div className="chart-card">
                  <div className="chart-title">
                    Demandas por Setor — {MONTH_NAMES[competence.month - 1]}/{competence.year}
                  </div>
                  {bySector.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF', fontSize: 13 }}>
                      Nenhuma demanda nesta competência
                    </div>
                  ) : (
                    <div className="bar-chart">
                      {bySector.map((s, i) => (
                        <div className="bar-wrap" key={s.key}>
                          <div className="bar-val">{s.counts.total}</div>
                          <div
                            className="bar"
                            style={{
                              height: Math.max(8, Math.round((s.counts.total / maxSectorCount) * 95)),
                              opacity: 1 - i * 0.15,
                            }}
                          />
                          <div className="bar-lbl">{SECTOR_LABELS[s.key] ?? s.key}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Donut Chart — Recebimentos */}
                <div className="chart-card">
                  <div className="chart-title">Recebimentos do Mês</div>
                  {totalAmt === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF', fontSize: 13 }}>
                      Nenhum recibo nesta competência
                    </div>
                  ) : (
                    <div className="donut-area">
                      <svg width="110" height="110" viewBox="0 0 110 110">
                        {/* Background (Pendente) */}
                        <circle cx="55" cy="55" r="40" fill="none" stroke="#E5E7EB" strokeWidth="18" />
                        {/* Quitado arc */}
                        {quitadoArc > 0 && (
                          <circle
                            cx="55" cy="55" r="40"
                            fill="none" stroke="#2643FF" strokeWidth="18"
                            strokeDasharray={`${quitadoArc} ${CIRC}`}
                            strokeDashoffset={CIRC / 4}
                            strokeLinecap="round"
                          />
                        )}
                        <text x="55" y="51" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1E2939" fontFamily="Archivo,sans-serif">R$</text>
                        <text x="55" y="64" textAnchor="middle" fontSize="9" fill="#6B7280" fontFamily="Archivo,sans-serif">
                          {fmtCurrency(totalAmt)}
                        </text>
                      </svg>
                      <div className="donut-legend">
                        <div className="leg-item">
                          <div className="leg-dot" style={{ background: '#2643FF' }} />
                          Quitado — {fmtCurrency(quitadoAmt)}
                        </div>
                        <div className="leg-item">
                          <div className="leg-dot" style={{ background: '#E5E7EB' }} />
                          Pendente — {fmtCurrency(pendenteAmt)}
                        </div>
                      </div>
                    </div>
                  )}
                  <div style={{ marginTop: 18, display: 'flex', gap: 14 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate('/recibos')}>
                      Ver Recibos
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Demandas em Atraso ── */}
              <div className="card" style={{ marginTop: 22, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 600, fontSize: 16, color: '#1E2939' }}>
                    Demandas em Atraso ({overdueDemands.length})
                  </span>
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate('/demandas')}>
                    Ver todas
                  </button>
                </div>

                {overdueDemands.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', fontSize: 14 }}>
                    Nenhuma demanda em atraso nesta competência.
                  </div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Empresa</th>
                        <th>Demanda</th>
                        <th>Setor</th>
                        <th>Prazo</th>
                        <th>Atraso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overdueDemands.slice(0, 10).map(d => {
                        const type    = typeMap.get(d.demandTypeId)
                        const company = companyMap.get(d.companyId)
                        const sector  = type?.sector ?? ''
                        const days    = d.dueDate ? daysSince(d.dueDate) : null
                        return (
                          <tr
                            key={d.id}
                            style={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/demandas/${d.id}`)}
                          >
                            <td className="fw">{company?.name ?? '—'}</td>
                            <td>{type?.name ?? '—'}</td>
                            <td>
                              <span className={`badge ${SECTOR_BADGE[sector] ?? 'b-gray'}`}>
                                {SECTOR_LABELS[sector] ?? sector}
                              </span>
                            </td>
                            <td>{d.dueDate ? new Date(d.dueDate).toLocaleDateString('pt-BR') : '—'}</td>
                            <td>
                              {days !== null
                                ? <span className="badge b-red">{days} {days === 1 ? 'dia' : 'dias'}</span>
                                : <span className="badge b-red">Atrasada</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
