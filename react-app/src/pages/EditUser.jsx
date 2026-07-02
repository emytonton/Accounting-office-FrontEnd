import React, { useState } from 'react'
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { Icon } from '../components/icons'
import { updateUser } from '../api/userService'

const ROLES = [
  { value: 'admin',    label: 'Administrador' },
  { value: 'Fiscal',   label: 'Colaborador — Fiscal' },
  { value: 'DP',       label: 'Colaborador — Departamento Pessoal' },
  { value: 'Contábil', label: 'Colaborador — Contábil' },
]

function roleFromUser(user) {
  if (user?.role === 'admin') return 'admin'
  return user?.sector || 'Fiscal'
}

export default function EditUser() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { state } = useLocation()
  const userData = state?.user ?? {}

  const [name, setName]             = useState(userData.name ?? '')
  const [identifier, setIdentifier] = useState(userData.identifier ?? '')
  const [role, setRole]             = useState(roleFromUser(userData))
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  function validate() {
    if (!name.trim()) return 'Informe o nome completo.'
    if (name.trim().length < 2) return 'Nome deve ter ao menos 2 caracteres.'
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const err = validate()
    if (err) { setError(err); return }

    setLoading(true)
    try {
      const isAdmin = role === 'admin'
      const payload = {
        name: name.trim(),
        identifier: identifier.trim() || undefined,
        role: isAdmin ? 'admin' : 'collaborator',
        ...(isAdmin ? {} : { sector: role }),
      }
      await updateUser(id, payload)
      navigate('/usuarios')
    } catch (err) {
      const code = err.response?.data?.error?.code
      const msg  = err.response?.data?.error?.message
      if (err.response?.status === 403) {
        setError('Você não tem permissão para editar usuários.')
      } else if (code === 'NOT_FOUND') {
        setError('Usuário não encontrado.')
      } else {
        setError(msg || 'Não foi possível salvar as alterações. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <div className="header-band">
          <div className="header-left">
            <h1 className="page-title">Editar Usuário</h1>
            <p className="page-subtitle">Alterar dados do usuário</p>
          </div>
        </div>

        <div className="content">
          <div className="breadcrumb">
            <Link to="/usuarios">Usuários</Link>
            <span>›</span>
            <span>Editar Usuário</span>
          </div>

          <div className="form-card">
            <p className="form-section-title">
              <Icon name="person" size={20} /> Dados do Usuário
            </p>

            {error && (
              <div className="alert-error">
                <Icon name="warning" size={18} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name">
                    Nome completo <span className="required">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    className="form-input"
                    placeholder="Ex: Maria Santos"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="identifier">E-mail</label>
                  <input
                    id="identifier"
                    type="email"
                    className="form-input"
                    placeholder="Ex: maria@contage.com.br"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                </div>
              </div>

              <hr className="divider" />

              <p className="form-section-title">
                <Icon name="lock" size={20} /> Perfil de Acesso
              </p>

              <div className="form-group" style={{ marginBottom: 32 }}>
                <label>Tipo de perfil <span className="required">*</span></label>
                <div className="radio-group">
                  {ROLES.map((r) => (
                    <label
                      key={r.value}
                      className={`radio-option${role === r.value ? ' selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={r.value}
                        checked={role === r.value}
                        onChange={() => setRole(r.value)}
                      />
                      {r.label}
                    </label>
                  ))}
                </div>
              </div>

              <hr className="divider" />

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/usuarios')}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <><span className="spinner" /> Salvando…</> : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
