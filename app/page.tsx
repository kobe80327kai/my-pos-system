'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
}

interface Plan {
  id: string;
  code: string;
  name: string;
  telecom: '遠傳電信' | '台灣大哥大' | '中華電信' | string;
  type: '新申辦' | '攜碼' | '續約' | '手機保險' | string;
  monthlyFee: number;
  commission: number;
  contractMonths?: number;
  prepayment?: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  cost: number;
  commission: number;
  quantity: number;
  type: 'product' | 'plan' | 'custom' | 'repair';
}

interface PaymentRow {
  id: string;
  method: '現金' | '刷卡' | '刷卡分期' | '無卡分期' | '匯款';
  installments: string;
}

interface SaleRecord {
  id: string;
  orderNo: string;
  date: string;
  customerName: string;
  customerType: string;
  salesperson: string;
  store: string;
  items: {
    name: string;
    imei: string;
    cost: number;
    price: number;
    quantity: number;
    category?: 'combination' | 'phone' | 'usedPhone' | 'accessory' | 'repair';
  }[];
  totalAmount: number;
  totalCost: number;
  profit: number;
  paymentInfo: string;
}

export default function Home() {
  const [currentTab, setCurrentTab] = useState<'pos' | 'salesRecord' | 'performance'>('pos');

  const products: Product[] = [
    { id: 'p1', name: '滿版保貼', price: 200, cost: 50, stock: 10 },
    { id: 'p2', name: 'AIR6皮套', price: 200, cost: 70, stock: 8 },
    { id: 'p3', name: 'iPhone 15 128G', price: 25900, cost: 23000, stock: 3 },
  ];

  const [plans, setPlans] = useState<Plan[]>([]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('讀取方案失敗:', error);
        return;
      }

      if (data) {
        const formattedPlans: Plan[] = data.map((item: any) => ({
          id: item.id.toString(),
          code: item.code || '',
          name: item.name || '',
          telecom: item.telecom || '遠傳電信',
          type: item.type || '攜碼',
          monthlyFee: Number(item.monthly_fee || 0),
          commission: Number(item.actual_commission || item.store_commission || 0),
          contractMonths: Number(item.contract_months || 24),
          prepayment: Number(item.prepayment || 0),
        }));
        setPlans(formattedPlans);
      }
    } catch (err) {
      console.error('連線 Supabase 方案資料失敗:', err);
    }
  };

  const [customers, setCustomers] = useState<Customer[]>([]);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('讀取客戶失敗:', error);
        return;
      }

      if (data) {
        const formattedCustomers: Customer[] = data.map((item: any) => ({
          id: item.id.toString(),
          name: item.name || '',
          phone: item.phone || '',
        }));
        setCustomers(formattedCustomers);
      }
    } catch (err) {
      console.error('連線 Supabase 客戶資料失敗:', err);
    }
  };

  const [salesRecords, setSalesRecords] = useState<SaleRecord[]>([]);

  useEffect(() => {
    fetchSalesRecords();
    fetchPlans();
    fetchCustomers();
  }, []);

  const fetchSalesRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('讀取銷售紀錄失敗:', error);
        return;
      }

      if (data) {
        const formattedRecords: SaleRecord[] = data.map((item: any) => ({
          id: item.id,
          orderNo: item.order_no,
          date: item.date,
          customerName: item.customer_name,
          customerType: item.customer_type,
          salesperson: item.salesperson,
          store: item.store,
          items: typeof item.items === 'string' ? JSON.parse(item.items) : item.items,
          totalAmount: Number(item.total_amount),
          totalCost: Number(item.total_cost),
          profit: Number(item.profit),
          paymentInfo: item.payment_info
        }));
        setSalesRecords(formattedRecords);
      }
    } catch (err) {
      console.error('連線 Supabase 發生錯誤:', err);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  const [isQuickCustomerModalOpen, setIsQuickCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [planSearch, setPlanSearch] = useState('');
  const [activePlanType, setActivePlanType] = useState<string>('全部');
  const [activeTelecom, setActiveTelecom] = useState<string>('所有電信');

  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customCategory, setCustomCategory] = useState<'accessory' | 'repair'>('accessory');
  const [customCost, setCustomCost] = useState('');

  const [payments, setPayments] = useState<PaymentRow[]>([
    { id: '1', method: '現金', installments: '—' },
  ]);

  const feeRates: Record<string, number> = {
    '現金': 0,
    '刷卡': 0.02,
    '刷卡分期-3': 0.03,
    '刷卡分期-6': 0.04,
    '刷卡分期-12': 0.06,
    '刷卡分期-18': 0.035,
    '刷卡分期-24': 0.04,
    '無卡分期': 0.05,
    '匯款': 0,
  };

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [recordSearchKeyword, setRecordSearchKeyword] = useState('');
  const [filterStoreStaff, setFilterStoreStaff] = useState('全部');
  const [filterCustType, setFilterCustType] = useState('全部');
  const [datePreset, setDatePreset] = useState<'today' | 'week' | 'month' | 'all'>('today');

  const [startDate, setStartDate] = useState(getTodayStr());
  const [endDate, setEndDate] = useState(getTodayStr());
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SaleRecord | null>(null);

  const [perfStaff, setPerfStaff] = useState('全部人員');
  const [perfStartDate, setPerfStartDate] = useState(getTodayStr());
  const [perfEndDate, setPerfEndDate] = useState(getTodayStr());

  const handleDatePreset = (preset: 'today' | 'week' | 'month' | 'all') => {
    setDatePreset(preset);
    const today = new Date();
    const formatDateStr = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'today') {
      const s = formatDateStr(today);
      setStartDate(s);
      setEndDate(s);
    } else if (preset === 'week') {
      const firstDayOfWeek = new Date(today);
      firstDayOfWeek.setDate(today.getDate() - today.getDay());
      setStartDate(formatDateStr(firstDayOfWeek));
      setEndDate(formatDateStr(today));
    } else if (preset === 'month') {
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatDateStr(firstDayOfMonth));
      setEndDate(formatDateStr(today));
    } else if (preset === 'all') {
      setStartDate('2025-01-01');
      setEndDate('2030-12-31');
    }
  };

  const filteredSalesRecords = salesRecords.filter(record => {
    const keyword = recordSearchKeyword.toLowerCase();
    const matchKeyword = !keyword ||
      record.orderNo.toLowerCase().includes(keyword) ||
      record.customerName.toLowerCase().includes(keyword) ||
      record.salesperson.toLowerCase().includes(keyword) ||
      record.items.some(i => i.name.toLowerCase().includes(keyword) || (i.imei && i.imei.toLowerCase().includes(keyword)));

    const matchStaff = filterStoreStaff === '全部' || record.salesperson === filterStoreStaff;
    const matchCustType = filterCustType === '全部' || record.customerType === filterCustType;
    const matchDate = record.date >= startDate && record.date <= endDate;

    return matchKeyword && matchStaff && matchCustType && matchDate;
  });

  const filteredPerfRecords = salesRecords.filter(record => {
    const matchStaff = perfStaff === '全部人員' || record.salesperson === perfStaff;
    const matchDate = record.date >= perfStartDate && record.date <= perfEndDate;
    return matchStaff && matchDate;
  });

  const perfTotalAmount = filteredPerfRecords.reduce((sum, r) => sum + r.totalAmount, 0);
  const perfTotalProfit = filteredPerfRecords.reduce((sum, r) => sum + r.profit, 0);

  const handleDeleteRecord = async (id: string) => {
    if (confirm('確定要刪除這筆銷售紀錄嗎？')) {
      const { error } = await supabase
        .from('sales_records')
        .delete()
        .eq('id', id);

      if (error) {
        alert('刪除失敗：' + error.message);
        return;
      }

      setSalesRecords(prev => prev.filter(r => r.id !== id));
      setIsEditModalOpen(false);
      setEditingRecord(null);
      alert('刪除成功！');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    const totalCost = editingRecord.items.reduce((sum, i) => sum + i.cost * i.quantity, 0);
    const totalAmount = editingRecord.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const profit = totalAmount - totalCost;

    const updatedDbPayload = {
      order_no: editingRecord.orderNo,
      date: editingRecord.date,
      customer_name: editingRecord.customerName,
      customer_type: editingRecord.customerType,
      salesperson: editingRecord.salesperson,
      store: editingRecord.store,
      items: editingRecord.items,
      total_amount: totalAmount,
      total_cost: totalCost,
      profit: profit,
      payment_info: editingRecord.paymentInfo
    };

    const { error } = await supabase
      .from('sales_records')
      .update(updatedDbPayload)
      .eq('id', editingRecord.id);

    if (error) {
      alert('更新失敗：' + error.message);
      return;
    }

    fetchSalesRecords();
    setIsEditModalOpen(false);
    setEditingRecord(null);
    alert('修改成功！');
  };

  const addToCart = (item: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, cost: item.cost, commission: 0, quantity: 1, type: 'product' }];
    });
  };

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    const planCartItem: CartItem = {
      id: `plan-${plan.id}`,
      name: `[${plan.telecom}] ${plan.name} (${plan.type})`,
      price: 0,
      cost: 0,
      commission: plan.commission,
      quantity: 1,
      type: 'plan',
    };
    setCart((prev) => [...prev.filter(i => i.type !== 'plan'), planCartItem]);
    setIsPlanModalOpen(false);
  };

  const handleAddCustomItem = () => {
    if (!customName.trim() || !customPrice) {
      alert('請完整填寫項目名稱與金額！');
      return;
    }
    const priceNum = parseFloat(customPrice);
    const costNum = parseFloat(customCost) || 0;
    if (isNaN(priceNum)) {
      alert('金額必須為有效數字！');
      return;
    }

    const newItem: CartItem = {
      id: `custom-${Date.now()}`,
      name: customName,
      price: priceNum,
      cost: costNum,
      commission: 0,
      quantity: 1,
      type: customCategory === 'repair' ? 'repair' : 'custom',
    };

    setCart((prev) => [...prev, newItem]);
    setCustomName('');
    setCustomPrice('');
    setCustomCost('');
    setIsCustomModalOpen(false);
  };

  const handleCreateCustomer = async () => {
    if (!newCustName.trim() || !newCustPhone.trim()) {
      alert('請填寫姓名與電話！');
      return;
    }

    const newDbCustomer = {
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
    };

    const { error } = await supabase
      .from('customers')
      .insert([newDbCustomer])
      .select();

    if (error) {
      alert('建立客戶失敗：' + error.message);
      return;
    }

    await fetchCustomers();
    setCustomerSearch(`${newCustName.trim()} ( ${newCustPhone.trim()} )`);
    setNewCustName('');
    setNewCustPhone('');
    setIsQuickCustomerModalOpen(false);
    alert('會員建立成功！');
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const totalProfit = cart.reduce((sum, item) => {
    if (item.type === 'plan') {
      return sum + item.commission;
    }
    return sum + (item.price - item.cost) * item.quantity;
  }, 0);

  const addPaymentRow = () => {
    setPayments([...payments, { id: Date.now().toString(), method: '刷卡分期', installments: '3' }]);
  };

  const removePaymentRow = (id: string) => {
    setPayments(payments.filter(p => p.id !== id));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('購物車目前沒有項目！');
      return;
    }

    const nowStr = getTodayStr();
    const orderNo = `SD${nowStr.replace(/-/g, '').slice(2)}${Math.floor(100 + Math.random() * 900)}`;
    const recordId = `sr-${Date.now()}`;

    const newDbRecord = {
      id: recordId,
      order_no: orderNo,
      date: nowStr,
      customer_name: customerSearch.split('(')[0].trim() || '個人貴賓',
      customer_type: '個人貴賓',
      salesperson: '管理員',
      store: '總店',
      items: cart.map(i => ({
        name: i.name,
        imei: '—',
        cost: i.type === 'plan' ? 0 : i.cost,
        price: i.price,
        quantity: i.quantity,
        category: i.type === 'repair' ? 'repair' : 'accessory'
      })),
      total_amount: subtotal,
      total_cost: 0,
      profit: totalProfit,
      payment_info: payments.map(p => p.method === '刷卡分期' ? `刷卡分期(${p.installments}期)` : p.method).join(', ')
    };

    const { error } = await supabase.from('sales_records').insert([newDbRecord]);

    if (error) {
      alert('結帳失敗：' + error.message);
      return;
    }

    await fetchSalesRecords();
    setExpandedRowId(recordId);
    alert(`結帳成功！單號：${orderNo}，總金額：$${subtotal.toLocaleString()}，總毛利：$${totalProfit.toLocaleString()}。`);

    setCart([]);
    setSelectedPlan(null);
    setPayments([{ id: '1', method: '現金', installments: '—' }]);
    setCurrentTab('salesRecord');
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  const filteredPlans = plans.filter(pl => {
    const matchKw = !planSearch || pl.name.toLowerCase().includes(planSearch.toLowerCase()) || pl.code.toLowerCase().includes(planSearch.toLowerCase());
    const matchType = activePlanType === '全部' || pl.type === activePlanType;
    const matchTel = activeTelecom === '所有電信' || pl.telecom === activeTelecom;
    return matchKw && matchType && matchTel;
  });

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-100 text-slate-800 font-sans w-full">
      {/* 頂部切換頁籤列 */}
      <div className="bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500">快速切換：</span>
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setCurrentTab('pos')}
              className={`px-3 py-1 rounded-lg transition font-medium ${currentTab === 'pos' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              🛒 銷貨結帳
            </button>
            <button
              onClick={() => setCurrentTab('salesRecord')}
              className={`px-3 py-1 rounded-lg transition font-medium ${currentTab === 'salesRecord' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              📄 銷售紀錄
            </button>
            <button
              onClick={() => setCurrentTab('performance')}
              className={`px-3 py-1 rounded-lg transition font-medium ${currentTab === 'performance' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              📊 業績報表
            </button>
          </div>
        </div>
        <div className="text-xs text-slate-400">
          目前身份：<strong className="text-slate-700">管理員</strong>
        </div>
      </div>

      {/* 銷貨結帳 */}
      {currentTab === 'pos' && (
        <div className="p-8 space-y-6">
          <div>
            <h1 className="text-xl font-bold text-slate-800">銷貨結帳</h1>
            <p className="text-xs text-slate-400 mt-0.5">選取方案不代入月租，金額可自由手動修改，傭金自動計入毛利。</p>
          </div>

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-7 space-y-5">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/60 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">選擇方案</label>
                  <button onClick={() => { fetchPlans(); setIsPlanModalOpen(true); }} className="text-xs text-blue-600 font-semibold hover:underline">
                    + 代入電信方案
                  </button>
                </div>
                <div
                  onClick={() => { fetchPlans(); setIsPlanModalOpen(true); }}
                  className="w-full border border-dashed border-slate-300 rounded-xl p-3.5 bg-slate-50/50 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition"
                >
                  <span className="text-xs text-slate-600 font-medium">
                    {selectedPlan ? `📌 已代入：[${selectedPlan.telecom}] ${selectedPlan.name} (傭金 $${selectedPlan.commission})` : '👉 點擊開啟方案選擇視窗'}
                  </span>
                  <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2.5 py-1 rounded-lg">選擇方案</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/60 space-y-4">
                <h2 className="text-xs font-bold text-slate-700">加入商品</h2>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜尋商品名稱 / 商品編號 / IMEI..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  {filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className="flex justify-between items-center p-3.5 rounded-xl border border-slate-100 bg-white hover:border-blue-300 hover:shadow-sm cursor-pointer transition"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800">{p.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">庫存：{p.stock} | 成本：${p.cost}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-blue-600">${p.price}</span>
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[11px] rounded-lg font-medium">+ 加入</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-5 space-y-5">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/60 space-y-4 relative">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🛒</span>
                    <h2 className="text-xs font-bold text-slate-800">購物車明細</h2>
                    <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-[10px] font-mono">{cart.length}</span>
                  </div>
                  <button onClick={() => { setCart([]); setSelectedPlan(null); }} className="text-xs text-slate-400 hover:text-rose-500">清空</button>
                </div>

                <div className="space-y-1.5 relative">
                  <div className="flex justify-between items-center text-[11px] text-slate-500">
                    <span>客戶（選填，個人貴賓可不選）</span>
                    <button onClick={() => setIsQuickCustomerModalOpen(true)} className="text-blue-600 font-semibold hover:underline">
                      ＋ 快速建立會員
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={customerSearch}
                      onFocus={() => { fetchCustomers(); setIsCustomerDropdownOpen(true); }}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setIsCustomerDropdownOpen(true);
                      }}
                      placeholder="搜尋姓名或電話..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                    />

                    {isCustomerDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-20">
                        {filteredCustomers.length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-400">找不到符合的客戶資料</div>
                        ) : (
                          filteredCustomers.map((c) => (
                            <div
                              key={c.id}
                              onClick={() => {
                                setCustomerSearch(`${c.name} ( ${c.phone} )`);
                                setIsCustomerDropdownOpen(false);
                              }}
                              className="px-3 py-2.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center text-xs border-b border-slate-50 last:border-none"
                            >
                              <span className="font-bold text-slate-800">{c.name}</span>
                              <span className="text-slate-400 font-mono">{c.phone}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {cart.length === 0 ? (
                    <p className="text-center py-6 text-xs text-slate-400">尚未加入品項或方案</p>
                  ) : (
                    cart.map((item) => {
                      const itemProfit = item.type === 'plan' ? item.commission : (item.price - item.cost) * item.quantity;
                      return (
                        <div key={item.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-800">{item.name}</span>
                            <button onClick={() => {
                              if (item.type === 'plan') setSelectedPlan(null);
                              setCart(cart.filter(i => i.id !== item.id));
                            }} className="text-slate-300 hover:text-rose-500 font-bold">✕</button>
                          </div>

                          <div className="flex justify-between items-center gap-2">
                            <div>
                              <span className="text-[10px] text-slate-400 block">{item.type === 'plan' ? '方案傭金' : '售價 ($)'}</span>
                              {item.type === 'plan' ? (
                                <span className="font-mono font-bold text-emerald-600">+${item.commission}</span>
                              ) : (
                                <input
                                  type="number"
                                  value={item.price}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setCart(cart.map(i => i.id === item.id ? { ...i, price: val } : i));
                                  }}
                                  className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1 font-mono text-slate-700"
                                />
                              )}
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block">預估毛利</span>
                              <span className="font-mono font-bold text-emerald-600">+${itemProfit}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <button
                  onClick={() => { setCustomCategory('accessory'); setIsCustomModalOpen(true); }}
                  className="w-full py-2.5 border border-dashed border-slate-300 hover:border-blue-500 hover:text-blue-600 text-slate-500 rounded-xl text-xs font-semibold transition"
                >
                  ＋ 自訂項目 / 🛠️ 維修項目
                </button>

                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700">付款方式與期數</label>
                    <button onClick={addPaymentRow} className="text-xs text-blue-600 font-semibold hover:underline">+ 新增付款方式</button>
                  </div>

                  <div className="space-y-2">
                    {payments.map((pay) => {
                      const currentKey = pay.method === '刷卡分期' ? `刷卡分期-${pay.installments}` : pay.method;
                      const rate = feeRates[currentKey] || 0;
                      const estimatedFee = Math.round(subtotal * rate);

                      return (
                        <div key={pay.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                          <div className="flex items-center gap-2">
                            <select
                              value={pay.method}
                              onChange={(e) => {
                                const newMethod = e.target.value as any;
                                setPayments(payments.map(p => p.id === pay.id ? { ...p, method: newMethod } : p));
                              }}
                              className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-medium text-slate-700"
                            >
                              <option value="現金">現金</option>
                              <option value="刷卡">刷卡</option>
                              <option value="刷卡分期">刷卡分期</option>
                              <option value="無卡分期">無卡分期</option>
                              <option value="匯款">匯款</option>
                            </select>

                            {pay.method === '刷卡分期' && (
                              <select
                                value={pay.installments}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPayments(payments.map(p => p.id === pay.id ? { ...p, installments: val } : p));
                                }}
                                className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-medium text-blue-600"
                              >
                                <option value="3">3 期 (3%)</option>
                                <option value="6">6 期 (4%)</option>
                                <option value="12">12 期 (6%)</option>
                                <option value="18">18 期</option>
                                <option value="24">24 期</option>
                              </select>
                            )}

                            <button onClick={() => removePaymentRow(pay.id)} className="ml-auto text-slate-400 hover:text-rose-500 font-bold">🗑️</button>
                          </div>

                          <div className="flex justify-between items-center text-[11px] text-slate-500 px-1">
                            <span>手續費率: <strong className="text-slate-700">{(rate * 100)}%</strong></span>
                            <span className="text-amber-600 font-mono">手續費加成: +${estimatedFee}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">預估總毛利：</span>
                    <span className="font-mono font-bold text-emerald-600 text-sm">+${totalProfit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-700">總金額：</span>
                    <span className="font-mono font-bold text-rose-600 text-lg">${subtotal.toLocaleString()}</span>
                  </div>

                  <button onClick={handleCheckout} className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition mt-2">
                    確認結帳
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 銷售紀錄頁籤 */}
      {currentTab === 'salesRecord' && (
        <div className="p-8 space-y-6">
          <div>
            <h1 className="text-xl font-bold text-slate-800">銷售紀錄</h1>
            <p className="text-xs text-slate-400 mt-0.5">檢視與管理所有歷史訂單記錄。</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/60 space-y-4">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <input
                type="text"
                value={recordSearchKeyword}
                onChange={(e) => setRecordSearchKeyword(e.target.value)}
                placeholder="搜尋單號、客戶、銷售員、品項..."
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 w-72 focus:outline-none focus:border-blue-500"
              />
              <div className="flex items-center gap-2">
                <button onClick={() => handleDatePreset('today')} className={`px-3 py-1.5 rounded-xl text-xs font-medium ${datePreset === 'today' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>今日</button>
                <button onClick={() => handleDatePreset('week')} className={`px-3 py-1.5 rounded-xl text-xs font-medium ${datePreset === 'week' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>本週</button>
                <button onClick={() => handleDatePreset('month')} className={`px-3 py-1.5 rounded-xl text-xs font-medium ${datePreset === 'month' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>本月</button>
                <button onClick={() => handleDatePreset('all')} className={`px-3 py-1.5 rounded-xl text-xs font-medium ${datePreset === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>全部</button>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 ml-2" />
                <span className="text-slate-400">~</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium">
                    <th className="pb-3 pl-3">單號 / 日期</th>
                    <th className="pb-3">客戶</th>
                    <th className="pb-3">品項內容</th>
                    <th className="pb-3">付款資訊</th>
                    <th className="pb-3 text-right">總金額</th>
                    <th className="pb-3 text-right pr-3">毛利</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredSalesRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">沒有符合條件的銷售紀錄</td>
                    </tr>
                  ) : (
                    filteredSalesRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 pl-3">
                          <p className="font-bold text-slate-800 font-mono">{r.orderNo}</p>
                          <p className="text-[11px] text-slate-400">{r.date}</p>
                        </td>
                        <td className="py-3.5 font-medium text-slate-700">{r.customerName}</td>
                        <td className="py-3.5 max-w-xs">
                          {r.items.map((i, idx) => (
                            <div key={idx} className="text-slate-600 truncate">
                              • {i.name} {i.quantity > 1 ? `x${i.quantity}` : ''} (${i.price})
                            </div>
                          ))}
                        </td>
                        <td className="py-3.5 text-slate-600">{r.paymentInfo}</td>
                        <td className="py-3.5 text-right font-mono font-bold text-slate-800">${r.totalAmount.toLocaleString()}</td>
                        <td className="py-3.5 text-right pr-3 font-mono font-bold text-emerald-600">+${r.profit.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 業績報表頁籤 */}
      {currentTab === 'performance' && (
        <div className="p-8 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-2">
            <h2 className="text-base font-bold text-slate-800">業績報表</h2>
            <p className="text-xs text-slate-400">檢視指定區間內的整體業績與毛利統計。</p>
            <div className="flex items-center gap-2 pt-2">
              <input 
                type="date" 
                value={perfStartDate} 
                onChange={(e) => setPerfStartDate(e.target.value)} 
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700"
              />
              <span className="text-slate-400">~</span>
              <input 
                type="date" 
                value={perfEndDate} 
                onChange={(e) => setPerfEndDate(e.target.value)} 
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60 space-y-2">
              <span className="text-xs text-slate-400 font-medium">區間總業績</span>
              <h3 className="text-4xl font-mono font-bold text-slate-800">${perfTotalAmount.toLocaleString()}</h3>
            </div>
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60 space-y-2">
              <span className="text-xs text-slate-400 font-medium">區間總毛利</span>
              <h3 className="text-4xl font-mono font-bold text-emerald-600">+${perfTotalProfit.toLocaleString()}</h3>
            </div>
          </div>
        </div>
      )}

      {/* 快速建立會員 Modal */}
      {isQuickCustomerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800">快速建立會員</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">客戶姓名</label>
                <input
                  type="text"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="請輸入姓名"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">手機號碼</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="請輸入手機號碼"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsQuickCustomerModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-medium">取消</button>
              <button onClick={handleCreateCustomer} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-medium">確認建立</button>
            </div>
          </div>
        </div>
      )}

      {/* 方案選擇 Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[600px] max-h-[80vh] flex flex-col shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800">選擇電信方案</h3>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <input
              type="text"
              value={planSearch}
              onChange={(e) => setPlanSearch(e.target.value)}
              placeholder="搜尋方案名稱或代碼..."
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
            />
            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {filteredPlans.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">找不到符合的方案</div>
              ) : (
                filteredPlans.map((pl) => (
                  <div
                    key={pl.id}
                    onClick={() => handleSelectPlan(pl)}
                    className="p-3 border border-slate-100 hover:border-blue-500 hover:bg-blue-50/30 rounded-xl cursor-pointer flex justify-between items-center transition text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-800">[{pl.telecom}] {pl.name} ({pl.type})</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">月租：${pl.monthlyFee} | 佣金：${pl.commission}</p>
                    </div>
                    <span className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium">選擇</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 自訂項目 / 維修項目 Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800">新增自訂項目 / 維修項目</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">分類</label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="accessory">自訂品項 / 周邊</option>
                  <option value="repair">🛠️ 維修項目</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">項目名稱</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="例如：iPhone 14 換螢幕 / 保護貼"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">售價 ($)</label>
                <input
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">成本 ($)</label>
                <input
                  type="number"
                  value={customCost}
                  onChange={(e) => setCustomCost(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsCustomModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-medium">取消</button>
              <button onClick={handleAddCustomItem} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-medium">加入購物車</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
