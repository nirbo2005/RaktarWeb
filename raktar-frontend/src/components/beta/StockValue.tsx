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

  // --- FORMÁZÓ FÜGGVÉNYEK ---
  const formatHUF = (value: number) => {
    return new Intl.NumberFormat("hu-HU", {
      style: "currency",
      currency: "HUF",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatSmartValue = (value: number) => {
    if (value >= 1_000_000_000) {
      return (value / 1_000_000_000).toLocaleString("hu-HU", {
        maximumFractionDigits: 3,
        minimumFractionDigits: 1
      }) + " milliárd Ft";
    }
    if (value >= 1_000_000) {
      return (value / 1_000_000).toLocaleString("hu-HU", {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1
      }) + " millió Ft";
    }
    return formatHUF(value);
  };

  // --- KALKULÁCIÓK ---
  const stats = useMemo(() => {
    let totalValue = 0;
    let totalItems = 0;
    const valueBySector: Record<string, number> = {};
    const productValues: { p: Product; totalValue: number; totalQty: number; locations: string }[] = [];

    products.forEach((p) => {
      if (p.isDeleted) return;

      // Mennyiség és helyszínek kinyerése a sarzsokból
      const totalQty = p.batches?.reduce((sum, b) => sum + (b.mennyiseg || 0), 0) || 0;
      const itemTotalValue = p.eladasiAr * totalQty; 
      
      totalValue += itemTotalValue;
      totalItems += totalQty;

      // Szektor alapú bontás a sarzsok helyszínei alapján
      p.batches?.forEach(batch => {
        const sector = batch.parcella?.charAt(0).toUpperCase() || "?";
        const batchValue = (batch.mennyiseg || 0) * p.eladasiAr;
        
        if (!valueBySector[sector]) valueBySector[sector] = 0;
        valueBySector[sector] += batchValue;
      });

      const uniqueLocations = Array.from(new Set(p.batches?.map(b => b.parcella))).filter(Boolean).join(", ");

      productValues.push({ 
        p, 
        totalValue: itemTotalValue, 
        totalQty, 
        locations: uniqueLocations || "Nincs helyszín" 
      });
    });

    const topProducts = productValues
      .filter(item => item.totalQty > 0)
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);

    return { totalValue, totalItems, valueBySector, topProducts };
  }, [products]);

  // --- RENDERELÉS ---
  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 animate-pulse">
        <div className="text-6xl animate-bounce">🧮</div>
        <div className="text-blue-600 dark:text-blue-400 font-black tracking-[0.3em] uppercase text-xs">
          Pénzügyi adatok kalkulálása...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
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
              Sarzs-alapú pénzügyi elemzés • {new Date().toLocaleDateString('hu-HU')}
            </p>
          </div>
          <button 
            onClick={fetchData}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:border-emerald-400 transition-all shadow-sm active:scale-95"
          >
            🔄 Újraszámolás
          </button>
        </div>

        {/* FŐ MUTATÓK */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-8 rounded-[2.5rem] border border-emerald-200 dark:border-emerald-800/50 shadow-xl shadow-emerald-500/10 col-span-1 md:col-span-2 lg:col-span-1">
            <h3 className="text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest text-xs mb-2 italic">Teljes Raktárérték</h3>
            <div 
              className="text-3xl sm:text-4xl lg:text-5xl font-black text-emerald-700 dark:text-emerald-300 tracking-tighter leading-tight break-words"
              title={formatHUF(stats.totalValue)}
            >
              {formatSmartValue(stats.totalValue)}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-slate-400 font-black uppercase tracking-widest text-xs mb-2">Összes Darabszám</h3>
            <div className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tighter">
              {stats.totalItems.toLocaleString("hu-HU")} <span className="text-xl text-slate-400 font-bold uppercase">db</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-slate-400 font-black uppercase tracking-widest text-xs mb-2">Aktív Szektorok</h3>
            <div className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tighter">
              {Object.keys(stats.valueBySector).length} <span className="text-xl text-slate-400 font-bold uppercase">szektor</span>
            </div>
          </div>
        </div>

        {/* RÉSZLETES BONTÁS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
          
          {/* TOP 5 TERMÉK */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter italic mb-6">
              🏆 Érték szerinti rangsor
            </h3>
            <div className="space-y-4">
              {stats.topProducts.map((item, index) => (
                <div key={item.p.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-emerald-400 transition-colors">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <span className="text-xl font-black text-slate-300 dark:text-slate-600">#{index + 1}</span>
                    <div className="truncate">
                      <p className="font-black text-slate-800 dark:text-slate-200 text-sm truncate">{item.p.nev}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        {item.totalQty} db • {item.locations}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="font-black text-emerald-600 dark:text-emerald-400">{formatHUF(item.totalValue)}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{item.p.kategoria}</p>
                  </div>
                </div>
              ))}
              {stats.topProducts.length === 0 && (
                <p className="text-slate-400 italic text-sm text-center py-4">Nincs készleten lévő termék.</p>
              )}
            </div>
          </div>

          {/* SZEKTORONKÉNTI BONTÁS */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter italic mb-6">
              📍 Területi Eloszlás
            </h3>
            <div className="space-y-6">
              {Object.entries(stats.valueBySector).sort((a, b) => b[1] - a[1]).map(([sector, value]) => {
                const percentage = stats.totalValue > 0 ? (value / stats.totalValue) * 100 : 0;
                
                return (
                  <div key={sector}>
                    <div className="flex justify-between items-end mb-2">
                      <span className="font-black text-slate-800 dark:text-slate-200 text-xl">"{sector}" Szektor</span>
                      <div className="text-right">
                        <span className="font-black text-blue-600 dark:text-blue-400 block">{formatHUF(value)}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{percentage.toFixed(1)}% részesedés</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              {Object.keys(stats.valueBySector).length === 0 && (
                <p className="text-slate-400 italic text-sm text-center py-4">Nincs rögzített helyszínadat.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default StockValue;