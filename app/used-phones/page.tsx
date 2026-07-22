'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
interface UsedPhone {
  id?: number;
  code: string;
  source?: string;
  brand: string;
  model: string;
  spec?: string;
  grade?: string;
  battery?: string;
  imei?: string;
  trade_in_price?: number;
  cost?: number;
  store_cost?: number;
  price?: number;
  status?: string;
  staff?: string;
  customer?: string;
  note?: string;
  created_at?: string;
}

export default function UsedPhonesPage() {
  const [phones, setPhones] = useState<UsedPhone[]>([]);
  const [loading, setLoading] = useState(false);

  // 篩選狀態
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('在庫');
  const [gradeFilter, setGradeFilter] = useState('全部等級');

  // 進貨彈窗控制
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 表單狀態
  const [formData, setFormData] = useState({
    source: '',
    code: '',
    brand: '',
    model: '',
    spec: '',
    imei: '',
    grade: 'A',
    battery: '',
    cost: '',
    store_cost: '',
    price: '',
    note: '',
    staff: '管理員',
    customer: ''
  });

  useEffect(() => {
    fetchUsedPhones();
  }, []);

  // 撈取中古機清單
  async function fetchUsedPhones() {
    setLoading(true);
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('used_phones')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase 讀取錯誤：', error.message);
        } else if (data) {
          setPhones(data);
        }
      }
    } catch (err) {
      console.warn('Supabase 連線異常：', err);
    } finally {
      setLoading(false);
    }
  }

  // 自動產生中古機編號
  function generateDefaultCode() {
    const today = new Date();
    const dateStr = today.toISOString().slice(2, 10).replace(/-/g, '');
    const random = String(Math.floor(Math.random() * 900) + 100);
    return `OLD${dateStr}${random}`;
  }

  // 送出進貨表單
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.brand || !formData.model) {
      alert('請填寫廠牌與型號！');
      return;
    }

    setSubmitting(true);
    const finalCode = formData.code.trim() || generateDefaultCode();

    const insertPayload = {
      code: finalCode,
      source: formData.source || '門市進貨',
      brand: formData.brand,
      model: formData.model,
      spec: formData.spec || '標準規格',
      grade: formData.grade,
      battery: formData.battery ? `${formData.battery}%` : '100%',
      imei: formData.imei,
      trade_in_price: 0,
      cost: Number(formData.cost) || 0,
      store_cost: Number(formData.store_cost) || 0,
      price: Number(formData.price) || 0,
      note: formData.note,
      staff: formData.staff,
      customer: formData.customer,
      status: '在庫'
    };

    try {
      if (supabase) {
        const { error } = await supabase.from('used_phones').insert([insertPayload]);
        if (error) {
          alert(`❌ 寫入 Supabase 失敗：\n${error.message}\n\n請確認 Supabase 資料表名稱與欄位是否正確！`);
          setSubmitting(false);
          return;
        }
      }
      
      alert('🎉 中古機進貨成功並已儲存至資料庫！');
      setIsModalOpen(false);
      setFormData({
        source: '', code: '', brand: '', model: '', spec: '',
        imei: '', grade: 'A', battery: '', cost: '', store_cost: '', price: '', note: '', staff: '管理員', customer: ''
      });
      
      // 重新撈取最新資料
      await fetchUsedPhones();
    } catch (err) {
      console.error('寫入異常：', err);
    } finally {
      setSubmitting(false);
    }
  }

  // 刪除中古機資料
  async function handleDelete(id?: number, code?: string) {
    if (!id) return;
    const confirmDelete = window.confirm(`確定要刪除這筆資料嗎？\n編號：${code}`);
    if (!confirmDelete) return;

    try {
      if (supabase) {
        const { error } = await supabase.from('used_phones').delete().eq('id', id);
        if (error) {
          alert(`刪除失敗：${error.message}`);
          return;
        }
      }
      await fetchUsedPhones();
    } catch (err) {
      console.warn('Supabase 刪除失敗：', err);
    }
  }

  // 統計數值計算
  const stockCount = phones.filter(p => p.status === '在庫').length;
  const soldCount = phones.filter(p => p.status === '已售').length;
  const totalCount = phones.length;
  const totalStockCost = phones
    .filter(p => p.status === '在庫')
    .reduce((sum, p) => sum + (Number(p.cost) || 0), 0);

  // 條件篩選
  const filteredPhones = phones.filter(p => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      p.brand?.toLowerCase().includes(query) ||
      p.model?.toLowerCase().includes(query) ||
      p.code?.toLowerCase().includes(query) ||
      p.imei?.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === '全部' ? true : p.status === statusFilter;

    const matchesGrade =
      gradeFilter === '全部等級' ? true : p.grade === gradeFilter.replace(' 級', '');

    return matchesSearch && matchesStatus && matchesGrade;
  });

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#F4F6F9]">
      <div className="max-w-[1500px] mx-auto space-y-6">

        {/* 頂部標題與按鈕 */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">中古機總覽</h2>
            <p className="text-slate-400 text-xs mt-1">所有中古機庫存與定價</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-md flex items-center gap-2"
          >
            <span>＋</span> 中古機進貨
          </button>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-xs font-semibold">在台數</p>
            <p className="text-3xl font-bold text-blue-600 font-mono mt-2">{stockCount}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-xs font-semibold">已售台數</p>
            <p className="text-3xl font-bold text-slate-700 font-mono mt-2">{soldCount}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-xs font-semibold">總台數</p>
            <p className="text-3xl font-bold text-slate-700 font-mono mt-2">{totalCount}</p>
          </div>
          <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100/80 shadow-sm">
            <p className="text-slate-400 text-xs font-semibold">在庫總成本</p>
            <p className="text-3xl font-bold text-orange-500 font-mono mt-2">
              ${totalStockCost.toLocaleString()}
            </p>
          </div>
        </div>

        {/* 搜尋與篩選列 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[280px]">
            <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="搜尋廠牌/型號/IMEI/編號..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-slate-100 p-1 rounded-xl flex text-xs font-medium text-slate-600">
              {['全部', '在庫', '已售'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-4 py-1.5 rounded-lg transition ${
                    statusFilter === st ? 'bg-blue-600 text-white shadow-sm font-bold' : 'hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="bg-slate-100 p-1 rounded-xl flex text-xs font-medium text-slate-600">
              {['全部等級', 'S 級', 'A 級', 'B 級', 'C 級'].map((gr) => (
                <button
                  key={gr}
                  onClick={() => setGradeFilter(gr)}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    gradeFilter === gr ? 'bg-slate-800 text-white font-bold' : 'hover:text-slate-900'
                  }`}
                >
                  {gr}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 中古機表格 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="p-4 w-8"><input type="checkbox" className="rounded" /></th>
                  <th className="p-4">商品編號</th>
                  <th className="p-4">品名 ( 廠牌/型號 )</th>
                  <th className="p-4">容量/顏色</th>
                  <th className="p-4">等級</th>
                  <th className="p-4">電池</th>
                  <th className="p-4">IMEI</th>
                  <th className="p-4">折抵金</th>
                  <th className="p-4">實際成本</th>
                  <th className="p-4">門市成本</th>
                  <th className="p-4">建議售價</th>
                  <th className="p-4">狀態</th>
                  <th className="p-4">回收人員</th>
                  <th className="p-4">客戶</th>
                  <th className="p-4">日期</th>
                  <th className="p-4 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr><td colSpan={16} className="text-center py-16 text-slate-400">資料載入中...</td></tr>
                ) : filteredPhones.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="text-center py-20">
                      <div className="flex flex-col items-center justify-center text-slate-300 gap-2">
                        <span className="text-4xl">📱</span>
                        <p className="text-sm font-medium text-slate-400">無中古機記錄</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPhones.map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-slate-50/80 transition">
                      <td className="p-4"><input type="checkbox" className="rounded" /></td>
                      <td className="p-4 font-mono font-medium text-slate-500">{p.code}</td>
                      <td className="p-4 font-bold text-slate-800">{p.brand} {p.model}</td>
                      <td className="p-4 text-slate-500">{p.spec || '—'}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-slate-100 border border-slate-200">
                          {p.grade || 'A'} 級
                        </span>
                      </td>
                      <td className="p-4 font-mono">{p.battery || '—'}</td>
                      <td className="p-4 font-mono text-slate-500">{p.imei || '—'}</td>
                      <td className="p-4 font-mono">${(p.trade_in_price || 0).toLocaleString()}</td>
                      <td className="p-4 font-mono font-bold text-slate-800">${(p.cost || 0).toLocaleString()}</td>
                      <td className="p-4 font-mono text-slate-500">${(p.store_cost || 0).toLocaleString()}</td>
                      <td className="p-4 font-mono text-blue-600 font-bold">${(p.price || 0).toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          p.status === '在庫' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400'
                        }`}>
                          ● {p.status || '在庫'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">{p.staff || '—'}</td>
                      <td className="p-4 text-slate-500">{p.customer || '—'}</td>
                      <td className="p-4 font-mono text-slate-400 text-[11px]">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDelete(p.id, p.code)}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-[11px] font-medium transition"
                        >
                          刪除
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* 進貨彈窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-[680px] shadow-2xl border border-slate-100 overflow-hidden my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">中古機進貨</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition p-2 hover:bg-slate-100 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 text-sm">
              <div>
                <label className="block text-slate-600 font-medium mb-1.5 text-xs">來源 ( 選填 )</label>
                <input 
                  type="text" 
                  placeholder="例：批發商、二手市場、店內舊機..."
                  value={formData.source}
                  onChange={(e) => setFormData({...formData, source: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1.5 text-xs">商品編號 ( 留空自動產生 )</label>
                <input 
                  type="text" 
                  placeholder="自訂編號，留空自動產生"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-medium mb-1.5 text-xs">廠牌 *</label>
                  <input 
                    type="text" 
                    placeholder="Apple / Samsung..."
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-blue-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1.5 text-xs">型號 *</label>
                  <input 
                    type="text" 
                    placeholder="iPhone 14 Pro 256G..."
                    required
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1.5 text-xs">IMEI</label>
                <input 
                  type="text" 
                  placeholder="掃描或手動輸入"
                  value={formData.imei}
                  onChange={(e) => setFormData({...formData, imei: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-2 text-xs">外觀分級 *</label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { grade: 'S', desc: '幾乎無傷' },
                    { grade: 'A', desc: '細小刮痕' },
                    { grade: 'B', desc: '明顯刮痕/掉漆' },
                    { grade: 'C', desc: '撞擊/破裂' },
                  ].map((item) => (
                    <div
                      key={item.grade}
                      onClick={() => setFormData({...formData, grade: item.grade})}
                      className={`p-3 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                        formData.grade === item.grade
                          ? 'border-blue-500 bg-blue-50/30 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="text-lg font-bold text-slate-800">{item.grade}</span>
                      <span className="text-[11px] text-slate-400 mt-1">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1.5 text-xs">電池健康度 ( % )</label>
                <input 
                  type="number" 
                  placeholder="87"
                  value={formData.battery}
                  onChange={(e) => setFormData({...formData, battery: e.target.value})}
                  className="w-32 px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition font-mono"
                />
              </div>

              <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-100 grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-600 font-medium mb-1 text-xs">
                    實際成本 <span className="text-red-400 text-[10px]">管理員</span>
                  </label>
                  <input 
                    type="number" 
                    placeholder="0"
                    value={formData.cost}
                    onChange={(e) => setFormData({...formData, cost: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition font-mono text-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1 text-xs">
                    門市成本 <span className="text-slate-400 text-[10px]">門市看到</span>
                  </label>
                  <input 
                    type="number" 
                    placeholder="0"
                    value={formData.store_cost}
                    onChange={(e) => setFormData({...formData, store_cost: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1 text-xs">建議售價</label>
                  <input 
                    type="number" 
                    placeholder="0"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition font-mono text-blue-600 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1.5 text-xs">備註</label>
                <textarea 
                  rows={2}
                  placeholder="補充說明..."
                  value={formData.note}
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium text-xs hover:bg-slate-50 transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs shadow-md transition disabled:opacity-50"
                >
                  {submitting ? '進貨中...' : '確認進貨'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}