import { useState } from 'react'
import { Package, Plus, Search, Edit2, Trash2, X, AlertCircle, Save } from 'lucide-react'
import { useInventory } from '../hooks/useInventory'
import { useAuth } from '../hooks/useAuth'
import { formatCurrency } from '../utils/format'
import './Products.css'

const Products = () => {
  const { inventory, generateNextSku, addProduct, updateProduct, deleteProduct, suppliers } = useInventory()
  const { hasPermission } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add' or 'edit'
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})

  const canManage = hasPermission('approve_orders') // Assuming Managers/Admins can manage products

  const filteredInventory = inventory.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openAddModal = () => {
    setModalMode('add')
    setFormData({
      id: generateNextSku(),
      name: '',
      price: '',
      cost: '',
      supplierId: suppliers[0]?.id || '',
      stock: 0,
      status: 'Out of Stock'
    })
    setErrors({})
    setIsModalOpen(true)
  }

  const openEditModal = (product) => {
    setModalMode('edit')
    setFormData({ ...product })
    setErrors({})
    setIsModalOpen(true)
  }

  const handleCloseModal = () => setIsModalOpen(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (errors[name]) setErrors({ ...errors, [name]: null })
  }

  const handleSave = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = "Tên sản phẩm không được trống"
    if (!formData.price) newErrors.price = "Giá bán không được trống"
    if (!formData.cost) newErrors.cost = "Giá nhập không được trống"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    if (modalMode === 'add') {
      addProduct(formData)
    } else {
      updateProduct(formData.id, formData)
    }
    setIsModalOpen(false)
  }

  const handleDelete = (id, name) => {
    if (window.confirm(`Bạn có chắc muốn xóa vĩnh viễn sản phẩm ${name} (${id})?`)) {
      deleteProduct(id)
    }
  }

  return (
    <div className="products-container animate-fade-in">
      <header className="mb-8 flex justify-between items-end border-b border-light pb-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-secondary/20 rounded-xl text-secondary"><Package size={32} /></div>
            <div>
              <h1 className="text-3xl font-bold">Danh Mục Sản Phẩm</h1>
              <p className="text-muted">Quản lý Master Data: Thêm, sửa, xóa các SKU trong kho.</p>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="search-bar glass-card flex items-center px-4 py-2 gap-2 w-64">
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Tìm tên, mã SKU..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-main flex-1 w-full"
            />
          </div>
          {canManage && (
            <button className="btn-primary flex items-center gap-2" onClick={openAddModal}>
              <Plus size={18} /> Thêm Sản Phẩm Mới
            </button>
          )}
        </div>
      </header>

      <div className="products-grid">
        {filteredInventory.length === 0 ? (
          <div className="col-span-full pt-12 pb-24 text-center text-muted">
            <Package size={64} className="mx-auto mb-4 opacity-50" />
            <p className="text-xl">Không tìm thấy sản phẩm nào.</p>
          </div>
        ) : (
          filteredInventory.map(product => (
            <div key={product.id} className="product-card glass-card">
              <div className="product-card-header">
                <span className="sku-badge">{product.id}</span>
                {canManage && (
                  <div className="product-actions">
                    <button onClick={() => openEditModal(product)}><Edit2 size={16} /></button>
                    <button className="delete" onClick={() => handleDelete(product.id, product.name)}><Trash2 size={16} /></button>
                  </div>
                )}
              </div>
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <div className="text-xs text-muted mt-2 border-t border-light pt-2">
                  Kho hiện tại: <strong className={product.stock > 0 ? 'text-secondary font-bold text-lg inline-block ml-1' : 'text-error font-bold text-lg inline-block ml-1'}>{product.stock}</strong> cái
                </div>
              </div>
              <div className="product-meta">
                <div className="meta-item">
                  <span className="meta-label">Giá Nhập (Cost)</span>
                  <span className="meta-value opacity-70">{typeof product.cost === 'number' ? formatCurrency(product.cost, false) : product.cost || 'N/A'}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Giá Bán (Price)</span>
                  <span className="meta-value text-accent">{typeof product.price === 'number' ? formatCurrency(product.price, false) : product.price}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-content glass-card scale-up">
            <div className="modal-header">
              <h2 className="text-xl font-bold flex items-center gap-2">
                {modalMode === 'add' ? <><Plus size={20} className="text-primary"/> Thêm Sản Phẩm Mới</> : <><Edit2 size={20} className="text-secondary"/> Chỉnh sửa Sản Phẩm</>}
              </h2>
              <button className="modal-close" onClick={handleCloseModal}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full">
                  <label>Mã SKU (Tự động)</label>
                  <input type="text" className="form-input opacity-50 font-mono font-bold text-primary" value={formData.id} disabled />
                </div>
                <div className="form-group full">
                  <label>Tên Sản Phẩm <span className="text-error">*</span></label>
                  <input 
                    type="text" 
                    name="name"
                    className={`form-input ${errors.name ? 'error' : ''}`} 
                    placeholder="VD: Cáp Sạc Type-C 2M"
                    value={formData.name}
                    onChange={handleChange}
                  />
                  {errors.name && <span className="error-message"><AlertCircle size={14} /> {errors.name}</span>}
                </div>
                <div className="form-group">
                  <label>Giá Nhập Hàng <span className="text-error">*</span></label>
                  <input 
                    type="number" 
                    name="cost"
                    className={`form-input ${errors.cost ? 'error' : ''}`} 
                    placeholder="VD: 50000"
                    value={formData.cost}
                    onChange={handleChange}
                  />
                  {errors.cost && <span className="error-message"><AlertCircle size={14} /> {errors.cost}</span>}
                </div>
                <div className="form-group">
                  <label>Giá Bán Khách <span className="text-error">*</span></label>
                  <input 
                    type="number" 
                    name="price"
                    className={`form-input ${errors.price ? 'error' : ''}`} 
                    placeholder="VD: 150000"
                    value={formData.price}
                    onChange={handleChange}
                  />
                  {errors.price && <span className="error-message"><AlertCircle size={14} /> {errors.price}</span>}
                </div>
                <div className="form-group full">
                  <label>Nhà Cung Cấp Mặc Định</label>
                  <select 
                    name="supplierId" 
                    className="form-input"
                    value={formData.supplierId}
                    onChange={handleChange}
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id} className="bg-surface text-main">{s.name} ({s.id})</option>
                    ))}
                    <option value="" className="bg-surface text-main">Không có Nhà cung cấp</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={handleCloseModal}>Hủy bỏ</button>
              <button className="btn-primary flex items-center gap-2" onClick={handleSave}>
                <Save size={18} /> Lưu Sản Phẩm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Products
