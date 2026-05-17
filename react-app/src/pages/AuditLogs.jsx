import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { Icon } from '../components/icons'
import { useAuth } from '../context/AuthContext'
import { listAuditLogs } from '../api/auditService'

const ACTION_LABELS = {
  'competence.opened':                  'Competência aberta',
  'demand.status_changed':              'Status de demanda alterado',
  'subtask.completed':                  'Subtarefa concluída',
  'subtask.reopened':                   'Subtarefa reaberta',
  'company_demand_type_link.created':   'Vínculo criado',
  'company_demand_type_link.updated':   'Vínculo atualizado',
  'company_demand_type_link.removed':   'Vínculo removido',
}

const ACTION_OPTIONS = Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label }))

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function MetadataCell({ metadata }) {
  if (!metadata || Object.keys(metadata).length === 0) return <span style={{ color: '#9CA3AF' }}>—</span>
  const entries = Object.entries(metadata)
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {entries.map(([k, v]) => (
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

  const [logs, setLogs]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [filterAction, setFilterAction] = useState('')

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard', { replace: true })
      return
    }
    load()
  }, [user])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await listAuditLogs()
      setLogs(Array.isArray(data) ? data : [])
    } catch {
      setError('Não foi possível carregar os logs de auditoria. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = filterAction
    ? logs.filter(l => l.action === filterAction)
    : logs

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
          <div className="filter-bar">
            <select
              className="fi fi-grow"
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
            >
              <option value="">Todas as ações</option>
              {ACTION_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
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
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">Nenhum log encontrado.</div>
                    </td>
                  </tr>
                ) : filtered.map(log => (
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

            {!loading && filtered.length > 0 && (
              <div className="pagination">
                <span>{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
