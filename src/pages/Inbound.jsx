import { useState } from 'react'
import { ArrowDownLeft, Save, X, Package } from 'lucide-react'
import './Transactions.css'

const Inbound = () => {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    quantity: '',
    supplier: '',
    notes: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    alert(`Đã ghi nhận nhập kho: ${formData.quantity} ${formData.name}`)
    setFormData({ sku: '', name: '', quantity: '', supplier: '', notes: '' })
  }

  return (
    <div className="transaction-container animate-fade-in">
      <header className="transaction-header">
        <div className="header-title">
          <div className="icon-circle inbound"><ArrowDownLeft size={24} /></div>
          <div>
            <h1 className="text-gradient">Nhập kho mới</h1>
            <p className="subtitle">Ghi nhận hàng hóa chuyển vào kho</p>
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
            <label>Số lượng nhập</label>
            <input 
              type="number" 
              placeholder="0" 
              value={formData.quantity}
              onChange={e => setFormData({...formData, quantity: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Nhà cung cấp</label>
            <input 
              type="text" 
              placeholder="Tên nhà cung cấp..." 
              value={formData.supplier}
              onChange={e => setFormData({...formData, supplier: e.target.value})}
            />
          </div>

          <div className="form-group full-width">
            <label>Ghi chú</label>
            <textarea 
              placeholder="Thông tin thêm về lô hàng..." 
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
          <button type="submit" className="btn-primary">
            <Save size={18} />
            <span>Xác nhận nhập kho</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export default Inbound
