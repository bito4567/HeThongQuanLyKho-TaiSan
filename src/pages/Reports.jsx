import { useState, useMemo } from 'react'
import { BarChart3, Package, TrendingUp, AlertTriangle, ArrowRight, ArrowDownLeft, ArrowUpRight, Download } from 'lucide-react'
import { useInventory } from '../hooks/useInventory'
import { formatCurrency, formatNumber } from '../utils/format'
import TransactionsChart from '../components/TransactionsChart'
import './Reports.css'

const Reports = () => {
  const { inventory, transactions } = useInventory()
  const [activeTab, setActiveTab] = useState('inventory')
  const [reportRange, setReportRange] = useState(7)

  // -- BÁO CÁO TỒN KHO METRICS --
  const totalValue = useMemo(() => {
    return inventory.reduce((sum, item) => {
      const price = parseInt(String(item.price || '0').replace(/[^0-9]/g, '')) || 0
      return sum + (price * item.stock)
    }, 0)
  }, [inventory])

  const lowStockCount = inventory.filter(i => i.stock > 0 && i.stock <= 10).length
  const outOfStockCount = inventory.filter(i => i.stock === 0).length

  // -- BÁO CÁO XUẤT NHẬP & TOP SẢN PHẨM --
  const topProducts = useMemo(() => {
    const productStats = {}
    
    transactions.forEach(t => {
      if (t.status === 'Pending' || t.status === 'Rejected') return
      if (t.type === 'OUTBOUND' && t.items) {
        t.items.forEach(item => {
          if (!productStats[item.id]) {
            productStats[item.id] = { id: item.id, name: item.name, outboundCount: 0, revenue: 0 }
          }
          const qty = parseInt(item.quantity) || 0
          const price = parseInt(item.outboundPrice) || 0
          productStats[item.id].outboundCount += qty
          productStats[item.id].revenue += (qty * price)
        })
      }
    })

    return Object.values(productStats)
      .sort((a, b) => b.outboundCount - a.outboundCount)
      .slice(0, 5)
  }, [transactions])

  const recentTransactions = [...transactions]
    .filter(t => t.status !== 'Pending' && t.status !== 'Rejected')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10)

  return (
    <div className="reports-container animate-fade-in">
      <header className="reports-header mb-8 flex justify-between items-end border-b border-light pb-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-xl"><BarChart3 size={32} /></div>
            <div>
              <h1 className="text-3xl font-bold">Báo Cáo & Thống Kê</h1>
              <p className="text-muted">Phân tích hiệu suất Tồn Kho và Nhập Xuất thời gian thực</p>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <select 
            className="glass-card px-4 py-2 border-none text-main outline-none cursor-pointer"
            value={reportRange}
            onChange={(e) => setReportRange(Number(e.target.value))}
          >
            <option value={7}>7 ngày qua</option>
            <option value={30}>30 ngày qua</option>
            <option value={90}>3 tháng qua</option>
          </select>
          <button className="btn-primary flex items-center gap-2">
            <Download size={18} /> Xuất PDF
          </button>
        </div>
      </header>

      <div className="reports-tabs flex gap-4 mb-8">
        <button 
          className={`report-tab ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <Package size={20} /> Báo cáo Tồn Kho
        </button>
        <button 
          className={`report-tab ${activeTab === 'inout' ? 'active' : ''}`}
          onClick={() => setActiveTab('inout')}
        >
          <TrendingUp size={20} /> Biểu đồ Nhập Xuất
        </button>
      </div>

      {activeTab === 'inventory' ? (
        <div className="tab-content animate-fade-in fade-up">
          {/* Top Metrics */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="glass-card stat-metric border-l-4" style={{ borderColor: 'var(--primary)' }}>
              <p className="text-muted text-sm uppercase font-bold mb-1">Tổng giá trị tồn kho</p>
              <h2 className="text-3xl font-bold text-main">{formatCurrency(totalValue, true)}</h2>
            </div>
            <div className="glass-card stat-metric border-l-4" style={{ borderColor: 'var(--accent)' }}>
              <p className="text-muted text-sm uppercase font-bold mb-1">Sắp hết hàng</p>
              <h2 className="text-3xl font-bold text-accent">{formatNumber(lowStockCount)} <span className="text-sm font-normal text-muted">mặt hàng</span></h2>
            </div>
            <div className="glass-card stat-metric border-l-4" style={{ borderColor: 'var(--error)' }}>
              <p className="text-muted text-sm uppercase font-bold mb-1">Đã hết hàng</p>
              <h2 className="text-3xl font-bold text-error">{formatNumber(outOfStockCount)} <span className="text-sm font-normal text-muted">mặt hàng</span></h2>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Chi tiết Giá trị Hàng Hóa</h3>
            </div>
            <div className="inventory-report-table overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-light text-muted uppercase text-xs">
                    <th className="py-4 px-4 font-bold">Mã SKU</th>
                    <th className="py-4 px-4 font-bold">Tên Sản Phẩm</th>
                    <th className="py-4 px-4 font-bold text-center">Tồn Kho</th>
                    <th className="py-4 px-4 font-bold text-right">Đơn Giá</th>
                    <th className="py-4 px-4 font-bold text-right">Tổng Giá Trị</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.slice().sort((a,b) => b.stock - a.stock).map(item => {
                    const price = parseInt(String(item.price || '0').replace(/[^0-9]/g, '')) || 0
                    const itemValue = price * item.stock
                    return (
                      <tr key={item.id} className="border-b border-light/50 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4 font-mono text-primary text-sm font-bold">{item.id}</td>
                        <td className="py-4 px-4 font-bold">{item.name}</td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.stock === 0 ? 'bg-error/20 text-error' : item.stock <= 10 ? 'bg-accent/20 text-accent' : 'bg-secondary/20 text-secondary'}`}>
                            {formatNumber(item.stock)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right opacity-80">{formatCurrency(price, false)}</td>
                        <td className="py-4 px-4 text-right font-bold text-main">{formatCurrency(itemValue, false)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="tab-content animate-fade-in fade-up">
          <div className="grid grid-cols-[2fr_1fr] gap-6">
            {/* Chart Column */}
            <div className="flex flex-col gap-6">
              <div className="glass-card p-6 flex-1 min-h-[450px]">
                <h3 className="text-xl font-bold mb-2">Biểu đồ Nhập/Xuất</h3>
                <p className="text-muted text-sm mb-6">So sánh lưu lượng vào và ra của kho hàng trong {reportRange} ngày qua.</p>
                <TransactionsChart transactions={transactions} days={reportRange} />
              </div>

              <div className="glass-card p-6">
                <div className="flex justify-between items-center border-b border-light pb-4 mb-4">
                  <h3 className="text-xl font-bold">Top Xuất Kho (Bán Chạy)</h3>
                </div>
                {topProducts.length === 0 ? (
                  <p className="text-muted text-center py-4">Chưa có dữ liệu xuất kho</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {topProducts.map((p, i) => (
                      <div key={p.id} className="flex justify-between items-center p-3 rounded-xl hover:bg-white/5 border border-light/30">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-sm">
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-bold">{p.name}</p>
                            <p className="text-xs font-mono text-muted">{p.id}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-accent">{formatNumber(p.outboundCount)} <span className="text-xs font-normal text-muted">đã xuất</span></p>
                          <p className="text-xs text-muted">{formatCurrency(p.revenue, false)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Column */}
            <div className="flex flex-col gap-6">
              <div className="glass-card p-6 h-full">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-light pb-4">
                  <ArrowRight size={20} className="text-primary" /> Log Giao Dịch
                </h3>
                
                <div className="flex flex-col gap-4 overflow-y-auto max-h-[700px] pr-2 custom-scrollbar">
                  {recentTransactions.length === 0 ? (
                    <p className="text-muted text-center py-4">Không có giao dịch</p>
                  ) : (
                    recentTransactions.map(tx => (
                      <div key={tx.id} className="border-l-2 border-primary pl-4 py-2 relative">
                        <div className="absolute -left-[9px] top-4 w-4 h-4 rounded-full bg-surface border-2 border-primary"></div>
                        <p className="text-xs text-muted mb-1">{new Date(tx.timestamp).toLocaleString('vi-VN')}</p>
                        <p className="font-bold font-mono text-sm mb-1">{tx.id}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {tx.type === 'INBOUND' ? (
                            <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-secondary/20 text-secondary font-bold">
                              <ArrowDownLeft size={14} /> Nhập: {formatNumber(tx.totalQuantity || 0)}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-accent/20 text-accent font-bold">
                              <ArrowUpRight size={14} /> Xuất: {formatNumber(tx.totalQuantity || 0)}
                            </span>
                          )}
                          <span className="text-xs text-muted">({tx.totalItems || 0} mục)</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reports
