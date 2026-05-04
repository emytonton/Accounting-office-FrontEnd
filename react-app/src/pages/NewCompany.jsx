import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { Icon } from '../components/icons'
import { createCompany } from '../api/companyService'
import { useAuth } from '../context/AuthContext'

const SECTORS = [
  { value: '',        label: 'Nenhum' },
  { value: 'fiscal',  label: 'Fiscal' },
  { value: 'pessoal', label: 'Pessoal' },
  { value: 'contabil',label: 'Contábil' },
]

function maskCNPJ(value) {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

function validateCNPJ(cnpj) {
  const digits = cnpj.replace(/\D/g, '')
  return digits.length === 14
}

export default function NewCompany() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  const [name, setName]       = useState('')
  const [cnpj, setCnpj]       = useState('')
  const [sector, setSector]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  function handleCnpjChange(e) {
    setCnpj(maskCNPJ(e.target.value))
  }

  function validate() {
    if (!name.trim() || name.trim().length < 2) return 'Informe a razão social (mínimo 2 caracteres).'
    if (!cnpj) return 'Informe o CNPJ.'
    if (!validateCNPJ(cnpj)) return 'CNPJ inválido. Informe os 14 dígitos.'
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const err = validate()
    if (err) { setError(err); return }

    setLoading(true)
    try {
      await createCompany({
        tenantId: currentUser?.tenantId,
        name: name.trim(),
        cnpj,
        ...(sector ? { sector } : {}),
      })
      setSuccess(true)
    } catch (err) {
      const code   = err.response?.data?.error?.code
      const status = err.response?.status
      if (status === 409 || code === 'CONFLICT') {
        setError('Já existe uma empresa cadastrada com este CNPJ.')
      } else if (status === 403 || code === 'FORBIDDEN') {
        setError('Você não tem permissão para cadastrar empresas.')
      } else if (status === 400 || code === 'VALIDATION_ERROR') {
        setError(err.response?.data?.error?.message || 'CNPJ inválido ou campos obrigatórios ausentes.')
      } else {
        setError('Não foi possível cadastrar a empresa. Tente novamente.')
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
              <h1 className="page-title">Nova Empresa</h1>
              <p className="page-subtitle">Cadastrar empresa no escritório</p>
            </div>
          </div>
          <div className="content">
            <div className="form-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
              <Icon name="checkCircle" size={56} fill={1} style={{ color: '#16A34A', marginBottom: 16 }} />
              <p style={{ fontFamily: 'Archivo', fontWeight: 700, fontSize: 24, color: '#1E2939', marginBottom: 10 }}>
                Empresa cadastrada!
              </p>
              <p style={{ color: '#6B7280', fontSize: 15, marginBottom: 32 }}>
                <strong>{name}</strong> foi adicionada com sucesso ao escritório.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => { setSuccess(false); setName(''); setCnpj(''); setSector('') }}
                >
                  Cadastrar outra
                </button>
                <button className="btn btn-primary" onClick={() => navigate('/empresas')}>
                  Ver lista de empresas
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
            <h1 className="page-title">Nova Empresa</h1>
            <p className="page-subtitle">Cadastrar empresa no escritório</p>
          </div>
        </div>

        <div className="content">
          <div className="breadcrumb">
            <Link to="/empresas">Empresas</Link>
            <span>›</span>
            <span>Nova Empresa</span>
          </div>

          <div className="form-card">
            <p className="form-section-title">
              <Icon name="business" size={20} /> Dados da Empresa
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
                    Razão Social <span className="required">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    className="form-input"
                    placeholder="Ex: Empresa XPTO Ltda"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cnpj">
                    CNPJ <span className="required">*</span>
                  </label>
                  <input
                    id="cnpj"
                    type="text"
                    className="form-input"
                    placeholder="00.000.000/0000-00"
                    value={cnpj}
                    onChange={handleCnpjChange}
                    inputMode="numeric"
                  />
                </div>
              </div>

              <hr className="divider" />

              <p className="form-section-title">
                <Icon name="folder" size={20} /> Classificação
              </p>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="sector">Setor</label>
                  <select
                    id="sector"
                    className="form-input"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                  >
                    {SECTORS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <hr className="divider" />

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/empresas')}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <><span className="spinner" /> Cadastrando…</> : 'Cadastrar Empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
