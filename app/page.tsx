'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface RecordItem {
  id: string;
  date: string;
  amount: number;
  cost: number;
  profit: number;
  paymentMethod: string;
  title: string;
  type: 'sale' | 'repair';
}

export default function RepairsReportsPage() {
  const [activeTab, setActiveTab] = useState<'checkout' | 'records' | 'performance'>('performance');
  const [allRecords, setAllRecords] = useState<RecordItem[]>([]);

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [startDate, setStartDate] = useState('2026-06-30');
  const [endDate, setEndDate] = useState(getTodayStr());

  const fetchAllData = async () => {
    let combined: RecordItem[] = [];

    try {
      // 1. 抓取銷售紀錄
      const { data: sales } = await supabase.from('sales_records').select('*');
      if (sales) {
        sales.forEach((s: any) => {
          const d = (s.date || s.created_at || getTodayStr()).substring(0, 10);
          const amt = Number(s.total_amount || s.totalAmount || s.price || 0);
          const costVal = Number(s.cost || 0);
          const profitVal = Number(s.profit || (amt - costVal));
          combined.push({
            id: s.id,
            date: d,
            amount: amt,
            cost: costVal,
            profit: profitVal,
            paymentMethod: s.payment_method || s.paymentMethod || '現金',
            title: s.order_no || s.orderNo || '銷售訂單',
            type: 'sale'
          });
        });
      }

      // 2. 自動偵測維修資料表並抓取維修業績與毛利
      const repairTables = ['repairs', 'repair_records', 'repair', 'orders', 'maintenance'];
      for (const tName of repairTables) {
        const { data: repairs } = await supabase.from(tName).select('*');
        if (repairs && repairs.length > 0) {
          repairs.forEach((r: any) => {
            const d = (r.date || r.created_at || r.updated_at || getTodayStr()).substring(0, 10);
            const amt = Number(r.price || r.total_price || r.totalPrice || r.amount || r.repair_price || 0);
            const costVal = Number(r.cost || r.outsource_cost || r.outsourceCost || 0);
            // 毛利 = 維修售價 - 成本
            const profitVal = Number(r.profit || (amt - costVal));
            const pm = r.payment_method || r.paymentMethod || r.pay_method || '現金';
            const titleVal = r.repair_no || r.repairNo || r.device_model || r.deviceModel || '維修服務';
            
            combined.push({
              id: r.id,
              date: d,
              amount: amt,
              cost: costVal,
              profit: profitVal,
              paymentMethod: pm,
              title: titleVal,
              type: 'repair'
            });
          });
          break;
        }
      }

      setAllRecords(combined);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // 區間篩選
  const filteredRecords = allRecords.filter(r => r.date >= startDate && r.date <= endDate);
  const totalRevenue = filteredRecords.reduce((sum, r) => sum + r.amount, 0);
  const totalProfit = filteredRecords.reduce((sum, r) => sum + r.profit, 0);

  return (
    <div className="p-8 space-y-6 bg-slate-100 min-h-screen">
      {/* 頂部快速切換列 */}
      <div className="flex justify-between items-center bg-white rounded-3xl p-4 shadow-sm border border-slate-200/60">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium ml-2">快速切換：</span>
          <button 
            onClick={() => setActiveTab('checkout')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition ${activeTab === 'checkout' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            🛠️ 銷貨結帳
          </button>
          <button 
            onClick={() => setActiveTab('records')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition ${activeTab === 'records' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            📋 銷售紀錄
          </button>
          <button 
            onClick={() => setActiveTab('performance')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition ${activeTab === 'performance' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            📊 業績報表
          </button>
        </div>
        <span className="text-xs text-slate-500 font-medium mr-2">目前身份：管理員</span>
      </div>

      {/* 業績報表內容 */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-2">
            <h2 className="text-base font-bold text-slate-800">業績報表</h2>
            <p className="text-xs text-slate-400">檢視指定區間內的整體業績與毛利統計。</p>
            <div className="flex items-center gap-2 pt-2">
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700"
              />
              <span className="text-slate-400">~</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60 space-y-2">
              <span className="text-xs text-slate-400 font-medium">區間總業績</span>
              <h3 className="text-4xl font-mono font-bold text-slate-800">${totalRevenue.toLocaleString()}</h3>
            </div>
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60 space-y-2">
              <span className="text-xs text-slate-400 font-medium">區間總毛利</span>
              <h3 className="text-4xl font-mono font-bold text-emerald-600">+${totalProfit.toLocaleString()}</h3>
            </div>
          </div>
        </div>
      )}

      {/* 銷貨結帳或銷售紀錄的分頁佔位（可根據您原本的檔案內容替換） */}
      {activeTab !== 'performance' && (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-400 text-sm">
          正在顯示 {activeTab === 'checkout' ? '銷貨結帳' : '銷售紀錄'} 畫面...
        </div>
      )}
    </div>
  );
}
