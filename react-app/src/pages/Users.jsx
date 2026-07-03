import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { Icon } from '../components/icons'
import { listUsers, inactivateUser, reactivateUser } from '../api/userService'
import { useAuth } from '../context/AuthContext'

const PAGE_SIZE = 10

const PERFIL_MAP = {
  admin:    { label: 'Administrador',         cls: 'b-purple' },
  Fiscal:   { label: 'Colaborador — Fiscal',  cls: 'b-orange' },
  DP:       { label: 'Colaborador — Pessoal', cls: 'b-blue' },
  Contábil: { label: 'Colaborador — Contábil',cls: 'b-green' },
  default:  { label: 'Colaborador',           cls: 'b-gray' },
}

function perfilInfo(role, sector) {
  if (role === 'admin') return PERFIL_MAP.admin
  const s = sector ? sector.charAt(0).toUpperCase() + sector.slice(1) : ''
  return PERFIL_MAP[sector] ?? PERFIL_MAP[s] ?? PERFIL_MAP.default
}

export default function Users() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const isAdmin = user?.role === 'admin'

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [page, setPage] = useState(1)
  const [actionLoading, setActionLoading] = useState(null)

  // RN-002: gestão de usuários é exclusiva do administrador.
  useEffect(() => {
    if (user && user.role !== 'admin') navigate('/dashboard', { replace: true })
  }, [user])

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

  async function handleInactivate(id) {
    setActionLoading(id)
    try {
      await inactivateUser(id)
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, isActive: false } : u))
    } catch (err) {
      console.error('inactivateUser error:', err.response?.status, err.response?.data)
      const msg = err.response?.data?.error?.message
      setError(msg || 'Não foi possível inativar o usuário. Tente novamente.')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReactivate(id) {
    setActionLoading(id)
    try {
      await reactivateUser(id)
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, isActive: true } : u))
    } catch {
      setError('Não foi possível reativar o usuário. Tente novamente.')
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return users.filter((u) => {
      const matchSearch =
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.identifier?.toLowerCase().includes(q)
      const matchStatus = !filterStatus || u.isActive === (filterStatus === 'ativo')
      const matchRole = !filterRole || u.role === filterRole || u.sector === filterRole
      return matchSearch && matchStatus && matchRole
    })
  }, [users, search, filterStatus, filterRole])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleSearchChange(e) { setSearch(e.target.value); setPage(1) }
  function handleStatusChange(e) { setFilterStatus(e.target.value); setPage(1) }
  function handleRoleChange(e) { setFilterRole(e.target.value); setPage(1) }

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
          {isAdmin && (
            <div className="toolbar">
              <button className="btn btn-primary" onClick={() => navigate('/usuarios/novo')}>
                <Icon name="add" size={18} />
                Novo Usuário
              </button>
            </div>
          )}

          <div className="filter-bar">
            <input
              className="fi fi-grow"
              type="text"
              placeholder="Buscar por nome ou e-mail..."
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
              <option value="Fiscal">Colaborador — Fiscal</option>
              <option value="DP">Colaborador — Pessoal</option>
              <option value="Contábil">Colaborador — Contábil</option>
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
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Perfil / Setor</th>
                  <th>Status</th>
                  {isAdmin && <th>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} style={{ textAlign: 'center', padding: 40 }}>
                      <span className="spinner" style={{ borderColor: 'rgba(38,67,255,0.2)', borderTopColor: '#2643FF' }} />
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4}>
                      <div className="empty-state">Nenhum usuário encontrado.</div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((u) => {
                    const { label, cls } = perfilInfo(u.role, u.sector)
                    const isActive = u.isActive !== false
                    const isPending = false

                    return (
                      <tr key={u.id || u._id}>
                        <td className="fw">{u.name}</td>
                        <td>{u.identifier || u.email}</td>
                        <td>
                          <span className={`badge ${cls}`}>{label}</span>
                        </td>
                        <td>
                          {isPending ? (
                            <span className="badge b-yellow">Pendente</span>
                          ) : isActive ? (
                            <span className="badge b-green">Ativo</span>
                          ) : (
                            <span className="badge b-gray">Inativo</span>
                          )}
                        </td>
                        {isAdmin && (
                          <td>
                            <div className="actions">
                              <button
                                className="ic-btn ic-edit"
                                title="Editar"
                                onClick={() => navigate(`/usuarios/${u.id || u._id}/editar`, { state: { user: u } })}
                              >
                                <Icon name="edit" size={15} />
                              </button>
                              {isActive ? (
                                <button
                                  className="ic-btn ic-del"
                                  title="Inativar"
                                  disabled={actionLoading === u.id}
                                  onClick={() => handleInactivate(u.id)}
                                >
                                  <Icon name="block" size={15} />
                                </button>
                              ) : (
                                <button
                                  className="ic-btn ic-ok"
                                  title="Reativar"
                                  disabled={actionLoading === u.id}
                                  onClick={() => handleReactivate(u.id)}
                                >
                                  <Icon name="restore" size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
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
