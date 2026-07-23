'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface SaleRecord {
  id: string;
  orderNo: string;
  date: string;
  totalAmount: number;
  profit: number;
  items: {
    name: string;
    price: number;
    quantity: number;
  }[];
}

export default function ReportsPage() {
  const [salesRecords, setSalesRecords] = useState<SaleRecord[]>([]);
  const [cashBalance, setCashBalance] = useState<number>(40000);
  const [isEditingCash, setIsEditingCash] = useState(false);
  const [tempCash, setTempCash] = useState('40000');

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

  const fetchSalesRecords = async () => {
    try {
      const { data, error } = await supabase.from('sales_records').select('*').order('created_at', { ascending: false });
      if (error) return;
      if (data) {
        setSalesRecords(data.map((item: any) => ({
          id: item.id,
          orderNo: item.order_no,
          date: item.date,
          items: typeof item.items === 'string' ? JSON.parse(item.items) : item.items,
          totalAmount: Number(item.total_amount),
          profit: Number(item.profit),
        })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSalesRecords();
  }, []);

  // 依據畫面上方選定的日期計算當日資料
  const currentDayRecords = salesRecords.filter(r => r.date === selectedDate);
  const currentDayTotalIncome = currentDayRecords.reduce((sum, r) => sum + r.totalAmount, 0);

  // 盈餘報表區間計算
  const reportRecords = salesRecords.filter(r => r.date >= reportStartDate && r.date <= reportEndDate);
  const reportTotalSales = reportRecords.reduce((sum, r) => sum + r.totalAmount, 0);
  const reportTotalCommission = reportRecords.reduce((sum, r) => {
    const planItem = r.items.find(i => i.name.includes('方案'));
    return sum + (planItem ? r.profit : 0);
  }, 0);
  const reportTotalProfit = reportRecords.reduce((sum, r) => sum + r.profit, 0);

  return (
    <div className="p-8 space-y-6 bg-slate-100 min-h-screen">
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
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-medium shadow-sm transition">
            + 新增支出
          </button>
          <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-medium transition">
            + 新增雜收
          </button>
        </div>
      </div>

      {/* 頂部今日淨收入 */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-2 h-10 bg-emerald-500 rounded-full"></div>
          <div>
            <span className="text-xs text-slate-400 font-medium">今日淨收入</span>
            <h2 className="text-3xl font-mono font-bold text-emerald-600 mt-0.5">${currentDayTotalIncome.toLocaleString()}</h2>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-emerald-50/60 px-5 py-3 rounded-2xl border border-emerald-100 text-right">
            <span className="text-xs text-emerald-600 font-medium">總收入</span>
            <p className="text-lg font-mono font-bold text-emerald-600">${currentDayTotalIncome.toLocaleString()}</p>
          </div>
          <div className="bg-rose-50/60 px-5 py-3 rounded-2xl border border-rose-100 text-right">
            <span className="text-xs text-rose-500 font-medium">總支出</span>
            <p className="text-lg font-mono font-bold text-rose-500">$0</p>
          </div>
        </div>
      </div>

      {/* 收入明細與支出區塊 */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-800 flex items-center gap-2">📝 收入明細</span>
            <span className="text-xs font-mono font-bold text-emerald-600">${currentDayTotalIncome.toLocaleString()}</span>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 flex justify-between items-center text-xs">
            <span className="text-blue-600 font-medium cursor-pointer">銷售與收入小計 (點擊看明細)</span>
            <span className="font-mono font-bold text-slate-700">{currentDayRecords.length} 筆 <span className="text-blue-600 ml-1">${currentDayTotalIncome.toLocaleString()}</span></span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-800 flex items-center gap-2">📉 支出 ( 雜支 )</span>
            <span className="text-xs font-mono font-bold text-rose-500">$0</span>
          </div>
          <div className="bg-slate-50 rounded-2xl p-8 text-center text-xs text-slate-400">
            今日無支出記錄
          </div>
        </div>
      </div>

      {/* 款項結算 */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
        <span className="text-sm font-bold text-slate-800 flex items-center gap-2">💳 款項結算</span>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100/50 space-y-1">
            <span className="text-xs text-slate-500 font-medium">現金</span>
            <p className="text-lg font-mono font-bold text-slate-800">${currentDayTotalIncome.toLocaleString()}</p>
            <span className="text-[10px] text-slate-400">{currentDayRecords.length} 筆</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-xs text-slate-500 font-medium">刷卡</span>
            <p className="text-lg font-mono font-bold text-slate-800">$0</p>
            <span className="text-[10px] text-slate-400">0 筆</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-xs text-slate-500 font-medium">刷卡/分期</span>
            <p className="text-lg font-mono font-bold text-slate-800">$0</p>
            <span className="text-[10px] text-slate-400">0 筆</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-xs text-slate-500 font-medium">無卡分期</span>
            <p className="text-lg font-mono font-bold text-slate-800">$0</p>
            <span className="text-[10px] text-slate-400">0 筆</span>
          </div>
          <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100/50 space-y-1">
            <span className="text-xs text-slate-500 font-medium">LinePay</span>
            <p className="text-lg font-mono font-bold text-slate-800">$0</p>
            <span className="text-[10px] text-slate-400">0 筆</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-xs text-slate-500 font-medium">匯款</span>
            <p className="text-lg font-mono font-bold text-slate-800">$0</p>
            <span className="text-[10px] text-slate-400">0 筆</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/60 flex justify-between items-center">
            <div>
              <span className="text-xs text-amber-700 font-medium">零用金</span>
              {isEditingCash ? (
                <div className="flex items-center gap-2 mt-1">
                  <input 
                    type="text" 
                    value={tempCash} 
                    onChange={(e) => setTempCash(e.target.value)} 
                    className="bg-white border border-amber-300 rounded px-2 py-1 text-sm font-mono w-28"
                  />
                  <button 
                    onClick={() => { setCashBalance(Number(tempCash) || 0); setIsEditingCash(false); }} 
                    className="bg-amber-600 text-white px-3 py-1 rounded text-xs"
                  >
                    儲存
                  </button>
                </div>
              ) : (
                <p className="text-xl font-mono font-bold text-amber-700 mt-0.5">${cashBalance.toLocaleString()}</p>
              )}
            </div>
            {!isEditingCash && (
              <button 
                onClick={() => setIsEditingCash(true)} 
                className="text-xs text-amber-700 bg-amber-100/80 px-3 py-1.5 rounded-xl font-medium hover:bg-amber-200"
              >
                ✏️ 點擊數字修改
              </button>
            )}
          </div>

          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/60 flex justify-between items-center">
            <div>
              <span className="text-xs text-emerald-700 font-medium">本日結算</span>
              <p className="text-xl font-mono font-bold text-emerald-600 mt-0.5">${(cashBalance + currentDayTotalIncome).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 盈餘報表區塊 */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800">📊 盈餘報表</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              <button 
                onClick={() => { 
                  setReportFilterType('month'); 
                  setReportStartDate('2026-06-30');
                  setReportEndDate(getTodayStr());
                }} 
                className={`px-3 py-1.5 rounded-lg font-medium ${reportFilterType === 'month' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
              >
                本月
              </button>
              <button 
                onClick={() => { 
                  setReportFilterType('lastMonth'); 
                  setReportStartDate('2026-06-01');
                  setReportEndDate('2026-06-30');
                }} 
                className={`px-3 py-1.5 rounded-lg font-medium ${reportFilterType === 'lastMonth' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
              >
                上月
              </button>
              <button 
                onClick={() => setReportFilterType('custom')} 
                className={`px-3 py-1.5 rounded-lg font-medium ${reportFilterType === 'custom' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
              >
                自訂
              </button>
            </div>
            <input type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700" />
            <span className="text-slate-400">~</span>
            <input type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700" />
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-xs text-slate-400 font-medium">銷售金額</span>
            <p className="text-xl font-mono font-bold text-slate-800">${reportTotalSales.toLocaleString()}</p>
          </div>
          <div className="p-5 bg-purple-50/40 rounded-2xl border border-purple-100/50 space-y-1">
            <span className="text-xs text-purple-600 font-medium">傭金</span>
            <p className="text-xl font-mono font-bold text-purple-600">${reportTotalCommission.toLocaleString()}</p>
          </div>
          <div className="p-5 bg-emerald-50/40 rounded-2xl border border-emerald-100/50 space-y-1">
            <span className="text-xs text-emerald-600 font-medium">雜收</span>
            <p className="text-xl font-mono font-bold text-emerald-600">$0</p>
          </div>
          <div className="p-5 bg-rose-50/40 rounded-2xl border border-rose-100/50 space-y-1">
            <span className="text-xs text-rose-500 font-medium">雜支</span>
            <p className="text-xl font-mono font-bold text-rose-500">-$0</p>
          </div>
          <div className="p-5 bg-emerald-50/60 rounded-2xl border-2 border-emerald-500/40 space-y-1 shadow-sm">
            <span className="text-xs text-emerald-700 font-bold">盈餘</span>
            <p className="text-2xl font-mono font-bold text-emerald-600">${reportTotalProfit.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
