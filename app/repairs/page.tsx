'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

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
  usedParts?: { id: string; name: string; cost: number }[];
  paymentMethod?: string;
  grossProfit?: number;
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

  const [activeTab, setActiveTab] = useState<'repairs' | 'parts' | 'purchases' | 'vendors'>('repairs');

  // 客戶資料
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    fetchCustomers();
  }, []);

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

    if (typeof window !== 'undefined') {
      try {
        const keys = ['pos_customers_v3', 'pos_customers', 'customers', 'crm_customers'];
        for (const key of keys) {
          const saved = localStorage.getItem(key);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setCustomers(parsed);
              break;
            }
          }
        }
      } catch (e) {}
    }
  };

  // 維修單列表
  const [repairs, setRepairs] = useState<RepairRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('pos_repair_records_v3');
        if (saved) return JSON.parse(saved);
      } catch (e) { console.error(e); }
    }
    return [];
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
      { id: 'p1', partNo: 'P001', name: '紅米13C電池', category: '電池', model: '紅米13C', stock: 0, cost: 230 },
      { id: 'p2', partNo: 'P002', name: 'I15電池', category: '電池', model: 'iPhone 15', stock: 0, cost: 450 },
      { id: 'p3', partNo: 'P003', name: '紅米NOTE12電池', category: '電池', model: '紅米NOTE12', stock: 0, cost: 260 }
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
    return [];
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

  // 維修單詳情與結帳 Modal
  const [selectedRepair, setSelectedRepair] = useState<RepairRecord | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  // 結帳互動狀態
  const [checkoutRepairFee, setCheckoutRepairFee] = useState<number>(0);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<string>('現金');
  const [checkoutRemark, setCheckoutRemark] = useState<string>('');
  const [checkoutSelectedParts, setCheckoutSelectedParts] = useState<{ id: string; name: string; cost: number }[]>([]);

  // 新增維修單 Modal 狀態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'general' | 'outsource'>('general');

  const [custInput, setCustInput] = useState('');
  const [isCustDropdownOpen, setIsCustDropdownOpen] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // 點擊外部自動關閉客戶下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setIsCustDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleCreateCustomer = async () => {
    if (!newCustName || !newCustPhone) {
      alert('請填寫客戶姓名與電話');
      return;
    }
    const newId = `CST${String(customers.length + 1).padStart(5, '0')}`;
    const newC: Customer = { id: newId, name: newCustName, phone: newCustPhone };
    
    try {
      await supabase.from('customers').insert([{ name: newC.name, phone: newC.phone }]);
    } catch (e) {}

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

  // 刪除維修單同時自動刪除對應的 sales_records 銷售紀錄
  const handleDeleteRepair = async (repair: RepairRecord) => {
    if (confirm(`確定要刪除此維修單 (${repair.orderNo}) 嗎？相關銷售紀錄也會一併刪除。`)) {
      try {
        await supabase.from('sales_records').delete().eq('order_no', repair.orderNo);
      } catch (e) {}

      setRepairs(repairs.filter(r => r.id !== repair.id));
      setSelectedRepair(null);
      alert('刪除成功！');
    }
  };

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

  // 結帳確認計算毛利並同步寫入 Supabase sales_records
  const handleConfirmCheckout = async () => {
    if (!selectedRepair) return;
    const totalPartsCost = checkoutSelectedParts.reduce((sum, p) => sum + (p.cost || 0), 0);
    let rev = Number(checkoutRepairFee) || 0;
    if (checkoutPaymentMethod === '刷卡') {
      rev = rev * 0.98; // 扣除2%手續費
    }
    const profit = Math.round(rev - totalPartsCost);

    const nowStr = getTodayStr();
    const salePayload = {
      id: `sr-repair-${Date.now()}`,
      order_no: selectedRepair.orderNo,
      date: nowStr,
      customer_name: selectedRepair.customerName || '個人貴賓',
      customer_type: '個人貴賓',
      salesperson: '管理員',
      store: '總店',
      items: [
        {
          name: `維修服務費 (${selectedRepair.model || '手機'})`,
          imei: selectedRepair.imei || '—',
          cost: 0,
          price: Number(checkoutRepairFee) || 0,
          quantity: 1,
          category: '維修'
        },
        ...checkoutSelectedParts.map(p => ({
          name: `[料件] ${p.name}`,
          imei: '—',
          cost: p.cost || 0,
          price: 0,
          quantity: 1,
          category: '維修'
        }))
      ],
      total_amount: Number(checkoutRepairFee) || 0,
      total_cost: totalPartsCost,
      profit: profit,
      payment_info: checkoutPaymentMethod
    };

    try {
      await supabase.from('sales_records').insert([salePayload]);
    } catch (err: any) {
      console.error('同步寫入 sales_records 失敗:', err.message);
    }

    const updated = repairs.map(r => {
      if (r.id === selectedRepair.id) {
        return {
          ...r,
          status: '已取件',
          repairFee: Number(checkoutRepairFee) || 0,
          price: Number(checkoutRepairFee) || 0,
          usedParts: checkoutSelectedParts,
          paymentMethod: checkoutPaymentMethod,
          grossProfit: profit
        };
      }
      return r;
    });

    setRepairs(updated);
    alert('已成功完成結帳，並同步更新至業績報表與銷售總覽！');
    setIsCheckoutModalOpen(false);
    setSelectedRepair(null);
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
            onClick={() => { fetchCustomers(); setIsModalOpen(true); }}
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

      {/* 子頁籤導覽列 */}
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
                      <tr 
                        key={r.id} 
                        onClick={() => setSelectedRepair(r)}
                        className="hover:bg-blue-50/40 transition cursor-pointer"
                      >
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
                        <td className="p-4 font-mono font-bold text-slate-800">${r.price || r.repairFee}</td>
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

      {/* 新增維修單彈出視窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-xl space-y-4 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-800">新增維修單</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-600 text-base">×</button>
            </div>

            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
              <button
                onClick={() => setModalMode('general')}
                className={`flex-1 py-2 rounded-xl transition ${modalMode === 'general' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                一般維修
              </button>
              <button
                onClick={() => setModalMode('outsource')}
                className={`flex-1 py-2 rounded-xl transition ${modalMode === 'outsource' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                委外維修
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="relative" ref={customerDropdownRef}>
                <label className="text-slate-400 block mb-1">客戶 *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={custInput}
                    onChange={(e) => {
                      setCustInput(e.target.value);
                      setIsCustDropdownOpen(true);
                    }}
                    onFocus={() => { fetchCustomers(); setIsCustDropdownOpen(true); }}
                    placeholder="點擊搜尋客戶姓名或電話..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                  <button
                    onClick={() => setIsCustModalOpen(true)}
                    className="px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-bold transition"
                  >
                    + 快速建立新客戶
                  </button>
                </div>
                {isCustDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-40 overflow-y-auto">
                    {customers.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400">尚無客戶資料，請點擊右側新增</div>
                    ) : (
                      customers
                        .filter(c => c.name.toLowerCase().includes(custInput.toLowerCase()) || c.phone.includes(custInput))
                        .map(c => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setCustInput(`${c.name} (${c.phone})`);
                              setIsCustDropdownOpen(false);
                            }}
                            className="px-3 py-2 hover:bg-slate-50 cursor-pointer flex justify-between"
                          >
                            <span className="font-bold text-slate-800">{c.name}</span>
                            <span className="text-slate-400 font-mono">{c.phone}</span>
                          </div>
                        ))
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">品牌</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Apple / Samsung..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">機型 *</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="iPhone 15"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">顏色</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">序號 / IMEI</label>
                  <input
                    type="text"
                    value={imei}
                    onChange={(e) => setImei(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
              </div>

              {modalMode === 'outsource' && (
                <div>
                  <label className="text-slate-400 block mb-1">委外店家</label>
                  <input
                    type="text"
                    value={outsourcer}
                    onChange={(e) => setOutsourcer(e.target.value)}
                    placeholder="店家名稱或地址"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              )}

              <div>
                <label className="text-slate-400 block mb-1">問題描述 *</label>
                <textarea
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  rows={2}
                  placeholder="描述客戶反映的問題..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                {modalMode === 'general' ? (
                  <div>
                    <label className="text-slate-400 block mb-1">維修報價</label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-slate-400 block mb-1">廠商報價</label>
                    <input
                      type="number"
                      value={outsourcerPrice}
                      onChange={(e) => setOutsourcerPrice(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                    />
                  </div>
                )}
                <div>
                  <label className="text-slate-400 block mb-1">維修費</label>
                  <input
                    type="number"
                    value={repairFee}
                    onChange={(e) => setRepairFee(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">訂金</label>
                  <input
                    type="number"
                    value={deposit}
                    onChange={(e) => setDeposit(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">檢測費</label>
                  <input
                    type="number"
                    value={checkFee}
                    onChange={(e) => setCheckFee(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">備註</label>
                <input
                  type="text"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition"
              >
                取消
              </button>
              <button
                onClick={handleSaveRepair}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                新增
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 快速建立客戶 Modal */}
      {isCustModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2">快速建立新客戶</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">客戶姓名 *</label>
                <input
                  type="text"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">電話 *</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCustModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
              >
                取消
              </button>
              <button
                onClick={handleCreateCustomer}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                確認建立
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 維修單詳細資訊 Modal */}
      {selectedRepair && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-xl space-y-4 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-800">維修單 {selectedRepair.orderNo}</h3>
              <button onClick={() => setSelectedRepair(null)} className="text-slate-400 hover:text-rose-600 text-base">×</button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
              <div>
                <span className="text-slate-400 block">客戶</span>
                <span className="font-bold text-slate-800 text-sm">{selectedRepair.customerName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">電話</span>
                <span className="font-mono font-bold text-slate-800">{selectedRepair.customerPhone}</span>
              </div>
              <div>
                <span className="text-slate-400 block">機型</span>
                <span className="font-bold text-slate-700">{selectedRepair.model}</span>
              </div>
              <div>
                <span className="text-slate-400 block">顏色</span>
                <span className="text-slate-700">{selectedRepair.color || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">序號 / IMEI</span>
                <span className="font-mono text-slate-700">{selectedRepair.imei || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">訂金</span>
                <span className="font-mono font-bold text-slate-800">${selectedRepair.deposit}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block">問題描述</span>
                <span className="text-slate-800 font-medium">{selectedRepair.problem}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center py-2">
              <div className="bg-slate-50 p-3 rounded-2xl">
                <span className="text-[10px] text-slate-400 block">報價</span>
                <span className="text-sm font-bold font-mono text-slate-800">${selectedRepair.price}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl">
                <span className="text-[10px] text-slate-400 block">維修費</span>
                <span className="text-sm font-bold font-mono text-blue-600">${selectedRepair.repairFee}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl">
                <span className="text-[10px] text-slate-400 block">檢測費</span>
                <span className="text-sm font-bold font-mono text-slate-800">${selectedRepair.checkFee}</span>
              </div>
            </div>

            {selectedRepair.usedParts && selectedRepair.usedParts.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 mb-2">已套用零件明細：</h4>
                <div className="space-y-1">
                  {selectedRepair.usedParts.map((up, idx) => (
                    <div key={idx} className="flex justify-between text-xs bg-slate-50 px-3 py-1.5 rounded-xl">
                      <span>{up.name}</span>
                      <span className="font-mono text-slate-500">成本: ${up.cost}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedRepair.grossProfit !== undefined && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl flex justify-between text-xs">
                <span>結帳方式：{selectedRepair.paymentMethod || '現金'}</span>
                <span className="font-bold">預估毛利：${selectedRepair.grossProfit}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t">
              <button
                onClick={() => handleDeleteRepair(selectedRepair)}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                🗑️ 刪除維修單
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedRepair(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition"
                >
                  關閉
                </button>
                {selectedRepair.status !== '已取件' && (
                  <button
                    onClick={() => {
                      setCheckoutRepairFee(selectedRepair.repairFee || selectedRepair.price || 0);
                      setCheckoutPaymentMethod('現金');
                      setCheckoutSelectedParts([]);
                      setIsCheckoutModalOpen(true);
                    }}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1"
                  >
                    🛒 開銷貨單 / 結帳
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 結帳 / 開銷貨單 Modal */}
      {isCheckoutModalOpen && selectedRepair && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-xl space-y-4 animate-in fade-in zoom-in duration-150 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-800">維修取件結帳 — {selectedRepair.orderNo}</h3>
              <button onClick={() => setIsCheckoutModalOpen(false)} className="text-slate-400 hover:text-rose-600 text-base">×</button>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl flex justify-between text-xs text-slate-700">
              <span>客戶：<strong>{selectedRepair.customerName}</strong></span>
              <span>機型：<strong>{selectedRepair.model}</strong></span>
              <span>問題：<strong>{selectedRepair.problem}</strong></span>
            </div>

            {/* 帶入維修零件選擇 */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 block">使用料件（成本追蹤）</label>
              <div className="grid grid-cols-1 gap-2 max-h-36 overflow-y-auto border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
                {parts.map(p => {
                  const isSelected = checkoutSelectedParts.some(item => item.id === p.id);
                  return (
                    <div key={p.id} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100 text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{p.name}</p>
                        <p className="text-[10px] text-slate-400">庫存 {p.stock} · 成本 ${p.cost}</p>
                      </div>
                      <button
                        onClick={() => {
                          if (isSelected) {
                            setCheckoutSelectedParts(checkoutSelectedParts.filter(item => item.id !== p.id));
                          } else {
                            setCheckoutSelectedParts([...checkoutSelectedParts, { id: p.id, name: p.name, cost: p.cost }]);
                          }
                        }}
                        className={`px-3 py-1 rounded-lg font-bold text-xs transition ${isSelected ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                      >
                        {isSelected ? '移除' : '+ 加入'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">維修費 (元) 可調整</label>
                <input
                  type="number"
                  value={checkoutRepairFee}
                  onChange={(e) => setCheckoutRepairFee(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-sm font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">付款方式 (限定：現金 / 刷卡 / 匯款)</label>
                <div className="grid grid-cols-3 gap-2">
                  {['現金', '刷卡', '匯款'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setCheckoutPaymentMethod(method)}
                      className={`py-2 rounded-xl font-bold transition border ${checkoutPaymentMethod === method ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                    >
                      {method}
                      {method === '刷卡' && <span className="block text-[9px] font-normal opacity-85">扣2%手續費</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 text-xs">備註</label>
              <input
                type="text"
                value={checkoutRemark}
                onChange={(e) => setCheckoutRemark(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
              />
            </div>

            {/* 結帳摘要與毛利計算 */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-2 text-xs">
              <h4 className="font-bold text-slate-700 border-b pb-1.5">結帳摘要</h4>
              <div className="flex justify-between text-slate-600">
                <span>維修費</span>
                <span className="font-mono font-bold">${checkoutRepairFee}</span>
              </div>
              {checkoutPaymentMethod === '刷卡' && (
                <div className="flex justify-between text-amber-600">
                  <span>刷卡手續費 (2%)</span>
                  <span className="font-mono font-bold">-${(checkoutRepairFee * 0.02).toFixed(1)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>零件成本總計</span>
                <span className="font-mono font-bold text-rose-600">
                  -${checkoutSelectedParts.reduce((sum, p) => sum + p.cost, 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-emerald-600 pt-2 border-t border-slate-200">
                <span>預估毛利</span>
                <span className="font-mono">
                  ${(
                    (checkoutPaymentMethod === '刷卡' ? checkoutRepairFee * 0.98 : checkoutRepairFee) -
                    checkoutSelectedParts.reduce((sum, p) => sum + p.cost, 0)
                  ).toFixed(0)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-800 pt-1">
                <span>客戶本次付款</span>
                <span className="font-mono">${checkoutRepairFee}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition"
              >
                取消
              </button>
              <button
                onClick={handleConfirmCheckout}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                確認取件結帳 ${checkoutRepairFee}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
