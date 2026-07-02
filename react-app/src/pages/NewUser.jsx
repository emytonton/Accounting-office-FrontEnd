import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { Icon } from '../components/icons'
import { createUser } from '../api/userService'
import { useAuth } from '../context/AuthContext'

const ROLES = [
  { value: 'admin',    label: 'Administrador' },
  { value: 'Fiscal',   label: 'Colaborador — Fiscal' },
  { value: 'DP',       label: 'Colaborador — Departamento Pessoal' },
  { value: 'Contábil', label: 'Colaborador — Contábil' },
]

export default function NewUser() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  const [name, setName] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [role, setRole] = useState('Fiscal')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function validate() {
    if (!name.trim()) return 'Informe o nome completo.'
    if (!identifier.trim() || !identifier.includes('@')) return 'Informe um e-mail válido.'
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
        tenantId: currentUser?.tenantId,
        name: name.trim(),
        identifier: identifier.trim(),
        role: isAdmin ? 'admin' : 'collaborator',
        ...(isAdmin ? {} : { sector: role }),
      }
      await createUser(payload)
      setSuccess(true)
    } catch (err) {
      const msg = err.response?.data?.message
      if (err.response?.status === 409) {
        setError('Já existe um usuário cadastrado com este e-mail.')
      } else {
        setError(msg || 'Não foi possível cadastrar o usuário. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <div className="header-band">
            <div className="header-left">
              <h1 className="page-title">Novo Usuário</h1>
              <p className="page-subtitle">Cadastrar usuário no escritório</p>
            </div>
          </div>
          <div className="content">
            <div className="form-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
              <Icon name="checkCircle" size={56} fill={1} style={{ color: '#16A34A', marginBottom: 16 }} />
              <p style={{ fontFamily: 'Archivo', fontWeight: 700, fontSize: 24, color: '#1E2939', marginBottom: 10 }}>
                Usuário cadastrado!
              </p>
              <p style={{ color: '#6B7280', fontSize: 15, marginBottom: 32 }}>
                O usuário <strong>{identifier}</strong> foi cadastrado com sucesso.<br />
                Ele poderá acessar o sistema e definir sua senha no primeiro login.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                <button className="btn btn-secondary" onClick={() => { setSuccess(false); setName(''); setIdentifier(''); setRole('pessoal') }}>
                  Cadastrar outro
                </button>
                <button className="btn btn-primary" onClick={() => navigate('/usuarios')}>
                  Ver lista de usuários
                </button>
              </div>
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
            <h1 className="page-title">Novo Usuário</h1>
            <p className="page-subtitle">Cadastrar usuário no escritório</p>
          </div>
        </div>

        <div className="content">
          <div className="breadcrumb">
            <Link to="/usuarios">Usuários</Link>
            <span>›</span>
            <span>Novo Usuário</span>
          </div>

          <div className="form-card">
            <p className="form-section-title">
              <Icon name="person" size={20} /> Dados do Usuário
            </p>

            <div className="alert-info">
              <Icon name="info" size={18} />
              <span>
                O usuário receberá um código de acesso por e-mail no primeiro login para definir sua senha.
              </span>
            </div>

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
                  <label htmlFor="identifier">
                    E-mail <span className="required">*</span>
                  </label>
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

              <div className="alert-info">
                <Icon name="info" size={18} />
                <span>O perfil define quais módulos e empresas o colaborador pode visualizar e operar.</span>
              </div>

              <div className="form-group" style={{ marginBottom: 32 }}>
                <label>
                  Tipo de perfil <span className="required">*</span>
                </label>
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
                  {loading ? <><span className="spinner" /> Cadastrando…</> : 'Cadastrar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
