"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface RepairOrder {
  id: string;
  customerName: string;
  phone: string;
  brand: string;
  model: string;
  color?: string;
  serialNumber?: string;
  problem: string;
  quotePrice: number;
  repairFee: number;
  deposit: number;
  inspectionFee: number;
  status: string;
  password?: string;
  created_at?: string;
}

interface PartStock {
  id: string;
  name: string;
  category: string;
  applicableModel: string;
  stockQuantity: number;
  safetyStock: number;
  actualCost: number;
  sellingPrice: number;
  vendorId?: string;
}

interface RepairVendor {
  id: string;
  name: string;
  contactPerson?: string;
  mobile?: string;
}

export default function RepairsPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'parts' | 'vendors'>('orders');
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [parts, setParts] = useState<PartStock[]>([]);
  const [vendors, setVendors] = useState<RepairVendor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [isAddPartModalOpen, setIsAddPartModalOpen] = useState(false);
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);
  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RepairOrder | null>(null);
  const [selectedPart, setSelectedPart] = useState<PartStock | null>(null); // 新增：檢視零件詳情用

  const [newPartForm, setNewPartForm] = useState({
    id: '',
    name: '',
    category: '',
    applicableModel: '',
    actualCost: 0,
    stockQuantity: 0,
  });

  const [newVendorForm, setNewVendorForm] = useState({
    name: '',
    contactPerson: '',
    mobile: '',
  });

  const [newOrderForm, setNewOrderForm] = useState({
    customerName: '',
    phone: '',
    brand: '',
    model: '',
    color: '',
    serialNumber: '',
    problem: '',
    quotePrice: 0,
    deposit: 0,
    password: '',
  });

  useEffect(() => {
    fetchOrders();
    fetchParts();
    fetchVendors();
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase.from('repair_orders').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      const formattedOrders = data.map((item: any) => ({
        ...item,
        customerName: item.customerName || item.customer_name || item.customername || '',
        serialNumber: item.serialNumber || item.serial_number || item.serialnumber || '',
        quotePrice: item.quotePrice ?? item.quote_price ?? item.quoteprice ?? 0,
        repairFee: item.repairFee ?? item.repair_fee ?? item.repairfee ?? 0,
        inspectionFee: item.inspectionFee ?? item.inspection_fee ?? item.inspectionfee ?? 0,
      }));
      setOrders(formattedOrders);
    }
  };

  const fetchParts = async () => {
    const { data, error } = await supabase.from('part_stocks').select('*');
    if (!error && data) {
      const formattedParts = data.map((item: any) => ({
        ...item,
        applicableModel: item.applicableModel || item.applicable_model || item.applicablemodel || '',
        stockQuantity: item.stockQuantity ?? item.stock_quantity ?? item.stockquantity ?? 0,
        safetyStock: item.safetyStock ?? item.safety_stock ?? item.safetystock ?? 0,
        actualCost: item.actualCost ?? item.actual_cost ?? item.actualcost ?? 0,
        sellingPrice: item.sellingPrice ?? item.selling_price ?? item.sellingprice ?? 0,
      }));
      setParts(formattedParts);
    }
  };

  const fetchVendors = async () => {
    const { data, error } = await supabase.from('repair_vendors').select('*');
    if (!error && data) {
      const formattedVendors = data.map((item: any) => ({
        ...item,
        contactPerson: item.contactPerson || item.contact_person || item.contactperson || '',
      }));
      setVendors(formattedVendors);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm('確定要刪除這筆維修單嗎？')) return;
    const { error } = await supabase.from('repair_orders').delete().eq('id', id);
    if (!error) {
      setOrders(orders.filter(o => o.id !== id));
      setSelectedOrder(null);
    } else {
      alert('刪除失敗');
    }
  };

  // 新增：刪除零件功能
  const handleDeletePart = async (id: string) => {
    if (!confirm('確定要刪除這個零件品項嗎？')) return;
    const { error } = await supabase.from('part_stocks').delete().eq('id', id);
    if (!error) {
      setParts(parts.filter(p => p.id !== id));
      setSelectedPart(null);
    } else {
      alert('刪除零件失敗');
    }
  };

  const handleCreatePart = async (e: React.FormEvent) => {
    e.preventDefault();
    const partId = newPartForm.id.trim() || `PART-${Date.now()}`;
    const payload = {
      id: partId,
      name: newPartForm.name,
      category: newPartForm.category,
      applicable_model: newPartForm.applicableModel,
      applicableModel: newPartForm.applicableModel,
      stock_quantity: newPartForm.stockQuantity,
      stockQuantity: newPartForm.stockQuantity,
      safety_stock: 2,
      safetyStock: 2,
      actual_cost: newPartForm.actualCost,
      actualCost: newPartForm.actualCost,
      selling_price: 0,
      sellingPrice: 0,
    };
    
    const { error } = await supabase.from('part_stocks').insert([payload]);
    if (!error) {
      fetchParts();
      setIsAddPartModalOpen(false);
      setNewPartForm({ id: '', name: '', category: '', applicableModel: '', actualCost: 0, stockQuantity: 0 });
    } else {
      alert(`新增零件失敗: ${error.message}`);
    }
  };

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: newVendorForm.name,
      contact_person: newVendorForm.contactPerson,
      contactPerson: newVendorForm.contactPerson,
      mobile: newVendorForm.mobile,
    };
    const { error } = await supabase.from('repair_vendors').insert([payload]);
    if (!error) {
      fetchVendors();
      setIsAddVendorModalOpen(false);
      setNewVendorForm({ name: '', contactPerson: '', mobile: '' });
    } else {
      alert(`新增廠商失敗: ${error.message}`);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const orderId = `R-${Date.now().toString().slice(-6)}`;
    
    const payload = {
      id: orderId,
      customerName: newOrderForm.customerName,
      customer_name: newOrderForm.customerName,
      customername: newOrderForm.customerName,
      phone: newOrderForm.phone,
      brand: newOrderForm.brand,
      model: newOrderForm.model,
      color: newOrderForm.color,
      serialNumber: newOrderForm.serialNumber,
      serial_number: newOrderForm.serialNumber,
      serialnumber: newOrderForm.serialNumber,
      problem: newOrderForm.problem,
      quotePrice: newOrderForm.quotePrice,
      quote_price: newOrderForm.quotePrice,
      quoteprice: newOrderForm.quotePrice,
      repairFee: 0,
      repair_fee: 0,
      repairfee: 0,
      deposit: newOrderForm.deposit,
      inspectionFee: 0,
      inspection_fee: 0,
      inspectionfee: 0,
      status: '檢測中',
      password: newOrderForm.password,
    };

    const { error } = await supabase.from('repair_orders').insert([payload]);
    
    if (error) {
      alert(`新增失敗原因: ${error.message} (代碼: ${error.code})`);
      return;
    }

    fetchOrders();
    setIsAddOrderModalOpen(false);
    setNewOrderForm({
      customerName: '',
      phone: '',
      brand: '',
      model: '',
      color: '',
      serialNumber: '',
      problem: '',
      quotePrice: 0,
      deposit: 0,
      password: '',
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">維修與庫存管理</h1>
          <p className="text-xs text-slate-400 mt-1">管理客戶維修單、零件庫存及配合廠商</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg transition ${activeTab === 'orders' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            維修單列表 ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('parts')}
            className={`px-4 py-2 rounded-lg transition ${activeTab === 'parts' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            零件庫存 ({parts.length})
          </button>
          <button
            onClick={() => setActiveTab('vendors')}
            className={`px-4 py-2 rounded-lg transition ${activeTab === 'vendors' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            廠商管理 ({vendors.length})
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center gap-4">
        <input
          type="text"
          placeholder={activeTab === 'parts' ? "搜尋零件名稱或編號..." : "搜尋客戶、電話或維修單號..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-sm border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 transition"
        />
        {activeTab === 'orders' && (
          <button
            onClick={() => setIsAddOrderModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-sm"
          >
            + 新增維修單
          </button>
        )}
        {activeTab === 'parts' && (
          <button
            onClick={() => setIsAddPartModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-sm"
          >
            + 新增零件
          </button>
        )}
        {activeTab === 'vendors' && (
          <button
            onClick={() => setIsAddVendorModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-sm"
          >
            + 新增廠商
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {activeTab === 'orders' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-400 font-medium">
                  <th className="p-4">維修單號</th>
                  <th className="p-4">客戶 / 電話</th>
                  <th className="p-4">品牌機型</th>
                  <th className="p-4">問題描述</th>
                  <th className="p-4">狀態</th>
                  <th className="p-4 text-right">報價金額</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">目前沒有維修單資料</td>
                  </tr>
                ) : (
                  orders
                    .filter(order => 
                      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      order.phone?.includes(searchTerm) ||
                      order.id?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((order) => (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className="hover:bg-slate-50/80 cursor-pointer transition"
                      >
                        <td className="p-4 font-mono font-bold text-blue-600">{order.id}</td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-800">{order.customerName}</div>
                          <div className="text-slate-400 font-mono text-[11px]">{order.phone}</div>
                        </td>
                        <td className="p-4 font-medium">{order.brand} {order.model}</td>
                        <td className="p-4 max-w-xs truncate text-slate-500">{order.problem}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg font-semibold text-[11px]">
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono font-semibold">${order.quotePrice}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'parts' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-400 font-medium">
                  <th className="p-4">零件編號</th>
                  <th className="p-4">零件名稱</th>
                  <th className="p-4">分類</th>
                  <th className="p-4">適用機型</th>
                  <th className="p-4 text-center">庫存數量</th>
                  <th className="p-4 text-right">成本價</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {parts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">目前沒有零件庫存資料</td>
                  </tr>
                ) : (
                  parts
                    .filter(part =>
                      part.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      part.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      part.applicableModel?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((part) => (
                      <tr
                        key={part.id}
                        onClick={() => setSelectedPart(part)}
                        className="hover:bg-slate-50/80 cursor-pointer transition"
                      >
                        <td className="p-4 font-mono font-bold text-slate-600">{part.id}</td>
                        <td className="p-4 font-semibold text-slate-800">{part.name}</td>
                        <td className="p-4 text-slate-500">{part.category || '—'}</td>
                        <td className="p-4 text-slate-500">{part.applicableModel || '—'}</td>
                        <td className="p-4 text-center font-mono font-bold">{part.stockQuantity}</td>
                        <td className="p-4 text-right font-mono">${part.actualCost}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'vendors' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-400 font-medium">
                  <th className="p-4">廠商名稱</th>
                  <th className="p-4">聯絡人</th>
                  <th className="p-4">行動電話</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-semibold text-slate-800">{vendor.name}</td>
                    <td className="p-4 text-slate-600">{vendor.contactPerson || '—'}</td>
                    <td className="p-4 font-mono text-slate-600">{vendor.mobile || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 新增維修單 Modal */}
      {isAddOrderModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800">新增維修單</h2>
              <button onClick={() => setIsAddOrderModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg transition">✕</button>
            </div>
            <form onSubmit={handleCreateOrder} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-medium mb-1.5 block">客戶姓名 <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newOrderForm.customerName}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, customerName: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium mb-1.5 block">聯絡電話 <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newOrderForm.phone}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, phone: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-500 font-mono transition"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-medium mb-1.5 block">品牌 <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newOrderForm.brand}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, brand: e.target.value })}
                    placeholder="Apple / Samsung"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium mb-1.5 block">型號 <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newOrderForm.model}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, model: e.target.value })}
                    placeholder="iPhone 15 Pro"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-medium mb-1.5 block">顏色</label>
                  <input
                    type="text"
                    value={newOrderForm.color}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, color: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium mb-1.5 block">序號 / IMEI</label>
                  <input
                    type="text"
                    value={newOrderForm.serialNumber}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, serialNumber: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-500 font-mono transition"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-700 font-medium mb-1.5 block">問題描述 <span className="text-rose-500">*</span></label>
                <textarea
                  required
                  rows={3}
                  value={newOrderForm.problem}
                  onChange={(e) => setNewOrderForm({ ...newOrderForm, problem: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-medium mb-1.5 block">預估報價</label>
                  <input
                    type="number"
                    value={newOrderForm.quotePrice || ''}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, quotePrice: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-500 font-mono transition"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium mb-1.5 block">已收訂金</label>
                  <input
                    type="number"
                    value={newOrderForm.deposit || ''}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, deposit: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-500 font-mono transition"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-700 font-medium mb-1.5 block">解鎖密碼</label>
                <input
                  type="text"
                  value={newOrderForm.password}
                  onChange={(e) => setNewOrderForm({ ...newOrderForm, password: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-500 font-mono transition"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setIsAddOrderModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition shadow-sm"
                >
                  確認建立
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 新增零件 Modal */}
      {isAddPartModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800">新增零件品項</h2>
              <button onClick={() => setIsAddPartModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg transition">✕</button>
            </div>
            <form onSubmit={handleCreatePart} className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-medium mb-1.5 block">零件編號 (留空自動產生)</label>
                <input
                  type="text"
                  value={newPartForm.id}
                  onChange={(e) => setNewPartForm({ ...newPartForm, id: e.target.value })}
                  placeholder="例如：P15P-SCR"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-500 font-mono transition"
                />
              </div>
              <div>
                <label className="text-slate-700 font-medium mb-1.5 block">零件名稱 <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={newPartForm.name}
                  onChange={(e) => setNewPartForm({ ...newPartForm, name: e.target.value })}
                  placeholder="iPhone 15 Pro OLED 螢幕"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-medium mb-1.5 block">分類</label>
                  <input
                    type="text"
                    value={newPartForm.category}
                    onChange={(e) => setNewPartForm({ ...newPartForm, category: e.target.value })}
                    placeholder="螢幕總成"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium mb-1.5 block">適用機型</label>
                  <input
                    type="text"
                    value={newPartForm.applicableModel}
                    onChange={(e) => setNewPartForm({ ...newPartForm, applicableModel: e.target.value })}
                    placeholder="iPhone 15 Pro"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-medium mb-1.5 block">初始庫存數量</label>
                  <input
                    type="number"
                    value={newPartForm.stockQuantity || ''}
                    onChange={(e) => setNewPartForm({ ...newPartForm, stockQuantity: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-500 font-mono transition"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium mb-1.5 block">預設成本</label>
                  <input
                    type="number"
                    value={newPartForm.actualCost || ''}
                    onChange={(e) => setNewPartForm({ ...newPartForm, actualCost: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-500 font-mono transition"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setIsAddPartModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition shadow-sm"
                >
                  確認新增
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 新增廠商 Modal */}
      {isAddVendorModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800">新增廠商</h2>
              <button onClick={() => setIsAddVendorModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg transition">✕</button>
            </div>
            <form onSubmit={handleCreateVendor} className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-medium mb-1.5 block">廠商名稱 <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={newVendorForm.name}
                  onChange={(e) => setNewVendorForm({ ...newVendorForm, name: e.target.value })}
                  placeholder="華訊零件批發"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-medium mb-1.5 block">聯絡人</label>
                  <input
                    type="text"
                    value={newVendorForm.contactPerson}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, contactPerson: e.target.value })}
                    placeholder="陳先生"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium mb-1.5 block">行動電話</label>
                  <input
                    type="text"
                    value={newVendorForm.mobile}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, mobile: e.target.value })}
                    placeholder="0911..."
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-500 font-mono transition"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setIsAddVendorModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition shadow-sm"
                >
                  確認新增
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 維修單詳情 Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100 bg-slate-50/50">
              <div>
                <span className="font-mono font-bold text-blue-600 text-sm">{selectedOrder.id}</span>
                <h2 className="text-xs text-slate-400 mt-0.5">建立時間：{new Date(selectedOrder.created_at || Date.now()).toLocaleString()}</h2>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 text-lg transition">✕</button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 block mb-0.5">客戶姓名</span>
                  <span className="font-semibold text-slate-800 text-sm">{selectedOrder.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">聯絡電話</span>
                  <span className="font-mono font-semibold text-slate-800 text-sm">{selectedOrder.phone}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-slate-400 block mb-0.5">品牌 / 型號</span>
                  <span className="font-semibold text-slate-800">{selectedOrder.brand} {selectedOrder.model}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">顏色 / 序號</span>
                  <span className="text-slate-700">{selectedOrder.color || '—'} / <span className="font-mono">{selectedOrder.serialNumber || '—'}</span></span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">目前狀態</span>
                  <span className="font-bold text-blue-600">{selectedOrder.status}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">問題描述</span>
                <div className="bg-slate-50 p-3 rounded-xl text-slate-700 whitespace-pre-wrap">{selectedOrder.problem}</div>
              </div>

              <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">預估報價</span>
                  <span className="text-slate-800 font-bold">${selectedOrder.quotePrice}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">維修費</span>
                  <span className="text-slate-800 font-bold">${selectedOrder.repairFee}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">已收訂金</span>
                  <span className="text-emerald-600 font-bold">${selectedOrder.deposit}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">檢測費</span>
                  <span className="text-slate-800 font-bold">${selectedOrder.inspectionFee}</span>
                </div>
              </div>

              {selectedOrder.password && (
                <div>
                  <span className="text-slate-400 block mb-1">解鎖密碼</span>
                  <div className="bg-amber-50 text-amber-800 px-3 py-2 rounded-xl font-mono">{selectedOrder.password}</div>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
              <button
                onClick={() => handleDeleteOrder(selectedOrder.id)}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-semibold transition"
              >
                刪除此單
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700 transition"
              >
                關閉視窗
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新增：零件詳細資料與刪除 Modal */}
      {selectedPart && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col">
            <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100 bg-slate-50/50">
              <span className="font-mono font-bold text-slate-700 text-sm">{selectedPart.id}</span>
              <button onClick={() => setSelectedPart(null)} className="text-slate-400 hover:text-slate-600 text-lg transition">✕</button>
            </div>
            
            <div className="p-6 space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">零件名稱</span>
                <span className="font-semibold text-slate-800 text-sm">{selectedPart.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block mb-0.5">分類</span>
                  <span className="text-slate-700">{selectedPart.category || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">適用機型</span>
                  <span className="text-slate-700">{selectedPart.applicableModel || '—'}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">庫存數量</span>
                  <span className="text-slate-800 font-bold text-sm">{selectedPart.stockQuantity}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">成本價</span>
                  <span className="text-slate-800 font-bold text-sm">${selectedPart.actualCost}</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
              <button
                onClick={() => handleDeletePart(selectedPart.id)}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-semibold transition"
              >
                刪除此零件
              </button>
              <button
                onClick={() => setSelectedPart(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700 transition"
              >
                關閉視窗
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}