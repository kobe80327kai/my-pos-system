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
  method: '現金' | '刷卡' | '刷卡/分期' | '無卡分期' | 'LinePay' | '匯款';
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
  // 新增「營運報表」與「控制台」頁籤支援
  const [currentTab, setCurrentTab] = useState<'control' | 'pos' | 'salesRecord' | 'performance' | 'operationsReport'>('control');

  const products: Product[] = [
    { id: 'p1', name: '滿版保貼', price: 200, cost: 50, stock: 10 },
    { id: 'p2', name: 'AIR6皮套', price: 200, cost: 70, stock: 8 },
    { id: 'p3', name: 'iPhone 15 128G', price: 25900, cost: 23000, stock: 3 },
  ];

  const [plans, setPlans] = useState<Plan[]>([]);
  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase.from('plans').select('*').order('created_at', { ascending: false });
      if (error) return;
      if (data) {
        setPlans(data.map((item: any) => ({
          id: item.id.toString(),
          code: item.code || '',
          name: item.name || '',
          telecom: item.telecom || '遠傳電信',
          type: item.type || '攜碼',
          monthlyFee: Number(item.monthly_fee || 0),
          commission: Number(item.actual_commission || item.store_commission || 0),
          contractMonths: Number(item.contract_months || 24),
          prepayment: Number(item.prepayment || 0),
        })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [customers, setCustomers] = useState<Customer[]>([]);
  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      if (error) return;
      if (data) {
        setCustomers(data.map((item: any) => ({
          id: item.id.toString(),
          name: item.name || '',
          phone: item.phone || '',
        })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [salesRecords, setSalesRecords] = useState<SaleRecord[]>([]);
  const fetchSalesRecords = async () => {
    try {
      const { data, error } = await supabase.from('sales_records').select('*').order('created_at', { ascending: false });
      if (error) return;
      if (data) {
        setSalesRecords(data.map((item: any) => ({
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
        })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSalesRecords();
    fetchPlans();
    fetchCustomers();
  }, []);

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
    '刷卡/分期-3': 0.03,
    '刷卡/分期-6': 0.04,
    '刷卡/分期-12': 0.06,
    '無卡分期': 0.05,
    'LinePay': 0,
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
  const [datePreset, setDatePreset] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [startDate, setStartDate] = useState(getTodayStr());
  const [endDate, setEndDate] = useState(getTodayStr());

  // 營運報表篩選日期狀態
  const [reportFilterType, setReportFilterType] = useState<'month' | 'lastMonth' | 'custom'>('month');
  const [reportStartDate, setReportStartDate] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`);
  const [reportEndDate, setReportEndDate] = useState(getTodayStr());

  const handleDatePreset = (preset: 'today' | 'week' | 'month' | 'all') => {
    setDatePreset(preset);
    const today = new Date();
    const formatDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

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
    const matchKeyword = !keyword || record.orderNo.toLowerCase().includes(keyword) || record.customerName.toLowerCase().includes(keyword) || record.salesperson.toLowerCase().includes(keyword);
    const matchDate = record.date >= startDate && record.date <= endDate;
    return matchKeyword && matchDate;
  });

  // 計算今日數據 (控制台用)
  const todayStr = getTodayStr();
  const todayRecords = salesRecords.filter(r => r.date === todayStr);
  const todayTotalIncome = todayRecords.reduce((sum, r) => sum + r.totalAmount, 0);

  // 計算今日各付款方式金額與筆數
  const getPaymentStats = (methodName: string) => {
    let total = 0;
    let count = 0;
    todayRecords.forEach(r => {
      if (r.paymentInfo.includes(methodName)) {
        total += r.totalAmount;
        count += 1;
      }
    });
    return { total, count };
  };

  const cashStats = getPaymentStats('現金');
  const cardStats = getPaymentStats('刷卡');
  const installmentStats = getPaymentStats('刷卡/分期');
  const noCardStats = getPaymentStats('無卡分期');
  const linePayStats = getPaymentStats('LinePay');
  const transferStats = getPaymentStats('匯款');

  // 計算營運報表區間數據
  const reportRecords = salesRecords.filter(r => r.date >= reportStartDate && r.date <= reportEndDate);
  const reportTotalSales = reportRecords.reduce((sum, r) => sum + r.totalAmount, 0);
  const reportTotalCommission = reportRecords.reduce((sum, r) => {
    const planItem = r.items.find(i => i.name.includes('方案'));
    return sum + (planItem ? r.profit : 0);
  }, 0);
  const reportTotalProfit = reportRecords.reduce((sum, r) => sum + r.profit, 0);

  const handleDeleteRecord = async (id: string) => {
    if (confirm('確定要刪除這筆銷售紀錄嗎？')) {
      const { error } = await supabase.from('sales_records').delete().eq('id', id);
      if (error) {
        alert('刪除失敗：' + error.message);
        return;
      }
      setSalesRecords(prev => prev.filter(r => r.id !== id));
      alert('刪除成功！');
    }
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
    const { error } = await supabase.from('customers').insert([{ name: newCustName.trim(), phone: newCustPhone.trim() }]);
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
  const totalProfit = cart.reduce((sum, item) => item.type === 'plan' ? sum + item.commission : sum + (item.price - item.cost) * item.quantity, 0);

  const addPaymentRow = () => {
    setPayments([...payments, { id: Date.now().toString(), method: '刷卡/分期', installments: '3' }]);
  };

  const removePaymentRow = (id: string) => {
    setPayments(payments.filter(p => p.id !== id));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('購物車目前沒有項目！');
      return;
    }

    const orderNo = `SD${todayStr.replace(/-/g, '').slice(2)}${Math.floor(100 + Math.random() * 900)}`;
    const recordId = `sr-${Date.now()}`;

    const newDbRecord = {
      id: recordId,
      order_no: orderNo,
      date: todayStr,
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
      payment_info: payments.map(p => p.method === '刷卡/分期' ? `刷卡/分期(${p.installments}期)` : p.method).join(', ')
    };

    const { error } = await supabase.from('sales_records').insert([newDbRecord]);
    if (error) {
      alert('結帳失敗：' + error.message);
      return;
    }

    await fetchSalesRecords();
    alert(`結帳成功！單號：${orderNo}，總金額：$${subtotal.toLocaleString()}`);
    setCart([]);
    setSelectedPlan(null);
    setPayments([{ id: '1', method: '現金', installments: '—' }]);
    setCurrentTab('salesRecord');
  };

  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch));
  const filteredPlans = plans.filter(pl => !planSearch || pl.name.toLowerCase().includes(planSearch.toLowerCase()) || pl.code.toLowerCase().includes(planSearch.toLowerCase()));

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
      {/* 左側導覽列 */}
      <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between p-4 select-none">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-md">P</div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wider">POS 門市系統</h1>
              <span className="text-[10px] text-slate-500 font-mono">v1.0.0</span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">主要功能</p>
            <button onClick={() => setCurrentTab('control')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${currentTab === 'control' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}>
              📊 控制台
            </button>
            <button onClick={() => setCurrentTab('pos')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${currentTab === 'pos' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}>
              🛒 銷貨結帳
            </button>
            <button onClick={() => setCurrentTab('salesRecord')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${currentTab === 'salesRecord' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}>
              📄 銷售紀錄
            </button>
            <button onClick={() => setCurrentTab('operationsReport')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${currentTab === 'operationsReport' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}>
              📈 營運報表
            </button>
          </div>
        </div>

        <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800/80 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">N</div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-200 truncate">管理員</p>
            <p className="text-[10px] text-slate-500 truncate">admin@pos.com</p>
          </div>
        </div>
      </div>

      {/* 右側主內容區 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-100 text-slate-800">
        
        {/* 控制台畫面 */}
        {currentTab === 'control' && (
          <div className="p-8 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-slate-400">今日淨收入</span>
                <p className="text-3xl font-mono font-bold text-emerald-600 mt-1">${todayTotalIncome.toLocaleString()}</p>
              </div>
              <div className="flex gap-4">
                <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100">
                  <span className="text-[11px] text-slate-400 block">總收入</span>
                  <span className="text-base font-mono font-bold text-emerald-600">${todayTotalIncome.toLocaleString()}</span>
                </div>
                <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100">
                  <span className="text-[11px] text-slate-400 block">總支出</span>
                  <span className="text-base font-mono font-bold text-rose-500">$0</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-700">收入明細</h3>
                  <span className="text-xs font-mono font-bold text-emerald-600">${todayTotalIncome.toLocaleString()}</span>
                </div>
                <div onClick={() => setCurrentTab('salesRecord')} className="p-3 bg-blue-50/50 hover:bg-blue-50 rounded-2xl cursor-pointer flex justify-between items-center transition">
                  <span className="text-xs text-blue-600 font-semibold">銷售與收入小計 (點擊看明細)</span>
                  <span className="text-xs font-mono font-bold text-blue-600">{todayRecords.length}筆 ${todayTotalIncome.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-3">
                <h3 className="text-xs font-bold text-slate-700">支出 ( 雜支 )</h3>
                <div className="p-6 text-center text-xs text-slate-400">今日無支出記錄</div>
              </div>
            </div>

            {/* 款項結算 */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
              <h3 className="text-xs font-bold text-slate-700">款項結算</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100/60 space-y-1">
                  <span className="text-xs font-bold text-slate-600">現金</span>
                  <p className="text-lg font-mono font-bold text-emerald-600">${cashStats.total.toLocaleString()}</p>
                  <span className="text-[10px] text-slate-400">{cashStats.count} 筆</span>
                </div>
                <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-100/60 space-y-1">
                  <span className="text-xs font-bold text-slate-600">刷卡</span>
                  <p className="text-lg font-mono font-bold text-blue-600">${cardStats.total.toLocaleString()}</p>
                  <span className="text-[10px] text-slate-400">{cardStats.count} 筆</span>
                </div>
                <div className="p-4 bg-amber-50/40 rounded-2xl border border-amber-100/60 space-y-1">
                  <span className="text-xs font-bold text-slate-600">刷卡/分期</span>
                  <p className="text-lg font-mono font-bold text-amber-600">${installmentStats.total.toLocaleString()}</p>
                  <span className="text-[10px] text-slate-400">{installmentStats.count} 筆</span>
                </div>
                <div className="p-4 bg-purple-50/40 rounded-2xl border border-purple-100/60 space-y-1">
                  <span className="text-xs font-bold text-slate-600">無卡分期</span>
                  <p className="text-lg font-mono font-bold text-purple-600">${noCardStats.total.toLocaleString()}</p>
                  <span className="text-[10px] text-slate-400">{noCardStats.count} 筆</span>
                </div>
                <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100/60 space-y-1">
                  <span className="text-xs font-bold text-slate-600">LinePay</span>
                  <p className="text-lg font-mono font-bold text-emerald-600">${linePayStats.total.toLocaleString()}</p>
                  <span className="text-[10px] text-slate-400">{linePayStats.count} 筆</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-xs font-bold text-slate-600">匯款</span>
                  <p className="text-lg font-mono font-bold text-slate-700">${transferStats.total.toLocaleString()}</p>
                  <span className="text-[10px] text-slate-400">{transferStats.count} 筆</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 銷貨結帳頁面 */}
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
                    <button onClick={() => { fetchPlans(); setIsPlanModalOpen(true); }} className="text-xs text-blue-600 font-semibold hover:underline">+ 代入電信方案</button>
                  </div>
                  <div onClick={() => { fetchPlans(); setIsPlanModalOpen(true); }} className="w-full border border-dashed border-slate-300 rounded-xl p-3.5 bg-slate-50/50 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition">
                    <span className="text-xs text-slate-600 font-medium">
                      {selectedPlan ? `📌 已代入：[${selectedPlan.telecom}] ${selectedPlan.name} (傭金 $${selectedPlan.commission})` : '👉 點擊開啟方案選擇視窗'}
                    </span>
                    <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2.5 py-1 rounded-lg">選擇方案</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/60 space-y-4">
                  <h2 className="text-xs font-bold text-slate-700">加入商品</h2>
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="搜尋商品名稱..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500" />
                  <div className="space-y-2 pt-2">
                    {products.map((p) => (
                      <div key={p.id} onClick={() => addToCart(p)} className="flex justify-between items-center p-3.5 rounded-xl border border-slate-100 bg-white hover:border-blue-300 cursor-pointer transition">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{p.name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">庫存：{p.stock}</p>
                        </div>
                        <span className="text-xs font-mono font-bold text-blue-600">${p.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-5 space-y-5">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/60 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h2 className="text-xs font-bold text-slate-800">購物車明細</h2>
                    <button onClick={() => { setCart([]); setSelectedPlan(null); }} className="text-xs text-slate-400 hover:text-rose-500">清空</button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] text-slate-500">
                      <span>客戶</span>
                      <button onClick={() => setIsQuickCustomerModalOpen(true)} className="text-blue-600 font-semibold hover:underline">＋ 快速建立會員</button>
                    </div>
                    <input type="text" value={customerSearch} onFocus={() => { fetchCustomers(); setIsCustomerDropdownOpen(true); }} onChange={(e) => { setCustomerSearch(e.target.value); setIsCustomerDropdownOpen(true); }} placeholder="搜尋姓名或電話..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none" />
                    {isCustomerDropdownOpen && (
                      <div className="bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                        {filteredCustomers.map((c) => (
                          <div key={c.id} onClick={() => { setCustomerSearch(`${c.name} ( ${c.phone} )`); setIsCustomerDropdownOpen(false); }} className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-xs flex justify-between">
                            <span>{c.name}</span><span className="text-slate-400">{c.phone}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs">
                        <span>{item.name}</span>
                        <span className="font-mono font-bold">${item.type === 'plan' ? item.commission : item.price}</span>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => setIsCustomModalOpen(true)} className="w-full py-2 border border-dashed border-slate-300 rounded-xl text-xs text-slate-500 font-semibold">＋ 自訂 / 維修項目</button>

                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700">付款方式</label>
                      <button onClick={addPaymentRow} className="text-xs text-blue-600 font-semibold">+ 新增付款</button>
                    </div>
                    {payments.map((pay) => (
                      <div key={pay.id} className="flex gap-2">
                        <select value={pay.method} onChange={(e) => setPayments(payments.map(p => p.id === pay.id ? { ...p, method: e.target.value as any } : p))} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs">
                          <option value="現金">現金</option>
                          <option value="刷卡">刷卡</option>
                          <option value="刷卡/分期">刷卡/分期</option>
                          <option value="無卡分期">無卡分期</option>
                          <option value="LinePay">LinePay</option>
                          <option value="匯款">匯款</option>
                        </select>
                        <button onClick={() => removePaymentRow(pay.id)} className="text-rose-500 font-bold text-xs">✕</button>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-700">總金額：</span>
                    <span className="font-mono font-bold text-rose-600 text-lg">${subtotal.toLocaleString()}</span>
                  </div>

                  <button onClick={handleCheckout} className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition">確認結帳</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 銷售紀錄頁籤 */}
        {currentTab === 'salesRecord' && (
          <div className="p-8 space-y-6">
            <h1 className="text-xl font-bold text-slate-800">銷售紀錄</h1>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/60 space-y-4">
              <input type="text" value={recordSearchKeyword} onChange={(e) => setRecordSearchKeyword(e.target.value)} placeholder="搜尋單號、客戶..." className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs w-64" />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 bg-slate-50/50">
                      <th className="p-3">單號</th>
                      <th className="p-3">日期</th>
                      <th className="p-3">客戶名稱</th>
                      <th className="p-3">總金額</th>
                      <th className="p-3">付款方式</th>
                      <th className="p-3 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSalesRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-blue-600">{record.orderNo}</td>
                        <td className="p-3 text-slate-500">{record.date}</td>
                        <td className="p-3 font-semibold text-slate-800">{record.customerName}</td>
                        <td className="p-3 font-mono font-bold">${record.totalAmount.toLocaleString()}</td>
                        <td className="p-3 text-slate-600">{record.paymentInfo}</td>
                        <td className="p-3 text-right">
                          <button onClick={() => handleDeleteRecord(record.id)} className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 font-medium">刪除</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 營運報表畫面 */}
        {currentTab === 'operationsReport' && (
          <div className="p-8 space-y-6">
            <div>
              <h1 className="text-xl font-bold text-slate-800">營運報表</h1>
              <p className="text-xs text-slate-400 mt-0.5">即時統計銷售金額、傭金與盈餘。</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-6">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800">📊 盈餘報表</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                    <button onClick={() => { setReportFilterType('month'); }} className={`px-3 py-1.5 rounded-lg font-medium ${reportFilterType === 'month' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>本月</button>
                    <button onClick={() => { setReportFilterType('custom'); }} className={`px-3 py-1.5 rounded-lg font-medium ${reportFilterType === 'custom' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>自訂</button>
                  </div>
                  <input type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs" />
                  <span>~</span>
                  <input type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-5 gap-4">
                <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-xs text-slate-400 font-medium">銷售金額</span>
                  <p className="text-xl font-mono font-bold text-slate-800">${reportTotalSales.toLocaleString()}</p>
                </div>
                <div className="p-5 bg-purple-50/40 rounded-2xl border border-purple-100/50 space-y-1">
                  <span className="text-xs text-purple-600 font-medium">傭金</span>
                  <p className="text-xl font-mono font-bold text-purple-600">${reportTotalCommission.toLocaleString()}</p>
                </div>
                <div className="p-5 bg-emerald-50/40 rounded-2xl border border-emerald-100/50 space-y-1">
                  <span className="text-xs text-emerald-600 font-medium">雜收</span>
                  <p className="text-xl font-mono font-bold text-emerald-600">$0</p>
                </div>
                <div className="p-5 bg-rose-50/40 rounded-2xl border border-rose-100/50 space-y-1">
                  <span className="text-xs text-rose-500 font-medium">雜支</span>
                  <p className="text-xl font-mono font-bold text-rose-500">-$0</p>
                </div>
                <div className="p-5 bg-emerald-50/60 rounded-2xl border-2 border-emerald-500/40 space-y-1 shadow-sm">
                  <span className="text-xs text-emerald-700 font-bold">盈餘</span>
                  <p className="text-2xl font-mono font-bold text-emerald-600">${reportTotalProfit.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 各種彈跳視窗保持不變 */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 text-slate-800">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold">選擇方案</h3>
              <button onClick={() => setIsPlanModalOpen(false)}>✕</button>
            </div>
            <input type="text" value={planSearch} onChange={(e) => setPlanSearch(e.target.value)} placeholder="搜尋方案..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" />
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredPlans.map(pl => (
                <div key={pl.id} onClick={() => handleSelectPlan(pl)} className="p-3 bg-slate-50 rounded-xl hover:bg-blue-50 cursor-pointer flex justify-between text-xs">
                  <span>[{pl.telecom}] {pl.name}</span>
                  <span className="text-emerald-600 font-bold">+${pl.commission}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isQuickCustomerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 text-slate-800">
            <h3 className="text-sm font-bold">快速建立會員</h3>
            <input type="text" value={newCustName} onChange={(e) => setNewCustName(e.target.value)} placeholder="姓名" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" />
            <input type="text" value={newCustPhone} onChange={(e) => setNewCustPhone(e.target.value)} placeholder="電話" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" />
            <div className="flex gap-2">
              <button onClick={() => setIsQuickCustomerModalOpen(false)} className="flex-1 py-2 bg-slate-100 rounded-xl text-xs">取消</button>
              <button onClick={handleCreateCustomer} className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">確認</button>
            </div>
          </div>
        </div>
      )}

      {isCustomModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 text-slate-800">
            <h3 className="text-sm font-bold">自訂 / 維修項目</h3>
            <select value={customCategory} onChange={(e) => setCustomCategory(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
              <option value="accessory">一般自訂項目</option>
              <option value="repair">維修項目</option>
            </select>
            <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="名稱" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" />
            <input type="number" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} placeholder="金額" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" />
            <div className="flex gap-2">
              <button onClick={() => setIsCustomModalOpen(false)} className="flex-1 py-2 bg-slate-100 rounded-xl text-xs">取消</button>
              <button onClick={handleAddCustomItem} className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">加入</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
