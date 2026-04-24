import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'

import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Users from './pages/Users'
import NewUser from './pages/NewUser'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/recuperar-senha" element={<ForgotPassword />} />
          <Route path="/redefinir-senha/:token" element={<ResetPassword />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/usuarios" element={<Users />} />
            <Route path="/usuarios/novo" element={<NewUser />} />

            <Route path="/dashboard" element={<Dashboard />} />

            {/* Placeholder routes for other sidebar pages */}
            <Route path="/empresas" element={<PlaceholderPage title="Empresas" />} />
            <Route path="/demandas" element={<PlaceholderPage title="Demandas" />} />
            <Route path="/recibos" element={<PlaceholderPage title="Recibos" />} />
            <Route path="/recebimentos" element={<PlaceholderPage title="Recebimentos" />} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

function PlaceholderPage({ title }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="header-band">
          <div className="header-left">
            <h1 className="page-title">{title}</h1>
            <p className="page-subtitle">Em desenvolvimento</p>
          </div>
        </div>
        <div className="content">
          <p className="empty-state">Esta página ainda não foi implementada.</p>
        </div>
      </main>
    </div>
  )
}
