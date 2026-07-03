import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { Icon } from '../components/icons'
import { useAuth } from '../context/AuthContext'
import { getReceipt, cancelReceipt, downloadReceiptPdf } from '../api/receiptService'
import { listPayments, getPaymentSummary, createPayment } from '../api/paymentService'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const METHOD_LABELS = {
  cash:          'Dinheiro',
  bank_transfer: 'Transferência Bancária',
  pix:           'PIX',
  credit_card:   'Cartão de Crédito',
  other:         'Outro',
}

function receiptStatus(receipt) {
  if (!receipt) return { label: '—', cls: 'b-gray' }
  if (receipt.status === 'cancelled') return { label: 'Cancelado', cls: 'b-red' }
  if (receipt.paidAt) return { label: 'Quitado', cls: 'b-green' }
  return { label: 'Ativo', cls: 'b-blue' }
}

function formatMoney(v) {
  return Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

function formatDatetime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function RegisterPaymentModal({ receipt, summary, tenantId, onClose, onSuccess }) {
  const balance = summary ? summary.balance : receipt.amount
  const [form, setForm] = useState({
    paymentDate: new Date().toISOString().substring(0, 10),
    amount: '',
    method: 'pix',
    methodDescription: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field, val) { setForm(f => ({ ...f, [field]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.amount || Number(form.amount) <= 0) { setError('Informe um valor válido.'); return }
    if (form.method === 'other' && !form.methodDescription.trim()) {
      setError('Informe a descrição da forma de pagamento.'); return
    }
    setLoading(true)
    setError('')
    try {
      await createPayment({
        tenantId,
        receiptId: receipt.id,
        paymentDate: new Date(form.paymentDate + 'T12:00:00.000Z').toISOString(),
        amount: Number(form.amount),
        method: form.method,
        methodDescription: form.method === 'other' ? form.methodDescription.trim() : undefined,
      })
      onSuccess()
    } catch (err) {
      const code = err.response?.data?.error?.code
      const msg  = err.response?.data?.error?.message
      if (code === 'PAYMENT_EXCEEDS_BALANCE') {
        setError(`Valor excede o saldo disponível. Saldo: ${formatMoney(balance)}`)
      } else {
        setError(msg || 'Não foi possível registrar o pagamento.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <h2 className="modal-title">Registrar Pagamento</h2>
          <button className="modal-close" onClick={onClose} type="button">
            <Icon name="close" size={20} />
          </button>
        </div>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
          Saldo disponível: <strong style={{ color: '#1E2939' }}>{formatMoney(balance)}</strong>
        </p>
        {error && (
          <div className="alert-error" style={{ margin: '0 0 14px' }}>
            <Icon name="warning" size={16} /> {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Data do pagamento <span className="required">*</span></label>
              <input
                type="date"
                className="form-input"
                value={form.paymentDate}
                onChange={e => set('paymentDate', e.target.value)}
              />
            </div>
            <div className="form-group">
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
          </div>
          <div className="form-group" style={{ marginTop: 12 }}>
            <label>Forma de pagamento <span className="required">*</span></label>
            <select className="form-input" value={form.method} onChange={e => set('method', e.target.value)}>
              <option value="pix">PIX</option>
              <option value="bank_transfer">Transferência Bancária</option>
              <option value="cash">Dinheiro</option>
              <option value="credit_card">Cartão de Crédito</option>
              <option value="other">Outro</option>
            </select>
          </div>
          {form.method === 'other' && (
            <div className="form-group" style={{ marginTop: 12 }}>
              <label>Descrição da forma <span className="required">*</span></label>
              <input
                type="text"
                className="form-input"
                placeholder="Descreva a forma de pagamento"
                value={form.methodDescription}
                onChange={e => set('methodDescription', e.target.value)}
              />
            </div>
          )}
          <div className="form-actions" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" /> Registrando…</> : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CancelModal({ receipt, onClose, onCancelled }) {
  const [reason, setReason]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [needsForce, setNeedsForce] = useState(false)  // recibo tem pagamentos → exige confirmação extra

  async function doCancel(force) {
    if (!reason.trim()) { setError('Informe o motivo do cancelamento.'); return }
    setLoading(true)
    setError('')
    try {
      await cancelReceipt(receipt.id, reason.trim(), force)
      onCancelled()
    } catch (err) {
      const code = err.response?.data?.error?.code
      const msg  = err.response?.data?.error?.message
      if (code === 'RECEIPT_HAS_PAYMENTS') {
        setNeedsForce(true)
        setError('')
      } else {
        setError(msg || 'Não foi possível cancelar o recibo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <h2 className="modal-title">Cancelar Recibo #{receipt.number}</h2>
          <button className="modal-close" onClick={onClose} type="button">
            <Icon name="close" size={20} />
          </button>
        </div>
        {error && (
          <div className="alert-error" style={{ margin: '0 0 14px' }}>
            <Icon name="warning" size={16} /> {error}
          </div>
        )}

        {needsForce && (
          <div className="alert-error" style={{ margin: '0 0 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B' }}>
            <Icon name="warning" size={16} />
            <span>
              <strong>Este recibo já possui pagamentos registrados.</strong><br />
              Cancelar mesmo assim vai invalidar o recibo <u>sem apagar os pagamentos</u> — o histórico financeiro é preservado, mas o recibo deixa de valer como comprovante. Confirme apenas se foi um erro de emissão.
            </span>
          </div>
        )}

        <form onSubmit={e => { e.preventDefault(); doCancel(needsForce) }}>
          <div className="form-group">
            <label>Motivo do cancelamento <span className="required">*</span></label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Erro no valor emitido"
              value={reason}
              onChange={e => setReason(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="form-actions" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Voltar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ background: '#DC2626', borderColor: '#DC2626' }}>
              {loading
                ? <><span className="spinner" /> Cancelando…</>
                : needsForce ? 'Forçar cancelamento' : 'Confirmar cancelamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ReceiptDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'

  const [receipt, setReceipt]       = useState(null)
  const [payments, setPayments]     = useState([])
  const [summary, setSummary]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [showPayModal, setShowPayModal]       = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [pdfLoading, setPdfLoading]           = useState(false)
  const [pdf2vLoading, setPdf2vLoading]       = useState(false)

  // RN-012: módulo de honorários é exclusivo do administrador.
  useEffect(() => {
    if (user && user.role !== 'admin') navigate('/dashboard', { replace: true })
  }, [user])

  useEffect(() => { loadAll() }, [id])

  async function loadAll() {
    setLoading(true)
    setError('')
    try {
      const [r, pays, sum] = await Promise.all([
        getReceipt(id),
        listPayments(user.tenantId, { receiptId: id }),
        getPaymentSummary(id),
      ])
      setReceipt(r)
      setPayments(Array.isArray(pays) ? pays : [])
      setSummary(sum)
    } catch {
      setError('Não foi possível carregar o recibo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDownloadPdf(copy = false) {
    const setL = copy ? setPdf2vLoading : setPdfLoading
    setL(true)
    try {
      const blob = await downloadReceiptPdf(id, copy)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `recibo-${receipt.number}${copy ? '-2via' : ''}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Não foi possível baixar o PDF.')
    } finally {
      setL(false)
    }
  }

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
            <span className="spinner" style={{ width: 32, height: 32, borderColor: 'rgba(38,67,255,0.2)', borderTopColor: '#2643FF' }} />
          </div>
        </main>
      </div>
    )
  }

  if (error || !receipt) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <div className="content">
            <div className="alert-error"><Icon name="warning" size={18} /> {error || 'Recibo não encontrado.'}</div>
            <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => navigate('/recibos')}>
              ← Voltar para Recibos
            </button>
          </div>
        </main>
      </div>
    )
  }

  const st = receiptStatus(receipt)
  const pct = summary ? Math.min(100, Math.round((summary.totalPaid / receipt.amount) * 100)) : 0
  const canRegisterPayment = isAdmin && receipt.status !== 'cancelled' && !receipt.paidAt

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <div className="header-band">
          <div className="header-left">
            <h1 className="page-title">Recibo #{receipt.number}</h1>
            <p className="page-subtitle">Histórico e situação do pagamento</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleDownloadPdf(false)}
              disabled={pdfLoading}
            >
              {pdfLoading ? <span className="spinner" style={{ width: 13, height: 13 }} /> : <Icon name="download" size={15} />}
              &nbsp;PDF
            </button>
            {receipt.status === 'cancelled' && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleDownloadPdf(true)}
                disabled={pdf2vLoading}
              >
                {pdf2vLoading ? <span className="spinner" style={{ width: 13, height: 13 }} /> : <Icon name="download" size={15} />}
                &nbsp;2ª Via
              </button>
            )}
            {isAdmin && receipt.status !== 'cancelled' && (
              <button
                className="btn btn-secondary btn-sm"
                style={{ color: '#DC2626', borderColor: '#FECACA' }}
                onClick={() => setShowCancelModal(true)}
              >
                <Icon name="block" size={15} /> Cancelar
              </button>
            )}
          </div>
        </div>

        <div className="content">
          <div className="breadcrumb">
            <Link to="/recibos">Recibos</Link>
            <span>›</span>
            <span>Recibo #{receipt.number}</span>
          </div>

          {/* Info card */}
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <p className="form-section-title" style={{ marginBottom: 16 }}>
              <Icon name="receipt" size={18} /> Informações do Recibo
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Situação</div>
                <span className={`badge ${st.cls}`} style={{ fontSize: 13 }}>{st.label}</span>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Competência</div>
                <div style={{ fontWeight: 600, color: '#1E2939' }}>
                  {MONTHS[(receipt.competenceMonth ?? 1) - 1]}/{receipt.competenceYear}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Valor Total</div>
                <div style={{ fontWeight: 700, color: '#1E2939', fontSize: 17 }}>{formatMoney(receipt.amount)}</div>
              </div>
              {receipt.paidAt && (
                <div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Quitado em</div>
                  <div style={{ color: '#16A34A', fontWeight: 600 }}>{formatDate(receipt.paidAt)}</div>
                </div>
              )}
              {receipt.cancelReason && (
                <div style={{ gridColumn: '1/-1' }}>
                  <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Motivo do Cancelamento</div>
                  <div style={{ color: '#DC2626' }}>{receipt.cancelReason}</div>
                </div>
              )}
              {receipt.description && (
                <div style={{ gridColumn: '1/-1' }}>
                  <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Descrição</div>
                  <div style={{ color: '#4A5565' }}>{receipt.description}</div>
                </div>
              )}
            </div>
          </div>

          {/* Payment summary */}
          {summary && receipt.status !== 'cancelled' && (
            <div className="card" style={{ padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <p className="form-section-title" style={{ margin: 0 }}>
                  <Icon name="payments" size={18} /> Situação do Pagamento
                </p>
                {canRegisterPayment && (
                  <button className="btn btn-primary btn-sm" onClick={() => setShowPayModal(true)}>
                    <Icon name="add" size={16} /> Registrar Pagamento
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: 32, marginBottom: 16, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 }}>Pago</div>
                  <div style={{ fontWeight: 700, fontSize: 20, color: '#16A34A' }}>{formatMoney(summary.totalPaid)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 }}>Saldo</div>
                  <div style={{ fontWeight: 700, fontSize: 20, color: summary.balance > 0 ? '#DC2626' : '#16A34A' }}>
                    {formatMoney(summary.balance)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 }}>Total</div>
                  <div style={{ fontWeight: 700, fontSize: 20, color: '#1E2939' }}>{formatMoney(receipt.amount)}</div>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ background: '#F3F4F6', borderRadius: 8, height: 10, overflow: 'hidden' }}>
                <div style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: summary.isFullyPaid ? '#16A34A' : '#2643FF',
                  borderRadius: 8,
                  transition: 'width 0.4s ease',
                }} />
              </div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>
                {pct}% pago{summary.isFullyPaid ? ' — Recibo quitado!' : ''}
              </div>
            </div>
          )}

          {/* Payment history */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p className="form-section-title" style={{ margin: 0 }}>
                <Icon name="calendar" size={18} /> Histórico de Pagamentos
              </p>
              {canRegisterPayment && !summary && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowPayModal(true)}>
                  <Icon name="add" size={16} /> Registrar Pagamento
                </button>
              )}
            </div>

            <div className="table-wrap" style={{ margin: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Valor</th>
                    <th>Forma</th>
                    <th>Descrição</th>
                    <th>Registrado em</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="empty-state">Nenhum pagamento registrado.</div>
                      </td>
                    </tr>
                  ) : payments.map(p => (
                    <tr key={p.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(p.paymentDate)}</td>
                      <td style={{ fontWeight: 600, color: '#1E2939' }}>{formatMoney(p.amount)}</td>
                      <td>
                        <span className="badge b-blue" style={{ fontSize: 12 }}>
                          {METHOD_LABELS[p.method] ?? p.method}
                        </span>
                      </td>
                      <td style={{ color: '#6B7280' }}>{p.methodDescription || '—'}</td>
                      <td style={{ color: '#9CA3AF', fontSize: 12 }}>{formatDatetime(p.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {showPayModal && (
        <RegisterPaymentModal
          receipt={receipt}
          summary={summary}
          tenantId={user.tenantId}
          onClose={() => setShowPayModal(false)}
          onSuccess={() => { setShowPayModal(false); loadAll() }}
        />
      )}

      {showCancelModal && (
        <CancelModal
          receipt={receipt}
          onClose={() => setShowCancelModal(false)}
          onCancelled={() => { setShowCancelModal(false); loadAll() }}
        />
      )}
    </div>
  )
}
