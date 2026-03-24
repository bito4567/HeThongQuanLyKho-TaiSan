import { useState } from 'react'
import { Search, Filter, Plus, Edit, Trash2 } from 'lucide-react'
import { useInventory } from '../hooks/useInventory'
import { useAuth } from '../hooks/useAuth'
import { formatCurrency, formatNumber } from '../utils/format'
import ProductModal from '../components/ProductModal'
import './Inventory.css'

const Inventory = () => {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    supplierId: '',
    minPrice: '',
    maxPrice: '',
    startDate: '',
    endDate: ''
  })
  const [sortBy, setSortBy] = useState('name-asc')
  
  const { inventory, loading, suppliers, addProduct, updateProduct, deleteProduct, generateNextSku } = useInventory()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)

  if (loading) return <div>Đang tải dữ liệu...</div>

  const canAdd = user?.role === 'admin' || user?.role === 'manager'
  const canEdit = user?.role === 'admin' || user?.role === 'manager'
  const canDelete = user?.role === 'admin'

  const parsePrice = (priceStr) => {
    if (typeof priceStr === 'number') return priceStr
    if (!priceStr) return 0
    return parseInt(String(priceStr).replace(/[^0-9]/g, '')) || 0
  }

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSupplier = !filters.supplierId || item.supplierId === filters.supplierId
    
    const itemPrice = parsePrice(item.price)
    const matchesMinPrice = !filters.minPrice || itemPrice >= parseInt(filters.minPrice)
    const matchesMaxPrice = !filters.maxPrice || itemPrice <= parseInt(filters.maxPrice)
    
    const itemDate = item.arrivalDate || ''
    const matchesStartDate = !filters.startDate || itemDate >= filters.startDate
    const matchesEndDate = !filters.endDate || itemDate <= filters.endDate
    
    return matchesSearch && matchesSupplier && matchesMinPrice && matchesMaxPrice && matchesStartDate && matchesEndDate
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price-asc': return parsePrice(a.price) - parsePrice(b.price);
      case 'price-desc': return parsePrice(b.price) - parsePrice(a.price);
      case 'stock-asc': return a.stock - b.stock;
      case 'stock-desc': return b.stock - a.stock;
      case 'name-asc': return a.name.localeCompare(b.name);
      default: return 0;
    }
  })

  const getStatusClass = (status) => {
    switch (status) {
      case 'In Stock': return 'status-in-stock';
      case 'Low Stock': return 'status-low-stock';
      case 'Out of Stock': return 'status-out-of-stock';
      default: return '';
    }
  }

  const handleAddProduct = () => {
    const nextSku = generateNextSku()
    setEditingProduct({ id: nextSku, name: '', category: '', stock: 0, price: '', status: 'In Stock', isNew: true })
    setIsModalOpen(true)
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setIsModalOpen(true)
  }

  const handleDeleteProduct = (sku) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này không?')) {
      deleteProduct(sku)
    }
  }

  const handleSaveProduct = (productData) => {
    if (editingProduct && !editingProduct.isNew) {
      updateProduct(editingProduct.id, productData)
    } else {
      addProduct(productData)
    }
    setIsModalOpen(false)
  }

  const resetFilters = () => {
    setFilters({
      supplierId: '',
      minPrice: '',
      maxPrice: '',
      startDate: '',
      endDate: ''
    })
    setSearchTerm('')
    setSortBy('name-asc')
  }

  return (
    <div className="inventory-container animate-fade-in">
      <header className="inventory-header">
        <h1 className="text-gradient">Danh mục sản phẩm</h1>
        <div className="inventory-actions">
          <div className="search-bar glass-card flex-1 max-w-md">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Tìm kiếm mã SKU, tên SP..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {canAdd && (
            <button className="btn-primary" onClick={handleAddProduct}>
              <Plus size={18} />
              <span>Thêm sản phẩm</span>
            </button>
          )}
        </div>
      </header>

      <div className="filter-controls-wrapper glass-card">
        <div className="filter-row">
          <div className="filter-group">
            <label>Nhà cung cấp</label>
            <select 
              value={filters.supplierId} 
              onChange={(e) => setFilters({...filters, supplierId: e.target.value})}
            >
              <option value="">Tất cả nhà cung cấp</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Khoảng giá (₫)</label>
            <div className="range-inputs">
              <input 
                type="number" 
                placeholder="Từ" 
                value={filters.minPrice} 
                onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
              />
              <span>-</span>
              <input 
                type="number" 
                placeholder="Đến" 
                value={filters.maxPrice} 
                onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
              />
            </div>
          </div>
          <div className="filter-group">
            <label>Ngày nhập</label>
            <div className="range-inputs">
              <input 
                type="date" 
                value={filters.startDate} 
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              />
              <input 
                type="date" 
                value={filters.endDate} 
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              />
            </div>
          </div>
          <div className="filter-group">
            <label>Sắp xếp</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name-asc">Tên (A-Z)</option>
              <option value="price-asc">Giá: Thấp đến Cao</option>
              <option value="price-desc">Giá: Cao đến Thấp</option>
              <option value="stock-asc">Tồn kho: Thấp đến Cao</option>
              <option value="stock-desc">Tồn kho: Cao đến Thấp</option>
            </select>
          </div>
          <button className="reset-btn" onClick={resetFilters}>Xóa lọc</button>
        </div>
      </div>

        <div className="inventory-table-wrapper glass-card p-6 min-h-[500px]">
          <table className="inventory-table w-full text-left">
            <thead>
              <tr className="border-b border-light pb-4 uppercase text-xs text-muted tracking-wider">
                <th className="py-4 px-4 font-bold">Mã SKU</th>
                <th className="py-4 px-4 font-bold">Tên sản phẩm</th>
                <th className="py-4 px-4 text-center font-bold">Trạng thái</th>
                <th className="py-4 px-4 text-right font-bold">Số lượng tồn</th>
                <th className="py-4 px-4 text-right font-bold w-[150px]">Đơn giá</th>
                <th className="py-4 px-4 text-right font-bold w-[150px]">Tổng trị giá</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => {
                const price = typeof item.price === 'string' ? parseInt(item.price.replace(/[^0-9]/g, '')) || 0 : item.price;
                const value = price * item.stock;
                
                return (
                  <tr key={item.id} className="border-b border-light/30 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 sku-cell font-mono text-primary text-sm">{item.id}</td>
                    <td className="py-4 px-4 name-cell font-bold text-main">{item.name}</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`status-badge ${item.status.toLowerCase().replace(' ', '-')}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 stock-cell text-right font-bold text-lg font-mono opacity-90">{formatNumber(item.stock)}</td>
                    <td className="py-4 px-4 text-right text-muted">{item.price}</td>
                    <td className="py-4 px-4 text-right font-bold text-main">{formatCurrency(value, false)}</td>
                  </tr>
                )}
              )}
            </tbody>
          </table>
          {filteredInventory.length === 0 && (
            <div className="py-12 text-center text-muted">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <p>Không tìm thấy sản phẩm nào trong kho.</p>
            </div>
          )}
        </div>
        {/* The original no-results div is removed as it's now handled inside the table wrapper */}

      <ProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveProduct}
        product={editingProduct}
        suppliers={suppliers}
      />
    </div>
  )
}

export default Inventory
