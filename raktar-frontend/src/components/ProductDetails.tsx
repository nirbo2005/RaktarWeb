import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductById, deleteProduct } from "../services/api";
import { useAuth } from "../context/AuthContext";
import type { Product } from "../types/Product";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeletedError, setIsDeletedError] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      getProductById(Number(id), user?.admin)
        .then((data) => {
          if (data.isDeleted && !user?.admin) {
            setIsDeletedError(true);
          } else {
            setProduct({ ...data, lejarat: new Date(data.lejarat) });
            setIsDeletedError(false);
          }
        })
        .catch((err) => {
          console.error("Betöltési hiba:", err);
          setIsDeletedError(true);
        })
        .finally(() => setLoading(false));
    }
  }, [id, user]);

  const handleDelete = async () => {
    if (!user || !product) return;
    if (window.confirm("Biztosan törölni szeretnéd ezt a terméket?")) {
      try {
        await deleteProduct(product.id, user.id);
        navigate("/");
      } catch (err) {
        alert("Hiba a törlés során.");
      }
    }
  };

  // Dinamikus stílusok a sötét mód figyelembevételével
  const getLejaratStyle = (date: Date) => {
    const now = new Date();
    const oneWeekLater = new Date();
    oneWeekLater.setDate(now.getDate() + 7);

    if (date <= now) return "!bg-red-500/10 !border-red-500/30 !text-red-500";
    if (date <= oneWeekLater) return "!bg-amber-500/10 !border-amber-500/30 !text-amber-500";
    return "!bg-slate-100 dark:!bg-slate-800/50 !border-slate-200 dark:!border-slate-700 !text-slate-800 dark:!text-slate-200";
  };

  const getStockStyle = (amount: number) => {
    if (amount < 10) return "!bg-red-500/10 !border-red-500/30 !text-red-500";
    if (amount < 100) return "!bg-amber-500/10 !border-amber-500/30 !text-amber-500";
    return "!bg-slate-100 dark:!bg-slate-800/50 !border-slate-200 dark:!border-slate-700 !text-slate-800 dark:!text-slate-200";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center transition-colors duration-500">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-blue-500 font-black tracking-widest uppercase text-xs">Adatok lekérése...</p>
        </div>
      </div>
    );
  }

  if (isDeletedError || !product) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 transition-colors duration-500">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-2xl text-center border border-slate-200 dark:border-slate-800 backdrop-blur-xl">
          <div className="text-8xl mb-6">🏜️</div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-4 tracking-tighter uppercase italic">Hupsz, itt nincs semmi!</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 font-bold uppercase text-xs tracking-widest">Úgy tűnik, ez a termék köddé vált.</p>
          <button onClick={() => navigate("/")} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all uppercase tracking-widest text-sm">Vissza a főoldalra</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 animate-in fade-in duration-500 transition-colors duration-500">
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900/60 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 backdrop-blur-2xl">
        
        {/* Admin banner */}
        {(product as any).isDeleted && (
          <div className="bg-amber-600 text-white px-8 py-2 text-center text-[10px] font-black uppercase tracking-[0.2em]">
            ⚠️ Figyelem: Ez a termék törölt állapotban van!
          </div>
        )}

        <div className="bg-blue-600 p-8 text-white relative overflow-hidden">
          {/* Dekoratív háttér elem */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          
          <button onClick={() => navigate(-1)} className="mb-4 opacity-70 hover:opacity-100 flex items-center gap-2 transition-all font-bold uppercase text-xs tracking-widest">
            <span className="text-xl">←</span> Vissza
          </button>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">{product.nev}</h1>
          <p className="opacity-80 font-black uppercase text-xs tracking-widest mt-2">{product.gyarto}</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Pozíció */}
            <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 transition-all group">
              <span className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase block mb-1 tracking-widest">Pozíció</span>
              <button 
                onClick={() => navigate(`/grid?parcel=${product.parcella}&productId=${product.id}`)}
                className="text-2xl font-black text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-colors flex items-center gap-2 italic"
              >
                {product.parcella} <span className="text-base group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
            
            {/* Készlet */}
            <div className={`p-6 rounded-3xl border transition-all ${getStockStyle(product.mennyiseg)}`}>
              <span className="opacity-60 text-[10px] font-black uppercase block mb-1 tracking-widest">Készlet</span>
              <span className="text-2xl font-black italic">{product.mennyiseg} db</span>
              {product.mennyiseg < 100 && (
                <span className="block text-[10px] font-black mt-1 uppercase tracking-tighter">
                  {product.mennyiseg < 10 ? "🚨 Kritikus hiány!" : "⚠️ Alacsony készlet"}
                </span>
              )}
            </div>
            
            {/* Ár */}
            <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 transition-all">
              <span className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase block mb-1 tracking-widest">Egységár</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white italic">{product.ar.toLocaleString()} Ft</span>
            </div>
            
            {/* Lejárat */}
            <div className={`p-6 rounded-3xl border transition-all ${getLejaratStyle(product.lejarat)}`}>
              <span className="opacity-60 text-[10px] font-black uppercase block mb-1 tracking-widest">Lejárat dátuma</span>
              <span className="text-2xl font-black italic">{product.lejarat.toLocaleDateString("hu-HU")}</span>
              {product.lejarat <= new Date(new Date().setDate(new Date().getDate() + 7)) && (
                <span className="block text-[10px] font-black mt-1 uppercase tracking-tighter">
                  {product.lejarat <= new Date() ? "💀 Lejárt termék!" : "⏳ Hamarosan lejár!"}
                </span>
              )}
            </div>
          </div>

          {user && !(product as any).isDeleted && (
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button 
                onClick={() => navigate(`/modify/${product.id}`)}
                className="flex-1 bg-slate-900 dark:bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-black dark:hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-500/10 uppercase tracking-widest text-xs"
              >
                Szerkesztés
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-500/10 uppercase tracking-widest text-xs"
              >
                Törlés
              </button>
            </div>
          )}

          {user?.admin && (product as any).isDeleted && (
             <button 
                onClick={() => navigate(`/modify/${product.id}`)}
                className="w-full bg-amber-600 text-white py-4 rounded-2xl font-black hover:bg-amber-700 transition-all shadow-lg uppercase tracking-widest text-xs"
             >
                Visszaállítás kezelése
             </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;