import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { Icon } from '../components/icons'
import { listCompanies, inactivateCompany } from '../api/companyService'
import { useAuth } from '../context/AuthContext'

const PAGE_SIZE = 10

const SECTOR_MAP = {
  fiscal:   { label: 'Fiscal',   cls: 'fiscal' },
  pessoal:  { label: 'Pessoal',  cls: 'pessoal' },
  contabil: { label: 'Contábil', cls: 'contabil' },
}

function formatCNPJ(cnpj) {
  if (!cnpj) return '—'
  const raw = cnpj.replace(/\D/g, '')
  return raw.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

export default function Companies() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterSituation, setFilterSituation] = useState('')
  const [filterSector, setFilterSector] = useState('')
  const [page, setPage] = useState(1)
  const [actionLoading, setActionLoading] = useState(null)

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

  async function handleInactivate(id) {
    setActionLoading(id)
    setError('')
    try {
      await inactivateCompany(id)
      setCompanies((prev) => prev.map((c) => c.id === id ? { ...c, isActive: false } : c))
    } catch {
      setError('Não foi possível inativar a empresa. Tente novamente.')
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const rawQ = q.replace(/\D/g, '')
    return companies.filter((c) => {
      const matchSearch =
        !q ||
        c.name?.toLowerCase().includes(q) ||
        (rawQ && c.cnpj?.includes(rawQ))
      const matchSituation = !filterSituation || c.isActive === (filterSituation === 'active')
      const matchSector = !filterSector || c.sector === filterSector
      return matchSearch && matchSituation && matchSector
    })
  }, [companies, search, filterSituation, filterSector])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleSearchChange(e) { setSearch(e.target.value); setPage(1) }
  function handleSituationChange(e) { setFilterSituation(e.target.value); setPage(1) }
  function handleSectorChange(e) { setFilterSector(e.target.value); setPage(1) }

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
            <button className="btn btn-primary" onClick={() => navigate('/empresas/nova')}>
              <Icon name="add" size={18} />
              Nova Empresa
            </button>
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
                  paginated.map((c) => {
                    const sector = SECTOR_MAP[c.sector]
                    const isActive = c.isActive !== false
                    return (
                      <tr key={c.id}>
                        <td className="name">{c.name}</td>
                        <td>{formatCNPJ(c.cnpj)}</td>
                        <td>
                          {sector
                            ? <span className={`perfil-tag ${sector.cls}`}>{sector.label}</span>
                            : <span style={{ color: '#9CA3AF' }}>—</span>
                          }
                        </td>
                        <td>
                          {isActive
                            ? <span className="badge badge-ativo">Ativa</span>
                            : <span className="badge badge-inativo">Inativa</span>
                          }
                        </td>
                        <td>
                          <div className="actions">
                            <button
                              className="btn-icon btn-edit"
                              title="Editar"
                              onClick={() => navigate(`/empresas/${c.id}/editar`, { state: { company: c } })}
                            >
                              <Icon name="edit" size={16} />
                            </button>
                            {isActive && (
                              <button
                                className="btn-icon btn-block"
                                title="Inativar"
                                disabled={actionLoading === c.id}
                                onClick={() => handleInactivate(c.id)}
                              >
                                <Icon name="block" size={16} />
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
                <button
                  className="pg-btn"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`pg-btn${page === p ? ' active' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="pg-btn"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === totalPages}
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
