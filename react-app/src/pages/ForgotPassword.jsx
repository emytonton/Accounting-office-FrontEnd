import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { forgotPassword, validateResetCode, resetPassword } from '../api/authService'
import PasswordStrength from '../components/PasswordStrength'

const GENERIC_SUCCESS = 'Se o e-mail estiver cadastrado no sistema, você receberá um código em instantes. Verifique também a caixa de spam.'

const backLinkStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  color: 'rgba(255,255,255,0.72)',
  fontSize: 14,
  marginBottom: 32,
  transition: 'color .15s',
}

function BackArrow() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
      <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function ForgotPassword() {
  const navigate = useNavigate()
  const location = useLocation()

  const locationState = location.state || {}
  const isFirstAccessFlow = locationState.firstAccess === true

  const [step, setStep] = useState(isFirstAccessFlow ? 'codigo' : 'email')
  const [isFirstAccess, setIsFirstAccess] = useState(false)

  const [email, setEmail] = useState(locationState.email || '')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState('')

  const [codigo, setCodigo] = useState('')
  const [codigoLoading, setCodigoLoading] = useState(false)
  const [codigoError, setCodigoError] = useState('')

  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [senhaLoading, setSenhaLoading] = useState(false)
  const [senhaError, setSenhaError] = useState('')

  async function handleSend(e) {
    e.preventDefault()
    setEmailError('')

    if (!email || !email.includes('@')) {
      setEmailError('Informe um e-mail válido.')
      return
    }

    setEmailLoading(true)
    try {
      await forgotPassword(email)
    } catch {
      // always show generic message regardless of error
    } finally {
      setEmailLoading(false)
      setStep('sent')
    }
  }

  async function handleValidarCodigo(e) {
    e.preventDefault()
    setCodigoError('')

    if (!codigo.trim() || codigo.trim().length !== 6) {
      setCodigoError('Informe o código de 6 dígitos recebido por e-mail.')
      return
    }

    setCodigoLoading(true)
    try {
      const data = await validateResetCode(email, codigo.trim())
      setIsFirstAccess(data.data?.isFirstAccess === true)
      setStep('nova-senha')
    } catch (err) {
      const code = err.response?.data?.code
      if (code === 'INVALID_RESET_TOKEN') {
        setCodigoError('Código inválido ou expirado. Solicite um novo.')
      } else {
        setCodigoError(err.response?.data?.message || 'Código inválido ou expirado. Solicite um novo.')
      }
    } finally {
      setCodigoLoading(false)
    }
  }

  async function handleConfirmarSenha(e) {
    e.preventDefault()
    setSenhaError('')

    if (novaSenha.length < 8) {
      setSenhaError('A senha deve ter no mínimo 8 caracteres.')
      return
    }
    if (novaSenha !== confirmarSenha) {
      setSenhaError('As senhas não coincidem.')
      return
    }

    setSenhaLoading(true)
    try {
      await resetPassword(email, codigo.trim(), novaSenha)
      setStep('sucesso')
    } catch (err) {
      const code = err.response?.data?.code
      if (code === 'INVALID_RESET_TOKEN') {
        setSenhaError('Código inválido ou expirado. Volte e solicite um novo.')
      } else {
        setSenhaError(err.response?.data?.message || 'Não foi possível redefinir a senha. Solicite um novo código.')
      }
    } finally {
      setSenhaLoading(false)
    }
  }

  // ── Step: sucesso ──
  if (step === 'sucesso') {
    return (
      <div className="auth-screen">
        <div className="auth-box">
          <div className="success-icon">
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2" />
              <path d="M7.5 12l3 3 6-6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="auth-title">Senha definida!</p>
          <p className="auth-desc" style={{ marginBottom: 36 }}>
            Sua senha foi criada com sucesso. Você já pode fazer login no sistema.
          </p>
          <button className="auth-btn" onClick={() => navigate('/login')}>
            Ir para o login
          </button>
        </div>
      </div>
    )
  }

  // ── Step: nova-senha ──
  if (step === 'nova-senha') {
    const senhaTitle = isFirstAccess
      ? 'Bem-vindo! Defina sua senha para acessar o sistema.'
      : 'Redefina sua senha.'

    return (
      <div className="auth-screen">
        <div className="auth-box">
          <Link to="/login" style={backLinkStyle}>
            <BackArrow /> Voltar ao login
          </Link>

          <p className="auth-title" style={{ fontSize: 32 }}>
            {isFirstAccess ? 'Criar senha' : 'Nova senha'}
          </p>
          <p className="auth-desc">{senhaTitle}</p>

          <form onSubmit={handleConfirmarSenha} noValidate>
            {senhaError && <div className="auth-error">{senhaError}</div>}

            <label className="auth-label" htmlFor="novaSenha">Nova senha</label>
            <input
              id="novaSenha"
              className="auth-input"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              autoFocus
            />
            <PasswordStrength password={novaSenha} />

            <label className="auth-label" htmlFor="confirmarSenha">Confirmar nova senha</label>
            <input
              id="confirmarSenha"
              className="auth-input"
              type="password"
              placeholder="Repita a senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
            />
            <p className="req-hint">Use ao menos 8 caracteres com letras maiúsculas, minúsculas e números.</p>

            <button className="auth-btn" type="submit" disabled={senhaLoading}>
              {senhaLoading ? <span className="spinner" /> : 'Confirmar nova senha'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Step: codigo ──
  if (step === 'codigo') {
    return (
      <div className="auth-screen">
        <div className="auth-box">
          {!isFirstAccessFlow && (
            <button className="auth-back" onClick={() => setStep('sent')}>
              <BackArrow /> Voltar
            </button>
          )}

          <p className="auth-title" style={{ fontSize: 32 }}>Informe o código</p>
          <p className="auth-desc">
            Digite o código de 6 dígitos enviado para <strong>{email}</strong>. O código é válido por 24 horas.
          </p>

          <form onSubmit={handleValidarCodigo} noValidate>
            {codigoError && <div className="auth-error">{codigoError}</div>}

            <label className="auth-label" htmlFor="codigo">Código de verificação</label>
            <input
              id="codigo"
              className="auth-input"
              type="text"
              placeholder="Ex: 847291"
              maxLength={6}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              style={{ letterSpacing: 6, fontSize: 22, textAlign: 'center' }}
              autoFocus
            />

            <button className="auth-btn" type="submit" disabled={codigoLoading}>
              {codigoLoading ? <span className="spinner" /> : 'Verificar código'}
            </button>
          </form>

          {!isFirstAccessFlow && (
            <button className="auth-back" type="button" style={{ marginTop: 16 }} onClick={() => setStep('email')}>
              Não recebi o código
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── Step: sent ──
  if (step === 'sent') {
    return (
      <div className="auth-screen">
        <div className="auth-box">
          <button className="auth-back" onClick={() => setStep('email')}>
            <BackArrow /> Informar outro e-mail
          </button>

          <p className="auth-title" style={{ fontSize: 36 }}>Verifique seu e-mail</p>
          <p className="auth-desc">{GENERIC_SUCCESS}</p>

          <div className="auth-info-box">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 2 }}>
              <rect x="2" y="4" width="20" height="16" rx="2" stroke="#fff" strokeWidth="2" />
              <path d="M2 8l10 6 10-6" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
            </svg>
            <div>
              <strong>{email}</strong>
              O código é válido por 24 horas.
            </div>
          </div>

          <button className="auth-btn" type="button" onClick={() => setStep('codigo')}>
            Já tenho o código
          </button>
        </div>
      </div>
    )
  }

  // ── Step: email ──
  return (
    <div className="auth-screen">
      <div className="auth-box">
        <Link to="/login" style={backLinkStyle}>
          <BackArrow /> Voltar ao login
        </Link>

        <p className="auth-title" style={{ fontSize: 36 }}>Recuperar acesso</p>
        <p className="auth-desc">
          Informe o e-mail cadastrado pelo administrador. Enviaremos um código para você definir sua senha.
        </p>

        <form onSubmit={handleSend} noValidate>
          {emailError && <div className="auth-error">{emailError}</div>}

          <label className="auth-label" htmlFor="email">E-mail</label>
          <input
            id="email"
            className="auth-input"
            type="email"
            placeholder="exemplo@contage.com.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />

          <button className="auth-btn" type="submit" disabled={emailLoading}>
            {emailLoading ? <span className="spinner" /> : 'Enviar código de acesso'}
          </button>
        </form>
      </div>
    </div>
  )
}
