import React, { useState, useEffect, useMemo } from 'react'
import Sidebar from '../components/Sidebar'
import { Icon } from '../components/icons'
import { useAuth } from '../context/AuthContext'
import {
  listDemandTypes, createDemandType, updateDemandType,
  addSubtaskTemplate, removeSubtaskTemplate,
} from '../api/demandTypeService'

const SECTORS = [
  { value: 'fiscal',   label: 'Fiscal' },
  { value: 'pessoal',  label: 'Pessoal' },
  { value: 'contabil', label: 'Contábil' },
]
const SECTOR_LABEL = { fiscal: 'Fiscal', pessoal: 'Pessoal', contabil: 'Contábil' }

let _keyCounter = 0
function newKey() { return ++_keyCounter }
function emptyTemplate() {
  return { _k: newKey(), id: null, name: '', isRequired: true, _deleted: false }
}

/* ── Modal de criação / edição ── */
function DemandTypeModal({ initial, onClose, onSaved }) {
  const isEdit = !!initial

  const [sector, setSector]           = useState(initial?.sector ?? 'fiscal')
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
export default function DemandTypes() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [types, setTypes]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [activeTab, setActiveTab]     = useState('')
  const [filterActive, setFilterActive] = useState('')
  const [modal, setModal]             = useState(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (!isAdmin && user?.sector) params.sector = user.sector
      const data = await listDemandTypes(params)
      setTypes(Array.isArray(data) ? data : [])
    } catch {
      setError('Não foi possível carregar os tipos de demanda. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    return types.filter(t => {
      const matchSector = !activeTab || t.sector === activeTab
      const matchActive = !filterActive || t.isActive === (filterActive === 'true')
      return matchSector && matchActive
    })
  }, [types, activeTab, filterActive])

  const colSpan = isAdmin ? 6 : 5

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <div className="header-band">
          <div className="header-left">
            <h1 className="page-title">Tipos de Demanda</h1>
            <p className="page-subtitle">Serviços prestados pelo escritório</p>
          </div>
        </div>

        <div className="content">
          <div className="toolbar">
            <div className="toolbar-left">
              <div className="tabs">
                {[{ value: '', label: 'Todos' }, ...SECTORS].map(s => (
                  <button
                    key={s.value}
                    className={`tab${activeTab === s.value ? ' act' : ''}`}
                    onClick={() => setActiveTab(s.value)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <select className="fi fi-w" value={filterActive} onChange={e => setFilterActive(e.target.value)}>
              <option value="">Todos os status</option>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
            {isAdmin && (
              <button className="btn btn-primary" onClick={() => setModal('create')}>
                <Icon name="add" size={18} /> Novo Tipo
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
                  <th>Nome</th>
                  <th>Setor</th>
                  <th>Subtarefas</th>
                  <th>Templates</th>
                  <th>Status</th>
                  {isAdmin && <th>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={colSpan} style={{ textAlign: 'center', padding: 40 }}>
                      <span className="spinner" style={{ borderColor: 'rgba(38,67,255,0.2)', borderTopColor: '#2643FF' }} />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={colSpan}>
                      <div className="empty-state">Nenhum tipo de demanda encontrado.</div>
                    </td>
                  </tr>
                ) : filtered.map(t => {
                  const sectorBadge = { fiscal: 'b-orange', pessoal: 'b-blue', contabil: 'b-purple' }
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
        </div>
      </main>

      {modal && (
        <DemandTypeModal
          initial={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}
