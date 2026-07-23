'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Plan {
  id: string;
  code: string;
  name: string;
  carrier: string;
  type: string;
  network: string;
  monthlyFee: number;
  contractPeriod: number;
  prepayment: number;
  storeCommission: number;
  actualCommission: number;
}

// 💡 修正 1：將 Key 統一改為 'pos_plans'，確保與結帳頁面一致
const LOCAL_STORAGE_KEY = 'pos_plans';

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>(() => {
    // 初始化時從 localStorage 讀取統一的 'pos_plans'
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('解析 localStorage 失敗:', e);
        }
      }
    }
    // 💡 修正 2：若沒有資料，回傳空陣列，避免舊的預設方案殘留
    return [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [carrierFilter, setCarrierFilter] = useState('全部電信');
  const [typeFilter, setTypeFilter] = useState('全部類型');

  // Modal 狀態 (包含新增與編輯)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  // 表單資料
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    carrier: '遠傳電信',
    type: '新申辦',
    network: '5G',
    monthlyFee: 699,
    contractPeriod: 24,
    prepayment: 0,
    storeCommission: 800,
    actualCommission: 1200,
  });

  // 當 plans 改變時，同步儲存到統一的 localStorage key
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase.from('plans').select('*').order('created_at', { ascending: false });
      if (data && !error && data.length > 0) {
        const mapped = data.map((item: any) => ({
          id: String(item.id),
          code: item.code || 'PLN0001',
          name: item.name || '',
          carrier: item.carrier || '遠傳電信',
          type: item.type || '新申辦',
          network: item.network || '5G',
          monthlyFee: Number(item.monthly_fee || item.monthlyFee || 0),
          contractPeriod: Number(item.contract_period || item.contractPeriod || 24),
          prepayment: Number(item.prepayment || 0),
          storeCommission: Number(item.store_commission || item.storeCommission || 0),
          actualCommission: Number(item.actual_commission || item.actualCommission || 0),
        }));
        setPlans(mapped);
      }
    } catch (err) {
      console.log('使用本地暫存資料運作中');
    }
  };

  // ✏️ 點擊編輯按鈕：打開彈窗並帶入舊資料
  const handleEditClick = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      code: plan.code,
      name: plan.name,
      carrier: plan.carrier,
      type: plan.type,
      network: plan.network,
      monthlyFee: plan.monthlyFee,
      contractPeriod: plan.contractPeriod,
      prepayment: plan.prepayment,
      storeCommission: plan.storeCommission,
      actualCommission: plan.actualCommission,
    });
    setIsModalOpen(true);
  };

  // ➕ 點擊新增按鈕
  const handleAddClick = () => {
    setEditingPlan(null);
    setFormData({
      code: `PLN${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      carrier: '遠傳電信',
      type: '新申辦',
      network: '5G',
      monthlyFee: 699,
      contractPeriod: 24,
      prepayment: 0,
      storeCommission: 0,
      actualCommission: 0,
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ['monthlyFee', 'contractPeriod', 'prepayment', 'storeCommission', 'actualCommission'].includes(name)
        ? Number(value)
        : value,
    }));
  };

  // 💾 儲存修改 / 新增
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      code: formData.code,
      name: formData.name,
      carrier: formData.carrier,
      type: formData.type,
      network: formData.network,
      monthly_fee: formData.monthlyFee,
      contract_period: formData.contractPeriod,
      prepayment: formData.prepayment,
      store_commission: formData.storeCommission,
      actual_commission: formData.actualCommission,
    };

    if (editingPlan) {
      // 編輯邏輯
      try {
        await supabase.from('plans').update(payload).eq('id', editingPlan.id);
      } catch (err) {
        // 略過遠端錯誤，直接更新前端與 LocalStorage
      }
      setPlans((prev) => prev.map((p) => (p.id === editingPlan.id ? { ...p, ...formData } : p)));
    } else {
      // 新增邏輯
      const newId = String(Date.now());
      try {
        await supabase.from('plans').insert([payload]);
      } catch (err) {
        // 略過遠端錯誤
      }
      setPlans((prev) => [{ id: newId, ...formData }, ...prev]);
    }

    setIsModalOpen(false);
    setEditingPlan(null);
  };

  // 🗑️ 刪除
  const handleDelete = async (id: string) => {
    if (confirm('確定要刪除此方案嗎？')) {
      try {
        await supabase.from('plans').delete().eq('id', id);
      } catch (err) {
        // 略過遠端錯誤
      }
      setPlans((prev) => prev.filter((p) => p.id !== id));
    }
  };

  // 篩選 logic
  const filteredPlans = plans.filter((plan) => {
    const matchesSearch =
      plan.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCarrier = carrierFilter === '全部電信' ? true : plan.carrier === carrierFilter;
    const matchesType = typeFilter === '全部類型' ? true : plan.type === typeFilter;

    return matchesSearch && matchesCarrier && matchesType;
  });

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* 標題與新增按鈕 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">方案管理</h1>
          <p className="text-xs text-slate-400 mt-1">共 {filteredPlans.length} 個方案</p>
        </div>
        <button
          onClick={handleAddClick}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition shadow-sm flex items-center gap-1 cursor-pointer"
        >
          <span>+</span> 新增方案
        </button>
      </div>

      {/* 搜尋與篩選列 */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋方案代碼或名稱..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* 電信商標籤 */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          {['全部電信', '中華電信', '台灣大哥大', '遠傳電信'].map((carrier) => (
            <button
              key={carrier}
              onClick={() => setCarrierFilter(carrier)}
              className={`px-3 py-1.5 rounded-lg transition ${
                carrierFilter === carrier ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {carrier}
            </button>
          ))}
        </div>

        {/* 類型標籤 */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          {['全部類型', '新申辦', '攜碼', '續約', '手機保險'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-lg transition ${
                typeFilter === type ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* 方案表格 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-medium">
            <tr>
              <th className="p-4">方案代碼</th>
              <th className="p-4">方案名稱</th>
              <th className="p-4">電信商</th>
              <th className="p-4">類型</th>
              <th className="p-4">網路</th>
              <th className="p-4">月租費</th>
              <th className="p-4">合約（月）</th>
              <th className="p-4">預繳</th>
              <th className="p-4 text-blue-600">門市傭金</th>
              <th className="p-4 text-amber-600">實際傭金</th>
              <th className="p-4 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPlans.map((plan) => (
              <tr key={plan.id} className="hover:bg-slate-50 transition">
                <td className="p-4 font-mono font-medium text-slate-700">{plan.code}</td>
                <td className="p-4 font-bold text-slate-800">{plan.name}</td>
                <td className="p-4 text-slate-700">{plan.carrier}</td>
                <td className="p-4">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-600 border border-purple-100">
                    • {plan.type}
                  </span>
                </td>
                <td className="p-4">
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono">{plan.network}</span>
                </td>
                <td className="p-4 font-mono font-medium">${plan.monthlyFee}</td>
                <td className="p-4 font-mono text-slate-700">{plan.contractPeriod}</td>
                <td className="p-4 font-mono text-slate-400">{plan.prepayment > 0 ? `$${plan.prepayment}` : '—'}</td>
                <td className="p-4 font-mono font-bold text-blue-600">${plan.storeCommission}</td>
                <td className="p-4 font-mono font-bold text-amber-600">${plan.actualCommission.toLocaleString()}</td>
                <td className="p-4 text-center flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleEditClick(plan)}
                    className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                    title="編輯"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
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

      {/* 彈窗：新增 / 編輯 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-800">
                {editingPlan ? '✏️ 修改方案內容' : '＋ 新增門市方案'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">方案代碼</label>
                  <input
                    type="text"
                    name="code"
                    required
                    value={formData.code}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">方案名稱 *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">電信商</label>
                  <select name="carrier" value={formData.carrier} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl">
                    <option value="中華電信">中華電信</option>
                    <option value="台灣大哥大">台灣大哥大</option>
                    <option value="遠傳電信">遠傳電信</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">申辦類型</label>
                  <select name="type" value={formData.type} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl">
                    <option value="新申辦">新申辦</option>
                    <option value="攜碼">攜碼</option>
                    <option value="續約">續約</option>
                    <option value="手機保險">手機保險</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">網路規格</label>
                  <select name="network" value={formData.network} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl">
                    <option value="5G">5G</option>
                    <option value="4G">4G</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">月租費 ($)</label>
                  <input
                    type="number"
                    name="monthlyFee"
                    value={formData.monthlyFee}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">合約月數</label>
                  <input
                    type="number"
                    name="contractPeriod"
                    value={formData.contractPeriod}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">預繳金額 ($)</label>
                  <input
                    type="number"
                    name="prepayment"
                    value={formData.prepayment}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-blue-600">門市傭金 ($)</label>
                  <input
                    type="number"
                    name="storeCommission"
                    value={formData.storeCommission}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-blue-200 p-2 rounded-xl font-bold text-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-amber-600">實際傭金 ($)</label>
                  <input
                    type="number"
                    name="actualCommission"
                    value={formData.actualCommission}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-amber-200 p-2 rounded-xl font-bold text-amber-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-sm"
                >
                  確認儲存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
