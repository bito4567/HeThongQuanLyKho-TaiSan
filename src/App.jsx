import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Inbound from './pages/Inbound'
import Outbound from './pages/Outbound'
import Login from './pages/Login'
import Settings from './pages/Settings'
import Approvals from './pages/Approvals'
import Reports from './pages/Reports'
import Audit from './pages/Audit'
import Users from './pages/Users'
import { useAuth } from './hooks/useAuth'
import { InventoryProvider } from './hooks/useInventory'
import { ThemeProvider } from './hooks/useTheme'
import './index.css'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const { user, loading } = useAuth()

  if (loading) return (
    <ThemeProvider>
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <div className="loader">Đang tải...</div>
      </div>
    </ThemeProvider>
  )

  if (!user) return <ThemeProvider><Login /></ThemeProvider>

  return (
    <ThemeProvider>
      <InventoryProvider>
        <div className="app-container" style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
          <Sidebar activePage={currentPage} onPageChange={setCurrentPage} />
          <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
            {currentPage === 'dashboard' && <Dashboard onPageChange={setCurrentPage} />}
            {currentPage === 'inventory' && <Inventory />}
            {currentPage === 'inbound' && <Inbound />}
            {currentPage === 'outbound' && <Outbound />}
            {currentPage === 'approvals' && <Approvals />}
            {currentPage === 'audit' && <Audit />}
            {currentPage === 'reports' && <Reports />}
            {currentPage === 'users' && <Users />}
            {currentPage === 'settings' && <Settings />}
          </main>
        </div>
      </InventoryProvider>
    </ThemeProvider>
  )
}

export default App
