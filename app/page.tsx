'use client';

import React, { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  cost: number;
  quantity: number;
  type: string;
}

interface SaleRecord {
  id: string;
  orderNo: string;
  date: string;
  customerName: string;
  salesperson: string;
  items: { name: string; price: number; cost: number; quantity: number }[];
  totalAmount: number;
  profit: number;
  paymentInfo: string;
}

export default function ControlPage() {
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [salesRecords, setSalesRecords] = useState<SaleRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pos_sales_records');
      if (saved) return JSON.parse(saved);
    }
    return [];
  });

  const products: Product[] = [
    { id: 'p1', name: '滿版保貼', price: 200, cost: 50, stock: 10, category: '配件' },
    { id: 'p2', name: 'AIR6皮套', price: 200, cost: 70, stock: 8, category: '配件' },
    { id: 'p3', name: 'iPhone 15 128G', price: 25900, cost: 23000, stock: 3, category: '手機' },
  ];

  useEffect(() => {
    localStorage.setItem('pos_sales_records', JSON.stringify(salesRecords));
  }, [salesRecords]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const addToCart = (item: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, cost: item.cost, quantity: 1, type: 'product' }];
    });
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalProfit = cart.reduce((sum, item) => sum + (item.price - item.cost) * item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('購物車目前沒有項目！');
      return;
    }
    const orderNo = `SD${getTodayStr().replace(/-/g, '').slice(2)}${Math.floor(100 + Math.random() * 900)}`;
    const newRecord: SaleRecord = {
      id: `sr-${Date.now()}`,
      orderNo,
      date: getTodayStr(),
      customerName: '散客',
      salesperson: '管理員',
      items: cart.map(i => ({ name: i.name, price: i.price, cost: i.cost, quantity: i.quantity })),
      totalAmount: subtotal,
      profit: totalProfit,
      paymentInfo: '現金'
    };

    setSalesRecords([newRecord, ...salesRecords]);
    alert(`結帳成功！單號：${orderNo}`);
    setCart([]);
  };

  const filteredProducts = products.filter(p => 
    !productSearch || p.name.includes(productSearch) || p.id.includes(productSearch)
  );

  return (
    <div className="p-8 space-y-6 w-full">
      <h1 className="text-xl font-bold text-slate-800">控制台 / 銷貨結帳</h1>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 shadow-sm border space-y-4">
          <input
            type="text"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="搜尋商品名稱 / 商品編號 / IMEI..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs"
          />
          <div className="space-y-2">
            {filteredProducts.map((p) => (
              <div key={p.id} onClick={() => addToCart(p)} className="flex justify-between items-center p-3.5 border rounded-xl cursor-pointer hover:bg-blue-50/50 transition">
                <div>
                  <p className="text-xs font-bold">{p.name}</p>
                  <p className="text-[10px] text-slate-400">庫存: {p.stock}</p>
                </div>
                <span className="text-xs text-blue-600 font-mono font-bold">${p.price}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 shadow-sm border space-y-4">
          <h3 className="text-xs font-bold text-slate-700">購物車</h3>
          <div className="space-y-2 min-h-[150px]">
            {cart.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">購物車是空的</p>
            ) : (
              cart.map((i) => (
                <div key={i.id} className="flex justify-between text-xs py-1 border-b">
                  <span>{i.name} x {i.quantity}</span>
                  <span className="font-mono">${i.price * i.quantity}</span>
                </div>
              ))
            )}
          </div>
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm font-bold">
              <span>小計</span>
              <span className="font-mono text-rose-600">${subtotal}</span>
            </div>
            <button onClick={handleCheckout} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition">
              確認結帳
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
