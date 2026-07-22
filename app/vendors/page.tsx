export const dynamic = 'force-dynamic'
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

// 定義廠商型別
interface Vendor {
  id: number;
  vendor_code: string;
  name: string;
  vat_number: string | null;
  contact_person: string | null;
  phone: string | null;
  mobile: string | null;
  address: string | null;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // 彈窗控制
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  // 表單資料狀態
  const [formData, setFormData] = useState({
    vendor_code: '',
    name: '',
    vat_number: '',
    contact_person: '',
    phone: '',
    mobile: '',
    address: ''
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  // 撈取廠商資料
  async function fetchVendors() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('vendor_code', { ascending: true });

      if (error) throw error;
      setVendors(data || []);
    } catch (err: any) {
      console.error(err);
      alert('載入廠商資料失敗：' + err.message);
    } finally {
      setLoading(false);
    }
  }

  // 處理開啟「新增」彈窗
  const handleOpenAdd = () => {
    setEditingVendor(null);
    setFormData({
      vendor_code: '',
      name: '',
      vat_number: '',
      contact_person: '',
      phone: '',
      mobile: '',
      address: ''
    });
    setIsModalOpen(true);
  };

  // 處理開啟「編輯」彈窗
  const handleOpenEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      vendor_code: vendor.vendor_code,
      name: vendor.name,
      vat_number: vendor.vat_number || '',
      contact_person: vendor.contact_person || '',
      phone: vendor.phone || '',
      mobile: vendor.mobile || '',
      address: vendor.address || ''
    });
    setIsModalOpen(true);
  };

  // 處理送出表單（新增或修改）
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendor_code.trim() || !formData.name.trim()) {
      alert('請填寫廠商編號與廠商名稱！');
      return;
    }

    try {
      if (editingVendor) {
        // 更新編輯資料
        const { error } = await supabase
          .from('vendors')
          .update({
            vendor_code: formData.vendor_code,
            name: formData.name,
            vat_number: formData.vat_number || null,
            contact_person: formData.contact_person || null,
            phone: formData.phone || null,
            mobile: formData.mobile || null,
            address: formData.address || null
          })
          .eq('id', editingVendor.id);

        if (error) throw error;
        alert('修改成功！');
      } else {
        // 檢查編號重複
        const isDuplicate = vendors.some(v => v.vendor_code.toLowerCase() === formData.vendor_code.toLowerCase());
        if (isDuplicate) {
          alert('此廠商編號已存在，請使用其他編號！');
          return;
        }

        // 新增資料
        const { error } = await supabase
          .from('vendors')
          .insert([{
            vendor_code: formData.vendor_code,
            name: formData.name,
            vat_number: formData.vat_number || null,
            contact_person: formData.contact_person || null,
            phone: formData.phone || null,
            mobile: formData.mobile || null,
            address: formData.address || null
          }]);

        if (error) throw error;
        alert('新增成功！');
      }

      setIsModalOpen(false);
      fetchVendors();
    } catch (err: any) {
      console.error(err);
      alert('儲存失敗：' + err.message);
    }
  };

  // 處理刪除廠商
  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`確定要刪除廠商「${name}」嗎？此操作無法還原。`)) return;

    try {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('刪除成功！');
      fetchVendors();
    } catch (err: any) {
      console.error(err);
      alert('刪除失敗：' + err.message);
    }
  };

  // 模糊搜尋過濾（支援編號、名稱、聯絡人）
  const filteredVendors = vendors.filter(vendor => {
    const query = searchQuery.toLowerCase();
    return (
      vendor.vendor_code.toLowerCase().includes(query) ||
      vendor.name.toLowerCase().includes(query) ||
      (vendor.contact_person && vendor.contact_person.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* 頂部標題與按鈕 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-950">廠商管理</h1>
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
          >
            <span>＋</span> 新增廠商
          </button>
        </div>

        {/* 搜尋列 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="relative max-w-md">
            <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="搜尋廠商名稱 / 編號 / 聯絡人..."
              className="w-full border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* 廠商列表表格 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 border-b border-slate-100 font-medium">
                <th className="p-4 w-1/6">廠商編號 ↑</th>
                <th className="p-4 w-1/6">廠商名稱</th>
                <th className="p-4 w-1/8">統一編號</th>
                <th className="p-4 w-1/8">聯絡人</th>
                <th className="p-4 w-1/8">市話</th>
                <th className="p-4 w-1/8">行動電話</th>
                <th className="p-4 w-1/5">地址</th>
                <th className="p-4 text-center w-24">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center p-12 text-slate-400">讀取中...</td>
                </tr>
              ) : filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-12 text-slate-400">查無任何廠商資料</td>
                </tr>
              ) : (
                filteredVendors.map(vendor => (
                  <tr key={vendor.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-medium text-slate-900">{vendor.vendor_code}</td>
                    <td className="p-4 font-semibold text-slate-900">{vendor.name}</td>
                    <td className="p-4 text-slate-500">{vendor.vat_number || '—'}</td>
                    <td className="p-4 text-slate-600">{vendor.contact_person || '—'}</td>
                    <td className="p-4 text-slate-500 font-mono">{vendor.phone || '—'}</td>
                    <td className="p-4 text-slate-500 font-mono">{vendor.mobile || '—'}</td>
                    <td className="p-4 text-slate-500 truncate max-w-[150px]" title={vendor.address || ''}>
                      {vendor.address || '—'}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center items-center gap-3">
                        <button
                          onClick={() => handleOpenEdit(vendor)}
                          className="text-slate-400 hover:text-blue-600 transition"
                          title="編輯"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(vendor.id, vendor.name)}
                          className="text-slate-400 hover:text-red-500 transition"
                          title="刪除"
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

      </div>

      {/* 新增 / 編輯彈出視窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl overflow-hidden border border-slate-100">
            
            {/* 視窗標題 */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900 text-lg">
                {editingVendor ? '✏️ 編輯廠商資料' : '＋ 新增廠商資料'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* 視窗表單 */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">廠商編號 *</label>
                  <input
                    type="text"
                    required
                    placeholder="例如: IMOS"
                    disabled={!!editingVendor} // 編輯時不允許修改唯一編號
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                    value={formData.vendor_code}
                    onChange={(e) => setFormData({ ...formData, vendor_code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">廠商名稱 *</label>
                  <input
                    type="text"
                    required
                    placeholder="例如: IMOS 總代理"
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">統一編號</label>
                  <input
                    type="text"
                    placeholder="限 8 碼數字"
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.vat_number}
                    onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">聯絡人</label>
                  <input
                    type="text"
                    placeholder="聯絡窗口姓名"
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">市話</label>
                  <input
                    type="text"
                    placeholder="市內電話"
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">行動電話</label>
                  <input
                    type="text"
                    placeholder="手機號碼"
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">地址</label>
                <input
                  type="text"
                  placeholder="廠商完整地址"
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              {/* 表單按鈕 */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg text-sm hover:bg-slate-50 transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
                >
                  儲存並送出
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}