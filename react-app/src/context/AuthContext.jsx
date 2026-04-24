import React, { createContext, useContext, useState, useEffect } from 'react'
import { logout as logoutService } from '../api/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const [token, setToken] = useState(() => localStorage.getItem('token') || null)

  function saveSession(userData, jwt) {
    setUser(userData)
    setToken(jwt)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', jwt)
  }

  async function logout() {
    try {
      await logoutService()
    } catch {
      // silently clear local state even if logout request fails
    }
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, saveSession, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
