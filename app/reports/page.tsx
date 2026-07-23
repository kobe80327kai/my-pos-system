'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface SaleRecord {
  id: string;
  orderNo: string;
  date: string;
  totalAmount: number;
  profit: number;
  createdAt?: string;
  items: {
    name: string;
    price: number;
    quantity: number;
  }[];
}

interface RepairRecord {
  id: string;
  repairNo: string;
  date: string;
  cost: number;        // 委外維修支出
  price: number;       // 維修收款金額
  deviceModel: string;
  faultDesc: string;
  createdAt?: string;
}

interface TransactionRecord {
  id: string;
  type: 'expense' | 'income';
  category: string;
  paymentMethod: string;
  amount: number;
  remark: string;
  date: string;
  createdAt?: string;
}

export default function ReportsPage() {
  const [salesRecords, setSalesRecords] = useState<SaleRecord[]>([]);
  const [repairRecords, setRepairRecords] = useState<RepairRecord[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  
  const [cashBalance, setCashBalance] = useState<number>(40000);
  const [isEditingCash, setIsEditingCash] = useState(false);
  const [tempCash, setTempCash] = useState('40000');

  // 彈跳視窗狀態
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showSalesDetailModal, setShowSalesDetailModal] = useState(false);
  const [showExpenseDetailModal, setShowExpenseDetailModal] = useState(false);

  // 表單輸入狀態
  const [expenseCategory, setExpenseCategory] = useState('收機');
  const [expensePayment, setExpensePayment] = useState('現金');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseRemark, setExpenseRemark] = useState('');

  const [incomeCategory, setIncomeCategory] = useState('其他收入');
  const [incomePayment, setIncomePayment] = useState('現金');
  const [incomeAmount, setIncomeAmount] = useState<number>(0);
  const [incomeRemark, setIncomeRemark] = useState('');

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [reportFilterType, setReportFilterType] = useState<'month' | 'lastMonth' | 'custom'>('month');
  const [reportStartDate, setReportStartDate] = useState(`2026-06-30`);
  const [reportEndDate, setReportEndDate] = useState(getTodayStr());

  const fetchData = async () => {
    try {
      // 1. 抓取銷售紀錄
      const { data: salesData } = await supabase.from('sales_records').select('*').order('created_at', { ascending: false });
      if (salesData) {
        setSalesRecords(salesData.map((item: any) => ({
          id: item.id,
          orderNo: item.order_no,
          date: item.date,
          createdAt: item.created_at || item.date,
          items: typeof item.items === 'string' ? JSON.parse(item.items) : item.items,
          totalAmount: Number(item.total_amount),
          profit: Number(item.profit),
        })));
      }

      // 2. 抓取維修紀錄 (包含維修收款與委外維修支出)
      const { data: repairData, error: repairError } = await supabase.from('repairs').select('*').order('created_at', { ascending: false });
      if (!repairError && repairData) {
        setRepairRecords(repairData.map((item: any) => ({
          id: item.id,
          repairNo: item.repair_no || item.id.slice(0, 8),
          date: item.date || item.created_at?.split('T')[0] || getTodayStr(),
          cost: Number(item.cost || 0),         // 委外維修支出
          price: Number(item.price || 0),       // 維修收款金額
          deviceModel: item.device_model || item.deviceModel || '維修裝置',
          faultDesc: item.fault_desc || item.faultDesc || '維修服務',
          createdAt: item.created_at || item.date,
        })));
      }

      // 3. 抓取其他收支紀錄
      const { data: transData, error: transError } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
      if (!transError && transData) {
        setTransactions(transData.map((item: any) => ({
          id: item.id,
          type: item.type,
          category: item.category,
          paymentMethod: item.payment_method,
          amount: Number(item.amount),
          remark: item.remark,
          date: item.date,
          createdAt: item.created_at || item.date,
        })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 新增支出
  const handleAddExpense = async () => {
    if (!expenseAmount || expenseAmount <= 0) return alert('請輸入有效金額');
    const newRecord = {
      type: 'expense',
      category: expenseCategory,
      payment_method: expensePayment,
      amount: expenseAmount,
      remark: expenseRemark,
      date: selectedDate
    };

    const { error } = await supabase.from('transactions').insert([newRecord]);
    if (error) {
      alert('新增失敗，請檢查 Supabase 資料表 transactions 是否建立');
      console.error(error);
    } else {
      setShowExpenseModal(false);
      setExpenseAmount(0);
      setExpenseRemark('');
      fetchData();
    }
  };

  // 新增雜收
  const handleAddIncome = async () => {
    if (!incomeAmount || incomeAmount <= 0) return alert('請輸入有效金額');
    const newRecord = {
      type: 'income',
      category: incomeCategory,
      payment_method: incomePayment,
      amount: incomeAmount,
      remark: incomeRemark,
      date: selectedDate
    };

    const { error } = await supabase.from('transactions').insert([newRecord]);
    if (error) {
      alert('新增失敗，請檢查 Supabase 資料表 transactions 是否建立');
      console.error(error);
    } else {
      setShowIncomeModal(false);
      setIncomeAmount(0);
      setIncomeRemark('');
      fetchData();
    }
  };

  // 當日過濾資料
  const currentDaySales = salesRecords.filter(r => r.date === selectedDate);
  const currentDayRepairs = repairRecords.filter(r => r.date === selectedDate);
  const currentDayTrans = transactions.filter(t => t.date === selectedDate);

  const currentDaySalesTotal = currentDaySales.reduce((sum, r) => sum + r.totalAmount, 0);
  const currentDayRepairIncomeTotal = currentDayRepairs.reduce((sum, r) => sum + r.price, 0);
  const currentDayOtherIncomeTotal = currentDayTrans.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = currentDaySalesTotal + currentDayRepairIncomeTotal + currentDayOtherIncomeTotal;

  // 支出計算 (雜支 + 委外維修支出)
  const currentDayRepairCostTotal = currentDayRepairs.reduce((sum, r) => sum + r.cost, 0);
  const currentDayExpenseTrans = currentDayTrans.filter(t => t.type === 'expense');
  const currentDayExpenseTransTotal = currentDayExpenseTrans.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = currentDayRepairCostTotal + currentDayExpenseTransTotal;

  const netIncome = totalIncome - totalExpense;

  // 款項結算 (現金、轉帳、其他)
  const getPaymentTotal = (method: string) => {
    const cashSales = method === '現金' ? currentDaySalesTotal + currentDayRepairIncomeTotal : 0;
    const transSum = currentDayTrans
      .filter(t => t.paymentMethod === method)
      .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
    const repairCostSub = method === '現金' ? currentDayRepairCostTotal : 0;
    return cashSales + transSum - repairCostSub;
  };

  const cashTotal = getPaymentTotal('現金');
  const transferTotal = getPaymentTotal('轉帳');
  const otherTotal = getPaymentTotal('其他');

  // 盈餘報表區間計算
  const reportSales = salesRecords.filter(r => r.date >= reportStartDate && r.date <= reportEndDate);
  const reportRepairs = repairRecords.filter(r => r.date >= reportStartDate && r.date <= reportEndDate);
  const reportTrans = transactions.filter(t => t.date >= reportStartDate && t.date <= reportEndDate);

  const reportTotalSales = reportSales.reduce((sum, r) => sum + r.totalAmount, 0) + reportRepairs.reduce((sum, r) => sum + r.price, 0);
  const reportTotalCommission = reportSales.reduce((sum, r) => {
    const planItem = r.items.find(i => i.name.includes('方案'));
    return sum + (planItem ? r.profit : 0);
  }, 0) + reportTrans.filter(t => t.type === 'income' && t.category === '傭金收入').reduce((sum, t) => sum + t.amount, 0);

  const reportOtherIncome = reportTrans.filter(t => t.type === 'income' && t.category !== '傭金收入').reduce((sum, t) => sum + t.amount, 0);
  const reportExpense = reportRepairs.reduce((sum, r) => sum + r.cost, 0) + reportTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const reportTotalProfit = reportTotalSales + reportOtherIncome - reportExpense;

  return (
    <div className="p-8 space-y-6 bg-slate-100 min-h-screen relative">
      {/* 頂部日期與快捷按鈕 */}
      <div className="flex justify-between items-center bg-white rounded-3xl p-4 shadow-sm border border-slate-200/60">
        <div className="flex items-center gap-3">
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-700"
          />
          <button 
            onClick={() => setSelectedDate(getTodayStr())} 
            className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-medium transition"
          >
            今天
          </button>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowExpenseModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-medium shadow-sm transition">
            + 新增支出
          </button>
          <button onClick={() => setShowIncomeModal(true)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-medium transition">
            + 新增雜收
          </button>
        </div>
      </div>

      {/* 頂部淨收入 */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-2 h-10 bg-emerald-500 rounded-full"></div>
          <div>
            <span className="text-xs text-slate-400 font-medium">今日淨收入</span>
            <h2 className={`text-3xl font-mono font-bold mt-0.5 ${netIncome >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>${netIncome.toLocaleString()}</h2>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-emerald-50/60 px-5 py-3 rounded-2xl border border-emerald-100 text-right">
            <span className="text-xs text-emerald-600 font-medium">總收入</span>
            <p className="text-lg font-mono font-bold text-emerald-600">${totalIncome.toLocaleString()}</p>
          </div>
          <div className="bg-rose-50/60 px-5 py-3 rounded-2xl border border-rose-100 text-right">
            <span className="text-xs text-rose-500 font-medium">總支出</span>
            <p className="text-lg font-mono font-bold text-rose-500">${totalExpense.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* 收入明細與支出區塊 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 收入明細 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-800 flex items-center gap-2">📝 收入明細</span>
            <span className="text-xs font-mono font-bold text-emerald-600">${totalIncome.toLocaleString()}</span>
          </div>
          <div className="space-y-2">
            <div 
              onClick={() => setShowSalesDetailModal(true)}
              className="bg-slate-50 hover:bg-slate-100 cursor-pointer rounded-2xl p-3.5 flex justify-between items-center text-xs transition"
            >
              <span className="text-blue-600 font-medium">銷售與收入小計 (點擊看明細)</span>
              <span className="font-mono font-bold text-slate-700">{currentDaySales.length + currentDayRepairs.length} 筆 <span className="text-blue-600 ml-1">${(currentDaySalesTotal + currentDayRepairIncomeTotal).toLocaleString()}</span></span>
            </div>
            {currentDayTrans.filter(t => t.type === 'income').map((t, idx) => (
              <div key={idx} className="bg-emerald-50/40 rounded-2xl p-3.5 flex justify-between items-center text-xs border border-emerald-100">
                <span className="text-emerald-700 font-medium">{t.category} ({t.remark || '無備註'})</span>
                <span className="font-mono font-bold text-emerald-600">+${t.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 支出區塊 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-800 flex items-center gap-2">📉 支出明細</span>
            <span className="text-xs font-mono font-bold text-rose-500">${totalExpense.toLocaleString()}</span>
          </div>
          {totalExpense === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-8 text-center text-xs text-slate-400">今日無支出記錄</div>
          ) : (
            <div className="space-y-2">
              <div 
                onClick={() => setShowExpenseDetailModal(true)}
                className="bg-slate-50 hover:bg-slate-100 cursor-pointer rounded-2xl p-3.5 flex justify-between items-center text-xs transition"
              >
                <span className="text-rose-600 font-medium">支出與委外維修小計 (點擊看明細)</span>
                <span className="font-mono font-bold text-slate-700">{currentDayRepairs.filter(r => r.cost > 0).length + currentDayExpenseTrans.length} 筆 <span className="text-rose-600 ml-1">-${totalExpense.toLocaleString()}</span></span>
              </div>
              {currentDayRepairs.filter(r => r.cost > 0).map((r, idx) => (
                <div key={`rep-${idx}`} className="bg-rose-50/40 rounded-2xl p-3.5 flex justify-between items-center text-xs border border-rose-100">
                  <span className="text-rose-700 font-medium">委外維修支出 ({r.deviceModel} - {r.repairNo})</span>
                  <span className="font-mono font-bold text-rose-600">-${r.cost.toLocaleString()}</span>
                </div>
              ))}
              {currentDayExpenseTrans.map((t, idx) => (
                <div key={`trans-${idx}`} className="bg-rose-50/40 rounded-2xl p-3.5 flex justify-between items-center text-xs border border-rose-100">
                  <span className="text-rose-700 font-medium">{t.category} ({t.remark || '無備註'}) - {t.paymentMethod}</span>
                  <span className="font-mono font-bold text-rose-600">-${t.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 款項結算 */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
        <span className="text-sm font-bold text-slate-800 flex items-center gap-2">💳 款項結算</span>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100/50 space-y-1">
            <span className="text-xs text-slate-500 font-medium">現金</span>
            <p className="text-lg font-mono font-bold text-slate-800">${cashTotal.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-xs text-slate-500 font-medium">轉帳</span>
            <p className="text-lg font-mono font-bold text-slate-800">${transferTotal.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-xs text-slate-500 font-medium">其他</span>
            <p className="text-lg font-mono font-bold text-slate-800">${otherTotal.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/60 flex justify-between items-center">
            <div>
              <span className="text-xs text-amber-700 font-medium">零用金</span>
              {isEditingCash ? (
                <div className="flex items-center gap-2 mt-1">
                  <input type="text" value={tempCash} onChange={(e) => setTempCash(e.target.value)} className="bg-white border border-amber-300 rounded px-2 py-1 text-sm font-mono w-28" />
                  <button onClick={() => { setCashBalance(Number(tempCash) || 0); setIsEditingCash(false); }} className="bg-amber-600 text-white px-3 py-1 rounded text-xs">儲存</button>
                </div>
              ) : (
                <p className="text-xl font-mono font-bold text-amber-700 mt-0.5">${cashBalance.toLocaleString()}</p>
              )}
            </div>
            {!isEditingCash && (
              <button onClick={() => setIsEditingCash(true)} className="text-xs text-amber-700 bg-amber-100/80 px-3 py-1.5 rounded-xl font-medium hover:bg-amber-200">
                ✏️ 點擊數字修改
              </button>
            )}
          </div>

          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/60 flex justify-between items-center">
            <div>
              <span className="text-xs text-emerald-700 font-medium">本日結算</span>
              <p className={`text-xl font-mono font-bold mt-0.5 ${(cashBalance + netIncome) >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>${(cashBalance + netIncome).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 盈餘報表區塊 */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <span className="text-sm font-bold text-slate-800">📊 盈餘報表</span>
          <div className="flex items-center gap-3">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              <button onClick={() => { setReportFilterType('month'); setReportStartDate('2026-06-30'); setReportEndDate(getTodayStr()); }} className={`px-3 py-1.5 rounded-lg font-medium ${reportFilterType === 'month' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>本月</button>
              <button onClick={() => { setReportFilterType('lastMonth'); setReportStartDate('2026-06-01'); setReportEndDate('2026-06-30'); }} className={`px-3 py-1.5 rounded-lg font-medium ${reportFilterType === 'lastMonth' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>上月</button>
              <button onClick={() => setReportFilterType('custom')} className={`px-3 py-1.5 rounded-lg font-medium ${reportFilterType === 'custom' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>自訂</button>
            </div>
            <input type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700" />
            <span className="text-slate-400">~</span>
            <input type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700" />
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-xs text-slate-400 font-medium">銷售與維修金額</span>
            <p className="text-xl font-mono font-bold text-slate-800">${reportTotalSales.toLocaleString()}</p>
          </div>
          <div className="p-5 bg-purple-50/40 rounded-2xl border border-purple-100/50 space-y-1">
            <span className="text-xs text-purple-600 font-medium">傭金</span>
            <p className="text-xl font-mono font-bold text-purple-600">${reportTotalCommission.toLocaleString()}</p>
          </div>
          <div className="p-5 bg-emerald-50/40 rounded-2xl border border-emerald-100/50 space-y-1">
            <span className="text-xs text-emerald-600 font-medium">雜收</span>
            <p className="text-xl font-mono font-bold text-emerald-600">${reportOtherIncome.toLocaleString()}</p>
          </div>
          <div className="p-5 bg-rose-50/40 rounded-2xl border border-rose-100/50 space-y-1">
            <span className="text-xs text-rose-500 font-medium">雜支與委外維修</span>
            <p className="text-xl font-mono font-bold text-rose-500">-${reportExpense.toLocaleString()}</p>
          </div>
          <div className="p-5 bg-emerald-50/60 rounded-2xl border-2 border-emerald-500/40 space-y-1 shadow-sm">
            <span className="text-xs text-emerald-700 font-bold">盈餘</span>
            <p className="text-2xl font-mono font-bold text-emerald-600">${reportTotalProfit.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* 銷售與維修收入逐筆明細彈跳視窗 */}
      {showSalesDetailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 w-[700px] max-h-[80vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-800">全部銷售與維修收入 —— 逐筆明細 ({currentDaySales.length + currentDayRepairs.length} 筆)</h3>
              <button onClick={() => setShowSalesDetailModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-12 text-xs font-bold text-slate-400 px-3">
                <span className="col-span-2">時間</span>
                <span className="col-span-3">單號</span>
                <span className="col-span-5">收入內容</span>
                <span className="col-span-2 text-right">金額</span>
              </div>
              {currentDaySales.map((s, i) => (
                <div key={`s-${i}`} className="grid grid-cols-12 items-center bg-slate-50 rounded-2xl p-3 text-xs">
                  <span className="col-span-2 text-slate-500 font-mono">{s.createdAt ? s.createdAt.slice(11, 16) : '----'}</span>
                  <span className="col-span-3 text-slate-700 font-mono font-medium">{s.orderNo}</span>
                  <span className="col-span-5 text-slate-800">{s.items.map(i => `${i.name} x${i.quantity}`).join('、')}</span>
                  <span className="col-span-2 text-right font-mono font-bold text-emerald-600">+${s.totalAmount.toLocaleString()}</span>
                </div>
              ))}
              {currentDayRepairs.map((r, i) => (
                <div key={`r-${i}`} className="grid grid-cols-12 items-center bg-emerald-50/30 rounded-2xl p-3 text-xs border border-emerald-100">
                  <span className="col-span-2 text-slate-500 font-mono">{r.createdAt ? r.createdAt.slice(11, 16) : '----'}</span>
                  <span className="col-span-3 text-slate-700 font-mono font-medium">{r.repairNo}</span>
                  <span className="col-span-5 text-slate-800">維修收款：{r.deviceModel} ({r.faultDesc})</span>
                  <span className="col-span-2 text-right font-mono font-bold text-emerald-600">+${r.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 flex justify-between items-center text-sm font-bold">
              <span>合計</span>
              <span className="font-mono text-emerald-600">+${(currentDaySalesTotal + currentDayRepairIncomeTotal).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* 支出與委外維修逐筆明細彈跳視窗 */}
      {showExpenseDetailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 w-[700px] max-h-[80vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-800">全部支出與委外維修 —— 逐筆明細</h3>
              <button onClick={() => setShowExpenseDetailModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-12 text-xs font-bold text-slate-400 px-3">
                <span className="col-span-2">時間</span>
                <span className="col-span-3">類別 / 單號</span>
                <span className="col-span-5">說明 / 備註</span>
                <span className="col-span-2 text-right">金額</span>
              </div>
              {currentDayRepairs.filter(r => r.cost > 0).map((r, i) => (
                <div key={`rcost-${i}`} className="grid grid-cols-12 items-center bg-rose-50/30 rounded-2xl p-3 text-xs border border-rose-100">
                  <span className="col-span-2 text-slate-500 font-mono">{r.createdAt ? r.createdAt.slice(11, 16) : '----'}</span>
                  <span className="col-span-3 text-rose-700 font-mono font-medium">委外維修</span>
                  <span className="col-span-5 text-slate-800">{r.deviceModel} ({r.repairNo})</span>
                  <span className="col-span-2 text-right font-mono font-bold text-rose-600">-${r.cost.toLocaleString()}</span>
                </div>
              ))}
              {currentDayExpenseTrans.map((t, i) => (
                <div key={`texp-${i}`} className="grid grid-cols-12 items-center bg-rose-50/30 rounded-2xl p-3 text-xs border border-rose-100">
                  <span className="col-span-2 text-slate-500 font-mono">{t.createdAt ? t.createdAt.slice(11, 16) : '----'}</span>
                  <span className="col-span-3 text-rose-700 font-mono font-medium">{t.category} ({t.paymentMethod})</span>
                  <span className="col-span-5 text-slate-800">{t.remark || '無備註'}</span>
                  <span className="col-span-2 text-right font-mono font-bold text-rose-600">-${t.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 flex justify-between items-center text-sm font-bold">
              <span>合計</span>
              <span className="font-mono text-rose-600">-${totalExpense.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* 新增支出彈跳視窗 */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 w-96 space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-800">新增支出記錄</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 font-medium">類別</label>
                <select value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2 text-sm">
                  <option value="收機">收機</option>
                  <option value="進貨">進貨</option>
                  <option value="房租">房租</option>
                  <option value="水電">水電</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">支付方式</label>
                <select value={expensePayment} onChange={(e) => setExpensePayment(e.target.value)} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2 text-sm">
                  <option value="現金">現金</option>
                  <option value="轉帳">轉帳</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">金額 *</label>
                <input type="number" value={expenseAmount || ''} onChange={(e) => setExpenseAmount(Number(e.target.value))} placeholder="0" className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2 text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">說明 (備註)</label>
                <input type="text" value={expenseRemark} onChange={(e) => setExpenseRemark(e.target.value)} placeholder="例：三月份房租..." className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2 text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowExpenseModal(false)} className="px-4 py-2 text-xs rounded-xl bg-slate-100 text-slate-600">取消</button>
              <button onClick={handleAddExpense} className="px-4 py-2 text-xs rounded-xl bg-blue-600 text-white font-medium">新增</button>
            </div>
          </div>
        </div>
      )}

      {/* 新增雜收彈跳視窗 */}
      {showIncomeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 w-96 space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-800">新增雜收記錄</h3>
              <button onClick={() => setShowIncomeModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 font-medium">類別</label>
                <select value={incomeCategory} onChange={(e) => setIncomeCategory(e.target.value)} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2 text-sm">
                  <option value="其他收入">其他收入</option>
                  <option value="零用金調入">零用金調入</option>
                  <option value="傭金收入">傭金收入</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">支付方式</label>
                <select value={incomePayment} onChange={(e) => setIncomePayment(e.target.value)} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2 text-sm">
                  <option value="現金">現金</option>
                  <option value="轉帳">轉帳</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">金額 *</label>
                <input type="number" value={incomeAmount || ''} onChange={(e) => setIncomeAmount(Number(e.target.value))} placeholder="0" className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2 text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">說明 (備註)</label>
                <input type="text" value={incomeRemark} onChange={(e) => setIncomeRemark(e.target.value)} placeholder="例：額外收入..." className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2 text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowIncomeModal(false)} className="px-4 py-2 text-xs rounded-xl bg-slate-100 text-slate-600">取消</button>
              <button onClick={handleAddIncome} className="px-4 py-2 text-xs rounded-xl bg-blue-600 text-white font-medium">新增</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
