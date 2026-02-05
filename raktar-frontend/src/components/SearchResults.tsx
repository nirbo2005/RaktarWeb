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

  // Segédfüggvény a státusz színekhez (mint a többi oldalon)
  const getStatusBadge = (product: Product) => {
    const now = new Date();
    const oneWeekLater = new Date();
    oneWeekLater.setDate(now.getDate() + 7);
    const lejaratDate = product.lejarat ? new Date(product.lejarat) : null;

    if ((lejaratDate && lejaratDate <= now) || product.mennyiseg < 10)
      return "bg-red-50 text-red-600 border-red-100";
    if ((lejaratDate && lejaratDate <= oneWeekLater) || product.mennyiseg < 100)
      return "bg-amber-50 text-amber-600 border-amber-100";
    return "bg-emerald-50 text-emerald-600 border-emerald-100";
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-12 animate-in fade-in duration-500">
      <div className="max-w-5xl mx-auto">
        
        {/* Modern Fejléc */}
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-8">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
              Keresési <span className="text-blue-600">találatok</span>
            </h1>
            <p className="text-slate-500 font-semibold mt-2">
              Kifejezés: <span className="text-blue-500 underline decoration-2 underline-offset-4">"{query}"</span>
            </p>
          </div>
          <div className="bg-white px-6 py-2 rounded-2xl shadow-sm border border-slate-200 text-slate-400 font-bold text-sm tracking-widest uppercase">
            {results.length} találat
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-black uppercase text-xs tracking-[0.2em]">Készlet átfésülése...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="grid gap-6">
            {results.map(p => (
              <div 
                key={p.id}
                onClick={() => navigate(`/product/${p.id}`)}
                className="group bg-white p-2 rounded-[2.5rem] border border-slate-100 shadow-xl hover:shadow-2xl hover:shadow-blue-100 transition-all duration-300 cursor-pointer flex flex-col md:flex-row items-center gap-6"
              >
                {/* Ikon szekció */}
                <div className="w-full md:w-32 h-32 bg-slate-50 rounded-[2rem] flex items-center justify-center text-4xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  {p.mennyiseg < 10 ? "⚠️" : "📦"}
                </div>

                {/* Termék infók */}
                <div className="flex-1 py-4 px-2 text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusBadge(p)}`}>
                      {p.mennyiseg < 10 ? "Kritikus készlet" : "Raktáron"}
                    </span>
                    <span className="text-slate-300 text-xs font-bold">#{p.id}</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 group-hover:text-blue-600 transition-colors tracking-tight">
                    {p.nev}
                  </h3>
                  <p className="text-slate-500 font-bold text-sm uppercase tracking-wide">
                    {p.gyarto} • <span className="text-blue-500">{p.ar.toLocaleString()} Ft</span>
                  </p>
                </div>

                {/* Helyszín és készlet szekció */}
                <div className="w-full md:w-auto flex md:flex-col items-center justify-between md:justify-center gap-4 bg-slate-50 md:bg-transparent p-6 md:p-8 rounded-[2rem] md:rounded-none">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Parcella</p>
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-xl font-black text-lg shadow-lg shadow-blue-200">
                      {p.parcella}
                    </span>
                  </div>
                  <div className="text-right md:text-center border-l md:border-l-0 md:border-t border-slate-200 pl-4 md:pl-0 md:pt-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Mennyiség</p>
                    <span className="text-xl font-black text-slate-800">{p.mennyiseg} db</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Nincs találat nézet (Hupsz stílusban) */
          <div className="text-center py-24 bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
            <div className="text-7xl mb-6">🔍</div>
            <h2 className="text-2xl font-black text-slate-800 mb-2 italic">Nem találtunk semmit...</h2>
            <p className="text-slate-400 font-medium mb-8">Próbálkozz más kulcsszóval vagy ellenőrizd a helyesírást.</p>
            <button 
              onClick={() => navigate("/")} 
              className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
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