import React, { useState, useEffect } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { Icon } from '../components/icons'
import { getDemand, updateDemandStatus, updateSubtask, updateDueDate } from '../api/demandService'
import { getCompany } from '../api/companyService'
import { getDemandType } from '../api/demandTypeService'
import { useAuth } from '../context/AuthContext'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const STATUS_OPTIONS = [
  { value: 'pending',     label: 'Pendente' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'completed',   label: 'Concluída' },
  { value: 'overdue',     label: 'Atrasada' },
]

const STATUS_MAP = {
  pending:     { label: 'Pendente',     cls: 'b-gray' },
  in_progress: { label: 'Em andamento', cls: 'b-yellow' },
  completed:   { label: 'Concluída',    cls: 'b-green' },
  overdue:     { label: 'Atrasada',     cls: 'b-red' },
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

export default function DemandDetail() {
  const { id } = useParams()
  const { state } = useLocation()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [demand, setDemand]       = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  const [fetchedCompanyName, setFetchedCompanyName]       = useState('')
  const [fetchedDemandTypeName, setFetchedDemandTypeName] = useState('')

  const [newStatus, setNewStatus]       = useState('')
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusError, setStatusError]   = useState('')
  const [statusSuccess, setStatusSuccess] = useState(false)

  const [subtaskLoading, setSubtaskLoading] = useState(null)

  const [showDueDate, setShowDueDate]   = useState(false)
  const [newDueDate, setNewDueDate]     = useState('')
  const [dueDateSaving, setDueDateSaving] = useState(false)
  const [dueDateError, setDueDateError]   = useState('')
  const [dueDateSuccess, setDueDateSuccess] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await getDemand(id)
      setDemand(data)
      setNewStatus(data.status)

      // Se a página foi acessada direto (sem state de navegação), resolve os
      // nomes de empresa e tipo de demanda a partir dos IDs.
      if (!state?.companyName && data.companyId) {
        getCompany(data.companyId).then(c => setFetchedCompanyName(c?.name ?? '')).catch(() => {})
      }
      if (!state?.demandTypeName && data.demandTypeId) {
        getDemandType(data.demandTypeId).then(t => setFetchedDemandTypeName(t?.name ?? '')).catch(() => {})
      }
    } catch {
      setError('Não foi possível carregar a demanda. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  async function handleStatusSave() {
    if (newStatus === demand?.status) return
    setStatusSaving(true)
    setStatusError('')
    setStatusSuccess(false)
    try {
      const updated = await updateDemandStatus(id, newStatus)
      setDemand(prev => ({ ...prev, status: updated.status ?? newStatus }))
      setStatusSuccess(true)
      setTimeout(() => setStatusSuccess(false), 2500)
    } catch (err) {
      const code = err.response?.data?.error?.code
      const msg  = err.response?.data?.error?.message
      if (code === 'REQUIRED_SUBTASKS_PENDING') {
        const pending = demand?.subtasks
          ?.filter(s => s.isRequired && !s.completedAt)
          ?.map(s => `"${s.name}"`) ?? []
        setStatusError(
          pending.length > 0
            ? `Subtarefas obrigatórias pendentes: ${pending.join(', ')}.`
            : 'Existem subtarefas obrigatórias não concluídas.'
        )
      } else if (code === 'FORBIDDEN_SECTOR') {
        setStatusError('Você não tem permissão para atualizar demandas de outro setor.')
      } else {
        setStatusError(msg || 'Não foi possível atualizar o status. Tente novamente.')
      }
    } finally {
      setStatusSaving(false)
    }
  }

  async function handleDueDateSave() {
    setDueDateSaving(true)
    setDueDateError('')
    setDueDateSuccess(false)
    try {
      const iso = newDueDate ? new Date(newDueDate).toISOString() : null
      const updated = await updateDueDate(id, iso)
      setDemand(prev => ({ ...prev, dueDate: updated.dueDate, isOverdue: updated.isOverdue }))
      setDueDateSuccess(true)
      setShowDueDate(false)
      setTimeout(() => setDueDateSuccess(false), 2500)
    } catch (err) {
      const msg = err.response?.data?.error?.message
      setDueDateError(msg || 'Não foi possível atualizar o prazo.')
    } finally {
      setDueDateSaving(false)
    }
  }

  async function handleSubtask(subtaskId, completed) {
    setSubtaskLoading(subtaskId)
    setStatusError('')
    try {
      const updated = await updateSubtask(id, subtaskId, completed)
      setDemand(prev => ({
        ...prev,
        subtasks: prev.subtasks.map(s =>
          s.id === subtaskId ? { ...s, completedAt: updated.completedAt } : s
        ),
      }))
    } catch (err) {
      const code = err.response?.data?.error?.code
      if (code === 'FORBIDDEN_SECTOR') {
        setStatusError('Você não tem permissão para atualizar subtarefas de outro setor.')
      }
    } finally {
      setSubtaskLoading(null)
    }
  }

  const companyName    = state?.companyName    || fetchedCompanyName    || '—'
  const demandTypeName = state?.demandTypeName || fetchedDemandTypeName || '—'
  const st = demand ? (STATUS_MAP[demand.status] ?? { label: demand.status, cls: 'pending' }) : null

  const sortedSubtasks = demand?.subtasks
    ? [...demand.subtasks].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
    : []

  const completedCount = sortedSubtasks.filter(s => s.completedAt).length

  const pendingRequired = sortedSubtasks.filter(s => s.isRequired && !s.completedAt)
  const hasBlock = newStatus === 'completed' && pendingRequired.length > 0

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <span className="spinner" style={{ borderColor: 'rgba(38,67,255,0.2)', borderTopColor: '#2643FF' }} />
          </div>
        </main>
      </div>
    )
  }

  if (error || !demand) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <div className="content">
            <div className="breadcrumb">
              <Link to="/demandas">Demandas</Link>
              <span>›</span>
              <span>Detalhe</span>
            </div>
            <div className="alert-error">
              <Icon name="warning" size={18} /> {error || 'Demanda não encontrada.'}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <div className="header-band">
          <div className="header-left">
            <h1 className="page-title">Demanda</h1>
            <p className="page-subtitle">{companyName}</p>
          </div>
        </div>

        <div className="content">
          <div className="breadcrumb">
            <Link to="/demandas">Demandas</Link>
            <span>›</span>
            <span>{demandTypeName}</span>
          </div>

          {/* Info card */}
          <div className="form-card" style={{ marginBottom: 20 }}>
            <p className="form-section-title">
              <Icon name="assignment" size={20} /> Informações
            </p>

            <div className="detail-section">
              <div className="detail-row">
                <span className="detail-key">Empresa</span>
                <span className="detail-val">{companyName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Tipo de Demanda</span>
                <span className="detail-val">{demandTypeName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Competência</span>
                <span className="detail-val">{MONTHS[demand.competenceMonth - 1]}/{demand.competenceYear}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Vencimento</span>
                <span className="detail-val" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {demand.isOverdue
                    ? <span className="badge b-red">Atrasada — {formatDate(demand.dueDate)}</span>
                    : formatDate(demand.dueDate)}
                  {isAdmin && (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: 12, padding: '2px 10px', height: 26 }}
                      onClick={() => {
                        setNewDueDate(demand.dueDate ? demand.dueDate.slice(0, 10) : '')
                        setDueDateError('')
                        setShowDueDate(v => !v)
                      }}
                    >
                      {demand.dueDate ? 'Alterar prazo' : 'Definir prazo'}
                    </button>
                  )}
                </span>
              </div>

              {showDueDate && isAdmin && (
                <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '14px 16px', marginBottom: 8 }}>
                  {dueDateError && (
                    <div className="alert-error" style={{ marginBottom: 10, fontSize: 13 }}>
                      <Icon name="warning" size={16} /> {dueDateError}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input
                      type="date"
                      className="form-input"
                      style={{ height: 38, width: 180 }}
                      value={newDueDate}
                      onChange={e => setNewDueDate(e.target.value)}
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleDueDateSave}
                      disabled={dueDateSaving}
                    >
                      {dueDateSaving ? <span className="spinner" /> : 'Salvar'}
                    </button>
                    {demand.dueDate && (
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#DC2626', borderColor: '#FCA5A5' }}
                        onClick={() => { setNewDueDate(''); handleDueDateSave() }}
                        disabled={dueDateSaving}
                      >
                        Remover
                      </button>
                    )}
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowDueDate(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {dueDateSuccess && (
                <div className="alert-info" style={{ marginBottom: 8 }}>
                  <Icon name="checkCircle" size={16} fill={1} /> Prazo atualizado com sucesso.
                </div>
              )}

              <div className="detail-row">
                <span className="detail-key">Status</span>
                <span className="detail-val">
                  <span className={`badge ${st.cls}`}>{st.label}</span>
                </span>
              </div>
              {demand.completedAt && (
                <div className="detail-row">
                  <span className="detail-key">Concluída em</span>
                  <span className="detail-val">{formatDate(demand.completedAt)}</span>
                </div>
              )}
            </div>

            <hr className="divider" />

            <p className="form-section-title" style={{ marginBottom: 16 }}>
              <Icon name="edit" size={20} /> Atualizar Status
            </p>

            {statusError && (
              <div className="alert-error" style={{ marginBottom: 16 }}>
                <Icon name="warning" size={18} /> {statusError}
              </div>
            )}
            {statusSuccess && (
              <div className="alert-info" style={{ marginBottom: 16 }}>
                <Icon name="checkCircle" size={18} fill={1} /> Status atualizado com sucesso.
              </div>
            )}
            {hasBlock && (
              <div className="alert-error" style={{ marginBottom: 16 }}>
                <Icon name="warning" size={18} />
                Conclua as subtarefas obrigatórias antes de marcar como concluída:{' '}
                {pendingRequired.map(s => `"${s.name}"`).join(', ')}.
              </div>
            )}

            <div className="status-row">
              <select
                className="form-input"
                style={{ width: 220 }}
                value={newStatus}
                onChange={e => { setNewStatus(e.target.value); setStatusError('') }}
              >
                {STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <button
                className="btn btn-primary"
                onClick={handleStatusSave}
                disabled={statusSaving || newStatus === demand.status || hasBlock}
              >
                {statusSaving
                  ? <><span className="spinner" /> Salvando…</>
                  : 'Salvar status'}
              </button>
            </div>
          </div>

          {/* Subtasks card */}
          {sortedSubtasks.length > 0 && (
            <div className="form-card">
              <p className="form-section-title">
                <Icon name="subtask" size={20} /> Subtarefas
                <span style={{ marginLeft: 'auto', fontSize: 13, color: '#9CA3AF', fontWeight: 400 }}>
                  {completedCount}/{sortedSubtasks.length} concluídas
                </span>
              </p>

              <div className="subtask-list">
                {sortedSubtasks.map(s => {
                  const done = !!s.completedAt
                  const busy = subtaskLoading === s.id
                  return (
                    <div key={s.id} className={`subtask-item${done ? ' done' : ''}`}>
                      <input
                        type="checkbox"
                        checked={done}
                        disabled={busy}
                        onChange={e => handleSubtask(s.id, e.target.checked)}
                      />
                      <span className={`subtask-name${done ? ' done' : ''}`}>{s.name}</span>
                      {s.isRequired && (
                        <span className="subtask-required">Obrigatória</span>
                      )}
                      {busy && (
                        <span className="spinner" style={{
                          width: 14, height: 14, borderWidth: 2,
                          borderColor: 'rgba(38,67,255,0.2)', borderTopColor: '#2643FF',
                        }} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
