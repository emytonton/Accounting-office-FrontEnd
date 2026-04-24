import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { listUsers } from '../api/userService'
import { useAuth } from '../context/AuthContext'

const PAGE_SIZE = 10

const PERFIL_MAP = {
  admin: { label: 'Administrador', cls: 'admin' },
  collaborator: { label: 'Colaborador', cls: '' },
  fiscal: { label: 'Colaborador — Fiscal', cls: 'fiscal' },
  pessoal: { label: 'Colaborador — Pessoal', cls: 'pessoal' },
  contabil: { label: 'Colaborador — Contábil + Fiscal', cls: 'contabil' },
}

function perfilInfo(role, sector) {
  if (role === 'admin') return PERFIL_MAP.admin
  if (sector === 'fiscal') return PERFIL_MAP.fiscal
  if (sector === 'pessoal') return PERFIL_MAP.pessoal
  if (sector === 'contabil') return PERFIL_MAP.contabil
  return PERFIL_MAP.collaborator
}

export default function Users() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true)
      setError('')
      try {
        const data = await listUsers(user?.tenantId)
        setUsers(Array.isArray(data) ? data : data.users ?? [])
      } catch {
        setError('Não foi possível carregar os usuários. Tente novamente.')
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [user?.tenantId])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return users.filter((u) => {
      const matchSearch =
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.identifier?.toLowerCase().includes(q)
      const matchStatus = !filterStatus || (u.status || '').toLowerCase() === filterStatus
      const matchRole = !filterRole || u.role === filterRole || u.sector === filterRole
      return matchSearch && matchStatus && matchRole
    })
  }, [users, search, filterStatus, filterRole])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleSearchChange(e) {
    setSearch(e.target.value)
    setPage(1)
  }

  function handleStatusChange(e) {
    setFilterStatus(e.target.value)
    setPage(1)
  }

  function handleRoleChange(e) {
    setFilterRole(e.target.value)
    setPage(1)
  }

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <div className="header-band">
          <div className="header-left">
            <h1 className="page-title">Usuários</h1>
            <p className="page-subtitle">Gerenciar usuários do escritório</p>
          </div>
        </div>

        <div className="content">
          <div className="toolbar">
            <button className="btn btn-primary" onClick={() => navigate('/usuarios/novo')}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              Novo Usuário
            </button>
          </div>

          <div className="filter-bar">
            <input
              className="fi fi-grow"
              type="text"
              placeholder="🔍  Buscar por nome ou e-mail..."
              value={search}
              onChange={handleSearchChange}
            />
            <select className="fi fi-w" value={filterStatus} onChange={handleStatusChange}>
              <option value="">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
            <select className="fi fi-w" value={filterRole} onChange={handleRoleChange}>
              <option value="">Todos os perfis</option>
              <option value="admin">Administrador</option>
              <option value="pessoal">Colaborador — Pessoal</option>
              <option value="fiscal">Colaborador — Fiscal</option>
              <option value="contabil">Colaborador — Contábil + Fiscal</option>
            </select>
          </div>

          {error && <div className="alert-error"><span>⚠️</span> {error}</div>}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Perfil / Setor</th>
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
                      <div className="empty-state">Nenhum usuário encontrado.</div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((u) => {
                    const { label, cls } = perfilInfo(u.role, u.sector)
                    const isActive = (u.status || 'ativo').toLowerCase() === 'ativo'
                    const isPending = (u.status || '').toLowerCase() === 'pendente'

                    return (
                      <tr key={u.id || u._id}>
                        <td className="name">{u.name}</td>
                        <td>{u.identifier || u.email}</td>
                        <td>
                          <span className={`perfil-tag ${cls}`}>{label}</span>
                        </td>
                        <td>
                          {isPending ? (
                            <span className="badge badge-pendente">Pendente</span>
                          ) : isActive ? (
                            <span className="badge badge-ativo">Ativo</span>
                          ) : (
                            <span className="badge badge-inativo">Inativo</span>
                          )}
                        </td>
                        <td>
                          <div className="actions">
                            <button className="btn-icon btn-edit" title="Editar">✏️</button>
                            {isActive ? (
                              <button className="btn-icon btn-block" title="Inativar">🚫</button>
                            ) : (
                              <button className="btn-icon btn-reactivate" title="Reativar">↩️</button>
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
                Mostrando {paginated.length} de {filtered.length} usuário{filtered.length !== 1 ? 's' : ''}
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
