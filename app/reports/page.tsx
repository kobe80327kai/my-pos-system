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

  const currentDaySales = salesRecords.filter(r => r.date === selectedDate);
  const currentDayRepairs = repairRecords.filter(r => r.date === selectedDate);
  const currentDayTrans = transactions.filter(t => t.date === selectedDate);

  const currentDaySalesTotal = currentDaySales.reduce((sum, r) => sum + r.totalAmount, 0);
  const currentDayRepairIncomeTotal = currentDayRepairs.reduce((sum, r) => sum + r.price, 0);
  const currentDayOtherIncomeTotal = currentDayTrans.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = currentDaySalesTotal + currentDayRepairIncomeTotal + currentDayOtherIncomeTotal;

  // 支出計算
  const currentDayRepairCostTotal = currentDayRepairs.reduce((sum, r) => sum + r.cost, 0);
  const currentDayExpenseTrans = currentDayTrans.filter(t => t.type === 'expense');
  const currentDayExpenseTransTotal = currentDayExpenseTrans.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = currentDayRepairCostTotal + currentDayExpenseTransTotal;

  const netIncome = totalIncome - totalExpense;

  // 款項結算
  const cashTotal = cashBalance + (currentDaySalesTotal + currentDayRepairIncomeTotal) + currentDayTrans.filter(t => t.paymentMethod === '現金' && t.type === 'income').reduce((sum, t) => sum + t.amount, 0) - currentDayExpenseTrans.filter(t => t.paymentMethod === '現金').reduce((sum, t) => sum + t.amount, 0) - currentDayRepairCostTotal;
  const transferTotal = currentDayTrans.filter(t => t.paymentMethod === '轉帳').reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
  const otherTotal = currentDayTrans.filter(t => t.paymentMethod === '其他').reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);

  return (
    <div className="p-8 space-y-6 bg-slate-100 min-h-screen relative">
      {/* 頂部日期與快捷按鈕 */}
      <div className="flex justify-between items-center bg-white rounded-3xl p-4 shadow-sm border border-slate-200/60">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-bold">目前選擇日期：</span>
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
            onClick={() => setShowIncomeModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <span>+ 新增收入</span>
          </button>
          <button 
            onClick={() => setShowExpenseModal(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <span>+ 新增支出</span>
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
              <span className="text-blue-600 font-medium">銷售與維修收入小計 (點擊看明細)</span>
              <span className="font-mono font-bold text-slate-700">{currentDaySales.length + currentDayRepairs.length} 筆 <span className="text-blue-600 ml-1">${(currentDaySalesTotal + currentDayRepairIncomeTotal).toLocaleString()}</span></span>
            </div>
            {currentDayOtherIncomeTotal > 0 && (
              <div className="bg-slate-50 rounded-2xl p-3.5 flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">其他收入</span>
                <span className="font-mono font-bold text-slate-700">${currentDayOtherIncomeTotal.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* 支出明細 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-800 flex items-center gap-2">Out 支出明細</span>
            <span className="text-xs font-mono font-bold text-rose-500">${totalExpense.toLocaleString()}</span>
          </div>
          <div className="space-y-2">
            <div 
              onClick={() => setShowExpenseDetailModal(true)}
              className="bg-slate-50 hover:bg-slate-100 cursor-pointer rounded-2xl p-3.5 flex justify-between items-center text-xs transition"
            >
              <span className="text-blue-600 font-medium">支出與成本彙整 (點擊看明細)</span>
              <span className="font-mono font-bold text-slate-700">{currentDayRepairs.length + currentDayExpenseTrans.length} 筆 <span className="text-blue-600 ml-1">${totalExpense.toLocaleString()}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* 款項結算 */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
        <span className="text-sm font-bold text-slate-800 flex items-center gap-2">💳 款項結算</span>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100/50 space-y-1">
            <span className="text-xs text-slate-500 font-medium">現金總額</span>
            <p className="text-2xl font-mono font-bold text-slate-800">${cashTotal.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-100/50 space-y-1">
            <span className="text-xs text-slate-500 font-medium">轉帳總額</span>
            <p className="text-2xl font-mono font-bold text-slate-800">${transferTotal.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-xs text-slate-500 font-medium">其他支付總額</span>
            <p className="text-2xl font-mono font-bold text-slate-800">${otherTotal.toLocaleString()}</p>
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
                <select 
                  value={expenseCategory} 
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-700"
                >
                  <option value="收機">收機</option>
                  <option value="房租">房租</option>
                  <option value="零件耗材">零件耗材</option>
                  <option value="雜費">雜費</option>
                  <option value="其他支出">其他支出</option>
                </select>
              </div>
              <div>
                <label className="text-slate-500 font-medium">支付方式</label>
                <select 
                  value={expensePayment} 
                  onChange={(e) => setExpensePayment(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-700"
                >
                  <option value="現金">現金</option>
                  <option value="轉帳">轉帳</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div>
                <label className="text-slate-500 font-medium">金額</label>
                <input 
                  type="number" 
                  value={expenseAmount || ''} 
                  onChange={(e) => setExpenseAmount(Number(e.target.value))}
                  placeholder="請輸入金額"
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-700"
                />
              </div>
              <div>
                <label className="text-slate-500 font-medium">備註說明</label>
                <input 
                  type="text" 
                  value={expenseRemark} 
                  onChange={(e) => setExpenseRemark(e.target.value)}
                  placeholder="例如：購買螢幕總成"
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t">
              <button onClick={() => setShowExpenseModal(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-medium">取消</button>
              <button onClick={handleAddExpense} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700">確定新增</button>
            </div>
          </div>
        </div>
      )}

      {/* 新增收入彈跳視窗 */}
      {showIncomeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 w-[450px] space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-800">新增其他收入</h3>
              <button onClick={() => setShowIncomeModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 font-medium">收入類別</label>
                <input 
                  type="text" 
                  value={incomeCategory} 
                  onChange={(e) => setIncomeCategory(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700"
                />
              </div>
              <div>
                <label className="text-slate-500 font-medium">收款方式</label>
                <select 
                  value={incomePayment} 
                  onChange={(e) => setIncomePayment(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-700"
                >
                  <option value="現金">現金</option>
                  <option value="轉帳">轉帳</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div>
                <label className="text-slate-500 font-medium">金額</label>
                <input 
                  type="number" 
                  value={incomeAmount || ''} 
                  onChange={(e) => setIncomeAmount(Number(e.target.value))}
                  placeholder="請輸入金額"
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-700"
                />
              </div>
              <div>
                <label className="text-slate-500 font-medium">備註說明</label>
                <input 
                  type="text" 
                  value={incomeRemark} 
                  onChange={(e) => setIncomeRemark(e.target.value)}
                  placeholder="例如：保護貼代工費"
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t">
              <button onClick={() => setShowIncomeModal(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-medium">取消</button>
              <button onClick={handleAddIncome} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700">確定新增</button>
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
                  <span className="col-span-7 text-slate-800">{r.deviceModel} - {r.faultDesc}</span>
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

      {/* 支出明細彈跳視窗 */}
      {showExpenseDetailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 w-[700px] max-h-[80vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-800">支出與成本明細</h3>
              <button onClick={() => setShowExpenseDetailModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <div className="space-y-2">
              {currentDayRepairs.map((r, i) => r.cost > 0 && (
                <div key={`rc-${i}`} className="grid grid-cols-12 items-center bg-slate-50 rounded-2xl p-3 text-xs border border-slate-100">
                  <span className="col-span-3 text-slate-700 font-mono font-medium">{r.repairNo}</span>
                  <span className="col-span-7 text-slate-800">維修成本 ({r.deviceModel})</span>
                  <span className="col-span-2 text-right font-mono font-bold text-rose-500">-${r.cost.toLocaleString()}</span>
                </div>
              ))}
              {currentDayExpenseTrans.map((t, i) => (
                <div key={`t-${i}`} className="grid grid-cols-12 items-center bg-slate-50 rounded-2xl p-3 text-xs border border-slate-100">
                  <span className="col-span-3 text-slate-700 font-mono font-medium">{t.category}</span>
                  <span className="col-span-7 text-slate-800">{t.remark || '無備註'} ({t.paymentMethod})</span>
                  <span className="col-span-2 text-right font-mono font-bold text-rose-500">-${t.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
