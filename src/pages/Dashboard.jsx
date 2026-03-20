import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  Clock 
} from 'lucide-react'
import InventoryChart from '../components/InventoryChart'
import './Dashboard.css'

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="stat-card glass-card animate-fade-in">
    <div className="stat-card-inner">
      <div className="stat-content">
        <span className="stat-title">{title}</span>
        <h2 className="stat-value">{value}</h2>
        {trend && (
          <div className="stat-trend">
            <TrendingUp size={14} />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className="stat-icon-wrapper" style={{ backgroundColor: `${color}15`, color: color }}>
        <Icon size={24} />
      </div>
    </div>
  </div>
)

const Dashboard = () => {
  const stats = [
    { title: 'Tổng kho hàng', value: '1,284', icon: Package, color: '#3b82f6', trend: '+12% tháng này' },
    { title: 'Giá trị tồn kho', value: '420M ₫', icon: TrendingUp, color: '#10b981', trend: '+5.2% tháng này' },
    { title: 'Sắp hết hàng', value: '12', icon: AlertTriangle, color: '#f59e0b', trend: 'Cần nhập gấp' },
    { title: 'Đơn chờ xử lý', value: '48', icon: Clock, color: '#8b5cf6', trend: 'Tăng 8% hôm nay' },
  ]

  const recentActivities = [
    { id: 1, action: 'Nhập kho', item: 'Laptop Dell XPS 15', quantity: '+10', time: '10 phút trước', status: 'success' },
    { id: 2, action: 'Xuất kho', item: 'Màn hình LG 27GL850', quantity: '-5', time: '35 phút trước', status: 'error' },
    { id: 3, action: 'Cập nhật', item: 'Bàn phím Akko 3098B', quantity: 'Thay đổi giá', time: '1 giờ trước', status: 'info' },
  ]

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1 className="text-gradient">Tổng quan Kho</h1>
          <p className="subtitle">Chào mừng trở lại! Đây là tình trạng kho hàng hiện tại.</p>
        </div>
        <button className="btn-primary">Tải báo cáo</button>
      </header>

      <section className="stats-grid">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </section>

      <div className="dashboard-grid">
        <section className="inventory-trends glass-card" style={{ gridColumn: 'span 1' }}>
          <div className="section-header">
            <h3>Xu hướng nhập/xuất</h3>
          </div>
          <InventoryChart />
        </section>

        <section className="recent-activity glass-card">
          <div className="section-header">
            <h3>Hoạt động gần đây</h3>
            <button className="text-btn">Xem tất cả</button>
          </div>
          <div className="activity-list">
            {recentActivities.map(activity => (
              <div key={activity.id} className="activity-item">
                <div className={`status-dot ${activity.status}`}></div>
                <div className="activity-info">
                  <span className="activity-action">{activity.action}</span>
                  <span className="activity-item-name">{activity.item}</span>
                </div>
                <div className="activity-meta">
                  <span className="activity-qty">{activity.quantity}</span>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="low-stock glass-card">
          <div className="section-header">
            <h3>Cảnh báo tồn kho thấp</h3>
          </div>
          <div className="stock-alert-placeholder">
            <AlertTriangle color="var(--accent)" size={48} />
            <p>Tất cả sản phẩm hiện đang ở mức an toàn.</p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Dashboard
