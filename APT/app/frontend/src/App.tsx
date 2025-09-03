import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import DoctorsPage from './pages/DoctorsPage'
import PatientsPage from './pages/PatientsPage'
import AppointmentsPage from './pages/AppointmentsPage'
import NavBar from './components/NavBar'

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/app" element={
          <PrivateRoute>
            <Layout><Dashboard /></Layout>
          </PrivateRoute>
        } />
        <Route path="/app/doctors" element={
          <PrivateRoute>
            <Layout><DoctorsPage /></Layout>
          </PrivateRoute>
        } />
        <Route path="/app/patients" element={
          <PrivateRoute>
            <Layout><PatientsPage /></Layout>
          </PrivateRoute>
        } />
        <Route path="/app/appointments" element={
          <PrivateRoute>
            <Layout><AppointmentsPage /></Layout>
          </PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </AuthProvider>
  )
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial", padding: 16 }}>
      <NavBar />
      <div style={{ marginTop: 16 }}>{children}</div>
    </div>
  )
}
