import { useState, useEffect } from 'react'
import { ArrowDownLeft, Save, X, Package, Search, Plus, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useInventory } from '../hooks/useInventory'
import { useAuth } from '../hooks/useAuth'
import { MOCK_SUPPLIERS, INBOUND_TYPES } from '../utils/mockData'
import './Inbound.css'
import './Transactions.css'

const Inbound = () => {
  const { inventory, updateStock, addTransaction } = useInventory()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  // Form State
  const [voucherData, setVoucherData] = useState({
    id: `PNK-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    type: 'MUA_HANG',
    supplierId: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    status: 'Draft',
    createdBy: user?.name || 'Unknown'
  })

  const [selectedProducts, setSelectedProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [errors, setErrors] = useState({})

  // Step 1 & 2 logic
  const handleVoucherChange = (e) => {
    const { name, value } = e.target
    setVoucherData({ ...voucherData, [name]: value })
  }

  // Step 3 logic: Product Search
  const filteredInventory = inventory.filter(item => 
    !selectedProducts.find(p => p.id === item.id) &&
    (item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     item.id.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const addProduct = (product) => {
    setSelectedProducts([...selectedProducts, { 
      ...product, 
      quantity: 1, 
      inboundPrice: parseInt(product.price.replace(/[^0-9]/g, '')) || 0 
    }])
    setSearchTerm('')
  }

  const removeProduct = (id) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== id))
  }

  const updateProductInput = (id, field, value) => {
    setSelectedProducts(selectedProducts.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ))
  }

  // Step 5 logic: Validation
  const validateData = () => {
    const newErrors = {}
    if (selectedProducts.length === 0) newErrors.products = "Phải có ít nhất 1 sản phẩm"
    
    selectedProducts.forEach(p => {
      if (p.quantity <= 0) newErrors[`qty_${p.id}`] = "Số lượng phải lớn hơn 0"
      if (p.inboundPrice < 0) newErrors[`price_${p.id}`] = "Giá không được âm"
    })

    if (!voucherData.supplierId) newErrors.supplier = "Vui lòng chọn nhà cung cấp"
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Step 6-9 Logic: CORE Update
  const processInbound = async () => {
    setLoading(true)
    setStep(6) // Switching to processing state
    
    // Simulate steps 6-9
    setTimeout(() => {
      // Step 6: Status -> Confirmed
      const finalVoucher = { ...voucherData, status: 'Confirmed' }

      // Step 7: Update Inventory (CORE)
      selectedProducts.forEach(product => {
        updateStock(product.id, parseInt(product.quantity))
      })

      // Step 8 & 9: Save Details & History
      addTransaction({
        ...finalVoucher,
        items: selectedProducts,
        totalItems: selectedProducts.length,
        totalQuantity: selectedProducts.reduce((sum, p) => sum + parseInt(p.quantity), 0)
      })

      setLoading(false)
      setStep(10) // Step 10: Complete
    }, 2000)
  }

  const nextStep = () => {
    if (step === 2 && !voucherData.supplierId) {
       alert("Vui lòng chọn nhà cung cấp")
       return
    }
    if (step === 4 && !validateData()) return
    setStep(step + 1)
  }

  const prevStep = () => setStep(step - 1)

  const renderStepUI = () => {
    switch(step) {
      case 1:
        return (
          <div className="step-content glass-card animate-fade-in">
            <h3>🔹 Bước 1: Tạo phiếu nhập</h3>
            <div className="form-grid" style={{ marginTop: '1.5rem' }}>
              <div className="form-group">
                <label>Mã phiếu (Tự động)</label>
                <input type="text" value={voucherData.id} readOnly />
              </div>
              <div className="form-group">
                <label>Loại nhập kho</label>
                <select name="type" value={voucherData.type} onChange={handleVoucherChange}>
                  {INBOUND_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-primary" onClick={nextStep}>Tiếp theo</button>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="step-content glass-card animate-fade-in">
            <h3>🔹 Bước 2: Thông tin chung</h3>
            <div className="form-grid" style={{ marginTop: '1.5rem' }}>
              <div className="form-group">
                <label>Nhà cung cấp</label>
                <select name="supplierId" value={voucherData.supplierId} onChange={handleVoucherChange}>
                  <option value="">-- Chọn nhà cung cấp --</option>
                  {MOCK_SUPPLIERS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Ngày nhập</label>
                <input type="date" name="date" value={voucherData.date} onChange={handleVoucherChange} />
              </div>
              <div className="form-group">
                <label>Người nhập</label>
                <input type="text" value={voucherData.createdBy} readOnly />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={prevStep}>Quay lại</button>
              <button className="btn-primary" onClick={nextStep}>Tiếp theo</button>
            </div>
          </div>
        )
      case 3:
      case 4:
        return (
          <div className="step-content glass-card animate-fade-in">
            <h3>🔹 Bước {step === 3 ? '3: Thêm sản phẩm' : '4: Nhập số lượng & giá'}</h3>
            
            <div className="product-selector">
              <div className="search-bar glass-card" style={{ marginBottom: '1rem' }}>
                <Search size={18} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Tìm sản phẩm theo tên hoặc SKU..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {searchTerm && filteredInventory.length > 0 && (
                <div className="search-results glass-card">
                  {filteredInventory.map(item => (
                    <div key={item.id} className="search-item" onClick={() => addProduct(item)}>
                      <span>{item.id} - {item.name}</span>
                      <Plus size={16} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="selected-products-list">
              <h4>Danh sách sản phẩm nhập</h4>
              {selectedProducts.length === 0 ? (
                <p style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>Chưa có sản phẩm nào được chọn</p>
              ) : (
                <div className="product-table-header product-row" style={{ fontWeight: 700, opacity: 0.7 }}>
                  <div>Sản phẩm</div>
                  <div>Tồn kho</div>
                  <div>Số lượng</div>
                  <div>Giá nhập</div>
                  <div></div>
                </div>
              )}
              {selectedProducts.map(p => (
                <div key={p.id} className="product-row animate-slide-in">
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{p.id}</div>
                  </div>
                  <div>{p.stock}</div>
                  <div>
                    <input 
                      type="number" 
                      value={p.quantity} 
                      onChange={(e) => updateProductInput(p.id, 'quantity', e.target.value)}
                      min="1"
                    />
                  </div>
                  <div>
                    <input 
                      type="number" 
                      value={p.inboundPrice} 
                      onChange={(e) => updateProductInput(p.id, 'inboundPrice', e.target.value)}
                    />
                  </div>
                  <button className="icon-btn delete" onClick={() => removeProduct(p.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="form-actions">
              <button className="btn-secondary" onClick={prevStep}>Quay lại</button>
              <button className="btn-primary" onClick={nextStep} disabled={selectedProducts.length === 0}>
                Tiếp theo
              </button>
            </div>
          </div>
        )
      case 5:
        return (
          <div className="step-content glass-card animate-fade-in">
            <h3>🔹 Bước 5: Kiểm tra dữ liệu</h3>
            <div className="verification-list" style={{ marginTop: '1.5rem' }}>
              <div className={`verification-item ${Object.keys(errors).length === 0 ? 'success' : 'error'}`}>
                {Object.keys(errors).length === 0 ? <CheckCircle color="var(--secondary)" /> : <AlertCircle color="var(--error)" />}
               <div>
                  <div style={{ fontWeight: 600 }}>Kiểm tra số lượng và giá</div>
                  <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                    {Object.keys(errors).length === 0 ? "Tất cả dữ liệu hợp lệ." : "Vui lòng kiểm tra lại số lượng (không được <= 0) và giá nhập."}
                  </p>
               </div>
              </div>
              <div className="verification-item success">
                <CheckCircle color="var(--secondary)" />
                <div>
                  <div style={{ fontWeight: 600 }}>Kiểm tra sản phẩm tồn tại</div>
                  <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>Tất cả sản phẩm đã được xác thực trong hệ thống.</p>
                </div>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={prevStep}>Quay lại</button>
              <button className="btn-primary" onClick={processInbound} disabled={Object.keys(errors).length > 0}>
                Xác nhận hoàn tất
              </button>
            </div>
          </div>
        )
      case 6:
      case 7:
      case 8:
      case 9:
        return (
          <div className="processing-view glass-card animate-fade-in">
            <Loader2 size={48} className="animate-spin" style={{ margin: '0 auto 1.5rem', color: 'var(--primary)' }} />
            <h3>Đang xử lý nhập kho...</h3>
            <p style={{ marginTop: '1rem', opacity: 0.7 }}>
              {step === 6 && "Đang xác nhận trạng thái phiếu..."}
              {step === 7 && "Đang cập nhật tồn kho (CORE)..."}
              {step === 8 && "Đang lưu chi tiết sản phẩm..."}
              {step === 9 && "Đang ghi nhật ký lịch sử..."}
            </p>
          </div>
        )
      case 10:
        return (
          <div className="success-view glass-card animate-fade-in">
            <div className="success-icon"><CheckCircle size={40} /></div>
            <h2 className="text-gradient">Nhập kho hoàn thành!</h2>
            <p style={{ margin: '1rem 0 2rem', opacity: 0.8 }}>
              Mã phiếu <strong>{voucherData.id}</strong> đã được xử lý thành công. <br/>
              Tồn kho đã được cập nhật.
            </p>
            <div className="form-actions" style={{ justifyContent: 'center' }}>
              <button className="btn-primary" onClick={() => window.location.reload()}>
                Tạo phiếu mới
              </button>
            </div>
          </div>
        )
      default: return null
    }
  }

  return (
    <div className="transaction-container animate-fade-in">
      <header className="transaction-header">
        <div className="header-title">
          <div className="icon-circle inbound"><ArrowDownLeft size={24} /></div>
          <div>
            <h1 className="text-gradient">Quy trình nhập kho</h1>
            <p className="subtitle">Tuân thủ luồng nghiệp vụ 10 bước</p>
          </div>
        </div>
      </header>

      <div className="inbound-steps">
        {[1, 2, 3, 4, 5, 10].map(s => (
          <div key={s} className={`step-item ${step === s ? 'active' : ''} ${step > s ? 'completed' : ''}`}>
            <div className="step-number">{s === 10 ? '✔' : s}</div>
            <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>
              {s === 1 ? 'Khởi tạo' : 
               s === 2 ? 'Thông tin' : 
               s === 3 ? 'Sản phẩm' : 
               s === 4 ? 'Số lượng' : 
               s === 5 ? 'Kiểm tra' : 'Hoàn thành'}
            </span>
          </div>
        ))}
      </div>

      {renderStepUI()}
    </div>
  )
}

export default Inbound
