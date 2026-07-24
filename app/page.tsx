'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  imei?: string;
  serialNumber?: string;
  cardNo?: string; // SIM 卡號 / ICCID
  code?: string;
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
  imei?: string;
  cardNo?: string;
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

  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    fetchSalesRecords();
    fetchPlans();
    fetchProducts();
    fetchCustomers();
  }, []);

  // 1. 動態讀取 Supabase 新品與商品庫存 (包含 IMEI, 序號, SIM卡號)
  const fetchProducts = async () => {
    try {
      // 嘗試撈取 products 或 inventory 資料表
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('讀取商品失敗，嘗試替代來源:', error);
        return;
      }

      if (data) {
        const formattedProducts: Product[] = data.map((item: any) => ({
          id: item.id.toString(),
          name: item.name || item.product_name || item.title || '',
          price: Number(item.price || item.selling_price || 0),
          cost: Number(item.cost || item.cost_price || 0),
          stock: Number(item.stock !== undefined ? item.stock : (item.quantity || 1)),
          imei: item.imei || item.imei_number || '',
          serialNumber: item.serial_number || item.sn || item.serialNo || '',
          cardNo: item.card_no || item.iccid || item.sim_no || item.card_number || '',
          code: item.code || item.product_code || ''
        }));
        setProducts(formattedProducts);
      }
    } catch (err) {
      console.error('連線 Supabase 商品資料失敗:', err);
    }
  };

  // 2. 動態讀取 Supabase 中的方案清單
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
          code: item.code || item.plan_code || '',
          name: item.name || item.plan_name || item.title || '',
          telecom: item.telecom || item.operator || '遠傳電信',
          type: item.type || item.plan_type || '攜碼',
          monthlyFee: Number(item.monthly_fee || item.monthlyFee || item.fee || 0),
          commission: Number(item.actual_commission || item.store_commission || item.commission || 0),
          contractMonths: Number(item.contract_months || 24),
          prepayment: Number(item.prepayment || 0),
        }));
        setPlans(formattedPlans);
      }
    } catch (err) {
      console.error('連線 Supabase 方案資料失敗:', err);
    }
  };

  // 3. 動態讀取 Supabase 中的客戶清單
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
          phone: item.phone || item.mobile || ''
        }));
        setCustomers(formattedCustomers);
      }
    } catch (err) {
      console.error('連線 Supabase 客戶資料失敗:', err);
    }
  };

  const [salesRecords, setSalesRecords] = useState<SaleRecord[]>([]);

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

  const handlePerfPreset = (type: 'today' | 'month' | 'all') => {
    const today = new Date();
    const formatDateStr = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (type === 'today') {
      const s = formatDateStr(today);
      setPerfStartDate(s);
      setPerfEndDate(s);
    } else if (type === 'month') {
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setPerfStartDate(formatDateStr(firstDayOfMonth));
      setPerfEndDate(formatDateStr(today));
    } else if (type === 'all') {
      setPerfStartDate('2025-01-01');
      setPerfEndDate('2030-12-31');
    }
  };

  const filteredSalesRecords = salesRecords.filter(record => {
    const keyword = recordSearchKeyword.toLowerCase();
    const matchKeyword = !keyword ||
      record.orderNo.toLowerCase().includes(keyword) ||
      record.customerName.toLowerCase().includes(keyword) ||
      record.salesperson.toLowerCase().includes(keyword) ||
      record.items.some(i => i.name.toLowerCase().includes(keyword) || i.imei.toLowerCase().includes(keyword));

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
      return [...prev, { 
        id: item.id, 
        name: item.name, 
        price: item.price, 
        cost: item.cost, 
        commission: 0, 
        quantity: 1, 
        type: 'product',
        imei: item.imei,
        cardNo: item.cardNo
      }];
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

    const newCustPayload = {
      name: newCustName.trim(),
      phone: newCustPhone.trim()
    };

    const { error } = await supabase.from('customers').insert([newCustPayload]);

    if (error) {
      alert('新增客戶至資料庫失敗: ' + error.message);
      return;
    }

    fetchCustomers();
    setCustomerSearch(`${newCustPayload.name} ( ${newCustPayload.phone} )`);
    setNewCustName('');
    setNewCustPhone('');
    setIsQuickCustomerModalOpen(false);
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
        imei: i.imei || i.cardNo || '—',
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

  // 🔥 多欄位強效搜尋：支援「商品名稱」、「商品編號」、「IMEI」、「序號」、「SIM卡號/ICCID」
  const filteredProducts = products.filter(p => {
    const kw = searchQuery.toLowerCase().trim();
    if (!kw) return true;
    return (
      (p.name && p.name.toLowerCase().includes(kw)) ||
      (p.code && p.code.toLowerCase().includes(kw)) ||
      (p.imei && p.imei.toLowerCase().includes(kw)) ||
      (p.serialNumber && p.serialNumber.toLowerCase().includes(kw)) ||
      (p.cardNo && p.cardNo.toLowerCase().includes(kw))
    );
  });
  
  const filteredCustomers = customers.filter(c =>
    !customerSearch ||
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  const filteredPlans = plans.filter(pl => {
    const kw = planSearch.toLowerCase().trim();
    if (!kw) return true;
    return (
      (pl.name && pl.name.toLowerCase().includes(kw)) ||
      (pl.code && pl.code.toLowerCase().includes(kw)) ||
      (pl.telecom && pl.telecom.toLowerCase().includes(kw)) ||
      (pl.type && pl.type.toLowerCase().includes(kw)) ||
      (pl.monthlyFee && pl.monthlyFee.toString().includes(kw))
    );
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
              className={`px-3 py-1 rounded-lg transition font-medium ${currentTab === 'pos' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              🛒 銷貨結帳
            </button>
            <button
              onClick={() => setCurrentTab('salesRecord')}
              className={`px-3 py-1 rounded-lg transition font-medium ${currentTab === 'salesRecord' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              📄 銷售紀錄
            </button>
            <button
              onClick={() => setCurrentTab('performance')}
              className={`px-3 py-1 rounded-lg transition font-medium ${currentTab === 'performance' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
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
                    placeholder="搜尋商品名稱 / 商品編號 / IMEI / 序號 / SIM卡號..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2 pt-2 max-h-80 overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <p className="text-center py-6 text-xs text-slate-400">目前庫存內無符合的商品</p>
                  ) : (
                    filteredProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => addToCart(p)}
                        className="flex justify-between items-center p-3.5 rounded-xl border border-slate-100 bg-white hover:border-blue-300 hover:shadow-sm cursor-pointer transition"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800">{p.name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            庫存：{p.stock} | 成本：${p.cost}
                            {p.imei && ` | IMEI: ${p.imei}`}
                            {p.cardNo && ` | SIM卡號: ${p.cardNo}`}
                          </p>
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
                      placeholder="點擊選取客戶 或 搜尋姓名/電話..."
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
                            }} className="text-slate-300 hover:text-rose-500 font-bold">✕ 刪除</button>
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
                    確認結帳收款
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 銷售紀錄 */}
      {currentTab === 'salesRecord' && (
        <div className="p-8 space-y-6">
          <div>
            <h1 className="text-xl font-bold text-slate-800">銷售紀錄</h1>
            <p className="text-xs text-slate-400 mt-0.5">查詢與管理銷售訂單記錄。</p>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <input
                type="text"
                placeholder="搜尋單號 / 客戶 / 經手人員 / 商品名稱 / IMEI..."
                value={recordSearchKeyword}
                onChange={(e) => setRecordSearchKeyword(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-72 text-slate-700 focus:outline-none focus:border-blue-500"
              />

              <select
                value={filterStoreStaff}
                onChange={(e) => setFilterStoreStaff(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700"
              >
                <option value="全部">全部門市人員</option>
                <option value="管理員">管理員</option>
              </select>

              <select
                value={filterCustType}
                onChange={(e) => setFilterCustType(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700"
              >
                <option value="全部">全部客戶類型</option>
                <option value="個人貴賓">個人貴賓</option>
              </select>

              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700"
                />
                <span className="text-slate-400">~</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-xs">
              <button
                onClick={() => handleDatePreset('today')}
                className={`px-3 py-1 rounded-lg transition font-medium ${datePreset === 'today' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                今日
              </button>
              <button
                onClick={() => handleDatePreset('week')}
                className={`px-3 py-1 rounded-lg transition font-medium ${datePreset === 'week' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                本週
              </button>
              <button
                onClick={() => handleDatePreset('month')}
                className={`px-3 py-1 rounded-lg transition font-medium ${datePreset === 'month' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                本月
              </button>
              <button
                onClick={() => handleDatePreset('all')}
                className={`px-3 py-1 rounded-lg transition font-medium ${datePreset === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                全部
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="p-4 border-b border-slate-100 text-xs text-slate-500 font-medium">
              共 <span className="text-blue-600 font-bold">{filteredSalesRecords.length}</span> 筆紀錄
            </div>

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

                      <div>
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[11px] font-medium">{rec.paymentInfo}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingRecord(rec);
                            setIsEditModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition"
                        >
                          修改
                        </button>
                        <button
                          onClick={() => setExpandedRowId(expandedRowId === rec.id ? null : rec.id)}
                          className="px-2.5 py-1 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg font-medium transition"
                        >
                          {expandedRowId === rec.id ? '收起' : '明細'}
                        </button>
                      </div>
                    </div>

                    {expandedRowId === rec.id && (
                      <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50/50 p-3 rounded-xl text-xs space-y-1">
                        <p className="font-bold text-slate-700 mb-1">銷售明細：</p>
                        {rec.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-slate-600 font-mono text-[11px]">
                            <span>{it.name} x {it.quantity}</span>
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

      {/* 業績報表 */}
      {currentTab === 'performance' && (
        <div className="p-8 space-y-6">
          <div>
            <h1 className="text-xl font-bold text-slate-800">業績報表</h1>
            <p className="text-xs text-slate-400 mt-0.5">檢視門市業績與獲利分析。</p>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 space-y-3">
            <div className="flex items-center gap-3 text-xs">
              <select
                value={perfStaff}
                onChange={(e) => setPerfStaff(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700"
              >
                <option value="全部人員">全部人員</option>
                <option value="管理員">管理員</option>
              </select>

              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={perfStartDate}
                  onChange={(e) => setPerfStartDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700"
                />
                <span className="text-slate-400">~</span>
                <input
                  type="date"
                  value={perfEndDate}
                  onChange={(e) => setPerfEndDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700"
                />
              </div>

              <button onClick={() => handlePerfPreset('today')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-medium">今天</button>
              <button onClick={() => handlePerfPreset('month')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-medium">本月</button>
              <button onClick={() => handlePerfPreset('all')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-medium">全部</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-1">
              <p className="text-xs text-slate-400 font-medium">銷售總額</p>
              <p className="text-2xl font-bold font-mono text-slate-800">${perfTotalAmount.toLocaleString()}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-1">
              <p className="text-xs text-slate-400 font-medium">總毛利</p>
              <p className="text-2xl font-bold font-mono text-emerald-600">+${perfTotalProfit.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* 🛠️ 修改銷售紀錄 Modal */}
      {isEditModalOpen && editingRecord && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">修改銷售紀錄 ({editingRecord.orderNo})</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-medium mb-1">銷貨日期</label>
                <input
                  type="date"
                  value={editingRecord.date}
                  onChange={(e) => setEditingRecord({ ...editingRecord, date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">客戶姓名</label>
                <input
                  type="text"
                  value={editingRecord.customerName}
                  onChange={(e) => setEditingRecord({ ...editingRecord, customerName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">付款資訊</label>
                <input
                  type="text"
                  value={editingRecord.paymentInfo}
                  onChange={(e) => setEditingRecord({ ...editingRecord, paymentInfo: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => handleDeleteRecord(editingRecord.id)}
                className="px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-bold text-xs transition"
              >
                刪除這筆紀錄
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  儲存修改
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 快速新增會員 Modal */}
      {isQuickCustomerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800">快速建立會員</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">會員姓名</label>
                <input
                  type="text"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="例如：王小明"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">電話號碼</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="例如：0912345678"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsQuickCustomerModalOpen(false)} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-xs">取消</button>
              <button onClick={handleCreateCustomer} className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold">建立並選取</button>
            </div>
          </div>
        </div>
      )}

      {/* 自訂/維修項目 Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800">新增自訂 / 維修項目</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">項目類別</label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700"
                >
                  <option value="accessory">自訂配件/商品</option>
                  <option value="repair">維修服務</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">項目名稱</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="例如：螢幕維修 / 特快包膜"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">售價 ($)</label>
                <input
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">成本 ($，可不填)</label>
                <input
                  type="number"
                  value={customCost}
                  onChange={(e) => setCustomCost(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsCustomModalOpen(false)} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-xs">取消</button>
              <button onClick={handleAddCustomItem} className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold">加入購物車</button>
            </div>
          </div>
        </div>
      )}

      {/* 方案選擇 Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">選擇電信方案</h3>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="搜尋方案名稱、代碼、電信商、金額..."
                value={planSearch}
                onChange={(e) => setPlanSearch(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredPlans.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400">目前查無方案，請確定「方案管理」頁面已有新增方案</p>
              ) : (
                filteredPlans.map((pl) => (
                  <div
                    key={pl.id}
                    onClick={() => handleSelectPlan(pl)}
                    className="p-3.5 border border-slate-100 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer transition flex justify-between items-center text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-800">[{pl.telecom}] {pl.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">類型：{pl.type} | 月租：${pl.monthlyFee}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-600 font-mono font-bold block">+${pl.commission} (傭金)</span>
                      <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-medium mt-1 inline-block">代入方案</span>
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
