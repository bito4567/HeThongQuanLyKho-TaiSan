import { useState } from 'react'
import { CheckCircle, XCircle, Search, Clock, ArrowRight, Package, AlertCircle, FileSignature } from 'lucide-react'
import { useInventory } from '../hooks/useInventory'
import { useAuth } from '../hooks/useAuth'
import { formatCurrency, formatNumber } from '../utils/format'
import { INBOUND_TYPES } from '../utils/mockData'
import './Approvals.css'

const Approvals = () => {
  const { transactions, approveTransaction, rejectTransaction } = useInventory()
  const { user, hasPermission } = useAuth()
  const [activeTab, setActiveTab] = useState('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTxv, setSelectedTxv] = useState(null)

  // Only Managers and Admins can approve
  const canApprove = hasPermission('approve_orders')
  if (!canApprove) {
    return (
      <div className="approvals-container animate-fade-in">
        <div className="glass-card error-card">
          <AlertCircle size={48} className="text-error" />
          <h2>Không có quyền truy cập</h2>
          <p>Trang hiển thị dành riêng cho cấp Quản lý và Admin.</p>
        </div>
      </div>
    )
  }

  const isPending = (status) => status === 'Pending' || status === 'PENDING_MANAGER' || status === 'PENDING_ADMIN'
  const canSeePending = (t) => {
    if (user.role === 'admin') return isPending(t.status)
    if (user.role === 'manager') return t.status === 'Pending' || t.status === 'PENDING_MANAGER' || t.status === 'PENDING_ADMIN'
    // Let Manager see PENDING_ADMIN in history but they can't approve it.
    // Wait, activeTab filters by pending, so only return true if they CAN approve it.
    if (user.role === 'manager') return t.status === 'Pending' || t.status === 'PENDING_MANAGER'
    return false
  }

  const filteredTransactions = transactions.filter(t => {
    const matchesTab = activeTab === 'pending' ? canSeePending(t) : !isPending(t.status)
    const matchesSearch = t.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (t.createdBy && t.createdBy.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesTab && matchesSearch
  })

  const pendingCount = transactions.filter(t => canSeePending(t)).length

  const handleApprove = (id) => {
    if (window.confirm('Bạn xác nhận KÝ DUYỆT cho chứng từ này? Kho sẽ tự động được cập nhật tuỳ theo phiên bản.')) {
      approveTransaction(id, user.name, user.role)
      setSelectedTxv(null)
    }
  }

  const handleReject = (id) => {
    if (window.confirm('Từ chối chứng từ này? Hành động này không thể hoàn tác.')) {
      rejectTransaction(id, user.name, user.role)
      setSelectedTxv(null)
    }
  }

  return (
    <div className="approvals-container animate-fade-in">
      <header className="approvals-header">
        <div className="header-title">
          <div className="icon-circle" style={{ background: 'var(--accent)' }}><Clock size={28} color="white" /></div>
          <div>
            <h1 className="text-gradient">Duyệt Chứng Từ</h1>
            <p className="subtitle">Kiểm tra và phê duyệt các yêu cầu xuất/nhập kho từ Nhân viên.</p>
          </div>
        </div>
      </header>

      <div className="approvals-layout">
        {/* Left List */}
        <div className="approvals-list-panel glass-card">
          <div className="tabs">
            <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
              Chờ duyệt {pendingCount > 0 && <span className="badge">{pendingCount}</span>}
            </button>
            <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
              Lịch sử duyệt
            </button>
          </div>

          <div className="search-bar" style={{ margin: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Mã phiếu, người lập..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-main)', width: '100%', padding: '0.5rem' }}
            />
          </div>

          <div className="txv-list">
            {filteredTransactions.length === 0 ? (
              <div className="empty-state text-center text-muted p-8">
                <CheckCircle size={40} className="mx-auto mb-4 opacity-50" />
                <p>Không có chứng từ nào.</p>
              </div>
            ) : (
              filteredTransactions.map(t => (
                <div 
                  key={t.id} 
                  className={`txv-item ${selectedTxv?.id === t.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTxv(t)}
                >
                  <div className="txv-item-header">
                    <span className="txv-id font-mono text-primary font-bold">{t.id}</span>
                    <span className={`status-dot ${t.status.toLowerCase()}`}></span>
                  </div>
                  <div className="txv-item-body mt-2 flex justify-between">
                    <div>
                      <span className="text-sm block">Loại: <strong className={t.type === 'INBOUND' ? 'text-secondary' : 'text-accent'}>{t.type === 'INBOUND' ? 'NHẬP KHO' : 'XUẤT KHO'}</strong></span>
                      <span className="text-xs text-muted block mt-1">Người lập: {t.createdBy}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold block">{t.totalItems} mặt hàng</span>
                      <span className="text-xs text-muted">SL: {formatNumber(t.totalQuantity || 0)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Details */}
        <div className="approvals-detail-panel glass-card">
          {selectedTxv ? (
            <div className="detail-content animate-fade-in">
              <div className="detail-header flex justify-between items-start pb-4 border-b border-light">
                <div>
                  <h2 className="text-xl font-bold font-mono">{selectedTxv.id}</h2>
                  <p className="text-sm text-muted mt-1">Lập lúc: {new Date(selectedTxv.timestamp).toLocaleString('vi-VN')}</p>
                </div>
                <div className={`status-badge large ${selectedTxv.status.toLowerCase()}`}>
                  {isPending(selectedTxv.status) ? selectedTxv.status : selectedTxv.status === 'Approved' ? 'ĐÃ DUYỆT' : selectedTxv.status}
                </div>
              </div>

              <div className="detail-info grid grid-cols-2 gap-4 mt-6">
                <div>
                  <span className="text-xs text-muted uppercase block mb-1">Loại chứng từ</span>
                  <span className={`font-bold ${selectedTxv.type === 'INBOUND' ? 'text-secondary' : 'text-accent'}`}>
                    {selectedTxv.type === 'INBOUND' ? 'NHẬP KHO' : 'XUẤT KHO'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted uppercase block mb-1">Người tạo</span>
                  <span className="font-bold">{selectedTxv.createdBy || 'Hệ thống'}</span>
                </div>
                {selectedTxv.supplierId && (
                  <div className="col-span-2">
                    <span className="text-xs text-muted uppercase block mb-1">Nhà Cung Cấp</span>
                    <span className="font-bold">{selectedTxv.supplierId}</span>
                  </div>
                )}
                {selectedTxv.notes && (
                  <div className="col-span-2">
                    <span className="text-xs text-muted uppercase block mb-1">Ghi chú</span>
                    <p className="text-sm italic p-3 bg-light rounded-md border">{selectedTxv.notes}</p>
                  </div>
                )}
              </div>

              <h3 className="text-md font-bold mt-8 mb-4 border-b border-light pb-2 flex items-center gap-2">
                <Package size={18} /> Danh sách mặt hàng ({selectedTxv.items?.length || 0})
              </h3>
              
              <div className="detail-items-table">
                <div className="item-row header">
                  <div>SKU</div>
                  <div>Tên Sản Phẩm</div>
                  <div className="text-right">Số Lượng</div>
                  {selectedTxv.type === 'INBOUND' && <div className="text-right">Giá Nhập</div>}
                </div>
                {selectedTxv.items?.map((item, idx) => (
                  <div key={idx} className="item-row">
                    <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-xl"><FileSignature size={32} /></div>
                    <div className="font-bold">{item.name}</div>
                    <div className="text-right font-bold text-primary">{formatNumber(item.quantity)}</div>
                    {selectedTxv.type === 'INBOUND' && <div className="text-right">{formatCurrency(item.inboundPrice || 0)}</div>}
                  </div>
                ))}
              </div>

              {isPending(selectedTxv.status) && canSeePending(selectedTxv) && (
                <div className="approval-actions mt-8 pt-6 border-t border-light flex gap-4 justify-end">
                  <button className="btn-secondary" onClick={() => handleReject(selectedTxv.id)}>
                    <XCircle size={18} /> Từ chối
                  </button>
                  <button className="btn-primary confirm-btn" onClick={() => handleApprove(selectedTxv.id)}>
                    <CheckCircle size={18} /> Ký Duyệt & Xác Nhận
                  </button>
                </div>
              )}

              {!isPending(selectedTxv.status) && (
                <div className="mt-8 pt-4 border-t border-light text-right text-sm text-muted">
                  Đã được <strong>{selectedTxv.status === 'APPROVED' || selectedTxv.status === 'Approved' ? 'Duyệt' : 'Từ chối'}</strong> bởi {selectedTxv.approvedBy || selectedTxv.rejectedBy || 'Hệ thống'} vào lúc {new Date(selectedTxv.approvedAt || selectedTxv.rejectedAt).toLocaleString('vi-VN')}
                </div>
              )}
            </div>
          ) : (
            <div className="empty-detail flex flex-col items-center justify-center h-full opacity-50">
              <Package size={64} className="mb-4 text-muted" />
              <p>Chọn một phiếu bên trái để xem chi tiết</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Approvals
