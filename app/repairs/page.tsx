'use client';

import React from 'react';
import Link from 'next/link';

export default function RepairsPage() {
  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans">
      {/* 左側導覽列 */}
      <div className="w-64 bg-[#0B132B] text-slate-300 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 border-b border-slate-800">
            <h1 className="text-white font-bold text-sm">POS 門市系統</h1>
            <span className="text-[10px] text-slate-400 font-mono">v1.0.0</span>
          </div>
          <div className="p-4 space-y-1 text-xs">
            <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-400">🛒 控制台</Link>
            <Link href="/purchase" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-400">📦 進貨管理</Link>
            <Link href="/stock" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-400">📋 新品庫存管理</Link>
            <Link href="/used-phones" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-400">📱 中古機總覽</Link>
            <Link href="/repairs" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-600 text-white font-medium">🛠️ 維修管理</Link>
            <Link href="/reports" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-400">📊 營運報表</Link>
          </div>
        </div>
      </div>

      {/* 右側主畫面：獨立維修中心 */}
      <div className="flex-1 p-8 overflow-y-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-800">手機維修中心</h1>
            <p className="text-xs text-slate-400 mt-0.5">獨立維修管理、狀態追蹤與報價紀錄。</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm">＋ 新增維修單</button>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm border">
          <p className="text-xs text-slate-400">此處為獨立的維修頁面，不再與收銀畫面卡在一起。</p>
        </div>
      </div>
    </div>
  );
}
