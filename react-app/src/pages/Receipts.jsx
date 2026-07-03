import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { Icon } from '../components/icons'
import { useAuth } from '../context/AuthContext'
import { listReceipts, createReceipt, downloadReceiptPdf } from '../api/receiptService'
import { listCompanies } from '../api/companyService'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i)

function receiptStatus(receipt) {
  if (receipt.status === 'cancelled') return { label: 'Cancelado', cls: 'b-red' }
  if (receipt.paidAt) return { label: 'Quitado', cls: 'b-green' }
  return { label: 'Ativo', cls: 'b-blue' }
}

function formatMoney(v) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

function NewReceiptModal({ companies, tenantId, onClose, onCreated }) {
  const now = new Date()
  const [form, setForm] = useState({
    companyId: '',
    competenceMonth: now.getMonth() + 1,
    competenceYear: now.getFullYear(),
    amount: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field, val) { setForm(f => ({ ...f, [field]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.companyId) { setError('Selecione uma empresa.'); return }
    if (!form.amount || Number(form.amount) <= 0) { setError('Informe um valor válido.'); return }
    setLoading(true)
    setError('')
    try {
      const receipt = await createReceipt({
        tenantId,
        companyId: form.companyId,
        competenceMonth: Number(form.competenceMonth),
        competenceYear: Number(form.competenceYear),
        amount: Number(form.amount),
        description: form.description || undefined,
      })
      onCreated(receipt)
    } catch (err) {
      const msg = err.response?.data?.error?.message
      setError(msg || 'Não foi possível emitir o recibo. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <h2 className="modal-title">Novo Recibo</h2>
          <button className="modal-close" onClick={onClose} type="button">
            <Icon name="close" size={20} />
          </button>
        </div>
        {error && (
          <div className="alert-error" style={{ margin: '0 0 14px' }}>
            <Icon name="warning" size={16} /> {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Empresa <span className="required">*</span></label>
            <select className="form-input" value={form.companyId} onChange={e => set('companyId', e.target.value)}>
              <option value="">Selecione…</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div className="form-group">
              <label>Competência — Mês <span className="required">*</span></label>
              <select className="form-input" value={form.competenceMonth} onChange={e => set('competenceMonth', e.target.value)}>
                {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Ano <span className="required">*</span></label>
              <select className="form-input" value={form.competenceYear} onChange={e => set('competenceYear', e.target.value)}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 12 }}>
            <label>Valor (R$) <span className="required">*</span></label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              className="form-input"
              placeholder="0,00"
              value={form.amount}
              onChange={e => set('amount', e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginTop: 12 }}>
            <label>Descrição</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Honorários Junho/2026"
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>
          <div className="form-actions" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" /> Emitindo…</> : 'Emitir Recibo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Receipts() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'

  const now = new Date()
  const [filterCompany, setFilterCompany]   = useState('')
  const [filterMonth, setFilterMonth]       = useState('')
  const [filterYear, setFilterYear]         = useState('')
  const [filterStatus, setFilterStatus]     = useState('')
  const [receipts, setReceipts]             = useState([])
  const [companies, setCompanies]           = useState([])
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState('')
  const [showNewModal, setShowNewModal]     = useState(false)
  const [downloadingId, setDownloadingId]   = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [receiptsData, companiesData] = await Promise.all([
        listReceipts(user.tenantId),
        listCompanies(user.tenantId, { limit: 1000 }),
      ])
      setReceipts(Array.isArray(receiptsData) ? receiptsData : (receiptsData.items ?? []))
      setCompanies(companiesData.items ?? (Array.isArray(companiesData) ? companiesData : []))
    } catch {
      setError('Não foi possível carregar os recibos. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDownloadPdf(receipt, copy = false, e) {
    e.stopPropagation()
    setDownloadingId(receipt.id + (copy ? '-copy' : ''))
    try {
      const blob = await downloadReceiptPdf(receipt.id, copy)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `recibo-${receipt.number}${copy ? '-2via' : ''}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Não foi possível baixar o PDF.')
    } finally {
      setDownloadingId(null)
    }
  }

  const filtered = receipts.filter(r => {
    if (filterCompany && r.companyId !== filterCompany) return false
    if (filterMonth && r.competenceMonth !== Number(filterMonth)) return false
    if (filterYear && r.competenceYear !== Number(filterYear)) return false
    if (filterStatus) {
      const st = receiptStatus(r)
      if (filterStatus === 'active' && st.label !== 'Ativo') return false
      if (filterStatus === 'paid' && st.label !== 'Quitado') return false
      if (filterStatus === 'cancelled' && st.label !== 'Cancelado') return false
    }
    return true
  })

  function companyName(companyId) {
    return companies.find(c => c.id === companyId)?.name ?? '—'
  }

  // Recibos só podem ser emitidos para empresas ativas (RN-003).
  const activeCompanies = companies.filter(c => c.isActive !== false)

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <div className="header-band">
          <div className="header-left">
            <h1 className="page-title">Recibos</h1>
            <p className="page-subtitle">Honorários e recibos de serviços</p>
          </div>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
              <Icon name="add" size={18} /> Novo Recibo
            </button>
          )}
        </div>

        <div className="content">
          <div className="filter-bar">
            <select
              className="fi"
              value={filterCompany}
              onChange={e => setFilterCompany(e.target.value)}
            >
              <option value="">Todas as empresas</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select className="fi" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
              <option value="">Todos os meses</option>
              {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>

            <select className="fi" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
              <option value="">Todos os anos</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>

            <select className="fi" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Todos os status</option>
              <option value="active">Ativo</option>
              <option value="paid">Quitado</option>
              <option value="cancelled">Cancelado</option>
            </select>

            {(filterCompany || filterMonth || filterYear || filterStatus) && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => { setFilterCompany(''); setFilterMonth(''); setFilterYear(''); setFilterStatus('') }}
              >
                Limpar filtros
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
                  <th>Nº</th>
                  <th>Empresa</th>
                  <th>Competência</th>
                  <th>Valor</th>
                  <th>Situação</th>
                  <th>Quitado em</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>
                      <span className="spinner" style={{ borderColor: 'rgba(38,67,255,0.2)', borderTopColor: '#2643FF' }} />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">Nenhum recibo encontrado.</div>
                    </td>
                  </tr>
                ) : filtered.map(r => {
                  const st = receiptStatus(r)
                  const isPdfLoading = downloadingId === r.id
                  return (
                    <tr
                      key={r.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/recibos/${r.id}`)}
                    >
                      <td style={{ fontWeight: 600, color: '#1E2939' }}>#{r.number}</td>
                      <td className="fw">{companyName(r.companyId)}</td>
                      <td style={{ color: '#4A5565', whiteSpace: 'nowrap' }}>
                        {MONTHS[(r.competenceMonth ?? 1) - 1]}/{r.competenceYear}
                      </td>
                      <td style={{ fontWeight: 600, color: '#1E2939', whiteSpace: 'nowrap' }}>
                        {formatMoney(r.amount)}
                      </td>
                      <td>
                        <span className={`badge ${st.cls}`}>{st.label}</span>
                      </td>
                      <td style={{ color: '#6B7280', fontSize: 13 }}>
                        {formatDate(r.paidAt)}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Ver histórico"
                            onClick={() => navigate(`/recibos/${r.id}`)}
                          >
                            <Icon name="viewDetail" size={15} />
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Baixar PDF"
                            disabled={isPdfLoading}
                            onClick={(e) => handleDownloadPdf(r, false, e)}
                          >
                            {isPdfLoading
                              ? <span className="spinner" style={{ width: 12, height: 12 }} />
                              : <Icon name="download" size={15} />
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {!loading && filtered.length > 0 && (
              <div className="pagination">
                <span>{filtered.length} recibo{filtered.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
      </main>

      {showNewModal && (
        <NewReceiptModal
          companies={activeCompanies}
          tenantId={user.tenantId}
          onClose={() => setShowNewModal(false)}
          onCreated={() => { setShowNewModal(false); loadData() }}
        />
      )}
    </div>
  )
}
