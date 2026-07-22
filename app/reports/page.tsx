'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

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

  // ✨ 修改 Modal 狀態與數據
  const [editingItem, setEditingItem] = useState<Transaction | null>(null);
  const [editFormData, setEditFormData] = useState({
    date: '',
    category: '雜支',
    paymentMethod: '現金',
    amount: '',
    note: '',
  });

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

  // ✨ 打開「修改」彈跳視窗並填入該筆資料現有內容
  const handleOpenEdit = (item: Transaction, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingItem(item);
    setEditFormData({
      date: item.date || selectedDate,
      category: item.category || '雜支',
      paymentMethod: item.payment_method || '現金',
      amount: item.amount ? item.amount.toString() : '0',
      note: item.note || '',
    });
  };

  // ✨ 儲存修改內容（包含銷售/交易日期）
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editFormData.amount || Number(editFormData.amount) <= 0) {
      alert('請輸入有效的金額！');
      return;
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          date: editFormData.date,
          category: editFormData.category,
          payment_method: editFormData.paymentMethod,
          amount: Number(editFormData.amount),
          note: editFormData.note,
        })
        .eq('id', editingItem.id);

      if (error) {
        alert(`修改失敗：${error.message}`);
      } else {
        alert('修改成功！');
        setEditingItem(null);
        fetchDailyTransactions();
        fetchPeriodTransactions();
      }
    } catch (err) {
      console.error('修改紀錄失敗：', err);
    }
  };

  // 刪除紀錄
  const handleDeleteTransaction = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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
              <span className="text-blue-700 font-medium">銷售與收入小計 (點擊看明細)</span>
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
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-700">
                      ${Number(item.amount).toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleOpenEdit(item, e)}
                      className="text-blue-600 hover:text-blue-800 font-semibold text-[11px] bg-white border border-blue-200 px-2 py-0.5 rounded shadow-sm"
                    >
                      修改
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteTransaction(item.id, e)}
                      className="text-rose-400 hover:text-rose-600 text-[11px] px-1"
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
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-rose-600">
                        -${Number(item.amount).toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleOpenEdit(item, e)}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-[11px] bg-white border border-blue-200 px-2 py-0.5 rounded shadow-sm"
                      >
                        修改
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTransaction(item.id, e)}
                        className="text-rose-400 hover:text-rose-600 text-[11px] px-1"
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
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 flex justify-between items-center">
            <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
              零用金 <span className="text-[10px] text-amber-600 font-normal">✏️ 點擊數字修改</span>
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
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-50/80 rounded-2xl p-4 text-center border border-slate-100">
            <p className="text-xs text-slate-400 font-medium mb-1">銷售金額</p>
            <p className="text-xl font-bold font-mono text-slate-800">
              ${periodSales.toLocaleString()}
            </p>
          </div>

          <div className="bg-purple-50/40 rounded-2xl p-4 text-center border border-purple-100">
            <p className="text-xs text-purple-600 font-medium mb-1">佣金</p>
            <p className="text-xl font-bold font-mono text-purple-600">
              ${periodCommission.toLocaleString()}
            </p>
          </div>

          <div className="bg-emerald-50/40 rounded-2xl p-4 text-center border border-emerald-100">
            <p className="text-xs text-emerald-600 font-medium mb-1">雜收</p>
            <p className="text-xl font-bold font-mono text-emerald-600">
              ${periodOtherIncome.toLocaleString()}
            </p>
          </div>

          <div className="bg-rose-50/40 rounded-2xl p-4 text-center border border-rose-100">
            <p className="text-xs text-rose-500 font-medium mb-1">雜支</p>
            <p className="text-xl font-bold font-mono text-rose-500">
              -${periodExpense.toLocaleString()}
            </p>
          </div>

          <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 text-center">
            <p className="text-xs text-emerald-700 font-bold mb-1">盈餘</p>
            <p className="text-xl font-bold font-mono text-emerald-600">
              ${periodProfit.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* 🪟 Modal 1: ✨ 編輯/修改紀錄 (優先層級 z-50) */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <span>✏️</span> 修改紀錄 ({editingItem.type === 'expense' ? '支出' : '收入'})
              </h2>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-600 text-base">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              {/* ✨ 銷售 / 紀錄日期選擇欄位 */}
              <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
                <label className="text-xs text-blue-800 font-bold mb-1.5 block">
                  📅 銷售 / 紀錄日期
                </label>
                <input
                  type="date"
                  required
                  value={editFormData.date}
                  onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                  className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 font-medium mb-1.5 block">類別</label>
                  <input
                    type="text"
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-600 font-medium mb-1.5 block">支付方式</label>
                  <select
                    value={editFormData.paymentMethod}
                    onChange={(e) => setEditFormData({ ...editFormData, paymentMethod: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 bg-white"
                  >
                    <option value="現金">現金</option>
                    <option value="刷卡">刷卡</option>
                    <option value="刷卡/分期">刷卡/分期</option>
                    <option value="無卡分期">無卡分期</option>
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
                  value={editFormData.amount}
                  onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 font-medium mb-1.5 block">備註</label>
                <input
                  type="text"
                  value={editFormData.note}
                  onChange={(e) => setEditFormData({ ...editFormData, note: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 border border-slate-200 hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm transition"
                >
                  儲存修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🪟 Modal 2: 新增支出 / 新增雜收 */}
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

      {/* 🪟 Modal 3: 明細檢視視窗 */}
      {detailModalType && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-40 p-4">
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

                    <div className="flex items-center gap-2">
                      <span className={`font-mono font-bold ${item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        ${Number(item.amount).toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleOpenEdit(item, e)}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-[11px] font-semibold"
                      >
                        修改
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTransaction(item.id, e)}
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