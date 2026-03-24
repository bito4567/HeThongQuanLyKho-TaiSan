import { useState } from 'react'
import { ClipboardCheck, Search, Plus, Trash2, Save, ArrowRight, ArrowLeft, AlertCircle, CheckCircle, Package, Loader2 } from 'lucide-react'
import { useInventory } from '../hooks/useInventory'
import { useAuth } from '../hooks/useAuth'
import './Audit.css' // We will reuse some classes from Inbound/Outbound and add specific ones

const Audit = () => {
  const { inventory, addTransaction, updateStock } = useInventory()
  const { user } = useAuth()
  
  const generateId = () => {
    const d = new Date()
    return `KQT-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
  }

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [voucherData, setVoucherData] = useState({
    id: generateId(),
    notes: '',
    date: new Date().toISOString().split('T')[0],
    type: 'AUDIT',
    createdBy: user?.name || 'Hệ thống'
  })
  
  const [auditItems, setAuditItems] = useState([])
  const [errors, setErrors] = useState({})

  const filteredInventory = inventory.filter(item => 
    !auditItems.find(a => a.id === item.id) &&
    (item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     item.id.toLowerCase().includes(searchTerm.toLowerCase()))
  ).slice(0, 10)

  const addAllToAudit = () => {
    const allItems = inventory.map(item => ({
      ...item,
      expected: item.stock,
      actual: item.stock // default to matching
    }))
    setAuditItems(allItems)
  }

  const handleVoucherChange = (e) => {
    setVoucherData({ ...voucherData, [e.target.name]: e.target.value })
  }

  const addProductToAudit = (product) => {
    setAuditItems([...auditItems, { 
      ...product, 
      expected: product.stock, 
      actual: product.stock 
    }])
    setSearchTerm('')
    setErrors({})
  }

  const removeProduct = (id) => {
    setAuditItems(auditItems.filter(p => p.id !== id))
  }

  const updateActual = (id, val) => {
    const actualVal = val === '' ? '' : parseInt(val)
    setAuditItems(auditItems.map(p => 
      p.id === id ? { ...p, actual: actualVal } : p
    ))
  }

  const processAudit = () => {
    setLoading(true)
    setTimeout(() => {
      const isStaff = user?.role === 'staff'
      const finalStatus = isStaff ? 'Pending' : 'Approved'
      
      const finalItems = auditItems.map(item => ({
        ...item,
        actual: parseInt(item.actual || 0)
      }))

      const tx = {
        ...voucherData,
        status: finalStatus,
        totalItems: finalItems.length,
        items: finalItems,
        timestamp: new Date().toISOString()
      }

      if (!isStaff) {
        // Apply instantly
        finalItems.forEach(item => {
          const diff = item.actual - item.expected
          if (diff !== 0) {
            updateStock(item.id, diff)
          }
        })
      }

      addTransaction(tx)
      setVoucherData(tx)
      setLoading(false)
      setStep(3)
    }, 1500)
  }

  const discrepancyCount = auditItems.filter(i => (parseInt(i.actual || 0) - i.expected) !== 0).length

  return (
    <div className="audit-container animate-fade-in">
      <header className="mb-8 flex items-center gap-4">
        <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-xl"><ClipboardCheck size={32} /></div>
        <div>
          <h1 className="text-3xl font-bold mb-1">Kiểm Kê Tồn Kho</h1>
          <p className="text-muted">Đối chiếu số lượng thực tế tại kho so với hệ thống phần mềm.</p>
        </div>
      </header>

      {step < 3 && (
        <div className="wizard-stepper glass-card flex justify-center mb-6 p-4 rounded-xl max-w-2xl mx-auto">
          <div className="flex gap-4 items-center">
            <span className={`px-4 py-2 rounded-lg font-bold ${step === 1 ? 'bg-primary text-white' : 'text-muted'}`}>1. Chọn & Kiểm Đếm</span>
            <ArrowRight size={20} className="text-muted" />
            <span className={`px-4 py-2 rounded-lg font-bold ${step === 2 ? 'bg-accent text-white' : 'text-muted'}`}>2. Xác Nhận Lệch Kho</span>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="glass-card p-6 animate-fade-in fade-up">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-4">Thông tin Phiếu Kiểm Kê</h3>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div>
                  <label className="block text-sm text-muted mb-1 font-bold uppercase">Mã Phiếu</label>
                  <input type="text" value={voucherData.id} className="form-input opacity-70 font-mono" disabled />
                </div>
                <div>
                  <label className="block text-sm text-muted mb-1 font-bold uppercase">Ngày Kiểm</label>
                  <input type="date" name="date" value={voucherData.date} onChange={handleVoucherChange} className="form-input" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-muted mb-1 font-bold uppercase">Ghi chú / Khu vực</label>
                  <input type="text" name="notes" placeholder="VD: Kiểm kê định kỳ kho A..." value={voucherData.notes} onChange={handleVoucherChange} className="form-input" />
                </div>
              </div>

              <div className="flex justify-between items-center mb-4 pb-2 border-b border-light">
                <h3 className="text-xl font-bold">Thêm Sản Phẩm</h3>
                <button className="text-sm text-primary hover:underline font-bold" onClick={addAllToAudit}>+ Thêm Toàn Bộ Kho</button>
              </div>

              <div className="search-bar glass-card flex items-center px-4 py-3 gap-2 mb-4">
                <Search size={18} className="text-muted" />
                <input 
                  type="text" 
                  placeholder="Quét mã SKU hoặc nhập tên..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none outline-none text-main flex-1 font-bold text-lg"
                  autoFocus
                />
              </div>

              {searchTerm && filteredInventory.length > 0 && (
                <div className="glass-card mb-6 overflow-hidden border border-primary/30">
                  {filteredInventory.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-3 border-b border-light/30 hover:bg-white/5 cursor-pointer" onClick={() => addProductToAudit(item)}>
                      <div>
                        <p className="font-bold">{item.name}</p>
                        <p className="text-xs font-mono text-primary">{item.id} • Hệ thống: {item.stock}</p>
                      </div>
                      <Plus size={20} className="text-primary" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-[1.5]">
              <div className="bg-black/20 rounded-xl p-4 border border-light h-full flex flex-col">
                <h3 className="text-lg font-bold flex justify-between items-center mb-4">
                  <span>Sản phẩm đang kiểm đếm ({auditItems.length})</span>
                  {errors.items && <span className="text-error text-sm"><AlertCircle size={14} className="inline mr-1"/>{errors.items}</span>}
                </h3>
                
                {auditItems.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted opacity-50 py-12">
                    <ClipboardCheck size={64} className="mb-4" />
                    <p>Chưa có sản phẩm nào được chọn.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-xs uppercase text-muted border-b border-light">
                          <th className="pb-2">Sản phẩm</th>
                          <th className="pb-2 text-center w-24">Hệ Thống</th>
                          <th className="pb-2 text-center w-24">Thực Tế</th>
                          <th className="pb-2 text-center w-16">Lệch</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditItems.map(item => {
                          const actual = parseInt(item.actual || 0)
                          const diff = actual - item.expected
                          return (
                            <tr key={item.id} className="border-b border-light/30">
                              <td className="py-3 pr-2">
                                <p className="font-bold text-sm leading-tight">{item.name}</p>
                                <p className="text-[10px] font-mono opacity-70 mt-1">{item.id}</p>
                              </td>
                              <td className="py-3 text-center opacity-70 font-mono font-bold text-lg">{item.expected}</td>
                              <td className="py-3 text-center">
                                <input 
                                  type="number" 
                                  className={`w-full bg-surface border rounded-md p-2 text-center font-bold text-lg ${diff !== 0 ? 'border-accent text-accent' : 'border-light text-main'}`}
                                  value={item.actual}
                                  onChange={e => updateActual(item.id, e.target.value)}
                                  min="0"
                                />
                              </td>
                              <td className="py-3 text-center">
                                <span className={`font-bold ${diff > 0 ? 'text-secondary' : diff < 0 ? 'text-error' : 'opacity-50'}`}>
                                  {diff > 0 ? `+${diff}` : diff}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                <button className="p-2 text-muted hover:text-error hover:bg-error/10 rounded-md transition-colors" onClick={() => removeProduct(item.id)}>
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="form-actions justify-end mt-8 pt-6 border-t border-light">
            <button className="btn-primary large-btn" onClick={() => {
              if (auditItems.length === 0) {
                setErrors({items: "Phải chọn ít nhất 1 sản phẩm"})
                return
              }
              setStep(2)
            }}>
              Tiếp tục Xác nhận <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="glass-card p-6 max-w-2xl mx-auto animate-fade-in fade-up">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Xác Nhận Lệch Kho</h2>
            <p className="text-muted">Tổng kết biên bản kiểm kê và chuẩn bị tạo chứng từ.</p>
          </div>

          <div className="bg-black/20 border border-light rounded-xl p-6 mb-8">
            <div className="flex justify-between border-b border-light pb-4 mb-4">
              <span className="text-muted">Mã Phiếu:</span>
              <span className="font-mono font-bold text-primary">{voucherData.id}</span>
            </div>
            <div className="flex justify-between border-b border-light pb-4 mb-4">
              <span className="text-muted">Tổng sản phẩm kiểm:</span>
              <span className="font-bold">{auditItems.length} SKU</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted block">Số sản phẩm Lệch:</span>
              <span className={`text-2xl font-bold ${discrepancyCount > 0 ? 'text-accent' : 'text-secondary'}`}>
                {discrepancyCount} <span className="text-sm font-normal">SKU</span>
              </span>
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center animate-pulse">
              <Loader2 size={48} className="animate-spin text-primary mx-auto mb-4" />
              <h3 className="font-bold">Đang xử lý chứng từ...</h3>
            </div>
          ) : (
            <>
              {user?.role === 'staff' ? (
                <div className="flex gap-4 p-4 rounded-xl bg-primary/10 border border-primary/30 text-primary mb-8">
                  <AlertCircle size={24} className="shrink-0" />
                  <p className="text-sm">Phiếu kiểm kê này sẽ được lưu nháp dưới dạng <strong>CHỜ DUYỆT</strong>. Bạn cần chờ Quản lý phê chuẩn để số liệu lệch thực sự được cập nhật vào Hệ thống.</p>
                </div>
              ) : (
                <div className="flex gap-4 p-4 rounded-xl bg-error/10 border border-error/30 text-error mb-8">
                  <AlertCircle size={24} className="shrink-0" />
                  <p className="text-sm">Bạn đang duyệt quyền Quản lý. Hành động này sẽ <strong>CẬP NHẬT TRỰC TIẾP</strong> số lượng tồn kho theo số liệu thực tế vừa đếm được.</p>
                </div>
              )}

              <div className="flex justify-between">
                <button className="btn-secondary px-6" onClick={() => setStep(1)} disabled={loading}>
                  <ArrowLeft size={18} className="mr-2 inline" /> Quay lại
                </button>
                <button className="btn-primary px-8 flex items-center gap-2" onClick={processAudit} disabled={loading}>
                  <Save size={18} /> {user?.role === 'staff' ? 'Gửi Yêu Cầu Duyệt' : 'Xác Nhận & Cập Nhật Lệch Kho'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="glass-card p-10 max-w-xl mx-auto text-center animate-fade-in scale-up">
          <CheckCircle size={80} className="text-secondary mx-auto mb-6 animate-bounce" />
          <h1 className="text-3xl font-bold mb-4">
            {voucherData.status === 'Pending' ? 'Đã Nộp Biên Bản!' : 'Kiểm Kê Hoàn Tất!'}
          </h1>
          <p className="text-muted leading-relaxed mb-8">
            Chứng từ kiểm kê <strong className="font-mono text-main">{voucherData.id}</strong> đã được ghi nhận vào hệ thống.
            {voucherData.status === 'Pending' 
              ? ` Phiếu hiện đang Đợi Phê Duyệt từ cấp quản lý. Có tổng cộng ${discrepancyCount} SKU bị lệch.` 
              : ` Dữ liệu lệch của ${discrepancyCount} SKU đã được ghi đè thành công thành Tồn kho hiện tại.`}
          </p>
          <div className="flex justify-center gap-4">
            <button className="btn-secondary" onClick={() => window.location.href = '/reports'}>Xem Báo Cáo</button>
            <button className="btn-primary" onClick={() => window.location.reload()}>Tạo Lượt Mới</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Audit
