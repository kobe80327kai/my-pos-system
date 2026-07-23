'use client';

import React, { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  cost: number;
  quantity: number;
  type: 'product' | 'plan' | 'custom' | 'repair';
}

interface SaleRecord {
  id: string;
  orderNo: string;
  date: string;
  customerName: string;
  salesperson: string;
  items: { name: string; price: number; cost: number; quantity: number }[];
  totalAmount: number;
  profit: number;
  paymentInfo: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface PlanItem {
  id: string;
  name: string;
  telecom: string;
  monthlyFee: number;
  rebate: number; // 佣金
}

export default function ControlPage() {
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [activeTab, setActiveTab] = useState<'checkout' | 'records' | 'reports'>('checkout');

  // 資料狀態
  const [salesRecords, setSalesRecords] = useState<SaleRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pos_sales_records');
      if (saved) return JSON.parse(saved);
    }
    return [];
  });

  // 客戶清單 (可與客戶管理連動)
  const [customers, setCustomers] = useState<Customer[]>([
    { id: 'c1', name: '林活揚', phone: '0956-096936' },
    { id: 'c2', name: '王小明', phone: '0912-345678' }
  ]);

  // 方案清單 (與方案管理連動)
  const [plans, setPlans] = useState<PlanItem[]>([
    { id: 'pl1', name: '中華電信 5G 1399 (30期)', telecom: '中華電信', monthlyFee: 1399, rebate: 5000 },
    { id: 'pl2', name: '台灣大哥大 4G 688 (24期)', telecom: '台灣大哥大', monthlyFee: 688, rebate: 3000 }
  ]);

  const products: Product[] = [
    { id: 'p1', name: '滿版保貼', price: 200, cost: 50, stock: 10, category: '配件' },
    { id: 'p2', name: 'AIR6皮套', price: 200, cost: 70, stock: 8, category: '配件' },
    { id: 'p3', name: 'iPhone 15 128G', price: 25900, cost: 23000, stock: 3, category: '手機' },
  ];

  useEffect(() => {
    localStorage.setItem('pos_sales_records', JSON.stringify(salesRecords));
  }, [salesRecords]);

  // 銷貨結帳相關狀態
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(''); // 預設不填
  const [paymentMethod, setPaymentMethod] = useState('現金');
  const [installments, setInstallments] = useState('3'); // 分期期數

  // Modal 控制
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // 自訂項目表單
  const [customType, setCustomType] = useState<'自訂配件/商品' | '維修服務'>('自訂配件/商品');
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [customCost, setCustomCost] = useState<number>(0);

  // 新增客戶表單
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  const addToCart = (item: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, cost: item.cost, quantity: 1, type: 'product' }];
    });
  };

  const addPlanToCart = (plan: PlanItem) => {
    setCart((prev) => [
      ...prev,
      { id: `plan-${plan.id}-${Date.now()}`, name: `[方案] ${plan.name}`, price: 0, cost: 0, quantity: 1, type: 'plan' }
    ]);
    setIsPlanModalOpen(false);
  };

  const handleAddCustomItem = () => {
    if (!customName) {
      alert('請輸入項目名稱');
      return;
    }
    setCart((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        name: `[${customType}] ${customName}`,
        price: Number(customPrice) || 0,
        cost: Number(customCost) || 0,
        quantity: 1,
        type: customType === '自訂配件/商品' ? 'custom' : 'repair'
      }
    ]);
    setCustomName('');
    setCustomPrice(0);
    setCustomCost(0);
    setIsCustomModalOpen(false);
  };

  const handleCreateCustomer = () => {
    if (!newCustName || !newCustPhone) {
      alert('請填寫客戶姓名與電話');
      return;
    }
    const newC: Customer = { id: `c-${Date.now()}`, name: newCustName, phone: newCustPhone };
    setCustomers([...customers, newC]);
    setSelectedCustomer(`${newC.name} (${newC.phone})`);
    setNewCustName('');
    setNewCustPhone('');
    setIsCustomerModalOpen(false);
  };

  // 手續費率計算邏輯
  const getFeeRate = () => {
    if (paymentMethod === '現金') return 0;
    if (paymentMethod === '刷卡') return 0.02; // 刷卡 -2%
    if (paymentMethod === '刷卡分期') {
      if (installments === '3') return 0.03;  // 3期 -3%
      if (installments === '6') return 0.04;  // 6期 -4%
      if (installments === '12') return 0.06; // 12期 -6%
      return 0.08; // 18/24期預設
    }
    return 0;
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const feeRate = getFeeRate();
  const feeAmount = Math.round(subtotal * feeRate);
  const totalAmountWithFee = subtotal + feeAmount; // 總金額含手續費加成

  const baseProfit = cart.reduce((sum, item) => sum + (item.price - item.cost) * item.quantity, 0);
  const totalProfit = baseProfit - feeAmount; // 毛利扣除手續費

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('購物車目前沒有項目！');
      return;
    }
    const orderNo = `SD${getTodayStr().replace(/-/g, '').slice(2)}${Math.floor(100 + Math.random() * 900)}`;
    const newRecord: SaleRecord = {
      id: `sr-${Date.now()}`,
      orderNo,
      date: getTodayStr(),
      customerName: selectedCustomer ? selectedCustomer.split(' ')[0] : '散客',
      salesperson: '管理員',
      items: cart.map(i => ({ name: i.name, price: i.price, cost: i.cost, quantity: i.quantity })),
      totalAmount: totalAmountWithFee,
      profit: totalProfit,
      paymentInfo: paymentMethod === '刷卡分期' ? `刷卡分期(${installments}期)` : paymentMethod
    };

    setSalesRecords([newRecord, ...salesRecords]);
    alert(`結帳成功！單號：${orderNo}`);
    setCart([]);
  };

  const filteredProducts = products.filter(p => 
    !productSearch || p.name.includes(productSearch) || p.id.includes(productSearch)
  );

  return (
    <div className="p-8 space-y-6 w-full relative">
      {/* 頂部快速切換列 */}
      <div className="flex justify-between items-center bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-200/60">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium mr-2">快速切換：</span>
          <button onClick={() => setActiveTab('checkout')} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeTab === 'checkout' ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>🛒 銷貨結帳</button>
          <button onClick={() => setActiveTab('records')} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeTab === 'records' ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>📄 銷售紀錄</button>
          <button onClick={() => setActiveTab('reports')} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeTab === 'reports' ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>📊 業績報表</button>
        </div>
        <div className="text-xs text-slate-600">目前身份：<span className="font-bold text-slate-800">管理員</span></div>
      </div>

      {/* 1. 銷貨結帳畫面 */}
      {activeTab === 'checkout' && (
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">銷貨結帳</h1>
            <p className="text-xs text-slate-400 mt-0.5">選取方案不代入月租，金額可自由手動修改，佣金自動計入毛利。</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-4">
              {/* 選擇方案區 */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-slate-700">選擇方案</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">點擊開啟方案選擇視窗</p>
                </div>
                <button onClick={() => setIsPlanModalOpen(true)} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition">選擇方案</button>
              </div>

              {/* 加入商品區 */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
                <p className="text-xs font-bold text-slate-700">加入商品</p>
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="搜尋商品名稱 / 商品編號 / IMEI..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs"
                />
                <div className="space-y-2">
                  {filteredProducts.map((p) => (
                    <div key={p.id} onClick={() => addToCart(p)} className="flex justify-between items-center p-3.5 border border-slate-100 rounded-2xl cursor-pointer hover:bg-blue-50/50 transition">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{p.name}</p>
                        <p className="text-[10px] text-slate-400">庫存: {p.stock} | 成本: ${p.cost}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-blue-600 font-mono font-bold">${p.price}</span>
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-bold">+ 加入</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 右側購物車與結帳 */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-700">🛒 購物車明細 <span className="text-blue-600 font-mono">({cart.length})</span></span>
                <button onClick={() => setCart([])} className="text-[10px] text-slate-400 hover:text-rose-600">清空</button>
              </div>

              {/* 客戶選擇 */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400">客戶 (選填，個人貴賓可不選)</span>
                <div className="flex items-center gap-2">
                  <select 
                    value={selectedCustomer} 
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                  >
                    <option value="">-- 請選擇客戶 (預設不填) --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={`${c.name} (${c.phone})`}>{c.name} ({c.phone})</option>
                    ))}
                  </select>
                  <button onClick={() => setIsCustomerModalOpen(true)} className="text-[10px] text-blue-600 font-bold whitespace-nowrap">+ 建立</button>
                </div>
              </div>

              {/* 購物車品項清單 (可修改售價與毛利) */}
              <div className="min-h-[140px] max-h-[220px] overflow-y-auto space-y-2 border-b border-slate-100 pb-4">
                {cart.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-10">尚未加入品項或方案</p>
                ) : (
                  cart.map((i, index) => (
                    <div key={i.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
                      <div className="flex justify-between items-center font-bold text-slate-800">
                        <span>{i.name}</span>
                        <button onClick={() => setCart(cart.filter((_, idx) => idx !== index))} className="text-slate-400 hover:text-rose-600 text-sm">×</button>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500">
                        <span>售價 ($):</span>
                        <input
                          type="number"
                          value={i.price}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCart(cart.map((item, idx) => idx === index ? { ...item, price: val } : item));
                          }}
                          className="w-20 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-right font-mono"
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-emerald-600 font-bold">
                        <span>預估毛利:</span>
                        <span>+${(i.price - i.cost) * i.quantity}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 自訂項目 / 維修服務按鈕 */}
              <button 
                onClick={() => setIsCustomModalOpen(true)}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-600 transition flex items-center justify-center gap-1.5"
              >
                + 自訂項目 / 🛠️ 維修服務
              </button>

              {/* 付款方式與分期 */}
              <div className="space-y-2 text-xs pt-2">
                <span className="text-slate-400 text-[10px]">付款方式與期數</span>
                <div className="flex gap-2">
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium">
                    <option value="現金">現金</option>
                    <option value="刷卡">刷卡</option>
                    <option value="刷卡分期">刷卡分期</option>
                  </select>
                  {paymentMethod === '刷卡分期' && (
                    <select value={installments} onChange={(e) => setInstallments(e.target.value)} className="w-28 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium">
                      <option value="3">3期 (3%)</option>
                      <option value="6">6期 (4%)</option>
                      <option value="12">12期 (6%)</option>
                      <option value="18">18期 (8%)</option>
                      <option value="24">24期 (8%)</option>
                    </select>
                  )}
                </div>
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span>手續費率: {feeRate * 100}%</span>
                  <span>手續費加成: +${feeAmount}</span>
                </div>
              </div>

              {/* 總結與結帳按鈕 */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">預估總毛利：</span>
                  <span className="text-emerald-600 font-bold">+${totalProfit}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span>總金額：</span>
                  <span className="font-mono text-rose-600">${totalAmountWithFee}</span>
                </div>
                <button onClick={handleCheckout} className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold shadow-sm transition">
                  確認結帳收款
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. 銷售紀錄畫面 */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold text-slate-800">銷售紀錄</h1>
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 space-y-4">
            <div className="text-xs text-slate-500 font-medium">共 {salesRecords.length} 筆紀錄</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium">
                    <th className="pb-3 pl-3">單號 / 日期</th>
                    <th className="pb-3">客戶</th>
                    <th className="pb-3">經手人員</th>
                    <th className="pb-3">總金額</th>
                    <th className="pb-3">毛利</th>
                    <th className="pb-3">付款方式</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {salesRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 pl-3 font-mono font-bold text-slate-800">{r.orderNo}<span className="block text-[10px] text-slate-400 font-normal">{r.date}</span></td>
                      <td className="py-3.5">{r.customerName}</td>
                      <td className="py-3.5">{r.salesperson}</td>
                      <td className="py-3.5 font-mono font-bold">${r.totalAmount}</td>
                      <td className="py-3.5 font-mono font-bold text-emerald-600">+${r.profit}</td>
                      <td className="py-3.5"><span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold">{r.paymentInfo}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. 業績報表畫面 */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold text-slate-800">業績報表</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border space-y-2"><p className="text-xs text-slate-400">銷售總額</p><p className="text-2xl font-mono font-bold text-slate-800">$0</p></div>
            <div className="bg-white rounded-3xl p-6 shadow-sm border space-y-2"><p className="text-xs text-slate-400">總毛利</p><p className="text-2xl font-mono font-bold text-emerald-600">+$0</p></div>
          </div>
        </div>
      )}

      {/* --- 彈跳視窗：選擇電信方案 --- */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-800">選擇電信方案</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {plans.map((pl) => (
                <div key={pl.id} onClick={() => addPlanToCart(pl)} className="p-3 border rounded-xl cursor-pointer hover:bg-blue-50 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{pl.name}</p>
                    <p className="text-[10px] text-slate-400">月租: ${pl.monthlyFee} | 佣金: ${pl.rebate}</p>
                  </div>
                  <span className="text-xs text-blue-600 font-bold">+ 選擇</span>
                </div>
              ))}
            </div>
            <button onClick={() => setIsPlanModalOpen(false)} className="w-full py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold">關閉</button>
          </div>
        </div>
      )}

      {/* --- 彈跳視窗：新增自訂項目 / 維修服務 --- */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-800">新增自訂 / 維修項目</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 text-[10px]">項目類別</label>
                <select value={customType} onChange={(e) => setCustomType(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 mt-1">
                  <option value="自訂配件/商品">自訂配件/商品</option>
                  <option value="維修服務">維修服務</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-[10px]">項目名稱</label>
                <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="例如：螢幕維修 / 特快包膜" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 mt-1" />
              </div>
              <div>
                <label className="text-slate-400 text-[10px]">售價 ($)</label>
                <input type="number" value={customPrice} onChange={(e) => setCustomPrice(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 mt-1 font-mono" />
              </div>
              <div>
                <label className="text-slate-400 text-[10px]">成本 ($，可不填)</label>
                <input type="number" value={customCost} onChange={(e) => setCustomCost(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 mt-1 font-mono" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setIsCustomModalOpen(false)} className="w-1/2 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold">取消</button>
              <button onClick={handleAddCustomItem} className="w-1/2 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold">加入購物車</button>
            </div>
          </div>
        </div>
      )}

      {/* --- 彈跳視窗：快速建立會員 --- */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-800">快速建立客戶</h3>
            <div className="space-y-3 text-xs">
              <input type="text" value={newCustName} onChange={(e) => setNewCustName(e.target.value)} placeholder="客戶姓名" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" />
              <input type="text" value={newCustPhone} onChange={(e) => setNewCustPhone(e.target.value)} placeholder="聯絡電話" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsCustomerModalOpen(false)} className="w-1/2 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold">取消</button>
              <button onClick={handleCreateCustomer} className="w-1/2 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">確認建立</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
