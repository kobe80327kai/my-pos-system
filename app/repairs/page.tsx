'use client';

import React, { useState, useEffect } from 'react';

interface RepairRecord {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  brand: string;
  model: string;
  color: string;
  imei: string;
  problem: string;
  price: number;
  repairFee: number;
  deposit: number;
  checkFee: number;
  status: string;
  date: string;
  isOutsourced: boolean;
  outsourcer?: string;
  outsourcerPrice?: number;
  remark?: string;
  password?: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface PartItem {
  id: string;
  partNo: string;
  name: string;
  category: string;
  model: string;
  stock: number;
  cost: number;
}

interface PurchaseRecord {
  id: string;
  orderNo: string;
  date: string;
  vendor: string;
  remark: string;
  itemCount: number;
  itemsName?: string;
  cost?: number;
}

interface VendorItem {
  id: string;
  vendorNo: string;
  name: string;
  contact?: string;
  phone?: string;
  tel?: string;
  address?: string;
  remark?: string;
}

export default function RepairManagementPage() {
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [activeTab, setActiveTab] = useState<'repairs' | 'parts' | 'purchases' | 'vendors'>('purchases');

  // 客戶資料同步
  const [customers, setCustomers] = useState<Customer[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const keys = ['pos_customers_v3', 'pos_customers', 'customers', 'crm_customers'];
        for (const key of keys) {
          const saved = localStorage.getItem(key);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          }
        }
      } catch (e) { console.error(e); }
    }
    return [
      { id: 'CST00001', name: 'JOY秀菁', phone: '0956-096936' },
      { id: 'CST00002', name: '陳清政', phone: '0980-201060' },
      { id: 'CST00003', name: '阿婷友', phone: '0924017866' },
      { id: 'CST00004', name: '陸萱', phone: '0982049589' }
    ];
  });

  // 維修單列表
  const [repairs, setRepairs] = useState<RepairRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('pos_repair_records_v3');
        if (saved) return JSON.parse(saved);
      } catch (e) { console.error(e); }
    }
    return [
      {
        id: 'r1',
        orderNo: 'RO260720001',
        customerName: 'JOY秀菁',
        customerPhone: '0956-096936',
        brand: 'Apple',
        model: '15',
        color: '黑色',
        imei: '',
        problem: '00',
        price: 0,
        repairFee: 0,
        deposit: 0,
        checkFee: 0,
        status: '已收件',
        date: '2026-07-20',
        isOutsourced: false
      }
    ];
  });

  // 零件庫存列表
  const [parts, setParts] = useState<PartItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('pos_parts_inventory_v3');
        if (saved) return JSON.parse(saved);
      } catch (e) { console.error(e); }
    }
    return [
      {
        id: 'p1',
        partNo: '1',
        name: '1',
        category: '1',
        model: '1',
        stock: 0,
        cost: 0
      }
    ];
  });

  // 進貨紀錄列表
  const [purchases, setPurchases] = useState<PurchaseRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('pos_purchases_records_v3');
        if (saved) return JSON.parse(saved);
      } catch (e) { console.error(e); }
    }
    return [
      { id: 'pu1', orderNo: 'RP260715002', date: '2026-07-15', vendor: 'THEONE', remark: '—', itemCount: 1 },
      { id: 'pu2', orderNo: 'RP260715001', date: '2026-07-15', vendor: 'THEONE', remark: '—', itemCount: 1 },
      { id: 'pu3', orderNo: 'RP260714001', date: '2026-07-14', vendor: '—', remark: '—', itemCount: 1 }
    ];
  });

  // 維修廠商列表
  const [vendors, setVendors] = useState<VendorItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('pos_vendors_v3');
        if (saved) return JSON.parse(saved);
      } catch (e) { console.error(e); }
    }
    return [
      { id: 'v1', vendorNo: 'THEONE', name: 'THEONE', contact: '—', phone: '—', tel: '—', address: '—', remark: '—' }
    ];
  });

  // 自動同步外部客戶資料
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof window !== 'undefined') {
        const keys = ['pos_customers_v3', 'pos_customers', 'customers', 'crm_customers'];
        for (const key of keys) {
          const saved = localStorage.getItem(key);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setCustomers(parsed);
                break;
              }
            } catch (e) { console.error(e); }
          }
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_repair_records_v3', JSON.stringify(repairs));
    }
  }, [repairs]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_parts_inventory_v3', JSON.stringify(parts));
    }
  }, [parts]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_purchases_records_v3', JSON.stringify(purchases));
    }
  }, [purchases]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_vendors_v3', JSON.stringify(vendors));
    }
  }, [vendors]);

  // 搜尋與狀態
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('全部狀態');
  const [showTrash, setShowTrash] = useState(false);

  // 零件相關
  const [partSearchKeyword, setPartSearchKeyword] = useState('');
  const [isAddPartModalOpen, setIsAddPartModalOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<PartItem | null>(null);

  const [newPartNo, setNewPartNo] = useState('');
  const [newPartName, setNewPartName] = useState('');
  const [newPartCategory, setNewPartCategory] = useState('');
  const [newPartModel, setNewPartModel] = useState('');
  const [newPartStock, setNewPartStock] = useState<number>(0);
  const [newPartCost, setNewPartCost] = useState<number>(0);

  // 廠商相關 Modal 狀態
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);
  const [isEditVendorModalOpen, setIsEditVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorItem | null>(null);

  const [vendorNoInput, setVendorNoInput] = useState('');
  const [vendorNameInput, setVendorNameInput] = useState('');
  const [vendorContactInput, setVendorContactInput] = useState('');
  const [vendorPhoneInput, setVendorPhoneInput] = useState('');
  const [vendorTelInput, setVendorTelInput] = useState('');
  const [vendorAddressInput, setVendorAddressInput] = useState('');
  const [vendorRemarkInput, setVendorRemarkInput] = useState('');

  // 進貨紀錄檢視明細 Modal
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseRecord | null>(null);

  // 新增維修單 Modal 狀態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'general' | 'outsource'>('general');

  const [custInput, setCustInput] = useState('');
  const [isCustDropdownOpen, setIsCustDropdownOpen] = useState(false);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [imei, setImei] = useState('');
  const [problem, setProblem] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [repairFee, setRepairFee] = useState<number>(0);
  const [deposit, setDeposit] = useState<number>(0);
  const [checkFee, setCheckFee] = useState<number>(0);
  const [outsourcer, setOutsourcer] = useState('');
  const [outsourcerPrice, setOutsourcerPrice] = useState<number>(0);
  const [remark, setRemark] = useState('');
  const [password, setPassword] = useState('');

  const [isCustModalOpen, setIsCustModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  const handleCreateCustomer = () => {
    if (!newCustName || !newCustPhone) {
      alert('請填寫客戶姓名與電話');
      return;
    }
    const newId = `CST${String(customers.length + 1).padStart(5, '0')}`;
    const newC: Customer = { id: newId, name: newCustName, phone: newCustPhone };
    const updated = [newC, ...customers];
    setCustomers(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_customers_v3', JSON.stringify(updated));
    }
    setCustInput(`${newC.name} (${newC.phone})`);
    setNewCustName('');
    setNewCustPhone('');
    setIsCustModalOpen(false);
    setIsCustDropdownOpen(false);
  };

  const handleSaveRepair = () => {
    if (!custInput) {
      alert('請選擇或輸入客戶');
      return;
    }
    if (!model) {
      alert('請填寫機型');
      return;
    }
    if (!problem) {
      alert('請填寫問題描述');
      return;
    }

    const namePart = custInput.split(' ')[0];
    const phonePart = custInput.includes('(') ? custInput.split('(')[1].replace(')', '') : '';
    const randomNo = Math.floor(10000 + Math.random() * 90000);
    const orderNo = `RO${getTodayStr().replace(/-/g, '').slice(2)}${String(randomNo).slice(-5)}`;

    const newRecord: RepairRecord = {
      id: `r-${Date.now()}`,
      orderNo,
      customerName: namePart,
      customerPhone: phonePart,
      brand,
      model,
      color,
      imei,
      problem,
      price: modalMode === 'general' ? (Number(price) || 0) : (Number(repairFee) || 0),
      repairFee: Number(repairFee) || 0,
      deposit: Number(deposit) || 0,
      checkFee: Number(checkFee) || 0,
      status: '已收件',
      date: getTodayStr(),
      isOutsourced: modalMode === 'outsource',
      outsourcer: modalMode === 'outsource' ? outsourcer : undefined,
      outsourcerPrice: modalMode === 'outsource' ? (Number(outsourcerPrice) || 0) : undefined,
      remark,
      password
    };

    setRepairs([newRecord, ...repairs]);
    alert(`成功新增維修單：${orderNo}`);
    setIsModalOpen(false);
    setCustInput('');
    setBrand('');
    setModel('');
    setColor('');
    setImei('');
    setProblem('');
    setPrice(0);
    setRepairFee(0);
    setDeposit(0);
    setCheckFee(0);
    setOutsourcer('');
    setOutsourcerPrice(0);
    setRemark('');
    setPassword('');
  };

  const handleSavePart = () => {
    if (!newPartName) {
      alert('請填寫零件名稱');
      return;
    }
    const partNoToUse = newPartNo.trim() ? newPartNo.trim() : `P${Math.floor(1000 + Math.random() * 9000)}`;
    const newPart: PartItem = {
      id: `part-${Date.now()}`,
      partNo: partNoToUse,
      name: newPartName,
      category: newPartCategory || '未分類',
      model: newPartModel || '通用',
      stock: Number(newPartStock) || 0,
      cost: Number(newPartCost) || 0
    };

    setParts([newPart, ...parts]);

    const randomNo = Math.floor(10000 + Math.random() * 90000);
    const purchaseOrderNo = `RP${getTodayStr().replace(/-/g, '').slice(2)}${String(randomNo).slice(-5)}`;
    const newPurchase: PurchaseRecord = {
      id: `pu-${Date.now()}`,
      orderNo: purchaseOrderNo,
      date: getTodayStr(),
      vendor: '—',
      remark: `新增零件：${newPart.name}`,
      itemCount: 1,
      itemsName: newPart.name,
      cost: newPart.cost
    };
    setPurchases([newPurchase, ...purchases]);

    alert(`成功新增零件與進貨紀錄：${purchaseOrderNo}`);
    setIsAddPartModalOpen(false);
    setNewPartNo('');
    setNewPartName('');
    setNewPartCategory('');
    setNewPartModel('');
    setNewPartStock(0);
    setNewPartCost(0);
  };

  const handleDeletePart = (id: string) => {
    if (confirm('確定要刪除此零件嗎？')) {
      setParts(parts.filter(p => p.id !== id));
      setSelectedPart(null);
    }
  };

  const handleDeletePurchase = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('確定要刪除此進貨紀錄嗎？')) {
      setPurchases(purchases.filter(p => p.id !== id));
      if (selectedPurchase?.id === id) setSelectedPurchase(null);
    }
  };

  // 廠商相關處理函式
  const handleCreateVendor = () => {
    if (!vendorNameInput.trim()) {
      alert('請填寫廠商名稱');
      return;
    }
    const finalVendorNo = vendorNoInput.trim() || vendorNameInput.trim();
    const newVendor: VendorItem = {
      id: `v-${Date.now()}`,
      vendorNo: finalVendorNo,
      name: vendorNameInput.trim(),
      contact: vendorContactInput.trim() || '—',
      phone: vendorPhoneInput.trim() || '—',
      tel: vendorTelInput.trim() || '—',
      address: vendorAddressInput.trim() || '—',
      remark: vendorRemarkInput.trim() || '—'
    };
    setVendors([newVendor, ...vendors]);
    setIsAddVendorModalOpen(false);
    setVendorNoInput('');
    setVendorNameInput('');
    setVendorContactInput('');
    setVendorPhoneInput('');
    setVendorTelInput('');
    setVendorAddressInput('');
    setVendorRemarkInput('');
  };

  const handleUpdateVendor = () => {
    if (!editingVendor || !vendorNameInput.trim()) {
      alert('請填寫廠商名稱');
      return;
    }
    const finalVendorNo = vendorNoInput.trim() || vendorNameInput.trim();
    const updatedVendors = vendors.map(v => {
      if (v.id === editingVendor.id) {
        return {
          ...v,
          vendorNo: finalVendorNo,
          name: vendorNameInput.trim(),
          contact: vendorContactInput.trim() || '—',
          phone: vendorPhoneInput.trim() || '—',
          tel: vendorTelInput.trim() || '—',
          address: vendorAddressInput.trim() || '—',
          remark: vendorRemarkInput.trim() || '—'
        };
      }
      return v;
    });
    setVendors(updatedVendors);
    setIsEditVendorModalOpen(false);
    setEditingVendor(null);
  };

  const handleDeleteVendor = (id: string) => {
    if (confirm('確定要刪除此維修廠商嗎？')) {
      setVendors(vendors.filter(v => v.id !== id));
    }
  };

  const openEditVendorModal = (v: VendorItem) => {
    setEditingVendor(v);
    setVendorNoInput(v.vendorNo);
    setVendorNameInput(v.name);
    setVendorContactInput(v.contact === '—' ? '' : (v.contact || ''));
    setVendorPhoneInput(v.phone === '—' ? '' : (v.phone || ''));
    setVendorTelInput(v.tel === '—' ? '' : (v.tel || ''));
    setVendorAddressInput(v.address === '—' ? '' : (v.address || ''));
    setVendorRemarkInput(v.remark === '—' ? '' : (v.remark || ''));
    setIsEditVendorModalOpen(true);
  };

  const filteredRepairs = repairs.filter(r => {
    const matchKeyword = !searchKeyword || 
      r.orderNo.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      r.model.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      r.problem.toLowerCase().includes(searchKeyword.toLowerCase());
    const matchStatus = statusFilter === '全部狀態' || r.status === statusFilter;
    return matchKeyword && matchStatus;
  });

  const filteredParts = parts.filter(p => {
    const kw = partSearchKeyword.trim().toLowerCase();
    return !kw || p.name.toLowerCase().includes(kw) || p.partNo.toLowerCase().includes(kw) || p.model.toLowerCase().includes(kw);
  });

  return (
    <div className="flex-1 bg-slate-100 p-8 space-y-6 overflow-y-auto font-sans text-slate-800 min-h-screen">
      {/* 頂部標題與按鈕 */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-800">維修管理</h1>
        {activeTab === 'repairs' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
          >
            + 新增維修單
          </button>
        )}
        {activeTab === 'parts' && (
          <button
            onClick={() => setIsAddPartModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
          >
            + 新增零件
          </button>
        )}
        {activeTab === 'vendors' && (
          <button
            onClick={() => {
              setVendorNoInput('');
              setVendorNameInput('');
              setVendorContactInput('');
              setVendorPhoneInput('');
              setVendorTelInput('');
              setVendorAddressInput('');
              setVendorRemarkInput('');
              setIsAddVendorModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
          >
            + 新增廠商
          </button>
        )}
      </div>

      {/* 子頁籤導覽列 (已移除維修零件建檔) */}
      <div className="flex gap-6 border-b border-slate-200 text-xs font-bold text-slate-500 pb-3">
        <button onClick={() => setActiveTab('repairs')} className={`pb-1 transition ${activeTab === 'repairs' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-slate-700'}`}>維修單</button>
        <button onClick={() => setActiveTab('parts')} className={`pb-1 transition ${activeTab === 'parts' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-slate-700'}`}>零件庫存</button>
        <button onClick={() => setActiveTab('purchases')} className={`pb-1 transition ${activeTab === 'purchases' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-slate-700'}`}>進貨紀錄</button>
        <button onClick={() => setActiveTab('vendors')} className={`pb-1 transition ${activeTab === 'vendors' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-slate-700'}`}>維修廠商</button>
      </div>

      {/* 維修單頁籤 */}
      {activeTab === 'repairs' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[280px]">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜尋客戶/機型/單號..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
            >
              <option value="全部狀態">全部狀態</option>
              <option value="已收件">已收件</option>
              <option value="已取件">已取件</option>
            </select>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showTrash}
                onChange={(e) => setShowTrash(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              顯示作廢
            </label>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold bg-slate-50/50">
                    <th className="p-4">單號</th>
                    <th className="p-4">客戶</th>
                    <th className="p-4">機型</th>
                    <th className="p-4">問題</th>
                    <th className="p-4">報價</th>
                    <th className="p-4">狀態</th>
                    <th className="p-4">收件日</th>
                    <th className="p-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRepairs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400">目前沒有符合條件的維修單</td>
                    </tr>
                  ) : (
                    filteredRepairs.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4 font-mono font-bold text-slate-800">
                          <div>{r.orderNo}</div>
                          {r.isOutsourced && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded text-[9px] font-bold">
                              🔗 委外
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-slate-800">{r.customerName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{r.customerPhone}</p>
                        </td>
                        <td className="p-4 font-medium text-slate-700">{r.model}</td>
                        <td className="p-4 font-medium text-slate-700">{r.problem}</td>
                        <td className="p-4 font-mono font-bold text-slate-800">${r.price}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                            {r.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 font-mono">{r.date}</td>
                        <td className="p-4 text-right text-slate-300">›</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 零件庫存頁籤 */}
      {activeTab === 'parts' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60">
            <input
              type="text"
              value={partSearchKeyword}
              onChange={(e) => setPartSearchKeyword(e.target.value)}
              placeholder="搜尋零件名稱或編號..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs"
            />
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold bg-slate-50/50">
                    <th className="p-4">零件編號</th>
                    <th className="p-4">零件名稱</th>
                    <th className="p-4">分類</th>
                    <th className="p-4">適用機型</th>
                    <th className="p-4">庫存數量</th>
                    <th className="p-4 text-right">成本價</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredParts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">目前沒有符合的零件庫存</td>
                    </tr>
                  ) : (
                    filteredParts.map((p) => (
                      <tr 
                        key={p.id} 
                        onClick={() => setSelectedPart(p)}
                        className="hover:bg-blue-50/40 transition cursor-pointer"
                      >
                        <td className="p-4 font-mono font-bold text-slate-800">{p.partNo}</td>
                        <td className="p-4 font-bold text-slate-800">{p.name}</td>
                        <td className="p-4 text-slate-600">{p.category}</td>
                        <td className="p-4 text-slate-600">{p.model}</td>
                        <td className="p-4 font-mono font-bold text-slate-800">{p.stock}</td>
                        <td className="p-4 text-right font-mono font-bold text-slate-800">${p.cost}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 進貨紀錄頁籤 */}
      {activeTab === 'purchases' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold bg-slate-50/50">
                    <th className="p-4">單號</th>
                    <th className="p-4">日期</th>
                    <th className="p-4">廠商</th>
                    <th className="p-4">備註</th>
                    <th className="p-4">品項數</th>
                    <th className="p-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchases.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">目前沒有進貨紀錄</td>
                    </tr>
                  ) : (
                    purchases.map((pu) => (
                      <tr 
                        key={pu.id}
                        onClick={() => setSelectedPurchase(pu)}
                        className="hover:bg-slate-50/50 transition cursor-pointer"
                      >
                        <td className="p-4 font-mono font-bold text-blue-600">{pu.orderNo}</td>
                        <td className="p-4 text-slate-600 font-mono">{pu.date}</td>
                        <td className="p-4 font-medium text-slate-800">{pu.vendor}</td>
                        <td className="p-4 text-slate-500">{pu.remark}</td>
                        <td className="p-4 font-mono font-bold text-slate-800">{pu.itemCount}</td>
                        <td className="p-4 text-right flex items-center justify-end gap-3">
                          <button
                            onClick={(e) => handleDeletePurchase(pu.id, e)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                            title="刪除"
                          >
                            🗑️
                          </button>
                          <span className="text-slate-300">›</span>
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

      {/* 維修廠商頁籤 */}
      {activeTab === 'vendors' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold bg-slate-50/50">
                    <th className="p-4">廠商編號</th>
                    <th className="p-4">廠商名稱</th>
                    <th className="p-4">聯絡人</th>
                    <th className="p-4">手機</th>
                    <th className="p-4">電話</th>
                    <th className="p-4">地址</th>
                    <th className="p-4">備註</th>
                    <th className="p-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendors.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400">目前沒有維修廠商資料</td>
                    </tr>
                  ) : (
                    vendors.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4 font-mono font-bold text-slate-800">{v.vendorNo}</td>
                        <td className="p-4 font-bold text-slate-800">{v.name}</td>
                        <td className="p-4 text-slate-600">{v.contact}</td>
                        <td className="p-4 text-slate-600 font-mono">{v.phone}</td>
                        <td className="p-4 text-slate-600 font-mono">{v.tel}</td>
                        <td className="p-4 text-slate-600">{v.address}</td>
                        <td className="p-4 text-slate-500">{v.remark}</td>
                        <td className="p-4 text-right space-x-3">
                          <button
                            onClick={() => openEditVendorModal(v)}
                            className="text-blue-600 hover:text-blue-800 font-bold"
                          >
                            編輯
                          </button>
                          <button
                            onClick={() => handleDeleteVendor(v.id)}
                            className="text-rose-500 hover:text-rose-700 font-bold"
                          >
                            刪除
                          </button>
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

      {/* 新增維修廠商彈出視窗 */}
      {isAddVendorModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-800">新增維修廠商</h3>
              <button onClick={() => setIsAddVendorModalOpen(false)} className="text-slate-400 hover:text-rose-600 text-base">×</button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">廠商編號</label>
                <input
                  type="text"
                  value={vendorNoInput}
                  onChange={(e) => setVendorNoInput(e.target.value)}
                  placeholder="選填"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">廠商名稱 *</label>
                <input
                  type="text"
                  value={vendorNameInput}
                  onChange={(e) => setVendorNameInput(e.target.value)}
                  placeholder="請輸入廠商名稱"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">聯絡人</label>
                <input
                  type="text"
                  value={vendorContactInput}
                  onChange={(e) => setVendorContactInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">手機</label>
                <input
                  type="text"
                  value={vendorPhoneInput}
                  onChange={(e) => setVendorPhoneInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">電話</label>
                <input
                  type="text"
                  value={vendorTelInput}
                  onChange={(e) => setVendorTelInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">地址</label>
                <input
                  type="text"
                  value={vendorAddressInput}
                  onChange={(e) => setVendorAddressInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
              <div className="col-span-2">
                <label className="text-slate-400 block mb-1">備註</label>
                <textarea
                  value={vendorRemarkInput}
                  onChange={(e) => setVendorRemarkInput(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsAddVendorModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition"
              >
                取消
              </button>
              <button
                onClick={handleCreateVendor}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                新增
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 編輯維修廠商彈出視窗 */}
      {isEditVendorModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-800">編輯維修廠商</h3>
              <button onClick={() => setIsEditVendorModalOpen(false)} className="text-slate-400 hover:text-rose-600 text-base">×</button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">廠商編號</label>
                <input
                  type="text"
                  value={vendorNoInput}
                  onChange={(e) => setVendorNoInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">廠商名稱 *</label>
                <input
                  type="text"
                  value={vendorNameInput}
                  onChange={(e) => setVendorNameInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">聯絡人</label>
                <input
                  type="text"
                  value={vendorContactInput}
                  onChange={(e) => setVendorContactInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">手機</label>
                <input
                  type="text"
                  value={vendorPhoneInput}
                  onChange={(e) => setVendorPhoneInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">電話</label>
                <input
                  type="text"
                  value={vendorTelInput}
                  onChange={(e) => setVendorTelInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">地址</label>
                <input
                  type="text"
                  value={vendorAddressInput}
                  onChange={(e) => setVendorAddressInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
              <div className="col-span-2">
                <label className="text-slate-400 block mb-1">備註</label>
                <textarea
                  value={vendorRemarkInput}
                  onChange={(e) => setVendorRemarkInput(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsEditVendorModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition"
              >
                取消
              </button>
              <button
                onClick={handleUpdateVendor}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                儲存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 進貨紀錄明細彈出視窗 */}
      {selectedPurchase && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-800">進貨單明細：{selectedPurchase.orderNo}</h3>
              <button onClick={() => setSelectedPurchase(null)} className="text-slate-400 hover:text-rose-600 text-base">×</button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">進貨日期</span>
                <span className="font-mono font-bold text-slate-800">{selectedPurchase.date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">廠商</span>
                <span className="font-bold text-slate-800">{selectedPurchase.vendor}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">備註說明</span>
                <span className="text-slate-700">{selectedPurchase.remark}</span>
              </div>
              {selectedPurchase.itemsName && (
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">進貨零件名稱</span>
                  <span className="font-bold text-slate-800">{selectedPurchase.itemsName}</span>
                </div>
              )}
              {selectedPurchase.cost !== undefined && (
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">成本價</span>
                  <span className="font-mono font-bold text-slate-800">${selectedPurchase.cost}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-slate-400">品項數</span>
                <span className="font-mono font-bold text-slate-800">{selectedPurchase.itemCount}</span>
              </div>
            </div>
            <div className="flex justify-between pt-2">
              <button
                onClick={(e) => {
                  handleDeletePurchase(selectedPurchase.id, e);
                  setSelectedPurchase(null);
                }}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition"
              >
                刪除此筆紀錄
              </button>
              <button
                onClick={() => setSelectedPurchase(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition"
              >
                關閉視窗
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 零件明細彈出視窗 */}
      {selectedPart && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-xl space-y-6 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-800">{selectedPart.partNo}</h3>
              <button onClick={() => setSelectedPart(null)} className="text-slate-400 hover:text-rose-600 text-base">×</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">零件名稱</label>
                <div className="font-bold text-slate-800 text-sm">{selectedPart.name}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 block mb-1">分類</label>
                  <div className="font-medium text-slate-700">{selectedPart.category}</div>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">適用機型</label>
                  <div className="font-medium text-slate-700">{selectedPart.model}</div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 block mb-1">庫存數量</label>
                  <div className="text-lg font-bold font-mono text-slate-800">{selectedPart.stock}</div>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">成本價</label>
                  <div className="text-lg font-bold font-mono text-slate-800">${selectedPart.cost}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => handleDeletePart(selectedPart.id)}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition"
              >
                刪除此零件
              </button>
              <button
                onClick={() => setSelectedPart(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition"
              >
                關閉視窗
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新增零件彈出視窗 */}
      {isAddPartModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-800">新增零件品項</h3>
              <button onClick={() => setIsAddPartModalOpen(false)} className="text-slate-400 hover:text-rose-600 text-base">×</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">零件編號 (留空自動產生)</label>
                <input
                  type="text"
                  value={newPartNo}
                  onChange={(e) => setNewPartNo(e.target.value)}
                  placeholder="例如：P15P-SCR"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">零件名稱 *</label>
                <input
                  type="text"
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  placeholder="iPhone 15 Pro OLED 螢幕"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">分類</label>
                  <input
                    type="text"
                    value={newPartCategory}
                    onChange={(e) => setNewPartCategory(e.target.value)}
                    placeholder="螢幕總成"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">適用機型</label>
                  <input
                    type="text"
                    value={newPartModel}
                    onChange={(e) => setNewPartModel(e.target.value)}
                    placeholder="iPhone 15 Pro"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">初始庫存數量</label>
                  <input
                    type="number"
                    value={newPartStock}
                    onChange={(e) => setNewPartStock(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">成本價 ($)</label>
                  <input
                    type="number"
                    value={newPartCost}
                    onChange={(e) => setNewPartCost(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setIsAddPartModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition"
              >
                取消
              </button>
              <button
                onClick={handleSavePart}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                確認新增
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
