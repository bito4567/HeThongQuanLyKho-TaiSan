import { useState, useEffect, useRef } from 'react'
import { ArrowDownLeft, Save, X, Package, Search, Plus, Trash2, CheckCircle, AlertCircle, Loader2, ArrowRight, ArrowLeft, RefreshCw, ClipboardList, Calendar, MapPin, Edit3 } from 'lucide-react'
import { useInventory } from '../hooks/useInventory'
import { useAuth } from '../hooks/useAuth'
import { MOCK_SUPPLIERS, INBOUND_TYPES } from '../utils/mockData'
import { formatCurrency, formatNumber } from '../utils/format'
import './Inbound.css'

const Inbound = () => {
  const { inventory, updateStock, addTransaction, transactions } = useInventory()
  const { user } = useAuth()
  
  // Use a ref to prevent infinite render loops with local storage
  const initialized = useRef(false)

  // Generate ID based on date and transaction count (e.g. PNK-20260323-001)
  const generateId = () => {
    const today = new Date()
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
    
    // In a real app, this would query backend for today's sequence. For now, we mock a sequence.
    const todaysTransactions = transactions ? transactions.filter(t => t.id?.includes(dateStr)) : []
    const sequence = String(todaysTransactions.length + 1).padStart(3, '0')
    return `PNK-${dateStr}-${sequence}`
  }

  // Initial State Data
  const getInitialVoucherData = () => {
    const saved = localStorage.getItem('inboundDraft_voucher')
    if (saved) return JSON.parse(saved)
    return {
      id: generateId(),
      type: 'MUA_HANG',
      supplierId: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      status: 'Draft',
      createdBy: user?.name || 'Admin'
    }
  }

  const getInitialProducts = () => {
    const saved = localStorage.getItem('inboundDraft_products')
    if (saved) return JSON.parse(saved)
    return []
  }

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [voucherData, setVoucherData] = useState(getInitialVoucherData())
  const [selectedProducts, setSelectedProducts] = useState(getInitialProducts())
  const [searchTerm, setSearchTerm] = useState('')
  const [errors, setErrors] = useState({})

  // Persistence logic
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      return
    }
    // Only save draft if user has made meaningful changes (e.g., selected a supplier or added products)
    if (voucherData.supplierId || selectedProducts.length > 0 || voucherData.notes) {
      localStorage.setItem('inboundDraft_voucher', JSON.stringify(voucherData))
      localStorage.setItem('inboundDraft_products', JSON.stringify(selectedProducts))
    }
  }, [voucherData, selectedProducts])

  const clearDraft = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa nháp và làm lại từ đầu?")) {
      localStorage.removeItem('inboundDraft_voucher')
      localStorage.removeItem('inboundDraft_products')
      setVoucherData({
        id: generateId(),
        type: 'MUA_HANG',
        supplierId: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        status: 'Draft',
        createdBy: user?.name || 'Admin'
      })
      setSelectedProducts([])
      setStep(1)
      setErrors({})
    }
  }

  const handleVoucherChange = (e) => {
    const { name, value } = e.target
    setVoucherData({ ...voucherData, [name]: value })
    if (errors[name]) {
      setErrors({ ...errors, [name]: null })
    }
  }

  const filteredInventory = inventory.filter(item => 
    !selectedProducts.find(p => p.id === item.id) &&
    (item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     item.id.toLowerCase().includes(searchTerm.toLowerCase()))
  ).slice(0, 10) // Limit results for UI performance

  const addProduct = (product) => {
    setSelectedProducts([...selectedProducts, { 
      ...product, 
      quantity: 1, 
      inboundPrice: parseInt(String(product.price).replace(/[^0-9]/g, '')) || 0 
    }])
    setSearchTerm('')
    if (errors.products) setErrors({ ...errors, products: null })
  }

  const removeProduct = (id) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== id))
  }

  const updateProductInput = (id, field, value) => {
    setSelectedProducts(selectedProducts.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ))
  }

  // Step Validation Logic
  const validateStep1 = () => {
    const newErrors = {}
    if (!voucherData.type) newErrors.type = "Vui lòng chọn loại nhập kho"
    if (!voucherData.supplierId) newErrors.supplierId = "Vui lòng chọn nhà cung cấp"
    if (!voucherData.date) newErrors.date = "Vui lòng chọn ngày lập"
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors = {}
    if (selectedProducts.length === 0) {
      newErrors.products = "Phải chọn ít nhất 1 sản phẩm"
    } else {
      selectedProducts.forEach(p => {
        if (!p.quantity || p.quantity <= 0) newErrors[`qty_${p.id}`] = "Số lượng > 0"
        if (p.inboundPrice === '' || p.inboundPrice < 0) newErrors[`price_${p.id}`] = "Giá >= 0"
      })
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const processInbound = () => {
    setLoading(true)
    
    setTimeout(() => {
      const isStaff = user?.role === 'staff'
      const finalStatus = isStaff ? 'Pending' : 'Approved'
      const finalVoucher = { ...voucherData, status: finalStatus }

      // Update Inventory
      if (!isStaff) {
        selectedProducts.forEach(product => {
          updateStock(product.id, parseInt(product.quantity))
        })
      }

      // Generate Transaction
      addTransaction({
        ...finalVoucher,
        type: 'INBOUND',
        totalItems: selectedProducts.length,
        totalQuantity: selectedProducts.reduce((sum, p) => sum + parseInt(p.quantity), 0),
        items: selectedProducts,
        timestamp: new Date().toISOString()
      })

      // Clear drafts on success
      localStorage.removeItem('inboundDraft_voucher')
      localStorage.removeItem('inboundDraft_products')
      
      setVoucherData(finalVoucher) // Ensure status is passed to step 4
      setLoading(false)
      setStep(4) // Move to Complete
    }, 1500)
  }

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setStep(step - 1)
    }
  }

  const jumpToStep = (targetStep) => {
    if (targetStep >= step) return // Can only jump back
    setStep(targetStep)
  }

  const renderStepUI = () => {
    switch(step) {
      case 1:
        return (
          <div className="step-content glass-card animate-fade-in fade-up">
            <div className="step-header">
              <h3>Thông tin Phiếu Nhập</h3>
              <p>Điền các thông tin cơ bản về nguồn hàng và phân loại nhập kho.</p>
            </div>
            
            <div className="form-grid two-col" style={{ marginTop: '1.5rem' }}>
              <div className="form-group form-group-full">
                <label>Mã Phiếu (Tự động)</label>
                <div className="input-with-icon disabled-bg">
                  <ClipboardList size={16} />
                  <input type="text" value={voucherData.id} readOnly className="mono-text font-bold" />
                </div>
              </div>
              
              <div className="form-group">
                <label>Loại Nhập <span className="text-red-500">*</span></label>
                <select 
                  name="type" 
                  value={voucherData.type} 
                  onChange={handleVoucherChange}
                  className={errors.type ? 'error-border' : ''}
                >
                  <option value="">-- Chọn loại --</option>
                  {INBOUND_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {errors.type && <span className="error-text"><AlertCircle size={12}/> {errors.type}</span>}
              </div>

              <div className="form-group">
                <label>Nhà Cung Cấp <span className="text-red-500">*</span></label>
                <select 
                  name="supplierId" 
                  value={voucherData.supplierId} 
                  onChange={handleVoucherChange}
                  className={errors.supplierId ? 'error-border' : ''}
                >
                  <option value="">-- Chọn nhà cung cấp --</option>
                  {MOCK_SUPPLIERS.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                </select>
                {errors.supplierId && <span className="error-text"><AlertCircle size={12}/> {errors.supplierId}</span>}
              </div>

              <div className="form-group">
                <label>Ngày Nhập</label>
                <div className="input-with-icon">
                  <Calendar size={16} />
                  <input 
                    type="date" 
                    name="date" 
                    value={voucherData.date} 
                    onChange={handleVoucherChange}
                    className={errors.date ? 'error-border' : ''}
                  />
                </div>
                {errors.date && <span className="error-text"><AlertCircle size={12}/> {errors.date}</span>}
              </div>

              <div className="form-group">
                <label>Người Lập Phiếu</label>
                <input type="text" value={voucherData.createdBy} readOnly className="disabled-bg" />
              </div>

              <div className="form-group form-group-full">
                <label>Ghi Chú</label>
                <textarea 
                  name="notes" 
                  value={voucherData.notes} 
                  onChange={handleVoucherChange} 
                  placeholder="Ví dụ: Nhập bổ sung lô hàng tháng 3 do thiếu phụ kiện..."
                  rows={3}
                ></textarea>
              </div>
            </div>
            
            <div className="form-actions right-align">
              {voucherData.supplierId && (
                <button className="btn-secondary" onClick={clearDraft} style={{ marginRight: 'auto' }}>
                  <Trash2 size={16} /> Xóa nháp
                </button>
              )}
              <button className="btn-primary large-btn" onClick={nextStep}>
                Tiếp tục <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="step-content glass-card animate-fade-in fade-up">
            <div className="step-header">
              <h3>Danh sách Sản phẩm</h3>
              <p>Tìm kiếm và lập danh sách các sản phẩm cần nhập vào kho.</p>
            </div>
            
            <div className="product-selector">
              <div className={`search-bar glass-card ${errors.products ? 'error-pulse' : ''}`}>
                <Search size={18} className="search-icon" color="var(--primary)" />
                <input 
                  type="text" 
                  placeholder="Tìm sản phẩm theo tên, SKU..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
              
              {searchTerm && filteredInventory.length > 0 && (
                <div className="search-results glass-card floating">
                  {filteredInventory.map(item => (
                    <div key={item.id} className="search-item" onClick={() => addProduct(item)}>
                      <div className="search-item-info">
                        <span className="search-item-id">{item.id}</span>
                        <span className="search-item-name">{item.name}</span>
                      </div>
                      <button className="icon-btn add"><Plus size={16} /></button>
                    </div>
                  ))}
                </div>
              )}
              {searchTerm && filteredInventory.length === 0 && (
                <div className="search-results glass-card floating empty">
                  <p>Không tìm thấy sản phẩm nào phù hợp.</p>
                </div>
              )}
            </div>

            <div className="selected-products-list">
              <div className="list-header-row">
                <h4>Sản phẩm đã chọn ({selectedProducts.length})</h4>
                {errors.products && <span className="error-text-badge"><AlertCircle size={14} /> {errors.products}</span>}
              </div>

              {selectedProducts.length === 0 ? (
                <div className="empty-state-container">
                  <Package size={48} className="empty-icon text-muted" />
                  <p>Vui lòng tìm và thêm sản phẩm bên trên</p>
                </div>
              ) : (
                <div className="products-table-wrapper">
                  <div className="product-table-header product-row-grid">
                    <div>Sản phẩm</div>
                    <div className="text-center">Tồn cũ</div>
                    <div className="text-center">SL Nhập</div>
                    <div className="text-center">Đơn giá Nhập</div>
                    <div className="text-center">Thành tiền</div>
                    <div></div>
                  </div>
                  
                  {selectedProducts.map((p, idx) => {
                    const rowErrorQty = errors[`qty_${p.id}`]
                    const rowErrorPrice = errors[`price_${p.id}`]
                    const total = p.quantity * p.inboundPrice

                    return (
                      <div key={p.id} className="product-row-grid animate-slide-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                        <div className="product-info-cell">
                          <span className="font-bold text-main">{p.name}</span>
                          <span className="product-sku-badge">{p.id}</span>
                        </div>
                        <div className="text-center font-mono opacity-70">{formatNumber(p.stock)}</div>
                        <div className="input-cell relative">
                          <input 
                            type="number" 
                            className={`modern-input text-center font-bold ${rowErrorQty ? 'error' : ''}`}
                            value={p.quantity} 
                            onChange={(e) => updateProductInput(p.id, 'quantity', e.target.value)}
                            min="1"
                          />
                          {rowErrorQty && <span className="tooltip-error">{rowErrorQty}</span>}
                        </div>
                        <div className="input-cell relative">
                          <input 
                            type="number" 
                            className={`modern-input text-right ${rowErrorPrice ? 'error' : ''}`}
                            value={p.inboundPrice} 
                            onChange={(e) => updateProductInput(p.id, 'inboundPrice', e.target.value)}
                            min="0"
                          />
                          {rowErrorPrice && <span className="tooltip-error">{rowErrorPrice}</span>}
                        </div>
                        <div className="text-right text-secondary font-bold">
                          {formatCurrency(total, false)}
                        </div>
                        <div className="text-center">
                          <button className="icon-btn delete-btn" onClick={() => removeProduct(p.id)} title="Xóa dòng này">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="form-actions justify-between">
              <button className="btn-secondary large-btn" onClick={prevStep}>
                <ArrowLeft size={18} /> Quay lại
              </button>
              <button 
                className="btn-primary large-btn" 
                onClick={nextStep} 
              >
                Tiếp tục & Kiểm tra <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )

      case 3:
        const totalItems = selectedProducts.reduce((sum, p) => sum + parseInt(p.quantity || 0), 0)
        const totalAmount = selectedProducts.reduce((sum, p) => sum + (parseInt(p.quantity || 0) * parseInt(p.inboundPrice || 0)), 0)

        return (
          <div className="step-content glass-card animate-fade-in fade-up">
            <div className="step-header">
              <h3>Xác nhận Lưu trữ</h3>
              <p>Kiểm tra lại toàn bộ thông tin trước khi ghi sổ tồn kho.</p>
            </div>

            <div className="verification-summary-grid">
              <div className="verification-card glass-card">
                <h4><ClipboardList size={18} className="text-primary"/> Ghi nhận & Phân loại</h4>
                <ul>
                  <li><span>Mã phiếu:</span> <strong className="mono-text">{voucherData.id}</strong></li>
                  <li><span>Loại nhập:</span> <strong>{INBOUND_TYPES.find(t => t.id === voucherData.type)?.name}</strong></li>
                  <li><span>Nhà Cung Cấp:</span> <strong>{MOCK_SUPPLIERS.find(s => s.id === voucherData.supplierId)?.name}</strong></li>
                  <li><span>Ngày lập:</span> <strong>{voucherData.date}</strong></li>
                  <li><span>Người lập:</span> <strong>{voucherData.createdBy}</strong></li>
                </ul>
              </div>

              <div className="verification-card glass-card highlight-box">
                <h4><Package size={18} className="text-secondary"/> Chốt Tổng Lượng</h4>
                <div className="giant-metric">
                  <span className="label">Tổng SL Sản Phẩm</span>
                  <span className="value text-secondary">{formatNumber(totalItems)}</span>
                </div>
                <div className="giant-metric mt-4">
                  <span className="label">Tổng Trị Giá</span>
                  <span className="value text-primary">{formatCurrency(totalAmount, false)}</span>
                </div>
              </div>
            </div>

            <div className="verification-notes glass-card mt-6">
              <strong><Edit3 size={16} /> Ghi chú đính kèm:</strong>
              <p className="italic text-muted mt-2">{voucherData.notes || 'Không có ghi chú'}</p>
            </div>

            {loading ? (
              <div className="processing-state animate-fade-in">
                <Loader2 size={40} className="animate-spin text-primary mx-auto mb-4" />
                <h4>Đang xử lý...</h4>
                <p>Hệ thống đang ghi log và đẩy yêu cầu lên máy chủ.</p>
              </div>
            ) : (
              user?.role === 'staff' ? (
                <div className="warning-banner glass-card mt-6 animate-pulse" style={{ background: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                  <AlertCircle size={20} className="text-primary" />
                  <p>Bạn đang tạo <strong>YÊU CẦU NHẬP KHO</strong>. Phiếu này sẽ được gửi đến Quản lý để duyệt trước khi thực sự cộng vào Tồn Kho hệ thống.</p>
                </div>
              ) : (
                <div className="warning-banner glass-card orange-tint mt-6 animate-pulse">
                  <AlertCircle size={20} className="text-orange" />
                  <p>Bạn chuẩn bị <strong>CỘNG VÀO TỒN KHO THỰC TẾ</strong>. Hành động này sẽ thay đổi số liệu Dashboard và được lưu lại chi tiết trong Audit Log!</p>
                </div>
              )
            )}

            <div className="form-actions justify-between mt-8">
              <button className="btn-secondary large-btn" onClick={prevStep} disabled={loading}>
                <ArrowLeft size={18} /> Chỉnh sửa
              </button>
              <button 
                className="btn-primary large-btn confirm-btn" 
                onClick={processInbound} 
                disabled={loading}
              >
                <Save size={18} /> {user?.role === 'staff' ? 'GỬI YÊU CẦU DUYỆT' : 'KÝ DUYỆT & NHẬP CAO'}
              </button>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="success-view glass-card animate-fade-in scale-up">
            <div className="success-icon animate-bounce"><CheckCircle size={56} /></div>
            <h1 className="text-gradient">
              {voucherData.status === 'Pending' ? 'Yêu Cầu Đã Gửi!' : 'Nhập Kho Hoàn Tất!'}
            </h1>
            <p className="success-subtitle">
              Mã chứng từ <strong className="mono-text">{voucherData.id}</strong> đã được tạo. 
              {voucherData.status === 'Pending' 
                ? ` Hiện đang chờ Quản lý phê duyệt để nhập ${selectedProducts.length} mặt hàng vào kho.` 
                : ` Toàn bộ ${selectedProducts.length} mặt hàng đã được cộng trực tiếp vào Core Tồn Kho.`}
            </p>
            
            <div className="success-actions mt-8">
              <button className="btn-secondary large-btn" onClick={() => window.location.href = '/inventory'}>
                <Package size={18} /> Xem kho ngay
              </button>
              <button className="btn-primary large-btn" onClick={() => window.location.reload()}>
                <Plus size={18} /> Tạo lệnh mới
              </button>
            </div>
          </div>
        )

      default: return null
    }
  }

  // Calculate live preview data
  const selectedSupplierObj = MOCK_SUPPLIERS.find(s => s.id === voucherData.supplierId)
  const selectedTypeObj = INBOUND_TYPES.find(t => t.id === voucherData.type)
  const totalPreviewItems = selectedProducts.reduce((sum, p) => sum + parseInt(p.quantity || 0), 0)

  return (
    <div className="transaction-wrapper animate-fade-in">
      <header className="transaction-header">
        <div className="header-title">
          <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-xl">
            <ArrowDownLeft size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-gradient">Lệnh Nhập Kho (Inbound)</h1>
            <p className="subtitle">Tạo lệnh mua hàng, nhập hàng lỗi, nhập tồn kho đầu kỳ chuẩn Enterprise.</p>
          </div>
        </div>
      </header>

      <div className="wizard-layout">
        <div className="wizard-main-column">
          
          <div className="wizard-stepper glass-card">
            {[
              { id: 1, label: 'Thông tin chung' },
              { id: 2, label: 'Sản phẩm' },
              { id: 3, label: 'Xác thực' },
              { id: 4, label: 'Hoàn tất' }
            ].map(s => {
              const isCompleted = step > s.id
              const isActive = step === s.id
              const isClickable = s.id < step && step < 4 // Can only click back, not forward, and not if done
              
              return (
                <div 
                  key={s.id} 
                  className={`stepper-node ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isClickable ? 'clickable' : ''}`}
                  onClick={() => isClickable ? jumpToStep(s.id) : null}
                  title={isClickable ? "Quay lại bước này" : ""}
                >
                  <div className="stepper-circle">
                    {isCompleted ? <CheckCircle size={14} className="check-icon" /> : s.id}
                  </div>
                  <span className="stepper-label">{s.label}</span>
                  {s.id < 4 && <div className="stepper-line"></div>}
                </div>
              )
            })}
          </div>

          <div className="wizard-body relative">
            {renderStepUI()}
          </div>
        </div>

        {/* Persistent Right Panel: Summary Dashboard */}
        <div className="wizard-side-column hidden-mobile">
          <div className="summary-panel glass-card sticky-sidebar">
            <h3 className="summary-title"><ClipboardList size={18} className="text-primary"/> Tóm tắt Phiếu</h3>
            
            <div className="summary-section">
              <span className="summary-label">Mã Lệnh</span>
              <span className="summary-val mono-text font-bold text-main">{voucherData.id}</span>
            </div>
            
            <div className="summary-section">
              <span className="summary-label">Phân Loại</span>
              <span className="summary-val">{selectedTypeObj?.name || <i className="text-muted">Chưa chọn</i>}</span>
            </div>

            <div className="summary-section">
              <span className="summary-label">Đối Tác (NCC)</span>
              <div className="supplier-preview">
                {selectedSupplierObj ? (
                  <>
                    <MapPin size={14} className="text-secondary" />
                    <span className="summary-val">{selectedSupplierObj.name}</span>
                  </>
                ) : <i className="text-muted">Chưa chọn</i>}
              </div>
            </div>

            <div className="summary-section">
              <span className="summary-label">Sản phẩm tham gia</span>
              <span className="summary-val highlight-val">{selectedProducts.length} <small>mã</small></span>
            </div>

            <div className="summary-section no-border border-t border-white/5 pt-4 mt-2">
              <span className="summary-label font-bold text-main uppercase">Tổng SL Nhập</span>
              <span className="summary-val giant-val text-primary">{formatNumber(totalPreviewItems)}</span>
            </div>

            <div className="draft-badge mt-6">
              <Save size={14} /> Chế độ lưu nháp tự động
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Inbound
