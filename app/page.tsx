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
  rebate: number;
  quantity: number;
  type: 'product' | 'plan' | 'custom' | 'repair';
}

interface PaymentEntry {
  id: string;
  method: string;
  installments: string;
}

interface SaleRecord {
  id: string;
  orderNo: string;
  date: string;
  customerName: string;
  customerType: string;
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
  type?: string;
  gender?: string;
}

interface PlanItem {
  id: string;
  planCode: string;
  name: string;
  telecom: string;
  type: string;
  network: string;
  monthlyFee: number;
  contractMonths: number;
  prepayment: string;
  storeRebate: number;
  actualRebate: number;
}

export default function ControlPage() {
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [activeTab, setActiveTab] = useState<'checkout' | 'records' | 'reports'>('checkout');

  const [salesRecords, setSalesRecords] = useState<SaleRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('pos_sales_records_v3');
        if (saved) return JSON.parse(saved);
      } catch (e) { console.error(e); }
    }
    return [];
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const defaultCusts: Customer[] = [
      { id: 'CST00001', name: '林活揚', phone: '0956-096936', type: '舊客', gender: '男' }
    ];
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('pos_customers_v3');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const map = new Map();
            [...defaultCusts, ...parsed].forEach(c => map.set(c.id, c));
            return Array.from(map.values());
          }
        }
      } catch (e) { console.error(e); }
    }
    return defaultCusts;
  });

  const [plans, setPlans] = useState<PlanItem[]>(() => {
    const defaultPlans: PlanItem[] = [
      { 
        id: 'pl1', 
        planCode: 'PLN8767', 
        name: 'NP799-24', 
        telecom: '遠傳電信', 
        type: '新申辦', 
        network: '5G', 
        monthlyFee: 799, 
        contractMonths: 24, 
        prepayment: '—', 
        storeRebate: 6000, 
        actualRebate: 0 
      }
    ];
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('pos_plans_v3');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const map = new Map();
            [...defaultPlans, ...parsed].forEach(p => map.set(p.id, p));
            return Array.from(map.values());
          }
        }
      } catch (e) { console.error(e); }
    }
    return defaultPlans;
  });

  const products: Product[] = [
    { id: 'p1', name: '滿版保貼', price: 200, cost: 50, stock: 10, category: '配件' },
    { id: 'p2', name: 'AIR6皮套', price: 200, cost: 70, stock: 8, category: '配件' },
    { id: 'p3', name: 'iPhone 15 128G', price: 25900, cost: 23000, stock: 3, category: '手機' },
  ];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_customers_v3', JSON.stringify(customers));
    }
  }, [customers]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_plans_v3', JSON.stringify(plans));
    }
  }, [plans]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_sales_records_v3', JSON.stringify(salesRecords));
    }
  }, [salesRecords]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [planSearch, setPlanSearch] = useState('');
  const [payments, setPayments] = useState<PaymentEntry[]>([
    { id: 'pay-1', method: '現金', installments: '3' }
  ]);

  const [recordSearch, setRecordSearch] = useState('');
  const [filterSalesperson, setFilterSalesperson] = useState('全部門市人員');
  const [filterCustomerType, setFilterCustomerType] = useState('全部客戶類型');
  const [dateStart, setDateStart] = useState(getTodayStr());
  const [dateEnd, setDateEnd] = useState(getTodayStr());
  const [dateFilterMode, setDateFilterMode] = useState<'today' | 'week' | 'month' | 'all' | 'custom'>('today');
  const [expandedRecordIds, setExpandedRecordIds] = useState<string[]>([]);

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  const [customType, setCustomType] = useState<'自訂配件/商品' | '維修服務'>('自訂配件/商品');
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [customCost, setCustomCost] = useState<number>(0);

  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  const addPlanToCart = (plan: PlanItem) => {
    const planRebate = Number(plan.storeRebate) > 0 ? Number(plan.storeRebate) : 2500;
    setCart((prev) => [
      ...prev,
      { 
        id: `plan-${plan.id}-${Date.now()}`, 
        name: `[方案] ${plan.name} (${plan.telecom})`, 
        price: 0, 
        cost: 0,
        rebate: planRebate,
        quantity: 1, 
        type: 'plan' 
      }
    ]);
    setIsPlanModalOpen(false);
    setPlanSearch('');
  };

  const addToCart = (p: Product) => {
    setCart((prev) => {
      const existing = prev.find(item => item.id === p.id && item.type === 'product');
      if (existing) {
        return prev.map(item => item.id === p.id && item.type === 'product' ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id: p.id, name: p.name, price: p.price, cost: p.cost, rebate: 0, quantity: 1, type: 'product' }];
    });
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
        rebate: 0,
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
    const newId = `CST${String(customers.length + 1).padStart(5, '0')}`;
    const newC: Customer = { id: newId, name: newCustName, phone: newCustPhone, type: '舊客', gender: '男' };
    setCustomers([newC, ...customers]);
    setCustomerSearch(`${newC.name} (${newC.phone})`);
    setNewCustName('');
    setNewCustPhone('');
    setIsCustomerModalOpen(false);
    setIsCustomerDropdownOpen(false);
  };

  const getSingleFeeRate = (method: string, inst: string) => {
    if (method === '現金' || method === '轉帳/匯款') return 0;
    if (method === '刷卡') return 0.02;
    if (method === '刷卡分期') {
      if (inst === '3') return 0.03;
      if (inst === '6') return 0.04;
      if (inst === '12') return 0.06;
      return 0.08;
    }
    return 0;
  };

  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * item.quantity, 0);
  const totalFeeAmount = payments.reduce((sum, p) => {
    const rate = getSingleFeeRate(p.method, p.installments);
    return sum + Math.round(subtotal * rate);
  }, 0);

  const totalAmountWithFee = subtotal + totalFeeAmount;
  
  const baseProfit = cart.reduce((sum, item) => {
    if (item.type === 'plan') {
      return sum + Number(item.rebate || 0);
    }
    const pPrice = Number(item.price) || 0;
    const pCost = Number(item.cost) || 0;
    return sum + (pPrice - pCost) * item.quantity;
  }, 0);
  
  const totalProfit = baseProfit - totalFeeAmount;

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('購物車目前沒有項目！');
      return;
    }
    const orderNo = `SD${getTodayStr().replace(/-/g, '').slice(2)}${Math.floor(100 + Math.random() * 900)}`;
    const paymentDesc = payments.map(p => p.method === '刷卡分期' ? `刷卡分期(${p.installments}期)` : p.method).join(', ');

    const newRecord: SaleRecord = {
      id: `sr-${Date.now()}`,
      orderNo,
      date: getTodayStr(),
      customerName: customerSearch ? customerSearch.split(' ')[0] : '散客',
      customerType: '舊客',
      salesperson: '管理員',
      items: cart.map(i => ({ 
        name: i.name, 
        price: i.price, 
        cost: i.type === 'plan' ? -Number(i.rebate || 0) : i.cost, 
        quantity: i.quantity 
      })),
      totalAmount: totalAmountWithFee,
      profit: totalProfit,
      paymentInfo: paymentDesc
    };

    setSalesRecords([newRecord, ...salesRecords]);
    alert(`結帳成功！單號：${orderNo}`);
    setCart([]);
    setCustomerSearch('');
  };

  const handleDateFilterPreset = (mode: 'today' | 'week' | 'month' | 'all') => {
    setDateFilterMode(mode);
    const today = new Date();
    const todayStr = getTodayStr();

    if (mode === 'today') {
      setDateStart(todayStr);
      setDateEnd(todayStr);
    } else if (mode === 'week') {
      const firstDayOfWeek = new Date(today);
      firstDayOfWeek.setDate(today.getDate() - today.getDay());
      setDateStart(`${firstDayOfWeek.getFullYear()}-${String(firstDayOfWeek.getMonth() + 1).padStart(2, '0')}-${String(firstDayOfWeek.getDate()).padStart(2, '0')}`);
      setDateEnd(todayStr);
    } else if (mode === 'month') {
      const firstDayOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
      setDateStart(firstDayOfMonth);
      setDateEnd(todayStr);
    } else if (mode === 'all') {
      setDateStart('2020-01-01');
      setDateEnd('2030-12-31');
    }
  };

  const filteredRecords = salesRecords.filter(r => {
    const matchSearch = !recordSearch || 
      r.orderNo.toLowerCase().includes(recordSearch.toLowerCase()) ||
      r.customerName.toLowerCase().includes(recordSearch.toLowerCase()) ||
      r.salesperson.toLowerCase().includes(recordSearch.toLowerCase()) ||
      r.items.some(i => i.name.toLowerCase().includes(recordSearch.toLowerCase()));

    const matchSalesperson = filterSalesperson === '全部門市人員' || r.salesperson === filterSalesperson;
    const matchCustType = filterCustomerType === '全部客戶類型' || r.customerType === filterCustomerType;
    const matchDate = (!dateStart || r.date >= dateStart) && (!dateEnd || r.date <= dateEnd);

    return matchSearch && matchSalesperson && matchCustType && matchDate;
  });

  const toggleExpandRecord = (id: string) => {
    setExpandedRecordIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const filteredProducts = products.filter(p => 
    !productSearch || p.name.includes(productSearch) || p.id.includes(productSearch)
  );

  const filteredCustomers = customers.filter(c => {
    if (!customerSearch) return true;
    const keyword = customerSearch.trim().toLowerCase();
    return c.name.toLowerCase().includes(keyword) || c.phone.includes(keyword);
  });

  const filteredPlans = plans.filter(pl => {
    if (!planSearch) return true;
    const keyword = planSearch.trim().toLowerCase();
    return pl.name.toLowerCase().includes(keyword) || 
           pl.telecom.toLowerCase().includes(keyword) ||
           pl.planCode.toLowerCase().includes(keyword);
  });

  return (
    <div className="flex-1 bg-slate-100 p-8 space-y-6 overflow-y-auto font-sans text-slate-800 min-h-screen">
      <div className="flex justify-between items-center bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-200/60">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">快速切換：</span>
          <button onClick={() => setActiveTab('checkout')} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeTab === 'checkout' ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>🛒 銷貨結帳</button>
          <button onClick={() => setActiveTab('records')} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeTab === 'records' ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>📄 銷售紀錄</button>
          <button onClick={() => setActiveTab('reports')} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeTab === 'reports' ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>📊 業績報表</button>
        </div>
        <div className="text-xs text-slate-600">目前身份：<span className="font-bold text-slate-800">管理員</span></div>
      </div>

      {activeTab === 'checkout' && (
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">銷貨結帳</h1>
            <p className="text-xs text-slate-400 mt-0.5">選取方案不代入月租，金額可自由手動修改，佣金自動計入毛利。</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/65 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">選擇方案</span>
                  <button onClick={() => setIsPlanModalOpen(true)} className="text-xs text-blue-600 font-bold hover:underline">+ 代入電信方案</button>
                </div>
                <div 
                  onClick={() => setIsPlanModalOpen(true)}
                  className="border border-dashed border-blue-200 bg-blue-50/30 rounded-2xl p-4 flex justify-between items-center cursor-pointer hover:bg-blue-50/60 transition"
                >
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    <span>👉</span>
                    <span>點擊開啟方案選擇視窗</span>
                  </div>
                  <button className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold shadow-sm">選擇方案</button>
                </div>
              </div>

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

            <div className="lg:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-700">🛒 購物車明細 <span className="text-blue-600 font-mono">({cart.length})</span></span>
                <button onClick={() => setCart([])} className="text-[10px] text-slate-400 hover:text-rose-600">清空</button>
              </div>

              <div className="space-y-1 relative">
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>客戶 (選填，個人貴賓可不選)</span>
                  <button onClick={() => setIsCustomerModalOpen(true)} className="text-blue-600 font-bold">+ 快速建立會員</button>
                </div>
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setIsCustomerDropdownOpen(true);
                  }}
                  onFocus={() => setIsCustomerDropdownOpen(true)}
                  placeholder="搜尋客戶姓名 / 電話..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                />
                {isCustomerDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-52 overflow-y-auto">
                    <div 
                      onClick={() => { setCustomerSearch(''); setIsCustomerDropdownOpen(false); }}
                      className="px-3 py-2 text-xs text-slate-400 hover:bg-slate-50 cursor-pointer border-b"
                    >
                      (不選擇客戶)
                    </div>
                    {filteredCustomers.length === 0 ? (
                      <div className="p-3 text-center space-y-2 bg-slate-50/50">
                        <p className="text-xs text-slate-500">找不到符合「{customerSearch}」的客戶</p>
                        <button 
                          onClick={() => {
                            setNewCustPhone(customerSearch.match(/^\d+$/) ? customerSearch : '');
                            setIsCustomerDropdownOpen(false);
                            setIsCustomerModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm"
                        >
                          + 立即新增客戶「{customerSearch}」
                        </button>
                      </div>
                    ) : (
                      filteredCustomers.map(c => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setCustomerSearch(`${c.name} (${c.phone})`);
                            setIsCustomerDropdownOpen(false);
                          }}
                          className="px-3 py-2.5 text-xs hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-slate-50"
                        >
                          <span className="font-bold text-slate-800">{c.name}</span>
                          <span className="text-slate-400 font-mono">{c.phone}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="min-h-[120px] max-h-[200px] overflow-y-auto space-y-2 border-b border-slate-100 pb-4">
                {cart.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-10">尚未加入品項或方案</p>
                ) : (
                  cart.map((i, index) => {
                    const itemPrice = Number(i.price) || 0;
                    const itemRebate = Number(i.rebate) || 0;
                    const itemProfit = i.type === 'plan' 
                      ? itemRebate 
                      : (itemPrice - Number(i.cost || 0)) * i.quantity;

                    return (
                      <div key={i.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
                        <div className="flex justify-between items-center font-bold text-slate-800">
                          <span>{i.name}</span>
                          <button onClick={() => setCart(cart.filter((_, idx) => idx !== index))} className="text-slate-400 hover:text-rose-600 text-sm">×</button>
                        </div>
                        {i.type === 'plan' ? (
                          <div className="flex justify-between items-center text-[10px] text-emerald-600 font-bold pt-1">
                            <span>方案佣金 ($):</span>
                            <input
                              type="number"
                              value={i.rebate}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : Number(e.target.value);
                                setCart(cart.map((item, idx) => idx === index ? { ...item, rebate: val } : item));
                              }}
                              className="w-24 bg-white border border-emerald-200 rounded px-1.5 py-0.5 text-right font-mono text-emerald-600 font-bold"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-center text-[10px] text-slate-500">
                              <span>售價 ($):</span>
                              <input
                                type="number"
                                value={i.price}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? 0 : Number(e.target.value);
                                  setCart(cart.map((item, idx) => idx === index ? { ...item, price: val } : item));
                                }}
                                className="w-20 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-right font-mono"
                              />
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-emerald-600 font-bold">
                              <span>預估毛利:</span>
                              <span>{itemProfit >= 0 ? `+$${itemProfit}` : `-$${Math.abs(itemProfit)}`}</span>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <button 
                onClick={() => setIsCustomModalOpen(true)}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-600 transition flex items-center justify-center gap-1.5"
              >
                + 自訂項目 / 🛠️ 維修項目
              </button>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[10px]">付款方式與期數</span>
                  <button 
                    onClick={() => setPayments([...payments, { id: `pay-${Date.now()}`, method: '現金', installments: '3' }])}
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    + 新增付款方式
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {payments.map((p, pIdx) => {
                    const singleRate = getSingleFeeRate(p.method, p.installments);
                    const singleFee = Math.round(subtotal * singleRate);
                    return (
                      <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <select 
                            value={p.method} 
                            onChange={(e) => {
                              const val = e.target.value;
                              setPayments(payments.map((item, idx) => idx === pIdx ? { ...item, method: val } : item));
                            }} 
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-medium"
                          >
                            <option value="現金">現金</option>
                            <option value="轉帳/匯款">轉帳/匯款</option>
                            <option value="刷卡">刷卡</option>
                            <option value="刷卡分期">刷卡分期</option>
                          </select>

                          {p.method === '刷卡分期' && (
                            <select 
                              value={p.installments} 
                              onChange={(e) => {
                                const val = e.target.value;
                                setPayments(payments.map((item, idx) => idx === pIdx ? { ...item, installments: val } : item));
                              }} 
                              className="w-32 bg-white border border-slate-200 rounded-xl px-2 py-1.5 font-medium"
                            >
                              <option value="3">3期 (3%)</option>
                              <option value="6">6期 (4%)</option>
                              <option value="12">12期 (6%)</option>
                              <option value="18">18期 (8%)</option>
                              <option value="24">24期 (8%)</option>
                            </select>
                          )}

                          {payments.length > 1 && (
                            <button 
                              onClick={() => setPayments(payments.filter((_, idx) => idx !== pIdx))}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 px-1">
                          <span>手續費率: {singleRate * 100}%</span>
                          <span className="text-amber-600 font-bold">手續費加成: +${singleFee}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">預估總毛利：</span>
                  <span className="text-emerald-600 font-bold">{totalProfit >= 0 ? `+$${totalProfit}` : `-$${Math.abs(totalProfit)}`}</span>
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

      {activeTab === 'records' && (
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">銷售紀錄</h1>
            <p className="text-xs text-slate-400 mt-0.5">查詢與管理銷售訂單記錄。</p>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={recordSearch}
                onChange={(e) => setRecordSearch(e.target.value)}
                placeholder="搜尋單號 / 客戶 / 經手人員 / 商品名稱..."
                className="flex-1 min-w-[260px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs"
              />
              <select
                value={filterSalesperson}
                onChange={(e) => setFilterSalesperson(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
              >
                <option value="全部門市人員">全部門市人員</option>
                <option value="管理員">管理員</option>
              </select>
              <select
                value={filterCustomerType}
                onChange={(e) => setFilterCustomerType(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
              >
                <option value="全部客戶類型">全部客戶類型</option>
                <option value="舊客">舊客</option>
              </select>
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
                <input type="date" value={dateStart} onChange={(e) => { setDateStart(e.target.value); setDateFilterMode('custom'); }} className="bg-transparent outline-none" />
                <span className="text-slate-400">~</span>
                <input type="date" value={dateEnd} onChange={(e) => { setDateEnd(e.target.value); setDateFilterMode('custom'); }} className="bg-transparent outline-none" />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button onClick={() => handleDateFilterPreset('today')} className={`px-3.5 py-1 rounded-xl text-xs font-bold transition ${dateFilterMode === 'today' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>今日</button>
              <button onClick={() => handleDateFilterPreset('week')} className={`px-3.5 py-1 rounded-xl text-xs font-bold transition ${dateFilterMode === 'week' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>本週</button>
              <button onClick={() => handleDateFilterPreset('month')} className={`px-3.5 py-1 rounded-xl text-xs font-bold transition ${dateFilterMode === 'month' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>本月</button>
              <button onClick={() => handleDateFilterPreset('all')} className={`px-3.5 py-1 rounded-xl text-xs font-bold transition ${dateFilterMode === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>全部</button>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-400 font-bold">
                    <th className="p-4">單號 / 日期</th>
                    <th className="p-4">客戶 / 類型</th>
                    <th className="p-4">經手人員</th>
                    <th className="p-4">付款資訊</th>
                    <th className="p-4 text-right">總金額</th>
                    <th className="p-4 text-right">毛利</th>
                    <th className="p-4 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">目前沒有符合條件的銷售紀錄</td>
                    </tr>
                  ) : (
                    filteredRecords.map((r) => {
                      const isExpanded = expandedRecordIds.includes(r.id);
                      return (
                        <React.Fragment key={r.id}>
                          <tr className="hover:bg-slate-50/50 transition">
                            <td className="p-4">
                              <p className="font-bold font-mono text-slate-800">{r.orderNo}</p>
                              <p className="text-[10px] text-slate-400">{r.date}</p>
                            </td>
                            <td className="p-4">
                              <p className="font-bold text-slate-800">{r.customerName}</p>
                              <p className="text-[10px] text-slate-400">{r.customerType}</p>
                            </td>
                            <td className="p-4 font-medium text-slate-600">{r.salesperson}</td>
                            <td className="p-4 font-medium text-slate-600">{r.paymentInfo}</td>
                            <td className="p-4 text-right font-mono font-bold text-slate-800">${r.totalAmount}</td>
                            <td className="p-4 text-right font-mono font-bold text-emerald-600">
                              {r.profit >= 0 ? `+$${r.profit}` : `-$${Math.abs(r.profit)}`}
                            </td>
                            <td className="p-4 text-center space-x-2">
                              <button
                                onClick={() => toggleExpandRecord(r.id)}
                                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-bold transition"
                              >
                                {isExpanded ? '收起明細 ▲' : '展開明細 ▼'}
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`確定要刪除訂單 ${r.orderNo} 嗎？`)) {
                                    setSalesRecords(salesRecords.filter(item => item.id !== r.id));
                                  }
                                }}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[10px] font-bold transition"
                              >
                                刪除
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-slate-50/50">
                              <td colSpan={7} className="p-4 px-8">
                                <div className="bg-white p-4 rounded-2xl border border-slate-200/60 space-y-2">
                                  <p className="text-[10px] font-bold text-slate-400">商品明細：</p>
                                  <div className="space-y-1">
                                    {r.items.map((item, idx) => (
                                      <div key={idx} className="flex justify-between items-center text-xs">
                                        <span className="font-medium text-slate-700">{item.name} × {item.quantity}</span>
                                        <span className="font-mono text-slate-600">${item.price * item.quantity}</span>
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
            <p className="text-xs text-slate-400 mt-0.5">檢視營業額與毛利統計分析。</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60 space-y-1">
              <p className="text-xs text-slate-400 font-medium">累計總營業額</p>
              <p className="text-2xl font-bold font-mono text-slate-800">
                ${salesRecords.reduce((sum, r) => sum + r.totalAmount, 0)}
              </p>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60 space-y-1">
              <p className="text-xs text-slate-400 font-medium">累計總毛利</p>
              <p className="text-2xl font-bold font-mono text-emerald-600">
                ${salesRecords.reduce((sum, r) => sum + r.profit, 0)}
              </p>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60 space-y-1">
              <p className="text-xs text-slate-400 font-medium">總銷售訂單數</p>
              <p className="text-2xl font-bold font-mono text-blue-600">{salesRecords.length}</p>
            </div>
          </div>
        </div>
      )}

      {isPlanModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-xl space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-800">選擇電信方案</h3>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-slate-400 hover:text-rose-600 text-base">×</button>
            </div>
            <input
              type="text"
              value={planSearch}
              onChange={(e) => setPlanSearch(e.target.value)}
              placeholder="搜尋方案名稱 / 電信商..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs"
            />
            <div className="overflow-y-auto space-y-2 flex-1">
              {filteredPlans.map(pl => (
                <div key={pl.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-2xl hover:bg-blue-50/50 transition">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{pl.name} ({pl.telecom})</p>
                    <p className="text-[10px] text-slate-400">月租: ${pl.monthlyFee} | 佣金: ${pl.storeRebate}</p>
                  </div>
                  <button onClick={() => addPlanToCart(pl)} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-bold">代入方案</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isCustomModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-800">新增自訂項目 / 維修項目</h3>
              <button onClick={() => setIsCustomModalOpen(false)} className="text-slate-400 hover:text-rose-600 text-base">×</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">類型</label>
                <select value={customType} onChange={(e) => setCustomType(e.target.value as any)} className="w-full bg-slate-50 border rounded-xl px-3 py-2">
                  <option value="自訂配件/商品">自訂配件/商品</option>
                  <option value="維修服務">維修服務</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">名稱</label>
                <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="例：iPhone 14 換螢幕" className="w-full bg-slate-50 border rounded-xl px-3 py-2" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">售價 ($)</label>
                <input type="number" value={customPrice} onChange={(e) => setCustomPrice(Number(e.target.value))} className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-mono" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">成本 ($)</label>
                <input type="number" value={customCost} onChange={(e) => setCustomCost(Number(e.target.value))} className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-mono" />
              </div>
              <button onClick={handleAddCustomItem} className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-sm">確認加入購物車</button>
            </div>
          </div>
        </div>
      )}

      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-800">快速建立會員</h3>
              <button onClick={() => setIsCustomerModalOpen(false)} className="text-slate-400 hover:text-rose-600 text-base">×</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">客戶姓名</label>
                <input type="text" value={newCustName} onChange={(e) => setNewCustName(e.target.value)} placeholder="例：王小明" className="w-full bg-slate-50 border rounded-xl px-3 py-2" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">聯絡電話</label>
                <input type="text" value={newCustPhone} onChange={(e) => setNewCustPhone(e.target.value)} placeholder="例：0912345678" className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-mono" />
              </div>
              <button onClick={handleCreateCustomer} className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-sm">確認新增並選取</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
