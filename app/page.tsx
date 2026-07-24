'use client';

import React, { useState } from 'react';

export default function POSSystem() {
  const [activeTab, setActiveTab] = useState('pos');
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [salesperson, setSalesperson] = useState('管理員');
  
  // 結帳付款方式多組支援
  const [payments, setPayments] = useState<any[]>([
    { method: '現金', amount: 0, installments: '3' }
  ]);

  // 搜尋與篩選狀態
  const [productSearch, setProductSearch] = useState('');
  const [recordSearch, setRecordSearch] = useState('');
  const [filterSalesperson, setFilterSalesperson] = useState('全部門市人員');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [dateFilterMode, setDateFilterMode] = useState('all');

  // 共用資料狀態（讓方案管理與新品庫存管理能與銷貨同步）
  const [plans, setPlans] = useState([
    { id: 'pl1', name: '中華電信 5G 1399 (30個月)', telecom: '中華電信', monthlyFee: 1399, storeRebate: 12000 },
    { id: 'pl2', name: '台灣大哥大 5G 999 (24個月)', telecom: '台灣大哥大', monthlyFee: 999, storeRebate: 8500 },
    { id: 'pl3', name: '遠傳電信 5G 799 (24個月)', telecom: '遠傳電信', monthlyFee: 799, storeRebate: 6000 }
  ]);

  const [products, setProducts] = useState([
    { id: 'p1', name: '滿版保貼', price: 200, cost: 50, stock: 10, category: '配件' },
    { id: 'p2', name: 'AIR6皮套', price: 200, cost: 70, stock: 8, category: '配件' },
    { id: 'p3', name: 'iPhone 15 128G', price: 25900, cost: 23000, stock: 3, category: '手機' },
  ]);

  // 新增方案管理頁面的暫存輸入
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanTelecom, setNewPlanTelecom] = useState('中華電信');
  const [newPlanMonthly, setNewPlanMonthly] = useState(1399);
  const [newPlanRebate, setNewPlanRebate] = useState(5000);

  // 新增庫存管理頁面的暫存輸入
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState(0);
  const [newProdCost, setNewProdCost] = useState(0);
  const [newProdStock, setNewProdStock] = useState(10);
  const [newProdCategory, setNewProdCategory] = useState('配件');

  // 彈窗狀態
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planSearch, setPlanSearch] = useState('');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customType, setCustomType] = useState<'自訂配件/商品' | '維修服務'>('自訂配件/商品');
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState(0);
  const [customCost, setCustomCost] = useState(0);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // 銷售紀錄展開明細
  const [expandedRecordIds, setExpandedRecordIds] = useState<string[]>([]);

  // 模擬銷售紀錄
  const [salesRecords, setSalesRecords] = useState([
    {
      id: 'r1',
      orderNo: 'POS20260330001',
      date: '2026-03-30 14:20',
      customerName: '王小明',
      salesperson: '管理員',
      paymentInfo: '現金',
      totalAmount: 26100,
      profit: 2900,
      items: [
        { name: 'iPhone 15 128G', quantity: 1, price: 25900, cost: 23000 },
        { name: '滿版保貼', quantity: 1, price: 200, cost: 50 }
      ]
    }
  ]);

  // 計算小計與費用
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // 手續費計算邏輯
  const calculatePaymentFees = () => {
    let totalFee = 0;
    const details = payments.map(p => {
      let rate = 0;
      const amt = Number(p.amount) || 0;
      if (p.method === '刷卡') rate = 0.02;
      else if (p.method === '刷卡分期') {
        if (p.installments === '3') rate = 0.03;
        else if (p.installments === '6') rate = 0.035;
        else if (p.installments === '12') rate = 0.045;
        else if (p.installments === '24') rate = 0.06;
      }
      const fee = Math.round(amt * rate);
      totalFee += fee;
      return { ...p, rate, fee };
    });
    return { details, totalFee };
  };

  const { details: paymentDetails, totalFeeAmount } = calculatePaymentFees();
  const totalAmountWithFee = subtotal + totalFeeAmount;
  const totalProfit = cart.reduce((sum, item) => sum + ((item.price - item.cost) * item.quantity), 0) - totalFeeAmount;

  // 加入購物車
  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const addPlanToCart = (plan: any) => {
    setCart(prev => [
      ...prev,
      {
        id: plan.id,
        name: `[方案] ${plan.name} (月租: $${plan.monthlyFee})`,
        price: 0,
        cost: -plan.storeRebate,
        quantity: 1
      }
    ]);
    setIsPlanModalOpen(false);
  };

  const handleAddCustomItem = () => {
    if (!customName) return;
    setCart(prev => [
      ...prev,
      {
        id: 'custom_' + Date.now(),
        name: `[${customType}] ${customName}`,
        price: customPrice,
        cost: customCost,
        quantity: 1
      }
    ]);
    setIsCustomModalOpen(false);
    setCustomName('');
    setCustomPrice(0);
    setCustomCost(0);
  };

  const handleCreateCustomer = () => {
    if (!newCustName) return;
    const newCust = { id: 'cust_' + Date.now(), name: newCustName, phone: newCustPhone || '未提供' };
    setSelectedCustomer(newCust);
    setIsCustomerModalOpen(false);
    setNewCustName('');
    setNewCustPhone('');
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('購物車是空的');
      return;
    }
    const newRecord = {
      id: 'r_' + Date.now(),
      orderNo: 'POS' + new Date().toISOString().slice(0,10).replace(/-/g,'') + Math.floor(100 + Math.random() * 900),
      date: new Date().toLocaleString(),
      customerName: selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.phone})` : '散客',
      salesperson,
      paymentInfo: payments.map(p => `${p.method}${p.method === '刷卡分期' ? `(${p.installments}期)` : ''}`).join(', '),
      totalAmount: totalAmountWithFee,
      profit: totalProfit,
      items: [...cart]
    };
    setSalesRecords([newRecord, ...salesRecords]);
    setCart([]);
    setSelectedCustomer(null);
    alert('結帳成功！');
  };

  const toggleExpandRecord = (id: string) => {
    setExpandedRecordIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleDateFilterPreset = (mode: string) => {
    setDateFilterMode(mode);
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().slice(0, 10);
    if (mode === 'today') {
      setDateStart(formatDate(today));
      setDateEnd(formatDate(today));
    } else if (mode === 'week') {
      const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
      setDateStart(formatDate(firstDay));
      setDateEnd(formatDate(new Date()));
    } else if (mode === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setDateStart(formatDate(firstDay));
      setDateEnd(formatDate(new Date()));
    } else {
      setDateStart('');
      setDateEnd('');
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));
  const filteredPlans = plans.filter(pl => pl.name.toLowerCase().includes(planSearch.toLowerCase()) || pl.telecom.includes(planSearch));

  const filteredRecords = salesRecords.filter(r => {
    const matchSearch = r.orderNo.toLowerCase().includes(recordSearch.toLowerCase()) ||
                          r.customerName.toLowerCase().includes(recordSearch.toLowerCase()) ||
                          r.salesperson.toLowerCase().includes(recordSearch.toLowerCase()) ||
                          r.items.some(it => it.name.toLowerCase().includes(recordSearch.toLowerCase()));
    const matchSalesperson = filterSalesperson === '全部門市人員' || r.salesperson === filterSalesperson;
    return matchSearch && matchSalesperson;
  });

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 p-6 space-y-4">
      {/* 頂部快速切換橫條 */}
      <div className="flex justify-between items-center bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-200/60">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">快速切換：</span>
          <button
            onClick={() => setActiveTab('pos')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${activeTab === 'pos' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            🛒 銷貨結帳
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${activeTab === 'records' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            📄 銷售紀錄
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${activeTab === 'reports' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            📊 業績報表
          </button>
        </div>
        <div className="text-xs text-slate-500 font-medium">
          目前身份：<span className="font-bold text-slate-800">管理員</span>
        </div>
      </div>

      {activeTab === 'pos' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-slate-800">銷貨結帳</h1>
            <p className="text-xs text-slate-400 mt-0.5">選取方案不代入月租，金額可自由手動修改，佣金自動計入毛利。</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 左側：方案與商品清單 */}
            <div className="lg:col-span-8 flex flex-col space-y-4">
              {/* 方案選擇區 */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">選擇方案</span>
                  <button
                    onClick={() => setIsPlanModalOpen(true)}
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    + 代入電信方案
                  </button>
                </div>
                <div
                  onClick={() => setIsPlanModalOpen(true)}
                  className="p-4 bg-slate-50 hover:bg-blue-50/50 border border-slate-200/80 rounded-2xl cursor-pointer transition flex justify-between items-center"
                >
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>💡 點擊開啟方案選擇視窗（直接讀取方案管理資料）</span>
                  </div>
                  <span className="text-xs font-bold bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-blue-600">
                    選擇方案
                  </span>
                </div>
              </div>

              {/* 加入商品區 */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">加入商品 (即時讀取「新品庫存管理」與新增商品)</span>
                </div>
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="搜尋商品名稱 / 商品編號 / IMEI / 序號..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs"
                />
                <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                  {filteredProducts.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">目前沒有相符的庫存商品</p>
                  ) : (
                    filteredProducts.map(p => (
                      <div
                        key={p.id}
                        className="p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 rounded-2xl flex justify-between items-center transition"
                      >
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{p.name} <span className="text-[10px] text-slate-400 font-mono font-normal">({p.category})</span></p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">庫存: {p.stock} | 成本: ${p.cost}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-mono font-bold text-slate-800 text-sm">${p.price}</span>
                          <button
                            onClick={() => addToCart(p)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                          >
                            + 加入
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* 右側：購物車與結帳 */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 flex flex-col justify-between space-y-4">
              <div className="space-y-4 overflow-y-auto flex-1 pr-1">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 text-sm">購物車明細</h3>
                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      {cart.length}
                    </span>
                  </div>
                  {cart.length > 0 && (
                    <button onClick={() => setCart([])} className="text-[10px] text-slate-400 hover:text-rose-600 font-bold">
                      清空
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">客戶 (選填，個人貴賓可不選)</span>
                    {!selectedCustomer && (
                      <button onClick={() => setIsCustomerModalOpen(true)} className="text-blue-600 font-bold hover:underline">
                        + 快速建立會員
                      </button>
                    )}
                  </div>
                  {selectedCustomer ? (
                    <div className="flex justify-between items-center bg-blue-50/50 p-2.5 rounded-2xl border border-blue-100 text-xs">
                      <span className="font-bold text-blue-700">{selectedCustomer.name} ({selectedCustomer.phone})</span>
                      <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-rose-600 font-bold">×</button>
                    </div>
                  ) : (
                    <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-xs text-slate-400">
                      尚未選取客戶
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {cart.length === 0 ? (
                    <p className="text-center py-12 text-xs text-slate-400">尚未加入品項或方案</p>
                  ) : (
                    cart.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">${item.price} × {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-slate-700">${item.price * item.quantity}</span>
                          <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-rose-600 font-bold">×</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={() => setIsCustomModalOpen(true)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs transition border border-dashed border-slate-300"
                >
                  + 自訂項目 / 🛠️ 維修項目
                </button>

                {/* 付款方式 */}
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700">付款方式與期數</span>
                    <button onClick={() => setPayments([...payments, { method: '現金', amount: 0, installments: '3' }])} className="text-blue-600 font-bold hover:underline">
                      + 新增付款方式
                    </button>
                  </div>
                  {payments.map((p, pIdx) => {
                    const singleFee = paymentDetails[pIdx]?.fee || 0;
                    return (
                      <div key={pIdx} className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 space-y-2">
                        <div className="flex gap-2 items-center">
                          <select
                            value={p.method}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPayments(payments.map((item, idx) => idx === pIdx ? { ...item, method: val } : item));
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 text-xs"
                          >
                            <option value="現金">現金</option>
                            <option value="轉帳/匯款">轉帳/匯款</option>
                            <option value="刷卡">刷卡</option>
                            <option value="刷卡分期">刷卡分期</option>
                          </select>
                          {payments.length > 1 && (
                            <button onClick={() => setPayments(payments.filter((_, idx) => idx !== pIdx))} className="text-slate-400 hover:text-rose-600 font-bold">×</button>
                          )}
                        </div>
                        {p.method === '刷卡分期' && (
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-slate-500">分期期數：</span>
                            <select
                              value={p.installments}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPayments(payments.map((item, idx) => idx === pIdx ? { ...item, installments: val } : item));
                              }}
                              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium text-xs"
                            >
                              <option value="3">3期</option>
                              <option value="6">6期</option>
                              <option value="12">12期</option>
                              <option value="24">24期</option>
                            </select>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                          <span>手續費率: {paymentDetails[pIdx]?.rate * 100}%</span>
                          <span className="text-amber-600 font-medium">手續費加成: +${singleFee}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>預估總毛利：</span>
                  <span className="font-mono">+${isNaN(totalProfit) ? 0 : totalProfit}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-800 pt-1">
                  <span>總金額：</span>
                  <span className="font-mono text-rose-600">${isNaN(totalAmountWithFee) ? 0 : totalAmountWithFee}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-xs shadow-md transition"
              >
                確認結帳收款
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 方案管理頁面 */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">方案管理</h1>
            <p className="text-xs text-slate-400 mt-0.5">在此新增或維護電信方案，新增後將同步連動至銷貨結帳頁面。</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
            <h3 className="text-sm font-bold text-slate-800">+ 新增電信方案</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <input
                type="text"
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                placeholder="方案名稱 (例如: 5G 1399)"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
              />
              <select
                value={newPlanTelecom}
                onChange={(e) => setNewPlanTelecom(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
              >
                <option value="中華電信">中華電信</option>
                <option value="台灣大哥大">台灣大哥大</option>
                <option value="遠傳電信">遠傳電信</option>
              </select>
              <input
                type="number"
                value={newPlanMonthly}
                onChange={(e) => setNewPlanMonthly(Number(e.target.value))}
                placeholder="月租費"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
              />
              <input
                type="number"
                value={newPlanRebate}
                onChange={(e) => setNewPlanRebate(Number(e.target.value))}
                placeholder="門市佣金/退佣"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
              />
            </div>
            <button
              onClick={() => {
                if (!newPlanName) return;
                setPlans([...plans, { id: 'pl_' + Date.now(), name: newPlanName, telecom: newPlanTelecom, monthlyFee: newPlanMonthly, storeRebate: newPlanRebate }]);
                setNewPlanName('');
                alert('成功新增方案！');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              儲存新方案
            </button>

            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 mb-3">現有方案清單</h4>
              <div className="space-y-2">
                {plans.map(pl => (
                  <div key={pl.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{pl.name} <span className="text-[10px] text-slate-400 font-mono">({pl.telecom})</span></p>
                      <p className="text-[10px] text-slate-500">月租: ${pl.monthlyFee} | 佣金: ${pl.storeRebate}</p>
                    </div>
                    <button onClick={() => setPlans(plans.filter(p => p.id !== pl.id))} className="text-rose-600 font-bold hover:underline">刪除</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新品庫存管理頁面 */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">新品庫存管理</h1>
            <p className="text-xs text-slate-400 mt-0.5">在此新增商品或調整庫存，新增的商品將直接同步至銷貨結帳頁面。</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
            <h3 className="text-sm font-bold text-slate-800">+ 新增庫存商品</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
              <input
                type="text"
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
                placeholder="商品名稱"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 md:col-span-2"
              />
              <select
                value={newProdCategory}
                onChange={(e) => setNewProdCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
              >
                <option value="配件">配件</option>
                <option value="手機">手機</option>
                <option value="平板">平板</option>
                <option value="其他">其他</option>
              </select>
              <input
                type="number"
                value={newProdPrice}
                onChange={(e) => setNewProdPrice(Number(e.target.value))}
                placeholder="售價"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
              />
              <input
                type="number"
                value={newProdCost}
                onChange={(e) => setNewProdCost(Number(e.target.value))}
                placeholder="成本"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
              />
            </div>
            <button
              onClick={() => {
                if (!newProdName) return;
                setProducts([...products, { id: 'p_' + Date.now(), name: newProdName, price: newProdPrice, cost: newProdCost, stock: newProdStock, category: newProdCategory }]);
                setNewProdName('');
                setNewProdPrice(0);
                setNewProdCost(0);
                alert('成功新增商品至庫存！');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              儲存商品並加入庫存
            </button>

            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 mb-3">現有庫存品項</h4>
              <div className="space-y-2">
                {products.map(p => (
                  <div key={p.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{p.name} <span className="text-[10px] text-slate-400 font-mono">({p.category})</span></p>
                      <p className="text-[10px] text-slate-500 font-mono">售價: ${p.price} | 成本: ${p.cost} | 庫存: {p.stock}</p>
                    </div>
                    <button onClick={() => setProducts(products.filter(item => item.id !== p.id))} className="text-rose-600 font-bold hover:underline">刪除</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 銷售紀錄與其他頁面 */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">銷售紀錄</h1>
            <p className="text-xs text-slate-400 mt-0.5">查詢歷史銷貨明細、依日期與門市人員篩選。</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                value={recordSearch}
                onChange={(e) => setRecordSearch(e.target.value)}
                placeholder="搜尋單號、客戶、人員、品名..."
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
              />
              <select
                value={filterSalesperson}
                onChange={(e) => setFilterSalesperson(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
              >
                <option value="全部門市人員">全部門市人員</option>
                <option value="管理員">管理員</option>
              </select>
              <div className="flex gap-1.5 md:col-span-2">
                <input
                  type="date"
                  value={dateStart}
                  onChange={(e) => { setDateStart(e.target.value); setDateFilterMode('custom'); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs"
                />
                <input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => { setDateEnd(e.target.value); setDateFilterMode('custom'); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] text-slate-400">快速篩選：</span>
              <button onClick={() => handleDateFilterPreset('today')} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${dateFilterMode === 'today' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>今天</button>
              <button onClick={() => handleDateFilterPreset('week')} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${dateFilterMode === 'week' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>本週</button>
              <button onClick={() => handleDateFilterPreset('month')} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${dateFilterMode === 'month' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>本月</button>
              <button onClick={() => handleDateFilterPreset('all')} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${dateFilterMode === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>全部</button>
            </div>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium">
                    <th className="pb-3 px-3">單號 / 日期</th>
                    <th className="pb-3 px-3">客戶</th>
                    <th className="pb-3 px-3">銷售人員</th>
                    <th className="pb-3 px-3">付款資訊</th>
                    <th className="pb-3 px-3 text-right">總金額</th>
                    <th className="pb-3 px-3 text-right">毛利</th>
                    <th className="pb-3 px-3 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">目前沒有符合條件的銷售紀錄</td>
                    </tr>
                  ) : (
                    filteredRecords.map((r) => {
                      const isExpanded = expandedRecordIds.includes(r.id);
                      return (
                        <React.Fragment key={r.id}>
                          <tr className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-3">
                              <p className="font-bold text-slate-800 font-mono">{r.orderNo}</p>
                              <p className="text-[10px] text-slate-400">{r.date}</p>
                            </td>
                            <td className="py-3 px-3 font-medium text-slate-700">{r.customerName}</td>
                            <td className="py-3 px-3 text-slate-600">{r.salesperson}</td>
                            <td className="py-3 px-3 text-slate-600">{r.paymentInfo}</td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">${r.totalAmount}</td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">+${r.profit}</td>
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => toggleExpandRecord(r.id)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-600 transition"
                              >
                                {isExpanded ? '收起明細' : '展開明細'}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={7} className="bg-slate-50/60 p-4">
                                <div className="bg-white rounded-2xl p-4 border border-slate-200/60 space-y-2">
                                  <p className="text-xs font-bold text-slate-700">購買品項明細：</p>
                                  <div className="space-y-1.5">
                                    {r.items.map((it, idx) => (
                                      <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-50 pb-1.5">
                                        <span className="font-medium text-slate-800">{it.name} × {it.quantity}</span>
                                        <span className="font-mono text-slate-600">單價: ${it.price} | 成本: ${it.cost}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">業績報表</h1>
            <p className="text-xs text-slate-400 mt-0.5">即時統計門市總營收、毛利與銷售筆數。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-2">
              <p className="text-xs text-slate-400 font-medium">總營業額</p>
              <p className="text-2xl font-black font-mono text-slate-800">
                ${salesRecords.reduce((sum, r) => sum + r.totalAmount, 0)}
              </p>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-2">
              <p className="text-xs text-slate-400 font-medium">總毛利</p>
              <p className="text-2xl font-black font-mono text-emerald-600">
                +${salesRecords.reduce((sum, r) => sum + r.profit, 0)}
              </p>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-2">
              <p className="text-xs text-slate-400 font-medium">總銷售筆數</p>
              <p className="text-2xl font-black font-mono text-blue-600">
                {salesRecords.length} 筆
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 方案選擇彈窗 */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">選擇電信方案（來自方案管理）</h3>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">×</button>
            </div>
            <input
              type="text"
              value={planSearch}
              onChange={(e) => setPlanSearch(e.target.value)}
              placeholder="搜尋方案名稱或電信商..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
            />
            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredPlans.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">尚無方案，請至「方案管理」新增</p>
              ) : (
                filteredPlans.map(pl => (
                  <div
                    key={pl.id}
                    onClick={() => addPlanToCart(pl)}
                    className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-2xl cursor-pointer flex justify-between items-center transition text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{pl.name} <span className="text-[10px] text-slate-400 font-mono">({pl.telecom})</span></p>
                      <p className="text-[10px] text-slate-500">月租: ${pl.monthlyFee} | 佣金(毛利折抵): ${pl.storeRebate}</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-bold">+ 代入方案</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 自訂項目彈窗 */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">新增自訂 / 維修項目</h3>
              <button onClick={() => setIsCustomModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">×</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 block mb-1">類型</label>
                <select
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                >
                  <option value="自訂配件/商品">自訂配件/商品</option>
                  <option value="維修服務">維修服務</option>
                </select>
              </div>
              <div>
                <label className="text-slate-500 block mb-1">項目名稱</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="例如：螢幕破裂維修、包膜..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">售價 ($)</label>
                <input
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">成本 ($)</label>
                <input
                  type="number"
                  value={customCost}
                  onChange={(e) => setCustomCost(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                />
              </div>
            </div>
            <button
              onClick={handleAddCustomItem}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition"
            >
              確認新增至購物車
            </button>
          </div>
        </div>
      )}

      {/* 快速新增會員彈窗 */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">快速建立會員</h3>
              <button onClick={() => setIsCustomerModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">×</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 block mb-1">客戶姓名</label>
                <input
                  type="text"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="請輸入姓名"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">聯絡電話</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="請輸入電話"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
            </div>
            <button
              onClick={handleCreateCustomer}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition"
            >
              建立並選取客戶
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
