import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { Icon } from '../components/icons'
import { useAuth } from '../context/AuthContext'
import { exportCsv } from '../api/exportService'
import { useNavigate } from 'react-router-dom'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i)

export default function Export() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const now = new Date()
  const [type, setType]         = useState('demands')
  const [month, setMonth]       = useState(now.getMonth() + 1)
  const [year, setYear]         = useState(now.getFullYear())
  const [useDate, setUseDate]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [lastExport, setLastExport] = useState(null)

  if (user?.role !== 'admin') {
    navigate('/dashboard', { replace: true })
    return null
  }

  async function handleExport() {
    setLoading(true)
    setError('')
    try {
      const filters = useDate
        ? { competenceMonth: month, competenceYear: year }
        : {}

      const blob = await exportCsv(user.tenantId, type, filters)
      const url = URL.createObjectURL(blob)
      const filename = `${type === 'demands' ? 'demandas' : 'recebimentos'}${useDate ? `-${String(month).padStart(2, '0')}-${year}` : ''}.csv`
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      setLastExport({ filename, at: new Date().toLocaleTimeString('pt-BR') })
    } catch (err) {
      const msg = err.response?.data?.error?.message
      setError(msg || 'Não foi possível gerar o arquivo. Tente novamente.')
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
            <h1 className="page-title">Exportar Dados</h1>
            <p className="page-subtitle">Gere arquivos CSV para análise externa</p>
          </div>
        </div>

        <div className="content">
          <div className="form-card" style={{ maxWidth: 560 }}>
            <p className="form-section-title">
              <Icon name="download" size={20} /> Configuração da Exportação
            </p>

            {error && (
              <div className="alert-error" style={{ marginBottom: 16 }}>
                <Icon name="warning" size={18} /> {error}
              </div>
            )}

            {lastExport && (
              <div className="alert-success" style={{ marginBottom: 16, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, color: '#15803D', fontSize: 14 }}>
                <Icon name="checkCircle" size={18} fill={1} style={{ color: '#16A34A' }} />
                Arquivo <strong>{lastExport.filename}</strong> baixado às {lastExport.at}.
              </div>
            )}

            <div className="form-group">
              <label>Tipo de exportação <span className="required">*</span></label>
              <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                {[
                  { value: 'demands', label: 'Demandas', icon: 'assignment' },
                  { value: 'payments', label: 'Recebimentos', icon: 'payments' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    style={{
                      flex: 1,
                      padding: '14px 16px',
                      border: `2px solid ${type === opt.value ? '#2643FF' : '#E5E7EB'}`,
                      borderRadius: 10,
                      background: type === opt.value ? '#EEF1FF' : '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.15s',
                    }}
                  >
                    <Icon name={opt.icon} size={24} style={{ color: type === opt.value ? '#2643FF' : '#9CA3AF' }} />
                    <span style={{ fontWeight: 600, fontSize: 14, color: type === opt.value ? '#2643FF' : '#4A5565' }}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <hr className="divider" />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: useDate ? 14 : 0 }}>
              <input
                type="checkbox"
                id="useDate"
                checked={useDate}
                onChange={e => setUseDate(e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <label htmlFor="useDate" style={{ fontSize: 14, color: '#4A5565', cursor: 'pointer', margin: 0 }}>
                Filtrar por competência
              </label>
            </div>

            {useDate && (
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4 }}>
                <div className="form-group">
                  <label>Mês</label>
                  <select
                    className="form-input"
                    value={month}
                    onChange={e => setMonth(Number(e.target.value))}
                  >
                    {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Ano</label>
                  <select
                    className="form-input"
                    value={year}
                    onChange={e => setYear(Number(e.target.value))}
                  >
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            )}

            <div className="form-actions" style={{ marginTop: 24 }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleExport}
                disabled={loading}
                style={{ minWidth: 180 }}
              >
                {loading
                  ? <><span className="spinner" /> Gerando…</>
                  : <><Icon name="download" size={17} /> Exportar CSV</>
                }
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
