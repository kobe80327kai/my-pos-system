'use client';

import React, { useState } from 'react';

export default function POSSystem() {
  const [activeTab, setActiveTab] = useState('pos');
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [salesperson, setSalesperson] = useState('管理員');
  
  // 結帳付款方式多組支援（預設金額給 0 避免 NaN）
  const [payments, setPayments] = useState<any[]>([
    { method: '現金', amount: 0, installments: '3' }
  ]);

  // 搜尋與篩選狀態
  const [productSearch, setProductSearch] = useState('');
  const [recordSearch, setRecordSearch] = useState('');
  const [filterSalesperson, setFilterSalesperson] = useState('全部門市人員');
  const [filterCustomerType, setFilterCustomerType] = useState('全部客戶類型');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [dateFilterMode, setDateFilterMode] = useState('all');

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

  // 模擬商品資料庫
  const products = [
    { id: 'p1', name: 'iPhone 15 Pro (256G)', price: 36900, cost: 33000, stock: 10, category: '手機' },
    { id: 'p2', name: 'iPhone 15 (128G)', price: 29900, cost: 26500, stock: 15, category: '手機' },
    { id: 'p3', name: 'AirPods Pro 2', price: 7490, cost: 5800, stock: 20, category: '配件' },
    { id: 'p4', name: '20W 快速充電器', price: 590, cost: 250, stock: 50, category: '配件' },
  ];

  // 模擬電信方案資料庫
  const plans = [
    { id: 'pl1', name: '中華電信 5G 1399 (30個月)', telecom: '中華電信', monthlyFee: 1399, storeRebate: 12000 },
    { id: 'pl2', name: '台灣大哥大 5G 999 (24個月)', telecom: '台灣大哥大', monthlyFee: 999, storeRebate: 8500 },
    { id: 'pl3', name: '遠傳電信 5G 799 (24個月)', telecom: '遠傳電信', monthlyFee: 799, storeRebate: 6000 },
  ];

  // 模擬銷售紀錄
  const [salesRecords, setSalesRecords] = useState([
    {
      id: 'r1',
      orderNo: 'POS20260330001',
      date: '2026-03-30 14:20',
      customerName: '王小明',
      salesperson: '管理員',
      paymentInfo: '現金',
      totalAmount: 37490,
      profit: 4180,
      items: [
        { name: 'iPhone 15 Pro (256G)', quantity: 1, price: 36900, cost: 33000 },
        { name: '20W 快速充電器', quantity: 1, price: 590, cost: 250 }
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
        name: `[電信方案] ${plan.name}`,
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
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
      {/* 唯一正確的側邊導覽列 */}
      <div className="w-64 bg-slate-950 flex flex-col justify-between border-r border-slate-800/60 shrink-0">
        <div className="p-5 space-y-6">
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">POS 門市系統</h2>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">v1.0.0</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase px-3 pb-1">主要功能</p>
            <button
              onClick={() => setActiveTab('pos')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${activeTab === 'pos' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
            >
              <span>控制台 (POS)</span>
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${activeTab === 'records' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
            >
              <span>銷售紀錄</span>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${activeTab === 'reports' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
            >
              <span>業績報表</span>
            </button>
          </div>
        </div>
        <div className="p-4 bg-slate-900/40 border-t border-slate-800/60 m-3 rounded-2xl">
          <p className="text-xs font-bold text-slate-200">管理員</p>
          <p className="text-[10px] text-slate-400 truncate">admin@pos.com</p>
        </div>
      </div>

      {/* 主要內容區 */}
      <div className="flex-1 bg-slate-50 text-slate-800 overflow-y-auto p-6">
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            {/* 左側：商品與方案選擇 */}
            <div className="lg:col-span-7 flex flex-col space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="搜尋商品名稱、條碼..."
                  className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs shadow-sm"
                />
                <button
                  onClick={() => setIsPlanModalOpen(true)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-sm transition shrink-0"
                >
                  + 辦理門號方案
                </button>
                <button
                  onClick={() => setIsCustomModalOpen(true)}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-bold shadow-sm transition shrink-0"
                >
                  + 自訂/維修
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto pr-1">
                {filteredProducts.map(p => (
                  <div
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="bg-white p-4 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-blue-400 cursor-pointer transition flex flex-col justify-between space-y-2"
                  >
                    <div>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">{p.category}</span>
                      <h4 className="font-bold text-slate-800 text-xs mt-2 line-clamp-2">{p.name}</h4>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="font-mono font-black text-blue-600 text-sm">${p.price}</span>
                      <span className="text-[10px] text-slate-400 font-mono">庫存: {p.stock}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 右側：結帳與購物車 */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 flex flex-col justify-between space-y-4">
              <div className="space-y-4 overflow-y-auto flex-1 pr-1">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-800 text-sm">目前結帳車</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">客戶：</span>
                    {selectedCustomer ? (
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-xl">
                        {selectedCustomer.name}
                      </span>
                    ) : (
                      <button
                        onClick={() => setIsCustomerModalOpen(true)}
                        className="text-xs text-blue-600 hover:underline font-bold"
                      >
                        + 選擇/建立客戶
                      </button>
                    )}
                  </div>
                </div>

                {/* 購物車品項列表 */}
                <div className="space-y-2">
                  {cart.length === 0 ? (
                    <p className="text-center py-10 text-xs text-slate-400">購物車目前沒有品項</p>
                  ) : (
                    cart.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">${item.price} × {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-slate-700">${item.price * item.quantity}</span>
                          <button
                            onClick={() => setCart(cart.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-rose-600 font-bold"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* 付款方式設定區 */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">付款方式拆分</span>
                    <button
                      onClick={() => setPayments([...payments, { method: '現金', amount: 0, installments: '3' }])}
                      className="text-[10px] text-blue-600 font-bold hover:underline"
                    >
                      + 新增付款方式
                    </button>
                  </div>
                  {payments.map((p, pIdx) => {
                    const singleRate = paymentDetails[pIdx]?.rate || 0;
                    const singleFee = paymentDetails[pIdx]?.fee || 0;
                    return (
                      <div key={pIdx} className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 space-y-2">
                        <div className="flex gap-2 items-center">
                          <input
                            type="number"
                            value={p.amount}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : Number(e.target.value);
                              setPayments(payments.map((item, idx) => idx === pIdx ? { ...item, amount: val } : item));
                            }}
                            placeholder="金額"
                            className="w-1/2 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-mono text-xs"
                          />
                          <select
                            value={p.method}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPayments(payments.map((item, idx) => idx === pIdx ? { ...item, method: val } : item));
                            }}
                            className="w-1/2 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 text-xs"
                          >
                            <option value="現金">現金</option>
                            <option value="轉帳/匯款">轉帳/匯款</option>
                            <option value="刷卡">刷卡</option>
                            <option value="刷卡分期">刷卡分期</option>
                          </select>
                          {payments.length > 1 && (
                            <button
                              onClick={() => setPayments(payments.filter((_, idx) => idx !== pIdx))}
                              className="text-slate-400 hover:text-rose-600 text-sm px-1"
                            >
                              ×
                            </button>
                          )}
                        </div>
                        {p.method === '刷卡分期' && (
                          <div className="flex items-center justify-between text-xs pt-1">
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
                        {singleFee > 0 && (
                          <div className="flex justify-between items-center text-[10px] text-amber-600 font-medium pt-1">
                            <span>手續費率 ({singleRate * 100}%)：</span>
                            <span>+${singleFee}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>小計金額</span>
                  <span className="font-mono">${subtotal}</span>
                </div>
                {totalFeeAmount > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>手續費總計</span>
                    <span className="font-mono">+${totalFeeAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-slate-800 pt-1">
                  <span>應付總額</span>
                  <span className="font-mono text-blue-600">${isNaN(totalAmountWithFee) ? 0 : totalAmountWithFee}</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-600 font-bold pt-1">
                  <span>預估總毛利</span>
                  <span className="font-mono">${isNaN(totalProfit) ? 0 : totalProfit}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-blue-200 transition"
              >
                確認結帳
              </button>
            </div>
          </div>
        )}

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
                <select
                  value={filterCustomerType}
                  onChange={(e) => setFilterCustomerType(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="全部客戶類型">全部客戶類型</option>
                  <option value="舊客">舊客</option>
                </select>
                <div className="flex gap-1.5">
                  <input
                    type="date"
                    value={dateStart}
                    onChange={(e) => { setDateStart(e.target.value); setDateFilterMode('custom'); }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-[10px]"
                  />
                  <input
                    type="date"
                    value={dateEnd}
                    onChange={(e) => { setDateEnd(e.target.value); setDateFilterMode('custom'); }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-[10px]"
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
                <h3 className="text-sm font-bold text-slate-800">選擇電信方案</h3>
                <button onClick={() => setIsPlanModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">×</button>
              </div>
              <input
                type="text"
                value={planSearch}
                onChange={(e) => setPlanSearch(e.target.value)}
                placeholder="搜尋方案名稱、電信商或代碼..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
              />
              <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredPlans.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">無相符方案</p>
                ) : (
                  filteredPlans.map(pl => (
                    <div
                      key={pl.id}
                      onClick={() => addPlanToCart(pl)}
                      className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-2xl cursor-pointer flex justify-between items-center transition text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-800">{pl.name} <span className="text-[10px] text-slate-400 font-mono">({pl.telecom})</span></p>
                        <p className="text-[10px] text-slate-500">月租: ${pl.monthlyFee} | 佣金: ${pl.storeRebate}</p>
                      </div>
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-bold">+ 代入</span>
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
    </div>
  );
}
