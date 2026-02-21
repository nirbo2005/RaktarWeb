//raktar-frontend/src/components/beta/StockValue.tsx
import { useEffect, useMemo, useState } from "react";
import { getProducts } from "../../services/api";
import type { Product } from "../../types/Product";

function StockValue() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err: any) {
      setError("Nem sikerült betölteni a készletadatokat.");
    } finally {
      setLoading(false);
    }
  };

  // --- KALKULÁCIÓK ---
  const formatHUF = (value: number) => {
    return new Intl.NumberFormat("hu-HU", {
      style: "currency",
      currency: "HUF",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const stats = useMemo(() => {
    let totalValue = 0;
    let totalItems = 0;
    const valueBySector: Record<string, number> = {};
    const productValues: { p: Product; totalValue: number }[] = [];

    products.forEach((p) => {
      // Csak az aktív (nem törölt) termékeket számoljuk
      if (p.isDeleted) return;

      const itemTotalValue = p.ar * p.mennyiseg;
      totalValue += itemTotalValue;
      totalItems += p.mennyiseg;

      // Szektor alapú bontás (pl. "A" vagy "B")
      const sector = p.parcella.charAt(0).toUpperCase();
      if (!valueBySector[sector]) valueBySector[sector] = 0;
      valueBySector[sector] += itemTotalValue;

      // Hozzáadás a toplistához
      productValues.push({ p, totalValue: itemTotalValue });
    });

    // Top 5 legértékesebb termék (készletérték alapján csökkenő)
    const topProducts = productValues
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);

    return { totalValue, totalItems, valueBySector, topProducts };
  }, [products]);

  // --- RENDERELÉS ---
  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 animate-pulse">
        <div className="text-6xl">🧮</div>
        <div className="text-blue-600 dark:text-blue-400 font-black tracking-[0.3em] uppercase text-xs">
          Értékek számítása...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-8 rounded-[2.5rem] border border-red-200 dark:border-red-900/50 font-black uppercase tracking-widest text-center shadow-xl">
          <span className="text-4xl block mb-4">⚠️</span>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* FEJLÉC */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 text-left">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
              Készlet<span className="text-emerald-500">érték</span> Kalkulátor
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-xs tracking-widest mt-2">
              Pénzügyi áttekintő • {new Date().toLocaleDateString('hu-HU')}
            </p>
          </div>
          <button 
            onClick={fetchData}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:border-emerald-400 transition-all shadow-sm active:scale-95"
          >
            🔄 Újraszámolás
          </button>
        </div>

        {/* FŐ MUTATÓK (HERO CARDS) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-8 rounded-[2.5rem] border border-emerald-200 dark:border-emerald-800/50 shadow-xl shadow-emerald-500/10">
            <h3 className="text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest text-xs mb-2">Teljes Raktárérték</h3>
            <div className="text-4xl md:text-5xl font-black text-emerald-700 dark:text-emerald-300 tracking-tighter truncate" title={formatHUF(stats.totalValue)}>
              {formatHUF(stats.totalValue)}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-slate-400 font-black uppercase tracking-widest text-xs mb-2">Összes Raktározott Cikk</h3>
            <div className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tighter">
              {stats.totalItems.toLocaleString("hu-HU")} <span className="text-xl text-slate-400 font-bold">db</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-slate-400 font-black uppercase tracking-widest text-xs mb-2">Egyedi Termékfajták</h3>
            <div className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tighter">
              {products.length} <span className="text-xl text-slate-400 font-bold">fajta</span>
            </div>
          </div>
        </div>

        {/* RÉSZLETES BONTÁS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
          
          {/* TOP 5 TERMÉK */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter italic mb-6">
              🏆 Top 5 Legértékesebb Készlet
            </h3>
            <div className="space-y-4">
              {stats.topProducts.map((item, index) => (
                <div key={item.p.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-emerald-400 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-black text-slate-300 dark:text-slate-600">#{index + 1}</span>
                    <div>
                      <p className="font-black text-slate-800 dark:text-slate-200 text-sm truncate max-w-[150px] sm:max-w-[250px]">{item.p.nev}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{item.p.mennyiseg} db × {formatHUF(item.p.ar)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-emerald-600 dark:text-emerald-400">{formatHUF(item.totalValue)}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.p.parcella}</p>
                  </div>
                </div>
              ))}
              {stats.topProducts.length === 0 && (
                <p className="text-slate-400 italic text-sm text-center py-4">Nincs adat.</p>
              )}
            </div>
          </div>

          {/* SZEKTORONKÉNTI BONTÁS */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter italic mb-6">
              📍 Érték Szektoronként
            </h3>
            <div className="space-y-6">
              {Object.entries(stats.valueBySector).sort((a, b) => a[0].localeCompare(b[0])).map(([sector, value]) => {
                const percentage = stats.totalValue > 0 ? (value / stats.totalValue) * 100 : 0;
                
                return (
                  <div key={sector}>
                    <div className="flex justify-between items-end mb-2">
                      <span className="font-black text-slate-800 dark:text-slate-200 text-xl">"{sector}" Szektor</span>
                      <div className="text-right">
                        <span className="font-black text-blue-600 dark:text-blue-400 block">{formatHUF(value)}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{percentage.toFixed(1)}% a teljesből</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-4 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              {Object.keys(stats.valueBySector).length === 0 && (
                <p className="text-slate-400 italic text-sm text-center py-4">Nincs adat.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default StockValue;