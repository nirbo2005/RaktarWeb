import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getProducts } from "../services/api";
import type { Product } from "../types/Product";

function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const navigate = useNavigate();
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [query]);

  useEffect(() => {
    setLoading(true);
    getProducts().then(all => {
      const filtered = all.filter(p => 
        p.nev.toLowerCase().includes(query.toLowerCase()) || 
        p.gyarto.toLowerCase().includes(query.toLowerCase()) ||
        p.parcella.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
      setLoading(false);
    });
  }, [query]);

  const getStatusBadge = (product: Product) => {
    const now = new Date();
    const oneWeekLater = new Date();
    oneWeekLater.setDate(now.getDate() + 7);
    const lejaratDate = product.lejarat ? new Date(product.lejarat) : null;

    if ((lejaratDate && lejaratDate <= now) || product.mennyiseg < 10)
      return "bg-red-500/10 text-red-500 border-red-500/20";
    if ((lejaratDate && lejaratDate <= oneWeekLater) || product.mennyiseg < 100)
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 md:p-12 animate-in fade-in duration-500 transition-colors duration-500">
      <div className="max-w-5xl mx-auto">
        
        {/* Modern Fejléc */}
        <header className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">
              Keresési <span className="text-blue-600">találatok</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-semibold mt-3 text-sm md:text-base">
              Kifejezés: <span className="text-blue-500 underline decoration-2 underline-offset-4 font-bold">"{query}"</span>
            </p>
          </div>
          <div className="inline-block bg-white dark:bg-slate-900 px-6 py-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xs md:text-sm tracking-widest uppercase self-start md:self-end">
            {results.length} találat
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4 text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 dark:text-slate-500 font-black uppercase text-xs tracking-[0.2em]">Készlet átfésülése...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="grid gap-6">
            {results.map(p => (
              <div 
                key={p.id}
                onClick={() => navigate(`/product/${p.id}`)}
                className="group bg-white dark:bg-slate-900/60 p-3 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:border-blue-500/30 transition-all duration-300 cursor-pointer flex flex-col md:flex-row items-center gap-4 md:gap-6 backdrop-blur-xl"
              >
                {/* Ikon szekció */}
                <div className="w-full md:w-32 h-24 md:h-32 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center text-4xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-inner">
                  {p.mennyiseg < 10 ? "⚠️" : "📦"}
                </div>

                {/* Termék infók */}
                <div className="flex-1 py-2 px-2 text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusBadge(p)}`}>
                      {p.mennyiseg < 10 ? "Kritikus" : "Raktáron"}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600 text-xs font-bold font-mono">#{p.id}</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight leading-tight mb-1">
                    {p.nev}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 font-bold text-xs md:text-sm uppercase tracking-wide">
                    {p.gyarto} • <span className="text-blue-500 dark:text-blue-400 font-black">{p.ar.toLocaleString()} Ft</span>
                  </p>
                </div>

                {/* Helyszín és készlet */}
                <div className="w-full md:w-auto flex md:flex-col items-center justify-around md:justify-center gap-4 bg-slate-50 dark:bg-slate-800/50 md:bg-transparent p-4 md:p-8 rounded-[2rem] md:rounded-none">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1">Hely</p>
                    <span className="bg-blue-600 text-white px-4 py-1.5 rounded-xl font-black text-base md:text-lg shadow-lg shadow-blue-500/20 block border border-blue-400/20">
                      {p.parcella}
                    </span>
                  </div>
                  <div className="text-center border-l md:border-l-0 md:border-t border-slate-200 dark:border-slate-800 pl-4 md:pl-0 md:pt-4">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1">Készlet</p>
                    <span className="text-lg md:text-xl font-black text-slate-800 dark:text-white">{p.mennyiseg} db</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Nincs találat */
          <div className="text-center py-20 md:py-32 bg-white dark:bg-slate-900 rounded-[3rem] border-4 border-dashed border-slate-100 dark:border-slate-800 px-6 backdrop-blur-md">
            <div className="text-6xl md:text-8xl mb-6 animate-bounce">🏜️</div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white mb-2 italic tracking-tighter uppercase">Nem találtunk semmit...</h2>
            <p className="text-slate-400 dark:text-slate-500 font-bold mb-8 max-w-sm mx-auto uppercase text-xs tracking-widest">A tétel jelenleg nem szerepel a nyilvántartásban.</p>
            <button 
              onClick={() => navigate("/")} 
              className="w-full md:w-auto bg-blue-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 dark:hover:bg-blue-500 transition-all active:scale-95 uppercase text-sm tracking-widest"
            >
              Vissza a kezdőlapra
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchResults;