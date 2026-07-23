'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ControlPage() {
  const [cart, setCart] = useState<{ id: string; name: string; price: number; quantity: number }[]>([]);
  const products = [
    { id: 'p1', name: '滿版保貼', price: 200, stock: 10 },
    { id: 'p2', name: 'AIR6皮套', price: 200, stock: 8 },
    { id: 'p3', name: 'iPhone 15 128G', price: 25900, stock: 3 },
  ];

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
            <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-600 text-white font-medium">🛒 控制台</Link>
            <Link href="/purchase" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-400">📦 進貨管理</Link>
            <Link href="/stock" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-400">📋 新品庫存管理</Link>
            <Link href="/used-phones" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-400">📱 中古機總覽</Link>
            <Link href="/repairs" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-400">🛠️ 維修管理</Link>
            <Link href="/reports" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-400">📊 營運報表</Link>
          </div>
        </div>
      </div>

      {/* 右側主畫面：純收銀 */}
      <div className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-xl font-bold text-slate-800 mb-6">控制台 / 銷貨結帳</h1>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 shadow-sm border space-y-3">
            {products.map((p) => (
              <div key={p.id} onClick={() => setCart([...cart, { ...p, quantity: 1 }])} className="flex justify-between items-center p-3.5 border rounded-xl cursor-pointer hover:bg-blue-50">
                <div>
                  <p className="text-xs font-bold">{p.name}</p>
                  <p className="text-[10px] text-slate-400">庫存: {p.stock}</p>
                </div>
                <span className="text-xs text-blue-600 font-mono font-bold">${p.price}</span>
              </div>
            ))}
          </div>
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 shadow-sm border space-y-4">
            <h3 className="text-xs font-bold">購物車</h3>
            <div className="min-h-[150px]">
              {cart.map((i, idx) => (
                <div key={idx} className="flex justify-between text-xs py-1 border-b">
                  <span>{i.name}</span>
                  <span>${i.price}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 flex justify-between text-sm font-bold">
              <span>小計</span>
              <span className="text-rose-600">${subtotal}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
