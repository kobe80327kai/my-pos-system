'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface RecordItem {
  id: string;
  date: string;
  amount: number;
  cost: number;
  paymentMethod: string;
  title: string;
  type: 'sale' | 'repair' | 'income' | 'expense';
}

export default function ReportsPage() {
  const [allRecords, setAllRecords] = useState<RecordItem[]>([]);
  const [cashBalance, setCashBalance] = useState<number>(40000);
  
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showSalesDetailModal, setShowSalesDetailModal] = useState(false);

  const [expenseCategory, setExpenseCategory] = useState('雜支');
  const [expensePayment, setExpensePayment] = useState('現金');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseRemark, setExpenseRemark] = useState('');

  const [incomeCategory, setIncomeCategory] = useState('雜收');
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
  const [reportFilterType, setReportFilterType] = useState<'month' | 'custom'>('month');
  const [reportStartDate, setReportStartDate] = useState('2026-06-30');
  const [reportEndDate, setReportEndDate] = useState(getTodayStr());

  const fetchAllData = async () => {
    let combined: RecordItem[] = [];

    try {
      // 1. 抓取 sales_records
      const { data: sales } = await supabase.from('sales_records').select('*');
      if (sales) {
        sales.forEach((s: any) => {
          const d = (s.date || s.created_at || getTodayStr()).substring(0, 10);
          const amt = Number(s.total_amount || s.totalAmount || s.price || 0);
          combined.push({
            id: s.id,
            date: d,
            amount: amt,
            cost: Number(s.cost || 0),
            paymentMethod: s.payment_method || s.paymentMethod || '現金',
            title: s.order_no || s.orderNo || '銷售訂單',
            type: 'sale'
          });
        });
      }

      // 2. 嘗試多個可能名稱的維修資料表
      const repairTables = ['repairs', 'repair_records', 'repair', 'orders', 'maintenance'];
      for (const tName of repairTables) {
        const { data: repairs } = await supabase.from(tName).select('*');
        if (repairs && repairs.length > 0) {
          repairs.forEach((r: any) => {
            const d = (r.date || r.created_at || r.updated_at || getTodayStr()).substring(0, 10);
            const amt = Number(r.price || r.total_price || r.totalPrice || r.amount || r.repair_price || r.cost || 0);
            const costVal = Number(r.cost || r.outsource_cost || 0);
            const pm = r.payment_method || r.paymentMethod || r.pay_method || '現金';
            const titleVal = r.repair_no || r.repairNo || r.device_model || r.deviceModel || r.model || '維修服務';
            combined.push({
              id: r.id,
              date: d,
              amount: amt,
              cost: costVal,
              paymentMethod: pm,
              title: titleVal,
              type: 'repair'
            });
          });
          break; // 找到一個有資料的就停
        }
      }

      // 3. 抓取 transactions (收支)
      const { data: trans } = await supabase.from('transactions').select('*');
      if (trans) {
        trans.forEach((tr: any) => {
          const d = (tr.date || tr.created_at || getTodayStr()).substring(0, 10);
          const amt = Number(tr.amount || 0);
          const tType = tr.type === 'expense' ? 'expense' : 'income';
          combined.push({
            id: tr.id,
            date: d,
            amount: amt,
            cost: 0,
            paymentMethod: tr.payment_method || tr.paymentMethod || '現金',
            title: tr.remark || tr.category || (tType === 'expense' ? '雜支' : '雜收'),
            type: tType
          });
        });
      }

      setAllRecords(combined);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleAddExpense = async () => {
    if (!expenseAmount || expenseAmount <= 0) {
      alert('請輸入有效金額');
      return;
    }
    const { error } = await supabase.from('transactions').insert([{
      type: 'expense',
      category: expenseCategory,
      payment_method: expensePayment,
      amount: expenseAmount,
      remark: expenseRemark,
      date: selectedDate
    }]);
    if (error) alert('失敗: ' + error.message);
    else {
      setShowExpenseModal(false);
      setExpenseAmount(0);
      setExpenseRemark('');
      fetchAllData();
    }
  };

  const handleAddIncome = async () => {
    if (!incomeAmount || incomeAmount <= 0) {
      alert('請輸入有效金額');
      return;
    }
    const { error } = await supabase.from('transactions').insert([{
      type: 'income',
      category: incomeCategory,
      payment_method: incomePayment,
      amount: incomeAmount,
      remark: incomeRemark,
      date: selectedDate
    }]);
    if (error) alert('失敗: ' + error.message);
    else {
      setShowIncomeModal(false);
      setIncomeAmount(0);
      setIncomeRemark('');
      fetchAllData();
    }
  };

  // 當日資料篩選
  const dayRecords = allRecords.filter(r => r.date === selectedDate);

  const daySalesAndRepairs = dayRecords.filter(r => r.type === 'sale' || r.type === 'repair');
  const daySalesTotal = daySalesAndRepairs.reduce((sum, r) => sum + r.amount, 0);
  const dayOtherIncome = dayRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
  const totalIncome = daySalesTotal + dayOtherIncome;

  const dayExpenses = dayRecords.filter(r => r.type === 'expense' || r.type === 'repair');
  const totalExpense = dayRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0) + dayRecords.filter(r => r.type === 'repair').reduce((sum, r) => sum + r.cost, 0);

  const netIncome = totalIncome - totalExpense;

  const getPayStats = (method: string) => {
    const matched = dayRecords.filter(r => r.paymentMethod === method);
    const inc = matched.filter(r => r.type === 'sale' || r.type === 'repair' || r.type === 'income').reduce((s, r) => s + r.amount, 0);
    const exp = matched.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
    return { total: inc - exp, count: matched.length };
  };

  const cashStats = getPayStats('現金');
  const cardStats = getPayStats('刷卡');
  const cardInstStats = getPayStats('刷卡/分期');
  const noCardStats = getPayStats('無卡分期');
  const linePayStats = getPayStats('LinePay');
  const transferStats = getPayStats('匯款');

  // 區間報表計算（移除佣金）
  const rangeRecords = allRecords.filter(r => r.date >= reportStartDate && r.date <= reportEndDate);
  const rangeSalesTotal = rangeRecords.filter(r => r.type === 'sale' || r.type === 'repair').reduce((s, r) => s + r.amount, 0);
  const rangeOtherIncome = rangeRecords.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
  const rangeExpenseTotal = rangeRecords.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0) + rangeRecords.filter(r => r.type === 'repair').reduce((s, r) => s + r.cost, 0);
  const rangeNetProfit = rangeSalesTotal + rangeOtherIncome - rangeExpenseTotal;

  return (
    <div className="p-8 space-y-6 bg-slate-100 min-h-screen relative">
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
        <div className="flex items-center gap-3">
          <button onClick={() => setShowExpenseModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm">+ 新增支出</button>
          <button onClick={() => setShowIncomeModal(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm">+ 新增雜收</button>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-2 h-10 bg-emerald-500 rounded-full"></div>
          <div>
            <span className="text-xs text-slate-400 font-medium">今日淨收入</span>
            <h2 className={`text-3xl font-mono font-bold mt-0.5 ${netIncome >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
              ${netIncome.toLocaleString()}
            </h2>
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

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-800">📝 收入明細</span>
            <span className="text-xs font-mono font-bold text-emerald-600">${totalIncome.toLocaleString()}</span>
          </div>
          <div 
            onClick={() => setShowSalesDetailModal(true)}
            className="bg-slate-50 hover:bg-slate-100 cursor-pointer rounded-2xl p-3.5 flex justify-between items-center text-xs transition"
          >
            <span className="text-blue-600 font-medium">銷售與維修收入小計 (點擊看明細)</span>
            <span className="font-mono font-bold text-slate-700">{daySalesAndRepairs.length} 筆 <span className="text-blue-600 ml-1">${daySalesTotal.toLocaleString()}</span></span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-800">支 出 (雜支)</span>
            <span className="text-xs font-mono font-bold text-rose-500">${totalExpense.toLocaleString()}</span>
          </div>
          <div className="bg-slate-50 rounded-2xl p-3.5 flex justify-between items-center text-xs">
            <span className="text-slate-600 font-medium">支出項目總計</span>
            <span className="font-mono font-bold text-rose-500">${totalExpense.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
        <span className="text-sm font-bold text-slate-800">💳 款項結算</span>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50 space-y-1">
            <span className="text-xs text-slate-500 font-medium">現金</span>
            <p className="text-xl font-mono font-bold text-slate-800">${cashStats.total.toLocaleString()}</p>
            <span className="text-[10px] text-slate-400">{cashStats.count} 筆</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-xs text-slate-500 font-medium">刷卡</span>
            <p className="text-xl font-mono font-bold text-slate-800">${cardStats.total.toLocaleString()}</p>
            <span className="text-[10px] text-slate-400">{cardStats.count} 筆</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-xs text-slate-500 font-medium">刷卡/分期</span>
            <p className="text-xl font-mono font-bold text-slate-800">${cardInstStats.total.toLocaleString()}</p>
            <span className="text-[10px] text-slate-400">{cardInstStats.count} 筆</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-xs text-slate-500 font-medium">無卡分期</span>
            <p className="text-xl font-mono font-bold text-slate-800">${noCardStats.total.toLocaleString()}</p>
            <span className="text-[10px] text-slate-400">{noCardStats.count} 筆</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-xs text-slate-500 font-medium">LinePay</span>
            <p className="text-xl font-mono font-bold text-slate-800">${linePayStats.total.toLocaleString()}</p>
            <span className="text-[10px] text-slate-400">{linePayStats.count} 筆</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-xs text-slate-500 font-medium">匯款</span>
            <p className="text-xl font-mono font-bold text-slate-800">${transferStats.total.toLocaleString()}</p>
            <span className="text-[10px] text-slate-400">{transferStats.count} 筆</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="p-4 bg-amber-50/40 rounded-2xl border border-amber-100">
            <span className="text-xs text-amber-700 font-medium">零用金</span>
            <p className="text-xl font-mono font-bold text-amber-800">${cashBalance.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100">
            <span className="text-xs text-emerald-700 font-medium">本日結算</span>
            <p className="text-xl font-mono font-bold text-emerald-800">${(cashBalance + cashStats.total).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-slate-800">📊 盈餘報表</span>
          <div className="flex items-center gap-2">
            <button onClick={() => { setReportFilterType('month'); setReportStartDate('2026-06-30'); setReportEndDate(getTodayStr()); }} className={`px-3 py-1.5 rounded-xl text-xs font-medium ${reportFilterType === 'month' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>本月</button>
            <button onClick={() => setReportFilterType('custom')} className={`px-3 py-1.5 rounded-xl text-xs font-medium ${reportFilterType === 'custom' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>自訂</button>
            <input type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs" />
            <span>~</span>
            <input type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs" />
          </div>
        </div>

        {/* 移除佣金，改為 4 個欄位均分 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl text-center space-y-1">
            <span className="text-xs text-slate-500">銷售金額</span>
            <p className="text-lg font-mono font-bold text-slate-800">${rangeSalesTotal.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl text-center space-y-1">
            <span className="text-xs text-slate-500">雜收</span>
            <p className="text-lg font-mono font-bold text-slate-800">${rangeOtherIncome.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl text-center space-y-1">
            <span className="text-xs text-slate-500">雜支</span>
            <p className="text-lg font-mono font-bold text-rose-500">-${rangeExpenseTotal.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl text-center space-y-1">
            <span className="text-xs text-emerald-700 font-medium">盈餘</span>
            <p className="text-lg font-mono font-bold text-emerald-600">${rangeNetProfit.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 w-[450px] space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-800">新增支出紀錄</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500">支出類別</label>
                <input type="text" value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)} className="w-full mt-1 bg-slate-50 border rounded-xl p-2.5" />
              </div>
              <div>
                <label className="text-slate-500">支付方式</label>
                <select value={expensePayment} onChange={(e) => setExpensePayment(e.target.value)} className="w-full mt-1 bg-slate-50 border rounded-xl p-2.5">
                  <option value="現金">現金</option>
                  <option value="刷卡">刷卡</option>
                  <option value="刷卡/分期">刷卡/分期</option>
                  <option value="無卡分期">無卡分期</option>
                  <option value="LinePay">LinePay</option>
                  <option value="匯款">匯款</option>
                </select>
              </div>
              <div>
                <label className="text-slate-500">金額</label>
                <input type="number" value={expenseAmount || ''} onChange={(e) => setExpenseAmount(Number(e.target.value))} className="w-full mt-1 bg-slate-50 border rounded-xl p-2.5 font-mono" />
              </div>
              <div>
                <label className="text-slate-500">備註說明</label>
                <input type="text" value={expenseRemark} onChange={(e) => setExpenseRemark(e.target.value)} className="w-full mt-1 bg-slate-50 border rounded-xl p-2.5" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t">
              <button onClick={() => setShowExpenseModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl text-xs">取消</button>
              <button onClick={handleAddExpense} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">確定新增</button>
            </div>
          </div>
        </div>
      )}

      {showIncomeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 w-[450px] space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-800">新增雜收紀錄</h3>
              <button onClick={() => setShowIncomeModal(false)} className="text-slate-400">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500">收入類別</label>
                <input type="text" value={incomeCategory} onChange={(e) => setIncomeCategory(e.target.value)} className="w-full mt-1 bg-slate-50 border rounded-xl p-2.5" />
              </div>
              <div>
                <label className="text-slate-500">收款方式</label>
                <select value={incomePayment} onChange={(e) => setIncomePayment(e.target.value)} className="w-full mt-1 bg-slate-50 border rounded-xl p-2.5">
                  <option value="現金">現金</option>
                  <option value="刷卡">刷卡</option>
                  <option value="刷卡/分期">刷卡/分期</option>
                  <option value="無卡分期">無卡分期</option>
                  <option value="LinePay">LinePay</option>
                  <option value="匯款">匯款</option>
                </select>
              </div>
              <div>
                <label className="text-slate-500">金額</label>
                <input type="number" value={incomeAmount || ''} onChange={(e) => setIncomeAmount(Number(e.target.value))} className="w-full mt-1 bg-slate-50 border rounded-xl p-2.5 font-mono" />
              </div>
              <div>
                <label className="text-slate-500">備註說明</label>
                <input type="text" value={incomeRemark} onChange={(e) => setIncomeRemark(e.target.value)} className="w-full mt-1 bg-slate-50 border rounded-xl p-2.5" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t">
              <button onClick={() => setShowIncomeModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl text-xs">取消</button>
              <button onClick={handleAddIncome} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">確定新增</button>
            </div>
          </div>
        </div>
      )}

      {showSalesDetailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 w-[700px] max-h-[80vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-800">銷售與維修收入明細</h3>
              <button onClick={() => setShowSalesDetailModal(false)} className="text-slate-400">✕</button>
            </div>
            <div className="space-y-2">
              {daySalesAndRepairs.map((r, i) => (
                <div key={i} className="grid grid-cols-12 items-center bg-slate-50 rounded-2xl p-3 text-xs border border-slate-100">
                  <span className="col-span-3 text-slate-700 font-mono font-medium">{r.title}</span>
                  <span className="col-span-7 text-slate-800">支付方式：{r.paymentMethod} ({r.type === 'repair' ? '維修' : '銷售'})</span>
                  <span className="col-span-2 text-right font-mono font-bold text-emerald-600">+${r.amount.toLocaleString()}</span>
                </div>
              ))}
              {daySalesAndRepairs.length === 0 && (
                <p className="text-center text-slate-400 text-xs py-4">本日尚無銷售與維修記錄</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
