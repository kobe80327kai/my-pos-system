export const dynamic = 'force-dynamic'
'use client';

import React, { useState, useEffect } from 'react';
// @ts-ignore
import { supabase } from '../../lib/supabase';

// 1. 維修單資料型態
interface RepairOrder {
  id: string;
  customerName: string;
  phone: string;
  brand?: string;
  model: string;
  color: string;
  serialNumber: string;
  deposit: number;
  problem: string;
  quotePrice: number;
  repairFee: number;
  inspectionFee: number;
  remark?: string;
  password?: string;
  status: '已收件' | '已取件';
  createdAt: string;
  usedParts?: { partId: string; name: string; cost: number }[];
  paymentMethod?: string;
  checkoutNote?: string;
}

// 2. 零件品項資料型態
interface PartStock {
  id: string;
  name: string;
  brand: string;
  category: string;
  applicableModel: string;
  stock: number;
  actualCost: number;
  storeCost: number;
  price: number;
  note?: string;
}

// 3. 進貨紀錄資料型態
interface PurchaseRecord {
  id: string;
  date: string;
  vendor: string;
  note: string;
  itemCount: number;
}

// 4. 維修廠商資料型態
interface RepairVendor {
  id: string;
  name: string;
  contactPerson: string;
  mobile: string;
  phone: string;
  address: string;
  note?: string;
}

interface StockInItem {
  part: PartStock;
  quantity: number;
  cost: number;
}

export default function RepairsPage() {
  const [activeTab, setActiveTab] = useState<
    '維修單' | '零件庫存' | '進貨紀錄' | '維修零件建檔' | '維修廠商'
  >('維修單');

  // 控制 Modals
  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [isAddPartModalOpen, setIsAddPartModalOpen] = useState(false);
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<RepairOrder | null>(null);

  // 零件入庫
  const [stockInSearch, setStockInSearch] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [stockInNote, setStockInNote] = useState('');
  const [stockInCart, setStockInCart] = useState<StockInItem[]>([]);

  // 表單 States
  const [newVendorForm, setNewVendorForm] = useState({
    id: '',
    name: '',
    contactPerson: '',
    mobile: '',
    phone: '',
    address: '',
    note: '',
  });

  const [newPartForm, setNewPartForm] = useState({
    name: '',
    id: '',
    brand: '',
    category: '',
    applicableModel: '',
    actualCost: 0,
    note: '',
  });

  const [newOrderForm, setNewOrderForm] = useState({
    customerName: '',
    brand: '',
    model: '',
    color: '',
    serialNumber: '',
    problem: '',
    quotePrice: 0,
    repairFee: 0,
    deposit: 0,
    inspectionFee: 0,
    remark: '',
    password: '',
  });

  // 資料列表 States (改由 Supabase 讀取)
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [parts, setParts] = useState<PartStock[]>([]);
  const [vendors, setVendors] = useState<RepairVendor[]>([]);
  const [purchaseRecords, setPurchaseRecords] = useState<PurchaseRecord[]>([]);

  // 畫面載入時，從 Supabase 抓取所有真實資料
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const { data: ordersData } = await supabase.from('repairs').select('*');
      if (ordersData) setOrders(ordersData);

      const { data: partsData } = await supabase.from('parts').select('*');
      if (partsData) setParts(partsData);

      const { data: vendorsData } = await supabase.from('vendors').select('*');
      if (vendorsData) setVendors(vendorsData);

      const { data: purchaseData } = await supabase.from('purchase_records').select('*');
      if (purchaseData) setPurchaseRecords(purchaseData);
    } catch (err) {
      console.error('抓取資料失敗:', err);
    }
  };

  // ---- 刪除維修單 (同步 Supabase) ----
  const handleDeleteOrder = async (id: string) => {
    if (confirm(`確定要刪除維修單 [${id}] 嗎？刪除後無法復原。`)) {
      const { error } = await supabase.from('repairs').delete().eq('id', id);
      if (error) {
        alert('刪除失敗：' + error.message);
        return;
      }
      setOrders(orders.filter((o) => o.id !== id));
      setSelectedOrder(null);
    }
  };

  // ---- 刪除零件 (同步 Supabase) ----
  const handleDeletePart = async (partId: string, partName: string) => {
    if (confirm(`確定要刪除零件項目 [${partName}] (${partId}) 嗎？`)) {
      const { error } = await supabase.from('parts').delete().eq('id', partId);
      if (error) {
        alert('刪除失敗：' + error.message);
        return;
      }
      setParts(parts.filter((p) => p.id !== partId));
    }
  };

  // ---- 刪除廠商 (同步 Supabase) ----
  const handleDeleteVendor = async (vendorId: string, vendorName: string) => {
    if (confirm(`確定要刪除廠商 [${vendorName}] (${vendorId}) 嗎？`)) {
      const { error } = await supabase.from('vendors').delete().eq('id', vendorId);
      if (error) {
        alert('刪除失敗：' + error.message);
        return;
      }
      setVendors(vendors.filter((v) => v.id !== vendorId));
    }
  };

  // ---- 新增維修單 (同步 Supabase) ----
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderForm.customerName || !newOrderForm.model) {
      alert('請填寫客戶名稱與機型！');
      return;
    }
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    const newId = `RO${today.getFullYear().toString().slice(-2)}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}${Math.floor(100 + Math.random() * 900)}`;

    const newOrder: RepairOrder = {
      id: newId,
      customerName: newOrderForm.customerName,
      phone: '-',
      brand: newOrderForm.brand,
      model: newOrderForm.model,
      color: newOrderForm.color || '-',
      serialNumber: newOrderForm.serialNumber || '-',
      problem: newOrderForm.problem || '無紀錄',
      quotePrice: Number(newOrderForm.quotePrice) || 0,
      repairFee: Number(newOrderForm.repairFee) || 0,
      deposit: Number(newOrderForm.deposit) || 0,
      inspectionFee: Number(newOrderForm.inspectionFee) || 0,
      remark: newOrderForm.remark,
      password: newOrderForm.password,
      status: '已收件',
      createdAt: dateStr,
    };

    const { error } = await supabase.from('repairs').insert([newOrder]);
    if (error) {
      alert('新增失敗：' + error.message);
      return;
    }

    setOrders([newOrder, ...orders]);
    setIsAddOrderModalOpen(false);
    setNewOrderForm({
      customerName: '',
      brand: '',
      model: '',
      color: '',
      serialNumber: '',
      problem: '',
      quotePrice: 0,
      repairFee: 0,
      deposit: 0,
      inspectionFee: 0,
      remark: '',
      password: '',
    });
  };

  // ---- 新增零件品項 (同步 Supabase) ----
  const handleCreatePart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartForm.name) {
      alert('請填寫品名！');
      return;
    }
    const autoId = newPartForm.id.trim() || `PRT${(parts.length + 1).toString().padStart(5, '0')}`;
    const newPart: PartStock = {
      id: autoId,
      name: newPartForm.name,
      brand: newPartForm.brand || '—',
      category: newPartForm.category || '未分類',
      applicableModel: newPartForm.applicableModel || '—',
      stock: 0,
      actualCost: Number(newPartForm.actualCost) || 0,
      storeCost: Number(newPartForm.actualCost) || 0,
      price: 0,
      note: newPartForm.note,
    };

    const { error } = await supabase.from('parts').insert([newPart]);
    if (error) {
      alert('新增失敗：' + error.message);
      return;
    }

    setParts([...parts, newPart]);
    setIsAddPartModalOpen(false);
    setNewPartForm({ name: '', id: '', brand: '', category: '', applicableModel: '', actualCost: 0, note: '' });
  };

  // ---- 新增維修廠商 (同步 Supabase) ----
  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorForm.name.trim()) {
      alert('請填寫廠商名稱！');
      return;
    }
    const autoId = newVendorForm.id.trim() || `VEN${(vendors.length + 1).toString().padStart(3, '0')}`;
    const newVendor: RepairVendor = {
      id: autoId,
      name: newVendorForm.name,
      contactPerson: newVendorForm.contactPerson || '—',
      mobile: newVendorForm.mobile || '—',
      phone: newVendorForm.phone || '—',
      address: newVendorForm.address || '—',
      note: newVendorForm.note || '—',
    };

    const { error } = await supabase.from('vendors').insert([newVendor]);
    if (error) {
      alert('新增失敗：' + error.message);
      return;
    }

    setVendors([...vendors, newVendor]);
    setIsAddVendorModalOpen(false);
    setNewVendorForm({ id: '', name: '', contactPerson: '', mobile: '', phone: '', address: '', note: '' });
  };

  // 零件入庫勾選
  const toggleSelectPart = (part: PartStock) => {
    const exists = stockInCart.find((item) => item.part.id === part.id);
    if (exists) {
      setStockInCart(stockInCart.filter((item) => item.part.id !== part.id));
    } else {
      setStockInCart([...stockInCart, { part, quantity: 1, cost: part.actualCost }]);
    }
  };

  // 完成零件入庫
  const handleCompleteStockIn = async () => {
    if (stockInCart.length === 0) {
      alert('請至少選擇一項入庫零件！');
      return;
    }

    for (const item of stockInCart) {
      const newStock = item.part.stock + item.quantity;
      await supabase.from('parts').update({ stock: newStock, actualCost: item.cost }).eq('id', item.part.id);
    }

    const today = new Date();
    const dateStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    const newRecordId = `RP${today.getFullYear().toString().slice(-2)}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}${Math.floor(100 + Math.random() * 900)}`;

    const newRecord: PurchaseRecord = {
      id: newRecordId,
      date: dateStr,
      vendor: selectedVendor || '—',
      note: stockInNote || '—',
      itemCount: stockInCart.length,
    };

    await supabase.from('purchase_records').insert([newRecord]);

    alert('入庫成功！');
    setIsStockInModalOpen(false);
    setStockInCart([]);
    setStockInNote('');
    setSelectedVendor('');
    fetchAllData(); // 重新抓取最新資料
  };

  const tabs = ['維修單', '零件庫存', '進貨紀錄', '維修零件建檔', '維修廠商'] as const;
  const filteredParts = parts.filter(
    (p) => p.name.includes(stockInSearch) || p.id.toLowerCase().includes(stockInSearch.toLowerCase())
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* 頂部按鈕區 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">維修管理</h1>
        {activeTab === '維修單' && (
          <button onClick={() => setIsAddOrderModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition shadow-sm">+ 新增維修單</button>
        )}
        {activeTab === '零件庫存' && (
          <button onClick={() => setIsStockInModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition shadow-sm">+ 入庫</button>
        )}
        {activeTab === '維修零件建檔' && (
          <button onClick={() => setIsAddPartModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition shadow-sm">+ 新增零件品項</button>
        )}
        {activeTab === '維修廠商' && (
          <button onClick={() => setIsAddVendorModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition shadow-sm">+ 新增維修廠商</button>
        )}
      </div>

      {/* Tabs 分頁列 */}
      <div className="border-b border-slate-200 mb-6 flex gap-8">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-semibold transition-all relative ${
              activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB: 維修單 */}
      {activeTab === '維修單' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-medium">
              <tr>
                <th className="p-4">單號</th>
                <th className="p-4">客戶</th>
                <th className="p-4">機型</th>
                <th className="p-4">問題</th>
                <th className="p-4">報價</th>
                <th className="p-4">狀態</th>
                <th className="p-4">收件日</th>
                <th className="p-4 text-right pr-6">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/80 transition group">
                  <td onClick={() => setSelectedOrder(order)} className="p-4 font-mono font-medium text-slate-800 cursor-pointer">{order.id}</td>
                  <td onClick={() => setSelectedOrder(order)} className="p-4 font-bold text-slate-800 cursor-pointer">{order.customerName}</td>
                  <td onClick={() => setSelectedOrder(order)} className="p-4 text-slate-700 cursor-pointer">{order.model}</td>
                  <td onClick={() => setSelectedOrder(order)} className="p-4 text-slate-600 cursor-pointer">{order.problem}</td>
                  <td onClick={() => setSelectedOrder(order)} className="p-4 font-bold font-mono text-slate-800 cursor-pointer">${order.quotePrice}</td>
                  <td onClick={() => setSelectedOrder(order)} className="p-4 cursor-pointer">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-medium flex items-center gap-1 w-max ${order.status === '已收件' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      • {order.status}
                    </span>
                  </td>
                  <td onClick={() => setSelectedOrder(order)} className="p-4 font-mono text-slate-400 cursor-pointer">{order.createdAt}</td>
                  <td className="p-4 text-right pr-6 flex items-center justify-end gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteOrder(order.id);
                      }}
                      className="text-slate-300 hover:text-rose-600 transition text-sm"
                      title="刪除維修單"
                    >
                      🗑️
                    </button>
                    <span onClick={() => setSelectedOrder(order)} className="text-slate-300 font-mono group-hover:text-slate-500 cursor-pointer">&gt;</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: 進貨紀錄 */}
      {activeTab === '進貨紀錄' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-medium">
              <tr>
                <th className="p-4 w-1/5">單號</th>
                <th className="p-4 w-1/5">日期</th>
                <th className="p-4 w-1/5">廠商</th>
                <th className="p-4 w-1/4">備註</th>
                <th className="p-4 text-center">品項數</th>
                <th className="p-4 text-right pr-6">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchaseRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/80 transition group">
                  <td className="p-4 font-mono font-bold text-blue-600">{record.id}</td>
                  <td className="p-4 font-mono text-slate-600">{record.date}</td>
                  <td className="p-4 text-slate-700 font-medium">{record.vendor}</td>
                  <td className="p-4 text-slate-400">{record.note}</td>
                  <td className="p-4 text-center font-mono font-bold text-slate-700">{record.itemCount}</td>
                  <td className="p-4 text-right pr-6">
                    <button onClick={async () => {
                      await supabase.from('purchase_records').delete().eq('id', record.id);
                      setPurchaseRecords(purchaseRecords.filter(r => r.id !== record.id));
                    }} className="text-slate-300 hover:text-rose-500 transition text-sm">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: 零件庫存 */}
      {activeTab === '零件庫存' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold">
              <tr>
                <th className="p-4">零件編號</th>
                <th className="p-4">名稱</th>
                <th className="p-4">品牌</th>
                <th className="p-4">適用機型</th>
                <th className="p-4">庫存</th>
                <th className="p-4">實際成本</th>
                <th className="p-4">門市成本</th>
                <th className="p-4">售價</th>
                <th className="p-4 text-right pr-6">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {parts.map((part) => (
                <tr key={part.id} className="hover:bg-slate-50/80 transition group">
                  <td className="p-4 font-mono text-slate-500">{part.id}</td>
                  <td className="p-4 font-medium text-slate-800">{part.name}</td>
                  <td className="p-4 text-slate-600">{part.brand}</td>
                  <td className="p-4 text-slate-400">{part.applicableModel}</td>
                  <td className="p-4 font-bold text-rose-600">{part.stock}</td>
                  <td className="p-4 font-mono text-amber-600">${part.actualCost}</td>
                  <td className="p-4 font-mono text-slate-700">${part.storeCost}</td>
                  <td className="p-4 font-mono text-blue-600">${part.price}</td>
                  <td className="p-4 text-right pr-6">
                    <button onClick={() => handleDeletePart(part.id, part.name)} className="text-slate-300 hover:text-rose-600 transition text-sm font-medium">🗑️ 刪除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: 維修零件建檔 */}
      {activeTab === '維修零件建檔' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold">
              <tr>
                <th className="p-4">編號</th>
                <th className="p-4">品名</th>
                <th className="p-4">品牌</th>
                <th className="p-4">分類</th>
                <th className="p-4">適用機型</th>
                <th className="p-4">預設成本</th>
                <th className="p-4">備註</th>
                <th className="p-4 text-right pr-6">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {parts.map((part) => (
                <tr key={part.id} className="hover:bg-slate-50/80 transition group">
                  <td className="p-4 font-mono text-slate-500">{part.id}</td>
                  <td className="p-4 font-medium text-slate-800">{part.name}</td>
                  <td className="p-4 text-slate-600">{part.brand}</td>
                  <td className="p-4 text-slate-600">{part.category}</td>
                  <td className="p-4 text-slate-400">{part.applicableModel}</td>
                  <td className="p-4 font-mono font-medium text-amber-600">${part.actualCost}</td>
                  <td className="p-4 text-slate-400">{part.note || '—'}</td>
                  <td className="p-4 text-right pr-6">
                    <button onClick={() => handleDeletePart(part.id, part.name)} className="text-slate-300 hover:text-rose-600 transition text-sm font-medium">🗑️ 刪除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: 維修廠商 */}
      {activeTab === '維修廠商' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-medium">
              <tr>
                <th className="p-4">廠商名稱</th>
                <th className="p-4">聯絡人</th>
                <th className="p-4">手機</th>
                <th className="p-4">電話</th>
                <th className="p-4">地址</th>
                <th className="p-4">備註</th>
                <th className="p-4 text-right pr-6">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-slate-50/80 transition group">
                  <td className="p-4 font-bold text-slate-800 flex items-center gap-2">
                    {vendor.name}
                    <span className="text-[10px] font-mono text-slate-400 font-normal">({vendor.id})</span>
                  </td>
                  <td className="p-4 text-slate-700">{vendor.contactPerson}</td>
                  <td className="p-4 font-mono text-slate-600">{vendor.mobile}</td>
                  <td className="p-4 font-mono text-slate-600">{vendor.phone}</td>
                  <td className="p-4 text-slate-600">{vendor.address}</td>
                  <td className="p-4 text-slate-400 max-w-xs truncate">{vendor.note}</td>
                  <td className="p-4 text-right pr-6">
                    <button onClick={() => handleDeleteVendor(vendor.id, vendor.name)} className="text-slate-300 hover:text-rose-600 transition text-sm font-medium">🗑️ 刪除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ➕ 新增維修單 Modal */}
      {isAddOrderModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100">
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-800">新增維修單</h2>
              <button onClick={() => setIsAddOrderModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg transition">✕</button>
            </div>
            <form onSubmit={handleCreateOrder} className="p-8 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="text-xs text-slate-700 font-medium mb-1.5 block">客戶 <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={newOrderForm.customerName}
                  onChange={(e) => setNewOrderForm({ ...newOrderForm, customerName: e.target.value })}
                  placeholder="輸入客戶姓名..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-700 font-medium mb-1.5 block">品牌</label>
                  <input type="text" value={newOrderForm.brand} onChange={(e) => setNewOrderForm({ ...newOrderForm, brand: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 transition" />
                </div>
                <div>
                  <label className="text-xs text-slate-700 font-medium mb-1.5 block">機型 <span className="text-rose-500">*</span></label>
                  <input type="text" required value={newOrderForm.model} onChange={(e) => setNewOrderForm({ ...newOrderForm, model: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 transition" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-700 font-medium mb-1.5 block">問題描述 <span className="text-rose-500">*</span></label>
                <textarea rows={3} required value={newOrderForm.problem} onChange={(e) => setNewOrderForm({ ...newOrderForm, problem: e.target.value })} className="w-full border border-slate-200 rounded-xl p-3 text-xs text-slate-700 focus:outline-none focus:border-blue-500 transition resize-y" />
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-slate-600 font-medium mb-1 block">報價 ( 元 )</label>
                  <input type="number" value={newOrderForm.quotePrice || ''} onChange={(e) => setNewOrderForm({ ...newOrderForm, quotePrice: Number(e.target.value) })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 transition" />
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-medium mb-1 block">維修費 ( 元 )</label>
                  <input type="number" value={newOrderForm.repairFee || ''} onChange={(e) => setNewOrderForm({ ...newOrderForm, repairFee: Number(e.target.value) })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 transition" />
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-medium mb-1 block">訂金 ( 元 )</label>
                  <input type="number" value={newOrderForm.deposit || ''} onChange={(e) => setNewOrderForm({ ...newOrderForm, deposit: Number(e.target.value) })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 transition" />
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-medium mb-1 block">檢測費 ( 元 )</label>
                  <input type="number" value={newOrderForm.inspectionFee || ''} onChange={(e) => setNewOrderForm({ ...newOrderForm, inspectionFee: Number(e.target.value) })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 transition" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddOrderModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition">取消</button>
                <button type="submit" className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm">確認建立</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📦 零件入庫 Modal */}
      {isStockInModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100">
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-800">零件入庫</h2>
              <button onClick={() => setIsStockInModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg transition">✕</button>
            </div>
            <div className="p-8 space-y-4 max-h-[80vh] overflow-y-auto">
              <input type="text" value={stockInSearch} onChange={(e) => setStockInSearch(e.target.value)} placeholder="搜尋零件..." className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 transition" />
              <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="p-3">選擇</th>
                      <th className="p-3">名稱</th>
                      <th className="p-3">目前庫存</th>
                      <th className="p-3">成本</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredParts.map((part) => {
                      const isSelected = stockInCart.some((item) => item.part.id === part.id);
                      return (
                        <tr key={part.id} onClick={() => toggleSelectPart(part)} className={`cursor-pointer transition ${isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50'}`}>
                          <td className="p-3"><input type="checkbox" checked={isSelected} onChange={() => {}} /></td>
                          <td className="p-3 font-medium text-slate-800">{part.name}</td>
                          <td className="p-3 font-bold text-slate-600">{part.stock}</td>
                          <td className="p-3 font-mono text-amber-600">${part.actualCost}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <select value={selectedVendor} onChange={(e) => setSelectedVendor(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 transition bg-white">
                <option value="">選擇廠商...</option>
                {vendors.map((v) => (<option key={v.id} value={v.name}>{v.name}</option>))}
              </select>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button onClick={() => setIsStockInModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition">取消</button>
                <button onClick={handleCompleteStockIn} className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm">確認入庫</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ➕ 新增零件品項 Modal */}
      {isAddPartModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-800">新增零件品項</h2>
              <button onClick={() => setIsAddPartModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg transition">✕</button>
            </div>
            <form onSubmit={handleCreatePart} className="p-8 space-y-4">
              <div>
                <label className="text-xs text-slate-700 font-medium mb-1.5 block">品名 <span className="text-rose-500">*</span></label>
                <input type="text" required value={newPartForm.name} onChange={(e) => setNewPartForm({ ...newPartForm, name: e.target.value })} placeholder="例如：iPhone 13 螢幕" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 transition" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-700 font-medium mb-1.5 block">品牌</label>
                  <input type="text" value={newPartForm.brand} onChange={(e) => setNewPartForm({ ...newPartForm, brand: e.target.value })} placeholder="例如：Apple" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 transition" />
                </div>
                <div>
                  <label className="text-xs text-slate-700 font-medium mb-1.5 block">適用機型</label>
                  <input type="text" value={newPartForm.applicableModel} onChange={(e) => setNewPartForm({ ...newPartForm, applicableModel: e.target.value })} placeholder="例如：A2633" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 transition" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-700 font-medium mb-1.5 block">預設成本 ( 元 )</label>
                <input type="number" value={newPartForm.actualCost || ''} onChange={(e) => setNewPartForm({ ...newPartForm, actualCost: Number(e.target.value) })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 transition" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddPartModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition">取消</button>
                <button type="submit" className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm">確認新增</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ➕ 新增維修廠商 Modal */}
      {isAddVendorModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-800">新增維修廠商</h2>
              <button onClick={() => setIsAddVendorModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg transition">✕</button>
            </div>
            <form onSubmit={handleCreateVendor} className="p-8 space-y-4">
              <div>
                <label className="text-xs text-slate-700 font-medium mb-1.5 block">廠商名稱 <span className="text-rose-500">*</span></label>
                <input type="text" required value={newVendorForm.name} onChange={(e) => setNewVendorForm({ ...newVendorForm, name: e.target.value })} placeholder="輸入廠商名稱..." className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 transition" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-700 font-medium mb-1.5 block">聯絡人</label>
                  <input type="text" value={newVendorForm.contactPerson} onChange={(e) => setNewVendorForm({ ...newVendorForm, contactPerson: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 transition" />
                </div>
                <div>
                  <label className="text-xs text-slate-700 font-medium mb-1.5 block">手機</label>
                  <input type="text" value={newVendorForm.mobile} onChange={(e) => setNewVendorForm({ ...newVendorForm, mobile: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 transition" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-700 font-medium mb-1.5 block">地址</label>
                <input type="text" value={newVendorForm.address} onChange={(e) => setNewVendorForm({ ...newVendorForm, address: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 transition" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddVendorModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition">取消</button>
                <button type="submit" className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm">確認新增</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}