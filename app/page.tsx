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
  const [planSearch, setPlanSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  // 1. 方案管理狀態 (預設清空)
  const [plans, setPlans] = useState<any[]>([]);

  // 2. 新品庫存狀態 (預設保留幾筆範例，新增的會同步連動)
  const [products, setProducts] = useState([
    { id: 'p1', name: '滿版保貼', price: 200, cost: 50, stock: 10, category: '配件' },
    { id: 'p2', name: 'AIR6皮套', price: 200, cost: 70, stock: 8, category: '配件' },
    { id: 'p3', name: 'iPhone 15 128G', price: 25900, cost: 23000, stock: 3, category: '手機' },
  ]);

  // 3. 客戶管理狀態 (預設一筆範例，可供選取)
  const [customersList, setCustomersList] = useState([
    { id: 'c1', name: '林活揚', phone: '0956-096936', points: 100 }
  ]);

  // 方案管理暫存輸入
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanTelecom, setNewPlanTelecom] = useState('中華電信');
  const [newPlanMonthly, setNewPlanMonthly] = useState(1399);
  const [newPlanRebate, setNewPlanRebate] = useState(5000);

  // 庫存管理暫存輸入
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState(0);
  const [newProdCost, setNewProdCost] = useState(0);
  const [newProdStock, setNewProdStock] = useState(10);
  const [newProdCategory, setNewProdCategory] = useState('配件');

  // 彈窗狀態
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customType, setCustomType] = useState<'自訂配件/商品' | '維修服務'>('自訂配件/商品');
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState(0);
  const [customCost, setCustomCost] = useState(0);

  // 客戶彈窗狀態
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // 銷售紀錄
  const [salesRecords, setSalesRecords] = useState<any[]>([]);

  // 購物車計算
  const subtotal = cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);

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
  const totalProfit = cart.reduce((sum, item) => sum + (((Number(item.price) || 0) - (Number(item.cost) || 0)) * (Number(item.quantity) || 1)), 0) - totalFeeAmount;

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
    const newCust = { id: 'cust_' + Date.now(), name: newCustName, phone: newCustPhone || '未提供', points: 0 };
    setCustomersList([...customersList, newCust]); // 同步加入客戶管理資料庫
    setSelectedCustomer(newCust); // 自動選取
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

  // 即時搜尋過濾
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));
  const filteredPlans = plans.filter(pl => pl.name.toLowerCase().includes(planSearch.toLowerCase()) || pl.telecom.includes(planSearch));
  const filteredCustomers = customersList.filter(c => c.name.includes(customerSearch) || c.phone.includes(customerSearch));

  return (
    /* 這裡加上 fixed inset-0 z-50 完美蓋掉 layout.tsx 裡面壞掉的舊側邊欄 */
    <div className="fixed inset-0 z-50 flex h-screen w-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* 左側選單 (完整保留原有介面，現在只會顯示這一組) */}
      <div className="w-64 bg-slate-950 flex flex-col justify-between border-r border-slate-800/60 shrink-0">
        <div className="p-5 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-md shadow-blue-600/30">
              P
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">POS 門市系統</h2>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">v1.0.0</p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase px-3 pb-1">主要功能</p>
            {[
              { id: 'pos', name: '控制台' },
              { id: 'purchasing', name: '進貨管理' },
              { id: 'inventory', name: '新品庫存管理' },
              { id: 'used', name: '中古機總覽' },
              { id: 'repair', name: '維修管理' },
              { id: 'customers', name: '客戶管理' },
              { id: 'vendors', name: '廠商管理' },
              { id: 'plans', name: '方案管理' },
              { id: 'records', name: '銷售紀錄' },
              { id: 'reports', name: '營運報表' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-slate-900/40 border-t border-slate-800/60 m-3 rounded-2xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-xs text-blue-400">
            N
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-200 truncate">管理員</p>
            <p className="text-[10px] text-slate-400 truncate">admin@pos.com</p>
          </div>
        </div>
      </div>

      {/* 右側主要內容區 */}
      <div className="flex-1 bg-slate-50 text-slate-800 overflow-y-auto p-6">
        
        {/* 銷貨結帳頁面 */}
        {activeTab === 'pos' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold text-slate-800">銷貨結帳</h1>
                <p className="text-xs text-slate-400 mt-0.5">選取方案不代入月租，金額可自由手動修改，佣金自動計入毛利。</p>
              </div>
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
                      <span>💡 點擊開啟方案選擇視窗 (直接讀取方案管理資料)</span>
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
                      <p className="text-xs text-slate-400 text-center py-6">目前沒有相符的庫存商品，請至「新品庫存管理」新增</p>
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
                  
                  {/* 購物車標頭 */}
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800 text-sm">購物車明細</h3>
                      <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {cart.length}
                      </span>
                    </div>
                    {cart.length > 0 && (
                      <button onClick={() => setCart([])} className="text-[10px] text-rose-500 hover:text-rose-700 font-bold bg-rose-50 px-2 py-1 rounded-lg">
                        全部清空
                      </button>
                    )}
                  </div>

                  {/* 客戶選擇 */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">客戶 (選填，個人貴賓可不選)</span>
                      {!selectedCustomer && (
                        <button onClick={() => setIsCustomerModalOpen(true)} className="text-blue-600 font-bold hover:underline">
                          + 快速建立 / 選取會員
                        </button>
                      )}
                    </div>
                    {selectedCustomer ? (
                      <div className="flex justify-between items-center bg-blue-50/50 p-2.5 rounded-2xl border border-blue-100 text-xs">
                        <span className="font-bold text-blue-700">{selectedCustomer.name} ({selectedCustomer.phone})</span>
                        <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-rose-600 font-bold">×</button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => setIsCustomerModalOpen(true)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-xs text-slate-400 cursor-pointer hover:bg-slate-100 text-center"
                      >
                        尚未選取客戶 (點擊選取)
                      </div>
                    )}
                  </div>

                  {/* 購物車項目清單 (增強刪除功能) */}
                  <div className="space-y-2">
                    {cart.length === 0 ? (
                      <p className="text-center py-12 text-xs text-slate-400">尚未加入品項或方案</p>
                    ) : (
                      cart.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-xs group">
                          <div className="flex-1">
                            <p className="font-bold text-slate-800 truncate pr-2">{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">${item.price} × {item.quantity}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-slate-700">${item.price * item.quantity}</span>
                            <button 
                              onClick={() => setCart(cart.filter((_, i) => i !== idx))} 
                              className="text-slate-400 hover:text-rose-600 font-bold bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm transition"
                              title="刪除此項目"
                            >
                              × 刪除
                            </button>
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

                {/* 結帳總計 */}
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

        {/* ==================== 方案管理頁面 ==================== */}
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
                  if (!newPlanName) {
                    alert('請輸入方案名稱');
                    return;
                  }
                  setPlans([...plans, { id: 'pl_' + Date.now(), name: newPlanName, telecom: newPlanTelecom, monthlyFee: newPlanMonthly, storeRebate: newPlanRebate }]);
                  setNewPlanName('');
                  alert('成功新增方案！請至「控制台 (銷貨結帳)」查看。');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                儲存新方案
              </button>

              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 mb-3">現有方案清單</h4>
                <div className="space-y-2">
                  {plans.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4">目前尚無任何方案，請新增。</p>
                  ) : (
                    plans.map(pl => (
                      <div key={pl.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{pl.name} <span className="text-[10px] text-slate-400 font-mono">({pl.telecom})</span></p>
                          <p className="text-[10px] text-slate-500">月租: ${pl.monthlyFee} | 佣金: ${pl.storeRebate}</p>
                        </div>
                        <button onClick={() => setPlans(plans.filter(p => p.id !== pl.id))} className="text-rose-600 font-bold hover:underline bg-rose-50 px-2 py-1 rounded-lg">刪除</button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 新品庫存管理頁面 ==================== */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800">新品庫存管理</h1>
              <p className="text-xs text-slate-400 mt-0.5">在此新增商品或調整庫存，新增的商品將直接同步至銷貨結帳頁面搜尋列表。</p>
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
                  alert('成功新增商品至庫存！在銷貨結帳即可搜尋到。');
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
                      <button onClick={() => setProducts(products.filter(item => item.id !== p.id))} className="text-rose-600 font-bold hover:underline bg-rose-50 px-2 py-1 rounded-lg">刪除</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 客戶管理頁面 ==================== */}
        {activeTab === 'customers' && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800">客戶管理</h1>
              <p className="text-xs text-slate-400 mt-0.5">建檔的客戶名單將同步至結帳系統中供快速選取。</p>
            </div>
            
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
              <h3 className="text-sm font-bold text-slate-800">+ 新增客戶</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <input type="text" value={newCustName} onChange={(e) => setNewCustName(e.target.value)} placeholder="客戶姓名" className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" />
                <input type="text" value={newCustPhone} onChange={(e) => setNewCustPhone(e.target.value)} placeholder="聯絡電話" className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" />
                <button
                  onClick={() => {
                    if (!newCustName) return;
                    setCustomersList([...customersList, { id: 'c_' + Date.now(), name: newCustName, phone: newCustPhone || '未提供', points: 0 }]);
                    setNewCustName('');
                    setNewCustPhone('');
                    alert('新增客戶成功！');
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm"
                >
                  儲存客戶資料
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 mb-3">現有客戶清單</h4>
                <div className="space-y-2">
                  {customersList.map(c => (
                    <div key={c.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{c.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">電話: {c.phone}</p>
                      </div>
                      <button onClick={() => setCustomersList(customersList.filter(item => item.id !== c.id))} className="text-rose-600 font-bold hover:underline bg-rose-50 px-2 py-1 rounded-lg">刪除</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 預設的 Fallback (未實作的頁面) */}
        {activeTab !== 'pos' && activeTab !== 'plans' && activeTab !== 'inventory' && activeTab !== 'customers' && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800">模組維護中</h1>
              <p className="text-xs text-slate-400 mt-0.5">您可以點擊左側「控制台」回到銷貨結帳畫面。</p>
            </div>
          </div>
        )}

        {/* ==================== 彈窗區 ==================== */}

        {/* 方案選擇彈窗 */}
        {isPlanModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-xl border border-slate-200">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800">選擇電信方案（來自方案管理）</h3>
                <button onClick={() => setIsPlanModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">×</button>
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
                  <p className="text-xs text-slate-400 text-center py-6">目前查無方案，請至左側「方案管理」新增您的專屬方案</p>
                ) : (
                  filteredPlans.map(pl => (
                    <div
                      key={pl.id}
                      onClick={() => addPlanToCart(pl)}
                      className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-2xl cursor-pointer flex justify-between items-center transition text-xs group"
                    >
                      <div>
                        <p className="font-bold text-slate-800 group-hover:text-blue-700">{pl.name} <span className="text-[10px] text-slate-400 font-mono">({pl.telecom})</span></p>
                        <p className="text-[10px] text-slate-500">月租: ${pl.monthlyFee} | 佣金(毛利折抵): ${pl.storeRebate}</p>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-xl text-[10px] font-bold">+ 代入方案</span>
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
                <button onClick={() => setIsCustomModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">×</button>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-500 block mb-1">類型</label>
                  <select value={customType} onChange={(e) => setCustomType(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                    <option value="自訂配件/商品">自訂配件/商品</option>
                    <option value="維修服務">維修服務</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">項目名稱</label>
                  <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="例如：螢幕破裂維修、包膜..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-500 block mb-1">售價 ($)</label>
                    <input type="number" value={customPrice} onChange={(e) => setCustomPrice(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono" />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">成本 ($)</label>
                    <input type="number" value={customCost} onChange={(e) => setCustomCost(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono" />
                  </div>
                </div>
              </div>
              <button onClick={handleAddCustomItem} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition">
                確認新增至購物車
              </button>
            </div>
          </div>
        )}

        {/* 建立/選取會員彈窗 (連動客戶管理) */}
        {isCustomerModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800">選取現有客戶 或 建立新客戶</h3>
                <button onClick={() => setIsCustomerModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">×</button>
              </div>

              {/* 搜尋現有客戶 */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">搜尋現有客戶 (讀取「客戶管理」)</label>
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="搜尋姓名或電話..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
                <div className="max-h-40 overflow-y-auto space-y-1.5 border border-slate-100 rounded-xl p-1 bg-slate-50/50">
                  {filteredCustomers.length === 0 ? (
                    <p className="text-[10px] text-slate-400 text-center py-4">查無符合客戶，請在下方建立</p>
                  ) : (
                    filteredCustomers.map(c => (
                      <div 
                        key={c.id} 
                        onClick={() => { setSelectedCustomer(c); setIsCustomerModalOpen(false); }}
                        className="p-2 bg-white hover:bg-blue-50 border border-slate-200 rounded-lg cursor-pointer flex justify-between items-center transition text-xs"
                      >
                        <span className="font-bold text-slate-800">{c.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{c.phone}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-3 text-xs">
                <label className="text-xs font-bold text-slate-700 block mb-1">或 快速建立新客戶</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={newCustName} onChange={(e) => setNewCustName(e.target.value)} placeholder="請輸入姓名" className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" />
                  <input type="text" value={newCustPhone} onChange={(e) => setNewCustPhone(e.target.value)} placeholder="聯絡電話" className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" />
                </div>
                <button onClick={handleCreateCustomer} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs shadow-sm border border-slate-300 transition">
                  建立並自動選取
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
