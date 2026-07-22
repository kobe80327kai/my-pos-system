export const dynamic = 'force-dynamic'
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // 請確認您的 Supabase client 引入路徑

// 銷售歷史型態
interface SaleRecord {
  orderId: string;
  date: string;
  operator: string;
  amount: number;
  itemsCount: number;
}

// 1. 客戶資料型態
interface Customer {
  id: string;
  name: string;
  phone: string;
  category: string;
  birthday?: string;
  gender: '男' | '女' | '其他';
  address?: string;
  idNumber?: string;
  note?: string;
  salesHistory?: SaleRecord[];
}

export default function CustomersPage() {
  // ---- 預設分類標籤 ----
  const [categories, setCategories] = useState<string[]>([
    '來店客',
    '網路客',
    '同行',
    '介紹客',
    '舊客',
    '其他',
    '朋友',
  ]);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // ---- 搜尋與篩選 State ----
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('全部');

  // ---- Modal 開關與表單 ----
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState<{
    id: string;
    category: string;
    name: string;
    phone: string;
    idNumber: string;
    birthday: string;
    gender: '男' | '女' | '其他';
    note: string;
    address: string;
  }>({
    id: '',
    category: '舊客',
    name: '',
    phone: '',
    idNumber: '',
    birthday: '',
    gender: '男',
    note: '',
    address: '',
  });

  // ---- 銷售歷史 Modal 相關 State ----
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [activeCustomerForSales, setActiveCustomerForSales] = useState<Customer | null>(null);

  // ---- 客戶列表 State (從 Supabase 動態讀取) ----
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // ---- 核心：從 Supabase 讀取客戶資料 ----
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('讀取客戶資料失敗：', error.message);
      } else if (data) {
        // 將資料庫欄位名稱轉為前端所需的結構
        const mappedData: Customer[] = data.map((item: any) => ({
          id: item.id,
          name: item.name || '',
          phone: item.phone || '',
          category: item.category || '舊客',
          birthday: item.birthday || '—',
          gender: item.gender || '男',
          address: item.address || '—',
          idNumber: item.id_number || item.idNumber || '—',
          note: item.note || '—',
          salesHistory: item.sales_history || item.salesHistory || [],
        }));
        setCustomers(mappedData);
      }
    } catch (err) {
      console.error('連線 Supabase 發生錯誤：', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // ---- 開啟銷售歷史 Modal ----
  const handleOpenSalesHistory = (customer: Customer) => {
    setActiveCustomerForSales(customer);
    setIsSalesModalOpen(true);
  };

  // ---- 新增分類 ----
  const handleAddCategory = () => {
    if (!newCategoryInput.trim()) return;
    if (categories.includes(newCategoryInput.trim())) {
      alert('該分類已存在！');
      return;
    }
    setCategories([...categories, newCategoryInput.trim()]);
    setNewCategoryInput('');
  };

  // ---- 刪除分類 ----
  const handleRemoveCategory = (catToDelete: string) => {
    setCategories(categories.filter((c) => c !== catToDelete));
    if (selectedCategoryTab === catToDelete) {
      setSelectedCategoryTab('全部');
    }
  };

  // ---- 核心：修復後的刪除客戶（發送 Supabase DELETE API） ----
  const handleDeleteCustomer = async (id: string, name: string) => {
    if (!confirm(`確定要永久刪除客戶 [${name}] (${id}) 嗎？`)) {
      return;
    }

    try {
      // 1. 向 Supabase 發送刪除指令
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) {
        alert(`刪除失敗：${error.message}`);
        return;
      }

      // 2. 刪除成功後更新前端列表 State
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      alert(`已成功刪除客戶 [${name}]！`);
    } catch (err) {
      console.error('刪除客戶時發生例外錯誤：', err);
      alert('執行刪除時發生錯誤，請稍後再試。');
    }
  };

  // ---- 核心：修復後的新增客戶（寫入 Supabase） ----
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) {
      alert('請填寫姓名與電話！');
      return;
    }

    const autoId =
      newCustomer.id.trim() ||
      `CST${(customers.length + 1).toString().padStart(5, '0')}`;

    const newCustomerData = {
      id: autoId,
      name: newCustomer.name,
      phone: newCustomer.phone,
      category: newCustomer.category || '來店客',
      id_number: newCustomer.idNumber || '—',
      birthday: newCustomer.birthday || '—',
      gender: newCustomer.gender,
      address: newCustomer.address || '—',
      note: newCustomer.note || '—',
      sales_history: [],
    };

    try {
      const { error } = await supabase
        .from('customers')
        .insert([newCustomerData]);

      if (error) {
        alert(`新增客戶失敗：${error.message}`);
        return;
      }

      // 重新整理資料
      await fetchCustomers();

      setIsAddCustomerModalOpen(false);

      setNewCustomer({
        id: '',
        category: '舊客',
        name: '',
        phone: '',
        idNumber: '',
        birthday: '',
        gender: '男',
        note: '',
        address: '',
      });
    } catch (err) {
      console.error('新增客戶時發生錯誤：', err);
      alert('新增客戶失敗，請重試。');
    }
  };

  // ---- 篩選後的客戶列表 ----
  const filteredCustomers = customers.filter((c) => {
    const matchesCategory =
      selectedCategoryTab === '全部' || c.category === selectedCategoryTab;
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      
      {/* 頂部 Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-slate-800">客戶管理</h1>
        <div className="flex gap-3">
          <button
            onClick={fetchCustomers}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition"
          >
            🔄 重新整理
          </button>
          <button
            onClick={() => alert('超級刪除功能')}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl text-xs font-semibold transition"
          >
            超級刪除
          </button>
          <button
            onClick={() => setIsAddCustomerModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1"
          >
            <span>＋</span> 新增客戶
          </button>
        </div>
      </div>

      {/* 🏷️ 區塊 1: 客戶分類管理 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <span className="text-blue-600">🏷️</span> 客戶分類管理
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs text-slate-600"
            >
              {cat}
              <button
                type="button"
                onClick={() => handleRemoveCategory(cat)}
                className="text-slate-300 hover:text-slate-500 font-bold"
              >
                ✕
              </button>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={newCategoryInput}
            onChange={(e) => setNewCategoryInput(e.target.value)}
            placeholder="新增分類名稱..."
            className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 w-56"
          />
          <button
            type="button"
            onClick={handleAddCategory}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition"
          >
            新增
          </button>
        </div>
      </div>

      {/* 🔍 區塊 2: 搜尋與 Tabs */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-xs">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋姓名或電話..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedCategoryTab('全部')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition border ${
              selectedCategoryTab === '全部'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            全部 <span className="ml-1 text-[11px] opacity-80">{customers.length}</span>
          </button>
          {categories.map((cat) => {
            const count = customers.filter((c) => c.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategoryTab(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition border ${
                  selectedCategoryTab === cat
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat} {count > 0 && <span className="ml-0.5 text-[11px] opacity-80">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 📋 區塊 3: 客戶數據列表 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-medium">
            <tr>
              <th className="p-4">客戶編號</th>
              <th className="p-4">姓名</th>
              <th className="p-4">電話</th>
              <th className="p-4">分類</th>
              <th className="p-4">生日</th>
              <th className="p-4">性別</th>
              <th className="p-4">地址</th>
              <th className="p-4">身分證字號</th>
              <th className="p-4 text-right pr-6">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400">
                  載入資料庫中...
                </td>
              </tr>
            ) : filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400">
                  查無相關客戶資料
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50/80 transition group">
                  <td className="p-4 font-mono font-medium text-slate-800">{customer.id}</td>
                  <td className="p-4 font-bold text-slate-800">{customer.name}</td>
                  <td className="p-4 font-mono text-slate-600">{customer.phone}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-medium">
                      {customer.category}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-slate-500">{customer.birthday}</td>
                  <td className="p-4 text-slate-700">{customer.gender}</td>
                  <td className="p-4 text-slate-400 max-w-[150px] truncate">{customer.address}</td>
                  <td className="p-4 font-mono text-slate-500">{customer.idNumber}</td>
                  <td className="p-4 text-right pr-6">
                    <div className="flex items-center justify-end gap-3 text-slate-400">
                      <button
                        title="銷售歷史"
                        onClick={() => handleOpenSalesHistory(customer)}
                        className="hover:text-blue-600 transition"
                      >
                        🕒
                      </button>
                      <button title="編輯" className="hover:text-blue-600 transition">✏️</button>
                      <button
                        title="刪除"
                        onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                        className="hover:text-rose-500 transition"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 🕒 銷售歷史 Modal */}
      {isSalesModalOpen && activeCustomerForSales && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal 標頭 */}
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-800">
                {activeCustomerForSales.name} ({activeCustomerForSales.phone}) — 銷售歷史
              </h2>
              <button
                onClick={() => setIsSalesModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal 內容 */}
            <div className="p-8 space-y-3 min-h-[200px] max-h-[60vh] overflow-y-auto bg-slate-50/50">
              {activeCustomerForSales.salesHistory && activeCustomerForSales.salesHistory.length > 0 ? (
                activeCustomerForSales.salesHistory.map((record, index) => (
                  <div
                    key={index}
                    className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-blue-300 transition"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-slate-400 text-xs">▶</span>
                      <span className="font-mono text-xs font-semibold text-slate-700">{record.orderId}</span>
                      <span className="font-mono text-xs text-slate-500">{record.date}</span>
                      <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">{record.operator}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="font-mono text-xs font-bold text-slate-800">${record.amount.toLocaleString()}</span>
                      <span className="text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">{record.itemsCount}項</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs">
                  <span>📂</span>
                  <p className="mt-2">目前沒有相關銷售歷史紀錄</p>
                </div>
              )}
            </div>

            {/* Modal 底部 */}
            <div className="px-8 py-4 border-t border-slate-100 bg-white flex justify-end">
              <button
                type="button"
                onClick={() => setIsSalesModalOpen(false)}
                className="px-6 py-2 rounded-xl text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
              >
                關閉
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 👤 新增客戶 Modal */}
      {isAddCustomerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100">
            
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-800">新增客戶</h2>
              <button
                onClick={() => setIsAddCustomerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-8 space-y-5">
              <div>
                <label className="text-xs text-slate-600 font-medium mb-1.5 block">
                  客戶編號 <span className="text-slate-400 font-normal">（ 留空自動產生 ）</span>
                </label>
                <input
                  type="text"
                  value={newCustomer.id}
                  onChange={(e) => setNewCustomer({ ...newCustomer, id: e.target.value })}
                  placeholder="自動產生，如 C24010001"
                  className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 transition placeholder:text-slate-300"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 font-medium mb-2 block">客戶分類</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const isSelected = newCustomer.category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewCustomer({ ...newCustomer, category: cat })}
                        className={`px-4 py-2 rounded-xl text-xs font-medium border transition ${
                          isSelected
                            ? 'bg-blue-50 text-blue-600 border-blue-400 font-bold'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-700 font-medium mb-1.5 block">
                    姓名 <span className="text-blue-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-700 font-medium mb-1.5 block">
                    電話 <span className="text-blue-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-600 font-medium mb-1.5 block">身分證字號</label>
                  <input
                    type="text"
                    value={newCustomer.idNumber}
                    onChange={(e) => setNewCustomer({ ...newCustomer, idNumber: e.target.value })}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-medium mb-1.5 block">
                    生日 <span className="text-slate-400 font-normal">（ 民國 YYY/MM/DD ）</span>
                  </label>
                  <input
                    type="text"
                    value={newCustomer.birthday}
                    onChange={(e) => setNewCustomer({ ...newCustomer, birthday: e.target.value })}
                    placeholder="113/01/01"
                    className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 transition placeholder:text-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-600 font-medium mb-1.5 block">性別</label>
                  <select
                    value={newCustomer.gender}
                    onChange={(e) => setNewCustomer({ ...newCustomer, gender: e.target.value as any })}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-700 bg-white focus:outline-none focus:border-blue-500 transition"
                  >
                    <option value="男">男</option>
                    <option value="女">女</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-medium mb-1.5 block">備註</label>
                  <input
                    type="text"
                    value={newCustomer.note}
                    onChange={(e) => setNewCustomer({ ...newCustomer, note: e.target.value })}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 font-medium mb-1.5 block">地址</label>
                <input
                  type="text"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl text-xs text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 font-medium transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-7 py-2.5 rounded-xl text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold transition shadow-sm"
                >
                  儲存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}