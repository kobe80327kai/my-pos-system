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
  cost: number;        
  price: number;       
  deviceModel: string;
  faultDesc: string;
  paymentMethod: string;
  status: string;
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

  // 表單輸入狀態
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
          orderNo: item.order_no || item.orderNo || 'ORD',
          date: item.date || item.created_at?.split('T')[0] || getTodayStr(),
          createdAt: item.created_at || item.date,
          items: typeof item.items === 'string' ? JSON.parse(item.items) : (item.items || []),
          totalAmount: Number(item.total_amount || item.totalAmount || 0),
          profit: Number(item.profit || 0),
        })));
      }

      // 2. 自動從多個可能表格抓取維修紀錄
      let rawRepairs: any[] = [];
      const tablesToTry = ['repairs', 'repair_records', 'orders', 'repair'];
      for (const tableName of tablesToTry) {
        const { data } = await supabase.from(tableName).select('*');
        if (data && data.length > 0) {
          rawRepairs = data;
          break;
        }
      }

      if (rawRepairs.length > 0) {
        setRepairRecords(rawRepairs.map((item: any) => {
          const priceVal = Number(
            item.price ?? item.total_price ?? item.totalPrice ?? item.amount ?? item.repair_price ?? item.repairPrice ?? item.cost ?? 0
          );
          const costVal = Number(item.cost || item.outsource_cost || item.outsourceCost || 0);
          const repairNoVal = item.repair_no || item.repairNo || item.order_no || item.id?.slice(0, 8) || 'REP';
          const dateVal = item.date || item.created_at?.split('T')[0] || item.updated_at?.split('T')[0] || getTodayStr();
          const deviceVal = item.device_model || item.deviceModel || item.model || item.name || '維修裝置';
          const faultVal = item.fault_desc || item.faultDesc || item.description || '維修服務';
          const paymentVal = item.payment_method || item.paymentMethod || item.pay_method || '現金';
          const statusVal = item.status || item.repair_status || '';

          return {
            id: item.id,
            repairNo: repairNoVal,
            date: dateVal,
            cost: costVal,
            price: priceVal,
            deviceModel: deviceVal,
            faultDesc: faultVal,
            paymentMethod: paymentVal,
            status: statusVal,
            createdAt: item.created_at || dateVal,
          };
        }));
      }

      // 3. 抓取其他收支紀錄
      const { data: transData } = await supabase.from('transactions').select('*');
      if (transData) {
        setTransactions(transData.map((item: any) => ({
          id: item.id,
          type: item.type,
          category: item.category,
          paymentMethod: item.payment_method || item.paymentMethod || '現金',
          amount: Number(item.amount || 0),
          remark: item.remark || '',
          date: item.date || item.created_at?.split('T')[0] || getTodayStr(),
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
    if (!expenseAmount || expenseAmount <= 0) {
      alert('請輸入有效的支出金額');
      return;
    }
    const newTrans = {
      type: 'expense',
      category: expenseCategory,
      payment_method: expensePayment,
      amount: expenseAmount,
      remark: expenseRemark,
      date: selectedDate,
    };
    const { error } = await supabase.from('transactions').insert([newTrans]);
    if (error) {
      alert('新增支出失敗: ' + error.message);
    } else {
      setShowExpenseModal(false);
      setExpenseAmount(0);
      setExpenseRemark('');
      fetchData();
    }
  };

  // 新增收入
  const handleAddIncome = async () => {
    if (!incomeAmount || incomeAmount <= 0) {
      alert('請輸入有效的收入金額');
      return;
    }
    const newTrans = {
      type: 'income',
      category: incomeCategory,
      payment_method: incomePayment,
      amount: incomeAmount,
      remark: incomeRemark,
      date: selectedDate,
    };
    const { error } = await supabase.from('transactions').insert([newTrans]);
    if (error) {
      alert('新增收入失敗: ' + error.message);
    } else {
      setShowIncomeModal(false);
      setIncomeAmount(0);
      setIncomeRemark('');
      fetchData();
    }
  };

  // 當日篩選資料
  const currentDaySales = salesRecords.filter(r => r.date === selectedDate);
  const currentDayRepairs = repairRecords.filter(r => r.date === selectedDate);
  const currentDayTrans = transactions.filter(t => t.date === selectedDate);

  const currentDaySalesTotal = currentDaySales.reduce((sum, r) => sum + r.totalAmount, 0);
  const currentDayRepairIncomeTotal = currentDayRepairs.reduce((sum, r) => sum + r.price, 0);
  const currentDayOtherIncomeTotal = currentDayTrans.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = currentDaySalesTotal + currentDayRepairIncomeTotal + currentDayOtherIncomeTotal;

  const currentDayRepairCostTotal = currentDayRepairs.reduce((sum, r) => sum + r.cost, 0);
  const currentDayExpenseTrans = currentDayTrans.filter(t => t.type === 'expense');
  const currentDayExpenseTransTotal = currentDayExpenseTrans.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = currentDayRepairCostTotal + currentDayExpenseTransTotal;

  const netIncome = totalIncome - totalExpense;

  // 各支付方式統計 (現金、刷卡、刷卡/分期、無卡分期、LinePay、匯款)
  const getPayMethodStats = (methodName: string) => {
    const salesAmt = currentDaySales.reduce((sum, s) => sum, 0); // 假設銷售預設
    const repairAmt = currentDayRepairs.filter(r => r.paymentMethod === methodName).reduce((sum, r) => sum + r.price, 0);
    const incAmt = currentDayTrans.filter(t => t.type === 'income' && t.paymentMethod === methodName).reduce((sum, t) => sum + t.amount, 0);
    const expAmt = currentDayTrans.filter(t => t.type === 'expense' && t.paymentMethod === methodName).reduce((sum, t) => sum + t.amount, 0);
    
    let total = repairAmt + incAmt - expAmt;
    if (methodName === '現金') {
      total += currentDaySalesTotal; // 假設銷售預設現金
    }
    const count = currentDayRepairs.filter(r => r.paymentMethod === methodName).length + currentDayTrans.filter(t => t.paymentMethod === methodName).length;
    return { total, count };
  };

  const cashStats = getPayMethodStats('現金');
  const cardStats = getPayMethodStats('刷卡');
  const cardInstallmentStats = getPayMethodStats('刷卡/分期');
  const noCardStats = getPayMethodStats('無卡分期');
  const linePayStats = getPayMethodStats('LinePay');
  const transferStats = getPayMethodStats('匯款');

  // 區間報表計算
  const filteredSales = salesRecords.filter(r => r.date >= reportStartDate && r.date <= reportEndDate);
  const filteredRepairs = repairRecords.filter(r => r.date >= reportStartDate && r.date <= reportEndDate);
  const filteredTrans = transactions.filter(t => t.date >= reportStartDate && t.date <= reportEndDate);

  const reportSalesTotal = filteredSales.reduce((sum, r) => sum + r.totalAmount, 0) + filteredRepairs.reduce((sum, r) => sum + r.price, 0);
  const reportCommissionTotal = filteredSales.reduce((sum, r) => sum + r.profit, 0);
  const reportOtherIncomeTotal = filteredTrans.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const reportExpenseTotal = filteredTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) + filteredRepairs.reduce((sum, r) => sum + r.cost, 0);
  const reportNetProfit = reportSalesTotal + reportOtherIncomeTotal - reportExpenseTotal;

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
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowExpenseModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
          >
            + 新增支出
          </button>
          <button 
            onClick={() => setShowIncomeModal(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
          >
            + 新增雜收
          </button>
        </div>
      </div>

      {/* 頂部淨收入卡片 */}
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

      {/* 收入明細與支出明細 */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-800 flex items-center gap-2">📝 收入明細</span>
            <span className="text-xs font-mono font-bold text-emerald-600">${totalIncome.toLocaleString()}</span>
          </div>
          <div 
            onClick={() => setShowSalesDetailModal(true)}
            className="bg-slate-50 hover:bg-slate-100 cursor-pointer rounded-2xl p-3.5 flex justify-between items-center text-xs transition"
          >
            <span className="text-blue-600 font-medium">銷售與維修收入小計 (點擊看明細)</span>
            <span className="font-mono font-bold text-slate-700">{currentDaySales.length + currentDayRepairs.length} 筆 <span className="text-blue-600 ml-1">${(currentDaySalesTotal + currentDayRepairIncomeTotal).toLocaleString()}</span></span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-800 flex items-center gap-2">支 出 (雜支)</span>
            <span className="text-xs font-mono font-bold text-rose-500">${totalExpense.toLocaleString()}</span>
          </div>
          <div className="bg-slate-50 rounded-2xl p-3.5 flex justify-between items-center text-xs">
            <span className="text-slate-600 font-medium">{currentDayExpenseTrans.length > 0 ? currentDayExpenseTrans[0].remark || '支出項目' : '今日無支出記錄'}</span>
            <span className="font-mono font-bold text-rose-500">${totalExpense.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 款項結算 (六大支付方式卡片) */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
        <span className="text-sm font-bold text-slate-800 flex items-center gap-2">💳 款項結算</span>
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
            <p className="text-xl font-mono font-bold text-slate-800">${cardInstallmentStats.total.toLocaleString()}</p>
            <span className="text-[10px] text-slate-400">{cardInstallmentStats.count} 筆</span>
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

        {/* 零用金與本日結算 */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="p-4 bg-amber-50/40 rounded-2xl border border-amber-100 flex justify-between items-center">
            <div>
              <span className="text-xs text-amber-700 font-medium">零用金</span>
              <p className="text-xl font-mono font-bold text-amber-800">${cashBalance.toLocaleString()}</p>
            </div>
          </div>
          <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100 flex justify-between items-center">
            <div>
              <span className="text-xs text-emerald-700 font-medium">本日結算</span>
              <p className="text-xl font-mono font-bold text-emerald-800">${(cashBalance + cashStats.total).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 下方盈餘報表區塊 */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-slate-800 flex items-center gap-2">📊 盈餘報表</span>
          <div className="flex items-center gap-2">
            <button onClick={() => { setReportFilterType('month'); setReportStartDate('2026-06-30'); setReportEndDate(getTodayStr()); }} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${reportFilterType === 'month' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>本月</button>
            <button onClick={() => setReportFilterType('custom')} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${reportFilterType === 'custom' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>自訂</button>
            <input type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs" />
            <span>~</span>
            <input type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs" />
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl text-center space-y-1">
            <span className="text-xs text-slate-500">銷售金額</span>
            <p className="text-lg font-mono font-bold text-slate-800">${reportSalesTotal.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl text-center space-y-1">
            <span className="text-xs text-slate-500">佣金</span>
            <p className="text-lg font-mono font-bold text-slate-800">${reportCommissionTotal.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl text-center space-y-1">
            <span className="text-xs text-slate-500">雜收</span>
            <p className="text-lg font-mono font-bold text-slate-800">${reportOtherIncomeTotal.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl text-center space-y-1">
            <span className="text-xs text-slate-500">雜支</span>
            <p className="text-lg font-mono font-bold text-rose-500">-${reportExpenseTotal.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl text-center space-y-1">
            <span className="text-xs text-emerald-700 font-medium">盈餘</span>
            <p className="text-lg font-mono font-bold text-emerald-600">${reportNetProfit.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* 新增支出彈跳視窗 */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 w-[450px] space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-800">新增支出紀錄</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 font-medium">支出類別</label>
                <input type="text" value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700" />
              </div>
              <div>
                <label className="text-slate-500 font-medium">支付方式</label>
                <select value={expensePayment} onChange={(e) => setExpensePayment(e.target.value)} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700">
                  <option value="現金">現金</option>
                  <option value="刷卡">刷卡</option>
                  <option value="刷卡/分期">刷卡/分期</option>
                  <option value="無卡分期">無卡分期</option>
                  <option value="LinePay">LinePay</option>
                  <option value="匯款">匯款</option>
                </select>
              </div>
              <div>
                <label className="text-slate-500 font-medium">金額</label>
                <input type="number" value={expenseAmount || ''} onChange={(e) => setExpenseAmount(Number(e.target.value))} placeholder="請輸入金額" className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-700" />
              </div>
              <div>
                <label className="text-slate-500 font-medium">備註說明</label>
                <input type="text" value={expenseRemark} onChange={(e) => setExpenseRemark(e.target.value)} placeholder="例如：購買零件" className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t">
              <button onClick={() => setShowExpenseModal(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-medium">取消</button>
              <button onClick={handleAddExpense} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700">確定新增</button>
            </div>
          </div>
        </div>
      )}

      {/* 新增雜收彈跳視窗 */}
      {showIncomeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 w-[450px] space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-800">新增雜收紀錄</h3>
              <button onClick={() => setShowIncomeModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 font-medium">收入類別</label>
                <input type="text" value={incomeCategory} onChange={(e) => setIncomeCategory(e.target.value)} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700" />
              </div>
              <div>
                <label className="text-slate-500 font-medium">收款方式</label>
                <select value={incomePayment} onChange={(e) => setIncomePayment(e.target.value)} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700">
                  <option value="現金">現金</option>
                  <option value="刷卡">刷卡</option>
                  <option value="刷卡/分期">刷卡/分期</option>
                  <option value="無卡分期">無卡分期</option>
                  <option value="LinePay">LinePay</option>
                  <option value="匯款">匯款</option>
                </select>
              </div>
              <div>
                <label className="text-slate-500 font-medium">金額</label>
                <input type="number" value={incomeAmount || ''} onChange={(e) => setIncomeAmount(Number(e.target.value))} placeholder="請輸入金額" className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-700" />
              </div>
              <div>
                <label className="text-slate-500 font-medium">備註說明</label>
                <input type="text" value={incomeRemark} onChange={(e) => setIncomeRemark(e.target.value)} placeholder="例如：貼膜收入" className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t">
              <button onClick={() => setShowIncomeModal(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-medium">取消</button>
              <button onClick={handleAddIncome} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800">確定新增</button>
            </div>
          </div>
        </div>
      )}

      {/* 銷售與維修收入明細彈跳視窗 */}
      {showSalesDetailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 w-[700px] max-h-[80vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-800">銷售與維修收入明細</h3>
              <button onClick={() => setShowSalesDetailModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <div className="space-y-2">
              {currentDayRepairs.map((r, i) => (
                <div key={`r-${i}`} className="grid grid-cols-12 items-center bg-slate-50 rounded-2xl p-3 text-xs border border-slate-100">
                  <span className="col-span-3 text-slate-700 font-mono font-medium">{r.repairNo}</span>
                  <span className="col-span-7 text-slate-800">{r.deviceModel} - {r.faultDesc} ({r.paymentMethod})</span>
                  <span className="col-span-2 text-right font-mono font-bold text-emerald-600">+${r.price.toLocaleString()}</span>
                </div>
              ))}
              {currentDaySales.map((s, i) => (
                <div key={`s-${i}`} className="grid grid-cols-12 items-center bg-slate-50 rounded-2xl p-3 text-xs border border-slate-100">
                  <span className="col-span-3 text-slate-700 font-mono font-medium">{s.orderNo}</span>
                  <span className="col-span-7 text-slate-800">商品銷售</span>
                  <span className="col-span-2 text-right font-mono font-bold text-emerald-600">+${s.totalAmount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
