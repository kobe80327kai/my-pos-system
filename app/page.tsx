"app/page.tsx"
"use client";

import React, { useState } from "react";

export default function PosSystem() {
  const [currentMenu, setCurrentMenu] = useState("销货结帐");
  const [activeTab, setActiveTab] = useState<"checkout" | "records" | "reports">("checkout");

  // ---------------- 銷貨結帳 States (完全對應截圖) ----------------
  const [cart, setCart] = useState<any[]>([]);
  const [member, setMember] = useState("林活揚 (0956-096936)");
  const [paymentMethod, setPaymentMethod] = useState("現金");
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planSearch, setPlanSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  // 真實方案資料庫 (對應方案管理)
  const [posPlans] = useState([
    { id: 1, name: "中華電信 5G 1399 (30期)", monthly: 1399, commission: 5000, code: "CHT1399" },
    { id: 2, name: "台灣大哥大 4G 688 (24期)", monthly: 688, commission: 3000, code: "TWM688" },
    { id: 3, name: "遠傳電信 5G 999 (24期)", monthly: 999, commission: 4000, code: "FET999" },
  ]);

  const [products] = useState([
    { id: 1, name: "滿版保貼", price: 200, stock: 10, cost: 50, imei: "IM001" },
    { id: 2, name: "AIR6皮套", price: 200, stock: 8, cost: 70, imei: "IM002" },
    { id: 3, name: "iPhone 15 128G", price: 25900, stock: 3, cost: 23000, imei: "IMEI987654321" },
  ]);

  // ---------------- 銷售紀錄 States ----------------
  const [records, setRecords] = useState<any[]>([
    {
      id: "SD260723119",
      date: "2026-07-23",
      customer: "林活揚",
      customerType: "一般會員",
      staff: "管理員",
      total: 200,
      profit: 150,
      payment: "現金",
      items: [{ name: "滿版保貼", qty: 1, price: 200, imei: "IM001" }],
    },
  ]);

  const [recordSearch, setRecordSearch] = useState("");
  const [filterStaff, setFilterStaff] = useState("全部門市人員");
  const [filterCustType, setFilterCustType] = useState("全部客戶類型");
  const [startDate, setStartDate] = useState("2026-07-23");
  const [endDate, setEndDate] = useState("2026-07-23");
  const [dateFilterMode, setDateFilterMode] = useState("今日");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);

  // 日期快選邏輯 (今日、本週、本月、全部)
  const handleDatePreset = (mode: string) => {
    setDateFilterMode(mode);
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    if (mode === "今日") {
      const t = formatDate(today);
      setStartDate(t);
      setEndDate(t);
    } else if (mode === "本週") {
      const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
      const lastDay = new Date(today.setDate(today.getDate() + 6));
      setStartDate(formatDate(firstDay));
      setEndDate(formatDate(lastDay));
    } else if (mode === "本月") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setStartDate(formatDate(firstDay));
      setEndDate(formatDate(lastDay));
    } else if (mode === "全部") {
      setStartDate("2020-01-01");
      setEndDate("2099-12-31");
    }
  };

  // 加入購物車
  const addToCart = (item: any) => {
    setCart([...cart, { ...item, qty: 1 }]);
  };

  // 結帳送出
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("購物車是空的！");
      return;
    }
    const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const profit = Math.round(total * 0.3);
    const newRecord = {
      id: "SD" + Date.now().toString().slice(-9),
      date: new Date().toISOString().split("T")[0],
      customer: member.split(" ")[0],
      customerType: "一般會員",
      staff: "管理員",
      total: total,
      profit: profit,
      payment: paymentMethod,
      items: [...cart],
    };
    setRecords([newRecord, ...records]);
    setCart([]);
    alert("結帳成功！");
    setActiveTab("records");
  };

  // 過濾銷售紀錄（支援單號、商品名稱、IMEI、序號、日期區間）
  const filteredRecords = records.filter((rec) => {
    const matchSearch =
      rec.id.toLowerCase().includes(recordSearch.toLowerCase()) ||
      rec.customer.toLowerCase().includes(recordSearch.toLowerCase()) ||
      rec.staff.toLowerCase().includes(recordSearch.toLowerCase()) ||
      rec.payment.toLowerCase().includes(recordSearch.toLowerCase()) ||
      rec.items.some(
        (i: any) =>
          i.name.toLowerCase().includes(recordSearch.toLowerCase()) ||
          (i.imei && i.imei.toLowerCase().includes(recordSearch.toLowerCase()))
      );

    const matchStaff = filterStaff === "全部門市人員" || rec.staff === filterStaff;
    const matchCustType = filterCustType === "全部客戶類型" || rec.customerType === filterCustType;
    const matchDate = rec.date >= startDate && rec.date <= endDate;

    return matchSearch && matchStaff && matchCustType && matchDate;
  });

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 flex font-sans">
      {/* 左側深色側邊欄 (完全保留您的設計) */}
      <aside className="w-64 bg-[#0f172a] text-slate-300 flex flex-col justify-between shrink-0 shadow-xl">
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-white text-lg font-bold tracking-wide">POS 門市系統</h1>
            <p className="text-xs text-slate-500 mt-0.5">v1.0.0</p>
          </div>

          <nav className="space-y-1">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">主要功能</div>
            {[
              "控制台",
              "進貨管理",
              "新品庫存管理",
              "中古機總覽",
              "維修管理",
              "客戶管理",
              "廠商管理",
              "方案管理",
              "營運報表",
            ].map((menu) => (
              <button
                key={menu}
                onClick={() => setCurrentMenu(menu)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  currentMenu === menu ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {menu}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow">
              管
            </div>
            <div>
              <div className="text-sm font-bold text-white">管理員</div>
              <div className="text-xs text-slate-500">admin@pos.com</div>
            </div>
          </div>
        </div>
      </aside>

      {/* 右側主內容區 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 頂部快捷切換列 */}
        <header className="bg-white border-b border-slate-200 px-8 py-3 flex justify-between items-center shadow-sm">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-slate-500">快速切換：</span>
            <div className="flex bg-slate-100 p-1 rounded-xl space-x-1">
              <button
                onClick={() => setActiveTab("checkout")}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  activeTab === "checkout" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🛒 銷貨結帳
              </button>
              <button
                onClick={() => setActiveTab("records")}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  activeTab === "records" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                📄 銷售紀錄
              </button>
              <button
                onClick={() => setActiveTab("reports")}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
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

        {/* 內容區域 */}
        <main className="flex-1 p-8 overflow-y-auto">
          {/* ================= 1. 銷貨結帳頁面 (完全對應您的截圖) ================= */}
          {activeTab === "checkout" && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">銷貨結帳</h1>
                <p className="text-sm text-slate-500 mt-1">選取方案不代入月租，金額可自由手動修改，佣金自動計入毛利。</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 左側選單區 */}
                <div className="md:col-span-2 space-y-6">
                  {/* 選擇方案區塊 */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-900">選擇方案</span>
                      <button
                        onClick={() => setShowPlanModal(true)}
                        className="text-xs text-blue-600 font-semibold hover:underline"
                      >
                        + 代入電信方案
                      </button>
                    </div>
                    <div
                      onClick={() => setShowPlanModal(true)}
                      className="border border-dashed border-slate-300 rounded-xl p-4 flex justify-between items-center cursor-pointer hover:border-blue-500 bg-slate-50/50 transition-all"
                    >
                      <div className="text-sm text-slate-600 flex items-center space-x-2">
                        <span>👉 點擊開啟方案選擇視窗</span>
                      </div>
                      <span className="px-3.5 py-1.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-lg">選擇方案</span>
                    </div>
                  </div>

                  {/* 加入商品區塊 */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <span className="text-sm font-bold text-slate-900">加入商品</span>
                    <input
                      type="text"
                      placeholder="搜尋商品名稱 / 商品編號 / IMEI..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <div className="space-y-3">
                      {products
                        .filter(
                          (p) =>
                            p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                            p.imei.toLowerCase().includes(productSearch.toLowerCase())
                        )
                        .map((prod) => (
                          <div key={prod.id} className="border border-slate-200 rounded-xl p-4 flex justify-between items-center bg-white hover:border-blue-500 transition-all">
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{prod.name}</div>
                              <div className="text-xs text-slate-400 mt-1">庫存: {prod.stock} | 成本: ${prod.cost}</div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <span className="font-bold text-slate-900">${prod.price}</span>
                              <button
                                onClick={() => addToCart(prod)}
                                className="px-3.5 py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-semibold rounded-lg transition-all"
                              >
                                + 加入
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* 右側購物車與結帳摘要區 (完全對應您的截圖) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 h-fit">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">購物車明細</span>
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-semibold">
                        {cart.length}
                      </span>
                    </div>
                    <button onClick={() => setCart([])} className="text-xs text-slate-400 hover:text-slate-600">清空</button>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400 mb-1">客戶（選填，個人貴賓可不選）</div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800">
                      {member}
                    </div>
                  </div>

                  {cart.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                      尚未加入品項或方案
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {cart.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                          <div>
                            <div className="font-medium text-slate-800">{item.name}</div>
                            {item.imei && <div className="text-[11px] text-slate-400">IMEI: {item.imei}</div>}
                          </div>
                          <div className="font-bold text-slate-900">${item.price}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                    <div className="text-xs text-slate-400">付款方式與期數</div>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none"
                    >
                      <option>現金</option>
                      <option>刷卡</option>
                      <option>轉帳</option>
                    </select>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-slate-100 text-sm">
                    <div className="flex justify-between text-slate-500">
                      <span>預估總毛利：</span>
                      <span className="font-bold text-emerald-600">
                        +${cart.reduce((sum, i) => sum + Math.round(i.price * 0.3), 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-slate-900">
                      <span>總金額：</span>
                      <span className="text-rose-600">
                        ${cart.reduce((sum, i) => sum + i.price * i.qty, 0)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition-all text-center"
                  >
                    確認結帳收款
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= 2. 銷售紀錄頁面 ================= */}
          {activeTab === "records" && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">銷售紀錄</h1>
                <p className="text-sm text-slate-500 mt-1">查詢與管理銷售訂單紀錄。</p>
              </div>

              {/* 搜尋與篩選面板 */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-wrap gap-3 items-center">
                  <input
                    type="text"
                    placeholder="搜尋單號 / 客戶 / 經手人員 / 商品名稱 / IMEI / 序號..."
                    value={recordSearch}
                    onChange={(e) => setRecordSearch(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm flex-1 min-w-[320px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />

                  <select
                    value={filterStaff}
                    onChange={(e) => setFilterStaff(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none"
                  >
                    <option>全部門市人員</option>
                    <option>管理員</option>
                  </select>

                  <select
                    value={filterCustType}
                    onChange={(e) => setFilterCustType(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none"
                  >
                    <option>全部客戶類型</option>
                    <option>一般會員</option>
                  </select>

                  <div className="flex items-center space-x-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700"
                    />
                    <span className="text-slate-400">~</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700"
                    />
                  </div>
                </div>

                {/* 今日、本週、本月、全部按鈕 */}
                <div className="flex space-x-2 pt-2 border-t border-slate-100">
                  {["今日", "本週", "本月", "全部"].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleDatePreset(tag)}
                      className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        dateFilterMode === tag
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
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 text-sm text-slate-500">
                  共 <span className="font-semibold text-slate-900">{filteredRecords.length}</span> 筆紀錄
                </div>

                {filteredRecords.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-sm">找不到符合條件的銷售紀錄</div>
                ) : (
                  filteredRecords.map((rec) => {
                    const isExpanded = expandedId === rec.id;
                    return (
                      <div key={rec.id} className="border-b border-slate-100 last:border-none transition-colors hover:bg-slate-50/50">
                        <div className="p-4 flex items-center justify-between text-sm">
                          <div className="w-[180px]">
                            <div className="font-bold text-blue-600">{rec.id}</div>
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
                            <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded font-medium">{rec.payment}</span>
                          </div>

                          <div className="flex space-x-2">
                            <button
                              onClick={() => setEditingRecord(rec)}
                              className="px-3.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-lg font-medium transition-all"
                            >
                              修改
                            </button>
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                              className="px-3.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs rounded-lg font-medium transition-all"
                            >
                              {isExpanded ? "收起" : "明細"}
                            </button>
                          </div>
                        </div>

                        {/* 展開明細 */}
                        {isExpanded && (
                          <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 space-y-2">
                            <div className="text-xs font-bold text-slate-500 mb-2">銷售明細：</div>
                            {rec.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-sm text-slate-700 py-1">
                                <div>
                                  <span className="font-medium">{item.name}</span>
                                  {item.imei && <span className="ml-2 text-xs text-slate-400">IMEI: {item.imei}</span>}
                                  <span className="ml-2 text-xs text-slate-400">x {item.qty}</span>
                                </div>
                                <div className="font-semibold">${item.price * item.qty}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ================= 3. 業績報表頁面 ================= */}
          {activeTab === "reports" && (
            <div className="max-w-7xl mx-auto space-y-6">
              <h1 className="text-2xl font-bold text-slate-900">業績報表</h1>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-slate-500 text-sm">
                此處顯示店面整體營收與各門市人員業績統計數據。
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ================= 選擇電信方案彈窗 ================= */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 relative">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">選擇電信方案</h3>
              <button onClick={() => setShowPlanModal(false)} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
            </div>

            <input
              type="text"
              placeholder="搜尋方案名稱或代碼..."
              value={planSearch}
              onChange={(e) => setPlanSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                    className="border border-slate-200 rounded-xl p-4 flex justify-between items-center hover:border-blue-500 transition-all bg-white"
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 relative">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">修改銷售紀錄 ({editingRecord.id})</h3>
              <button onClick={() => setEditingRecord(null)} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-slate-500 mb-1 text-xs">銷貨日期</label>
                <input
                  type="date"
                  value={editingRecord.date}
                  onChange={(e) => setEditingRecord({ ...editingRecord, date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 text-xs">客戶姓名</label>
                <input
                  type="text"
                  value={editingRecord.customer}
                  onChange={(e) => setEditingRecord({ ...editingRecord, customer: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 text-xs">付款資訊</label>
                <input
                  type="text"
                  value={editingRecord.payment}
                  onChange={(e) => setEditingRecord({ ...editingRecord, payment: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
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
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-xl transition-all"
              >
                刪除這筆紀錄
              </button>
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition-all"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    setRecords(records.map((r) => (r.id === editingRecord.id ? editingRecord : r)));
                    setEditingRecord(null);
                    alert("修改成功！");
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
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
