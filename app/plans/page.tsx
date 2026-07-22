'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
// 方案資料型態
interface Plan {
  id: string;
  code: string;
  name: string;
  telecom: '中華電信' | '台灣大哥大' | '遠傳電信';
  type: '新申辦' | '攜碼' | '續約' | '手機保險';
  network: '5G' | '4G';
  monthlyFee: number;
  contractMonths: number;
  prepayment: number | '—';
  storeCommission: number;
  actualCommission: number;
}

export default function PlansPage() {
  // ---- 篩選 Tabs 狀態 ----
  const [selectedTelecom, setSelectedTelecom] = useState<string>('全部電信');
  const [selectedType, setSelectedType] = useState<string>('全部類型');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // ---- 方案清單狀態（初始為空陣列，改由 Supabase 載入） ----
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // ---- Modal 狀態 ----
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newPlan, setNewPlan] = useState<{
    code: string;
    name: string;
    telecom: '中華電信' | '台灣大哥大' | '遠傳電信';
    type: '新申辦' | '攜碼' | '續約' | '手機保險';
    network: '5G' | '4G';
    contractMonths: number;
    prepayment: number;
    monthlyFee: number;
    storeCommission: number;
    actualCommission: number;
  }>({
    code: '',
    name: '',
    telecom: '遠傳電信',
    type: '新申辦',
    network: '5G',
    contractMonths: 24,
    prepayment: 0,
    monthlyFee: 699,
    storeCommission: 800,
    actualCommission: 1200,
  });

  // ---- 1. 頁面載入時從 Supabase 抓取資料 ----
  const fetchPlans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('讀取方案失敗：', error.message);
    } else if (data) {
      // 轉換欄位格式（若資料庫底線欄位轉為駝峰式）
      const formattedPlans: Plan[] = data.map((item: any) => ({
        id: item.id.toString(),
        code: item.code,
        name: item.name,
        telecom: item.telecom,
        type: item.type,
        network: item.network,
        monthlyFee: item.monthly_fee ?? item.monthlyFee,
        contractMonths: item.contract_months ?? item.contractMonths,
        prepayment: item.prepayment === 0 || !item.prepayment ? '—' : item.prepayment,
        storeCommission: item.store_commission ?? item.storeCommission,
        actualCommission: item.actual_commission ?? item.actualCommission,
      }));
      setPlans(formattedPlans);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // ---- 2. 從 Supabase 真正刪除方案 ----
  const handleDeletePlan = async (id: string, name: string) => {
    if (!confirm(`確定要刪除方案 [${name}] 嗎？刪除後無法復原。`)) {
      return;
    }

    try {
      // 發送請求至 Supabase
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', id);

      if (error) {
        alert(`刪除失敗：${error.message}\n(請確認 Supabase RLS 權限與資料庫連線)`);
        return;
      }

      // 刪除成功後更新畫面
      setPlans((prev) => prev.filter((p) => p.id !== id));
      alert('方案已成功刪除！');
    } catch (err) {
      console.error(err);
      alert('刪除失敗，請稍後再試');
    }
  };

  // ---- 3. 新增方案同步寫入 Supabase ----
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlan.name.trim()) {
      alert('請填寫方案名稱！');
      return;
    }

    const autoCode =
      newPlan.code.trim() ||
      `PLN${(plans.length + 1).toString().padStart(4, '0')}`;

    const planPayload = {
      code: autoCode,
      name: newPlan.name,
      telecom: newPlan.telecom,
      type: newPlan.type,
      network: newPlan.network,
      monthly_fee: Number(newPlan.monthlyFee),
      contract_months: Number(newPlan.contractMonths),
      prepayment: newPlan.prepayment,
      store_commission: Number(newPlan.storeCommission),
      actual_commission: Number(newPlan.actualCommission),
    };

    const { data, error } = await supabase
      .from('plans')
      .insert([planPayload])
      .select();

    if (error) {
      alert(`新增失敗：${error.message}`);
      return;
    }

    // 重新載入列表資料
    await fetchPlans();
    setIsAddModalOpen(false);

    // 重置表單
    setNewPlan({
      code: '',
      name: '',
      telecom: '遠傳電信',
      type: '新申辦',
      network: '5G',
      contractMonths: 24,
      prepayment: 0,
      monthlyFee: 699,
      storeCommission: 800,
      actualCommission: 1200,
    });
  };

  // ---- 過濾清單 ----
  const filteredPlans = plans.filter((p) => {
    const matchTelecom =
      selectedTelecom === '全部電信' || p.telecom === selectedTelecom;
    const matchType = selectedType === '全部類型' || p.type === selectedType;
    const matchSearch =
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTelecom && matchType && matchSearch;
  });

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      
      {/* 頂部 Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">方案管理</h1>
          <p className="text-xs text-slate-400 mt-0.5">共 {filteredPlans.length} 個方案</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
        >
          <span>＋</span> 新增方案
        </button>
      </div>

      {/* 搜尋與篩選列 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋方案代碼或名稱..."
              className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
            {['全部電信', '中華電信', '台灣大哥大', '遠傳電信'].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTelecom(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedTelecom === t
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100">
          {['全部類型', '新申辦', '攜碼', '續約', '手機保險'].map((tp) => (
            <button
              key={tp}
              onClick={() => setSelectedType(tp)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                selectedType === tp
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tp}
            </button>
          ))}
        </div>
      </div>

      {/* 方案數據表格 */}
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
              <th className="p-4 text-blue-600">門市佣金</th>
              <th className="p-4 text-amber-600">實際佣金</th>
              <th className="p-4 text-right pr-6">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={11} className="text-center py-12 text-slate-400">
                  載入方案資料中...
                </td>
              </tr>
            ) : filteredPlans.length > 0 ? (
              filteredPlans.map((plan) => (
                <tr key={plan.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4 font-mono font-medium text-slate-800">{plan.code}</td>
                  <td className="p-4 font-bold text-slate-800">{plan.name}</td>
                  <td className="p-4">
                    <span className="text-slate-600 font-medium">{plan.telecom}</span>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 text-[11px] font-semibold border border-purple-100">
                      ● {plan.type}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[11px]">
                      {plan.network}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-slate-700">${plan.monthlyFee.toLocaleString()}</td>
                  <td className="p-4 font-mono text-slate-700">{plan.contractMonths}</td>
                  <td className="p-4 font-mono text-slate-400">{plan.prepayment}</td>
                  <td className="p-4 font-mono font-bold text-blue-600">${plan.storeCommission.toLocaleString()}</td>
                  <td className="p-4 font-mono font-bold text-orange-600">${plan.actualCommission.toLocaleString()}</td>
                  <td className="p-4 text-right pr-6">
                    <div className="flex items-center justify-end gap-3 text-slate-400">
                      <button title="編輯" className="hover:text-blue-600 transition">✏️</button>
                      <button
                        title="刪除"
                        onClick={() => handleDeletePlan(plan.id, plan.name)}
                        className="hover:text-rose-500 transition"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={11} className="text-center py-12 text-slate-400">
                  沒有找到符合條件的方案
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ➕ 新增方案 Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 my-8">
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-slate-800">新增方案</h2>
                <p className="text-xs text-slate-400 mt-0.5">設定電信方案的所有詳細資訊</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="p-8 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-600 font-medium mb-1.5 block">
                    方案代碼 <span className="text-slate-400 font-normal">（自動產生，可修改）</span>
                  </label>
                  <input
                    type="text"
                    value={newPlan.code}
                    onChange={(e) => setNewPlan({ ...newPlan, code: e.target.value })}
                    placeholder="自動產生"
                    className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 transition placeholder:text-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-700 font-medium mb-1.5 block">
                    方案名稱 <span className="text-blue-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newPlan.name}
                    onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                    placeholder="5G 新申辦 699"
                    className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 transition placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 font-medium mb-2 block">電信商</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['中華電信', '台灣大哥大', '遠傳電信'] as const).map((tel) => {
                    const isSelected = newPlan.telecom === tel;
                    return (
                      <button
                        key={tel}
                        type="button"
                        onClick={() => setNewPlan({ ...newPlan, telecom: tel })}
                        className={`py-2.5 rounded-2xl text-xs font-semibold border transition ${
                          isSelected
                            ? 'bg-blue-50 text-blue-600 border-blue-400 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {tel}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-600 font-medium mb-1.5 block">方案類型</label>
                  <select
                    value={newPlan.type}
                    onChange={(e) => setNewPlan({ ...newPlan, type: e.target.value as any })}
                    className="w-full border border-slate-200 rounded-2xl px-3 py-2.5 text-xs text-slate-700 bg-white focus:outline-none focus:border-blue-500 transition"
                  >
                    <option value="新申辦">新申辦</option>
                    <option value="攜碼">攜碼</option>
                    <option value="續約">續約</option>
                    <option value="手機保險">手機保險</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-medium mb-1.5 block">網路制式</label>
                  <select
                    value={newPlan.network}
                    onChange={(e) => setNewPlan({ ...newPlan, network: e.target.value as any })}
                    className="w-full border border-slate-200 rounded-2xl px-3 py-2.5 text-xs text-slate-700 bg-white focus:outline-none focus:border-blue-500 transition"
                  >
                    <option value="5G">5G</option>
                    <option value="4G">4G</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-medium mb-1.5 block">合約期限（月）</label>
                  <input
                    type="number"
                    value={newPlan.contractMonths}
                    onChange={(e) => setNewPlan({ ...newPlan, contractMonths: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 transition font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 font-medium mb-1.5 block">
                  預繳金額 <span className="text-slate-400 font-normal">（代收不計毛利，0=無預繳）</span>
                </label>
                <input
                  type="number"
                  value={newPlan.prepayment}
                  onChange={(e) => setNewPlan({ ...newPlan, prepayment: Number(e.target.value) })}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 transition font-mono"
                />
              </div>

              <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-blue-700">
                <span className="text-blue-500 text-sm font-bold">ℹ️</span>
                <p>此方案類型銷貨時，系統將自動要求輸入 **電話號碼** 與 **SIM 卡號**</p>
              </div>

              <div>
                <label className="text-xs text-slate-600 font-medium mb-1.5 block">月租費（元）</label>
                <input
                  type="number"
                  value={newPlan.monthlyFee}
                  onChange={(e) => setNewPlan({ ...newPlan, monthlyFee: Number(e.target.value) })}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 transition font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
                <div>
                  <label className="text-xs text-slate-700 font-medium mb-1.5 flex justify-between">
                    <span>門市佣金（元）</span>
                    <span className="text-blue-600 text-[10px]">門市人員可見</span>
                  </label>
                  <input
                    type="number"
                    value={newPlan.storeCommission}
                    onChange={(e) => setNewPlan({ ...newPlan, storeCommission: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 bg-white focus:outline-none focus:border-blue-500 transition font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-700 font-medium mb-1.5 flex justify-between">
                    <span>實際佣金（元）</span>
                    <span className="text-rose-500 text-[10px]">僅管理員可見</span>
                  </label>
                  <input
                    type="number"
                    value={newPlan.actualCommission}
                    onChange={(e) => setNewPlan({ ...newPlan, actualCommission: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 bg-white focus:outline-none focus:border-blue-500 transition font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl text-xs text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 font-medium transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-7 py-2.5 rounded-xl text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold transition shadow-sm"
                >
                  建立方案
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}