import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../api/authService'
import { useAuth } from '../context/AuthContext'

const GENERIC_ERROR = 'E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.'
const LOCKOUT_ERROR = 'Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.'
const ACCESS_DENIED_ERROR = 'Acesso negado. Você não tem permissão para acessar o sistema.'

export default function Login() {
  const navigate = useNavigate()
  const { saveSession } = useAuth()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!identifier || !password) {
      setError('Preencha o e-mail e a senha.')
      return
    }

    setLoading(true)
    try {
      const data = await login(identifier, password)
      saveSession(data.user, data.token)
      navigate('/dashboard')
    } catch (err) {
      const code = err.response?.data?.code || err.response?.data?.error
      const status = err.response?.status

      if (code === 'TOO_MANY_ATTEMPTS' || status === 429) {
        setError(LOCKOUT_ERROR)
      } else if (code === 'FIRST_ACCESS_REQUIRED') {
        navigate('/recuperar-senha', { state: { firstAccess: true, email: identifier } })
      } else if (code === 'ACCESS_DENIED' || status === 403) {
        setError(ACCESS_DENIED_ERROR)
      } else if (code === 'VALIDATION_ERROR' || status === 400) {
        const msg = err.response?.data?.message
        setError(msg || 'Dados inválidos. Verifique o e-mail informado.')
      } else {
        setError(GENERIC_ERROR)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-box">
        <h1 className="auth-title">Hub Accounting</h1>

        <form onSubmit={handleSubmit} noValidate>
          {error && <div className="auth-error">{error}</div>}

          <label className="auth-label" htmlFor="identifier">E-mail</label>
          <input
            id="identifier"
            className="auth-input"
            type="email"
            placeholder="seu@email.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="email"
            autoFocus
          />

          <label className="auth-label" htmlFor="password">Senha</label>
          <input
            id="password"
            className="auth-input"
            type="password"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Entrar'}
          </button>
        </form>

        <div className="auth-forgot">
          <Link to="/recuperar-senha">Esqueceu a senha ou primeiro acesso?</Link>
        </div>
      </div>
    </div>
  )
}
