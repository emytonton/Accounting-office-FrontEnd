import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { Icon } from '../components/icons'
import { useAuth } from '../context/AuthContext'
import { listAuditLogs } from '../api/auditService'

const ACTION_LABELS = {
  'competence.opened':                  'Competência aberta',
  'demand.status_changed':              'Status de demanda alterado',
  'demand.due_date_updated':            'Prazo de demanda definido',
  'subtask.completed':                  'Subtarefa concluída',
  'subtask.reopened':                   'Subtarefa reaberta',
  'company_demand_type_link.created':   'Vínculo criado',
  'company_demand_type_link.updated':   'Vínculo atualizado',
  'company_demand_type_link.removed':   'Vínculo removido',
  'receipt.issued':                     'Recibo emitido',
  'receipt.cancelled':                  'Recibo cancelado',
  'receipt.cancelled_forced':           'Recibo cancelado (forçado)',
  'receipt.pdf_issued':                 'PDF de recibo gerado',
  'receipt.second_copy_issued':         'Segunda via de recibo gerada',
  'payment.registered':                 'Pagamento registrado',
  'payment.auto_baixa':                 'Recibo quitado automaticamente',
}

const ACTION_OPTIONS = Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label }))

const PAGE_SIZE = 20

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function MetadataCell({ metadata }) {
  if (!metadata || Object.keys(metadata).length === 0) return <span style={{ color: '#9CA3AF' }}>—</span>
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {Object.entries(metadata).map(([k, v]) => (
        <span key={k} className="badge b-gray" style={{ fontSize: 11, borderRadius: 6 }}>
          {k}: {String(v)}
        </span>
      ))}
    </div>
  )
}

export default function AuditLogs() {
  const { user } = useAuth()
  const navigate  = useNavigate()

  const [logs, setLogs]             = useState([])
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')

  const [filterAction,  setFilterAction]  = useState('')
  const [filterEntity,  setFilterEntity]  = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo,   setFilterDateTo]   = useState('')

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard', { replace: true })
    }
  }, [user])

  useEffect(() => {
    load(1)
  }, [filterAction, filterEntity, filterDateFrom, filterDateTo])

  async function load(p = page) {
    setLoading(true)
    setError('')
    try {
      const params = { page: p, limit: PAGE_SIZE }
      if (filterAction)   params.action   = filterAction
      if (filterEntity)   params.entity   = filterEntity
      if (filterDateFrom) params.dateFrom = filterDateFrom
      if (filterDateTo)   params.dateTo   = filterDateTo

      const result = await listAuditLogs(user.tenantId, params)
      setLogs(result.data ?? [])
      setTotal(result.total ?? 0)
      setPage(result.page ?? p)
      setTotalPages(result.totalPages ?? 1)
    } catch {
      setError('Não foi possível carregar os logs de auditoria. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function handlePageChange(newPage) {
    setPage(newPage)
    load(newPage)
  }

  function clearFilters() {
    setFilterAction('')
    setFilterEntity('')
    setFilterDateFrom('')
    setFilterDateTo('')
  }

  const hasFilters = filterAction || filterEntity || filterDateFrom || filterDateTo

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <div className="header-band">
          <div className="header-left">
            <h1 className="page-title">Auditoria</h1>
            <p className="page-subtitle">Registro de ações no sistema</p>
          </div>
        </div>

        <div className="content">
          <div className="filter-bar" style={{ flexWrap: 'wrap', gap: 10 }}>
            <select
              className="fi"
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
            >
              <option value="">Todas as ações</option>
              {ACTION_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <input
              type="text"
              className="fi fi-grow"
              placeholder="Entidade (demand, receipt…)"
              value={filterEntity}
              onChange={e => setFilterEntity(e.target.value)}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 13, color: '#6B7280', whiteSpace: 'nowrap' }}>De:</label>
              <input
                type="date"
                className="fi"
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 13, color: '#6B7280', whiteSpace: 'nowrap' }}>Até:</label>
              <input
                type="date"
                className="fi"
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
              />
            </div>

            {hasFilters && (
              <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
                Limpar filtros
              </button>
            )}
          </div>

          {error && (
            <div className="alert-error">
              <Icon name="warning" size={18} /> {error}
            </div>
          )}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Data / Hora</th>
                  <th>Ação</th>
                  <th>Entidade</th>
                  <th>ID da Entidade</th>
                  <th>Metadados</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 40 }}>
                      <span className="spinner" style={{ borderColor: 'rgba(38,67,255,0.2)', borderTopColor: '#2643FF' }} />
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">Nenhum log encontrado.</div>
                    </td>
                  </tr>
                ) : logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap', color: '#6B7280', fontSize: 13 }}>
                      {formatDate(log.createdAt)}
                    </td>
                    <td>
                      <span className="badge b-blue" style={{ fontSize: 12 }}>
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </td>
                    <td style={{ color: '#4A5565' }}>{log.entity ?? '—'}</td>
                    <td style={{ color: '#9CA3AF', fontSize: 12, fontFamily: 'monospace' }}>
                      {log.entityId ? log.entityId.slice(0, 8) + '…' : '—'}
                    </td>
                    <td><MetadataCell metadata={log.metadata} /></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!loading && total > 0 && (
              <div className="pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
                <span style={{ fontSize: 13, color: '#6B7280' }}>
                  {total} registro{total !== 1 ? 's' : ''} — página {page} de {totalPages}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                  >
                    ← Anterior
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={page >= totalPages}
                    onClick={() => handlePageChange(page + 1)}
                  >
                    Próxima →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
