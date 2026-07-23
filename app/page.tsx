"use client";

import React, { useState, useEffect } from "react";

export default function PosSystem() {
  const [activeTab, setActiveTab] = useState<"checkout" | "records" | "reports">("records");

  // ---------------- 銷貨結帳相關 States ----------------
  const [cart, setCart] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState("個人貴賓");
  const [customerType, setCustomerType] = useState("個人貴賓");
  const [paymentMethod, setPaymentMethod] = useState("現金");
  const [discount, setDiscount] = useState(0);

  // 電信方案彈窗
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planSearch, setPlanSearch] = useState("");
  // 真實方案資料庫 (對應方案管理)
  const [posPlans, setPosPlans] = useState([
    { id: 1, name: "中華電信 5G 1399 (30期)", monthly: 1399, commission: 5000, code: "CHT1399" },
    { id: 2, name: "台灣大哥大 4G 688 (24期)", monthly: 688, commission: 3000, code: "TWM688" },
    { id: 3, name: "遠傳電信 5G 999 (24期)", monthly: 999, commission: 4000, code: "FET999" },
  ]);

  // ---------------- 銷售紀錄相關 States ----------------
  const [records, setRecords] = useState<any[]>([
    {
      id: "SD260723119",
      date: "2026-07-23",
      customer: "個人貴賓",
      customerType: "個人貴賓",
      staff: "管理員",
      total: 200,
      profit: 150,
      payment: "現金",
      items: [{ name: "滿版保貼", qty: 1, price: 200 }],
    },
  ]);

  // 銷售紀錄篩選
  const [recordSearch, setRecordSearch] = useState("");
  const [filterStaff, setFilterStaff] = useState("全部門市人員");
  const [filterCustType, setFilterCustType] = useState("全部客戶類型");
  const [startDate, setStartDate] = useState("2026-07-23");
  const [endDate, setEndDate] = useState("2026-07-23");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 修改銷售紀錄彈窗
  const [editingRecord, setEditingRecord] = useState<any | null>(null);

  // 加入商品至結帳車
  const addToCart = (item: any) => {
    setCart([...cart, { ...item, qty: 1 }]);
  };

  // 結帳送出
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("購物車是空的！");
      return;
    }
    const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0) - discount;
    const profit = Math.round(total * 0.3); // 模擬毛利
    const newRecord = {
      id: "SD" + Date.now().toString().slice(-9),
      date: new Date().toISOString().split("T")[0],
      customer: customerName,
      customerType: customerType,
      staff: "管理員",
      total: total > 0 ? total : 0,
      profit: profit,
      payment: paymentMethod,
      items: [...cart],
    };
    setRecords([newRecord, ...records]);
    setCart([]);
    alert("結帳成功！已新增至銷售紀錄。");
    setActiveTab("records");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* 頂部導覽列 */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-slate-500">快速切換：</span>
          <div className="flex bg-slate-100 p-1 rounded-lg space-x-1">
            <button
              onClick={() => setActiveTab("checkout")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === "checkout" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🛒 銷貨結帳
            </button>
            <button
              onClick={() => setActiveTab("records")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === "records" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              📄 銷售紀錄
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === "reports" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              📊 業績報表
            </button>
          </div>
        </div>
        <div className="text-sm text-slate-600">
          目前身份：<span className="font-semibold text-slate-900">管理員</span>
        </div>
      </header>

      {/* 主要內容區 */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {/* ================= 銷售紀錄頁面 ================= */}
        {activeTab === "records" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">銷售紀錄</h1>
              <p className="text-sm text-slate-500 mt-1">查詢與管理銷售訂單紀錄。</p>
            </div>

            {/* 搜尋與篩選條件面板 */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap gap-3 items-center">
                <input
                  type="text"
                  placeholder="搜尋單號 / 客戶 / 經手人員 / 商品名稱 / IMEI..."
                  value={recordSearch}
                  onChange={(e) => setRecordSearch(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-[280px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />

                <select
                  value={filterStaff}
                  onChange={(e) => setFilterStaff(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none"
                >
                  <option>全部門市人員</option>
                  <option>管理員</option>
                </select>

                <select
                  value={filterCustType}
                  onChange={(e) => setFilterCustType(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none"
                >
                  <option>全部客戶類型</option>
                  <option>個人貴賓</option>
                </select>

                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700"
                  />
                  <span className="text-slate-400">~</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-2 border-t border-slate-100">
                {["今日", "本週", "本月", "全部"].map((tag) => (
                  <button
                    key={tag}
                    className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                      tag === "今日"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* 紀錄列表 */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 text-sm text-slate-500">
                共 <span className="font-semibold text-slate-900">{records.length}</span> 筆紀錄
              </div>

              {records.map((rec) => {
                const isExpanded = expandedId === rec.id;
                return (
                  <div key={rec.id} className="border-b border-slate-100 last:border-none transition-colors hover:bg-slate-50/50">
                    <div className="p-4 flex items-center justify-between text-sm">
                      <div className="w-[180px]">
                        <div className="font-semibold text-blue-600">{rec.id}</div>
                        <div className="text-xs text-slate-400">{rec.date}</div>
                      </div>

                      <div className="w-[150px]">
                        <div className="font-medium text-slate-900">{rec.customer}</div>
                        <span className="inline-block bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded mt-0.5">
                          {rec.customerType}
                        </span>
                      </div>

                      <div className="w-[100px] text-slate-600">{rec.staff}</div>

                      <div className="w-[100px] font-semibold text-slate-900">${rec.total}</div>

                      <div className="w-[100px] font-semibold text-emerald-600">+${rec.profit}</div>

                      <div className="w-[80px]">
                        <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded">{rec.payment}</span>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingRecord(rec)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded font-medium transition-all"
                        >
                          修改
                        </button>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                          className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs rounded font-medium transition-all"
                        >
                          {isExpanded ? "收起" : "明細"}
                        </button>
                      </div>
                    </div>

                    {/* 展開明細內容 */}
                    {isExpanded && (
                      <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 space-y-2">
                        <div className="text-xs font-semibold text-slate-500 mb-2">銷售明細：</div>
                        {rec.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm text-slate-700 py-1">
                            <div>
                              {item.name} <span className="text-slate-400 text-xs">x {item.qty}</span>
                            </div>
                            <div className="font-medium">${item.price * item.qty}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= 銷貨結帳頁面 ================= */}
        {activeTab === "checkout" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-slate-900">快捷加入商品</h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => addToCart({ name: "滿版保貼", price: 200 })}
                    className="px-4 py-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 rounded-lg text-sm font-medium transition-all"
                  >
                    + 滿版保貼 ($200)
                  </button>
                  <button
                    onClick={() => addToCart({ name: "行動電源", price: 800 })}
                    className="px-4 py-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 rounded-lg text-sm font-medium transition-all"
                  >
                    + 行動電源 ($800)
                  </button>
                  <button
                    onClick={() => setShowPlanModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all"
                  >
                    + 選擇電信方案
                  </button>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4">購物車明細</h2>
                {cart.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm">目前購物車無商品，請點擊上方按鈕加入</div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-100 text-sm">
                        <span className="font-medium text-slate-800">{item.name}</span>
                        <span className="font-semibold text-slate-900">${item.price}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 結帳資訊面板 */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 h-fit">
              <h2 className="text-lg font-bold text-slate-900">結帳摘要</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-slate-500 mb-1 text-xs">客戶姓名</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 text-xs">付款方式</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none"
                  >
                    <option>現金</option>
                    <option>刷卡</option>
                    <option>轉帳</option>
                  </select>
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-between text-base font-bold text-slate-900">
                  <span>總計金額</span>
                  <span className="text-blue-600">
                    ${cart.reduce((sum, i) => sum + i.price * i.qty, 0) - discount}
                  </span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-md transition-all mt-4"
                >
                  確認結帳
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= 業績報表頁面 ================= */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">業績報表</h1>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-slate-500 text-sm">
              此處顯示店面整體營收與各門市人員業績統計數據。
            </div>
          </div>
        )}
      </main>

      {/* ================= 選擇電信方案彈窗 ================= */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">選擇電信方案</h3>
              <button
                onClick={() => setShowPlanModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              placeholder="搜尋方案名稱或代碼..."
              value={planSearch}
              onChange={(e) => setPlanSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {posPlans
                .filter(
                  (p) =>
                    p.name.toLowerCase().includes(planSearch.toLowerCase()) ||
                    p.code.toLowerCase().includes(planSearch.toLowerCase())
                )
                .map((plan) => (
                  <div
                    key={plan.id}
                    className="border border-slate-200 rounded-xl p-4 flex justify-between items-center hover:border-blue-500 hover:shadow-sm transition-all bg-white"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{plan.name}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        月租: ${plan.monthly} | 佣金: ${plan.commission}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        addToCart({ name: plan.name, price: plan.monthly });
                        setShowPlanModal(false);
                      }}
                      className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 text-xs font-semibold rounded-lg transition-all"
                    >
                      + 選擇
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= 修改銷售紀錄彈窗 ================= */}
      {editingRecord && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">修改銷售紀錄 ({editingRecord.id})</h3>
              <button
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-slate-500 mb-1 text-xs">銷貨日期</label>
                <input
                  type="date"
                  value={editingRecord.date}
                  onChange={(e) => setEditingRecord({ ...editingRecord, date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 text-xs">客戶姓名</label>
                <input
                  type="text"
                  value={editingRecord.customer}
                  onChange={(e) => setEditingRecord({ ...editingRecord, customer: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 text-xs">付款資訊</label>
                <input
                  type="text"
                  value={editingRecord.payment}
                  onChange={(e) => setEditingRecord({ ...editingRecord, payment: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  if (confirm("確定要刪除這筆紀錄嗎？")) {
                    setRecords(records.filter((r) => r.id !== editingRecord.id));
                    setEditingRecord(null);
                  }
                }}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-lg transition-all"
              >
                刪除這筆紀錄
              </button>
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg transition-all"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    setRecords(records.map((r) => (r.id === editingRecord.id ? editingRecord : r)));
                    setEditingRecord(null);
                    alert("修改成功！");
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all shadow-sm"
                >
                  儲存修改
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
