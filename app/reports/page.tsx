'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface SalesRecord {
  id: string;
  order_no: string;
  date: string;
  customer_name: string;
  customer_type: string;
  salesperson: string;
  store: string;
  items: { name: string; imei: string; cost: number; price: number; quantity: number; category: string }[];
  total_amount: number;
  total_cost: number;
  profit: number;
  payment_info: string;
}

interface ExpenseRecord {
  id: string;
  date: string;
  category: string;
  amount: number;
  payment_method: string;
  handler: string;
  remark: string;
}

export default function ReportsPage() {
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);

  // 盈餘報表時間篩選狀態 (本月 / 上月 / 自訂)
  const [profitTab, setProfitTab] = useState<'month' | 'lastMonth' | 'custom'>('month');

  // 彈跳明細視窗狀態
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailModalTitle, setDetailModalTitle] = useState('');
  const [detailModalItems, setDetailModalItems] = useState<{ time: string; orderNo: string; name: string; amount: number }[]>([]);

  // 新增支出/雜收 Modal 狀態
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState('進貨');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expensePaymentMethod, setExpensePaymentMethod] = useState('現金');
  const [expenseRemark, setExpenseRemark] = useState('');

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      const formattedDate = selectedDate.replace(/\//g, '-');
      
      const { data: salesData } = await supabase
        .from('sales_records')
        .select('*')
        .ilike('date', `%${formattedDate}%`);

      if (salesData) {
        setSalesRecords(salesData);
      }

      const { data: expData } = await supabase
        .from('expenses')
        .select('*')
        .ilike('date', `%${formattedDate}%`);

      if (expData) {
        setExpenses(expData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddExpense = async () => {
    if (!expenseAmount || expenseAmount <= 0) {
      alert('請輸入有效金額');
      return;
    }

    const newExp = {
      id: `exp-${Date.now()}`,
      date: selectedDate.replace(/\//g, '-'),
      category: expenseCategory,
      amount: Number(expenseAmount),
      payment_method: expensePaymentMethod,
      handler: '管理員',
      remark: expenseRemark || '—'
    };

    try {
      await supabase.from('expenses').insert([newExp]);
      setExpenses([newExp, ...expenses]);
      alert('新增成功！');
      setIsExpenseModalOpen(false);
      setExpenseAmount(0);
      setExpenseRemark('');
    } catch (e) {
      console.error(e);
      alert('新增失敗');
    }
  };

  const totalSalesAmount = salesRecords.reduce((sum, r) => sum + (r.total_amount || 0), 0);
  const totalExpenseAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netIncome = totalSalesAmount - totalExpenseAmount;

  // 雜收計算（分類為雜收的支出或收入，此處以支出內的雜收或獨立紀錄為主，若無則為0）
  const totalMiscellaneousIncome = 0; 

  // 盈餘計算 (銷售金額 + 雜收 - 雜支，已拿掉佣金)
  const totalProfit = totalSalesAmount + totalMiscellaneousIncome - totalExpenseAmount;

  const paymentStats: { [key: string]: { count: number; total: number; items: any[] } } = {
    '現金': { count: 0, total: 0, items: [] },
    '刷卡': { count: 0, total: 0, items: [] },
    '刷卡/分期': { count: 0, total: 0, items: [] },
    '無卡分期': { count: 0, total: 0, items: [] },
    'LinePay': { count: 0, total: 0, items: [] },
    '匯款': { count: 0, total: 0, items: [] }
  };

  salesRecords.forEach(r => {
    const method = r.payment_info || '現金';
    if (!paymentStats[method]) {
      paymentStats[method] = { count: 0, total: 0, items: [] };
    }
    paymentStats[method].count += 1;
    paymentStats[method].total += r.total_amount || 0;
    paymentStats[method].items.push({
      time: '12:00',
      orderNo: r.order_no,
      name: r.items?.[0]?.name || '銷售品項',
      amount: r.total_amount || 0
    });
  });

  const openDetailModal = (title: string, items: any[]) => {
    setDetailModalTitle(title);
    setDetailModalItems(items);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="flex-1 bg-slate-100 p-8 space-y-6 overflow-y-auto font-sans text-slate-800 min-h-screen">
      {/* 頂部日期與按鈕 */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 text-xs font-bold text-slate-700">
            <span>📅</span>
            <input
              type="text"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent outline-none font-mono"
            />
          </div>
          <button
            onClick={() => setSelectedDate(getTodayStr())}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-2xl text-xs font-bold text-slate-600 transition"
          >
            今天
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => { setExpenseCategory('進貨'); setIsExpenseModalOpen(true); }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
          >
            + 新增支出
          </button>
          <button
            onClick={() => { setExpenseCategory('雜收'); setIsExpenseModalOpen(true); }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
          >
            + 新增雜收
          </button>
        </div>
      </div>

      {/* 今日淨收入大看板 */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 flex flex-wrap justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-2.5 h-12 bg-emerald-500 rounded-full"></div>
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">今日淨收入</span>
            <h2 className="text-3xl font-extrabold font-mono text-emerald-600">${netIncome.toLocaleString()}</h2>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="bg-emerald-50/60 border border-emerald-100 px-5 py-3 rounded-2xl text-right min-w-[120px]">
            <span className="text-[11px] font-bold text-emerald-600 block mb-0.5">總收入</span>
            <span className="text-lg font-extrabold font-mono text-emerald-700">${totalSalesAmount.toLocaleString()}</span>
          </div>
          <div className="bg-rose-50/60 border border-rose-100 px-5 py-3 rounded-2xl text-right min-w-[120px]">
            <span className="text-[11px] font-bold text-rose-600 block mb-0.5">總支出</span>
            <span className="text-lg font-extrabold font-mono text-rose-600">${totalExpenseAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 收入明細與支出明細區塊 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 收入明細 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>📈</span> 收入明細
            </h3>
            <span className="font-mono font-bold text-emerald-600 text-sm">${totalSalesAmount.toLocaleString()}</span>
          </div>

          <div
            onClick={() => openDetailModal('銷售與維修收入小計', salesRecords.map(r => ({ time: '12:00', orderNo: r.order_no, name: r.items?.[0]?.name || '銷售', amount: r.total_amount })))}
            className="bg-slate-50 hover:bg-blue-50/50 p-4 rounded-2xl border border-slate-100 cursor-pointer transition flex justify-between items-center"
          >
            <div>
              <p className="text-xs font-bold text-blue-600">銷售與維修收入小計 (點擊看明細)</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600">{salesRecords.length} 筆 <strong className="text-emerald-600">${totalSalesAmount.toLocaleString()}</strong></span>
          </div>

          {/* 各付款方式子項目 */}
          <div className="space-y-2 pt-2">
            {Object.entries(paymentStats).map(([method, data]) => (
              data.count > 0 && (
                <div
                  key={method}
                  onClick={() => openDetailModal(`${method} — 逐筆明細`, data.items)}
                  className="flex justify-between items-center px-4 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer text-xs transition"
                >
                  <span className="font-medium text-slate-700">{method}</span>
                  <span className="font-mono text-slate-500">{data.count}筆 <strong className="text-emerald-600 ml-2">${data.total.toLocaleString()}</strong></span>
                </div>
              )
            ))}
          </div>
        </div>

        {/* 支出 (雜支) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>📉</span> 支出 (雜支)
            </h3>
            <span className="font-mono font-bold text-rose-600 text-sm">${totalExpenseAmount.toLocaleString()}</span>
          </div>

          <div className="space-y-2">
            {expenses.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">今日尚無支出紀錄</div>
            ) : (
              expenses.map(e => (
                <div key={e.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                  <div>
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded text-[10px] font-bold mr-2">{e.category}</span>
                    <span className="font-medium text-slate-800">{e.remark}</span>
                  </div>
                  <span className="font-mono font-bold text-rose-600">-${e.amount.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 款項結算看板 */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <span>💼</span> 款項結算
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(paymentStats).map(([method, data]) => (
            <div
              key={method}
              onClick={() => openDetailModal(`${method} — 逐筆明細`, data.items)}
              className="bg-slate-50/80 hover:bg-blue-50/40 p-5 rounded-2xl border border-slate-100 cursor-pointer transition space-y-2"
            >
              <span className="text-xs font-bold text-slate-500 block">{method}</span>
              <h4 className="text-xl font-extrabold font-mono text-slate-800">${data.total.toLocaleString()}</h4>
              <span className="text-[11px] text-slate-400 font-medium block">{data.count} 筆</span>
            </div>
          ))}
        </div>
      </div>

      {/* 最下方盈餘報表區塊 (已移除佣金欄位) */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4 border-b pb-4">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 font-bold">📈</span>
            <h3 className="text-sm font-bold text-slate-800">盈餘報表</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold">
              <button
                onClick={() => setProfitTab('month')}
                className={`px-4 py-1.5 rounded-xl transition ${profitTab === 'month' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                本月
              </button>
              <button
                onClick={() => setProfitTab('lastMonth')}
                className={`px-4 py-1.5 rounded-xl transition ${profitTab === 'lastMonth' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                上月
              </button>
              <button
                onClick={() => setProfitTab('custom')}
                className={`px-4 py-1.5 rounded-xl transition ${profitTab === 'custom' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                自訂
              </button>
            </div>
            <span className="text-xs text-slate-400 font-mono">2026-07-01 ~ 2026-07-24</span>
          </div>
          <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">管理員</span>
        </div>

        {/* 4張計算卡片 (銷售金額、雜收、雜支、盈餘，已拿掉佣金) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 text-center space-y-2">
            <span className="text-xs font-bold text-slate-500 block">銷售金額</span>
            <h4 className="text-2xl font-extrabold font-mono text-slate-800">${totalSalesAmount.toLocaleString()}</h4>
          </div>

          <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 text-center space-y-2">
            <span className="text-xs font-bold text-emerald-700 block">雜收</span>
            <h4 className="text-2xl font-extrabold font-mono text-emerald-600">${totalMiscellaneousIncome.toLocaleString()}</h4>
          </div>

          <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100 text-center space-y-2">
            <span className="text-xs font-bold text-rose-700 block">雜支</span>
            <h4 className="text-2xl font-extrabold font-mono text-rose-600">-${totalExpenseAmount.toLocaleString()}</h4>
          </div>

          <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 text-center space-y-2 shadow-sm">
            <span className="text-xs font-bold text-emerald-800 block">盈餘</span>
            <h4 className="text-2xl font-extrabold font-mono text-emerald-700">${totalProfit.toLocaleString()}</h4>
          </div>
        </div>

        <div className="flex justify-end text-[11px] text-slate-400 font-mono pt-1">
          = 銷售金額 + 雜收 - 雜支
        </div>
      </div>

      {/* 逐筆明細彈跳視窗 */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-800">{detailModalTitle}</h3>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-slate-400 hover:text-rose-600 text-base font-bold">✕</button>
            </div>

            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase font-bold">
                    <th className="py-2.5 px-3">時間</th>
                    <th className="py-2.5 px-3">單號</th>
                    <th className="py-2.5 px-3">收入內容</th>
                    <th className="py-2.5 px-3 text-right">金額</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {detailModalItems.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-slate-400">目前沒有相關逐筆明細</td></tr>
                  ) : (
                    detailModalItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-mono text-slate-500">{item.time}</td>
                        <td className="py-3 px-3 font-mono font-bold text-blue-600">{item.orderNo}</td>
                        <td className="py-3 px-3 font-medium text-slate-800">{item.name}</td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-600 text-right">${item.amount.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl flex justify-between items-center text-xs font-bold text-slate-700 border border-slate-100">
              <span>合計</span>
              <span className="font-mono text-emerald-600 text-sm">
                ${detailModalItems.reduce((sum, i) => sum + i.amount, 0).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setIsDetailModalOpen(false)} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs">關閉</button>
            </div>
          </div>
        </div>
      )}

      {/* 新增支出/雜收 Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-800">新增{expenseCategory}</h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-400 hover:text-rose-600 text-base font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">金額 *</label>
                <input
                  type="number"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(Number(e.target.value))}
                  placeholder="請輸入金額..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">付款方式</label>
                <select
                  value={expensePaymentMethod}
                  onChange={(e) => setExpensePaymentMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                >
                  <option value="現金">現金</option>
                  <option value="刷卡">刷卡</option>
                  <option value="匯款">匯款</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">備註說明</label>
                <input
                  type="text"
                  value={expenseRemark}
                  onChange={(e) => setExpenseRemark(e.target.value)}
                  placeholder="例如：進貨款 伸安..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs"
              >
                取消
              </button>
              <button
                onClick={handleAddExpense}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm"
              >
                確認新增
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
