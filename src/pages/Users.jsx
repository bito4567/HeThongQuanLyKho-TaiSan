import { useState } from 'react'
import { ShieldCheck, Users as UsersIcon, Clock, Filter, Search, ArrowRight, CheckCircle, AlertTriangle, Lock } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useInventory } from '../hooks/useInventory'
import { formatNumber } from '../utils/format'
import './Users.css'

const Users = () => {
  const { user } = useAuth()
  const { transactions } = useInventory()
  const [activeTab, setActiveTab] = useState('logs')
  const [logSearch, setLogSearch] = useState('')

  // If not admin, do not render or show a lock screen
  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-full animate-fade-in">
        <div className="p-6 bg-error/10 text-error rounded-full mb-6 relative">
          <Lock size={64} />
        </div>
        <h1 className="text-4xl font-bold mb-4">Truy Cập Bị Từ Chối</h1>
        <p className="text-muted text-lg max-w-lg mb-8">
          Module Phân quyền và Nhật ký Hệ thống chỉ dành riêng cho Ban Quản Trị (Admin). Bạn không có đủ thẩm quyền để xem trang này.
        </p>
      </div>
    )
  }

  // MOCK USERS DATA (This matches what is inside useAuth.jsx roughly)
  const systemUsers = [
    { id: 1, name: 'Quản Trị Viên', email: 'admin@wms.com', role: 'admin', status: 'Active', lastLogin: new Date().toISOString() },
    { id: 2, name: 'Anh Cường Quản Lý', email: 'manager@wms.com', role: 'manager', status: 'Active', lastLogin: new Date(Date.now() - 3600000).toISOString() },
    { id: 3, name: 'Hưng Mập (Kho số 1)', email: 'staff@wms.com', role: 'staff', status: 'Active', lastLogin: new Date(Date.now() - 86400000).toISOString() },
    { id: 4, name: 'Lan (Kho số 2)', email: 'staff2@wms.com', role: 'staff', status: 'Inactive', lastLogin: new Date(Date.now() - 7 * 86400000).toISOString() }
  ]

  const sortedLogs = [...transactions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  const filteredLogs = sortedLogs.filter(log => 
    log.id.toLowerCase().includes(logSearch.toLowerCase()) ||
    (log.createdBy && log.createdBy.toLowerCase().includes(logSearch.toLowerCase())) ||
    (log.approvedBy && log.approvedBy.toLowerCase().includes(logSearch.toLowerCase()))
  )

  const getLogTypeColor = (type) => {
    switch(type) {
      case 'INBOUND': return 'text-secondary bg-secondary/10 border-secondary/20'
      case 'OUTBOUND': return 'text-accent bg-accent/10 border-accent/20'
      case 'AUDIT': return 'text-primary bg-primary/10 border-primary/20'
      default: return 'text-muted bg-surface border-light'
    }
  }

  return (
    <div className="users-container animate-fade-in max-w-[1400px] mx-auto pb-12">
      <header className="mb-8 flex items-center gap-4">
        <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-xl"><ShieldCheck size={32} /></div>
        <div>
          <h1 className="text-3xl font-bold mb-1">Phân Quyền & Lịch Sử (Audit Logs)</h1>
          <p className="text-muted">Trung tâm kiểm soát cấp phép và truy vết toàn bộ hoạt động hệ thống.</p>
        </div>
      </header>

      <div className="flex gap-4 mb-8">
        <button 
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all border ${activeTab === 'logs' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-transparent text-muted border-light hover:border-primary/50'}`}
          onClick={() => setActiveTab('logs')}
        >
          <Clock size={20} /> Nhật Ký Hệ Thống
        </button>
        <button 
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all border ${activeTab === 'users' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-transparent text-muted border-light hover:border-primary/50'}`}
          onClick={() => setActiveTab('users')}
        >
          <UsersIcon size={20} /> Quản Lý Tài Khoản
        </button>
      </div>

      <div className="tab-contents">
        {activeTab === 'logs' && (
          <div className="glass-card p-6 animate-fade-in fade-up">
            <div className="flex justify-between items-center mb-6 border-b border-light pb-4">
              <h2 className="text-xl font-bold">Truy Vết Chứng Từ (Transaction Trace)</h2>
              <div className="flex items-center gap-4">
                <div className="search-bar glass-card flex items-center px-4 py-2 gap-2 w-72">
                  <Search size={18} className="text-muted" />
                  <input 
                    type="text" 
                    placeholder="Tìm mã số chứng từ, người tạo..." 
                    value={logSearch}
                    onChange={e => setLogSearch(e.target.value)}
                    className="bg-transparent border-none outline-none text-main flex-1 w-full"
                  />
                </div>
                <button className="btn-secondary flex items-center gap-2"><Filter size={18}/> Lọc</button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-light pb-4 uppercase text-xs text-muted tracking-wider">
                    <th className="py-4 px-4 font-bold">Thời Gian</th>
                    <th className="py-4 px-4 font-bold">Chứng Từ / Loại</th>
                    <th className="py-4 px-4 font-bold text-center">SKUs</th>
                    <th className="py-4 px-4 font-bold">Hành Động & Người Thực Hiện</th>
                    <th className="py-4 px-4 font-bold text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-12 text-muted">Không tìm thấy file log nào khớp với hệ thống.</td>
                    </tr>
                  ) : (
                    filteredLogs.map(log => (
                      <tr key={log.id} className="border-b border-light/30 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4">
                          <p className="font-bold">{new Date(log.timestamp).toLocaleDateString('vi-VN')}</p>
                          <p className="text-xs text-muted">{new Date(log.timestamp).toLocaleTimeString('vi-VN')}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-mono font-bold text-primary text-sm">{log.id}</p>
                          <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] uppercase font-bold border rounded ${getLogTypeColor(log.type)}`}>
                            {log.type}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center font-bold">
                          {formatNumber(log.totalItems || log.items?.length || 0)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 text-sm max-w-[300px]">
                            <span className="shrink-0">Khởi tạo bởi:</span>
                            <span className="font-bold text-main truncate">{log.createdBy || 'Hệ thống'}</span>
                          </div>
                          {log.approvedBy && (
                            <div className="flex items-center gap-2 text-sm mt-1 text-secondary">
                              <span className="shrink-0"><CheckCircle size={14} className="inline mr-1" />Duyệt bởi:</span>
                              <span className="font-bold truncate">{log.approvedBy}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${log.status === 'Approved' ? 'bg-secondary/20 text-secondary' : log.status === 'Pending' ? 'bg-accent/20 text-accent' : 'bg-error/20 text-error'}`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="glass-card p-6 animate-fade-in fade-up">
            <div className="flex justify-between items-center mb-6 border-b border-light pb-4">
              <h2 className="text-xl font-bold">Danh sách Tài Khoản</h2>
              <button className="btn-primary flex items-center gap-2"><UsersIcon size={18}/> Thêm Nhân Viên Mới</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {systemUsers.map(u => (
                <div key={u.id} className="p-4 rounded-xl border border-light bg-black/10 relative overflow-hidden group hover:border-primary/50 transition-colors">
                  <div className={`absolute top-0 left-0 w-1 min-h-full ${u.role === 'admin' ? 'bg-primary' : u.role === 'manager' ? 'bg-secondary' : 'bg-muted'}`}></div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-full bg-surface border border-light flex items-center justify-center font-bold text-xl uppercase text-primary">
                      {u.name.charAt(0)}
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${u.status === 'Active' ? 'bg-secondary/20 text-secondary border border-secondary/30' : 'bg-error/20 text-error border border-error/30'}`}>
                      {u.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg leading-tight mb-1">{u.name}</h3>
                  <p className="text-muted text-sm mb-3">{u.email}</p>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-light/50">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-primary/20 text-primary' : u.role === 'manager' ? 'bg-secondary/20 text-secondary' : 'bg-surface text-muted'}`}>
                      {u.role}
                    </span>
                    <button className="text-primary opacity-0 group-hover:opacity-100 transition-opacity text-sm hover:underline">Sửa</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Users
