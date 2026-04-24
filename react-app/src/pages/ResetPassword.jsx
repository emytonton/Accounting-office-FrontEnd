import React from 'react'
import { Link } from 'react-router-dom'

export default function ResetPassword() {
  return (
    <div className="auth-screen">
      <div className="auth-box">
        <p className="auth-title" style={{ fontSize: 32 }}>Link inválido</p>
        <p className="auth-desc">
          Este link não é mais válido. Use o formulário de recuperação para receber um novo código por e-mail.
        </p>
        <Link to="/recuperar-senha">
          <button className="auth-btn">Recuperar acesso</button>
        </Link>
      </div>
    </div>
  )
}
