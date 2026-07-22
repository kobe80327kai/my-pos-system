'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

// 中古機資料型態
interface UsedPhone {
  id: string;
  code: string;
  title: string;
  specs: string;
  grade: string;
  battery: string;
  imei: string;
  tradeInFee: number;
  actualCost: number;
  storeCost: number;
  price: number;
  status: '在庫' | '已售';
  recycledBy: string;
  customerName?: string;
  date: string;
  note?: string;
}

export default function UsedPhonesPage() {
  const [phones, setPhones] = useState<UsedPhone[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'全部' | '在庫' | '已售'>('在庫');
  const [gradeFilter, setGradeFilter] = useState<'全部等級' | 'S 級' | 'A 級' | 'B 級' | 'C 級'>('全部等級');

  // Modal 狀態管理
  const [selectedPhone, setSelectedPhone] = useState<UsedPhone | null>(null); // 詳情 Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // 進貨 Modal

  // 新增中古機表單 State
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    specs: '',
    grade: 'A 級',
    battery: '100%',
    imei: '',
    tradeInFee: 0,
    actualCost: 0,
    storeCost: 0,
    price: 0,
    recycledBy: '管理員',
    customerName: '',
    note: '',
  });

  useEffect(() => {
    fetchUsedPhones();
  }, []);

  // 從 Supabase 抓取資料
  const fetchUsedPhones = async () => {
    try {
      const { data, error } = await supabase.from('used_phones').select('*').order('created_at', { ascending: false });
      if (data && !error) {
        const mappedData = data.map((item: any) => ({
          id: item.id,
          code: item.code || item.id?.substring(0, 6) || 'DS',
          title: item.title || item.name || '未命名商品',
          specs: item.specs || '標準規格',
          grade: item.grade || 'A 級',
          battery: item.battery || '100%',
          imei: item.imei || '—',
          tradeInFee: Number(item.trade_in_fee || item.tradeInFee || 0),
          actualCost: Number(item.actual_cost || item.actualCost || 0),
          storeCost: Number(item.store_cost || item.storeCost || 0),
          price: Number(item.price || 0),
          status: item.status || '在庫',
          recycledBy: item.recycled_by || item.recycledBy || '管理員',
          customerName: item.customer_name || item.customerName || '—',
          date: item.date || item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          note: item.note || item.remark || '',
        }));
        setPhones(mappedData);
      }
    } catch (err) {
      console.error('抓取中古機資料失敗:', err);
    }
  };

  // 表單輸入處理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes('Cost') || name.includes('Price') || name === 'tradeInFee' ? Number(value) : value,
    }));
  };

  // 送出新增中古機進貨
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newPhoneData = {
        code: formData.code || `DS-${Date.now().toString().slice(-4)}`,
        title: formData.title,
        specs: formData.specs,
        grade: formData.grade,
        battery: formData.battery,
        imei: formData.imei,
        trade_in_fee: formData.tradeInFee,
        actual_cost: formData.actualCost,
        store_cost: formData.storeCost,
        price: formData.price,
        status: '在庫',
        recycled_by: formData.recycledBy,
        customer_name: formData.customerName,
        note: formData.note,
        date: new Date().toISOString().split('T')[0],
      };

      const { error } = await supabase.from('used_phones').insert([newPhoneData]);

      if (error) {
        alert('新增失敗：' + error.message);
      } else {
        alert('中古機進貨成功！');
        setIsAddModalOpen(false);
        // 重置表單
        setFormData({
          code: '',
          title: '',
          specs: '',
          grade: 'A 級',
          battery: '100%',
          imei: '',
          tradeInFee: 0,
          actualCost: 0,
          storeCost: 0,
          price: 0,
          recycledBy: '管理員',
          customerName: '',
          note: '',
        });
        fetchUsedPhones(); // 刷新清單
      }
    } catch (err) {
      console.error('新增失敗:', err);
    }
  };

  // 刪除中古機
  const handleDelete = async (id: string, title: string) => {
    if (confirm(`確定要刪除 [${title}] 嗎？`)) {
      await supabase.from('used_phones').delete().eq('id', id);
      setPhones(phones.filter((p) => p.id !== id));
      if (selectedPhone?.id === id) {
        setSelectedPhone(null);
      }
    }
  };

  // 數據統計計算
  const inStockCount = phones.filter((p) => p.status === '在庫').length;
  const soldCount = phones.filter((p) => p.status === '已售').length;
  const totalCount = phones.length;
  const totalCost = phones
    .filter((p) => p.status === '在庫')
    .reduce((sum, p) => sum + p.actualCost, 0);

  // 條件過濾
  const filteredPhones = phones.filter((phone) => {
    const matchesSearch =
      phone.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.imei.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === '全部' ? true : phone.status === statusFilter;
    const matchesGrade = gradeFilter === '全部等級' ? true : phone.grade.includes(gradeFilter.replace(' 級', ''));

    return matchesSearch && matchesStatus && matchesGrade;
  });

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* 標題與按鈕區 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">中古機總覽</h1>
          <p className="text-xs text-slate-400 mt-1">所有中古機庫存與定價</p>
        </div>
        {/* 點擊開啟進貨 Modal */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition shadow-sm flex items-center gap-1 cursor-pointer"
        >
          <span>+</span> 中古機進貨
        </button>
      </div>

      {/* 頂部數據卡片區 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-xs text-slate-400 font-medium mb-2">在台數</div>
          <div className="text-2xl font-bold text-blue-600 font-mono">{inStockCount}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-xs text-slate-400 font-medium mb-2">已售台數</div>
          <div className="text-2xl font-bold text-slate-800 font-mono">{soldCount}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-xs text-slate-400 font-medium mb-2">總台數</div>
          <div className="text-2xl font-bold text-slate-800 font-mono">{totalCount}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm bg-amber-50/20">
          <div className="text-xs text-slate-400 font-medium mb-2">在庫總成本</div>
          <div className="text-2xl font-bold text-amber-500 font-mono">${totalCost}</div>
        </div>
      </div>

      {/* 搜尋與篩選列 */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋廠牌/型號/IMEI/編號..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          {(['全部', '在庫', '已售'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === tab ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          {(['全部等級', 'S 級', 'A 級', 'B 級', 'C 級'] as const).map((grade) => (
            <button
              key={grade}
              onClick={() => setGradeFilter(grade)}
              className={`px-3 py-1.5 rounded-lg transition ${
                gradeFilter === grade ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {grade}
            </button>
          ))}
        </div>
      </div>

      {/* 中古機列表 Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-medium">
            <tr>
              <th className="p-4 w-10 text-center"><input type="checkbox" className="rounded border-slate-300" /></th>
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
          <tbody className="divide-y divide-slate-100">
            {filteredPhones.length === 0 ? (
              <tr>
                <td colSpan={16} className="p-8 text-center text-slate-400">尚無中古機資料</td>
              </tr>
            ) : (
              filteredPhones.map((phone) => (
                <tr
                  key={phone.id}
                  onClick={() => setSelectedPhone(phone)}
                  className="hover:bg-blue-50/40 transition cursor-pointer group"
                >
                  <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" className="rounded border-slate-300" />
                  </td>
                  <td className="p-4 font-mono font-medium text-slate-700">{phone.code}</td>
                  <td className="p-4 font-bold text-slate-800 group-hover:text-blue-600 transition">{phone.title}</td>
                  <td className="p-4 text-slate-500">{phone.specs}</td>
                  <td className="p-4">
                    <span className="bg-slate-100 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                      {phone.grade}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-slate-700">{phone.battery}</td>
                  <td className="p-4 font-mono text-slate-500">{phone.imei}</td>
                  <td className="p-4 font-mono text-slate-800">${phone.tradeInFee}</td>
                  <td className="p-4 font-mono font-bold text-slate-800">${phone.actualCost}</td>
                  <td className="p-4 font-mono text-slate-600">${phone.storeCost}</td>
                  <td className="p-4 font-mono font-bold text-blue-600">${phone.price}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                      • {phone.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-700">{phone.recycledBy}</td>
                  <td className="p-4 text-slate-400">{phone.customerName || '—'}</td>
                  <td className="p-4 font-mono text-slate-400 text-[11px]">{phone.date}</td>
                  <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleDelete(phone.id, phone.title)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-500 border border-rose-100 px-2.5 py-1 rounded-lg text-[11px] font-medium transition"
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

      {/* 📥 1. 中古機進貨 Modal 彈窗 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-800">＋ 中古機進貨填寫</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 text-xs text-slate-700 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">商品編號 (選填)</label>
                  <input type="text" name="code" value={formData.code} onChange={handleInputChange} placeholder="預設自動生成" className="w-full bg-slate-50 border p-2 rounded-xl" />
                </div>
                <div>
                  <label className="block font-medium mb-1">品名 (廠牌/型號) *</label>
                  <input type="text" name="title" required value={formData.title} onChange={handleInputChange} placeholder="例: iPhone 13 Pro" className="w-full bg-slate-50 border p-2 rounded-xl" />
                </div>
                <div>
                  <label className="block font-medium mb-1">容量 / 顏色</label>
                  <input type="text" name="specs" value={formData.specs} onChange={handleInputChange} placeholder="例: 256G 天峰藍" className="w-full bg-slate-50 border p-2 rounded-xl" />
                </div>
                <div>
                  <label className="block font-medium mb-1">外觀等級</label>
                  <select name="grade" value={formData.grade} onChange={handleInputChange} className="w-full bg-slate-50 border p-2 rounded-xl">
                    <option value="S 級">S 級</option>
                    <option value="A 級">A 級</option>
                    <option value="B 級">B 級</option>
                    <option value="C 級">C 級</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">電池健康度</label>
                  <input type="text" name="battery" value={formData.battery} onChange={handleInputChange} placeholder="例: 88%" className="w-full bg-slate-50 border p-2 rounded-xl" />
                </div>
                <div>
                  <label className="block font-medium mb-1">IMEI 序號</label>
                  <input type="text" name="imei" value={formData.imei} onChange={handleInputChange} placeholder="請輸入 15 碼 IMEI" className="w-full bg-slate-50 border p-2 rounded-xl" />
                </div>
                <div>
                  <label className="block font-medium mb-1">折抵金 ($)</label>
                  <input type="number" name="tradeInFee" value={formData.tradeInFee} onChange={handleInputChange} className="w-full bg-slate-50 border p-2 rounded-xl" />
                </div>
                <div>
                  <label className="block font-medium mb-1">實際成本 ($)</label>
                  <input type="number" name="actualCost" value={formData.actualCost} onChange={handleInputChange} className="w-full bg-slate-50 border p-2 rounded-xl" />
                </div>
                <div>
                  <label className="block font-medium mb-1">門市成本 ($)</label>
                  <input type="number" name="storeCost" value={formData.storeCost} onChange={handleInputChange} className="w-full bg-slate-50 border p-2 rounded-xl" />
                </div>
                <div>
                  <label className="block font-medium mb-1">建議售價 ($)</label>
                  <input type="number" name="price" value={formData.price} onChange={handleInputChange} className="w-full bg-slate-50 border p-2 rounded-xl" />
                </div>
                <div>
                  <label className="block font-medium mb-1">回收人員</label>
                  <input type="text" name="recycledBy" value={formData.recycledBy} onChange={handleInputChange} className="w-full bg-slate-50 border p-2 rounded-xl" />
                </div>
                <div>
                  <label className="block font-medium mb-1">來源客戶</label>
                  <input type="text" name="customerName" value={formData.customerName} onChange={handleInputChange} placeholder="客戶姓名或綽號" className="w-full bg-slate-50 border p-2 rounded-xl" />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">備註說明</label>
                <textarea name="note" rows={3} value={formData.note} onChange={handleInputChange} placeholder="填寫機況痕跡、配件盒裝狀況等..." className="w-full bg-slate-50 border p-2 rounded-xl" />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200">取消</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700">儲存進貨</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📄 2. 中古機詳情 & 備註 Modal 彈窗 */}
      {selectedPhone && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  {selectedPhone.title}
                  <span className="bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-md text-[11px] font-mono font-normal">
                    {selectedPhone.code}
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">進貨日期：{selectedPhone.date}</p>
              </div>
              <button onClick={() => setSelectedPhone(null)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700 max-h-[80vh] overflow-y-auto">
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4">
                <div className="text-xs font-bold text-amber-800 mb-1 flex items-center gap-1.5">📌 機器備註說明</div>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedPhone.note || '無備註資訊'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div><span className="text-slate-400 block mb-0.5">規格 / 容量顏色</span><span className="font-semibold text-slate-800">{selectedPhone.specs}</span></div>
                <div><span className="text-slate-400 block mb-0.5">外觀等級</span><span className="font-bold text-slate-800">{selectedPhone.grade}</span></div>
                <div><span className="text-slate-400 block mb-0.5">電池健康度</span><span className="font-mono font-semibold text-emerald-600">{selectedPhone.battery}</span></div>
                <div><span className="text-slate-400 block mb-0.5">IMEI 序號</span><span className="font-mono text-slate-700">{selectedPhone.imei}</span></div>
                <div><span className="text-slate-400 block mb-0.5">回收人員</span><span className="font-medium text-slate-800">{selectedPhone.recycledBy}</span></div>
                <div><span className="text-slate-400 block mb-0.5">來源客戶</span><span className="text-slate-700">{selectedPhone.customerName || '—'}</span></div>
              </div>

              <div className="grid grid-cols-4 gap-2 border-t border-slate-100 pt-4 font-mono text-center">
                <div className="bg-slate-50 p-2.5 rounded-xl"><span className="text-slate-400 text-[10px] block mb-0.5">折抵金</span><span className="font-bold text-slate-700">${selectedPhone.tradeInFee}</span></div>
                <div className="bg-slate-50 p-2.5 rounded-xl"><span className="text-slate-400 text-[10px] block mb-0.5">實際成本</span><span className="font-bold text-slate-800">${selectedPhone.actualCost}</span></div>
                <div className="bg-slate-50 p-2.5 rounded-xl"><span className="text-slate-400 text-[10px] block mb-0.5">門市成本</span><span className="font-bold text-slate-700">${selectedPhone.storeCost}</span></div>
                <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100"><span className="text-blue-500 text-[10px] block mb-0.5">建議售價</span><span className="font-bold text-blue-600">${selectedPhone.price}</span></div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button onClick={() => setSelectedPhone(null)} className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-white hover:bg-slate-900">關閉</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}