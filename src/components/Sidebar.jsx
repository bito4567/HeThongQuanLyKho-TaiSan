import { 
  LayoutDashboard, 
  Package, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Settings, 
  LogOut,
  Warehouse,
  ShieldCheck,
  ClipboardCheck
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { Sun, Moon } from 'lucide-react'
import './Sidebar.css'

const Sidebar = ({ activePage, onPageChange }) => {
  const { user, logout, hasPermission } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const allItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard, permission: 'view_inventory' },
    { id: 'inventory', label: 'Kho hàng', icon: Package, permission: 'view_inventory' },
    { id: 'inbound', label: 'Nhập kho', icon: ArrowDownLeft, permission: 'stock_movement' },
    { id: 'outbound', label: 'Xuất kho', icon: ArrowUpRight, permission: 'stock_movement' },
    { id: 'audit', label: 'Kiểm kê', icon: ClipboardCheck, permission: 'inventory_audit' },
    { id: 'users', label: 'Người dùng', icon: ShieldCheck, permission: 'manage_users' },
    { id: 'settings', label: 'Cài đặt', icon: Settings, permission: 'view_inventory' },
  ]

  const menuItems = allItems.filter(item => hasPermission(item.permission))

  return (
    <aside className="sidebar glass-card">
      <div className="sidebar-header">
        <div className="logo-container">
          <Warehouse className="logo-icon" />
          <span className="logo-text">WMS Pro</span>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onPageChange(item.id)}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">{user?.name.charAt(0)}</div>
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">{user?.role === 'admin' ? 'Quản trị viên' : user?.role === 'manager' ? 'Quản lý kho' : 'Nhân viên'}</span>
          </div>
        </div>
        
        <button className="nav-item theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          <span>{theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}</span>
        </button>

        <button className="nav-item logout" onClick={logout}>
          <LogOut size={20} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
