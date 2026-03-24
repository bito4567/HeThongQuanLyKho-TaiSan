import { useState, useEffect } from 'react'
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  Clock,
  AlertOctagon,
  Plus
} from 'lucide-react'
import { useInventory } from '../hooks/useInventory'
import { formatCurrency, formatNumber } from '../utils/format'
import InventoryChart from '../components/InventoryChart'
import './Dashboard.css'

const StatCard = ({ title, value, icon: Icon, color, trend, delay, onClick }) => (
  <div 
    className={`stat-card glass-card animate-fade-in ${onClick ? 'clickable' : ''}`} 
    style={{ animationDelay: `${delay}s` }}
    onClick={onClick}
  >
    <div className="stat-card-glow" style={{ backgroundColor: color }}></div>
    <div className="stat-card-inner">
      <div className="stat-icon-container" style={{ color: color }}>
        <Icon size={24} />
      </div>
      <div className="stat-info">
        <span className="stat-title">{title}</span>
        <h2 className="stat-value">{value}</h2>
        {trend && (
          <div className="stat-trend" style={{ color: trend.startsWith('+') ? 'var(--secondary)' : '#ef4444' }}>
            <span>{trend}</span>
            <span className="trend-label"> từ tuần trước</span>
          </div>
        )}
      </div>
    </div>
  </div>
)

const Dashboard = ({ onPageChange }) => {
  const { inventory, transactions, suppliers, loading } = useInventory()
  const [greeting, setGreeting] = useState('')
  const [chartRange, setChartRange] = useState('7_days')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Chào buổi sáng')
    else if (hour < 18) setGreeting('Chào buổi chiều')
    else setGreeting('Chào buổi tối')
  }, [])

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Đang tải dữ liệu hệ thống...</p>
    </div>
  )

  const totalStockCount = inventory.reduce((sum, item) => sum + item.stock, 0)
  const lowStockItems = inventory.filter(item => item.status === 'Low Stock' || item.status === 'Out of Stock')
  const outOfStockCount = inventory.filter(item => item.status === 'Out of Stock').length
  
  const totalValue = inventory.reduce((sum, item) => {
    const priceStr = typeof item.price === 'string' ? item.price : String(item.price || '0')
    const price = parseInt(priceStr.replace(/[^0-9]/g, '')) || 0
    return sum + (price * item.stock)
  }, 0)

  const topProducts = [...inventory].sort((a, b) => b.stock - a.stock).slice(0, 5)

  const stats = [
    { 
      title: 'TỔNG SỐ MẶT HÀNG', 
      value: formatNumber(totalStockCount), 
      icon: Package, 
      color: '#3b82f6', 
      trend: '+12.5%',
      delay: 0.1,
      onClick: () => onPageChange('inventory')
    },
    { 
      title: 'GIÁ TRỊ TỒN KHO', 
      value: formatCurrency(totalValue, true), 
      icon: TrendingUp, 
      color: '#10b981', 
      trend: '+5.2%',
      delay: 0.2
    },
    { 
      title: 'SẮP HẾT HÀNG', 
      value: formatNumber(lowStockItems.filter(i => i.status === 'Low Stock').length), 
      icon: AlertTriangle, 
      color: '#f59e0b', 
      trend: 'Cần nhập gấp',
      delay: 0.3,
      onClick: () => onPageChange('inventory')
    },
    { 
      title: 'HẾT HÀNG TRONG KHO', 
      value: formatNumber(outOfStockCount), 
      icon: AlertOctagon, 
      color: '#ef4444', 
      trend: 'Liên hệ Nhà cung cấp',
      delay: 0.4,
      onClick: () => onPageChange('inventory')
    },
    { 
      title: 'ĐƠN CHỜ XỬ LÝ', 
      value: formatNumber(48),
      icon: Clock, 
      color: '#8b5cf6', 
      trend: '+8%',
      delay: 0.5
    },
  ]

  const formatActivity = (tx) => {
    const item = inventory.find(i => i.id === tx.productId)
    const supplier = item ? suppliers.find(s => s.id === item.supplierId) : null
    
    let title = 'Hoạt động hệ thống';
    if (tx.type === 'TẠO_MỚI') title = 'Thêm sản phẩm mới';
    else if (tx.type === 'CẬP_NHẬT') title = 'Cập nhật thông tin';
    else if (tx.type === 'INBOUND') title = 'Nhập kho thành công';
    else if (tx.type === 'OUTBOUND') title = 'Xuất kho thành công';

    return {
      id: tx.id,
      title: title,
      subtitle: item ? `${item.name} (${supplier?.name || 'Vãng lai'})` : (tx.productId || 'Hệ thống'),
      value: tx.quantity > 0 ? `+${formatNumber(tx.quantity)}` : (tx.quantity < 0 ? `-${formatNumber(tx.quantity)}` : 'Sửa đổi'),
      time: new Date(tx.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      type: tx.type
    }
  }

  const activities = transactions.slice(0, 4).map(formatActivity)

  return (
    <div className="dashboard-container animate-fade-in">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="date-badge">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          <h1 className="greeting-text">{greeting}, <span className="text-gradient">Admin</span></h1>
          <p className="subtitle">Hệ thống đang hoạt động ổn định. Dưới đây là tóm tắt tình hình kho.</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary glass-card" onClick={() => onPageChange('inventory')}>
            <Clock size={18} />
            <span>Lịch sử</span>
          </button>
          <button className="btn-primary">
            Tải báo cáo PDF
          </button>
        </div>
      </header>

      <section className="stats-grid">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </section>

      <div className="main-dashboard-grid">
        <div className="left-column">
          <section className="chart-section glass-card">
            <div className="section-header">
              <h3>Phân tích dữ liệu kho</h3>
              <div className="chart-tabs">
                <button 
                  className={chartRange === 'today' ? 'active' : ''} 
                  onClick={() => setChartRange('today')}
                >Hôm nay</button>
                <button 
                  className={chartRange === '7_days' ? 'active' : ''} 
                  onClick={() => setChartRange('7_days')}
                >7 ngày</button>
                <button 
                  className={chartRange === '30_days' ? 'active' : ''} 
                  onClick={() => setChartRange('30_days')}
                >30 ngày</button>
                <button 
                  className={chartRange === '12_months' ? 'active' : ''} 
                  onClick={() => setChartRange('12_months')}
                >12 tháng</button>
              </div>
            </div>
            <div className="chart-container">
              <InventoryChart range={chartRange} />
            </div>
          </section>

          <section className="insights-grid">
            <div className="activity-panel glass-card">
              <div className="section-header">
                <h3>Hoạt động gần đây</h3>
                <button className="link-btn" onClick={() => onPageChange('inventory')}>Xem tất cả</button>
              </div>
              <div className="activity-feed">
                {activities.map(act => (
                  <div key={act.id} className="activity-card">
                    <div className={`activity-icon ${act.type.toLowerCase()}`}>
                      {act.type === 'TẠO_MỚI' ? <Plus size={16} /> : <TrendingUp size={16} />}
                    </div>
                    <div className="activity-content">
                      <div className="activity-main">
                        <span className="activity-title">{act.title}</span>
                        <span className="activity-val">{act.value}</span>
                      </div>
                      <div className="activity-sub">
                        <span>{act.subtitle}</span>
                        <span className="dot">•</span>
                        <span>{act.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {activities.length === 0 && (
                  <div className="empty-state">Chưa có hoạt động nào hôm nay</div>
                )}
              </div>
            </div>

            <div className="top-products-panel glass-card">
              <div className="section-header">
                <h3>Sản phẩm tồn nhiều nhất</h3>
              </div>
              <div className="top-products-list">
                {topProducts.map((item, idx) => (
                  <div key={item.id} className="top-product-item">
                    <div className="product-rank">{idx + 1}</div>
                    <div className="product-info">
                      <span className="product-name">{item.name}</span>
                      <span className="product-sku">{item.id}</span>
                    </div>
                    <div className="product-stock-pill">
                      {formatNumber(item.stock)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="right-column">
          <div className="alerts-panel glass-card highlighted">
            <div className="section-header">
              <div className="title-with-icon">
                <AlertTriangle size={20} color="#ef4444" />
                <h3>Cảnh báo tồn kho</h3>
              </div>
              <span className="badge-count red">{lowStockItems.length}</span>
            </div>
            <div className="alert-cards">
              {lowStockItems.slice(0, 4).map(item => {
                const supplier = suppliers.find(s => s.id === item.supplierId)
                return (
                  <div key={item.id} className="alert-mini-card critical">
                    <div className="alert-meta">
                      <span className="alert-item-name">{item.name}</span>
                      <span className="alert-sku">{item.id} • {supplier?.name || 'Vãng lai'}</span>
                    </div>
                    <div className="alert-status">
                      <span className="stock-num">{item.stock}</span>
                      <span className={`status-pill ${item.status.toLowerCase().replace(' ', '-')}`}>
                        {item.status === 'Out of Stock' ? 'Hết hàng' : 'Cần nhập'}
                      </span>
                    </div>
                  </div>
                )
              })}
              {lowStockItems.length === 0 && (
                <div className="empty-alerts">
                  <Package size={40} />
                  <p>Kho hàng hiện tại an toàn</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
