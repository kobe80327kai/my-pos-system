'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

// 定義商品型別
interface Product {
  id: number;
  name: string;
  category: string;
  cost: number;
  price: number;
  stock: number;
  serial_numbers?: string;
}

// 定義進貨紀錄型別 (供彈窗使用)
interface PurchaseRecord {
  id: number;
  product_id: number;
  product_name: string;
  cost: number;
  serial_numbers: string | null;
  created_at: string;
  note?: string; // 備註
  status?: string; // 狀態：在庫、已售出
}

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('全部小類');

  // 統計數值狀態
  const [totalItems, setTotalItems] = useState(0);
  const [totalMarketValue, setTotalMarketValue] = useState(0);
  const [totalCostValue, setTotalCostValue] = useState(0);

  // --- 彈窗相關狀態 ---
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailRecords, setDetailRecords] = useState<PurchaseRecord[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  // 1. 撈取庫存列表
  async function fetchProducts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      const formatted = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category || p.type || '未分類',
        cost: p.cost || 0,
        price: p.price || 0,
        stock: p.stock || 0,
        serial_numbers: p.serial_numbers || ''
      }));

      setProducts(formatted);
      calculateSummary(formatted);
    } catch (err: any) {
      console.error('載入庫存失敗：', err.message);
    } finally {
      setLoading(false);
    }
  }

  // 2. 計算底部資訊卡片
  function calculateSummary(items: Product[]) {
    let itemsCount = 0;
    let marketSum = 0;
    let costSum = 0;

    items.forEach(p => {
      itemsCount += p.stock;
      marketSum += (p.price * p.stock);
      costSum += (p.cost * p.stock);
    });

    setTotalItems(itemsCount);
    setTotalMarketValue(marketSum);
    setTotalCostValue(costSum);
  }

  // 3. 「刪除商品」功能
  async function handleDeleteProduct(id: number, name: string) {
    const confirmDelete = window.confirm(
      `⚠️ 警告！確定要刪除「${name}」嗎？\n\n這會連同此商品的所有「進貨紀錄」和「現有庫存」一起刪除，且無法復原！`
    );
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('🗑️ 商品已成功刪除！');
      fetchProducts(); // 重新整理列表與統計數字
    } catch (err: any) {
      alert('刪除失敗：' + err.message);
    }
  }

  // 4. 點擊品名開啟明細彈窗並獲取進貨資料
  async function handleOpenDetails(product: Product) {
    setSelectedProduct(product);
    setLoadingDetails(true);
    try {
      // 從 purchase_records 撈取該產品所有的進貨紀錄
      const { data, error } = await supabase
        .from('purchase_records')
        .select('*')
        .eq('product_id', product.id)
        .order('id', { ascending: true });

      if (error) throw error;

      // 整理進貨紀錄資料
      const formattedRecords = (data || []).map((r: any) => {
        // 若該筆進貨序列號不在 product.serial_numbers 裡面，或者庫存已經為 0，則視為「已售出」
        const inStockSerials = product.serial_numbers ? product.serial_numbers.split(',').map(s => s.trim()) : [];
        const isCurrentlyInStock = r.serial_numbers ? inStockSerials.includes(r.serial_numbers.trim()) : (product.stock > 0);

        return {
          id: r.id,
          product_id: r.product_id,
          product_name: r.product_name,
          cost: r.cost || product.cost, // 若紀錄沒填，預設回商品原設定成本
          serial_numbers: r.serial_numbers || null,
          created_at: r.created_at,
          note: r.note || '', // 備註
          status: isCurrentlyInStock ? '在庫' : '已售出'
        };
      });

      setDetailRecords(formattedRecords);
    } catch (err: any) {
      console.error('獲取進貨明細失敗：', err.message);
    } finally {
      setLoadingDetails(false);
    }
  }

  // 5. 更新進貨紀錄的備註
  async function handleUpdateNote(recordId: number, newNote: string) {
    try {
      const { error } = await supabase
        .from('purchase_records')
        .update({ note: newNote })
        .eq('id', recordId);

      if (error) throw error;

      // 更新 React 內部的 state 以即時更新 UI
      setDetailRecords(prev =>
        prev.map(r => (r.id === recordId ? { ...r, note: newNote } : r))
      );
    } catch (err: any) {
      alert('備註儲存失敗：' + err.message);
    }
  }

  // 6. 關鍵字與分類篩選
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      `PRD${String(p.id).padStart(6, '0')}`.includes(searchQuery) ||
      (p.serial_numbers && p.serial_numbers.includes(searchQuery));
    
    const matchesCategory = selectedSubCategory === '全部小類' || p.category === selectedSubCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#F8FAFC]">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* 標題與盤點按鈕 */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">庫存管理</h2>
            <p className="text-slate-500 text-xs mt-1">同品名分組顯示，點擊商品名稱查看詳細進貨明細、各台成本與歷史日期</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition shadow-sm">
              📤 匯出盤點表
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition shadow-sm">
              📋 盤點
            </button>
          </div>
        </div>

        {/* 搜尋與篩選欄 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-[300px]">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
              <input 
                type="text" 
                placeholder="搜尋品名、編號、IMEI、SIM..." 
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>
            <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
              <span>⚠️ 只看滯銷</span>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">滯銷定義：</span>
            <button className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded font-medium">2個月</button>
            <button className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded font-medium">3個月</button>
            <button className="px-3 py-1.5 text-xs bg-red-50 text-red-600 border border-red-100 rounded font-bold">4個月+</button>
            
            <select 
              className="border border-slate-200 bg-white rounded-lg px-3 py-1.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={selectedSubCategory}
              onChange={(e) => setSelectedSubCategory(e.target.value)}
            >
              <option value="全部小類">全部小類</option>
              <option value="手機">手機</option>
              <option value="配件">配件</option>
              <option value="SIM卡">SIM卡</option>
              <option value="其他">其他</option>
            </select>
          </div>
        </div>

        {/* 庫存列表表格 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">商品編號</th>
                <th className="py-4 px-6">品名 ↑</th>
                <th className="py-4 px-6">類別</th>
                <th className="py-4 px-6">數量</th>
                <th className="py-4 px-6">IMEI / SIM ( 第一筆 )</th>
                <th className="py-4 px-6">實際成本</th>
                <th className="py-4 px-6 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">庫存資料載入中...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">目前無符合篩選條件的庫存商品</td></tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs text-slate-400">
                      PRD{String(p.id).padStart(6, '0')}
                    </td>
                    {/* 點擊品名開啟明細 */}
                    <td 
                      onClick={() => handleOpenDetails(p)}
                      className="py-4 px-6 font-bold text-slate-800 hover:text-blue-600 hover:underline cursor-pointer transition"
                    >
                      {p.name}
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs bg-slate-100 px-2.5 py-1 rounded text-slate-600">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {p.stock > 0 ? (
                        <span className="text-blue-600 bg-blue-50 border border-blue-100 font-bold font-mono px-2 py-0.5 rounded text-xs">
                          {p.stock} 台
                        </span>
                      ) : (
                        <span className="text-slate-400 bg-slate-100 font-mono px-2 py-0.5 rounded text-xs">
                          0 件
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {p.serial_numbers ? (
                        <span className="text-xs font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                          {p.serial_numbers.split(',')[0]}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-semibold font-mono text-slate-800">
                      ${p.cost.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // 防止觸發行點擊事件
                          handleDeleteProduct(p.id, p.name);
                        }}
                        className="text-xs text-red-500 hover:text-white font-semibold bg-red-50 hover:bg-red-500 px-3 py-1.5 rounded-lg border border-red-200 transition-all shadow-sm"
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

        {/* 底部總計 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">在庫件數</span>
            <span className="text-3xl font-bold text-slate-800 font-mono mt-2">{totalItems} 件</span>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">庫存門市總值 (售價)</span>
            <span className="text-3xl font-bold text-slate-800 font-mono mt-2">${totalMarketValue.toLocaleString()}</span>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">庫存實際總值 (成本)</span>
            <span className="text-3xl font-bold text-slate-800 font-mono mt-2">${totalCostValue.toLocaleString()}</span>
          </div>
        </div>

      </div>

      {/* --- 進貨庫存歷史明細彈窗 (根據第二張圖完美復刻) --- */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity">
          <div className="bg-white rounded-2xl w-full max-w-[900px] shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
            
            {/* 彈窗標題與關閉按鈕 */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedProduct.name}</h3>
                <p className="text-slate-400 text-xs mt-1">共 {detailRecords.length} 筆進貨歷史</p>
              </div>
              <button 
                onClick={() => setSelectedProduct(null)}
                className="text-slate-400 hover:text-slate-600 transition p-1.5 hover:bg-slate-100 rounded-full"
              >
                <span className="text-lg">✕</span>
              </button>
            </div>

            {/* 進貨明細表格內容 */}
            <div className="p-6 max-h-[480px] overflow-y-auto">
              {loadingDetails ? (
                <div className="text-center py-12 text-slate-400">正在獲取進貨紀錄明細...</div>
              ) : detailRecords.length === 0 ? (
                <div className="text-center py-12 text-slate-400">尚無此商品的進貨歷史紀錄</div>
              ) : (
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4 w-12 text-slate-400">#</th>
                      <th className="py-3 px-4">IMEI / SIM</th>
                      <th className="py-3 px-4 text-blue-600">實際成本</th>
                      <th className="py-3 px-4 text-slate-600">門市售價</th>
                      <th className="py-3 px-4">狀態</th>
                      <th className="py-3 px-4">入庫日期</th>
                      <th className="py-3 px-4">備註 (按 Enter 或移開即儲存)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {detailRecords.map((record, index) => (
                      <tr key={record.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-4 px-4 text-slate-400 font-mono">{index + 1}</td>
                        <td className="py-4 px-4">
                          {record.serial_numbers ? (
                            <span className="font-mono text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-xs">
                              {record.serial_numbers}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-blue-600 text-md">
                          ${record.cost.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 font-mono text-slate-500">
                          ${selectedProduct.price.toLocaleString()}
                        </td>
                        <td className="py-4 px-4">
                          {record.status === '在庫' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full text-xs font-medium">
                              ● 在庫
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full text-xs font-medium">
                              ● 已售出
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 font-mono text-slate-500 text-xs">
                          {new Date(record.created_at).toLocaleDateString('zh-TW', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          }).replace(/\//g, '-')}
                        </td>
                        <td className="py-3 px-4">
                          <input 
                            type="text" 
                            placeholder="輸入備註..." 
                            className="w-full border border-slate-200 hover:border-slate-300 focus:border-blue-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none transition shadow-inner bg-slate-50/50" 
                            defaultValue={record.note}
                            onBlur={(e) => handleUpdateNote(record.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleUpdateNote(record.id, e.currentTarget.value);
                                e.currentTarget.blur(); // 儲存後將焦點移開
                              }
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* 彈窗底部的關閉按鈕 */}
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/30">
              <button 
                onClick={() => setSelectedProduct(null)}
                className="px-6 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-sm transition shadow-sm"
              >
                關閉
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
