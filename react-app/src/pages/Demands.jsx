import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { Icon } from '../components/icons'
import { useAuth } from '../context/AuthContext'
import { listDemands, openCompetence } from '../api/demandService'
import { listCompanies } from '../api/companyService'
import {
  listDemandTypes, createDemandType, updateDemandType,
  addSubtaskTemplate, removeSubtaskTemplate,
} from '../api/demandTypeService'

/* ── Constants ── */
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const STATUS_MAP = {
  pending:     { label: 'Pendente',     cls: 'b-gray' },
  in_progress: { label: 'Em andamento', cls: 'b-yellow' },
  completed:   { label: 'Concluída',    cls: 'b-green' },
  overdue:     { label: 'Atrasada',     cls: 'b-red' },
}

const SECTOR_BADGE = { Fiscal: 'b-orange', DP: 'b-blue', 'Contábil': 'b-purple' }
const SECTOR_LABEL = { Fiscal: 'Fiscal', DP: 'Pessoal', 'Contábil': 'Contábil' }

const SECTORS = [
  { value: 'Fiscal',   label: 'Fiscal' },
  { value: 'DP',       label: 'Pessoal' },
  { value: 'Contábil', label: 'Contábil' },
]

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

/* ── Demand type modal key helpers ── */
let _keyCounter = 0
function newKey() { return ++_keyCounter }
function emptyTemplate() {
  return { _k: newKey(), id: null, name: '', isRequired: true, _deleted: false }
}

/* ── Modal: Abrir Competência ── */
function OpenCompetenceModal({ onClose, onOpened }) {
  const now = new Date()
  const [month, setMonth]     = useState(now.getMonth() + 1)
  const [year, setYear]       = useState(now.getFullYear())
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState('')

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const payload = { competenceMonth: month, competenceYear: year }
      if (dueDate) payload.dueDate = new Date(dueDate).toISOString()
      const data = await openCompetence(payload)
      setResult(data)
    } catch (err) {
      const msg = err.response?.data?.error?.message
      setError(msg || 'Não foi possível abrir a competência. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="modal-overlay">
        <div className="modal-box">
          <div className="modal-header">
            <h2 className="modal-title">Competência Aberta</h2>
          </div>
          <p style={{ fontSize: 15, color: '#1E2939', marginBottom: 16 }}>
            <strong>{MONTHS[month - 1]}/{year}</strong> processada com sucesso.
          </p>
          <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
            <div style={{ background: '#DCFCE7', borderRadius: 10, padding: '14px 20px', flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 30, fontWeight: 700, color: '#16A34A', fontFamily: 'Archivo' }}>
                {result.created}
              </div>
              <div style={{ fontSize: 13, color: '#15803D' }}>criada(s)</div>
            </div>
            <div style={{ background: '#F3F4F6', borderRadius: 10, padding: '14px 20px', flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 30, fontWeight: 700, color: '#6B7280', fontFamily: 'Archivo' }}>
                {result.skipped}
              </div>
              <div style={{ fontSize: 13, color: '#9CA3AF' }}>já existia(m)</div>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={() => { onOpened(); onClose() }}>Fechar</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2 className="modal-title">Abrir Competência</h2>
          <button className="modal-close" onClick={onClose}><Icon name="close" size={20} /></button>
        </div>
        <p className="modal-desc">
          Gera as demandas do mês para todas as empresas ativas com vínculos configurados.
        </p>

        {error && (
          <div className="alert-error" style={{ marginBottom: 16 }}>
            <Icon name="warning" size={18} /> {error}
          </div>
        )}

        <div className="form-grid" style={{ marginBottom: 20 }}>
          <div className="form-group">
            <label>Mês</label>
            <select className="form-input" value={month} onChange={e => setMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Ano</label>
            <input
              type="number"
              className="form-input"
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              min={2020}
              max={2099}
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 28 }}>
          <label>
            Data de vencimento{' '}
            <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(opcional)</span>
          </label>
          <input
            type="date"
            className="form-input"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
          />
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <><span className="spinner" /> Processando…</> : 'Abrir Competência'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Modal: Criar / Editar Tipo de Demanda ── */
function DemandTypeModal({ initial, onClose, onSaved }) {
  const isEdit = !!initial

  const [sector, setSector]           = useState(initial?.sector ?? 'Fiscal')
  const [name, setName]               = useState(initial?.name ?? '')
  const [hasSubtasks, setHasSubtasks] = useState(initial?.hasSubtasks ?? false)
  const [isActive, setIsActive]       = useState(initial?.isActive ?? true)
  const [templates, setTemplates]     = useState(
    () => (initial?.subtaskTemplates ?? []).map(t => ({ ...t, _k: newKey(), _deleted: false }))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const visible = templates.filter(t => !t._deleted)

  function addTemplate() {
    setTemplates(prev => [...prev, emptyTemplate()])
  }

  function removeTemplate(k) {
    setTemplates(prev => prev.map(t => t._k === k ? { ...t, _deleted: true } : t))
  }

  function updateTemplate(k, field, value) {
    setTemplates(prev => prev.map(t => t._k === k ? { ...t, [field]: value } : t))
  }

  async function handleSave() {
    setError('')
    if (!name.trim()) { setError('Informe o nome do tipo de demanda.'); return }

    setSaving(true)
    try {
      if (!isEdit) {
        const subtaskTemplates = visible
          .map((t, i) => ({ name: t.name.trim(), isRequired: t.isRequired, orderIndex: i + 1 }))
          .filter(t => t.name)
        await createDemandType({
          sector,
          name: name.trim(),
          hasSubtasks,
          ...(hasSubtasks && subtaskTemplates.length > 0 ? { subtaskTemplates } : {}),
        })
      } else {
        await updateDemandType(initial.id, { sector, name: name.trim(), hasSubtasks, isActive })

        const toDelete = templates.filter(t => t.id && t._deleted)
        for (const t of toDelete) {
          await removeSubtaskTemplate(initial.id, t.id)
        }

        const existingCount = templates.filter(t => t.id && !t._deleted).length
        const toAdd = templates.filter(t => !t.id && !t._deleted && t.name.trim())
        for (let i = 0; i < toAdd.length; i++) {
          await addSubtaskTemplate(initial.id, {
            name: toAdd[i].name.trim(),
            isRequired: toAdd[i].isRequired,
            orderIndex: existingCount + i + 1,
          })
        }
      }
      onSaved()
    } catch (err) {
      const msg = err.response?.data?.error?.message
      setError(msg || 'Não foi possível salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box modal-box-lg">
        <div className="modal-header">
          <h2 className="modal-title">
            {isEdit ? 'Editar Tipo de Demanda' : 'Novo Tipo de Demanda'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <Icon name="close" size={20} />
          </button>
        </div>

        {error && (
          <div className="alert-error" style={{ marginBottom: 16 }}>
            <Icon name="warning" size={18} /> {error}
          </div>
        )}

        <div className="form-grid" style={{ marginBottom: 20 }}>
          <div className="form-group">
            <label>Setor <span className="required">*</span></label>
            <select className="form-input" value={sector} onChange={e => setSector(e.target.value)}>
              {SECTORS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Nome <span className="required">*</span></label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: SPED Fiscal"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24, marginBottom: 20, flexWrap: 'wrap' }}>
          <label className="toggle-wrap">
            <input type="checkbox" checked={hasSubtasks} onChange={e => setHasSubtasks(e.target.checked)} />
            <span>Possui subtarefas</span>
          </label>
          {isEdit && (
            <label className="toggle-wrap">
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
              <span>Ativo</span>
            </label>
          )}
        </div>

        {hasSubtasks && (
          <div className="subtask-templates-section">
            <p className="form-section-title" style={{ fontSize: 15, marginBottom: 12, border: 'none', paddingBottom: 0 }}>
              <Icon name="subtask" size={18} /> Templates de Subtarefas
            </p>
            {visible.length === 0 && (
              <p style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 12 }}>
                Nenhum template adicionado.
              </p>
            )}
            {visible.map((t, idx) => (
              <div key={t._k} className="template-row">
                <span className="template-index">{idx + 1}</span>
                <input
                  type="text"
                  className="form-input"
                  style={{ height: 40, flex: 1 }}
                  placeholder="Nome da subtarefa"
                  value={t.name}
                  onChange={e => updateTemplate(t._k, 'name', e.target.value)}
                />
                <label className="toggle-wrap" style={{ fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={t.isRequired}
                    onChange={e => updateTemplate(t._k, 'isRequired', e.target.checked)}
                  />
                  <span>Obrigatória</span>
                </label>
                <button
                  className="ic-btn ic-del"
                  style={{ width: 36, height: 36 }}
                  onClick={() => removeTemplate(t._k)}
                >
                  <Icon name="delete" size={16} />
                </button>
              </div>
            ))}
            <button className="btn btn-secondary btn-sm" onClick={addTemplate} style={{ marginTop: 8 }}>
              <Icon name="add" size={16} /> Adicionar subtarefa
            </button>
          </div>
        )}

        <div className="modal-actions" style={{ marginTop: 24 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><span className="spinner" /> Salvando…</> : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Página principal ── */
export default function Demands() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  /* Tab */
  const [tab, setTab] = useState('lista')

  /* Lista tab state */
  const now = new Date()
  const [filterMonth, setFilterMonth]   = useState(now.getMonth() + 1)
  const [filterYear, setFilterYear]     = useState(now.getFullYear())
  const [filterStatus, setFilterStatus] = useState('')
  const [demands, setDemands]           = useState([])
  const [companiesMap, setCompaniesMap] = useState({})
  const [typesMap, setTypesMap]         = useState({})
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [showOpenModal, setShowOpenModal] = useState(false)

  /* Tipos tab state */
  const [types, setTypes]               = useState([])
  const [typesLoading, setTypesLoading] = useState(false)
  const [typesError, setTypesError]     = useState('')
  const [sectorTab, setSectorTab]       = useState('')
  const [filterActive, setFilterActive] = useState('')
  const [modal, setModal]               = useState(null)

  /* Load companies + types map for lista tab (also seeds types list).
     Carrega cada lookup independentemente: falha em um nao impacta o outro. */
  useEffect(() => {
    async function loadLookups() {
      const [compResult, typesResult] = await Promise.allSettled([
        listCompanies(user?.tenantId, { limit: 500 }),
        listDemandTypes(),
      ])

      if (compResult.status === 'fulfilled') {
        const value = compResult.value
        const compList = value?.items ?? (Array.isArray(value) ? value : [])
        const cMap = {}
        compList.forEach(c => { cMap[c.id] = c.name })
        setCompaniesMap(cMap)
      } else {
        console.error('[Demands] listCompanies failed:', compResult.reason)
      }

      if (typesResult.status === 'fulfilled') {
        const tArr = Array.isArray(typesResult.value) ? typesResult.value : []
        const tMap = {}
        tArr.forEach(t => { tMap[t.id] = { name: t.name, sector: t.sector } })
        setTypesMap(tMap)
        setTypes(tArr)
      } else {
        console.error('[Demands] listDemandTypes failed:', typesResult.reason)
      }
    }
    loadLookups()
  }, [user?.tenantId])

  /* Load demands whenever filters change */
  async function loadDemands() {
    setLoading(true)
    setError('')
    try {
      const params = { competenceMonth: filterMonth, competenceYear: filterYear }
      if (filterStatus) params.status = filterStatus
      const data = await listDemands(params)
      setDemands(Array.isArray(data) ? data : [])
    } catch {
      setError('Não foi possível carregar as demandas. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDemands() }, [filterMonth, filterYear, filterStatus])

  /* Reload types after create/update */
  async function reloadTypes() {
    setTypesLoading(true)
    setTypesError('')
    try {
      const params = {}
      if (!isAdmin && user?.sector) params.sector = user.sector
      const data = await listDemandTypes(params)
      const tArr = Array.isArray(data) ? data : []
      setTypes(tArr)
      const tMap = {}
      tArr.forEach(t => { tMap[t.id] = { name: t.name, sector: t.sector } })
      setTypesMap(tMap)
    } catch {
      setTypesError('Não foi possível carregar os tipos de demanda. Tente novamente.')
    } finally {
      setTypesLoading(false)
    }
  }

  /* Counts for stat cards */
  const counts = useMemo(() => ({
    total:      demands.length,
    completed:  demands.filter(d => d.status === 'completed').length,
    inProgress: demands.filter(d => d.status === 'in_progress').length,
    overdue:    demands.filter(d => d.status === 'overdue').length,
  }), [demands])

  /* Filtered types for tipos tab */
  const filteredTypes = useMemo(() => {
    return types.filter(t => {
      const matchSector = !sectorTab || t.sector === sectorTab
      const matchActive = !filterActive || t.isActive === (filterActive === 'true')
      return matchSector && matchActive
    })
  }, [types, sectorTab, filterActive])

  const typesColSpan = isAdmin ? 6 : 5

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <div className="header-band">
          <div className="header-left">
            <h1 className="page-title">Demandas</h1>
            <p className="page-subtitle">
              {tab === 'lista'
                ? `${MONTHS[filterMonth - 1]}/${filterYear}`
                : 'Serviços prestados pelo escritório'}
            </p>
          </div>
        </div>

        <div className="content">
          {/* Toolbar with tab switcher */}
          <div className="toolbar">
            <div className="toolbar-left">
              <div className="tabs">
                <button
                  className={`tab${tab === 'lista' ? ' act' : ''}`}
                  onClick={() => setTab('lista')}
                >
                  Lista
                </button>
                <button
                  className={`tab${tab === 'tipos' ? ' act' : ''}`}
                  onClick={() => { setTab('tipos'); reloadTypes() }}
                >
                  Tipos de Demanda
                </button>
              </div>
            </div>

            {tab === 'lista' && isAdmin && (
              <button className="btn btn-primary" onClick={() => setShowOpenModal(true)}>
                <Icon name="openCompetence" size={18} /> Abrir Competência
              </button>
            )}
            {tab === 'tipos' && isAdmin && (
              <button className="btn btn-primary" onClick={() => setModal('create')}>
                <Icon name="add" size={18} /> Novo Tipo
              </button>
            )}
          </div>

          {/* ── Lista Tab ── */}
          {tab === 'lista' && (
            <>
              <div className="filter-bar">
                <select
                  className="fi fi-w"
                  value={filterMonth}
                  onChange={e => setFilterMonth(Number(e.target.value))}
                >
                  {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                </select>
                <input
                  className="fi"
                  type="number"
                  style={{ width: 90 }}
                  value={filterYear}
                  onChange={e => setFilterYear(Number(e.target.value))}
                  min={2020}
                  max={2099}
                />
                <select
                  className="fi fi-w"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="">Todos os status</option>
                  {Object.entries(STATUS_MAP).map(([v, { label }]) => (
                    <option key={v} value={v}>{label}</option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="alert-error">
                  <Icon name="warning" size={18} /> {error}
                </div>
              )}

              {!loading && (
                <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  <div className="stat-card">
                    <div className="stat-label">Total</div>
                    <div className="stat-value">{counts.total}</div>
                  </div>
                  <div className="stat-card stat-green">
                    <div className="stat-label">Concluídas</div>
                    <div className="stat-value">{counts.completed}</div>
                  </div>
                  <div className="stat-card stat-yellow">
                    <div className="stat-label">Em Andamento</div>
                    <div className="stat-value">{counts.inProgress}</div>
                  </div>
                  <div className="stat-card stat-red">
                    <div className="stat-label">Atrasadas</div>
                    <div className="stat-value">{counts.overdue}</div>
                  </div>
                </div>
              )}

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Empresa</th>
                      <th>Tipo de Demanda</th>
                      <th>Setor</th>
                      <th>Competência</th>
                      <th>Vencimento</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>
                          <span className="spinner" style={{ borderColor: 'rgba(38,67,255,0.2)', borderTopColor: '#2643FF' }} />
                        </td>
                      </tr>
                    ) : demands.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <div className="empty-state">
                            Nenhuma demanda para {MONTHS[filterMonth - 1]}/{filterYear}.
                          </div>
                        </td>
                      </tr>
                    ) : demands.map(d => {
                      const st     = STATUS_MAP[d.status] ?? { label: d.status, cls: 'b-gray' }
                      const sector = typesMap[d.demandTypeId]?.sector
                      return (
                        <tr key={d.id}>
                          <td className="fw">
                            {companiesMap[d.companyId] ?? '—'}
                          </td>
                          <td>{typesMap[d.demandTypeId]?.name ?? '—'}</td>
                          <td>
                            {sector
                              ? <span className={`badge ${SECTOR_BADGE[sector] ?? 'b-gray'}`}>
                                  {SECTOR_LABEL[sector] ?? sector}
                                </span>
                              : <span style={{ color: '#9CA3AF' }}>—</span>}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {MONTHS[d.competenceMonth - 1]}/{d.competenceYear}
                          </td>
                          <td style={{ whiteSpace: 'nowrap', color: '#6B7280' }}>
                            {formatDate(d.dueDate)}
                          </td>
                          <td>
                            <span className={`badge ${st.cls}`}>{st.label}</span>
                          </td>
                          <td>
                            <div className="actions">
                              <button
                                className="ic-btn ic-edit"
                                title="Ver detalhes"
                                onClick={() => navigate(`/demandas/${d.id}`, {
                                  state: {
                                    companyName: companiesMap[d.companyId],
                                    demandTypeName: typesMap[d.demandTypeId]?.name,
                                  },
                                })}
                              >
                                <Icon name="viewDetail" size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {!loading && demands.length > 0 && (
                  <div className="pagination">
                    <span>{demands.length} demanda{demands.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Tipos Tab ── */}
          {tab === 'tipos' && (
            <>
              <div className="filter-bar">
                <div className="tabs" style={{ marginRight: 'auto' }}>
                  {[{ value: '', label: 'Todos' }, ...SECTORS].map(s => (
                    <button
                      key={s.value}
                      className={`tab${sectorTab === s.value ? ' act' : ''}`}
                      onClick={() => setSectorTab(s.value)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <select className="fi fi-w" value={filterActive} onChange={e => setFilterActive(e.target.value)}>
                  <option value="">Todos os status</option>
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>

              {typesError && (
                <div className="alert-error">
                  <Icon name="warning" size={18} /> {typesError}
                </div>
              )}

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Setor</th>
                      <th>Subtarefas</th>
                      <th>Templates</th>
                      <th>Status</th>
                      {isAdmin && <th>Ações</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {typesLoading ? (
                      <tr>
                        <td colSpan={typesColSpan} style={{ textAlign: 'center', padding: 40 }}>
                          <span className="spinner" style={{ borderColor: 'rgba(38,67,255,0.2)', borderTopColor: '#2643FF' }} />
                        </td>
                      </tr>
                    ) : filteredTypes.length === 0 ? (
                      <tr>
                        <td colSpan={typesColSpan}>
                          <div className="empty-state">Nenhum tipo de demanda encontrado.</div>
                        </td>
                      </tr>
                    ) : filteredTypes.map(t => {
                      const sectorBadge = { Fiscal: 'b-orange', DP: 'b-blue', 'Contábil': 'b-purple' }
                      return (
                        <tr key={t.id}>
                          <td className="fw">{t.name}</td>
                          <td>
                            <span className={`badge ${sectorBadge[t.sector] ?? 'b-gray'}`}>
                              {SECTOR_LABEL[t.sector] ?? t.sector}
                            </span>
                          </td>
                          <td>
                            {t.hasSubtasks
                              ? <span className="badge b-blue">Sim</span>
                              : <span style={{ color: '#9CA3AF' }}>Não</span>}
                          </td>
                          <td style={{ color: '#6B7280' }}>
                            {t.hasSubtasks ? `${t.subtaskTemplates?.length ?? 0} template(s)` : '—'}
                          </td>
                          <td>
                            {t.isActive
                              ? <span className="badge b-green">Ativo</span>
                              : <span className="badge b-gray">Inativo</span>}
                          </td>
                          {isAdmin && (
                            <td>
                              <div className="actions">
                                <button
                                  className="ic-btn ic-edit"
                                  title="Editar"
                                  onClick={() => setModal(t)}
                                >
                                  <Icon name="edit" size={15} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>

      {showOpenModal && (
        <OpenCompetenceModal
          onClose={() => setShowOpenModal(false)}
          onOpened={loadDemands}
        />
      )}

      {modal && (
        <DemandTypeModal
          initial={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); reloadTypes() }}
        />
      )}
    </div>
  )
}
