import React, { useState } from 'react'
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { Icon } from '../components/icons'
import { updateCompany } from '../api/companyService'

const SECTORS = [
  { value: '',         label: 'Nenhum' },
  { value: 'fiscal',   label: 'Fiscal' },
  { value: 'pessoal',  label: 'Pessoal' },
  { value: 'contabil', label: 'Contábil' },
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
  return cnpj.replace(/\D/g, '').length === 14
}

export default function EditCompany() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { state } = useLocation()
  const companyData = state?.company ?? {}

  const [name, setName]     = useState(companyData.name ?? '')
  const [cnpj, setCnpj]     = useState(maskCNPJ(companyData.cnpj ?? ''))
  const [sector, setSector] = useState(companyData.sector ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  function handleCnpjChange(e) {
    setCnpj(maskCNPJ(e.target.value))
  }

  function validate() {
    if (name.trim().length > 0 && name.trim().length < 2) return 'Razão social deve ter ao menos 2 caracteres.'
    if (cnpj && !validateCNPJ(cnpj)) return 'CNPJ inválido. Informe os 14 dígitos.'
    if (!name.trim() && !cnpj && sector === (companyData.sector ?? '')) return 'Altere ao menos um campo.'
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const err = validate()
    if (err) { setError(err); return }

    const payload = {}
    if (name.trim())  payload.name   = name.trim()
    if (cnpj)         payload.cnpj   = cnpj
    if (sector !== undefined) payload.sector = sector || null

    setLoading(true)
    try {
      await updateCompany(id, payload)
      navigate('/empresas')
    } catch (err) {
      const code   = err.response?.data?.error?.code
      const status = err.response?.status
      if (status === 409 || code === 'CONFLICT') {
        setError('Este CNPJ já está cadastrado em outra empresa.')
      } else if (status === 403 || code === 'FORBIDDEN') {
        setError('Você não tem permissão para editar empresas.')
      } else if (status === 404 || code === 'NOT_FOUND') {
        setError('Empresa não encontrada.')
      } else if (status === 400 || code === 'VALIDATION_ERROR') {
        setError(err.response?.data?.error?.message || 'Dados inválidos. Verifique os campos.')
      } else {
        setError('Não foi possível salvar as alterações. Tente novamente.')
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
            <h1 className="page-title">Editar Empresa</h1>
            <p className="page-subtitle">Alterar dados da empresa</p>
          </div>
        </div>

        <div className="content">
          <div className="breadcrumb">
            <Link to="/empresas">Empresas</Link>
            <span>›</span>
            <span>Editar Empresa</span>
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
                  <label htmlFor="name">Razão Social</label>
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
                  <label htmlFor="cnpj">CNPJ</label>
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
