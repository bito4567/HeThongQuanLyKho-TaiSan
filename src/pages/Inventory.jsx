import { useState } from 'react'
import { Search, Filter, Plus, Edit, Trash2 } from 'lucide-react'
import { useInventory } from '../hooks/useInventory'
import './Inventory.css'

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const { inventory, loading } = useInventory()

  if (loading) return <div>Đang tải dữ liệu...</div>

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusClass = (status) => {
    switch (status) {
      case 'In Stock': return 'status-in-stock';
      case 'Low Stock': return 'status-low-stock';
      case 'Out of Stock': return 'status-out-of-stock';
      default: return '';
    }
  }

  return (
    <div className="inventory-container animate-fade-in">
      <header className="inventory-header">
        <h1 className="text-gradient">Danh mục sản phẩm</h1>
        <div className="inventory-actions">
          <div className="search-bar glass-card">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Tìm kiếm sản phẩm, mã SKU..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-secondary glass-card">
            <Filter size={18} />
            <span>Lọc</span>
          </button>
          <button className="btn-primary">
            <Plus size={18} />
            <span>Thêm sản phẩm</span>
          </button>
        </div>
      </header>

      <div className="inventory-table-wrapper glass-card">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Mã SKU</th>
              <th>Tên sản phẩm</th>
              <th>Danh mục</th>
              <th>Tồn kho</th>
              <th>Đơn giá</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map((item) => (
              <tr key={item.id}>
                <td className="sku-cell">{item.id}</td>
                <td className="name-cell">{item.name}</td>
                <td>{item.category}</td>
                <td className="stock-cell">{item.stock}</td>
                <td>{item.price}</td>
                <td>
                  <span className={`status-badge ${getStatusClass(item.status)}`}>
                    {item.status}
                  </span>
                </td>
                <td className="actions-cell">
                  <button className="icon-btn"><Edit size={16} /></button>
                  <button className="icon-btn delete"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredInventory.length === 0 && (
          <div className="no-results">
            <p>Không tìm thấy sản phẩm nào khớp với "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Inventory
