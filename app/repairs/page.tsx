'use client';

import React, { useState, useEffect } from 'react';

interface RepairOrder {
  id: string;
  repairNo: string;
  date: string;
  customerName: string;
  customerPhone: string;
  deviceModel: string;
  imei: string;
  repairType: '一般維修' | '委外維修';
  issueDescription: string;
  quotedPrice: number;
  repairCost: number;
  status: '檢測中' | '等待報價' | '維修中' | '已完修' | '已交機' | '不維修';
}

export default function RepairsPage() {
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

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
        issueDescription: '更換原廠電池',
        quotedPrice: 2200,
        repairCost: 1200,
        status: '已交機'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('pos_repair_orders', JSON.stringify(repairOrders));
  }, [repairOrders]);

  const [repairSearchKeyword, setRepairSearchKeyword] = useState('');
  const [isNewRepairModalOpen, setIsNewRepairModalOpen] = useState(false);
  const [repairCustName, setRepairCustName] = useState('');
  const [repairCustPhone, setRepairCustPhone] = useState('');
  const [repairDeviceModel, setRepairDeviceModel] = useState('');
  const [repairImei, setRepairImei] = useState('');
  const [repairIssue, setRepairIssue] = useState('');
  const [repairQuotedPrice, setRepairQuotedPrice] = useState('');
  const [repairCostVal, setRepairCostVal] = useState('');

  const filteredOrders = repairOrders.filter(r => 
    !repairSearchKeyword || 
    r.repairNo.includes(repairSearchKeyword) || 
    r.customerName.includes(repairSearchKeyword) || 
    r.customerPhone.includes(repairSearchKeyword) || 
    r.deviceModel.includes(repairSearchKeyword)
  );

  return (
    <div className="p-8 space-y-6 w-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800">手機維修中心</h1>
          <p className="text-xs text-slate-400 mt-0.5">獨立維修管理、狀態追蹤與報價紀錄。</p>
        </div>
        <button 
          onClick={() => setIsNewRepairModalOpen(true)} 
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
        >
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
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">目前沒有相關維修紀錄</td>
                </tr>
              ) : (
                filteredOrders.map((r) => {
                  const mProfit = r.quotedPrice - r.repairCost;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 pl-3 font-mono font-bold text-slate-800">
                        {r.repairNo}
                        <span className="block text-[10px] text-slate-400 font-normal">{r.repairType}</span>
                      </td>
                      <td className="py-3.5">
                        {r.customerName} 
                        <br/>
                        <span className="text-[10px] text-slate-400">{r.customerPhone}</span>
                      </td>
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

      {/* 新增維修單 Modal */}
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
                  issueDescription: repairIssue,
                  quotedPrice: parseFloat(repairQuotedPrice) || 0,
                  repairCost: parseFloat(repairCostVal) || 0,
                  status: '檢測中'
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
