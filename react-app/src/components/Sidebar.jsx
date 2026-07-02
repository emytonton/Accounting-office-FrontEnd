import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Icon } from './icons'

const NAV_ITEMS = [
  { label: 'Dashboard',        to: '/dashboard',     iconName: 'dashboard' },
  { label: 'Empresas',         to: '/empresas',      iconName: 'business' },
  { label: 'Demandas',         to: '/demandas',      iconName: 'assignment' },
  { label: 'Recibos',          to: '/recibos',       iconName: 'receipt',    adminOnly: true },
  { label: 'Exportar',         to: '/exportar',      iconName: 'exportData', adminOnly: true },
  { label: 'Auditoria',        to: '/auditoria',     iconName: 'audit',      adminOnly: true },
  { label: 'Usuários',         to: '/usuarios',      iconName: 'users' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'

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
        {NAV_ITEMS.filter(item => !item.adminOnly || isAdmin).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `si${isActive ? ' active' : ''}`}
          >
            <Icon name={item.iconName} size={22} />
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
          <Icon name="logout" size={18} />
        </button>
      </div>
    </aside>
  )
}
