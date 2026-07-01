import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Users from './pages/Users'
import NewUser from './pages/NewUser'
import EditUser from './pages/EditUser'
import Dashboard from './pages/Dashboard'
import Companies from './pages/Companies'
import NewCompany from './pages/NewCompany'
import EditCompany from './pages/EditCompany'
import CompanyLinks from './pages/CompanyLinks'
import Demands from './pages/Demands'
import DemandDetail from './pages/DemandDetail'
import Receipts from './pages/Receipts'
import ReceiptDetail from './pages/ReceiptDetail'
import Export from './pages/Export'
import AuditLogs from './pages/AuditLogs'

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
            <Route path="/dashboard" element={<Dashboard />} />

            <Route path="/usuarios" element={<Users />} />
            <Route path="/usuarios/novo" element={<NewUser />} />
            <Route path="/usuarios/:id/editar" element={<EditUser />} />

            <Route path="/empresas" element={<Companies />} />
            <Route path="/empresas/nova" element={<NewCompany />} />
            <Route path="/empresas/:id/editar" element={<EditCompany />} />
            <Route path="/empresas/:id/vinculos" element={<CompanyLinks />} />

            <Route path="/tipos-demanda" element={<Navigate to="/demandas" replace />} />

            <Route path="/demandas" element={<Demands />} />
            <Route path="/demandas/:id" element={<DemandDetail />} />

            <Route path="/recibos" element={<Receipts />} />
            <Route path="/recibos/:id" element={<ReceiptDetail />} />
            <Route path="/recebimentos" element={<Navigate to="/recibos" replace />} />

            <Route path="/exportar" element={<Export />} />
            <Route path="/auditoria" element={<AuditLogs />} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
