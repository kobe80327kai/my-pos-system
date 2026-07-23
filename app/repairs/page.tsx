'use client';

import React, { useState, useEffect } from 'react';

interface RepairItem {
  id: string;
  repairNo: string;
  createdAt: string;
  customerName: string;
  phone: string;
  brandModel: string;
  color: string;
  serialNumber: string;
  problem: string;
  repairFee: number;
  deposit: number;
  status: string; // '檢測中' | '已收件' | '已取件'
  usedParts?: { id: string; name: string; cost: number }[];
  paymentMethod?: string;
  profit?: number;
}

interface StockItem {
  id: string;
  code: string;
  name: string;
  category: string;
  model: string;
  stock: number;
  cost: number;
}

interface VendorItem {
  id: string;
  name: string;
  contact: string;
  phone: string;
}

const LOCAL_STORAGE_REPAIRS = 'pos_repairs_data_v3';
const LOCAL_STORAGE_STOCK = 'pos_stock_data_v3';
const LOCAL_STORAGE_VENDORS = 'pos_vendors_data_v3';

export default function RepairsAndStockPage() {
  const [activeTab, setActiveTab] = useState<'repairs' | 'stock' | 'vendors'>('repairs');

  // 維修單列表
  const [repairs, setRepairs] = useState<RepairItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_REPAIRS);
      if (saved) { try { return JSON.parse(saved); } catch (e) {} }
    }
    return [
      {
        id: '1',
        repairNo: 'RO260720001',
        createdAt: '2026/07/23 下午12:58',
        customerName: 'JOY秀菁',
        phone: '0912-345678',
        brandModel: '15',
        color: '黑',
        serialNumber: '-',
        problem: '00',
        repairFee: 1200,
        deposit: 0,
        status: '已收件',
        usedParts: [],
      }
    ];
  });

  // 零件庫存
  const [stockList, setStockList] = useState<StockItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_STOCK);
      if (saved) { try { return JSON.parse(saved); } catch (e) {} }
    }
    return [
      { id: '101', code: 'P01', name: '紅米13C電池', category: '電池', model: '紅米13C', stock: 2, cost: 230 },
      { id: '102', code: 'P02', name: 'I15電池', category: '電池', model: 'iPhone 15', stock: 1, cost: 450 },
      { id: '103', code: 'P03', name: '紅米NOTE12電池', category: '電池', model: '紅米NOTE12', stock: 3, cost: 260 },
    ];
  });

  // 廠商管理
  const [vendors, setVendors] = useState<VendorItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_VENDORS);
      if (saved) { try { return JSON.parse(saved); } catch (e) {} }
    }
    return [
      { id: '1', name: 'THEONE 零件供應商', contact: '王經理', phone: '0912-345678' }
    ];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRepair, setSelectedRepair] = useState<RepairItem | null>(null);

  // 結帳彈窗專屬狀態
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutRepair, setCheckoutRepair] = useState<RepairItem | null>(null);
  const [checkoutRepairFee, setCheckoutRepairFee] = useState<number>(0);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<string>('現金');
  const [selectedParts, setSelectedParts] = useState<{ id: string; name: string; cost: number }[]>([]);

  // 新增零件與廠商 Modal
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [newStock, setNewStock] = useState({ code: '', name: '', category: '', model: '', stock: 0, cost: 0 });
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [newVendor, setNewVendor] = useState({ name: '', contact: '', phone: '' });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_REPAIRS, JSON.stringify(repairs));
  }, [repairs]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_STOCK, JSON.stringify(stockList));
  }, [stockList]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_VENDORS, JSON.stringify(vendors));
  }, [vendors]);

  // 打開結帳視窗
  const handleOpenCheckout = (repair: RepairItem) => {
    setCheckoutRepair(repair);
    setCheckoutRepairFee(repair.repairFee || 1200);
    setCheckoutPaymentMethod('現金');
    setSelectedParts(repair.usedParts || []);
    setIsCheckoutModalOpen(true);
  };

  // 加入使用料件
  const handleAddPartToCheckout = (part: StockItem) => {
    setSelectedParts(prev => [...prev, { id: part.id, name: part.name, cost: part.cost }]);
  };

  // 移除已選料件
  const handleRemovePartFromCheckout = (index: number) => {
    setSelectedParts(prev => prev.filter((_, i) => i !== index));
  };

  // 計算總零件成本
  const totalPartsCost = selectedParts.reduce((sum, p) => sum + p.cost, 0);
  // 計算預估毛利 = 維修費 - 零件總成本
  const estimatedProfit = checkoutRepairFee - totalPartsCost;

  // 確認取件結帳
  const handleConfirmCheckout = () => {
    if (!checkoutRepair) return;

    // 扣除庫存
    selectedParts.forEach(used => {
      setStockList(prev => prev.map(s => s.id === used.id ? { ...s, stock: Math.max(0, s.stock - 1) } : s));
    });

    // 更新維修單狀態為「已取件」
    setRepairs(prev => prev.map(r => r.id === checkoutRepair.id ? {
      ...r,
      status: '已取件',
      repairFee: checkoutRepairFee,
      usedParts: selectedParts,
      paymentMethod: checkoutPaymentMethod,
      profit: estimatedProfit
    } : r));

    setIsCheckoutModalOpen(false);
    setSelectedRepair(null);
  };

  // 刪除維修單
  const handleDeleteRepair = (id: string) => {
    if (confirm('確定要刪除此維修單嗎？')) {
      setRepairs(prev => prev.filter(r => r.id !== id));
      setSelectedRepair(null);
    }
  };

  // 刪除零件
  const handleDeleteStock = (id: string) => {
    if (confirm('確定要刪除此零件嗎？')) {
      setStockList(prev => prev.filter(s => s.id !== id));
    }
  };

  // 新增零件
  const handleAddStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStockList(prev => [{ id: String(Date.now()), ...newStock }, ...prev]);
    setIsStockModalOpen(false);
    setNewStock({ code: '', name: '', category: '', model: '', stock: 0, cost: 0 });
  };

  // 刪除廠商
  const handleDeleteVendor = (id: string) => {
    if (confirm('確定要刪除此廠商嗎？')) {
      setVendors(prev => prev.filter(v => v.id !== id));
    }
  };

  // 新增廠商
  const handleAddVendorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setVendors(prev => [{ id: String(Date.now()), ...newVendor }, ...prev]);
    setIsVendorModalOpen(false);
    setNewVendor({ name: '', contact: '', phone: '' });
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen text-xs text-slate-700">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">維修與庫存管理</h1>
          <p className="text-slate-400 mt-1">管理客戶維修單、零件庫存及配合廠商</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
          <button onClick={() => setActiveTab('repairs')} className={`px-4 py-2 rounded-xl font-semibold transition ${activeTab === 'repairs' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'}`}>維修單列表 ({repairs.length})</button>
          <button onClick={() => setActiveTab('stock')} className={`px-4 py-2 rounded-xl font-semibold transition ${activeTab === 'stock' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'}`}>零件庫存 ({stockList.length})</button>
          <button onClick={() => setActiveTab('vendors')} className={`px-4 py-2 rounded-xl font-semibold transition ${activeTab === 'vendors' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'}`}>廠商管理 ({vendors.length})</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜尋..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-blue-500"
          />
        </div>
        {activeTab === 'stock' && (
          <button onClick={() => setIsStockModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold transition shadow-sm">+ 新增零件</button>
        )}
        {activeTab === 'vendors' && (
          <button onClick={() => setIsVendorModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold transition shadow-sm">+ 新增廠商</button>
        )}
      </div>

      {/* 1. 維修單列表 */}
      {activeTab === 'repairs' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-medium">
              <tr>
                <th className="p-4">維修單號</th>
                <th className="p-4">建立時間</th>
                <th className="p-4">客戶姓名</th>
                <th className="p-4">連絡電話</th>
                <th className="p-4">機型</th>
                <th className="p-4">問題描述</th>
                <th className="p-4">目前狀態</th>
                <th className="p-4 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {repairs.map(repair => (
                <tr key={repair.id} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => setSelectedRepair(repair)}>
                  <td className="p-4 font-mono font-medium text-blue-600">{repair.repairNo}</td>
                  <td className="p-4 text-slate-400">{repair.createdAt}</td>
                  <td className="p-4 font-bold text-slate-800">{repair.customerName}</td>
                  <td className="p-4 font-mono">{repair.phone}</td>
                  <td className="p-4">{repair.brandModel}</td>
                  <td className="p-4">{repair.problem}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                      repair.status === '已取件' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                    }`}>
                      {repair.status}
                    </span>
                  </td>
                  <td className="p-4 text-center flex items-center justify-center gap-2">
                    {repair.status !== '已取件' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenCheckout(repair); }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition font-semibold shadow-sm"
                      >
                        已取件結帳
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedRepair(repair); }}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg transition font-medium"
                    >
                      檢視
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. 零件庫存 */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-medium">
              <tr>
                <th className="p-4">零件編號</th>
                <th className="p-4">零件名稱</th>
                <th className="p-4">分類</th>
                <th className="p-4">適用機型</th>
                <th className="p-4">庫存數量</th>
                <th className="p-4">成本價</th>
                <th className="p-4 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stockList.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-mono">{item.code}</td>
                  <td className="p-4 font-bold text-slate-800">{item.name}</td>
                  <td className="p-4">{item.category}</td>
                  <td className="p-4">{item.model}</td>
                  <td className="p-4 font-bold font-mono">{item.stock}</td>
                  <td className="p-4 font-mono">${item.cost}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => handleDeleteStock(item.id)} className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. 廠商管理 */}
      {activeTab === 'vendors' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-medium">
              <tr>
                <th className="p-4">廠商名稱</th>
                <th className="p-4">聯絡人</th>
                <th className="p-4">行動電話</th>
                <th className="p-4 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vendors.map(vendor => (
                <tr key={vendor.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-bold text-slate-800">{vendor.name}</td>
                  <td className="p-4">{vendor.contact}</td>
                  <td className="p-4 font-mono">{vendor.phone}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => handleDeleteVendor(vendor.id)} className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 🚀 維修取件結帳專屬彈窗 (完全對應您的截圖設計) */}
      {isCheckoutModalOpen && checkoutRepair && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-100">
            {/* 標題列 */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-800">維修取件結帳 — {checkoutRepair.repairNo}</h2>
              <button onClick={() => setIsCheckoutModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[80vh] overflow-y-auto">
              {/* 左側：客戶簡要與使用料件選取 */}
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
                  <div>客戶：<span className="font-bold text-slate-800">{checkoutRepair.customerName}</span></div>
                  <div>機型：<span className="font-bold text-slate-800">{checkoutRepair.brandModel}</span></div>
                  <div>問題：<span className="font-bold text-slate-800">{checkoutRepair.problem}</span></div>
                </div>

                <div>
                  <div className="font-bold text-slate-700 mb-2">使用料件（成本追蹤）</div>
                  {/* 已選入的料件 */}
                  {selectedParts.length > 0 && (
                    <div className="mb-3 space-y-2">
                      <div className="text-[11px] text-slate-400 font-semibold">已選用的零件：</div>
                      {selectedParts.map((p, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-blue-50/60 border border-blue-100 p-2.5 rounded-xl">
                          <div>
                            <span className="font-bold text-blue-900">{p.name}</span>
                            <span className="text-slate-500 ml-2">成本 ${p.cost}</span>
                          </div>
                          <button onClick={() => handleRemovePartFromCheckout(idx)} className="text-rose-500 font-bold px-2 hover:bg-rose-100 rounded">✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 可點擊加入的庫存清單 */}
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {stockList.map(item => (
                      <div key={item.id} className="bg-slate-50 hover:bg-slate-100 border border-slate-200/60 p-3 rounded-2xl flex justify-between items-center transition">
                        <div>
                          <div className="font-bold text-slate-800">{item.name}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">庫存 {item.stock} · 成本 ${item.cost}</div>
                        </div>
                        <button
                          onClick={() => handleAddPartToCheckout(item)}
                          className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center transition shadow-sm"
                        >
                          +
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 右側：維修費、付款方式、結帳摘要 */}
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-slate-400 mb-1">維修費 (元) 可調整</label>
                    <input
                      type="number"
                      value={checkoutRepairFee}
                      onChange={e => setCheckoutRepairFee(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-lg text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* 付款方式：現金、刷卡、匯款 */}
                <div>
                  <label className="block text-slate-400 mb-2">付款方式</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['現金', '刷卡', '匯款'].map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setCheckoutPaymentMethod(method)}
                        className={`py-2.5 rounded-xl font-bold transition shadow-sm ${
                          checkoutPaymentMethod === method ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 結帳摘要 */}
                <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-100">
                  <div className="font-bold text-slate-700 flex items-center gap-1">⚙️ 結帳摘要</div>
                  <div className="flex justify-between text-slate-600">
                    <span>維修費</span>
                    <span className="font-mono">${checkoutRepairFee}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>零件總成本</span>
                    <span className="font-mono text-rose-500">-${totalPartsCost}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-600 pt-2 border-t border-slate-200/60 text-sm">
                    <span>預估毛利</span>
                    <span className="font-mono">${estimatedProfit}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-800 text-sm pt-1">
                    <span>客戶本次付款</span>
                    <span className="font-mono">${checkoutRepairFee}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 底部按鈕 */}
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold transition"
              >
                取消
              </button>
              <button
                onClick={handleConfirmCheckout}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-sm"
              >
                確認取件結帳 ${checkoutRepairFee}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 一般檢視明細彈窗 */}
      {selectedRepair && !isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-800">維修單詳情 — {selectedRepair.repairNo}</h2>
              <button onClick={() => setSelectedRepair(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl">
                <div>客戶：<span className="font-bold">{selectedRepair.customerName}</span></div>
                <div>電話：<span className="font-mono">{selectedRepair.phone}</span></div>
                <div>機型：<span className="font-bold">{selectedRepair.brandModel}</span></div>
                <div>狀態：<span className="font-bold text-blue-600">{selectedRepair.status}</span></div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl">
                <span className="text-slate-400">問題描述：</span>
                <p className="font-medium mt-1">{selectedRepair.problem}</p>
              </div>
              {selectedRepair.status === '已取件' && (
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 space-y-1">
                  <div className="font-bold text-emerald-800">結帳資訊</div>
                  <div>付款方式：{selectedRepair.paymentMethod || '現金'}</div>
                  <div>維修費：${selectedRepair.repairFee}</div>
                  <div>預估毛利：<span className="font-bold text-emerald-600">${selectedRepair.profit}</span></div>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-slate-100">
                <button onClick={() => handleDeleteRepair(selectedRepair.id)} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-medium">刪除此單</button>
                <button onClick={() => setSelectedRepair(null)} className="px-5 py-2 bg-slate-800 text-white rounded-xl font-semibold">關閉</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新增零件與廠商 Modal */}
      {isStockModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-800">＋ 新增零件</h2>
              <button onClick={() => setIsStockModalOpen(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleAddStockSubmit} className="p-6 space-y-4">
              <div><label className="block mb-1">零件代碼</label><input type="text" required value={newStock.code} onChange={e => setNewStock({...newStock, code: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl" /></div>
              <div><label className="block mb-1">零件名稱</label><input type="text" required value={newStock.name} onChange={e => setNewStock({...newStock, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block mb-1">庫存數量</label><input type="number" value={newStock.stock} onChange={e => setNewStock({...newStock, stock: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl" /></div>
                <div><label className="block mb-1">成本價 ($)</label><input type="number" value={newStock.cost} onChange={e => setNewStock({...newStock, cost: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl" /></div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsStockModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl">取消</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold">確認新增</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isVendorModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-800">＋ 新增廠商</h2>
              <button onClick={() => setIsVendorModalOpen(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleAddVendorSubmit} className="p-6 space-y-4">
              <div><label className="block mb-1">廠商名稱</label><input type="text" required value={newVendor.name} onChange={e => setNewVendor({...newVendor, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl" /></div>
              <div><label className="block mb-1">聯絡人</label><input type="text" value={newVendor.contact} onChange={e => setNewVendor({...newVendor, contact: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl" /></div>
              <div><label className="block mb-1">電話</label><input type="text" value={newVendor.phone} onChange={e => setNewVendor({...newVendor, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl" /></div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsVendorModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl">取消</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold">確認新增</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
