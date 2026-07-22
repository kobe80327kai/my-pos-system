'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// 收支記錄資料型態
interface Transaction {
  id: string;
  type: 'expense' | 'income';
  category: string;
  payment_method: string;
  amount: number;
  note: string;
  date: string;
}

export default function DailyReportPage() {
  // 日期控制：今日營運報表
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // 日期控制：盈餘報表 (預設為本月首日到今日)
  const todayStr = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0];

  const [profitFilter, setProfitFilter] = useState<'thisMonth' | 'lastMonth' | 'custom'>('thisMonth');
  const [profitStartDate, setProfitStartDate] = useState<string>(firstDayOfMonth);
  const [profitEndDate, setProfitEndDate] = useState<string>(todayStr);

  // 零用金 (由 localStorage 讀取，實作永久記憶功能)
  const [pettyCash, setPettyCash] = useState<number>(-14232);
  const [isEditingPettyCash, setIsEditingPettyCash] = useState<boolean>(false);

  // 初始化：從 localStorage 讀取儲存的零用金
  useEffect(() => {
    const savedPettyCash = localStorage.getItem('pos_petty_cash');
    if (savedPettyCash !== null) {
      setPettyCash(Number(savedPettyCash));
    }
  }, []);

  // 當零用金變更時，自動寫入 localStorage 持久化儲存
  const handlePettyCashChange = (value: number) => {
    setPettyCash(value);
    localStorage.setItem('pos_petty_cash', value.toString());
  };

  // 資料狀態
  const [loading, setLoading] = useState<boolean>(true);
  const [dailyTransactions, setDailyTransactions] = useState<Transaction[]>([]);
  const [periodTransactions, setPeriodTransactions] = useState<Transaction[]>([]);

  // Modal 控制
  const [modalType, setModalType] = useState<'expense' | 'income' | null>(null);
  const [detailModalType, setDetailModalType] = useState<'expense' | 'income' | null>(null);

  const [formData, setFormData] = useState({
    category: '雜支',
    paymentMethod: '現金',
    amount: '',
    note: '',
  });

  // 1. 讀取「今日/選定單日」營運資料
  const fetchDailyTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('date', selectedDate);

      if (error) {
        console.error('讀取今日報表失敗：', error.message);
      } else {
        setDailyTransactions(data || []);
      }
    } catch (err) {
      console.error('連線錯誤：', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. 讀取「盈餘報表區間」資料
  const fetchPeriodTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('date', profitStartDate)
        .lte('date', profitEndDate);

      if (error) {
        console.error('讀取盈餘報表失敗：', error.message);
      } else {
        setPeriodTransactions(data || []);
      }
    } catch (err) {
      console.error('連線錯誤：', err);
    }
  };

  useEffect(() => {
    fetchDailyTransactions();
  }, [selectedDate]);

  useEffect(() => {
    fetchPeriodTransactions();
  }, [profitStartDate, profitEndDate]);

  // 切換盈餘報表快捷日期 (本月 / 上月)
  const handleProfitFilterChange = (type: 'thisMonth' | 'lastMonth' | 'custom') => {
    setProfitFilter(type);
    const now = new Date();
    if (type === 'thisMonth') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      setProfitStartDate(start);
      setProfitEndDate(todayStr);
    } else if (type === 'lastMonth') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      setProfitStartDate(start);
      setProfitEndDate(end);
    }
  };

  // 新增紀錄
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      alert('請輸入有效的金額！');
      return;
    }

    const newTransaction = {
      type: modalType,
      category: formData.category,
      payment_method: formData.paymentMethod,
      amount: Number(formData.amount),
      note: formData.note,
      date: selectedDate,
    };

    try {
      const { error } = await supabase.from('transactions').insert([newTransaction]);
      if (error) {
        alert(`新增失敗：${error.message}`);
      } else {
        setModalType(null);
        fetchDailyTransactions();
        fetchPeriodTransactions();
      }
    } catch (err) {
      console.error('新增紀錄時發生錯誤：', err);
    }
  };

  // 刪除紀錄
  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('確定要刪除這筆紀錄嗎？')) return;

    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) {
        alert(`刪除失敗：${error.message}`);
      } else {
        fetchDailyTransactions();
        fetchPeriodTransactions();
      }
    } catch (err) {
      console.error('刪除失敗：', err);
    }
  };

  // ---- 今日數據計算 ----
  const dailyIncome = dailyTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const dailyExpense = dailyTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const dailyNetIncome = dailyIncome - dailyExpense;

  // 今日支付方式統計
  const getPaymentTotal = (method: string) => {
    return dailyTransactions
      .filter((t) => t.payment_method === method)
      .reduce((sum, t) => (t.type === 'income' ? sum + Number(t.amount) : sum - Number(t.amount)), 0);
  };

  const getPaymentCount = (method: string) => {
    return dailyTransactions.filter((t) => t.payment_method === method).length;
  };

  // ---- 盈餘報表區間計算 ----
  const periodSales = periodTransactions
    .filter((t) => t.type === 'income' && t.category.includes('銷售'))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const periodCommission = periodTransactions
    .filter((t) => t.type === 'income' && t.category.includes('佣金'))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const periodOtherIncome = periodTransactions
    .filter((t) => t.type === 'income' && !t.category.includes('銷售') && !t.category.includes('佣金'))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const periodExpense = periodTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalPeriodIncome = periodSales + periodCommission + periodOtherIncome;
  const periodProfit = totalPeriodIncome - periodExpense;

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-700 space-y-6">
      
      {/* 頂部標題與按鈕區 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm focus:outline-none"
          />
          <button
            onClick={() => setSelectedDate(todayStr)}
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-medium shadow-sm transition"
          >
            今天
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setModalType('expense');
              setFormData({ category: '雜支', paymentMethod: '現金', amount: '', note: '' });
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            ＋ 新增支出
          </button>
          <button
            onClick={() => {
              setModalType('income');
              setFormData({ category: '雜收', paymentMethod: '現金', amount: '', note: '' });
            }}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-sm transition"
          >
            ＋ 新增雜收
          </button>
        </div>
      </div>

      {/* 📊 區塊 1: 今日淨收入概覽卡片 */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex justify-between items-center">
        <div className="border-l-4 border-emerald-500 pl-4 py-1">
          <p className="text-xs text-slate-400 mb-1">今日淨收入</p>
          <p className="text-3xl font-bold text-emerald-600 font-mono">
            ${dailyNetIncome.toLocaleString()}
          </p>
        </div>

        <div className="flex gap-3">
          <div className="bg-emerald-50/80 px-5 py-2.5 rounded-2xl text-right min-w-[110px]">
            <p className="text-[11px] text-emerald-600 font-medium">總收入</p>
            <p className="text-base font-bold text-emerald-600 font-mono mt-0.5">
              ${dailyIncome.toLocaleString()}
            </p>
          </div>
          <div className="bg-rose-50/80 px-5 py-2.5 rounded-2xl text-right min-w-[110px]">
            <p className="text-[11px] text-rose-500 font-medium">總支出</p>
            <p className="text-base font-bold text-rose-500 font-mono mt-0.5">
              ${dailyExpense.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* 📈 區塊 2: 收入與支出明細 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 左卡：收入明細 */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <span className="text-emerald-500">📈</span> 收入明細
            </div>
            <span className="font-mono text-xs font-bold text-emerald-600">
              ${dailyIncome.toLocaleString()}
            </span>
          </div>

          <div className="space-y-2">
            <div
              onClick={() => setDetailModalType('income')}
              className="bg-blue-50/50 p-3 rounded-xl flex justify-between items-center text-xs cursor-pointer hover:bg-blue-50 transition"
            >
              <span className="text-blue-700 font-medium">銷售收入小計</span>
              <div className="flex items-center gap-3">
                <span className="text-blue-500 underline text-[11px]">
                  {dailyTransactions.filter((t) => t.type === 'income').length} 筆
                </span>
                <span className="font-mono font-bold text-blue-700">
                  ${dailyIncome.toLocaleString()}
                </span>
              </div>
            </div>

            {dailyTransactions
              .filter((t) => t.type === 'income')
              .map((item) => (
                <div
                  key={item.id}
                  className="bg-emerald-50/40 p-3 rounded-xl flex justify-between items-center text-xs"
                >
                  <span className="text-emerald-800 font-medium">
                    👛 {item.category} ({item.payment_method})
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-emerald-700">
                      ${Number(item.amount).toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleDeleteTransaction(item.id)}
                      className="text-rose-400 hover:text-rose-600 text-[10px] ml-1"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* 右卡：支出（雜支） */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <span className="text-rose-500">📉</span> 支出（雜支）
            </div>
            <span className="font-mono text-xs font-bold text-rose-500">
              ${dailyExpense.toLocaleString()}
            </span>
          </div>

          <div className="space-y-2">
            {dailyTransactions.filter((t) => t.type === 'expense').length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-8">今日無支出記錄</p>
            ) : (
              dailyTransactions
                .filter((t) => t.type === 'expense')
                .map((item) => (
                  <div
                    key={item.id}
                    className="bg-rose-50/40 p-3 rounded-xl flex justify-between items-center text-xs"
                  >
                    <div>
                      <p className="text-slate-800 font-medium">{item.category}</p>
                      {item.note && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.note}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-rose-600">
                        -${Number(item.amount).toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleDeleteTransaction(item.id)}
                        className="text-rose-400 hover:text-rose-600 text-[10px]"
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

      </div>

      {/* 💳 區塊 3: 款項結算 */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <span className="text-amber-500">💳</span> 款項結算
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: '現金', icon: '👛', bg: 'bg-emerald-50/50', border: 'border-emerald-200/60' },
            { name: '刷卡', icon: '💳', bg: 'bg-blue-50/40', border: 'border-blue-100' },
            { name: '刷卡/分期', icon: '💳', bg: 'bg-blue-50/40', border: 'border-blue-100' },
            { name: '無卡分期', icon: '💳', bg: 'bg-purple-50/40', border: 'border-purple-100' },
            { name: 'LinePay', icon: '💲', bg: 'bg-emerald-50/30', border: 'border-emerald-100' },
            { name: '匯款', icon: '🏦', bg: 'bg-slate-50', border: 'border-slate-100' },
          ].map((item) => (
            <div
              key={item.name}
              className={`p-4 rounded-2xl border ${item.border} ${item.bg} flex items-center justify-between`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <div>
                  <p className="text-xs text-slate-500 font-medium">{item.name}</p>
                  <p className="text-base font-bold font-mono text-slate-800 mt-0.5">
                    ${getPaymentTotal(item.name).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-400">{getPaymentCount(item.name)} 筆</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 可點擊修改並會自動存檔的零用金 與 本日結算 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          
          {/* 零用金欄位（點擊編輯 + 自動持久化儲存） */}
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 flex justify-between items-center">
            <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
              零用金 <span className="text-[10px] text-amber-600 font-normal">✏️ 點擊修改</span>
            </span>

            {isEditingPettyCash ? (
              <input
                type="number"
                value={pettyCash}
                autoFocus
                onBlur={() => setIsEditingPettyCash(false)}
                onChange={(e) => handlePettyCashChange(Number(e.target.value))}
                className="w-32 px-2 py-1 bg-white border border-amber-300 rounded-lg text-right font-mono font-bold text-amber-700 text-lg focus:outline-none"
              />
            ) : (
              <span
                onClick={() => setIsEditingPettyCash(true)}
                className="text-xl font-bold font-mono text-amber-700 cursor-pointer hover:bg-amber-100/50 px-2 py-1 rounded-lg transition"
              >
                ${pettyCash.toLocaleString()}
              </span>
            )}
          </div>

          {/* 本日結算 */}
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 flex justify-between items-center">
            <span className="text-xs font-bold text-emerald-800">本日結算</span>
            <span className="text-2xl font-bold font-mono text-emerald-600">
              ${(dailyNetIncome + pettyCash).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 📊 區塊 4: 盈餘報表 (下方區塊) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-5">
        
        {/* 頂部標題與頁籤查詢 */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-blue-500 font-bold">📈</span>
            <h2 className="text-sm font-bold text-slate-800">盈餘報表</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => handleProfitFilterChange('thisMonth')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  profitFilter === 'thisMonth'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                本月
              </button>
              <button
                onClick={() => handleProfitFilterChange('lastMonth')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  profitFilter === 'lastMonth'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                上月
              </button>
              <button
                onClick={() => setProfitFilter('custom')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  profitFilter === 'custom'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                自訂
              </button>
            </div>

            {/* 自訂日期選擇 */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <input
                type="date"
                value={profitStartDate}
                onChange={(e) => {
                  setProfitStartDate(e.target.value);
                  setProfitFilter('custom');
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700"
              />
              <span>~</span>
              <input
                type="date"
                value={profitEndDate}
                onChange={(e) => {
                  setProfitEndDate(e.target.value);
                  setProfitFilter('custom');
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700"
              />
            </div>

            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-medium border border-amber-200">
              管理員
            </span>
          </div>
        </div>

        {/* 盈餘卡片網格 (5 個卡片) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          
          {/* 銷售金額 */}
          <div className="bg-slate-50/80 rounded-2xl p-4 text-center border border-slate-100">
            <p className="text-xs text-slate-400 font-medium mb-1">銷售金額</p>
            <p className="text-xl font-bold font-mono text-slate-800">
              ${periodSales.toLocaleString()}
            </p>
          </div>

          {/* 佣金 */}
          <div className="bg-purple-50/40 rounded-2xl p-4 text-center border border-purple-100">
            <p className="text-xs text-purple-600 font-medium mb-1">佣金</p>
            <p className="text-xl font-bold font-mono text-purple-600">
              ${periodCommission.toLocaleString()}
            </p>
          </div>

          {/* 雜收 */}
          <div className="bg-emerald-50/40 rounded-2xl p-4 text-center border border-emerald-100">
            <p className="text-xs text-emerald-600 font-medium mb-1">雜收</p>
            <p className="text-xl font-bold font-mono text-emerald-600">
              ${periodOtherIncome.toLocaleString()}
            </p>
          </div>

          {/* 雜支 */}
          <div className="bg-rose-50/40 rounded-2xl p-4 text-center border border-rose-100">
            <p className="text-xs text-rose-500 font-medium mb-1">雜支</p>
            <p className="text-xl font-bold font-mono text-rose-500">
              -${periodExpense.toLocaleString()}
            </p>
          </div>

          {/* 盈餘 */}
          <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 text-center">
            <p className="text-xs text-emerald-700 font-bold mb-1">盈餘</p>
            <p className="text-xl font-bold font-mono text-emerald-600">
              ${periodProfit.toLocaleString()}
            </p>
          </div>
        </div>

        {/* 計算公式提示 */}
        <p className="text-right text-[10px] text-slate-400 font-mono">
          = 銷售金額 + 佣金 + 雜收 - 雜支
        </p>
      </div>

      {/* 🪟 Modal 1: 新增支出 / 新增雜收 Modal */}
      {modalType && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-800">
                {modalType === 'expense' ? '新增支出記錄' : '新增雜收記錄'}
              </h2>
              <button onClick={() => setModalType(null)} className="text-slate-400 text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 font-medium mb-1.5 block">類別</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 bg-white"
                  >
                    {modalType === 'expense' ? (
                      <>
                        <option value="雜支">雜支</option>
                        <option value="房租">房租</option>
                        <option value="採購零件">採購零件</option>
                        <option value="水電費">水電費</option>
                      </>
                    ) : (
                      <>
                        <option value="雜收">雜收</option>
                        <option value="銷售收入">銷售收入</option>
                        <option value="佣金">佣金</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-600 font-medium mb-1.5 block">支付方式</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 bg-white"
                  >
                    <option value="現金">現金</option>
                    <option value="刷卡">刷卡</option>
                    <option value="LinePay">LinePay</option>
                    <option value="匯款">匯款</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 font-medium mb-1.5 block">金額 *</label>
                <input
                  type="number"
                  required
                  placeholder="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 font-medium mb-1.5 block">備註</label>
                <input
                  type="text"
                  placeholder="說明事項..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 border border-slate-200"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs bg-blue-600 text-white font-semibold"
                >
                  新增
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🪟 Modal 2: 明細檢視視窗 */}
      {detailModalType && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-800">
                {detailModalType === 'income' ? '收入詳細列表' : '支出詳細列表'}
              </h2>
              <button onClick={() => setDetailModalType(null)} className="text-slate-400 text-sm">
                ✕
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-2">
              {dailyTransactions
                .filter((t) => t.type === detailModalType)
                .map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50 rounded-xl flex justify-between items-center border border-slate-100 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-800">
                        {item.category} ({item.payment_method})
                      </p>
                      {item.note && <p className="text-slate-400 text-[11px]">{item.note}</p>}
                      <p className="text-slate-400 text-[10px]">{item.date}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`font-mono font-bold ${item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        ${Number(item.amount).toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleDeleteTransaction(item.id)}
                        className="px-2 py-1 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 text-[11px]"
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}