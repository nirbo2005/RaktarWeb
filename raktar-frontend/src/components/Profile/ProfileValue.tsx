// raktar-frontend/src/components/Profile/ProfileValue.tsx
import { useCallback, useMemo, useState } from "react";
import { getProducts } from "../../services/api";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import type { Product } from "../../types/Product";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

function ProfileValue() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err: any) {
      console.error("Hiba a készletadatok betöltésekor");
    } finally {
      setLoading(false);
    }
  }, []);

  useAutoRefresh(fetchData);

  const formatHUF = (value: number | string | undefined) => {
    const num = typeof value === "string" ? parseFloat(value) : (value ?? 0);
    return new Intl.NumberFormat("hu-HU", {
      style: "currency",
      currency: "HUF",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const stats = useMemo(() => {
    let totalValue = 0;
    let totalItems = 0;
    const valueBySector: Record<string, number> = {};
    const valueByCategory: Record<string, number> = {};
    const productValues: any[] = [];

    products.forEach((p) => {
      if (p.isDeleted) return;

      const totalQty = p.batches?.reduce((sum, b) => sum + (b.mennyiseg || 0), 0) || 0;
      const itemTotalValue = p.eladasiAr * totalQty;

      totalValue += itemTotalValue;
      totalItems += totalQty;

      const cat = p.kategoria || "EGYEB";
      valueByCategory[cat] = (valueByCategory[cat] || 0) + itemTotalValue;

      p.batches?.forEach((batch) => {
        const sector = batch.parcella?.charAt(0).toUpperCase() || "?";
        const batchValue = (batch.mennyiseg || 0) * p.eladasiAr;
        valueBySector[sector] = (valueBySector[sector] || 0) + batchValue;
      });

      productValues.push({
        p,
        totalValue: itemTotalValue,
        totalQty,
      });
    });

    const categoryData = Object.entries(valueByCategory).map(([name, value]) => ({
      name: t(`product.categories.${name}`),
      value,
    }));

    const sectorData = Object.entries(valueBySector).map(([name, value]) => ({
      name: `${name} szektor`,
      value,
    }));

    return { 
      totalValue, 
      totalItems, 
      categoryData, 
      sectorData,
      topProducts: productValues.sort((a, b) => b.totalValue - a.totalValue).slice(0, 5)
    };
  }, [products, t]);

  if (loading && products.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 animate-pulse">
        <div className="text-6xl animate-bounce">🧮</div>
        <div className="text-blue-600 dark:text-blue-400 font-black tracking-[0.3em] uppercase text-xs">
          {t("stockValue.calculating")}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-left py-6 transition-all duration-300">
      <div className="flex items-center gap-4 mb-4 px-2">
        <button
          onClick={() => navigate("/profile")}
          className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:text-blue-500 transition-colors"
        >
          ←
        </button>
        <h2 className="text-2xl font-black uppercase italic tracking-tighter dark:text-white">
          {t("profile.dashboard.stock.title")}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-8 rounded-[2.5rem] border border-emerald-200 dark:border-emerald-800/50 shadow-xl">
          <p className="text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest text-[10px] mb-2 italic">
            {t("stockValue.totalValue")}
          </p>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 tracking-tighter">
            {formatHUF(stats.totalValue)}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl">
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] mb-2">
            {t("stockValue.totalItems")}
          </p>
          <div className="text-3xl font-black dark:text-white tracking-tighter italic">
            {stats.totalItems.toLocaleString("hu-HU")} {t("common.pieces")}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl">
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] mb-2">
            {t("stockValue.activeSectors")}
          </p>
          <div className="text-3xl font-black dark:text-white tracking-tighter italic">
            {stats.sectorData.length} {t("stockValue.sectors")}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl">
          <h3 className="text-lg font-black uppercase italic tracking-tighter mb-6 dark:text-white">
            📦 Kategória szerinti megoszlás
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.categoryData}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', fontWeight: 'bold' }}
                  formatter={(value: any) => formatHUF(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl">
          <h3 className="text-lg font-black uppercase italic tracking-tighter mb-6 dark:text-white">
            📍 Szektorok értéke
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.sectorData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', fontWeight: 'bold' }}
                  formatter={(value: any) => formatHUF(value)}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl">
          <h3 className="text-lg font-black uppercase italic tracking-tighter mb-6 dark:text-white">
            🏆 Legértékesebb készletek
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.topProducts.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-xs font-black dark:text-white uppercase italic">{item.p.nev}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">{t(`product.categories.${item.p.kategoria}`)} • {item.totalQty} db</p>
                </div>
                <div className="text-right font-black text-blue-600 dark:text-blue-400 text-sm">
                  {formatHUF(item.totalValue)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileValue;