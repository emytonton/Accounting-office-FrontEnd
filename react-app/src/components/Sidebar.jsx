import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" fill="currentColor" />
        <rect x="14" y="3" width="7" height="7" rx="1" fill="currentColor" />
        <rect x="3" y="14" width="7" height="7" rx="1" fill="currentColor" />
        <rect x="14" y="14" width="7" height="7" rx="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: 'Empresas',
    to: '/empresas',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <path d="M3 21V7a2 2 0 012-2h4V3h6v2h4a2 2 0 012 2v14H3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <rect x="9" y="11" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    label: 'Demandas',
    to: '/demandas',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Recibos',
    to: '/recibos',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M3 10h18" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 15h4M15 15h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Recebimentos',
    to: '/recebimentos',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Usuários',
    to: '/usuarios',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
        <path d="M2 21c0-4 3.1-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="17" cy="17" r="4" stroke="currentColor" strokeWidth="2" />
        <path d="M17 15v2h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
    : '?'

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-text">Hub Accounting</div>
        <div className="sidebar-logo-sub">SGEC — Sistema de Gestão</div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `si${isActive ? ' active' : ''}`}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sf-avatar">{initials}</div>
        <div className="sf-info">
          <div className="sf-name">{user?.name || 'Usuário'}</div>
          <div className="sf-role">{user?.role === 'admin' ? 'Administrador' : 'Colaborador'}</div>
        </div>
        <button className="sf-logout" title="Sair" onClick={handleLogout}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 12V7a2 2 0 012-2h6M3 12v5a2 2 0 002 2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </aside>
  )
}
