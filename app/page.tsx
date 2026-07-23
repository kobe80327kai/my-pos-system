<button onClick={() => handleDateFilterPreset('week')} className={`px-3.5 py-1 rounded-xl text-xs font-bold transition ${dateFilterMode === 'week' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>本週</button>
              <button onClick={() => handleDateFilterPreset('month')} className={`px-3.5 py-1 rounded-xl text-xs font-bold transition ${dateFilterMode === 'month' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>本月</button>
              <button onClick={() => handleDateFilterPreset('all')} className={`px-3.5 py-1 rounded-xl text-xs font-bold transition ${dateFilterMode === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>全部</button>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-400 font-bold">
                    <th className="p-4">單號 / 日期</th>
                    <th className="p-4">客戶 / 類型</th>
                    <th className="p-4">經手人員</th>
                    <th className="p-4">付款資訊</th>
                    <th className="p-4 text-right">總金額</th>
                    <th className="p-4 text-right">毛利</th>
                    <th className="p-4 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">目前沒有符合條件的銷售紀錄</td>
                    </tr>
                  ) : (
                    filteredRecords.map((r) => {
                      const isExpanded = expandedRecordIds.includes(r.id);
                      return (
                        <React.Fragment key={r.id}>
                          <tr className="hover:bg-slate-50/50 transition">
                            <td className="p-4">
                              <p className="font-bold font-mono text-slate-800">{r.orderNo}</p>
                              <p className="text-[10px] text-slate-400">{r.date}</p>
                            </td>
                            <td className="p-4">
                              <p className="font-bold text-slate-800">{r.customerName}</p>
                              <p className="text-[10px] text-slate-400">{r.customerType}</p>
                            </td>
                            <td className="p-4 font-medium text-slate-600">{r.salesperson}</td>
                            <td className="p-4 font-medium text-slate-600">{r.paymentInfo}</td>
                            <td className="p-4 text-right font-mono font-bold text-slate-800">${r.totalAmount}</td>
                            <td className="p-4 text-right font-mono font-bold text-emerald-600">
                              {r.profit >= 0 ? `+$${r.profit}` : `-$${Math.abs(r.profit)}`}
                            </td>
                            <td className="p-4 text-center space-x-2">
                              <button
                                onClick={() => toggleExpandRecord(r.id)}
                                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-bold transition"
                              >
                                {isExpanded ? '收起明細' + ' ▲' : '展開明細' + ' ▼'}
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`確定要刪除訂單 ${r.orderNo} 嗎？`)) {
                                    setSalesRecords(salesRecords.filter(item => item.id !== r.id));
                                  }
                                }}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[10px] font-bold transition"
                              >
                                刪除
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-slate-50/50">
                              <td colSpan={7} className="p-4 px-8">
                                <div className="bg-white p-4 rounded-2xl border border-slate-200/60 space-y-2">
                                  <p className="text-[10px] font-bold text-slate-400">商品明細：</p>
                                  <div className="space-y-1">
                                    {r.items.map((item, idx) => (
                                      <div key={idx} className="flex justify-between items-center text-xs">
                                        <span className="font-medium text-slate-700">{item.name} × {item.quantity}</span>
                                        <span className="font-mono text-slate-600">${item.price * item.quantity}</span>
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

      {/* 業績報表頁面 */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">業績報表</h1>
            <p className="text-xs text-slate-400 mt-0.5">檢視營業額與毛利統計分析。</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60 space-y-1">
              <p className="text-xs text-slate-400 font-medium">累計總營業額</p>
              <p className="text-2xl font-bold font-mono text-slate-800">
                ${salesRecords.reduce((sum, r) => sum + r.totalAmount, 0)}
              </p>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60 space-y-1">
              <p className="text-xs text-slate-400 font-medium">累計總毛利</p>
              <p className="text-2xl font-bold font-mono text-emerald-600">
                ${salesRecords.reduce((sum, r) => sum + r.profit, 0)}
              </p>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60 space-y-1">
              <p className="text-xs text-slate-400 font-medium">總銷售訂單數</p>
              <p className="text-2xl font-bold font-mono text-blue-600">{salesRecords.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* 客戶管理頁面 */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-slate-800">客戶管理</h1>
              <p className="text-xs text-slate-400 mt-0.5">完整建立與管理會員客戶資料。</p>
            </div>
            <button
              onClick={() => setIsCustomerModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-blue-700 transition"
            >
              + 新增客戶
            </button>
          </div>
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 space-y-4">
            <input
              type="text"
              value={custPageSearch}
              onChange={(e) => setCustPageSearch(e.target.value)}
              placeholder="搜尋客戶姓名 / 電話..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs"
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-400 font-bold">
                    <th className="p-4">會員編號</th>
                    <th className="p-4">姓名</th>
                    <th className="p-4">電話</th>
                    <th className="p-4">類型</th>
                    <th className="p-4">性別</th>
                    <th className="p-4 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers
                    .filter(c => !custPageSearch || c.name.includes(custPageSearch) || c.phone.includes(custPageSearch))
                    .map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4 font-mono text-slate-500">{c.id}</td>
                        <td className="p-4 font-bold text-slate-800">{c.name}</td>
                        <td className="p-4 font-mono text-slate-600">{c.phone}</td>
                        <td className="p-4 text-slate-600">{c.type || '舊客'}</td>
                        <td className="p-4 text-slate-600">{c.gender || '—'}</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => {
                              if (confirm(`確定要刪除客戶 ${c.name} 嗎？`)) {
                                setCustomers(customers.filter(item => item.id !== c.id));
                              }
                            }}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[10px] font-bold transition"
                          >
                            刪除
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 方案管理頁面 */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-slate-800">方案管理</h1>
              <p className="text-xs text-slate-400 mt-0.5">管理電信資費方案與預設佣金。</p>
            </div>
            <button
              onClick={() => {
                setEditingPlan({ id: `pl-${Date.now()}`, planCode: '', name: '', telecom: '遠傳電信', type: '新申辦', network: '5G', monthlyFee: 799, contractMonths: 24, prepayment: '—', storeRebate: 5000, actualRebate: 0 });
                setIsPlanEditModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-blue-700 transition"
            >
              + 新增方案
            </button>
          </div>
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 space-y-4">
            <input
              type="text"
              value={planPageSearch}
              onChange={(e) => setPlanPageSearch(e.target.value)}
              placeholder="搜尋方案名稱 / 電信商 / 代碼..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs"
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-400 font-bold">
                    <th className="p-4">方案代碼</th>
                    <th className="p-4">方案名稱</th>
                    <th className="p-4">電信商</th>
                    <th className="p-4">類型 / 網路</th>
                    <th className="p-4">月租費</th>
                    <th className="p-4">佣金</th>
                    <th className="p-4 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {plans
                    .filter(pl => !planPageSearch || pl.name.includes(planPageSearch) || pl.telecom.includes(planPageSearch) || pl.planCode.includes(planPageSearch))
                    .map(pl => (
                      <tr key={pl.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4 font-mono text-slate-500">{pl.planCode}</td>
                        <td className="p-4 font-bold text-slate-800">{pl.name}</td>
                        <td className="p-4 text-slate-600">{pl.telecom}</td>
                        <td className="p-4 text-slate-600">{pl.type} / {pl.network}</td>
                        <td className="p-4 font-mono text-slate-600">${pl.monthlyFee}</td>
                        <td className="p-4 font-mono text-emerald-600 font-bold">${pl.storeRebate}</td>
                        <td className="p-4 text-center space-x-2">
                          <button
                            onClick={() => {
                              setEditingPlan(pl);
                              setIsPlanEditModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-bold transition"
                          >
                            編輯
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`確定要刪除方案 ${pl.name} 嗎？`)) {
                                setPlans(plans.filter(item => item.id !== pl.id));
                              }
                            }}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[10px] font-bold transition"
                          >
                            刪除
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 方案選擇彈窗 */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-xl space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-800">選擇電信方案</h3>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-slate-400 hover:text-rose-600 text-base">×</button>
            </div>
            <input
              type="text"
              value={planSearch}
              onChange={(e) => setPlanSearch(e.target.value)}
              placeholder="搜尋方案名稱 / 電信商..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs"
            />
            <div className="overflow-y-auto space-y-2 flex-1">
              {filteredPlans.map(pl => (
                <div key={pl.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-2xl hover:bg-blue-50/50 transition">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{pl.name} ({pl.telecom})</p>
                    <p className="text-[10px] text-slate-400">月租: ${pl.monthlyFee} | 佣金: ${pl.storeRebate}</p>
                  </div>
                  <button onClick={() => addPlanToCart(pl)} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-bold">代入方案</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 自訂項目彈窗 */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-800">新增自訂項目 / 維修服務</h3>
              <button onClick={() => setIsCustomModalOpen(false)} className="text-slate-400 hover:text-rose-600 text-base">×</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">類型</label>
                <select value={customType} onChange={(e) => setCustomType(e.target.value as any)} className="w-full bg-slate-50 border rounded-xl px-3 py-2">
                  <option value="自訂配件/商品">自訂配件/商品</option>
                  <option value="維修服務">維修服務</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">名稱</label>
                <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="例：iPhone 14 換螢幕" className="w-full bg-slate-50 border rounded-xl px-3 py-2" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">售價 ($)</label>
                <input type="number" value={customPrice} onChange={(e) => setCustomPrice(Number(e.target.value))} className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-mono" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">成本 ($)</label>
                <input type="number" value={customCost} onChange={(e) => setCustomCost(Number(e.target.value))} className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-mono" />
              </div>
              <button onClick={handleAddCustomItem} className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-sm">確認加入購物車</button>
            </div>
          </div>
        </div>
      )}

      {/* 快速建立客戶彈窗 */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-800">快速建立會員</h3>
              <button onClick={() => setIsCustomerModalOpen(false)} className="text-slate-400 hover:text-rose-600 text-base">×</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">客戶姓名</label>
                <input type="text" value={newCustName} onChange={(e) => setNewCustName(e.target.value)} placeholder="例：王小明" className="w-full bg-slate-50 border rounded-xl px-3 py-2" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">聯絡電話</label>
                <input type="text" value={newCustPhone} onChange={(e) => setNewCustPhone(e.target.value)} placeholder="例：0912345678" className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-mono" />
              </div>
              <button onClick={handleCreateCustomer} className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-sm">確認新增並選取</button>
            </div>
          </div>
        </div>
      )}

      {/* 方案編輯彈窗 */}
      {isPlanEditModalOpen && editingPlan && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-800">{editingPlan.id?.startsWith('pl-') ? '新增方案' : '編輯方案'}</h3>
              <button onClick={() => setIsPlanEditModalOpen(false)} className="text-slate-400 hover:text-rose-600 text-base">×</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">方案名稱</label>
                <input type="text" value={editingPlan.name || ''} onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })} placeholder="例：NP799-24" className="w-full bg-slate-50 border rounded-xl px-3 py-2" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">方案代碼</label>
                <input type="text" value={editingPlan.planCode || ''} onChange={(e) => setEditingPlan({ ...editingPlan, planCode: e.target.value })} placeholder="例：PLN8767" className="w-full bg-slate-50 border rounded-xl px-3 py-2" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">電信商</label>
                <input type="text" value={editingPlan.telecom || ''} onChange={(e) => setEditingPlan({ ...editingPlan, telecom: e.target.value })} placeholder="例：遠傳電信" className="w-full bg-slate-50 border rounded-xl px-3 py-2" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">月租費 ($)</label>
                <input type="number" value={editingPlan.monthlyFee || 0} onChange={(e) => setEditingPlan({ ...editingPlan, monthlyFee: Number(e.target.value) })} className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-mono" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">預設佣金 ($)</label>
                <input type="number" value={editingPlan.storeRebate || 0} onChange={(e) => setEditingPlan({ ...editingPlan, storeRebate: Number(e.target.value) })} className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-mono" />
              </div>
              <button
                onClick={() => {
                  if (!editingPlan.name) {
                    alert('請輸入方案名稱');
                    return;
                  }
                  if (editingPlan.id && plans.some(p => p.id === editingPlan.id)) {
                    setPlans(plans.map(p => p.id === editingPlan.id ? (editingPlan as PlanItem) : p));
                  } else {
                    setPlans([...plans, { ...(editingPlan as PlanItem), id: `pl-${Date.now()}` }]);
                  }
                  setIsPlanEditModalOpen(false);
                }}
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-sm"
              >
                儲存方案
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
