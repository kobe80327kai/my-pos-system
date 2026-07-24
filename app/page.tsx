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

{activeTab === 'records' && (
  <div className="space-y-4">
    <div>
      <h1 className="text-xl font-bold text-slate-800">銷售紀錄</h1>
      <p className="text-xs text-slate-400 mt-0.5">查詢歷史銷貨明細、依日期與門市人員篩選。</p>
    </div>

    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          type="text"
          value={recordSearch}
          onChange={(e) => setRecordSearch(e.target.value)}
          placeholder="搜尋單號、客戶、人員、品名..."
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
        />
        <select
          value={filterSalesperson}
          onChange={(e) => setFilterSalesperson(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
        >
          <option value="全部門市人員">全部門市人員</option>
          <option value="管理員">管理員</option>
        </select>
        <select
          value={filterCustomerType}
          onChange={(e) => setFilterCustomerType(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
        >
          <option value="全部客戶類型">全部客戶類型</option>
          <option value="舊客">舊客</option>
        </select>
        <div className="flex gap-1.5">
          <input
            type="date"
            value={dateStart}
            onChange={(e) => { setDateStart(e.target.value); setDateFilterMode('custom'); }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-[10px]"
          />
          <input
            type="date"
            value={dateEnd}
            onChange={(e) => { setDateEnd(e.target.value); setDateFilterMode('custom'); }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-[10px]"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-[10px] text-slate-400">快速篩選：</span>
        <button onClick={() => handleDateFilterPreset('today')} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${dateFilterMode === 'today' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>今天</button>
        <button onClick={() => handleDateFilterPreset('week')} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${dateFilterMode === 'week' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>本週</button>
        <button onClick={() => handleDateFilterPreset('month')} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${dateFilterMode === 'month' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>本月</button>
        <button onClick={() => handleDateFilterPreset('all')} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${dateFilterMode === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>全部</button>
      </div>

      <div className="overflow-x-auto pt-2">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-medium">
              <th className="pb-3 px-3">單號 / 日期</th>
              <th className="pb-3 px-3">客戶</th>
              <th className="pb-3 px-3">銷售人員</th>
              <th className="pb-3 px-3">付款資訊</th>
              <th className="pb-3 px-3 text-right">總金額</th>
              <th className="pb-3 px-3 text-right">毛利</th>
              <th className="pb-3 px-3 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400">目前沒有符合條件的銷售紀錄</td>
              </tr>
            ) : (
              filteredRecords.map((r) => {
                const isExpanded = expandedRecordIds.includes(r.id);
                return (
                  <React.Fragment key={r.id}>
                    <tr className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-800 font-mono">{r.orderNo}</p>
                        <p className="text-[10px] text-slate-400">{r.date}</p>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700">{r.customerName}</td>
                      <td className="py-3 px-3 text-slate-600">{r.salesperson}</td>
                      <td className="py-3 px-3 text-slate-600">{r.paymentInfo}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">${r.totalAmount}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">+${r.profit}</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => toggleExpandRecord(r.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-600 transition"
                        >
                          {isExpanded ? '收起明細' : '展開明細'}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="bg-slate-50/60 p-4">
                          <div className="bg-white rounded-2xl p-4 border border-slate-200/60 space-y-2">
                            <p className="text-xs font-bold text-slate-700">購買品項明細：</p>
                            <div className="space-y-1.5">
                              {r.items.map((it, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-50 pb-1.5">
                                  <span className="font-medium text-slate-800">{it.name} × {it.quantity}</span>
                                  <span className="font-mono text-slate-600">單價: ${it.price} | 成本: ${it.cost}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}

{activeTab === 'reports' && (
  <div className="space-y-4">
    <div>
      <h1 className="text-xl font-bold text-slate-800">業績報表</h1>
      <p className="text-xs text-slate-400 mt-0.5">即時統計門市總營收、毛利與銷售筆數。</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-2">
        <p className="text-xs text-slate-400 font-medium">總營業額</p>
        <p className="text-2xl font-black font-mono text-slate-800">
          ${salesRecords.reduce((sum, r) => sum + r.totalAmount, 0)}
        </p>
      </div>
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-2">
        <p className="text-xs text-slate-400 font-medium">總毛利</p>
        <p className="text-2xl font-black font-mono text-emerald-600">
          +${salesRecords.reduce((sum, r) => sum + r.profit, 0)}
        </p>
      </div>
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-2">
        <p className="text-xs text-slate-400 font-medium">總銷售筆數</p>
        <p className="text-2xl font-black font-mono text-blue-600">
          {salesRecords.length} 筆
        </p>
      </div>
    </div>
  </div>
)}

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
