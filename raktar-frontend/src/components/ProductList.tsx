import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProducts, deleteProduct } from "../services/api";
import { useAuth } from "../context/AuthContext";
import type { Product } from "../types/Product";
import { QRCodeSVG } from "qrcode.react";

type SortColumn = "nev" | "lejarat" | "mennyiseg";

const getAlertPriority = (p: Product) => {
  const now = new Date();
  const oneWeekLater = new Date();
  oneWeekLater.setDate(now.getDate() + 7);
  if (p.lejarat <= now) return 100;
  if (p.lejarat <= oneWeekLater) return 90;
  if (p.mennyiseg < 10) return 80;
  if (p.mennyiseg < 100) return 70;
  return 0;
};

function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sortColumn, setSortColumn] = useState<SortColumn>("nev");
  const [isAscending, setIsAscending] = useState(true);
  const [showAlertsOnly, setShowAlertsOnly] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    getProducts().then((data) => {
      setProducts(data.map((p) => ({ ...p, lejarat: new Date(p.lejarat) })));
    });
  }, []);

  const handleSort = (column: SortColumn) => {
    if (column === sortColumn) {
      setIsAscending((prev) => !prev);
    } else {
      setSortColumn(column);
      setIsAscending(true);
    }
  };

  const filteredAndSortedProducts = useMemo(() => {
    let list = showAlertsOnly ? products.filter((p) => getAlertPriority(p) > 0) : [...products];
    list.sort((a, b) => {
      if (showAlertsOnly) {
        const prioA = getAlertPriority(a);
        const prioB = getAlertPriority(b);
        if (prioA !== prioB) return prioB - prioA;
      }
      let comp = 0;
      if (sortColumn === "lejarat") comp = a.lejarat.getTime() - b.lejarat.getTime();
      else if (sortColumn === "mennyiseg") comp = a.mennyiseg - b.mennyiseg;
      else comp = a.nev.localeCompare(b.nev);
      return isAscending ? comp : -comp;
    });
    return list;
  }, [products, sortColumn, isAscending, showAlertsOnly]);

  const handleDelete = async (id: number) => {
    if (!user || !window.confirm("Biztosan törölni szeretnéd?")) return;
    try {
      await deleteProduct(id, user.id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) { alert("Hiba a törlésnél."); }
  };

  const getDateStyles = (lejarat: Date) => {
    const now = new Date();
    const oneWeek = new Date(); oneWeek.setDate(now.getDate() + 7);
    if (lejarat <= now) return "!bg-red-500/20 !text-red-400 border-red-500/30";
    if (lejarat <= oneWeek) return "!bg-amber-500/20 !text-amber-400 border-amber-500/30";
    return "!bg-slate-800/40 !text-slate-300 border-slate-700/50";
  };

  const getStockStyles = (qty: number) => {
    if (qty < 10) return "!bg-red-600/20 !text-red-400 border-red-500/30";
    if (qty < 100) return "!bg-amber-600/20 !text-amber-400 border-amber-500/30";
    return "!bg-blue-600/20 !text-blue-400 border-blue-500/30";
  };

  return (
    <div className="min-h-screen p-4 md:p-10 relative overflow-hidden">
      <video autoPlay loop muted playsInline className="fixed top-0 left-0 w-full h-full object-cover -z-20 brightness-[0.25]">
        <source src="https://assets.mixkit.co/videos/preview/mixkit-stars-in-the-night-sky-loop-9951-large.mp4" type="video/mp4" />
      </video>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate("/")}>
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/40 group-hover:scale-110 transition-transform">
              <span className="text-3xl">📦</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase">Raktár</h1>
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <button
              onClick={() => setShowAlertsOnly(!showAlertsOnly)}
              className={`flex-1 md:flex-none px-6 py-4 rounded-2xl font-bold transition-all border-2 uppercase text-xs tracking-widest backdrop-blur-md ${
                showAlertsOnly ? "!bg-red-600 !border-red-400 text-white shadow-lg shadow-red-600/30" : "!bg-slate-900/60 !border-slate-700 text-slate-400"
              }`}
            >
              {showAlertsOnly ? "🚨 Csak hibák" : "⚠️ Szűrés"}
            </button>
            {user && (
              <button onClick={() => navigate("/add")} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-600/30 transition-all active:scale-95">
                + Új Termék
              </button>
            )}
          </div>
        </div>

        {filteredAndSortedProducts.length > 0 ? (
          <>
            {/* ASZTALI TÁBLÁZAT */}
            <div className="hidden lg:block bg-slate-900/50 backdrop-blur-3xl rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-800/50 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-800">
                    <th className="p-6 text-center">QR</th>
                    <th className="p-6 text-left cursor-pointer hover:text-blue-400" onClick={() => handleSort("nev")}>Termék {sortColumn === "nev" && "⇅"}</th>
                    <th className="p-6 text-left cursor-pointer hover:text-blue-400" onClick={() => handleSort("lejarat")}>Lejárat {sortColumn === "lejarat" && "⇅"}</th>
                    <th className="p-6 text-left cursor-pointer hover:text-blue-400" onClick={() => handleSort("mennyiseg")}>Készlet {sortColumn === "mennyiseg" && "⇅"}</th>
                    <th className="p-6 text-right">Művelet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredAndSortedProducts.map(p => (
                    <tr key={p.id} className="hover:bg-blue-600/5 transition-colors group">
                      <td className="p-6 text-center">
                        <div className="inline-block bg-white p-1 rounded-lg"><QRCodeSVG value={p.id.toString()} size={35} /></div>
                      </td>
                      <td className="p-6">
                        {/* KATTINTHATÓ NÉV */}
                        <div 
                          className="font-black text-white text-lg cursor-pointer hover:text-blue-400 transition-colors inline-block"
                          onClick={() => navigate(`/product/${p.id}`)}
                        >
                          {p.nev}
                        </div>
                        <div className="text-slate-500 text-xs uppercase font-bold">{p.gyarto}</div>
                      </td>
                      <td className="p-6">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-black border ${getDateStyles(p.lejarat)}`}>
                          {p.lejarat.toLocaleDateString("hu-HU")}
                        </span>
                      </td>
                      <td className="p-6 whitespace-nowrap">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-black border ${getStockStyles(p.mennyiseg)}`}>
                          {p.mennyiseg} db
                        </span>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => navigate(`/modify/${p.id}`)} className="bg-slate-800 hover:bg-blue-600 p-2 rounded-xl text-white transition-colors">✏️</button>
                          <button onClick={() => handleDelete(p.id)} className="bg-slate-800 hover:bg-red-600 p-2 rounded-xl text-white transition-colors">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBIL KÁRTYÁS NÉZET */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredAndSortedProducts.map(p => (
                <div key={p.id} className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-slate-800 shadow-xl relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="bg-white p-2 rounded-xl shadow-lg shadow-white/10">
                      <QRCodeSVG value={p.id.toString()} size={50} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black border text-center ${getDateStyles(p.lejarat)}`}>
                        ⌛ {p.lejarat.toLocaleDateString("hu-HU")}
                      </span>
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black border text-center ${getStockStyles(p.mennyiseg)}`}>
                        📦 {p.mennyiseg} DB
                      </span>
                    </div>
                  </div>

                  <div className="mb-6">
                    {/* KATTINTHATÓ NÉV MOBILON IS */}
                    <h3 
                      className="text-2xl font-black text-white tracking-tight leading-none mb-1 cursor-pointer hover:text-blue-400 transition-colors"
                      onClick={() => navigate(`/product/${p.id}`)}
                    >
                      {p.nev}
                    </h3>
                    <p className="text-blue-500 font-bold text-xs uppercase tracking-widest">{p.gyarto}</p>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-800/50">
                    <button onClick={() => navigate(`/product/${p.id}`)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold text-xs uppercase transition-all">Részletek</button>
                    {user && (
                      <>
                        <button onClick={() => navigate(`/modify/${p.id}`)} className="bg-blue-600/20 text-blue-400 p-3 rounded-xl border border-blue-500/20">✏️</button>
                        <button onClick={() => handleDelete(p.id)} className="bg-red-600/20 text-red-400 p-3 rounded-xl border border-red-500/20">🗑️</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="py-32 text-center bg-slate-900/40 backdrop-blur-md rounded-[3rem] border-2 border-dashed border-slate-800">
             <div className="text-6xl mb-4">✨</div>
             <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Minden polc rendben</h2>
             <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.3em] mt-2">Nincs beavatkozást igénylő tétel</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductList;