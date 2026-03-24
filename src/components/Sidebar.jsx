import { 
  LayoutDashboard, 
  Package, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Settings, 
  LogOut,
  Warehouse,
  ShieldCheck,
  ClipboardCheck,
  BarChart3,
  Users,
  FileSignature
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import './Sidebar.css'

const Sidebar = ({ activePage, onPageChange }) => {
  const { user, logout, hasPermission } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const allItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard, permission: 'view_dashboard' },
    { id: 'inventory', label: 'Kho hàng', icon: Warehouse, permission: 'view_inventory' },
    { id: 'inbound', label: 'Nhập kho', icon: ArrowDownLeft, permission: 'stock_movement' },
    { id: 'outbound', label: 'Xuất kho', icon: ArrowUpRight, permission: 'stock_movement' },
    { id: 'approvals', label: 'Duyệt đơn', icon: FileSignature, permission: 'approve_orders' },
    { id: 'audit', label: 'Kiểm kê', icon: ClipboardCheck, permission: 'inventory_audit' },
    { id: 'reports', label: 'Báo cáo', icon: BarChart3, permission: 'view_reports' },
    { id: 'users', label: 'Phân quyền', icon: Users, permission: 'manage_users' }
    // Settings is removed and hardcoded below
  ]

  const menuItems = allItems.filter(item => hasPermission(item.permission))

  return (
    <aside className="sidebar glass-card">
      <div className="sidebar-header">
        <div className="logo-container">
          <Warehouse className="logo-icon" />
          <span className="logo-text">WMS Pro</span>
        </div>
        
        {/* User Profile moved here */}
        <div className="user-profile mt-6 p-3 rounded-2xl bg-black/10 border border-light/50 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className={`user-avatar w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-xl shadow-md ${user?.role === 'admin' ? 'bg-error' : user?.role === 'manager' ? 'bg-orange-500' : 'bg-primary'}`}>
              {user?.name.charAt(0)}
            </div>
            <div className="user-info truncate">
              <span className="user-name font-bold text-[15px] text-main block truncate">{user?.name.replace('Hệ thống ', '')}</span>
              <span className={`user-role text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-white inline-block mt-1 ${user?.role === 'admin' ? 'bg-error/80' : user?.role === 'manager' ? 'bg-orange-500/80' : 'bg-primary/80'}`}>
                {user?.role === 'admin' ? 'Admin' : user?.role === 'manager' ? 'Quản lý' : 'Nhân viên'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <nav className="sidebar-nav mt-4 overflow-y-auto pr-2 custom-scrollbar">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onPageChange(item.id)}
          >
            <item.icon size={24} strokeWidth={activePage === item.id ? 2.5 : 2} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        {hasPermission('manage_settings') && (
          <button
            className={`nav-item settings-item ${activePage === 'settings' ? 'active' : ''}`}
            onClick={() => onPageChange('settings')}
          >
            <Settings size={24} />
            <span>Cài đặt hệ thống</span>
          </button>
        )}
        <button className="nav-item logout" onClick={logout}>
          <LogOut size={24} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
