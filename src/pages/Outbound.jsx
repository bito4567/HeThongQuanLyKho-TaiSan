import { useState, useEffect, useRef } from 'react'
import { ArrowUpRight, Save, Package, Search, Plus, Trash2, CheckCircle, AlertCircle, Loader2, ArrowRight, ArrowLeft, ClipboardList, Calendar, User, Edit3, MapPin, Tag } from 'lucide-react'
import { useInventory } from '../hooks/useInventory'
import { useAuth } from '../hooks/useAuth'
import { formatCurrency, formatNumber } from '../utils/format'
import './Inbound.css' 
import './Transactions.css'

const OUTBOUND_TYPES = [
  { id: 'BAN_HANG', name: 'Bán hàng / Xuất cho Đại lý' },
  { id: 'NOI_BO', name: 'Xuất sử dụng Nội bộ' },
  { id: 'HUY', name: 'Xuất Huỷ / Tiêu huỷ' },
  { id: 'TRA_NCC', name: 'Xuất Trả Nhà Cung Cấp' }
]

const WAREHOUSES = [
  { id: 'KHO_TONG', name: 'Kho Tổng (Central)' },
  { id: 'KHO_1', name: 'Kho Số 1 (Miền Bắc)' },
  { id: 'KHO_2', name: 'Kho Số 2 (Miền Nam)' }
]

const Outbound = () => {
  const { inventory, updateStock, addTransaction, transactions } = useInventory()
  const { user } = useAuth()
  
  const autoStatus = user?.role === 'staff' ? 'PENDING_MANAGER' : user?.role === 'manager' ? 'PENDING_ADMIN' : 'APPROVED'
  const initialized = useRef(false)

  const generateId = () => {
    const today = new Date()
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
    const todaysTransactions = transactions ? transactions.filter(t => t.id?.includes(dateStr) && t.type === 'OUTBOUND') : []
    const sequence = String(todaysTransactions.length + 1).padStart(3, '0')
    return `PXK-${dateStr}-${sequence}`
  }

  const getInitialVoucherData = () => {
    const saved = localStorage.getItem('outboundDraft_voucher')
    if (saved) return JSON.parse(saved)
    return {
      id: generateId(),
      type: 'OUTBOUND',
      outboundType: '',
      warehouseId: '',
      recipient: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      status: autoStatus,
      createdBy: user?.name || 'Unknown'
    }
  }

  const getInitialProducts = () => {
    const saved = localStorage.getItem('outboundDraft_products')
    if (saved) return JSON.parse(saved)
    return []
  }

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [voucherData, setVoucherData] = useState(getInitialVoucherData())
  const [selectedProducts, setSelectedProducts] = useState(getInitialProducts())
  const [searchTerm, setSearchTerm] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      return
    }
    if (voucherData.recipient || selectedProducts.length > 0 || voucherData.notes || voucherData.outboundType) {
      localStorage.setItem('outboundDraft_voucher', JSON.stringify(voucherData))
      localStorage.setItem('outboundDraft_products', JSON.stringify(selectedProducts))
    }
  }, [voucherData, selectedProducts])

  const clearDraft = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa nháp và làm lại từ đầu?")) {
      localStorage.removeItem('outboundDraft_voucher')
      localStorage.removeItem('outboundDraft_products')
      setVoucherData({
        id: generateId(),
        type: 'OUTBOUND',
        outboundType: '',
        warehouseId: '',
        recipient: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        status: autoStatus,
        createdBy: user?.name || 'Unknown'
      })
      setSelectedProducts([])
      setStep(1)
      setErrors({})
    }
  }

  const handleVoucherChange = (e) => {
    const { name, value } = e.target
    setVoucherData({ ...voucherData, [name]: value })
    if (errors[name]) setErrors({ ...errors, [name]: null })
  }

  const filteredInventory = inventory.filter(item => 
    item.stock > 0 &&
    !selectedProducts.find(p => p.id === item.id) &&
    (item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     item.id.toLowerCase().includes(searchTerm.toLowerCase()))
  ).slice(0, 10)

  const addProduct = (product) => {
    setSelectedProducts([...selectedProducts, { 
      ...product, 
      quantity: 1, 
      outboundPrice: parseInt(String(product.price).replace(/[^0-9]/g, '')) || 0 
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

  const validateStep1 = () => {
    const newErrors = {}
    if (!voucherData.outboundType) newErrors.outboundType = "Vui lòng chọn Loại xuất kho"
    if (!voucherData.warehouseId) newErrors.warehouseId = "Vui lòng chọn Kho xuất"
    if (!voucherData.recipient) newErrors.recipient = "Vui lòng nhập tên khách hàng / nơi nhận"
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
        if (!p.quantity || p.quantity <= 0) newErrors[`qty_${p.id}`] = "SL > 0"
        if (p.quantity > p.stock) newErrors[`qty_${p.id}`] = `Kho chỉ còn ${p.stock}`
      })
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const processOutbound = () => {
    setLoading(true)
    
    setTimeout(() => {
      const finalVoucher = { ...voucherData, status: autoStatus }

      if (autoStatus === 'APPROVED') {
        selectedProducts.forEach(product => {
          updateStock(product.id, -parseInt(product.quantity))
        })
      }

      addTransaction({
        ...finalVoucher,
        totalItems: selectedProducts.length,
        totalQuantity: selectedProducts.reduce((sum, p) => sum + parseInt(p.quantity), 0),
        items: selectedProducts,
        timestamp: new Date().toISOString()
      })

      localStorage.removeItem('outboundDraft_voucher')
      localStorage.removeItem('outboundDraft_products')
      
      setVoucherData(finalVoucher)
      setLoading(false)
      setStep(4)
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
    if (targetStep >= step) return
    setStep(targetStep)
  }

  const renderStepUI = () => {
    switch(step) {
      case 1:
        return (
          <div className="step-content glass-card animate-fade-in fade-up">
            <div className="step-header">
              <h3 className="text-2xl font-bold flex items-center gap-2"><ClipboardList size={24} className="text-error" /> Thông tin Phiếu Xuất</h3>
              <p>Khởi tạo thông tin dữ liệu về nguồn trích xuất, loại xuất và đối tượng nhận.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="form-group col-span-1 md:col-span-2">
                <label className="font-bold text-main">Mã Phiếu Xuất (Tự động cấp)</label>
                <div className="input-with-icon disabled-bg outline-none border border-error/30 bg-error/5">
                  <ClipboardList size={18} className="text-error" />
                  <input type="text" value={voucherData.id} readOnly className="mono-text font-black text-error text-lg bg-transparent tracking-widest" />
                </div>
              </div>
              
              <div className="form-group">
                <label className="font-bold">Loại Phiếu Xuất <span className="text-error">*</span></label>
                <div className={`input-with-icon ${errors.outboundType ? 'border-error ring-1 ring-error' : ''}`}>
                  <Tag size={16} className="text-muted" />
                  <select 
                    name="outboundType" 
                    value={voucherData.outboundType} 
                    onChange={handleVoucherChange}
                    className="w-full bg-transparent border-none outline-none text-main"
                  >
                    <option value="">-- Chọn Loại Xuất --</option>
                    {OUTBOUND_TYPES.map(t => <option key={t.id} value={t.id} className="bg-surface">{t.name}</option>)}
                  </select>
                </div>
                {errors.outboundType && <span className="text-error text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/> {errors.outboundType}</span>}
              </div>

              <div className="form-group">
                <label className="font-bold">Kho Thực Hiện Xuất <span className="text-error">*</span></label>
                <div className={`input-with-icon ${errors.warehouseId ? 'border-error ring-1 ring-error' : ''}`}>
                  <MapPin size={16} className="text-muted" />
                  <select 
                    name="warehouseId" 
                    value={voucherData.warehouseId} 
                    onChange={handleVoucherChange}
                    className="w-full bg-transparent border-none outline-none text-main"
                  >
                    <option value="">-- Chọn Kho Bãi --</option>
                    {WAREHOUSES.map(w => <option key={w.id} value={w.id} className="bg-surface">{w.name}</option>)}
                  </select>
                </div>
                {errors.warehouseId && <span className="text-error text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/> {errors.warehouseId}</span>}
              </div>

              <div className="form-group">
                <label className="font-bold">Người nhận / Doanh nghiệp nhận <span className="text-error">*</span></label>
                <div className={`input-with-icon ${errors.recipient ? 'border-error ring-1 ring-error' : ''}`}>
                  <User size={16} className="text-muted" />
                  <input 
                    type="text" 
                    name="recipient" 
                    placeholder="Nhập tên đối tác hoặc người nhận..."
                    value={voucherData.recipient} 
                    onChange={handleVoucherChange}
                    className="w-full bg-transparent border-none outline-none text-main"
                  />
                </div>
                {errors.recipient && <span className="text-error text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/> {errors.recipient}</span>}
              </div>

              <div className="form-group">
                <label className="font-bold">Ngày Xuất Kho <span className="text-error">*</span></label>
                <div className={`input-with-icon ${errors.date ? 'border-error ring-1 ring-error' : ''}`}>
                  <Calendar size={16} className="text-muted" />
                  <input 
                    type="date" 
                    name="date" 
                    value={voucherData.date} 
                    onChange={handleVoucherChange}
                    className="w-full bg-transparent border-none outline-none text-main"
                  />
                </div>
                {errors.date && <span className="text-error text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/> {errors.date}</span>}
              </div>

              <div className="form-group">
                <label className="font-bold">Trạng Thái Phiếu (Auto)</label>
                <div className="p-3 border border-light/50 bg-black/10 rounded-xl flex items-center gap-2 font-bold cursor-not-allowed text-sm">
                  <span className={`w-3 h-3 rounded-full ${autoStatus === 'APPROVED' ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`}></span>
                  {autoStatus}
                </div>
              </div>

              <div className="form-group">
                <label className="font-bold">Người Lập Phiếu</label>
                <input type="text" value={voucherData.createdBy} readOnly className="disabled-bg cursor-not-allowed font-medium text-muted" />
              </div>

              <div className="form-group col-span-1 md:col-span-2">
                <label className="font-bold">Ghi Chú Đính Kèm</label>
                <textarea 
                  name="notes" 
                  value={voucherData.notes} 
                  onChange={handleVoucherChange} 
                  placeholder="Ghi chú thêm thông tin cho phiếu xuất (VD: Xe tải biển số 29A-XXXX)..."
                  rows={3}
                  className="w-full bg-transparent border border-light rounded-xl p-3 outline-none text-main focus:border-error focus:ring-1 focus:ring-error transition-all resize-none"
                ></textarea>
              </div>
            </div>
            
            <div className="form-actions flex justify-between items-center mt-8 pt-6 border-t border-light/50">
              {voucherData.recipient || voucherData.outboundType ? (
                <button className="text-muted hover:text-error hover:bg-error/10 flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium" onClick={clearDraft}>
                  <Trash2 size={18} /> Làm mới Dữ liệu Nháp
                </button>
              ) : <div></div>}
              
              <button className="btn-primary large-btn font-bold text-lg px-8 py-3 bg-error hover:bg-error/90 hover:scale-[1.02] border-transparent text-white shadow-lg shadow-error/20 transition-all flex items-center justify-center gap-2" onClick={nextStep}>
                Lưu & Chọn Sản Phẩm <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="step-content glass-card animate-fade-in fade-up border-t-4 border-error">
            <div className="step-header">
              <h3 className="text-error text-2xl font-bold flex items-center gap-2"><Package size={24} /> Chọn Sản phẩm Xuất Kho</h3>
              <p>Tra cứu mã SKU và chỉ định đúng số lượng muốn xuất khỏi hệ thống.</p>
            </div>
            
            <div className="product-selector mt-6">
              <div className={`search-bar glass-card hover:border-error/50 transition-colors ${errors.products ? 'border-error ring-1 ring-error' : ''}`}>
                <Search size={20} className="search-icon text-error" />
                <input 
                  type="text" 
                  placeholder="Nhập mã SKU hoặc tên sản phẩm để tìm kiếm trực tiếp..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                  className="text-lg w-full bg-transparent outline-none border-none py-2"
                />
              </div>
              
              {searchTerm && filteredInventory.length > 0 && (
                <div className="search-results glass-card floating shadow-2xl border-light/50">
                  {filteredInventory.map(item => (
                    <div key={item.id} className="search-item group hover:bg-error/10 cursor-pointer p-4 border-b border-light/20 flex justify-between items-center transition-colors" onClick={() => addProduct(item)}>
                      <div className="search-item-info">
                        <span className="search-item-name font-bold text-lg block text-main">{item.name}</span>
                        <div className="flex items-center gap-3 mt-1">
                           <span className="search-item-id font-mono bg-black/20 px-2 py-0.5 rounded text-error text-xs">{item.id}</span>
                           <span className="text-xs text-muted block">Tồn kho khả dụng: <strong className="text-main font-bold text-sm bg-primary/10 px-2 rounded-full">{item.stock}</strong></span>
                        </div>
                      </div>
                      <button className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center text-muted group-hover:bg-error group-hover:text-white transition-all transform group-hover:scale-110 shadow-lg"><Plus size={20} strokeWidth={2.5} /></button>
                    </div>
                  ))}
                </div>
              )}
              {searchTerm && filteredInventory.length === 0 && (
                <div className="search-results glass-card floating empty p-8 text-center text-muted">
                  <AlertCircle size={32} className="mx-auto mb-3 opacity-50" />
                  <p>Không tìm thấy sản phẩm hoặc sản phẩm đã chọn hết / hết hàng tồn kho.</p>
                </div>
              )}
            </div>

            <div className="selected-products-list mt-10">
              <div className="list-header-row mb-4 flex justify-between items-center bg-black/20 p-4 rounded-xl">
                <h4 className="font-bold flex items-center gap-3 text-lg text-white">
                  Danh mục đã đưa vào Giỏ 
                  <span className="bg-error text-white font-black px-3 py-1 rounded-full text-sm shadow-md">{selectedProducts.length}</span>
                </h4>
                {errors.products && <span className="text-error flex items-center gap-2 text-sm bg-error/10 px-3 py-1.5 rounded-full font-bold border border-error/20"><AlertCircle size={16} /> {errors.products}</span>}
              </div>

              {selectedProducts.length === 0 ? (
                <div className="empty-state-container py-16 border-2 border-dashed border-error/20 rounded-2xl bg-error/5 flex flex-col items-center justify-center">
                  <Package size={64} className="empty-icon text-error/30 mb-4" />
                  <h5 className="font-bold text-lg text-muted mb-1">Giỏ Xuất Kho Trống</h5>
                  <p className="text-center text-muted/70">Tìm kiếm và thêm sản phẩm từ thanh công cụ bên trên</p>
                </div>
              ) : (
                <div className="products-table-wrapper border border-light rounded-2xl overflow-hidden shadow-lg">
                  <div className="product-table-header product-row-grid bg-white/5 font-black p-4 text-sm text-muted uppercase tracking-wider border-b border-light">
                    <div>Sản phẩm (${selectedProducts.length})</div>
                    <div className="text-center">Tồn Kho</div>
                    <div className="text-center text-error">SL Xuất</div>
                    <div className="text-right">Đơn giá</div>
                    <div className="text-right">Thành tiền</div>
                    <div></div>
                  </div>
                  
                  {selectedProducts.map((p, idx) => {
                    const rowErrorQty = errors[`qty_${p.id}`]
                    const total = p.quantity * p.outboundPrice

                    return (
                      <div key={p.id} className="product-row-grid p-4 animate-slide-in hover:bg-white/5 border-b border-light/20 items-center transition-colors" style={{ animationDelay: `${idx * 0.05}s` }}>
                        <div className="product-info-cell flex flex-col gap-1">
                          <span className="font-bold text-main line-clamp-2 text-md leading-tight">{p.name}</span>
                          <span className="product-sku-badge font-mono text-xs font-bold text-error/80 bg-error/10 w-fit px-2 py-0.5 rounded">{p.id}</span>
                        </div>
                        <div className="text-center font-mono font-bold opacity-80 text-lg bg-black/20 p-2 rounded-lg w-16 mx-auto">{formatNumber(p.stock)}</div>
                        <div className="input-cell relative flex justify-center w-full">
                          <div className="relative w-24">
                            <input 
                              type="number" 
                              className={`w-full text-center font-black text-xl py-2 rounded-xl outline-none transition-all ${rowErrorQty ? 'bg-error/20 border-2 border-error text-error shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-transparent border-2 border-light/50 focus:border-error focus:ring-4 focus:ring-error/20 text-error shadow-inner hover:border-error/50'}`}
                              value={p.quantity} 
                              onChange={(e) => updateProductInput(p.id, 'quantity', e.target.value)}
                              min="1"
                              max={p.stock}
                            />
                            {rowErrorQty && <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[11px] font-bold text-error whitespace-nowrap bg-black/80 px-2 py-1 rounded-md">{rowErrorQty}</span>}
                          </div>
                        </div>
                        <div className="text-right font-mono text-sm opacity-80">{formatCurrency(p.outboundPrice, false)}</div>
                        <div className="text-right font-bold text-error text-lg tracking-tight break-words">{formatCurrency(total, false)}</div>
                        <div className="text-center">
                          <button className="w-10 h-10 rounded-full flex items-center justify-center mx-auto text-muted hover:text-white hover:bg-error transition-all hover:scale-110 shadow-sm" onClick={() => removeProduct(p.id)} title="Xóa khỏi giỏ">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="form-actions justify-between mt-10 pt-6 border-t border-light/50 flex">
              <button className="btn-secondary large-btn px-6 font-bold hover:bg-white/10" onClick={prevStep}>
                <ArrowLeft size={20} className="mr-2" /> Quay lại Sửa Thông Tin
              </button>
              <button 
                className="btn-primary large-btn font-bold text-lg px-8 py-3 bg-error hover:bg-error/90 hover:scale-[1.02] border-transparent text-white shadow-lg shadow-error/30 transition-all flex items-center justify-center gap-2" 
                onClick={nextStep} 
              >
                Chuyển Bước Xác Thực <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )

      case 3:
        const totalItems = selectedProducts.reduce((sum, p) => sum + parseInt(p.quantity || 0), 0)
        const totalAmount = selectedProducts.reduce((sum, p) => sum + (parseInt(p.quantity || 0) * parseInt(p.outboundPrice || 0)), 0)

        const typeName = OUTBOUND_TYPES.find(t => t.id === voucherData.outboundType)?.name || voucherData.outboundType
        const warehouseName = WAREHOUSES.find(w => w.id === voucherData.warehouseId)?.name || voucherData.warehouseId

        let isFinalApproval = user?.role === 'admin'
        let pendingTarget = user?.role === 'staff' ? 'QUẢN LÝ (MANAGER)' : 'BAN GIÁM ĐỐC (ADMIN)'

        return (
          <div className="step-content glass-card animate-fade-in fade-up">
            <div className="step-header">
              <h3 className="text-2xl font-bold flex items-center gap-2 mb-2"><CheckCircle size={28} className="text-green-500"/> Chốt Phiếu Xuất Kho</h3>
              <p className="text-muted/80">Phiếu xuất sẽ phải chịu ràng buộc pháp lý. Vui lòng đối chiếu kỹ lại mọi số liệu trước khi ký lệnh.</p>
            </div>

            <div className="verification-summary-grid grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
              <div className="verification-card glass-card bg-black/30 p-6 rounded-3xl border border-light/50 shadow-inner">
                <h4 className="flex items-center gap-3 font-black text-lg mb-5 text-white border-b border-light/30 pb-4"><ClipboardList size={22} className="text-error" /> Hồ Sơ Điều Lệnh</h4>
                <ul className="space-y-4 text-[15px]">
                  <li className="flex justify-between items-center"><span className="text-muted font-medium">Mã vận đơn:</span> <strong className="font-mono text-xl text-error bg-error/10 px-3 py-1 rounded-lg">{voucherData.id}</strong></li>
                  <li className="flex justify-between"><span className="text-muted font-medium">Đối tượng nhận:</span> <strong className="text-white text-right break-words max-w-[60%] leading-tight">{voucherData.recipient}</strong></li>
                  <li className="flex justify-between"><span className="text-muted font-medium">Loại xuất:</span> <strong className="text-orange-400 font-bold">{typeName}</strong></li>
                  <li className="flex justify-between"><span className="text-muted font-medium">Kho xử lý:</span> <strong className="font-bold">{warehouseName}</strong></li>
                  <li className="flex justify-between"><span className="text-muted font-medium">Ngày lập biên bản:</span> <strong className="font-mono">{voucherData.date}</strong></li>
                </ul>
              </div>

              <div className="verification-card glass-card p-6 rounded-3xl border border-error/40 bg-gradient-to-br from-error/10 via-error/5 to-transparent relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-48 h-48 bg-error/20 blur-[80px] rounded-full translate-x-10 -translate-y-10"></div>
                <h4 className="flex items-center gap-3 font-black text-lg mb-6 text-error"><Package size={22} /> Số Liệu Cắt Kho</h4>
                <div className="giant-metric mb-6 p-4 bg-black/20 rounded-2xl border border-white/5">
                  <span className="block text-xs uppercase font-black tracking-widest text-muted mb-2">Số Thuộc Tính Tham Gia</span>
                  <span className="text-3xl font-bold flex items-baseline gap-2 text-white">{selectedProducts.length} <span className="text-sm font-medium text-muted/60 lowercase tracking-normal">SKUs</span></span>
                </div>
                <div className="giant-metric mb-6">
                  <span className="block text-sm uppercase font-black tracking-widest text-error/80 mb-2">Tổng Quy Mô Cắt Tồn Kho</span>
                  <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-error to-orange-400 drop-shadow-lg">{formatNumber(totalItems)}</span>
                </div>
                <div className="giant-metric px-4 py-3 bg-error/10 rounded-xl border border-error/20 inline-block">
                  <span className="text-xs uppercase font-black tracking-widest text-error/80 mr-3">Tổng Trị Giá Vận Đơn:</span>
                  <span className="text-xl font-bold text-white">{formatCurrency(totalAmount, false)}</span>
                </div>
              </div>
            </div>

            <div className="verification-notes glass-card mt-2 p-5 rounded-2xl border border-light/50 bg-black/20 shadow-inner">
              <strong className="flex items-center gap-2 text-sm text-white/80 mb-3"><Edit3 size={18} className="text-muted" /> Ký lục đính kèm:</strong>
              <p className="text-main/90 text-[15px] leading-relaxed italic border-l-4 border-error/50 pl-4">{voucherData.notes || 'Không ghi nhận mô tả bổ sung nào trong lệnh thao tác này.'}</p>
            </div>

            {loading ? (
              <div className="processing-state animate-fade-in text-center py-10 mt-6 glass-card bg-black/40 rounded-3xl border border-light">
                <Loader2 size={56} className="animate-spin text-error mx-auto mb-5 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                <h4 className="text-xl font-black text-white tracking-wide">Đang xác thực bảo mật & Đẩy hồ sơ...</h4>
                <p className="text-muted text-sm max-w-md mx-auto mt-3">Quá trình này ghi nhận Blockchain Audit, thực hiện chữ ký điện tử trên Data Node và cập nhật Trạng thái cho phiếu xuất.</p>
              </div>
            ) : (
              !isFinalApproval ? (
                <div className="warning-banner glass-card mt-8 border-orange-500/40 bg-gradient-to-r from-orange-500/10 to-transparent rounded-2xl p-6 flex flex-col md:flex-row gap-5 items-start animate-fade-in shadow-lg">
                  <div className="p-3 bg-orange-500/20 rounded-2xl text-orange-400 shrink-0 shadow-inner">
                     <AlertCircle size={32} />
                  </div>
                  <div>
                    <h5 className="font-black text-lg text-orange-400 mb-2 tracking-wide uppercase">Quy trình Phê duyệt {user?.role.toUpperCase()} ➔ {pendingTarget}</h5>
                    <p className="text-[15px] text-orange-400/80 leading-relaxed font-medium">Bằng việc xác nhận, một phiếu trạng thái <strong className="text-orange-300 font-mono bg-black/30 px-2 py-0.5 rounded mx-1">{autoStatus}</strong> sẽ được sinh ra. Bạn không có quyền can thiệp thẳng vào Master Storage. Chứng từ sẽ được treo tại cổng duyệt chờ <strong className="text-white border-b border-dashed border-white/50">{pendingTarget}</strong> thông qua.</p>
                  </div>
                </div>
              ) : (
                <div className="warning-banner glass-card mt-8 border-error/60 bg-gradient-to-r from-error/20 to-transparent rounded-2xl p-6 flex flex-col md:flex-row gap-5 items-start shadow-xl ring-1 ring-error/20">
                  <div className="p-3 bg-error/30 rounded-2xl text-white shrink-0 shadow-inner border border-error/50">
                     <AlertCircle size={32} />
                  </div>
                  <div>
                    <h5 className="font-black text-xl text-white mb-2 tracking-wide uppercase drop-shadow">Quyền Hạn Chấp Pháp Tối Cao (ADMIN)</h5>
                    <p className="text-[15px] text-white/80 leading-relaxed font-medium">Thao tác Nút Ký nhận bên dưới sẽ ngay lập tức <strong className="text-error bg-black/40 px-2 py-0.5 rounded font-black max-w-fit mx-1">TRỪ -{formatNumber(totalItems)} PRODUCTS</strong> trên Data Warehouse Thực. Đồng thời ghi danh hồ sơ kiểm toán. Hãy chắc chắn rằng bạn đã đối soát kỹ lưỡng!</p>
                  </div>
                </div>
              )
            )}

            <div className="form-actions justify-between mt-10 pt-8 border-t border-light/50 flex">
              <button className="btn-secondary large-btn hover:bg-white/10 px-8 font-bold" onClick={prevStep} disabled={loading}>
                <ArrowLeft size={20} className="mr-2" /> Soát Xét Lại
              </button>
              <button 
                className={`btn-primary large-btn font-black text-lg px-10 py-4 border-transparent flex items-center justify-center gap-3 transition-all ${loading ? 'opacity-50 cursor-not-allowed bg-black/50 text-muted' : isFinalApproval ? 'bg-error text-white hover:bg-red-600 hover:scale-[1.03] shadow-[0_0_30px_rgba(239,68,68,0.4)] ring-2 ring-error/50 ring-offset-2 ring-offset-black' : 'bg-orange-600 text-white hover:bg-orange-500 hover:scale-[1.02] shadow-[0_0_20px_rgba(234,88,12,0.3)]'}`}
                onClick={processOutbound} 
                disabled={loading}
              >
                {isFinalApproval ? (
                  <><CheckCircle size={22} className="animate-pulse" /> KÝ XUẤT TRỰC TIẾP</>
                ) : (
                  <><ArrowRight size={22} className="animate-bounce-x" /> NỘP YÊU CẦU CHO {pendingTarget}</>
                )}
              </button>
            </div>
          </div>
        )

      case 4:
        let pendingStr = voucherData.status.includes('PENDING')
        let managerApproval = voucherData.status === 'PENDING_MANAGER'

        return (
          <div className="success-view glass-card animate-fade-in scale-up relative overflow-hidden text-center py-24 px-8 border border-light/50 shadow-2xl rounded-3xl mt-4">
            <div className={`absolute top-0 right-0 h-64 w-64 blur-[120px] rounded-full ${pendingStr ? 'bg-orange-500/20' : 'bg-green-500/20'} pointer-events-none`}></div>
            <div className={`absolute bottom-0 left-0 h-64 w-64 blur-[120px] rounded-full ${pendingStr ? 'bg-yellow-500/10' : 'bg-emerald-500/10'} pointer-events-none`}></div>
            
            <div className={`success-icon flex items-center justify-center w-32 h-32 mx-auto rounded-full mb-8 relative z-10 ${pendingStr ? 'bg-gradient-to-br from-orange-500/20 to-yellow-500/5 text-orange-400 border border-orange-500/30' : 'bg-gradient-to-br from-green-500/20 to-emerald-500/5 text-green-400 border border-green-500/30'}`}>
              <CheckCircle size={72} strokeWidth={2.5} className="animate-bounce drop-shadow-lg" />
              <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${pendingStr ? 'bg-orange-500' : 'bg-green-500'} duration-1000`}></div>
            </div>
            
            <h1 className={`text-5xl font-black mb-6 tracking-tight drop-shadow-sm ${pendingStr ? 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-500' : 'text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-green-600'}`}>
              {pendingStr ? 'Chứng Từ Ghi Nhận Thành Công!' : 'Hệ Thống Đã Xả Tồn Kho!'}
            </h1>
            
            <p className="text-muted/90 max-w-2xl mx-auto text-xl leading-relaxed mb-10 relative z-10 font-medium">
              Vận đơn mã số <strong className={`font-mono px-3 py-1 rounded-lg text-lg ml-1 shadow-inner border ${pendingStr ? 'bg-orange-500/10 text-orange-300 border-orange-500/30' : 'bg-green-500/10 text-green-300 border-green-500/30'}`}>{voucherData.id}</strong> đã được số hoá. 
              <br/><br/>
              {pendingStr 
                ? <span className="text-white/80 block">Trạng thái hiện tại: Đang chờ phê duyệt từ <strong>{managerApproval ? 'Quản Lý Kho' : 'Ban Giám Đốc'}</strong>. Quá trình kiểm kê xuất hàng sẽ dừng lại cho đến khi tín hiệu duyệt được kích hoạt.</span>
                : <span className="text-white/80 block">Trạng thái: <strong>Hoàn Tất</strong>. Tổng tài nguyên của <strong className="text-white">{selectedProducts.length}</strong> mã sản phẩm đã được cắt lìa khỏi kho chung một cách mượt mà.</span>}
            </p>
            
            <div className="success-actions flex flex-col sm:flex-row gap-5 justify-center mt-8 relative z-10">
              <button className="btn-secondary px-8 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-white/10 transition-colors border-2 border-light/50 hover:border-light" onClick={() => window.location.href = '/inventory'}>
                <Package size={22} /> Quay Về Xem Core Kho
              </button>
              <button className={`btn-primary px-8 py-4 rounded-2xl font-black text-lg text-white border-transparent flex items-center justify-center gap-3 hover:scale-[1.03] transition-all shadow-xl ${pendingStr ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-orange-500/20' : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-green-500/20'}`} onClick={() => window.location.reload()}>
                <Plus size={22} strokeWidth={2.5} /> Khởi Lệnh Xuất Mới
              </button>
            </div>
          </div>
        )

      default: return null
    }
  }

  const totalPreviewItems = selectedProducts.reduce((sum, p) => sum + parseInt(p.quantity || 0), 0)

  return (
    <div className="transaction-wrapper animate-fade-in relative max-w-[1400px] mx-auto pb-16">
      <div className="absolute top-0 left-1/4 w-[800px] h-[400px] bg-gradient-to-br from-error/5 via-orange-500/5 to-transparent blur-[100px] rounded-[100%] pointer-events-none -z-10 mix-blend-screen"></div>
      
      <header className="transaction-header mb-10 mt-4 flex flex-col lg:flex-row justify-between items-start lg:items-center relative z-10">
        <div className="header-title flex items-center gap-6">
          <div className="p-5 border border-error/20 shadow-[inset_0_0_20px_rgba(239,68,68,0.1)] text-error rounded-[2rem] bg-gradient-to-br from-error/10 to-transparent backdrop-blur-sm">
            <ArrowUpRight size={44} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-error via-red-400 to-orange-400 mb-2 drop-shadow-sm tracking-tight">Khu Vực Khởi Tạo Phiếu Xuất Kho</h1>
            <p className="text-lg text-muted/80 flex items-center gap-2 font-medium">Bảng điều khiển chuyên trách thiết lập lệnh bán buôn và xuất điều chuyển.</p>
          </div>
        </div>
      </header>

      <div className="wizard-layout flex flex-col xl:flex-row gap-8 items-start relative z-10">
        <div className="wizard-main-column flex-1 w-full relative transition-all min-w-0">
          
          <div className="wizard-stepper glass-card bg-black/40 backdrop-blur-2xl border border-light/60 shadow-2xl p-4 sm:p-6 rounded-[2rem] flex justify-between items-center mb-10 relative overflow-hidden ring-1 ring-white/5 mx-auto max-w-[900px]">
            <div className="absolute top-0 right-1/2 w-1/2 h-1 bg-gradient-to-l from-transparent via-error/40 to-transparent"></div>
            {[
              { id: 1, label: 'Kê Khai Thông Tin' },
              { id: 2, label: 'Lọc Giỏ Hàng' },
              { id: 3, label: 'Đối Soát & Ký' },
              { id: 4, label: 'In Vận Đơn' }
            ].map(s => {
              const isCompleted = step > s.id
              const isActive = step === s.id
              const isClickable = s.id < step && step < 4
              
              return (
                <div 
                  key={s.id} 
                  className={`stepper-node flex flex-col items-center flex-1 relative gap-4 cursor-pointer group px-2 sm:px-0 z-20 ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isClickable ? 'clickable' : ''}`}
                  onClick={() => isClickable ? jumpToStep(s.id) : null}
                  title={isClickable ? "Bấm vào để điều chỉnh lại" : ""}
                >
                  <div className="relative">
                     <div className={`stepper-circle z-20 relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-black text-lg sm:text-xl shadow-xl transition-all duration-500 ring-2 ring-offset-4 ring-offset-black ${isActive ? 'bg-gradient-to-br from-error to-red-600 text-white ring-error/50 scale-110 shadow-error/30' : isCompleted ? 'bg-black/50 text-error ring-error/30 border border-error/50' : 'bg-black/40 ring-transparent border border-light/50 text-muted group-hover:bg-white/10 group-hover:text-white'}`}>
                       {isCompleted ? <CheckCircle size={24} className="check-icon animate-pulse" /> : s.id}
                     </div>
                     {isActive && <div className="absolute inset-0 bg-error blur-[20px] rounded-full opacity-40 -z-10 animate-pulse"></div>}
                  </div>
                  <div className={`stepper-label text-[10px] sm:text-xs font-bold text-center w-full uppercase tracking-widest transition-colors duration-300 mt-1 flex flex-col gap-1 items-center ${isActive ? 'text-error font-black drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : isCompleted ? 'text-main' : 'text-muted'}`}>
                    <span className="opacity-60 text-[9px] sm:text-[10px]">BƯỚC {s.id}</span>
                    <span className="hidden sm:block whitespace-nowrap">{s.label}</span>
                  </div>
                  {s.id < 4 && <div className={`stepper-line absolute top-[24px] sm:top-[28px] left-[50%] w-full h-[3px] -z-10 transition-colors duration-700 rounded-full ${isCompleted ? 'bg-gradient-to-r from-error to-red-400/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-light/20'}`}></div>}
                </div>
              )
            })}
          </div>

          <div className="wizard-body relative">
            {renderStepUI()}
          </div>
        </div>

        {/* Persistent Right Panel: Outbound Summary Dashboard */}
        <div className="wizard-side-column hidden xl:block w-[360px] sticky top-8 shrink-0">
          <div className="summary-panel glass-card bg-black/50 border border-light/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[2.5rem] p-8 relative overflow-hidden backdrop-blur-3xl ring-1 ring-white/5">
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-[80px] bg-error/20 pointer-events-none mix-blend-screen"></div>
            
            <h3 className="summary-title flex items-center gap-3 font-black text-xl text-white mb-8 pb-5 border-b border-light/50 uppercase tracking-widest relative z-10"><ClipboardList size={24} className="text-error drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]"/> Thống Kê Nhanh</h3>
            
            <div className="summary-section flex flex-col gap-2 mb-6 relative z-10 bg-white/5 p-4 rounded-2xl border border-white/5">
              <span className="summary-label text-xs uppercase font-bold text-muted tracking-wider">Mã Hồ Sơ Xuất (ID)</span>
              <span className="summary-val mono-text font-black text-error bg-error/10 px-3 py-1.5 rounded-lg truncate text-lg shadow-inner ring-1 ring-error/20">{voucherData.id}</span>
            </div>
            
            <div className="summary-section flex flex-col gap-2 mb-6 relative z-10">
              <span className="summary-label text-xs uppercase font-bold text-muted tracking-wider ml-1">Đơn vị tiếp nhận</span>
              <div className="supplier-preview bg-black/40 border border-light/50 p-4 rounded-xl flex items-center gap-3 shadow-inner ring-1 ring-black">
                <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center shrink-0 border border-error/20">
                   <User size={18} className="text-error" />
                </div>
                <span className="summary-val font-bold truncate text-white text-[15px]">{voucherData.recipient || <i className="text-muted/50 font-medium">Chưa cung cấp thông tin...</i>}</span>
              </div>
            </div>

            <div className="summary-section flex justify-between items-center mb-8 relative z-10 px-2">
              <span className="summary-label text-sm uppercase font-bold text-muted">Số Dòng Mã Hàng</span>
              <span className="summary-val font-black bg-gradient-to-r from-error/20 to-orange-500/20 shadow-inner px-4 py-1.5 rounded-full border border-error/20 flex gap-2 items-center text-error"><Package size={16}/> <span className="text-lg">{selectedProducts.length}</span></span>
            </div>

            <div className="summary-section no-border border-t border-dashed border-white/20 pt-8 mt-2 relative z-10">
              <span className="summary-label font-black text-white uppercase tracking-widest block mb-3 drop-shadow flex items-center gap-2"><ArrowUpRight size={18} className="text-error"/> Tổng Lưu Lượng Xuất</span>
              <div className="bg-black/60 p-5 rounded-2xl border border-white/5 shadow-inner">
                 <span className="summary-val text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-red-400 via-error to-orange-500 drop-shadow flex items-baseline gap-2">{formatNumber(totalPreviewItems)} <span className="text-lg text-muted/50 font-bold uppercase tracking-widest">Units</span></span>
              </div>
            </div>

            <div className={`draft-badge mt-10 relative z-10 overflow-hidden flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all duration-500 ${voucherData.recipient || selectedProducts.length > 0 ? 'border-green-500/30 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.1)]' : 'border-light/50 bg-black/30'}`}>
              <div className="flex items-center gap-2 font-bold mb-1">
                 <Save size={18} className={voucherData.recipient || selectedProducts.length > 0 ? 'text-green-400' : 'text-muted'} /> 
                 <span className={voucherData.recipient || selectedProducts.length > 0 ? 'text-green-400 tracking-wide' : 'text-muted'}>Lưu nháp thời gian thực</span>
              </div>
              <span className="text-[10px] text-muted/60 uppercase font-bold text-center leading-relaxed">Local Storage Synced</span>
            </div>

            {user && (
              <div className="mt-6 relative z-10 flex flex-col items-center justify-center border-t border-white/5 pt-6">
                 <span className="text-[10px] text-muted/80 uppercase font-black tracking-[0.2em] mb-3">Kết nối Phiên Quyền Hạn</span>
                 <span className={`font-black px-4 py-2 rounded-xl uppercase tracking-widest shadow-xl flex gap-2 items-center text-sm border ${user.role === 'admin' ? 'bg-error/20 text-error border-error/50 ring-1 ring-error/30' : user.role === 'manager' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50 ring-1 ring-orange-500/30' : 'bg-primary/20 text-white border-primary/50 ring-1 ring-primary/30'}`}>HỦY QUYỀN {user.role}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Outbound
