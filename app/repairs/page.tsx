'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

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
  estimatedPrice: number;
  repairFee: number;
  deposit: number;
  testingFee: number;
  status: string; // '檢測中' | '已收件' | '已取件' | '已作廢'
  outsourcer?: string;
  outsourcingPrice?: number;
  outsourcingPaid?: boolean;
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

const LOCAL_STORAGE_REPAIRS = 'pos_repairs_data_v2';
const LOCAL_STORAGE_STOCK = 'pos_stock_data_v2';
const LOCAL_STORAGE_VENDORS = 'pos_vendors_data_v2';

export default function RepairsAndStockPage() {
  const [activeTab, setActiveTab] = useState<'repairs' | 'stock' | 'vendors'>('repairs');

  // 1. 維修單狀態
  const [repairs, setRepairs] = useState<RepairItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_REPAIRS);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [
      {
        id: '1',
        repairNo: 'RO260715004',
        createdAt: '2026/07/23 下午12:58',
        customerName: 'SF',
        phone: '0988-215971',
        brandModel: '紅米 NOTE13',
        color: '綠',
        serialNumber: '-',
        problem: 'GOOGLE鎖',
        estimatedPrice: 0,
        repairFee: 0,
        deposit: 0,
        testingFee: 0,
        status: '已收件',
        outsourcer: 'THEONE',
        outsourcingPrice: 800,
        outsourcingPaid: true,
      }
    ];
  });

  // 2. 零件庫存狀態
  const [stockList, setStockList] = useState<StockItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_STOCK);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [
      { id: '1', code: 'P001', name: 'iPhone 13 螢幕', category: '螢幕', model: 'iPhone 13', stock: 5, cost: 2500 }
    ];
  });

  // 3. 廠商管理狀態
  const [vendors, setVendors] = useState<VendorItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_VENDORS);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [
      { id: '1', name: 'THEONE 零件供應商', contact: '王經理', phone: '0912-345678' }
    ];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRepair, setSelectedRepair] = useState<RepairItem | null>(null);

  // 新增零件 Modal 狀態
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [newStock, setNewStock] = useState({ code: '', name: '', category: '', model: '', stock: 0, cost: 0 });

  // 新增廠商 Modal 狀態
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [newVendor, setNewVendor] = useState({ name: '', contact: '', phone: '' });

  // 同步 LocalStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_REPAIRS, JSON.stringify(repairs));
  }, [repairs]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_STOCK, JSON.stringify(stockList));
  }, [stockList]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_VENDORS, JSON.stringify(vendors));
  }, [vendors]);

  // 刪除維修單
  const handleDeleteRepair = (id: string) => {
    if (confirm('確定要刪除此維修單嗎？')) {
      setRepairs(prev => prev.filter(r => r.id !== id));
      setSelectedRepair(null);
    }
  };

  // 更新維修單狀態 (收件/取件)
  const handleUpdateStatus = (id: string, newStatus: string) => {
    setRepairs(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    if (selectedRepair && selectedRepair.id === id) {
      setSelectedRepair(prev => prev ? { ...prev, status: newStatus } : null);
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
    const item: StockItem = {
      id: String(Date.now()),
      ...newStock
    };
    setStockList(prev => [item, ...prev]);
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
    const vendor: VendorItem = {
      id: String(Date.now()),
      ...newVendor
    };
    setVendors(prev => [vendor, ...prev]);
    setIsVendorModalOpen(false);
    setNewVendor({ name: '', contact: '', phone: '' });
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen text-xs text-slate-700">
      {/* 頂部標題與 Tab 切換 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">維修與庫存管理</h1>
          <p className="text-slate-400 mt-1">管理客戶維修單、零件庫存及配合廠商</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
          <button
            onClick={() => setActiveTab('repairs')}
            className={`px-4 py-2 rounded-xl font-semibold transition ${activeTab === 'repairs' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          >
            維修單列表 ({repairs.length})
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-4 py-2 rounded-xl font-semibold transition ${activeTab === 'stock' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          >
            零件庫存 ({stockList.length})
          </button>
          <button
            onClick={() => setActiveTab('vendors')}
            className={`px-4 py-2 rounded-xl font-semibold transition ${activeTab === 'vendors' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          >
            廠商管理 ({vendors.length})
          </button>
        </div>
      </div>

      {/* 搜尋與新增按鈕列 */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'repairs' ? '搜尋客戶、電話或維修單號...' : activeTab === 'stock' ? '搜尋零件名稱或編號...' : '搜尋廠商名稱或聯絡人...'}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-blue-500"
          />
        </div>
        {activeTab === 'stock' && (
          <button
            onClick={() => setIsStockModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold transition shadow-sm flex items-center gap-1 cursor-pointer"
          >
            <span>+</span> 新增零件
          </button>
        )}
        {activeTab === 'vendors' && (
          <button
            onClick={() => setIsVendorModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold transition shadow-sm flex items-center gap-1 cursor-pointer"
          >
            <span>+</span> 新增廠商
          </button>
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
                <th className="p-4">品牌 / 型號</th>
                <th className="p-4">問題描述</th>
                <th className="p-4">目前狀態</th>
                <th className="p-4 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {repairs.filter(r => r.repairNo.includes(searchQuery) || r.customerName.includes(searchQuery) || r.phone.includes(searchQuery)).map(repair => (
                <tr key={repair.id} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => setSelectedRepair(repair)}>
                  <td className="p-4 font-mono font-medium text-blue-600">{repair.repairNo}</td>
                  <td className="p-4 text-slate-400">{repair.createdAt}</td>
                  <td className="p-4 font-bold text-slate-800">{repair.customerName}</td>
                  <td className="p-4 font-mono">{repair.phone}</td>
                  <td className="p-4">{repair.brandModel}</td>
                  <td className="p-4 truncate max-w-xs">{repair.problem}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                      repair.status === '已取件' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      repair.status === '已收件' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                      'bg-amber-50 text-amber-600 border border-amber-100'
                    }`}>
                      {repair.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedRepair(repair); }}
                      className="px-3 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition font-medium"
                    >
                      查看明細
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. 零件庫存列表 */}
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
              {stockList.filter(s => s.name.includes(searchQuery) || s.code.includes(searchQuery)).map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-mono font-medium text-slate-700">{item.code}</td>
                  <td className="p-4 font-bold text-slate-800">{item.name}</td>
                  <td className="p-4">{item.category}</td>
                  <td className="p-4">{item.model}</td>
                  <td className="p-4 font-mono font-bold text-slate-700">{item.stock}</td>
                  <td className="p-4 font-mono text-slate-500">${item.cost}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleDeleteStock(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="刪除"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. 廠商管理列表 */}
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
              {vendors.filter(v => v.name.includes(searchQuery) || v.contact.includes(searchQuery)).map(vendor => (
                <tr key={vendor.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-bold text-slate-800">{vendor.name}</td>
                  <td className="p-4">{vendor.contact}</td>
                  <td className="p-4 font-mono">{vendor.phone}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleDeleteVendor(vendor.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="刪除"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 維修單詳細彈窗 (帶收件/取件功能與委外資訊) */}
      {selectedRepair && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-800">維修單 {selectedRepair.repairNo}</h2>
              <button onClick={() => setSelectedRepair(null)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* 委外維修資訊卡片 */}
              {selectedRepair.outsourcer && (
                <div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-4 flex justify-between items-center">
                  <div>
                    <span className="text-amber-700 font-bold flex items-center gap-1">
                      ↗ 委外維修 — {selectedRepair.outsourcer}
                    </span>
                    <p className="text-slate-500 mt-1">廠商報價：${selectedRepair.outsourcingPrice} {selectedRepair.outsourcingPaid ? '✓ 已支付' : ''}</p>
                  </div>
                </div>
              )}

              {/* 基本資訊 */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl">
                <div>客戶：<span className="font-bold text-slate-800">{selectedRepair.customerName}</span></div>
                <div>電話：<span className="font-mono">{selectedRepair.phone}</span></div>
                <div>機型：<span className="font-bold text-slate-800">{selectedRepair.brandModel}</span></div>
                <div>顏色 / 序號：{selectedRepair.color} / {selectedRepair.serialNumber}</div>
              </div>

              {/* 問題描述 */}
              <div className="bg-slate-50 p-4 rounded-2xl">
                <span className="text-slate-400">問題描述：</span>
                <p className="text-slate-800 mt-1 font-medium">{selectedRepair.problem}</p>
              </div>

              {/* 金額資訊 */}
              <div className="grid grid-cols-4 gap-2 bg-slate-50 p-4 rounded-2xl text-center">
                <div>
                  <div className="text-slate-400">維修報價</div>
                  <div className="font-bold text-blue-600 text-sm mt-1">${selectedRepair.repairFee}</div>
                </div>
                <div>
                  <div className="text-slate-400">廠商報價</div>
                  <div className="font-bold text-amber-600 text-sm mt-1">${selectedRepair.outsourcingPrice || 0}</div>
                </div>
                <div>
                  <div className="text-slate-400">訂金</div>
                  <div className="font-bold text-slate-700 text-sm mt-1">${selectedRepair.deposit}</div>
                </div>
                <div>
                  <div className="text-slate-400">預估毛利</div>
                  <div className="font-bold text-emerald-600 text-sm mt-1">${selectedRepair.repairFee - (selectedRepair.outsourcingPrice || 0)}</div>
                </div>
              </div>

              {/* 狀態切換按鈕 */}
              <div>
                <label className="block font-semibold mb-2 text-slate-600">更新狀態</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleUpdateStatus(selectedRepair.id, '已收件')}
                    className={`py-3 rounded-xl font-bold transition shadow-sm ${selectedRepair.status === '已收件' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    已收件
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedRepair.id, '已取件')}
                    className={`py-3 rounded-xl font-bold transition shadow-sm ${selectedRepair.status === '已取件' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    已取件
                  </button>
                </div>
              </div>

              {/* 底部操作按鈕 */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <div className="flex gap-2">
                  <button className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium flex items-center gap-1">
                    <span>🖨️</span> 補印收件單
                  </button>
                  <button
                    onClick={() => handleDeleteRepair(selectedRepair.id)}
                    className="px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-medium transition"
                  >
                    刪除此維修單
                  </button>
                </div>
                <button
                  onClick={() => setSelectedRepair(null)}
                  className="px-5 py-2 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700 transition"
                >
                  關閉視窗
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新增零件彈窗 */}
      {isStockModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-800">＋ 新增零件</h2>
              <button onClick={() => setIsStockModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleAddStockSubmit} className="p-6 space-y-4">
              <div>
                <label className="block font-medium mb-1">零件編號</label>
                <input type="text" required value={newStock.code} onChange={e => setNewStock({...newStock, code: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl" placeholder="例: P002" />
              </div>
              <div>
                <label className="block font-medium mb-1">零件名稱</label>
                <input type="text" required value={newStock.name} onChange={e => setNewStock({...newStock, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl" placeholder="例: iPhone 14 電池" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">分類</label>
                  <input type="text" value={newStock.category} onChange={e => setNewStock({...newStock, category: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl" placeholder="例: 電池" />
                </div>
                <div>
                  <label className="block font-medium mb-1">適用機型</label>
                  <input type="text" value={newStock.model} onChange={e => setNewStock({...newStock, model: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl" placeholder="例: iPhone 14" />
                </div>
                <div>
                  <label className="block font-medium mb-1">庫存數量</label>
                  <input type="number" value={newStock.stock} onChange={e => setNewStock({...newStock, stock: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl" />
                </div>
                <div>
                  <label className="block font-medium mb-1">成本價 ($)</label>
                  <input type="number" value={newStock.cost} onChange={e => setNewStock({...newStock, cost: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsStockModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-medium">取消</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold">確認新增</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 新增廠商彈窗 */}
      {isVendorModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-800">＋ 新增廠商</h2>
              <button onClick={() => setIsVendorModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleAddVendorSubmit} className="p-6 space-y-4">
              <div>
                <label className="block font-medium mb-1">廠商名稱</label>
                <input type="text" required value={newVendor.name} onChange={e => setNewVendor({...newVendor, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl" placeholder="例: 宏大通訊批發" />
              </div>
              <div>
                <label className="block font-medium mb-1">聯絡人</label>
                <input type="text" value={newVendor.contact} onChange={e => setNewVendor({...newVendor, contact: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl" placeholder="例: 陳先生" />
              </div>
              <div>
                <label className="block font-medium mb-1">行動電話</label>
                <input type="text" value={newVendor.phone} onChange={e => setNewVendor({...newVendor, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl" placeholder="例: 0922-333444" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsVendorModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-medium">取消</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold">確認新增</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
