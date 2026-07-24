'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Product {
  id: number;
  name: string;
  category: string;
  cost: number;
  price: number;
  stock: number;
  serial_numbers?: string;
  code?: string;
}

interface Plan {
  id: string;
  code: string;
  name: string;
  carrier: string;
  type: string;
  monthlyFee: number;
  actualCommission: number;
  storeCommission: number;
  contractPeriod?: number;
  prepayment?: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface CartItem {
  id: string | number;
  name: string;
  price: number;
  cost: number;
  commission: number;
  quantity: number;
  type: 'product' | 'plan' | 'custom' | 'repair';
  category?: string;
  imei?: string;
  cardNo?: string;
}

interface PaymentRow {
  id: string;
  method: '現金' | '刷卡' | '刷卡分期' | '無卡分期' | '匯款';
  installments: string;
}

interface SaleItemDetail {
  name: string;
  imei: string;
  cost: number;
  price: number;
  quantity: number;
  category?: string;
}

interface SaleRecord {
  id: string;
  orderNo: string;
  date: string;
  customerName: string;
  customerType: string;
  salesperson: string;
  store: string;
  items: SaleItemDetail[];
  totalAmount: number;
  totalCost: number;
  profit: number;
  paymentInfo: string;
}

const POS_PLANS_KEY = 'pos_plans';

export default function Home() {
  const [currentTab, setCurrentTab] = useState<'pos' | 'salesRecord' | 'performance'>('pos');

  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    fetchSalesRecords();
    fetchPlans();
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      const formatted = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category || p.type || '配件',
        cost: p.cost || 0,
        price: p.price || 0,
        stock: p.stock || 0,
        serial_numbers: p.serial_numbers || '',
        code: `PRD${String(p.id).padStart(6, '0')}`
      }));

      setProducts(formatted);
    } catch (err: any) {
      console.error('銷貨頁面載入庫存失敗：', err.message);
    }
  };

  const fetchPlans = async () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(POS_PLANS_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) setPlans(parsed);
        } catch (e) {}
      }
    }

    try {
      const { data, error } = await supabase.from('plans').select('*').order('created_at', { ascending: false });
      if (data && !error && data.length > 0) {
        const formattedPlans: Plan[] = data.map((item: any) => ({
          id: String(item.id),
          code: item.code || '',
          name: item.name || '',
          carrier: item.carrier || '遠傳電信',
          type: item.type || '新申辦',
          monthlyFee: Number(item.monthly_fee || item.monthlyFee || 0),
          actualCommission: Number(item.actual_commission || item.actualCommission || 0),
          storeCommission: Number(item.store_commission || item.storeCommission || 0),
          contractPeriod: Number(item.contract_period || item.contractPeriod || 24),
          prepayment: Number(item.prepayment || 0),
        }));
        setPlans(formattedPlans);
        localStorage.setItem(POS_PLANS_KEY, JSON.stringify(formattedPlans));
      }
    } catch (err) {}
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      if (data && !error && data.length > 0) {
        setCustomers(data.map((item: any) => ({
          id: String(item.id),
          name: item.name || '',
          phone: item.phone || item.mobile || ''
        })));
      }
    } catch (err) {}
  };

  const [salesRecords, setSalesRecords] = useState<SaleRecord[]>([]);

  const fetchSalesRecords = async () => {
    try {
      const { data, error } = await supabase.from('sales_records').select('*').order('created_at', { ascending: false });
      if (data && !error && data.length > 0) {
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
    } catch (err) {}
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
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

  // 業績報表專屬狀態
  const [perfStartDate, setPerfStartDate] = useState(getTodayStr());
  const [perfEndDate, setPerfEndDate] = useState(getTodayStr());
  const [perfTab, setPerfTab] = useState<'details' | 'comparison'>('details');
  const [compareType, setCompareType] = useState<'lastMonth' | 'lastYear' | 'custom'>('lastMonth');

  const handleDatePreset = (preset: 'today' | 'week' | 'month' | 'all') => {
    setDatePreset(preset);
    const today = new Date();
    const formatDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    if (preset === 'today') {
      const s = formatDateStr(today);
      setStartDate(s); setEndDate(s);
    } else if (preset === 'week') {
      const fd = new Date(today); fd.setDate(today.getDate() - today.getDay());
      setStartDate(formatDateStr(fd)); setEndDate(formatDateStr(today));
    } else if (preset === 'month') {
      const fd = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatDateStr(fd)); setEndDate(formatDateStr(today));
    } else if (preset === 'all') {
      setStartDate('2025-01-01'); setEndDate('2030-12-31');
    }
  };

  const handlePerfPreset = (type: 'today' | 'month' | 'all') => {
    const today = new Date();
    const formatDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    if (type === 'today') {
      const s = formatDateStr(today); setPerfStartDate(s); setPerfEndDate(s);
    } else if (type === 'month') {
      const fd = new Date(today.getFullYear(), today.getMonth(), 1);
      setPerfStartDate(formatDateStr(fd)); setPerfEndDate(formatDateStr(today));
    } else if (type === 'all') {
      setPerfStartDate('2025-01-01'); setPerfEndDate('2030-12-31');
    }
  };

  const filteredSalesRecords = salesRecords.filter(record => {
    const kw = recordSearchKeyword.toLowerCase();
    const matchKw = !kw || record.orderNo.toLowerCase().includes(kw) || record.customerName.toLowerCase().includes(kw) || record.salesperson.toLowerCase().includes(kw);
    const matchStaff = filterStoreStaff === '全部' || record.salesperson === filterStoreStaff;
    const matchCust = filterCustType === '全部' || record.customerType === filterCustType;
    const matchDate = record.date >= startDate && record.date <= endDate;
    return matchKw && matchStaff && matchCust && matchDate;
  });

  const filteredPerfRecords = salesRecords.filter(record => {
    return record.date >= perfStartDate && record.date <= perfEndDate;
  });

  const perfTotalAmount = filteredPerfRecords.reduce((sum, r) => sum + r.totalAmount, 0);
  const perfTotalProfit = filteredPerfRecords.reduce((sum, r) => sum + r.profit, 0);

  // 完美強化的分類與加總統計
  const categoryStats = {
    '組合商品(門號)': { count: 0, amount: 0 },
    '手機': { count: 0, amount: 0 },
    '中古機': { count: 0, amount: 0 },
    '配件': { count: 0, amount: 0 },
    '維修': { count: 0, amount: 0 },
  };

  filteredPerfRecords.forEach(r => {
    r.items.forEach(it => {
      let cat = (it.category || '').trim();
      const nameLower = (it.name || '').toLowerCase();
      
      if (cat === '維修' || nameLower.includes('維修') || nameLower.includes('換螢幕') || nameLower.includes('修')) {
        cat = '維修';
      } else if (cat.includes('組') || cat.includes('門號') || nameLower.includes('方案') || nameLower.includes('門號')) {
        cat = '組合商品(門號)';
      } else if (cat.includes('中古') || nameLower.includes('中古')) {
        cat = '中古機';
      } else if (cat.includes('手機') || nameLower.includes('手機') || nameLower.includes('iphone') || nameLower.includes('samsung')) {
        cat = '手機';
      } else {
        cat = '配件';
      }

      if (categoryStats[cat as keyof typeof categoryStats]) {
        categoryStats[cat as keyof typeof categoryStats].count += it.quantity;
        categoryStats[cat as keyof typeof categoryStats].amount += (it.price * it.quantity);
      }
    });
  });

  const handleDeleteRecord = async (id: string) => {
    if (confirm('確定要刪除這筆銷售紀錄嗎？')) {
      try { await supabase.from('sales_records').delete().eq('id', id); } catch (e) {}
      setSalesRecords(prev => prev.filter(r => r.id !== id));
      setIsEditModalOpen(false);
      setEditingRecord(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    const totalCost = editingRecord.items.reduce((sum, i) => sum + i.cost * i.quantity, 0);
    const totalAmount = editingRecord.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const profit = totalAmount - totalCost;

    try {
      await supabase.from('sales_records').update({
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
      }).eq('id', editingRecord.id);
    } catch (e) {}

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
      return [...prev, { 
        id: item.id, 
        name: item.name, 
        price: item.price, 
        cost: item.cost, 
        commission: 0, 
        quantity: 1, 
        type: 'product',
        category: item.category,
        imei: item.serial_numbers ? item.serial_numbers.split(',')[0].trim() : ''
      }];
    });
  };

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    const comm = plan.actualCommission || plan.storeCommission || 0;
    setCart((prev) => [...prev.filter(i => i.type !== 'plan'), {
      id: `plan-${plan.id}`,
      name: `[${plan.carrier}] ${plan.name} (${plan.type})`,
      price: 0,
      cost: 0,
      commission: comm,
      quantity: 1,
      type: 'plan',
      category: '組合商品(門號)',
    }]);
    setIsPlanModalOpen(false);
  };

  const handleAddCustomItem = () => {
    if (!customName.trim() || !customPrice) {
      alert('請填寫完整資訊！'); return;
    }
    const priceNum = parseFloat(customPrice);
    const costNum = parseFloat(customCost) || 0;
    // 關鍵修正：確保維修類別正確被標記為 '維修'
    const catName = customCategory === 'repair' ? '維修' : '配件';
    const itemType = customCategory === 'repair' ? 'repair' : 'custom';

    setCart((prev) => [...prev, {
      id: `custom-${Date.now()}`,
      name: customName,
      price: priceNum,
      cost: costNum,
      commission: 0,
      quantity: 1,
      type: itemType,
      category: catName,
    }]);
    setCustomName(''); setCustomPrice(''); setCustomCost('');
    setIsCustomModalOpen(false);
  };

  const handleCreateCustomer = async () => {
    if (!newCustName.trim() || !newCustPhone.trim()) {
      alert('請填寫姓名與電話！'); return;
    }
    const newC = { id: String(Date.now()), name: newCustName.trim(), phone: newCustPhone.trim() };
    try { await supabase.from('customers').insert([{ name: newC.name, phone: newC.phone }]); } catch (e) {}
    setCustomers(prev => [newC, ...prev]);
    setCustomerSearch(`${newC.name} ( ${newC.phone} )`);
    setNewCustName(''); setNewCustPhone('');
    setIsQuickCustomerModalOpen(false);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalProfit = cart.reduce((sum, item) => item.type === 'plan' ? sum + item.commission : sum + (item.price - item.cost) * item.quantity, 0);

  const addPaymentRow = () => setPayments([...payments, { id: Date.now().toString(), method: '刷卡分期', installments: '3' }]);
  const removePaymentRow = (id: string) => setPayments(payments.filter(p => p.id !== id));

  const handleCheckout = async () => {
    if (cart.length === 0) { alert('購物車是空的！'); return; }

    for (const item of cart) {
      if (item.type === 'product') {
        const targetProd = products.find(p => p.id === item.id);
        if (!targetProd) {
          alert(`⚠️ 錯誤：找不到商品「${item.name}」的庫存紀錄！`);
          return;
        }
        if (targetProd.stock <= 0 || targetProd.stock < item.quantity) {
          alert(`🚫 庫存不足警告：\n商品「${targetProd.name}」目前庫存僅剩 ${targetProd.stock} 件，無法結帳！`);
          return;
        }
      }
    }

    const nowStr = getTodayStr();
    const orderNo = `SD${nowStr.replace(/-/g, '').slice(2)}${Math.floor(100 + Math.random() * 900)}`;
    const recordId = `sr-${Date.now()}`;

    try {
      const { error: saleError } = await supabase.from('sales_records').insert([{
        id: recordId,
        order_no: orderNo,
        date: nowStr,
        customer_name: customerSearch.split('(')[0].trim() || '個人貴賓',
        customer_type: '個人貴賓',
        salesperson: '管理員',
        store: '總店',
        items: cart.map(i => ({ 
          name: i.name, 
          imei: i.imei || '—', 
          cost: i.type === 'plan' ? 0 : i.cost, 
          price: i.price, 
          quantity: i.quantity,
          category: i.category || (i.type === 'plan' ? '組合商品(門號)' : i.type === 'repair' ? '維修' : '配件')
        })),
        total_amount: subtotal,
        total_cost: cart.reduce((s, i) => s + (i.type === 'plan' ? 0 : i.cost * i.quantity), 0),
        profit: totalProfit,
        payment_info: payments.map(p => p.method === '刷卡分期' ? `刷卡分期(${p.installments}期)` : p.method).join(', ')
      }]);

      if (saleError) throw saleError;

      for (const item of cart) {
        if (item.type === 'product') {
          const targetProd = products.find(p => p.id === item.id);
          if (targetProd) {
            const newStock = Math.max(0, targetProd.stock - item.quantity);
            await supabase
              .from('products')
              .update({ stock: newStock })
              .eq('id', targetProd.id);
          }
        }
      }

    } catch (e: any) {
      alert('結帳過程發生錯誤：' + e.message);
      return;
    }

    await fetchSalesRecords();
    await fetchProducts();
    setExpandedRowId(recordId);
    alert(`結帳成功！單號：${orderNo}，庫存已自動扣減。`);
    setCart([]); setSelectedPlan(null);
    setCurrentTab('salesRecord');
  };

  const filteredProducts = products.filter(p => {
    const kw = searchQuery.toLowerCase().trim();
    if (!kw) return true;
    return (p.name && p.name.toLowerCase().includes(kw)) ||
           (p.code && p.code.toLowerCase().includes(kw)) ||
           (p.serial_numbers && p.serial_numbers.toLowerCase().includes(kw));
  });

  const filteredCustomers = customers.filter(c => !customerSearch || c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch));
  const filteredPlans = plans.filter(pl => !planSearch || pl.name.toLowerCase().includes(planSearch.toLowerCase()) || pl.carrier.toLowerCase().includes(planSearch.toLowerCase()));

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-100 text-slate-800 font-sans w-full">
      <div className="bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500">快速切換：</span>
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
            <button onClick={() => setCurrentTab('pos')} className={`px-3 py-1 rounded-lg transition font-medium ${currentTab === 'pos' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>🛒 銷貨結帳</button>
            <button onClick={() => setCurrentTab('salesRecord')} className={`px-3 py-1 rounded-lg transition font-medium ${currentTab === 'salesRecord' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>📄 銷售紀錄</button>
            <button onClick={() => setCurrentTab('performance')} className={`px-3 py-1 rounded-lg transition font-medium ${currentTab === 'performance' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>📊 業績報表</button>
          </div>
        </div>
        <div className="text-xs text-slate-400">目前身份：<strong className="text-slate-700">管理員</strong></div>
      </div>

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
                    {selectedPlan ? `📌 已代入：[${selectedPlan.carrier}] ${selectedPlan.name} (傭金 $${selectedPlan.actualCommission || selectedPlan.storeCommission || 0})` : '👉 點擊開啟方案選擇視窗'}
                  </span>
                  <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2.5 py-1 rounded-lg">選擇方案</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/60 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xs font-bold text-slate-700">加入商品 (即時連線庫存資料表)</h2>
                  <button onClick={fetchProducts} className="text-xs text-blue-600 hover:underline">🔄 重新整理庫存</button>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜尋商品名稱 / 編號 / IMEI / SIM..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2 pt-2 max-h-80 overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <p className="text-center py-6 text-xs text-slate-400">目前庫存內無符合的商品（請至庫存頁面新增）</p>
                  ) : (
                    filteredProducts.map((p) => (
                      <div key={p.id} onClick={() => addToCart(p)} className="flex justify-between items-center p-3.5 rounded-xl border border-slate-100 bg-white hover:border-blue-300 hover:shadow-sm cursor-pointer transition">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{p.name} <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded ml-1">{p.category}</span></p>
                          <p className="text-[11px] text-slate-400 mt-0.5">庫存：{p.stock} | 成本：${p.cost} {p.serial_numbers && ` | IMEI: ${p.serial_numbers}`}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-blue-600">${p.price}</span>
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[11px] rounded-lg font-medium">+ 加入</span>
                        </div>
                      </div>
                    ))
                  )}
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
                    <button onClick={() => setIsQuickCustomerModalOpen(true)} className="text-blue-600 font-semibold hover:underline">＋ 快速建立會員</button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={customerSearch}
                      onFocus={() => { fetchCustomers(); setIsCustomerDropdownOpen(true); }}
                      onChange={(e) => { setCustomerSearch(e.target.value); setIsCustomerDropdownOpen(true); }}
                      placeholder="點擊選取客戶 或 搜尋姓名/電話..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                    />

                    {isCustomerDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-20">
                        {filteredCustomers.length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-400">找不到符合的客戶資料</div>
                        ) : (
                          filteredCustomers.map((c) => (
                            <div key={c.id} onClick={() => { setCustomerSearch(`${c.name} ( ${c.phone} )`); setIsCustomerDropdownOpen(false); }} className="px-3 py-2.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center text-xs border-b border-slate-50">
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
                            <span className="font-bold text-slate-800">{item.name} <span className="text-[10px] text-slate-400 font-normal">[{item.category}]</span></span>
                            <button onClick={() => { if (item.type === 'plan') setSelectedPlan(null); setCart(cart.filter(i => i.id !== item.id)); }} className="text-slate-300 hover:text-rose-500 font-bold">✕ 刪除</button>
                          </div>
                          <div className="flex justify-between items-center gap-2">
                            <div>
                              <span className="text-[10px] text-slate-400 block">{item.type === 'plan' ? '方案傭金' : '售價 ($)'}</span>
                              {item.type === 'plan' ? (
                                <span className="font-mono font-bold text-emerald-600">+${item.commission}</span>
                              ) : (
                                <input type="number" value={item.price} onChange={(e) => setCart(cart.map(i => i.id === item.id ? { ...i, price: parseFloat(e.target.value) || 0 } : i))} className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1 font-mono text-slate-700" />
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

                <button onClick={() => { setCustomCategory('accessory'); setIsCustomModalOpen(true); }} className="w-full py-2.5 border border-dashed border-slate-300 hover:border-blue-500 hover:text-blue-600 text-slate-500 rounded-xl text-xs font-semibold transition">
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
                            <select value={pay.method} onChange={(e) => setPayments(payments.map(p => p.id === pay.id ? { ...p, method: e.target.value as any } : p))} className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-medium text-slate-700">
                              <option value="現金">現金</option>
                              <option value="刷卡">刷卡</option>
                              <option value="刷卡分期">刷卡分期</option>
                              <option value="無卡分期">無卡分期</option>
                              <option value="匯款">匯款</option>
                            </select>
                            {pay.method === '刷卡分期' && (
                              <select value={pay.installments} onChange={(e) => setPayments(payments.map(p => p.id === pay.id ? { ...p, installments: e.target.value } : p))} className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-medium text-blue-600">
                                <option value="3">3 期 (3%)</option>
                                <option value="6">6 期 (4%)</option>
                                <option value="12">12 期 (6%)</option>
                              </select>
                            )}
                            <button onClick={() => removePaymentRow(pay.id)} className="ml-auto text-slate-400 hover:text-rose-500 font-bold">🗑️</button>
                          </div>
                          <div className="flex justify-between items-center text-[11px] text-slate-500 px-1">
                            <span>手續費率: <strong>{(rate * 100)}%</strong></span>
                            <span className="text-amber-600 font-mono">手續費: +${estimatedFee}</span>
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
                  <button onClick={handleCheckout} className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition mt-2">確認結帳收款</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentTab === 'salesRecord' && (
        <div className="p-8 space-y-6">
          <div>
            <h1 className="text-xl font-bold text-slate-800">銷售紀錄</h1>
            <p className="text-xs text-slate-400 mt-0.5">查詢與管理銷售訂單記錄。</p>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <input type="text" placeholder="搜尋單號 / 客戶 / 人員..." value={recordSearchKeyword} onChange={(e) => setRecordSearchKeyword(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-72 text-slate-700" />
              <div className="flex items-center gap-1.5">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700" />
                <span className="text-slate-400">~</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700" />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-xs">
              <button onClick={() => handleDatePreset('today')} className={`px-3 py-1 rounded-lg ${datePreset === 'today' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>今日</button>
              <button onClick={() => handleDatePreset('week')} className={`px-3 py-1 rounded-lg ${datePreset === 'week' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>本週</button>
              <button onClick={() => handleDatePreset('month')} className={`px-3 py-1 rounded-lg ${datePreset === 'month' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>本月</button>
              <button onClick={() => handleDatePreset('all')} className={`px-3 py-1 rounded-lg ${datePreset === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>全部</button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="p-4 border-b border-slate-100 text-xs text-slate-500 font-medium">共 <span className="text-blue-600 font-bold">{filteredSalesRecords.length}</span> 筆紀錄</div>
            <div className="divide-y divide-slate-100">
              {filteredSalesRecords.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">目前沒有符合條件的銷售紀錄</div>
              ) : (
                filteredSalesRecords.map((rec) => (
                  <div key={rec.id} className="p-4 hover:bg-slate-50/80 transition">
                    <div className="flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-800">{rec.orderNo}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{rec.date}</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{rec.customerName}</p>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px]">{rec.customerType}</span>
                      </div>
                      <div className="text-slate-600">{rec.salesperson}</div>
                      <div className="font-mono font-bold text-slate-800">${rec.totalAmount.toLocaleString()}</div>
                      <div className="font-mono font-bold text-emerald-600">+${rec.profit.toLocaleString()}</div>
                      <div><span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[11px]">{rec.paymentInfo}</span></div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditingRecord(rec); setIsEditModalOpen(true); }} className="px-2.5 py-1 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">修改</button>
                        <button onClick={() => setExpandedRowId(expandedRowId === rec.id ? null : rec.id)} className="px-2.5 py-1 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg">{expandedRowId === rec.id ? '收起' : '明細'}</button>
                      </div>
                    </div>
                    {expandedRowId === rec.id && (
                      <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50/50 p-3 rounded-xl text-xs space-y-1">
                        <p className="font-bold text-slate-700 mb-1">銷售明細：</p>
                        {rec.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-slate-600 font-mono text-[11px]">
                            <span>{it.name} [{it.category || '配件'}] x {it.quantity}</span>
                            <span>${(it.price * it.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 業績報表頁面 */}
      {currentTab === 'performance' && (
        <div className="p-8 space-y-6">
          <div>
            <h1 className="text-xl font-bold text-slate-800">業績報表</h1>
            <p className="text-xs text-slate-400 mt-0.5">全店銷貨業績分析</p>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">開始日期</span>
                <input type="date" value={perfStartDate} onChange={(e) => setPerfStartDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">結束日期</span>
                <input type="date" value={perfEndDate} onChange={(e) => setPerfEndDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700" />
              </div>
              <button onClick={() => {}} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition">查詢</button>
              <button onClick={() => handlePerfPreset('all')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium text-slate-600">全部</button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handlePerfPreset('today')} className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 font-medium">今天</button>
              <button onClick={() => handlePerfPreset('month')} className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 font-medium">本月</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-emerald-50/40 p-6 rounded-2xl border border-emerald-100 shadow-sm space-y-1">
              <p className="text-xs text-slate-400 font-semibold">總銷售金額</p>
              <p className="text-3xl font-bold font-mono text-emerald-700">${perfTotalAmount.toLocaleString()}</p>
            </div>
            <div className="bg-amber-50/40 p-6 rounded-2xl border border-amber-100 shadow-sm space-y-1">
              <p className="text-xs text-slate-400 font-semibold">總毛利</p>
              <p className="text-3xl font-bold font-mono text-amber-700">${perfTotalProfit.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6 items-start">
            {/* 左側：銷售類別動態統計 */}
            <div className="col-span-12 lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-800">銷售類別</h3>
                <span className="text-slate-400 text-xs">⚙️</span>
              </div>
              <div className="space-y-3 text-xs">
                {Object.entries(categoryStats).map(([catName, stat]) => (
                  <div key={catName} className="flex justify-between items-center pb-2 border-b border-slate-50 last:border-b-0">
                    <span className="text-slate-600 font-medium">{catName}</span>
                    <span className="text-slate-500 font-mono">{stat.count}筆 ${stat.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 右側：銷售明細 / 月份比較圖表 */}
            <div className="col-span-12 lg:col-span-9 bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3">
                <div className="flex gap-6 text-xs font-semibold">
                  <button onClick={() => setPerfTab('details')} className={`pb-3 border-b-2 transition ${perfTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>銷售明細</button>
                  <button onClick={() => setPerfTab('comparison')} className={`pb-3 border-b-2 transition ${perfTab === 'comparison' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>月份比較圖表</button>
                </div>
                <span className="text-xs text-slate-400 font-mono">{filteredPerfRecords.length} 筆</span>
              </div>

              {perfTab === 'details' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-400 uppercase font-bold tracking-wider">
                        <th className="py-3 px-5">單號</th>
                        <th className="py-3 px-5">日期</th>
                        <th className="py-3 px-5">員工</th>
                        <th className="py-3 px-5">客戶</th>
                        <th className="py-3 px-5">方案</th>
                        <th className="py-3 px-5">金額</th>
                        <th className="py-3 px-5">佣金</th>
                        <th className="py-3 px-5">實際毛利</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredPerfRecords.length === 0 ? (
                        <tr><td colSpan={8} className="text-center py-12 text-slate-400">目前沒有符合條件的銷售明細</td></tr>
                      ) : (
                        filteredPerfRecords.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50/50 transition">
                            <td className="py-3.5 px-5 font-mono font-bold text-slate-800">{r.orderNo}</td>
                            <td className="py-3.5 px-5 font-mono text-slate-500">{r.date}</td>
                            <td className="py-3.5 px-5 text-slate-600">{r.salesperson}</td>
                            <td className="py-3.5 px-5 text-slate-800 font-medium">{r.customerName}</td>
                            <td className="py-3.5 px-5 text-slate-400">{r.items.some(i => i.category?.includes('組合')) ? '有' : '—'}</td>
                            <td className="py-3.5 px-5 font-mono font-bold text-slate-800">${r.totalAmount.toLocaleString()}</td>
                            <td className="py-3.5 px-5 font-mono text-slate-400">$0</td>
                            <td className="py-3.5 px-5 font-mono font-bold text-emerald-600">+${r.profit.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {perfTab === 'comparison' && (
                <div className="p-6 space-y-6 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400">比較對象：</span>
                      <button onClick={() => setCompareType('lastMonth')} className={`px-4 py-1.5 rounded-xl font-medium border transition ${compareType === 'lastMonth' ? 'bg-blue-50 border-blue-200 text-blue-600 font-bold' : 'bg-white border-slate-200 text-slate-600'}`}>上個月</button>
                      <button onClick={() => setCompareType('lastYear')} className={`px-4 py-1.5 rounded-xl font-medium border transition ${compareType === 'lastYear' ? 'bg-blue-50 border-blue-200 text-blue-600 font-bold' : 'bg-white border-slate-200 text-slate-600'}`}>去年同期</button>
                      <button onClick={() => setCompareType('custom')} className={`px-4 py-1.5 rounded-xl font-medium border transition ${compareType === 'custom' ? 'bg-blue-50 border-blue-200 text-blue-600 font-bold' : 'bg-white border-slate-200 text-slate-600'}`}>自訂月份</button>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition">更新圖表</button>
                  </div>

                  <div className="h-64 border-b border-slate-200 flex items-end justify-around px-8 pb-4 bg-slate-50/50 rounded-xl relative">
                    <div className="flex flex-col items-center gap-2">
                      <span className="font-mono font-bold text-blue-600">${perfTotalAmount.toLocaleString()}</span>
                      <div className="w-12 bg-blue-500 rounded-t-lg transition-all" style={{ height: `${Math.min(150, Math.max(20, perfTotalAmount / 500))}px` }}></div>
                      <span className="text-slate-500 font-medium">當前查詢期間</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <span className="font-mono font-bold text-slate-400">$0</span>
                      <div className="w-12 bg-slate-300 rounded-t-lg h-6"></div>
                      <span className="text-slate-400 font-medium">比較期間</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block mb-1">銷售金額</span>
                      <span className="font-mono font-bold text-slate-800 text-base">${perfTotalAmount.toLocaleString()}</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block mb-1">門號佣金</span>
                      <span className="font-mono font-bold text-slate-800 text-base">$0</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block mb-1">商品毛利</span>
                      <span className="font-mono font-bold text-emerald-600 text-base">+${perfTotalProfit.toLocaleString()}</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block mb-1">總業績</span>
                      <span className="font-mono font-bold text-blue-600 text-base">${perfTotalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {isEditModalOpen && editingRecord && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">修改銷售紀錄 ({editingRecord.orderNo})</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div><label className="block text-slate-500 mb-1">銷貨日期</label><input type="date" value={editingRecord.date} onChange={(e) => setEditingRecord({ ...editingRecord, date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" /></div>
              <div><label className="block text-slate-500 mb-1">客戶姓名</label><input type="text" value={editingRecord.customerName} onChange={(e) => setEditingRecord({ ...editingRecord, customerName: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" /></div>
              <div><label className="block text-slate-500 mb-1">付款資訊</label><input type="text" value={editingRecord.paymentInfo} onChange={(e) => setEditingRecord({ ...editingRecord, paymentInfo: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" /></div>
            </div>
            <div className="flex justify-between items-center pt-2">
              <button onClick={() => handleDeleteRecord(editingRecord.id)} className="px-3 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs">刪除紀錄</button>
              <div className="flex gap-2">
                <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl text-xs">取消</button>
                <button onClick={handleSaveEdit} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">儲存修改</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isQuickCustomerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800">快速建立會員</h3>
            <div className="space-y-3 text-xs">
              <div><label className="block text-slate-500 mb-1">會員姓名</label><input type="text" value={newCustName} onChange={(e) => setNewCustName(e.target.value)} placeholder="例如：王小明" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" /></div>
              <div><label className="block text-slate-500 mb-1">電話號碼</label><input type="text" value={newCustPhone} onChange={(e) => setNewCustPhone(e.target.value)} placeholder="例如：0912345678" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" /></div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsQuickCustomerModalOpen(false)} className="px-3 py-1.5 bg-slate-100 rounded-xl text-xs">取消</button>
              <button onClick={handleCreateCustomer} className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold">建立並選取</button>
            </div>
          </div>
        </div>
      )}

      {isCustomModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800">新增自訂 / 維修項目</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">項目類別</label>
                <select value={customCategory} onChange={(e) => setCustomCategory(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <option value="accessory">自訂配件/商品</option>
                  <option value="repair">維修服務</option>
                </select>
              </div>
              <div><label className="block text-slate-500 mb-1">名稱</label><input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="例如：螢幕維修" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" /></div>
              <div><label className="block text-slate-500 mb-1">售價</label><input type="number" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} placeholder="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" /></div>
              <div><label className="block text-slate-500 mb-1">成本</label><input type="number" value={customCost} onChange={(e) => setCustomCost(e.target.value)} placeholder="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" /></div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsCustomModalOpen(false)} className="px-3 py-1.5 bg-slate-100 rounded-xl text-xs">取消</button>
              <button onClick={handleAddCustomItem} className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold">加入購物車</button>
            </div>
          </div>
        </div>
      )}

      {isPlanModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">選擇電信方案</h3>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-slate-400">✕</button>
            </div>
            <input type="text" placeholder="搜尋方案..." value={planSearch} onChange={(e) => setPlanSearch(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" />
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredPlans.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400">目前查無方案</p>
              ) : (
                filteredPlans.map((pl) => (
                  <div key={pl.id} onClick={() => handleSelectPlan(pl)} className="p-3.5 border border-slate-100 rounded-xl hover:border-blue-400 cursor-pointer flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-800">[{pl.carrier}] {pl.name}</p>
                      <p className="text-[11px] text-slate-400">類型：{pl.type} | 月租：${pl.monthlyFee}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-600 font-mono font-bold block">+${pl.actualCommission || pl.storeCommission || 0}</span>
                      <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px]">代入</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
