import React, { createContext, useContext, useEffect, useState } from 'react'
import { api, setAuthToken, post, get } from '../lib/api'

type AuthCtx = {
  token: string | null
  user: { id?: string | number, doctorId?: string | number, email?: string | null, fullName?: string | null, role?: string | null } | null
  loginWithCredentials: (email: string, password: string) => Promise<void>
  logout: () => void
}

const Ctx = createContext<AuthCtx>({
  token: null, user: null,
  loginWithCredentials: async () => {},
  logout: () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [user, setUser] = useState<AuthCtx['user']>(null)

  // bootstrap: set axios header and try /api/me
  useEffect(() => {
    setAuthToken(token)
    let canceled = false
    async function bootstrap() {
      if (!token) { setUser(null); return }
      try {
        const me = await get<any>('/me')
        // Mapear 'name' a 'fullName' para compatibilidad con NavBar
        const userData = {
          id: me.id,
          doctorId: me.doctorId,
          email: me.email,
          fullName: me.name,
          role: me.role
        }
        if (!canceled) setUser(userData)
      } catch {
        // token inválido
        if (!canceled) {
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
        }
      }
    }
    bootstrap()
    return () => { canceled = true }
  }, [token])

  async function loginWithCredentials(email: string, password: string) {
    const res = await post<any, any>('/auth/login', { email, password })
    localStorage.setItem('token', res.token)
    setToken(res.token)
    setUser({
      id: res.id,
      doctorId: res.doctorId,
      email: res.email,
      fullName: res.fullName,
      role: res.role
    })
  }

  function logout() {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return <Ctx.Provider value={{ token, user, loginWithCredentials, logout }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
