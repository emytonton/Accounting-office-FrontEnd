import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { Icon } from '../components/icons'
import { listCompanies, inactivateCompany } from '../api/companyService'
import { useAuth } from '../context/AuthContext'

const PAGE_SIZE = 10

const SECTOR_MAP = {
  fiscal:   { label: 'Fiscal',   cls: 'b-orange' },
  pessoal:  { label: 'Pessoal',  cls: 'b-blue' },
  contabil: { label: 'Contábil', cls: 'b-purple' },
}

function formatCNPJ(cnpj) {
  if (!cnpj) return '—'
  const raw = cnpj.replace(/\D/g, '')
  return raw.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

function extractPendingCount(message) {
  const match = message?.match(/(\d+)\s+pending/)
  return match ? Number(match[1]) : null
}

/* ── Modal confirmação de inativação forçada ── */
function PendingDemandsModal({ companyName, pendingCount, onConfirm, onCancel, loading }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <h2 className="modal-title">Demandas pendentes</h2>
        </div>
        <p className="modal-desc">
          A empresa <strong>{companyName}</strong> possui{' '}
          <strong>{pendingCount} demanda{pendingCount !== 1 ? 's' : ''} pendente{pendingCount !== 1 ? 's' : ''}</strong>.
          Ao inativar, essas demandas serão mantidas no sistema mas a empresa não receberá novas.
        </p>
        <p className="modal-desc" style={{ color: '#DC2626', marginTop: -8 }}>
          Deseja inativar mesmo assim?
        </p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? <><span className="spinner" style={{ borderColor: 'rgba(220,38,38,0.3)', borderTopColor: '#DC2626' }} /> Inativando…</> : 'Inativar mesmo assim'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Companies() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [companies, setCompanies]         = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState('')
  const [search, setSearch]               = useState('')
  const [filterSituation, setFilterSituation] = useState('')
  const [filterSector, setFilterSector]   = useState('')
  const [page, setPage]                   = useState(1)
  const [actionLoading, setActionLoading] = useState(null)
  const [pendingModal, setPendingModal]   = useState(null) // { id, name, count }
  const [forceLoading, setForceLoading]   = useState(false)

  useEffect(() => {
    async function fetchCompanies() {
      setLoading(true)
      setError('')
      try {
        const result = await listCompanies(user?.tenantId, { limit: 100 })
        setCompanies(result?.items ?? [])
      } catch {
        setError('Não foi possível carregar as empresas. Tente novamente.')
      } finally {
        setLoading(false)
      }
    }
    fetchCompanies()
  }, [user?.tenantId])

  async function handleInactivate(id, name) {
    setActionLoading(id)
    setError('')
    try {
      await inactivateCompany(id, false)
      setCompanies(prev => prev.map(c => c.id === id ? { ...c, isActive: false } : c))
    } catch (err) {
      const code = err.response?.data?.error?.code
      const msg  = err.response?.data?.error?.message
      if (code === 'PENDING_DEMANDS') {
        const count = extractPendingCount(msg) ?? '?'
        setPendingModal({ id, name, count })
      } else {
        setError('Não foi possível inativar a empresa. Tente novamente.')
      }
    } finally {
      setActionLoading(null)
    }
  }

  async function handleForceInactivate() {
    if (!pendingModal) return
    setForceLoading(true)
    try {
      await inactivateCompany(pendingModal.id, true)
      setCompanies(prev => prev.map(c => c.id === pendingModal.id ? { ...c, isActive: false } : c))
      setPendingModal(null)
    } catch {
      setError('Não foi possível inativar a empresa. Tente novamente.')
      setPendingModal(null)
    } finally {
      setForceLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q    = search.toLowerCase()
    const rawQ = q.replace(/\D/g, '')
    return companies.filter(c => {
      const matchSearch    = !q || c.name?.toLowerCase().includes(q) || (rawQ && c.cnpj?.includes(rawQ))
      const matchSituation = !filterSituation || c.isActive === (filterSituation === 'active')
      const matchSector    = !filterSector || c.sector === filterSector
      return matchSearch && matchSituation && matchSector
    })
  }, [companies, search, filterSituation, filterSector])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleSearchChange(e)    { setSearch(e.target.value);          setPage(1) }
  function handleSituationChange(e) { setFilterSituation(e.target.value); setPage(1) }
  function handleSectorChange(e)    { setFilterSector(e.target.value);    setPage(1) }

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <div className="header-band">
          <div className="header-left">
            <h1 className="page-title">Empresas</h1>
            <p className="page-subtitle">Gerenciar empresas do escritório</p>
          </div>
        </div>

        <div className="content">
          <div className="toolbar">
            {isAdmin && (
              <button className="btn btn-primary" onClick={() => navigate('/empresas/nova')}>
                <Icon name="add" size={18} />
                Nova Empresa
              </button>
            )}
          </div>

          <div className="filter-bar">
            <input
              className="fi fi-grow"
              type="text"
              placeholder="Buscar por nome ou CNPJ..."
              value={search}
              onChange={handleSearchChange}
            />
            <select className="fi fi-w" value={filterSituation} onChange={handleSituationChange}>
              <option value="">Todas as situações</option>
              <option value="active">Ativa</option>
              <option value="inactive">Inativa</option>
            </select>
            <select className="fi fi-w" value={filterSector} onChange={handleSectorChange}>
              <option value="">Todos os setores</option>
              <option value="fiscal">Fiscal</option>
              <option value="pessoal">Pessoal</option>
              <option value="contabil">Contábil</option>
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
                  <th>Razão Social</th>
                  <th>CNPJ</th>
                  <th>Setor</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 40 }}>
                      <span className="spinner" style={{ borderColor: 'rgba(38,67,255,0.2)', borderTopColor: '#2643FF' }} />
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">Nenhuma empresa encontrada.</div>
                    </td>
                  </tr>
                ) : (
                  paginated.map(c => {
                    const sector   = SECTOR_MAP[c.sector]
                    const isActive = c.isActive !== false
                    return (
                      <tr key={c.id}>
                        <td className="fw">{c.name}</td>
                        <td>{formatCNPJ(c.cnpj)}</td>
                        <td>
                          {sector
                            ? <span className={`badge ${sector.cls}`}>{sector.label}</span>
                            : <span style={{ color: '#9CA3AF' }}>—</span>}
                        </td>
                        <td>
                          {isActive
                            ? <span className="badge b-green">Ativa</span>
                            : <span className="badge b-gray">Inativa</span>}
                        </td>
                        <td>
                          <div className="actions">
                            {isAdmin && (
                              <button
                                className="ic-btn ic-link"
                                title="Tipos de Demanda"
                                onClick={() => navigate(`/empresas/${c.id}/vinculos`, { state: { company: c } })}
                              >
                                <Icon name="link" size={15} />
                              </button>
                            )}
                            {isAdmin && (
                              <button
                                className="ic-btn ic-edit"
                                title="Editar"
                                onClick={() => navigate(`/empresas/${c.id}/editar`, { state: { company: c } })}
                              >
                                <Icon name="edit" size={15} />
                              </button>
                            )}
                            {isAdmin && isActive && (
                              <button
                                className="ic-btn ic-del"
                                title="Inativar"
                                disabled={actionLoading === c.id}
                                onClick={() => handleInactivate(c.id, c.name)}
                              >
                                {actionLoading === c.id
                                  ? <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2, borderColor: 'rgba(220,38,38,0.2)', borderTopColor: '#DC2626' }} />
                                  : <Icon name="block" size={15} />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>

            <div className="pagination">
              <span>
                Mostrando {paginated.length} de {filtered.length} empresa{filtered.length !== 1 ? 's' : ''}
              </span>
              <div className="pagination-btns">
                <button className="pg-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    className={`pg-btn${page === p ? ' active' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button className="pg-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {pendingModal && (
        <PendingDemandsModal
          companyName={pendingModal.name}
          pendingCount={pendingModal.count}
          loading={forceLoading}
          onConfirm={handleForceInactivate}
          onCancel={() => setPendingModal(null)}
        />
      )}
    </div>
  )
}
