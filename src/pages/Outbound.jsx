import { useState } from 'react'
import { ArrowUpRight, Save, X, Package, User } from 'lucide-react'
import './Transactions.css'

const Outbound = () => {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    quantity: '',
    recipient: '',
    notes: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    alert(`Đã ghi nhận xuất kho: ${formData.quantity} ${formData.name}`)
    setFormData({ sku: '', name: '', quantity: '', recipient: '', notes: '' })
  }

  return (
    <div className="transaction-container animate-fade-in">
      <header className="transaction-header">
        <div className="header-title">
          <div className="icon-circle outbound"><ArrowUpRight size={24} /></div>
          <div>
            <h1 className="text-gradient">Xuất kho hàng</h1>
            <p className="subtitle">Ghi nhận hàng hóa rời khỏi kho</p>
          </div>
        </div>
      </header>

      <form className="transaction-form glass-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>Mã SKU / Barcode</label>
            <div className="input-with-icon">
              <Package size={18} />
              <input 
                type="text" 
                placeholder="PRO001" 
                value={formData.sku}
                onChange={e => setFormData({...formData, sku: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div className="form-group focus">
            <label>Tên sản phẩm</label>
            <input 
              type="text" 
              placeholder="Nhập tên sản phẩm..." 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Số lượng xuất</label>
            <input 
              type="number" 
              placeholder="0" 
              value={formData.quantity}
              onChange={e => setFormData({...formData, quantity: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Người nhận / Khách hàng</label>
            <div className="input-with-icon">
              <User size={18} />
              <input 
                type="text" 
                placeholder="Tên khách hàng..." 
                value={formData.recipient}
                onChange={e => setFormData({...formData, recipient: e.target.value})}
              />
            </div>
          </div>

          <div className="form-group full-width">
            <label>Ghi chú</label>
            <textarea 
              placeholder="Lý do xuất kho (Bán lẻ, BH, Tiêu hủy...)" 
              rows="3"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            ></textarea>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary glass-card">
            <X size={18} />
            <span>Hủy bỏ</span>
          </button>
          <button type="submit" className="btn-primary" style={{ background: 'var(--accent)' }}>
            <Save size={18} />
            <span>Xác nhận xuất kho</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export default Outbound
