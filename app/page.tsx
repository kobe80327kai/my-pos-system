'use client';

import React, { useState } from 'react';

export default function POSPage() {
  // 狀態宣告
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [planSearch, setPlanSearch] = useState('');
  const [customType, setCustomType] = useState<'自訂配件/商品' | '維修服務'>('自訂配件/商品');
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState(0);
  const [customCost, setCustomCost] = useState(0);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  const [payments, setPayments] = useState<{ method: string; installments: string }[]>([
    { method: '現金', installments: '3' }
  ]);

  const subtotal = 0;
  const totalFeeAmount = 0;
  const totalAmountWithFee = 0;
  const totalProfit = 0;

  const filteredPlans: any[] = [];
  const handleCheckout = () => {};
  const addPlanToCart = (pl: any) => {};
  const handleAddCustomItem = () => {};
  const handleCreateCustomer = () => {};

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-xl font-bold text-slate-800">POS 系統</h1>

        {/* 方案選擇彈窗 */}
        {isPlanModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-xl border border-slate-200">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800">選擇電信方案</h3>
                <button onClick={() => setIsPlanModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">×</button>
              </div>
              <input
                type="text"
                value={planSearch}
                onChange={(e) => setPlanSearch(e.target.value)}
                placeholder="搜尋方案名稱、電信商或代碼..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
              />
              <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredPlans.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">無相符方案</p>
                ) : (
                  filteredPlans.map(pl => (
                    <div
                      key={pl.id}
                      onClick={() => addPlanToCart(pl)}
                      className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-2xl cursor-pointer flex justify-between items-center transition text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-800">{pl.name} <span className="text-[10px] text-slate-400 font-mono">({pl.telecom})</span></p>
                        <p className="text-[10px] text-slate-500">月租: ${pl.monthlyFee} | 佣金: ${pl.storeRebate}</p>
                      </div>
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-bold">+ 代入</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 自訂項目彈窗 */}
        {isCustomModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800">新增自訂 / 維修項目</h3>
                <button onClick={() => setIsCustomModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">×</button>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-500 block mb-1">類型</label>
                  <select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  >
                    <option value="自訂配件/商品">自訂配件/商品</option>
                    <option value="維修服務">維修服務</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">項目名稱</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="例如：螢幕破裂維修、包膜..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">售價 ($)</label>
                  <input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">成本 ($)</label>
                  <input
                    type="number"
                    value={customCost}
                    onChange={(e) => setCustomCost(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
              </div>
              <button
                onClick={handleAddCustomItem}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition"
              >
                確認新增至購物車
              </button>
            </div>
          </div>
        )}

        {/* 快速新增會員彈窗 */}
        {isCustomerModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800">快速建立會員</h3>
                <button onClick={() => setIsCustomerModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">×</button>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-500 block mb-1">客戶姓名</label>
                  <input
                    type="text"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    placeholder="請輸入姓名"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">聯絡電話</label>
                  <input
                    type="text"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="請輸入電話"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>
              <button
                onClick={handleCreateCustomer}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition"
              >
                建立並選取客戶
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
