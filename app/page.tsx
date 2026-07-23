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
  commission: number;
  quantity: number;
  type: 'product' | 'plan' | 'custom' | 'repair';
}

interface SaleRecord {
  id: string;
  orderNo: string;
  date: string;
  customerName: string;
  salesperson: string;
  items: { name: string; price: number; cost: number; quantity: number; category?: string }[];
  totalAmount: number;
  profit: number;
  paymentInfo: string;
}

interface RepairOrder {
  id: string;
  repairNo: string;
  date: string;
  customerName: string;
  customerPhone: string;
  deviceModel: string;
  imei: string;
  repairType: '一般維修' | '委外維修';
  outsourcer: string;
  issueDescription: string;
  quotedPrice: number;
  repairCost: number;
  status: '檢測中' | '等待報價' | '維修中' | '已完修' | '已交機' | '不維修';
  notes: string;
  salesperson: string;
}

export default function Home() {
  // 側邊欄主選單狀態
  const [currentMenu, setCurrentMenu] = useState<'control' | 'inventory' | 'repairManagement' | 'salesRecord' | 'performance'>('repairManagement');

  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // 模擬資料初始化
  const [salesRecords, setSalesRecords] = useState<SaleRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pos_sales_records');
      if (saved) return JSON.parse(saved);
    }
    return [
      {
        id: 'sr-1',
        orderNo: 'SD260721001',
        date: getTodayStr(),
        customerName: '王小明',
        salesperson: '管理員',
        items: [{ name: '滿版保貼', price: 200, cost: 50, quantity: 1, category: '配件' }],
        totalAmount: 200,
        profit: 150,
        paymentInfo: '現金'
      }
    ];
  });

  // 維修單資料 (擁有獨立的維修毛利紀錄欄位：quotedPrice 與 repairCost)
  const [repairOrders, setRepairOrders] = useState<RepairOrder[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pos_repair_orders');
      if (saved) return JSON.parse(saved);
    }
    return [
      {
        id: 'rp-1',
        repairNo: 'RP26072301',
        date: getTodayStr(),
        customerName: '林小姐',
        customerPhone: '0912345678',
        deviceModel: 'iPhone 14 Pro',
        imei: '358899123456789',
        repairType: '一般維修',
        outsourcer: '',
        issueDescription: '更換原廠電池',
        quotedPrice: 2200,
        repairCost: 1200,
        status: '已交機',
        notes: '已完成測試',
        salesperson: '管理員'
      }
    ];
  });

  const products: Product[] = [
    { id: 'p1', name: '滿版保貼', price: 200, cost: 50, stock: 10, category: '配件' },
    { id: 'p2', name: 'AIR6皮套', price: 200, cost: 70, stock: 8, category: '配件' },
    { id: 'p3', name: 'iPhone 15 128G', price: 25900, cost: 23000, stock: 3, category: '手機' },
  ];

  useEffect(() => {
    localStorage.setItem('pos_sales_records', JSON.stringify(salesRecords));
  }, [salesRecords]);

  useEffect(() => {
    localStorage.setItem('pos_repair_orders', JSON.stringify(repairOrders));
  }, [repairOrders]);

  // 銷貨結帳 State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState('');

  // 銷售紀錄 State
  const [recordSearchKeyword, setRecordSearchKeyword] = useState('');
  const [recordStartDate, setRecordStartDate] = useState(getTodayStr());
  const [recordEndDate, setRecordEndDate] = useState(getTodayStr());

  // 維修管理 State (獨立的維修新增表單)
  const [repairSearchKeyword, setRepairSearchKeyword] = useState('');
  const [repairStatusFilter, setRepairStatusFilter] = useState('全部');
  const [isNewRepairModalOpen, setIsNewRepairModalOpen] = useState(false);
  const [repairCustName, setRepairCustName] = useState('');
  const [repairCustPhone, setRepairCustPhone] = useState('');
  const [repairDeviceModel, setRepairDeviceModel] = useState('');
  const [repairImei, setRepairImei] = useState('');
  const [repairType, setRepairType] = useState<'一般維修' | '委外維修'>('一般維修');
  const [repairOutsourcer, setRepairOutsourcer] = useState('');
  const [repairIssue, setRepairIssue] = useState('');
  const [repairQuotedPrice, setRepairQuotedPrice] = useState('');
  const [repairCostVal, setRepairCostVal] = useState('');
  const [repairNotes, setRepairNotes] = useState('');

  // 業績報表 State
  const [perfStartDate, setPerfStartDate] = useState(getTodayStr());
  const [perfEndDate, setPerfEndDate] = useState(getTodayStr());
  const [perfStaff, setPerfStaff] = useState('全部');
  const [includeRepairInProfit, setIncludeRepairInProfit] = useState(true); // 讓您可以自由勾選是否把維修毛利計入業績報表總額
  const [isSalesOverviewModalOpen, setIsSalesOverviewModalOpen] = useState(false);

  const addToCart = (item: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, cost: item.cost, commission: 0, quantity: 1, type: 'product' }];
    });
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalProfit = cart.reduce((sum, item) => sum + (item.price - item.cost) * item.quantity, 0);

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
      customerName: '散客',
      salesperson: '管理員',
      items: cart.map(i => ({ name: i.name, price: i.price, cost: i.cost, quantity: i.quantity, category: i.type })),
      totalAmount: subtotal,
      profit: totalProfit,
      paymentInfo: '現金'
    };

    setSalesRecords([newRecord, ...salesRecords]);
    alert(`結帳成功！單號：${orderNo}`);
    setCart([]);
    setCurrentMenu('salesRecord');
  };

  // 資料計算：一般銷售
  const filteredSalesRecords = salesRecords.filter(r => {
    const matchDate = r.date >= perfStartDate && r.date <= perfEndDate;
    const matchStaff = perfStaff === '全部' || r.salesperson === perfStaff;
    return matchDate && matchStaff;
  });

  const salesTotalAmount = filteredSalesRecords.reduce((sum, r) => sum + r.totalAmount, 0);
  const salesTotalProfit = filteredSalesRecords.reduce((sum, r) => sum + r.profit, 0);

  // 資料計算：已完成/已交機的維修毛利（記錄在獨立維修模組，但在業績報表中正確統計）
  const filteredRepairOrders = repairOrders.filter(r => {
    const matchDate = r.date >= perfStartDate && r.date <= perfEndDate;
    const matchStaff = perfStaff === '全部' || r.salesperson === perfStaff;
    const isCompleted = r.status === '已完修' || r.status === '已交機'; // 只有完成的維修才計算毛利
    return matchDate && matchStaff && isCompleted;
  });

  const repairTotalAmount = filteredRepairOrders.reduce((sum, r) => sum + r.quotedPrice, 0);
  const repairTotalProfit = filteredRepairOrders.reduce((sum, r) => sum + (r.quotedPrice - r.repairCost), 0);

  // 總計（可依需求選擇是否包含維修毛利）
  const grandTotalAmount = salesTotalAmount + (includeRepairInProfit ? repairTotalAmount : 0);
  const grandTotalProfit = salesTotalProfit + (includeRepairInProfit ? repairTotalProfit : 0);

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
      {/* 左側導覽列 */}
      <div className="w-64 bg-[#0B132B] text-slate-300 flex flex-col justify-between select-none">
        <div>
          <div className="p-6 flex items-center gap-3 border-b border-slate-800/60">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">P</div>
            <div>
              <h1 className="text-white font-bold text-sm tracking-wide">POS 門市系統</h1>
              <span className="text-[10px] text-slate-400 font-mono">v1.0.0</span>
            </div>
          </div>
          <div className="p-4 space-y-1">
            <p className="text-[10px] font-bold text-slate-500 px-3 pb-2 uppercase tracking-wider">主要功能</p>
            <button onClick={() => setCurrentMenu('control')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${currentMenu === 'control' ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-800/50 text-slate-400'}`}>
              🛒 銷貨結帳
            </button>
            <button onClick={() => setCurrentMenu('salesRecord')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${currentMenu === 'salesRecord' ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-800/50 text-slate-400'}`}>
              📄 銷售紀錄
            </button>
            <button onClick={() => setCurrentMenu('repairManagement')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${currentMenu === 'repairManagement' ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-800/50 text-slate-400'}`}>
              🛠️ 維修管理
            </button>
            <button onClick={() => setCurrentMenu('performance')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${currentMenu === 'performance' ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-800/50 text-slate-400'}`}>
              📊 業績報表
            </button>
          </div>
        </div>
        <div className="p-4 border-t border-slate-800/60">
          <div className="bg-slate-800/40 p-3 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-700 rounded-xl flex items-center justify-center text-white text-xs font-bold">管</div>
            <div>
              <p className="text-xs font-bold text-white">管理員</p>
              <p className="text-[10px] text-slate-400 font-mono">admin@pos.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* 右側主要內容區 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* 銷貨結帳 */}
        {currentMenu === 'control' && (
          <div className="p-8 space-y-6">
            <h1 className="text-xl font-bold text-slate-800">銷貨結帳</h1>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 bg-white rounded-3xl p-6 shadow-sm border space-y-4">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="搜尋商品名稱 / 商品編號 / IMEI..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs"
                />
                <div className="space-y-2">
                  {products.map((p) => (
                    <div key={p.id} onClick={() => addToCart(p)} className="flex justify-between items-center p-3.5 border rounded-xl cursor-pointer hover:bg-blue-50/50 transition">
                      <div>
                        <p className="text-xs font-bold">{p.name}</p>
                        <p className="text-[10px] text-slate-400">庫存: {p.stock}</p>
                      </div>
                      <span className="text-xs text-blue-600 font-mono font-bold">${p.price}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-4 bg-white rounded-3xl p-6 shadow-sm border space-y-4">
                <h3 className="text-xs font-bold text-slate-700">購物車</h3>
                <div className="space-y-2 min-h-[150px]">
                  {cart.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-10">購物車是空的</p>
                  ) : (
                    cart.map((i) => (
                      <div key={i.id} className="flex justify-between text-xs py-1 border-b">
                        <span>{i.name} x {i.quantity}</span>
                        <span className="font-mono">${i.price * i.quantity}</span>
                      </div>
                    ))
                  )}
                </div>
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span>小計</span>
                    <span className="font-mono text-rose-600">${subtotal}</span>
                  </div>
                  <button onClick={handleCheckout} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition">
                    確認結帳
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 銷售紀錄 */}
        {currentMenu === 'salesRecord' && (
          <div className="p-8 space-y-6">
            <div>
              <h1 className="text-xl font-bold text-slate-800">銷售紀錄</h1>
              <p className="text-xs text-slate-400 mt-0.5">共 {salesRecords.length} 筆紀錄</p>
            </div>
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 space-y-4">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <input
                  type="text"
                  value={recordSearchKeyword}
                  onChange={(e) => setRecordSearchKeyword(e.target.value)}
                  placeholder="單號/客戶/員工/IMEI/電話..."
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs w-72"
                />
                <div className="flex items-center gap-2">
                  <input type="date" value={recordStartDate} onChange={(e) => setRecordStartDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" />
                  <span className="text-slate-400">~</span>
                  <input type="date" value={recordEndDate} onChange={(e) => setRecordEndDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" />
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">查詢</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-medium">
                      <th className="pb-3 pl-3">單號</th>
                      <th className="pb-3">客戶名稱</th>
                      <th className="pb-3">銷售品名</th>
                      <th className="pb-3">銷售人員</th>
                      <th className="pb-3 text-right pr-3">毛利</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {salesRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 pl-3 font-mono font-bold text-blue-600">{r.orderNo}</td>
                        <td className="py-3.5 text-slate-700">{r.customerName}</td>
                        <td className="py-3.5 text-slate-600">{r.items.map(i => i.name).join(', ')}</td>
                        <td className="py-3.5 text-slate-700">{r.salesperson}</td>
                        <td className="py-3.5 text-right pr-3 font-mono font-bold text-emerald-600">+${r.profit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 獨立的維修管理模組 (完美獨立，擁有報價與成本記錄，以供計算維修毛利) */}
        {currentMenu === 'repairManagement' && (
          <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold text-slate-800">維修管理</h1>
                <p className="text-xs text-slate-400 mt-0.5">獨立維修中心：記錄一般維修、委外維修、報價與維修成本。</p>
              </div>
              <button onClick={() => setIsNewRepairModalOpen(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition">
                ＋ 新增維修單
              </button>
            </div>
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 space-y-4">
              <input
                type="text"
                value={repairSearchKeyword}
                onChange={(e) => setRepairSearchKeyword(e.target.value)}
                placeholder="搜尋維修單號、客戶姓名、電話、機型..."
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs w-80"
              />
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-medium">
                      <th className="pb-3 pl-3">單號 / 類型</th>
                      <th className="pb-3">客戶資訊</th>
                      <th className="pb-3">送修機型</th>
                      <th className="pb-3">故障描述</th>
                      <th className="pb-3">報價 / 成本</th>
                      <th className="pb-3 text-right">維修毛利</th>
                      <th className="pb-3 text-right pr-3">目前狀態</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {repairOrders.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-10 text-slate-400">目前沒有相關維修紀錄</td></tr>
                    ) : (
                      repairOrders.map((r) => {
                        const mProfit = r.quotedPrice - r.repairCost;
                        return (
                          <tr key={r.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3.5 pl-3 font-mono font-bold text-slate-800">
                              {r.repairNo}
                              <span className="block text-[10px] text-slate-400 font-normal">{r.repairType}</span>
                            </td>
                            <td className="py-3.5">{r.customerName} <br/><span className="text-[10px] text-slate-400">{r.customerPhone}</span></td>
                            <td className="py-3.5">{r.deviceModel}</td>
                            <td className="py-3.5">{r.issueDescription}</td>
                            <td className="py-3.5 font-mono text-slate-600">
                              報價: ${r.quotedPrice}<br/>成本: ${r.repairCost}
                            </td>
                            <td className="py-3.5 text-right font-mono font-bold text-emerald-600">+${mProfit}</td>
                            <td className="py-3.5 text-right pr-3 font-medium">
                              <select
                                value={r.status}
                                onChange={(e) => {
                                  const updated = repairOrders.map(item => item.id === r.id ? { ...item, status: e.target.value as any } : item);
                                  setRepairOrders(updated);
                                }}
                                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-blue-600 font-bold"
                              >
                                <option value="檢測中">檢測中</option>
                                <option value="等待報價">等待報價</option>
                                <option value="維修中">維修中</option>
                                <option value="已完修">已完修</option>
                                <option value="已交機">已交機</option>
                                <option value="不維修">不維修</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 業績報表模組 (完美整合：可選擇是否將維修毛利計入總業績) */}
        {currentMenu === 'performance' && (
          <div className="p-8 space-y-6">
            <div>
              <h1 className="text-xl font-bold text-slate-800">業績報表</h1>
              <p className="text-xs text-slate-400 mt-0.5">全店銷售與維修毛利整合分析報表</p>
            </div>

            {/* 查詢與開關列 */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">員工</label>
                  <select
                    value={perfStaff}
                    onChange={(e) => setPerfStaff(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 w-36 font-medium"
                  >
                    <option value="全部">全部人員</option>
                    <option value="管理員">管理員</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">開始日期</label>
                  <input
                    type="date"
                    value={perfStartDate}
                    onChange={(e) => setPerfStartDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700"
                  />
                </div>
                <span className="text-slate-400 mt-5">~</span>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">結束日期</label>
                  <input
                    type="date"
                    value={perfEndDate}
                    onChange={(e) => setPerfEndDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700"
                  />
                </div>
                <button className="mt-5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition">
                  查詢
                </button>
              </div>

              {/* 勾選開關：是否計入維修毛利 */}
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200">
                <input
                  type="checkbox"
                  id="includeRepair"
                  checked={includeRepairInProfit}
                  onChange={(e) => setIncludeRepairInProfit(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="includeRepair" className="text-xs font-bold text-slate-700 cursor-pointer">
                  業績總額包含「維修毛利」
                </label>
              </div>
            </div>

            {/* 總額統計卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-emerald-50/40 rounded-3xl p-6 shadow-sm border border-emerald-100 space-y-1">
                <span className="text-xs text-slate-400 font-medium">總銷售金額 (含完修報價)</span>
                <h3 className="text-3xl font-mono font-bold text-emerald-600">${grandTotalAmount.toLocaleString()}</h3>
                <p className="text-[10px] text-slate-400">商品銷售：${salesTotalAmount} ｜ 維修報價：${includeRepairInProfit ? repairTotalAmount : 0}</p>
              </div>
              <div className="bg-amber-50/40 rounded-3xl p-6 shadow-sm border border-amber-100 space-y-1">
                <span className="text-xs text-slate-400 font-medium">總毛利 {includeRepairInProfit ? '(含維修毛利)' : '(僅商品毛利)'}</span>
                <h3 className="text-3xl font-mono font-bold text-orange-600">+${grandTotalProfit.toLocaleString()}</h3>
                <p className="text-[10px] text-slate-400">商品毛利：${salesTotalProfit} ｜ 維修毛利：{includeRepairInProfit ? `+$${repairTotalProfit}` : '已略過'}</p>
              </div>
            </div>

            {/* 明細清單 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-3 bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-bold text-slate-700">類別拆解</h4>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>商品銷售毛利</span>
                    <span className="font-mono font-bold text-emerald-600">+${salesTotalProfit}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>維修管理毛利</span>
                    <span className="font-mono font-bold text-blue-600">+${repairTotalProfit}</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-9 bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
                <h4 className="text-xs font-bold text-slate-700 border-b pb-3">已完成之維修毛利明細 (來源：維修管理模組)</h4>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-medium">
                      <th className="pb-3 pl-3">維修單號</th>
                      <th className="pb-3">客戶 / 機型</th>
                      <th className="pb-3 text-right">報價</th>
                      <th className="pb-3 text-right">成本</th>
                      <th className="pb-3 text-right pr-3">維修毛利</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredRepairOrders.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-6 text-slate-400">此區間無已完修/交機之維修紀錄</td></tr>
                    ) : (
                      filteredRepairOrders.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="py-3.5 pl-3 font-mono font-bold text-blue-600">{r.repairNo}</td>
                          <td className="py-3.5">{r.customerName} ({r.deviceModel})</td>
                          <td className="py-3.5 text-right font-mono">${r.quotedPrice}</td>
                          <td className="py-3.5 text-right font-mono">${r.repairCost}</td>
                          <td className="py-3.5 text-right pr-3 font-mono font-bold text-emerald-600">+${r.quotedPrice - r.repairCost}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 新增維修單 Modal (完全獨立的維修輸入介面) */}
      {isNewRepairModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[480px] shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800">新增維修單</h3>
              <button onClick={() => setIsNewRepairModalOpen(false)} className="text-slate-400">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={repairCustName} onChange={(e) => setRepairCustName(e.target.value)} placeholder="客戶姓名 *" className="bg-slate-50 border rounded-xl px-3 py-2" />
                <input type="text" value={repairCustPhone} onChange={(e) => setRepairCustPhone(e.target.value)} placeholder="手機號碼" className="bg-slate-50 border rounded-xl px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={repairDeviceModel} onChange={(e) => setRepairDeviceModel(e.target.value)} placeholder="送修機型 *" className="bg-slate-50 border rounded-xl px-3 py-2" />
                <input type="text" value={repairImei} onChange={(e) => setRepairImei(e.target.value)} placeholder="IMEI / 序號" className="bg-slate-50 border rounded-xl px-3 py-2" />
              </div>
              <textarea value={repairIssue} onChange={(e) => setRepairIssue(e.target.value)} placeholder="故障描述" className="w-full bg-slate-50 border rounded-xl px-3 py-2 h-16 resize-none"></textarea>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">報價金額 (售價)</label>
                  <input type="number" value={repairQuotedPrice} onChange={(e) => setRepairQuotedPrice(e.target.value)} placeholder="0" className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-mono text-emerald-600 font-bold" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">維修成本</label>
                  <input type="number" value={repairCostVal} onChange={(e) => setRepairCostVal(e.target.value)} placeholder="0" className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-mono text-rose-600 font-bold" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsNewRepairModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs">取消</button>
              <button onClick={() => {
                if (!repairCustName || !repairDeviceModel) return alert('請填寫客戶姓名與送修機型');
                const newRp: RepairOrder = {
                  id: `rp-${Date.now()}`,
                  repairNo: `RP${Math.floor(1000 + Math.random() * 9000)}`,
                  date: getTodayStr(),
                  customerName: repairCustName,
                  customerPhone: repairCustPhone,
                  deviceModel: repairDeviceModel,
                  imei: repairImei || '—',
                  repairType: '一般維修',
                  outsourcer: '',
                  issueDescription: repairIssue,
                  quotedPrice: parseFloat(repairQuotedPrice) || 0,
                  repairCost: parseFloat(repairCostVal) || 0,
                  status: '檢測中',
                  notes: '',
                  salesperson: '管理員'
                };
                setRepairOrders([newRp, ...repairOrders]);
                setIsNewRepairModalOpen(false);
                setRepairCustName(''); setRepairCustPhone(''); setRepairDeviceModel(''); setRepairImei(''); setRepairIssue(''); setRepairQuotedPrice(''); setRepairCostVal('');
                alert('維修單建立成功！');
              }} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">確定建立</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
