import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import './ProductModal.css'

const ProductModal = ({ isOpen, onClose, onSave, product, suppliers = [] }) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    category: '',
    supplierId: '',
    arrivalDate: new Date().toISOString().split('T')[0],
    stock: 0,
    price: '',
    status: 'In Stock'
  })

  useEffect(() => {
    if (product) {
      setFormData({
        id: product.id || '',
        name: product.name || '',
        category: product.category || '',
        supplierId: product.supplierId || '',
        arrivalDate: product.arrivalDate || new Date().toISOString().split('T')[0],
        stock: product.stock || 0,
        price: product.price || '',
        status: product.status || 'In Stock',
        isNew: product.isNew
      })
    } else {
      setFormData({
        id: '',
        name: '',
        category: '',
        supplierId: '',
        arrivalDate: new Date().toISOString().split('T')[0],
        stock: 0,
        price: '',
        status: 'In Stock'
      })
    }
  }, [product, isOpen])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'stock' ? parseInt(value) || 0 : value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Simple status auto-update based on stock
    let status = 'In Stock'
    if (formData.stock <= 0) status = 'Out of Stock'
    else if (formData.stock <= 10) status = 'Low Stock'
    
    onSave({ ...formData, status })
    onClose()
  }

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="modal-content glass-card animate-slide-up">
        <header className="modal-header">
          <h2>{product && !product.isNew ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="id">Mã SKU</label>
              <input
                type="text"
                id="id"
                name="id"
                value={formData.id}
                onChange={handleChange}
                placeholder="PRO001"
                required
                disabled={!!product && !product.isNew}
              />
            </div>
            <div className="form-group">
              <label htmlFor="name">Tên sản phẩm</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Laptop Dell XPS 15"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="category">Danh mục</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Chọn danh mục</option>
                <option value="Laptops">Laptops</option>
                <option value="Phones">Phones</option>
                <option value="Audio">Audio</option>
                <option value="Accessories">Accessories</option>
                <option value="Other">Khác</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="supplierId">Nhà cung cấp</label>
              <select
                id="supplierId"
                name="supplierId"
                value={formData.supplierId}
                onChange={handleChange}
                required
              >
                <option value="">Chọn nhà cung cấp</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="arrivalDate">Ngày nhập kho</label>
              <input
                type="date"
                id="arrivalDate"
                name="arrivalDate"
                value={formData.arrivalDate}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="stock">Số lượng tồn kho</label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="price">Đơn giá</label>
              <input
                type="text"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="35,000,000 ₫"
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              {product && !product.isNew ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProductModal
