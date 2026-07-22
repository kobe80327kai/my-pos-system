import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "POS 門市系統",
  description: "POS System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body className={`${inter.className} bg-slate-900 text-slate-100 flex h-screen overflow-hidden`}>
        
        {/* 左側導覽列 (Sidebar) */}
        <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
          
          {/* 上半部：Logo 與導覽選單 */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Logo 區塊 */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30">
                P
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-wide text-white">POS 門市系統</h1>
                <p className="text-[10px] text-slate-400 font-mono">v1.0.0</p>
              </div>
            </div>

            {/* 主要功能導覽 */}
            <div className="space-y-1">
              <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                主要功能
              </p>

              <Link
                href="/"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white transition"
              >
                <span>📊</span> 控制台
              </Link>

              <Link
                href="/purchase"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white transition"
              >
                <span>🛒</span> 進貨管理
              </Link>

              <Link
                href="/stock"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white transition"
              >
                <span>📦</span> 新品庫存管理
              </Link>

              <Link
                href="/used-phones"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white transition"
              >
                <span>📱</span> 中古機總覽
              </Link>

              <Link
                href="/repairs"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white transition"
              >
                <span>🔧</span> 維修管理
              </Link>

              <Link
                href="/customers"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white transition"
              >
                <span>👥</span> 客戶管理
              </Link>

              <Link
                href="/vendors"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white transition"
              >
                <span>🏢</span> 廠商管理
              </Link>

              {/* 📋 方案管理選項 */}
              <Link
                href="/plans"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white transition"
              >
                <span>📋</span> 方案管理
              </Link>

              {/* 📈 營運報表選項 */}
              <Link
                href="/reports"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white transition"
              >
                <span>📈</span> 營運報表
              </Link>
            </div>
          </div>

          {/* 下半部：登入者資訊 */}
          <div className="p-4 border-t border-slate-800/85 bg-slate-950/50">
            <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800/60">
              <div className="w-8 h-8 rounded-lg bg-slate-800 text-blue-400 font-bold flex items-center justify-center text-xs">
                N
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-200 truncate">管理員</p>
                <p className="text-[10px] text-slate-400 truncate font-mono">admin@pos.com</p>
              </div>
            </div>
          </div>

        </aside>

        {/* 右側主要內容區 */}
        <main className="flex-1 bg-slate-50 text-slate-900 overflow-y-auto">
          {children}
        </main>

      </body>
    </html>
  );
}