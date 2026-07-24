className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700"
                      >
                        <option value="現金">現金</option>
                        <option value="轉帳/匯款">轉帳/匯款</option>
                        <option value="刷卡">刷卡</option>
                        <option value="刷卡分期">刷卡分期</option>
                      </select>
                      {payments.length > 1 && (
                        <button 
                          onClick={() => setPayments(payments.filter((_, idx) => idx !== pIdx))} 
                          className="text-slate-400 hover:text-rose-600 text-sm px-1"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    {p.method === '刷卡分期' && (
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-500">分期期數：</span>
                        <select
                          value={p.installments}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPayments(payments.map((item, idx) => idx === pIdx ? { ...item, installments: val } : item));
                          }}
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium"
                        >
                          <option value="3">3期</option>
                          <option value="6">6期</option>
                          <option value="12">12期</option>
                          <option value="24">24期</option>
                        </select>
                      </div>
                    )}
                    {singleFee > 0 && (
                      <div className="flex justify-between items-center text-[10px] text-amber-600 font-medium pt-1">
                        <span>手續費率 ({singleRate * 100}%)：</span>
                        <span>+${singleFee}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>小計金額</span>
              <span className="font-mono">${subtotal}</span>
            </div>
            {totalFeeAmount > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>手續費總計</span>
                <span className="font-mono">+${totalFeeAmount}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-slate-800 pt-1">
              <span>應付總額</span>
              <span className="font-mono text-blue-600">${totalAmountWithFee}</span>
            </div>
            <div className="flex justify-between text-xs text-emerald-600 font-bold pt-1">
              <span>預估總毛利</span>
              <span className="font-mono">${totalProfit}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-blue-200 transition"
          >
            確認結帳
          </button>
        </div>
      </div>
    </div>
  </div>
)}

{/* 銷售紀錄頁面與報表頁面可在後續擴充 */}

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
);
}
