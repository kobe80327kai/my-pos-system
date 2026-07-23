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

export default function RepairManagementPage() {
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [activeTab, setActiveTab] = useState<'repairs' | 'parts' | 'purchases' | 'catalog' | 'vendors'>('repairs');

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
      },
      {
        id: 'r2',
        orderNo: 'RO260715004',
        customerName: 'SF',
        customerPhone: '0988-215971',
        brand: '小米',
        model: '紅米 NOTE13',
        color: '',
        imei: '',
        problem: 'GOOGLE鎖',
        price: 0,
        repairFee: 0,
        deposit: 0,
        checkFee: 0,
        status: '已收件',
        date: '2026-07-15',
        isOutsourced: true,
        outsourcer: '聯強國際'
      },
      {
        id: 'r3',
        orderNo: 'RO260715003',
        customerName: '陳清政',
        customerPhone: '0980-201060',
        brand: '小米',
        model: '紅米 NOTE12 5G',
        color: '',
        imei: '',
        problem: '電池膨脹',
        price: 800,
        repairFee: 800,
        deposit: 0,
        checkFee: 0,
        status: '已取件',
        date: '2026-07-15',
        isOutsourced: false
      },
      {
        id: 'r4',
        orderNo: 'RO260715001',
        customerName: '阿婷友',
        customerPhone: '0924017866',
        brand: 'Apple',
        model: 'I15',
        color: '',
        imei: '',
        problem: '換電池',
        price: 1600,
        repairFee: 1600,
        deposit: 0,
        checkFee: 0,
        status: '已取件',
        date: '2026-07-15',
        isOutsourced: false
      }
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

  // 搜尋與篩選狀態
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('全部狀態');
  const [showTrash, setShowTrash] = useState(false);

  // 新增維修單 Modal 狀態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'general' | 'outsource'>('general');

  // 表單欄位
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

  // 快速新增客戶 Modal
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
    // 重置表單
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

  const filteredRepairs = repairs.filter(r => {
    const matchKeyword = !searchKeyword || 
      r.orderNo.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      r.model.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      r.problem.toLowerCase().includes(searchKeyword.toLowerCase());

    const matchStatus = statusFilter === '全部狀態' || r.status === statusFilter;
    return matchKeyword && matchStatus;
  });

  const filteredCustomers = customers.filter(c => {
    if (!custInput) return true;
    const kw = custInput.trim().toLowerCase();
    return c.name.toLowerCase().includes(kw) || c.phone.includes(kw);
  });

  return (
    <div className="flex-1 bg-slate-100 p-8 space-y-6 overflow-y-auto font-sans text-slate-800 min-h-screen">
      {/* 頂部標題與新增維修單按鈕 */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-800">維修管理</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
        >
          + 新增維修單
        </button>
      </div>

      {/* 子頁籤導覽列 */}
      <div className="flex gap-6 border-b border-slate-200 text-xs font-bold text-slate-500 pb-3">
        <button onClick={() => setActiveTab('repairs')} className={`pb-1 transition ${activeTab === 'repairs' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-slate-700'}`}>維修單</button>
        <button onClick={() => setActiveTab('parts')} className={`pb-1 transition ${activeTab === 'parts' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-slate-700'}`}>零件庫存</button>
        <button onClick={() => setActiveTab('purchases')} className={`pb-1 transition ${activeTab === 'purchases' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-slate-700'}`}>進貨紀錄</button>
        <button onClick={() => setActiveTab('catalog')} className={`pb-1 transition ${activeTab === 'catalog' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-slate-700'}`}>維修零件建檔</button>
        <button onClick={() => setActiveTab('vendors')} className={`pb-1 transition ${activeTab === 'vendors' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-slate-700'}`}>維修廠商</button>
      </div>

      {activeTab === 'repairs' && (
        <div className="space-y-4">
          {/* 搜尋與篩選列 */}
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

          {/* 維修單表格 */}
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

      {/* 新增維修單 Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-800">新增維修單</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-600 text-base">×</button>
            </div>

            {/* 模式切換按鈕 */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
              <button
                onClick={() => setModalMode('general')}
                className={`py-2 rounded-xl text-xs font-bold transition ${modalMode === 'general' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              >
                一般維修
              </button>
              <button
                onClick={() => setModalMode('outsource')}
                className={`py-2 rounded-xl text-xs font-bold transition ${modalMode === 'outsource' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500'}`}
              >
                🔗 委外維修
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* 客戶欄位 */}
              <div className="space-y-1 relative">
                <label className="text-slate-400 block">客戶 *</label>
                <input
                  type="text"
                  value={custInput}
                  onChange={(e) => {
                    setCustInput(e.target.value);
                    setIsCustDropdownOpen(true);
                  }}
                  onFocus={() => setIsCustDropdownOpen(true)}
                  placeholder="搜尋客戶姓名或電話..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
                <button 
                  onClick={() => setIsCustModalOpen(true)}
                  className="mt-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl font-bold flex items-center gap-1 shadow-sm"
                >
                  + 快速建立新客戶
                </button>

                {isCustDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-40 overflow-y-auto">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-3 text-center space-y-2">
                        <p className="text-slate-400">找不到符合的客戶</p>
                        <button
                          onClick={() => {
                            setNewCustPhone(custInput.match(/^\d+$/) ? custInput : '');
                            setIsCustDropdownOpen(false);
                            setIsCustModalOpen(true);
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded-xl font-bold"
                        >
                          + 新增客戶「{custInput}」
                        </button>
                      </div>
                    ) : (
                      filteredCustomers.map(c => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setCustInput(`${c.name} (${c.phone})`);
                            setIsCustDropdownOpen(false);
                          }}
                          className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex justify-between border-b border-slate-50"
                        >
                          <span className="font-bold text-slate-800">{c.name}</span>
                          <span className="text-slate-400 font-mono">{c.phone}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* 品牌與機型 */}
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

              {/* 顏色與序號 */}
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

              {/* 委外專屬欄位 */}
              {modalMode === 'outsource' && (
                <div>
                  <label className="text-slate-400 block mb-1">委外店家</label>
                  <input
                    type="text"
                    value={outsourcer}
                    onChange={(e) => setOutsourcer(e.target.value)}
                    placeholder="店家名稱或地址..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              )}

              {/* 問題描述 */}
              <div>
                <label className="text-slate-400 block mb-1">問題描述 *</label>
                <textarea
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  placeholder="描述客戶反映的問題..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3"
                ></textarea>
              </div>

              {/* 價格欄位 */}
              {modalMode === 'general' ? (
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">報價 (元)</label>
                    <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full bg-slate-50 border rounded-xl px-2.5 py-2 font-mono" />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">維修費 (元)</label>
                    <input type="number" value={repairFee} onChange={(e) => setRepairFee(Number(e.target.value))} className="w-full bg-slate-50 border rounded-xl px-2.5 py-2 font-mono" />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">訂金 (元)</label>
                    <input type="number" value={deposit} onChange={(e) => setDeposit(Number(e.target.value))} className="w-full bg-slate-50 border rounded-xl px-2.5 py-2 font-mono" />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">檢測費 (元)</label>
                    <input type="number" value={checkFee} onChange={(e) => setCheckFee(Number(e.target.value))} className="w-full bg-slate-50 border rounded-xl px-2.5 py-2 font-mono" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">維修報價 (元)</label>
                    <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full bg-slate-50 border rounded-xl px-2.5 py-2 font-mono" />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">廠商報價 (元)</label>
                    <input type="number" value={outsourcerPrice} onChange={(e) => setOutsourcerPrice(Number(e.target.value))} className="w-full bg-slate-50 border rounded-xl px-2.5 py-2 font-mono" />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">訂金 (元)</label>
                    <input type="number" value={deposit} onChange={(e) => setDeposit(Number(e.target.value))} className="w-full bg-slate-50 border rounded-xl px-2.5 py-2 font-mono" />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">檢測費 (元)</label>
                    <input type="number" value={checkFee} onChange={(e) => setCheckFee(Number(e.target.value))} className="w-full bg-slate-50 border rounded-xl px-2.5 py-2 font-mono" />
                  </div>
                </div>
              )}

              {/* 備註 */}
              <div>
                <label className="text-slate-400 block mb-1">備註</label>
                <input
                  type="text"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              {/* 手機解鎖密碼 */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-800">客戶手機解鎖密碼</p>
                  <p className="text-[10px] text-slate-400">供維修人員解鎖手機使用，客戶可親自輸入</p>
                </div>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="輸入解鎖密碼"
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs w-32 font-mono"
                />
              </div>

              <button
                onClick={handleSaveRepair}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition mt-2"
              >
                確認送出
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 快速新增客戶 Modal */}
      {isCustModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-800">快速建立新客戶</h3>
              <button onClick={() => setIsCustModalOpen(false)} className="text-slate-400 hover:text-rose-600 text-base">×</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">客戶姓名</label>
                <input type="text" value={newCustName} onChange={(e) => setNewCustName(e.target.value)} placeholder="例：王小明" className="w-full bg-slate-50 border rounded-xl px-3 py-2" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">聯絡電話</label>
                <input type="text" value={newCustPhone} onChange={(e) => setNewCustPhone(e.target.value)} placeholder="例：0912345678" className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-mono" />
              </div>
              <button onClick={handleCreateCustomer} className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-sm">確認新增並選取</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
