'use client';

import React, { useState, useEffect } from 'react';

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
  telecom: string;
  type: string;
  monthlyFee: number;
  commission: number;
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
  salesperson: string;
  items: { name: string; price: number; quantity: number }[];
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
}

export default function Home() {
  const [currentTab, setCurrentTab] = useState<'pos' | 'repair' | 'salesRecord' | 'performance'>('repair');

  // LocalStorage 資料初始化
  const [salesRecords, setSalesRecords] = useState<SaleRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pos_sales_records');
      if (saved) return JSON.parse(saved);
    }
    return [];
  });

  const [repairOrders, setRepairOrders] = useState<RepairOrder[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pos_repair_orders');
      if (saved) return JSON.parse(saved);
    }
    return [
      {
        id: 'rp-1',
        repairNo: 'RP26030101',
        date: '2026-03-01',
        customerName: '王小明',
        customerPhone: '0912345678',
        deviceModel: 'iPhone 15 Pro',
        imei: '356789012345678',
        repairType: '一般維修',
        outsourcer: '',
        issueDescription: '螢幕面板破損無法顯示',
        quotedPrice: 3500,
        repairCost: 1500,
        status: '維修中',
        notes: '客戶急件'
      }
    ];
  });

  const [customers, setCustomers] = useState<Customer[]>([
    { id: 'c1', name: '王小明', phone: '0912345678' }
  ]);

  const products: Product[] = [
    { id: 'p1', name: '滿版保貼', price: 200, cost: 50, stock: 10 },
    { id: 'p2', name: 'AIR6皮套', price: 200, cost: 70, stock: 8 },
    { id: 'p3', name: 'iPhone 15 128G', price: 25900, cost: 23000, stock: 3 },
  ];

  const plans: Plan[] = [
    { id: 'pl1', code: '599-1', name: '599上網吃到飽 (24個月)', telecom: '遠傳電信', type: '攜碼', monthlyFee: 599, commission: 4500 }
  ];

  useEffect(() => {
    localStorage.setItem('pos_sales_records', JSON.stringify(salesRecords));
  }, [salesRecords]);

  useEffect(() => {
    localStorage.setItem('pos_repair_orders', JSON.stringify(repairOrders));
  }, [repairOrders]);

  // POS State
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [isQuickCustomerModalOpen, setIsQuickCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planSearch, setPlanSearch] = useState('');
  const [payments, setPayments] = useState<PaymentRow[]>([
    { id: '1', method: '現金', installments: '—' },
  ]);

  // Repair State
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
  const [repairSearchKeyword, setRepairSearchKeyword] = useState('');
  const [repairStatusFilter, setRepairStatusFilter] = useState('全部');

  // Sales & Performance State
  const [recordSearchKeyword, setRecordSearchKeyword] = useState('');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2030-12-31');

  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const handleCreateRepairOrder = () => {
    if (!repairCustName || !repairCustPhone || !repairDeviceModel || !repairIssue) {
      alert('請填寫完整客戶、型號與故障描述！');
      return;
    }
    const newOrder: RepairOrder = {
      id: `rp-${Date.now()}`,
      repairNo: `RP${getTodayStr().replace(/-/g, '').slice(2)}${Math.floor(100 + Math.random() * 900)}`,
      date: getTodayStr(),
      customerName: repairCustName,
      customerPhone: repairCustPhone,
      deviceModel: repairDeviceModel,
      imei: repairImei || '—',
      repairType,
      outsourcer: repairType === '委外維修' ? repairOutsourcer : '',
      issueDescription: repairIssue,
      quotedPrice: parseFloat(repairQuotedPrice) || 0,
      repairCost: parseFloat(repairCostVal) || 0,
      status: '檢測中',
      notes: repairNotes
    };

    setRepairOrders([newOrder, ...repairOrders]);
    setIsNewRepairModalOpen(false);
    setRepairCustName(''); setRepairCustPhone(''); setRepairDeviceModel('');
    setRepairImei(''); setRepairOutsourcer(''); setRepairIssue('');
    setRepairQuotedPrice(''); setRepairCostVal(''); setRepairNotes('');
    alert('維修單建立成功！');
  };

  const handleUpdateRepairStatus = (id: string, newStatus: RepairOrder['status']) => {
    setRepairOrders(repairOrders.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  const handleDeleteRepairOrder = (id: string) => {
    if (confirm('確定要刪除此維修單嗎？')) {
      setRepairOrders(repairOrders.filter(r => r.id !== id));
    }
  };

  const filteredRepairOrders = repairOrders.filter(r => {
    const matchKw = !repairSearchKeyword || r.repairNo.includes(repairSearchKeyword) || r.customerName.includes(repairSearchKeyword) || r.customerPhone.includes(repairSearchKeyword) || r.deviceModel.includes(repairSearchKeyword);
    const matchStatus = repairStatusFilter === '全部' || r.status === repairStatusFilter;
    return matchKw && matchStatus;
  });

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
  const totalProfit = cart.reduce((sum, item) => item.type === 'plan' ? sum + item.commission : sum + (item.price - item.cost) * item.quantity, 0);

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
      customerName: customerSearch.split('(')[0].trim() || '散客',
      salesperson: '管理員',
      items: cart.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
      totalAmount: subtotal,
      profit: totalProfit,
      paymentInfo: payments.map(p => p.method).join(', ')
    };

    setSalesRecords([newRecord, ...salesRecords]);
    alert(`結帳成功！單號：${orderNo}`);
    setCart([]);
    setCurrentTab('salesRecord');
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-100 text-slate-800 font-sans w-full">
      {/* 頂部切換頁籤列 */}
      <div className="bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500">快速切換：</span>
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setCurrentTab('repair')}
              className={`px-3 py-1 rounded-lg transition font-medium ${currentTab === 'repair' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              🛠️ 維修中心
            </button>
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
      </div>

      {/* 維修中心頁籤 */}
      {currentTab === 'repair' && (
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-slate-800">手機維修中心</h1>
              <p className="text-xs text-slate-400 mt-0.5">管理一般維修、委外維修、狀態追蹤與報價紀錄。</p>
            </div>
            <button
              onClick={() => setIsNewRepairModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              ＋ 新增維修單
            </button>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/60 space-y-4">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <input
                type="text"
                value={repairSearchKeyword}
                onChange={(e) => setRepairSearchKeyword(e.target.value)}
                placeholder="搜尋維修單號、客戶姓名、電話、機型..."
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 w-80 focus:outline-none focus:border-blue-500"
              />
              <div className="flex items-center gap-1.5 text-xs">
                {['全部', '檢測中', '等待報價', '維修中', '已完修', '已交機'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setRepairStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl font-medium transition ${repairStatusFilter === st ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium">
                    <th className="pb-3 pl-3">單號 / 類型</th>
                    <th className="pb-3">客戶資訊</th>
                    <th className="pb-3">送修機型 / 委外</th>
                    <th className="pb-3">故障描述</th>
                    <th className="pb-3">報價 / 成本</th>
                    <th className="pb-3">目前狀態</th>
                    <th className="pb-3 text-right pr-3">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredRepairOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400">目前沒有相關維修紀錄</td>
                    </tr>
                  ) : (
                    filteredRepairOrders.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 pl-3">
                          <p className="font-bold text-slate-800 font-mono">{r.repairNo}</p>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.repairType === '委外維修' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                            {r.repairType}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <p className="font-bold text-slate-800">{r.customerName}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{r.customerPhone}</p>
                        </td>
                        <td className="py-3.5">
                          <p className="font-medium text-slate-800">{r.deviceModel}</p>
                          {r.repairType === '委外維修' && <p className="text-[11px] text-purple-600">委外: {r.outsourcer || '未指定'}</p>}
                        </td>
                        <td className="py-3.5 text-slate-600 max-w-xs truncate">{r.issueDescription}</td>
                        <td className="py-3.5">
                          <p className="font-mono font-bold text-rose-600">${r.quotedPrice}</p>
                          <p className="text-[11px] text-slate-400 font-mono">成本: ${r.repairCost}</p>
                        </td>
                        <td className="py-3.5">
                          <select
                            value={r.status}
                            onChange={(e) => handleUpdateRepairStatus(r.id, e.target.value as any)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 font-medium"
                          >
                            <option value="檢測中">檢測中</option>
                            <option value="等待報價">等待報價</option>
                            <option value="維修中">維修中</option>
                            <option value="已完修">已完修</option>
                            <option value="已交機">已交機</option>
                            <option value="不維修">不維修</option>
                          </select>
                        </td>
                        <td className="py-3.5 text-right pr-3 space-x-2">
                          <button onClick={() => handleDeleteRepairOrder(r.id)} className="text-slate-400 hover:text-rose-500 font-bold">🗑️</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 銷貨結帳頁籤 */}
      {currentTab === 'pos' && (
        <div className="p-8 space-y-6">
          <h1 className="text-xl font-bold text-slate-800">銷貨結帳</h1>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 space-y-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋商品名稱..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs"
            />
            <div className="space-y-2">
              {products.map((p) => (
                <div key={p.id} onClick={() => addToCart(p)} className="flex justify-between items-center p-3 border rounded-xl cursor-pointer hover:bg-blue-50">
                  <span className="text-xs font-bold">{p.name}</span>
                  <span className="text-xs text-blue-600 font-mono">${p.price}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-bold">總金額: ${subtotal}</p>
              <button onClick={handleCheckout} className="mt-2 w-full py-2 bg-rose-600 text-white rounded-xl text-xs font-bold">確認結帳</button>
            </div>
          </div>
        </div>
      )}

      {/* 銷售紀錄頁籤 */}
      {currentTab === 'salesRecord' && (
        <div className="p-8 space-y-6">
          <h1 className="text-xl font-bold text-slate-800">銷售紀錄</h1>
          <div className="bg-white rounded-2xl p-5 shadow-sm border">
            {salesRecords.map((r) => (
              <div key={r.id} className="p-3 border-b flex justify-between text-xs">
                <span>{r.orderNo} - {r.customerName}</span>
                <span className="font-mono font-bold text-rose-600">${r.totalAmount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 業績報表頁籤 */}
      {currentTab === 'performance' && (
        <div className="p-8 space-y-6">
          <h1 className="text-xl font-bold text-slate-800">業績報表</h1>
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <p className="text-xs text-slate-500">總業績統計：$ {salesRecords.reduce((sum, r) => sum + r.totalAmount, 0)}</p>
          </div>
        </div>
      )}

      {/* 新增維修單 Modal */}
      {isNewRepairModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[500px] shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800">新增手機維修單</h3>
              <button onClick={() => setIsNewRepairModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-500 block mb-1">維修類型</label>
                <select value={repairType} onChange={(e) => setRepairType(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <option value="一般維修">一般維修</option>
                  <option value="委外維修">委外維修</option>
                </select>
              </div>
              {repairType === '委外維修' && (
                <div>
                  <label className="text-slate-500 block mb-1">委外店家</label>
                  <input type="text" value={repairOutsourcer} onChange={(e) => setRepairOutsourcer(e.target.value)} placeholder="輸入委外廠商名稱" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" />
                </div>
              )}
              <div>
                <label className="text-slate-500 block mb-1">客戶姓名</label>
                <input type="text" value={repairCustName} onChange={(e) => setRepairCustName(e.target.value)} placeholder="請輸入姓名" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">手機號碼</label>
                <input type="text" value={repairCustPhone} onChange={(e) => setRepairCustPhone(e.target.value)} placeholder="請輸入電話" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">送修機型</label>
                <input type="text" value={repairDeviceModel} onChange={(e) => setRepairDeviceModel(e.target.value)} placeholder="例如：iPhone 14 Pro" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">IMEI / 序號</label>
                <input type="text" value={repairImei} onChange={(e) => setRepairImei(e.target.value)} placeholder="IMEI 序號" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" />
              </div>
              <div className="col-span-2">
                <label className="text-slate-500 block mb-1">故障狀況描述</label>
                <textarea value={repairIssue} onChange={(e) => setRepairIssue(e.target.value)} placeholder="例如：螢幕破裂、無法開機..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 h-20 resize-none"></textarea>
              </div>
              <div>
                <label className="text-slate-500 block mb-1">預估報價 ($)</label>
                <input type="number" value={repairQuotedPrice} onChange={(e) => setRepairQuotedPrice(e.target.value)} placeholder="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono" />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">預估成本 ($)</label>
                <input type="number" value={repairCostVal} onChange={(e) => setRepairCostVal(e.target.value)} placeholder="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsNewRepairModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-medium">取消</button>
              <button onClick={handleCreateRepairOrder} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-medium">建立維修單</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
