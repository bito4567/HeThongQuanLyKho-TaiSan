import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Inbound from './pages/Inbound'
import Outbound from './pages/Outbound'
import Login from './pages/Login'
import Settings from './pages/Settings'
import { useAuth } from './hooks/useAuth'
import './index.css'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const { user, loading } = useAuth()

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
      <div className="loader">Đang tải...</div>
    </div>
  )

  if (!user) return <Login />

  return (
    <div className="app-container" style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      <Sidebar activePage={currentPage} onPageChange={setCurrentPage} />
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'inventory' && <Inventory />}
        {currentPage === 'inbound' && <Inbound />}
        {currentPage === 'outbound' && <Outbound />}
        {currentPage === 'audit' && <div className="animate-fade-in"><h1 className="text-gradient">Kiểm kê kho</h1><p>Tính năng dành cho Quản lý và Admin.</p></div>}
        {currentPage === 'users' && <div className="animate-fade-in"><h1 className="text-gradient">Quản lý người dùng</h1><p>Tính năng chỉ dành cho Admin.</p></div>}
        {currentPage === 'settings' && <Settings />}
      </main>
    </div>
  )
}

export default App
