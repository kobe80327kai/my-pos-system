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

  // 取得當天日期字串
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [reportFilterType, setReportFilterType] = useState<'month' | 'custom'>('month');
  const [reportStartDate, setReportStartDate] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`);
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

  // 根據選擇的區間篩選銷售紀錄
  const reportRecords = salesRecords.filter(r => r.date >= reportStartDate && r.date <= reportEndDate);
  const reportTotalSales = reportRecords.reduce((sum, r) => sum + r.totalAmount, 0);
  
  // 計算傭金 (包含方案的利潤或毛利)
  const reportTotalCommission = reportRecords.reduce((sum, r) => {
    const planItem = r.items.find(i => i.name.includes('方案'));
    return sum + (planItem ? r.profit : 0);
  }, 0);

  const reportTotalProfit = reportRecords.reduce((sum, r) => sum + r.profit, 0);

  return (
    <div className="p-8 space-y-6 bg-slate-100 min-h-screen">
      <div>
        <h1 className="text-xl font-bold text-slate-800">營運報表</h1>
        <p className="text-xs text-slate-400 mt-0.5">即時統計銷售金額、傭金與盈餘。</p>
      </div>

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
                  setReportStartDate(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`);
                  setReportEndDate(getTodayStr());
                }} 
                className={`px-3 py-1.5 rounded-lg font-medium ${reportFilterType === 'month' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
              >
                本月
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
