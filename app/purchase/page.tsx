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
  has_serial: boolean; 
  serial_numbers?: string;
  brand?: string;        // 廠牌欄位
  vendor_name?: string; // 廠商欄位
}

// 定義廠商型別
interface Vendor {
  id: number;
  name: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [dbVendors, setDbVendors] = useState<Vendor[]>([]); // 存放資料庫拉回來的廠商列表
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('全部小分類');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formName, setFormName] = useState('');
  const [formMainCategory, setFormMainCategory] = useState('不分類');
  const [formSubCategory, setFormSubCategory] = useState('手機');
  const [formCost, setFormCost] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formQuantity, setFormQuantity] = useState('1'); // ★ 新增：進貨數量狀態
  const [formHasSerial, setFormHasSerial] = useState(true);
  const [formSerialNumber, setFormSerialNumber] = useState('');
  
  // 表單用的廠牌與廠商欄位狀態
  const [formBrand, setFormBrand] = useState('');
  const [formVendorName, setFormVendorName] = useState('');

  const [subCategories, setSubCategories] = useState(['手機', '配件', 'SIM卡', '其他']);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchVendors(); // 初始化時同時去撈取廠商列表
  }, []);

  useEffect(() => {
    if (formSubCategory === '手機' || formSubCategory === 'SIM卡') {
      setFormHasSerial(true);
    } else {
      setFormHasSerial(false);
    }
  }, [formSubCategory]);

  useEffect(() => {
    if (!formHasSerial) {
      setFormSerialNumber('');
    }
  }, [formHasSerial]);

  // 撈取廠商列表
  async function fetchVendors() {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name')
        .order('name', { ascending: true });
      
      if (!error && data) {
        setDbVendors(data);
      }
    } catch (err) {
      console.error('讀取廠商失敗:', err);
    }
  }

  function guessCategory(name: string, dbCategory?: string): string {
    if (dbCategory && subCategories.includes(dbCategory)) {
      return dbCategory;
    }
    const nameLower = name.toLowerCase();
    if (nameLower.includes('iphone') || nameLower.includes('samsung') || nameLower.includes('oppo') || nameLower.includes('vivo') || nameLower.includes('a3x') || nameLower.includes('手機')) {
      return '手機';
    }
    if (nameLower.includes('保貼') || nameLower.includes('殼') || nameLower.includes('套') || nameLower.includes('airpods')) {
      return '配件';
    }
    if (nameLower.includes('sim') || nameLower.includes('卡')) {
      return 'SIM卡';
    }
    return '其他';
  }

  async function fetchProducts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      
      const formatted = (data || []).map((p: any) => {
        const finalCategory = guessCategory(p.name, p.category || p.type);
        return {
          id: p.id,
          name: p.name,
          category: finalCategory,
          cost: p.cost || 0,
          price: p.price || 0,
          stock: p.stock || 0,
          has_serial: p.serial_numbers ? true : (finalCategory === '手機' || finalCategory === 'SIM卡'),
          serial_numbers: p.serial_numbers || '',
          brand: p.brand || '',
          vendor_name: p.vendor_name || ''
        };
      });
      setProducts(formatted);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const openAddModal = () => {
    setFormName('');
    setFormMainCategory('不分類');
    setFormSubCategory('手機');
    setFormCost('');
    setFormPrice('');
    setFormQuantity('1'); // 重設數量
    setFormHasSerial(true);
    setFormSerialNumber('');
    setFormBrand('');      // 清空廠牌
    setFormVendorName(''); // 清空廠商
    fetchVendors();        // 重新整理廠商列表
    setIsModalOpen(true);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();    // 已修正：補上 e.
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (subCategories.includes(trimmed)) {
      alert('該類別已存在！');
      return;
    }
    setSubCategories([...subCategories, trimmed]);
    setNewCategoryName('');
  };

  const handleRemoveCategory = (catToDelete: string) => {
    if (['手機', '配件', 'SIM卡', '其他'].includes(catToDelete)) {
      alert('核心內建類別不允許刪除！');
      return;
    }
    setSubCategories(subCategories.filter(cat => cat !== catToDelete));
  };

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) {
      alert('請輸入商品名稱！');
      return;
    }
    if (formHasSerial && !formSerialNumber.trim()) {
      alert(`請填入該商品的${formSubCategory === 'SIM卡' ? '卡號' : '序號'}！`);
      return;
    }

    setIsSubmitting(true);
    try {
      const itemCost = parseFloat(formCost) || 0;
      const parsedQuantity = parseInt(formQuantity, 10);
      const qty = isNaN(parsedQuantity) || parsedQuantity < 1 ? 1 : parsedQuantity;
      
      // 根據輸入的數量來決定初始庫存
      const initialStock = qty;

      const insertData: any = {
        name: formName,
        cost: itemCost,
        price: parseFloat(formPrice) || 0,
        stock: initialStock, 
        category: formSubCategory,
        serial_numbers: formHasSerial ? formSerialNumber.trim() : null,
        brand: formBrand.trim() || null,          // 寫入品牌
        vendor_name: formVendorName || null       // 寫入廠商名稱
      };

      const { data: newProd, error: prodError } = await supabase
        .from('products')
        .insert([insertData])
        .select()
        .single();

      if (prodError) throw prodError;

      if (initialStock > 0 && newProd) {
        await supabase
          .from('purchase_records')
          .insert([{
            product_id: newProd.id,
            product_name: newProd.name,
            quantity: initialStock,
            cost: itemCost,
            serial_numbers: formHasSerial ? formSerialNumber.trim() : null
          }]);
      }

      alert('🎉 商品建檔成功！已自動同步建立初始進貨紀錄。');
      setIsModalOpen(false);
      fetchProducts(); 
    } catch (err: any) {
      alert('建檔失敗：' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

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
      fetchProducts(); 
    } catch (err: any) {
      alert('刪除失敗：' + err.message);
    }
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          `PRD${String(p.id).padStart(6, '0')}`.includes(searchQuery);
    const matchesCategory = selectedSubCategory === '全部小分類' || p.category === selectedSubCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#F8FAFC]">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">商品建檔</h2>
          <div className="flex items-center gap-2">
            <button onClick={fetchProducts} className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition flex items-center gap-1.5 shadow-sm">
              🔄 同步庫存類別
            </button>
            <button onClick={() => setIsCategoryModalOpen(true)} className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition flex items-center gap-1.5 shadow-sm">
              🏷️ 管理類別
            </button>
            <button onClick={openAddModal} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm flex items-center gap-1">
              ＋ 新增商品
            </button>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <div className="w-80 relative">
            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
            <input type="text" placeholder="搜尋商品名稱、編號..." className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <select className="border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={selectedSubCategory} onChange={(e) => setSelectedSubCategory(e.target.value)}>
            <option value="全部小分類">全部小分類</option>
            {subCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">商品編號</th>
                <th className="py-4 px-6">商品名稱</th>
                <th className="py-4 px-6">類別</th>
                <th className="py-4 px-6">在庫序列號 (IMEI/SN)</th>
                <th className="py-4 px-6">現有庫存</th>
                <th className="py-4 px-6">預設成本</th>
                <th className="py-4 px-6">建議售價</th>
                <th className="py-4 px-6 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-400">資料讀取中...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-400">目前沒有商品資料</td></tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs text-slate-400">PRD{String(p.id).padStart(6, '0')}</td>
                    <td className="py-4 px-6">
                      <div className="font-semibold">{p.name}</div>
                      {/* 在列表名稱下小字顯示廠牌和廠商 */}
                      {(p.brand || p.vendor_name) && (
                        <div className="text-xs text-slate-400 mt-0.5">
                          {p.brand && <span className="mr-2">廠牌: {p.brand}</span>}
                          {p.vendor_name && <span>廠商: {p.vendor_name}</span>}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6"><span className="text-xs bg-slate-100 px-2 py-0.5 rounded">{p.category}</span></td>
                    <td className="py-4 px-6">
                      {p.serial_numbers ? (
                        <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">{p.serial_numbers}</span>
                      ) : p.has_serial ? (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">待進貨序號</span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-bold font-mono">
                      {p.stock > 0 ? (
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{p.stock} 台</span>
                      ) : (
                        <span className="text-slate-400 bg-slate-100 px-2 py-1 rounded-md">0 台</span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-mono">${p.cost.toLocaleString()}</td>
                    <td className="py-4 px-6 font-mono">${p.price.toLocaleString()}</td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleDeleteProduct(p.id, p.name)}
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
      </div>

      {/* 新增商品彈窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-[620px]">
            <h3 className="text-lg font-bold mb-6">新增商品</h3>
            <form onSubmit={handleAddProduct} className="space-y-4">
              
              {/* 商品名稱 */}
              <input type="text" placeholder="商品名稱" className="w-full border rounded-lg p-3" value={formName} onChange={(e) => setFormName(e.target.value)} required />
              
              {/* 廠牌與配合廠商並排 */}
              <div className="flex gap-4">
                <input type="text" placeholder="廠牌 (例如: Apple, Samsung)" className="w-full border rounded-lg p-3" value={formBrand} onChange={(e) => setFormBrand(e.target.value)} />
                
                <select className="w-full border rounded-lg p-3 text-slate-700 bg-white" value={formVendorName} onChange={(e) => setFormVendorName(e.target.value)}>
                  <option value="">選擇配合廠商 (可不選)</option>
                  {dbVendors.map(vendor => (
                    <option key={vendor.id} value={vendor.name}>{vendor.name}</option>
                  ))}
                </select>
              </div>

              {/* 商品小分類 */}
              <select className="w-full border rounded-lg p-3" value={formSubCategory} onChange={(e) => setFormSubCategory(e.target.value)}>
                {subCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>

              {/* 成本與售價 */}
              <div className="flex gap-4">
                <input type="number" placeholder="成本" className="w-full border rounded-lg p-3" value={formCost} onChange={(e) => setFormCost(e.target.value)} />
                <input type="number" placeholder="售價" className="w-full border rounded-lg p-3" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} />
              </div>

              {/* ★ 新增：進貨數量欄位 */}
              <div>
                <input 
                  type="number" 
                  min="1" 
                  placeholder="進貨數量 (預設 1)" 
                  className="w-full border rounded-lg p-3 bg-slate-50 font-mono" 
                  value={formQuantity} 
                  onChange={(e) => setFormQuantity(e.target.value)} 
                />
              </div>

              {/* 序列號管理 */}
              <label className="flex items-center gap-2 p-4 bg-slate-50 rounded-lg cursor-pointer">
                <input type="checkbox" checked={formHasSerial} onChange={(e) => setFormHasSerial(e.target.checked)} />
                <span>啟用序列號管理</span>
              </label>
              {formHasSerial && <input type="text" placeholder="輸入序號" className="w-full border border-blue-200 rounded-lg p-3" value={formSerialNumber} onChange={(e) => setFormSerialNumber(e.target.value)} />}
              
              {/* 操作按鈕 */}
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 border rounded-lg">取消</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg">儲存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 管理類別彈窗 */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">管理小分類</h3>
              <button onClick={() => setIsCategoryModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
              <input type="text" className="flex-1 border rounded-lg px-3" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">新增</button>
            </form>
            <div className="space-y-2">
              {subCategories.map(cat => (
                <div key={cat} className="flex justify-between p-2 bg-slate-50 rounded">
                  {cat}
                  {!['手機', '配件', 'SIM卡', '核心類別'].includes(cat) && <button onClick={() => handleRemoveCategory(cat)} className="text-red-500">刪除</button>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
