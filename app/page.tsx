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
  type: string;
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
    return [
      {
        id: 'sr-1',
        orderNo: 'SD260723119',
        date: getTodayStr(),
        customerName: '個人貴賓',
        salesperson: '管理員',
        items: [{ name: '滿版保貼', price: 200, cost: 50, quantity: 1 }],
        totalAmount: 200,
        profit: 150,
        paymentInfo: '現金'
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

  // 銷貨結帳相關狀態
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('林活揚 (0956-096936)');
  const [paymentMethod, setPaymentMethod] = useState('現金');

  // 報表與紀錄篩選狀態
  const [recordKeyword, setRecordKeyword] = useState('');
  const [reportStartDate, setReportStartDate] = useState(getTodayStr());
  const [reportEndDate, setReportEndDate] = useState(getTodayStr());

  const addToCart = (item: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, cost: item.cost, quantity: 1, type: 'product' }];
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
      customerName: selectedCustomer.split(' ')[0],
      salesperson: '管理員',
      items: cart.map(i => ({ name: i.name, price: i.price, cost: i.cost, quantity: i.quantity })),
      totalAmount: subtotal,
      profit: totalProfit,
      paymentInfo: paymentMethod
    };

    setSalesRecords([newRecord, ...salesRecords]);
    alert(`結帳成功！單號：${orderNo}`);
    setCart([]);
  };

  const filteredProducts = products.filter(p => 
    !productSearch || p.name.includes(productSearch) || p.id.includes(productSearch)
  );

  return (
    <div className="p-8 space-y-6 w-full">
      {/* 頂部快速切換列 */}
      <div className="flex justify-between items-center bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-200/60">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium mr-2">快速切換：</span>
          <button 
            onClick={() => setActiveTab('checkout')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeTab === 'checkout' ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            🛒 銷貨結帳
          </button>
          <button 
            onClick={() => setActiveTab('records')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeTab === 'records' ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            📄 銷售紀錄
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeTab === 'reports' ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            📊 業績報表
          </button>
        </div>
        <div className="text-xs text-slate-600">
          目前身份：<span className="font-bold text-slate-800">管理員</span>
        </div>
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
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-slate-700">選擇方案</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">點擊開啟方案選擇視窗</p>
                </div>
                <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition">選擇方案</button>
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
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400">客戶 (選填，個人貴賓可不選)</span>
                <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <span className="text-xs font-medium text-slate-700">{selectedCustomer}</span>
                  <span className="text-[10px] text-blue-600 font-bold cursor-pointer">+ 快速建立會員</span>
                </div>
              </div>
              <div className="min-h-[120px] space-y-2 border-b border-slate-100 pb-4">
                {cart.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-10">尚未加入品項或方案</p>
                ) : (
                  cart.map((i) => (
                    <div key={i.id} className="flex justify-between text-xs py-1 border-b border-slate-50">
                      <span>{i.name} x {i.quantity}</span>
                      <span className="font-mono">${i.price * i.quantity}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="space-y-2 text-xs">
                <span className="text-slate-400 text-[10px]">付款方式與期數</span>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium">
                  <option value="現金">現金</option>
                  <option value="刷卡">刷卡</option>
                  <option value="行動支付">行動支付</option>
                </select>
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span>手續費率: 0%</span>
                  <span>手續費加成: +$0</span>
                </div>
              </div>
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">預估總毛利：</span>
                  <span className="text-emerald-600 font-bold">+${totalProfit}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span>總金額：</span>
                  <span className="font-mono text-rose-600">${subtotal}</span>
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
          <div>
            <h1 className="text-xl font-bold text-slate-800">銷售紀錄</h1>
            <p className="text-xs text-slate-400 mt-0.5">查詢與管理銷售訂單記錄。</p>
          </div>
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <input
                type="text"
                value={recordKeyword}
                onChange={(e) => setRecordKeyword(e.target.value)}
                placeholder="搜尋單號 / 客戶 / 經手人員 / 商品名稱 / IMEI..."
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs w-80"
              />
              <div className="flex gap-2 text-xs">
                <input type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} className="bg-slate-50 border rounded-xl px-3 py-2 font-mono" />
                <span className="self-center text-slate-400">~</span>
                <input type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} className="bg-slate-50 border rounded-xl px-3 py-2 font-mono" />
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-blue-600 text-white rounded-xl text-xs font-bold">今日</button>
              <button className="px-3 py-1 bg-slate-100 text-slate-600 rounded-xl text-xs">本週</button>
              <button className="px-3 py-1 bg-slate-100 text-slate-600 rounded-xl text-xs">本月</button>
              <button className="px-3 py-1 bg-slate-100 text-slate-600 rounded-xl text-xs">全部</button>
            </div>
            <div className="text-xs text-slate-500 font-medium pt-2">共 {salesRecords.length} 筆紀錄</div>
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
                    <th className="pb-3 text-right pr-3">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {salesRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 pl-3 font-mono font-bold text-slate-800">
                        {r.orderNo}
                        <span className="block text-[10px] text-slate-400 font-normal">{r.date}</span>
                      </td>
                      <td className="py-3.5">{r.customerName}</td>
                      <td className="py-3.5">{r.salesperson}</td>
                      <td className="py-3.5 font-mono font-bold">${r.totalAmount}</td>
                      <td className="py-3.5 font-mono font-bold text-emerald-600">+${r.profit}</td>
                      <td className="py-3.5">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold">{r.paymentInfo}</span>
                      </td>
                      <td className="py-3.5 text-right pr-3 space-x-2">
                        <button className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold">修改</button>
                        <button className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold">明細</button>
                      </td>
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
          <div>
            <h1 className="text-xl font-bold text-slate-800">業績報表</h1>
            <p className="text-xs text-slate-400 mt-0.5">檢視門市業績與獲利分析。</p>
          </div>
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <select className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
                <option>全部人員</option>
              </select>
              <div className="flex gap-2 text-xs">
                <input type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} className="bg-slate-50 border rounded-xl px-3 py-2 font-mono" />
                <span className="self-center text-slate-400">~</span>
                <input type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} className="bg-slate-50 border rounded-xl px-3 py-2 font-mono" />
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-slate-100 text-slate-600 rounded-xl text-xs">今天</button>
                <button className="px-3 py-1 bg-slate-100 text-slate-600 rounded-xl text-xs">本月</button>
                <button className="px-3 py-1 bg-slate-100 text-slate-600 rounded-xl text-xs">全部</button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-2">
              <p className="text-xs text-slate-400">銷售總額</p>
              <p className="text-2xl font-mono font-bold text-slate-800">$200</p>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-2">
              <p className="text-xs text-slate-400">總毛利</p>
              <p className="text-2xl font-mono font-bold text-emerald-600">+$150</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
