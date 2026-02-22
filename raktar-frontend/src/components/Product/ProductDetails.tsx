import { useState, useCallback } from "react"; // useEffect eltávolítva
import { useParams, useNavigate } from "react-router-dom";
import { getProductById, deleteProduct } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import type { Product } from "../../types/Product";
import Swal from 'sweetalert2';

const MySwal = Swal.mixin({
  customClass: {
    popup: 'rounded-[2.5rem] bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl font-sans',
    confirmButton: 'bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 mx-2',
    cancelButton: 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 mx-2',
  },
  buttonsStyling: false,
});

const toast = MySwal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
  background: 'rgb(15, 23, 42)',
  color: '#fff'
});

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeletedError, setIsDeletedError] = useState(false);

  const isAdmin = user?.rang === "ADMIN";
  const canEdit = user?.rang === "KEZELO" || isAdmin;

  // 1. Memoizált adatlekérés
  const fetchProductData = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getProductById(Number(id), isAdmin);
      if (data.isDeleted && !isAdmin) {
        setIsDeletedError(true);
      } else {
        setProduct(data);
        setIsDeletedError(false);
      }
    } catch (err) {
      console.error("Betöltési hiba:", err);
      if (!product) setIsDeletedError(true);
    } finally {
      setLoading(false);
    }
  }, [id, isAdmin, product]);

  // 2. Automatikus frissítés (kezeli az első betöltést, a WebSocketet és a Reconnectet is)
  useAutoRefresh(fetchProductData);

  const handleDelete = async () => {
    if (!user || !product || !canEdit) return;

    const result = await MySwal.fire({
      title: 'Biztos vagy benne?',
      text: `A(z) "${product.nev}" teljes cikktörzse és minden fizikai sarzsa törlésre kerül a rendszerből!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Igen, törlöm!',
      cancelButtonText: 'Mégse',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        await deleteProduct(product.id, user.id);
        await toast.fire({
          icon: 'success',
          title: 'Termék törölve! 🗑️'
        });
        navigate("/");
      } catch (err) {
         MySwal.fire({
          icon: 'error',
          title: 'Hiba',
          text: 'Sikertelen törlés.',
        });
      }
    }
  };

  const getTotalQuantity = (p: Product) => {
    if (!p.batches || p.batches.length === 0) return 0;
    return p.batches.reduce((sum, b) => sum + b.mennyiseg, 0);
  };

  const getStockStyle = (amount: number, minimum: number) => {
    if (amount < minimum) return "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400";
    if (amount < minimum * 2) return "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400";
    return "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200";
  };

  const getLejaratStyle = (dateStr: string | Date | null) => {
    if (!dateStr) return "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200";
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const oneWeekLater = new Date();
    oneWeekLater.setDate(now.getDate() + 7);
    oneWeekLater.setHours(0, 0, 0, 0);

    if (date <= now) return "bg-red-500/10 border-red-500/40 text-red-600 dark:text-red-400 border-2";
    if (date <= oneWeekLater) return "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400 border-2";
    return "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200";
  };

  if (loading && !product) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-blue-600 font-black tracking-widest uppercase text-xs">Adatok lekérése...</p>
        </div>
      </div>
    );
  }

  if (isDeletedError || !product) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-2xl text-center border border-slate-200 dark:border-slate-800">
          <div className="text-8xl mb-6">🏜️</div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter uppercase italic text-center">Nincs ilyen termék</h1>
          <button onClick={() => navigate("/")} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all uppercase tracking-widest text-sm">Vissza a főoldalra</button>
        </div>
      </div>
    );
  }

  const totalQty = getTotalQuantity(product);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 text-left transition-all">
        {(product as any).isDeleted && (
          <div className="bg-amber-600 text-white px-8 py-2 text-center text-[10px] font-black uppercase tracking-[0.2em]">
            ⚠️ Figyelem: Ez a termék törölt állapotban van!
          </div>
        )}

        <div className="bg-blue-600 p-8 text-white relative overflow-hidden flex justify-between items-start">
          <div>
            <button onClick={() => navigate(-1)} className="mb-6 opacity-70 hover:opacity-100 flex items-center gap-2 transition-all font-bold uppercase text-[10px] tracking-[0.2em]">
              <span className="text-lg">←</span> Vissza
            </button>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic leading-tight">{product.nev}</h1>
            <p className="opacity-80 font-black uppercase text-xs tracking-[0.2em] mt-2 border-t border-white/20 pt-2 inline-block">
              {product.gyarto} • {product.kategoria}
            </p>
          </div>
          <div className="text-right">
            <span className="block text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Cikkszám (ID)</span>
            <span className="text-3xl font-black opacity-90">#{product.id}</span>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div>
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Mesteradatok</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
                <span className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase block mb-1 tracking-widest">Súly (Egység)</span>
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100 italic">{product.suly} <span className="text-sm font-medium">kg</span></span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
                <span className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase block mb-1 tracking-widest">Min. Készlet</span>
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100 italic">{product.minimumKeszlet} <span className="text-sm font-medium">db</span></span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
                <span className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase block mb-1 tracking-widest">Beszerzési Ár</span>
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100 italic">{product.beszerzesiAr.toLocaleString()} <span className="text-sm font-medium">Ft</span></span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
                <span className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase block mb-1 tracking-widest">Eladási Ár</span>
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100 italic">{product.eladasiAr.toLocaleString()} <span className="text-sm font-medium">Ft</span></span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Készlet Állapot</h3>
            <div className={`p-8 rounded-3xl border transition-colors ${getStockStyle(totalQty, product.minimumKeszlet)} flex justify-between items-center`}>
              <div>
                <span className="opacity-60 text-[10px] font-black uppercase block mb-1 tracking-widest">Aktuális Összesített Készlet</span>
                <span className="text-4xl font-black italic">{totalQty} <span className="text-lg font-medium lowercase">db</span></span>
                {totalQty < product.minimumKeszlet && (
                  <span className="block text-[10px] font-black mt-2 uppercase tracking-tighter bg-white/20 dark:bg-black/20 px-2 py-0.5 rounded inline-block italic">🚨 Kritikus készlet</span>
                )}
              </div>
              <div className="text-6xl opacity-30">📦</div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Fizikai Elhelyezkedés (Sarzsok)</h3>
            {product.batches && product.batches.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {product.batches.map(batch => (
                  <div key={batch.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3 group">
                    <div className="flex justify-between items-start">
                      <button onClick={() => navigate(`/grid?parcel=${batch.parcella}&productId=${product.id}`)} className="text-2xl font-black text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors flex items-center gap-2 italic uppercase">
                        {batch.parcella} <span className="text-base opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">→</span>
                      </button>
                      <span className="text-2xl font-black text-slate-800 dark:text-white italic">{batch.mennyiseg} <span className="text-sm">db</span></span>
                    </div>
                    <div className={`p-3 rounded-xl border ${getLejaratStyle(batch.lejarat)} transition-all duration-300`}>
                      <span className="opacity-60 text-[9px] font-black uppercase block mb-1 tracking-widest">Szavatossági idő</span>
                      <span className="text-sm font-black italic">{batch.lejarat ? new Date(batch.lejarat).toLocaleDateString("hu-HU") : "Nem romlandó"}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <span className="text-4xl mb-3 block opacity-50">🕸️</span>
                <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Nincs készleten.</p>
              </div>
            )}
          </div>

          {canEdit && !(product as any).isDeleted && (
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-50 dark:border-slate-800">
              <button onClick={() => navigate(`/modify/${product.id}`)} className="flex-1 bg-slate-900 dark:bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-slate-800 dark:hover:bg-blue-500 shadow-lg uppercase tracking-widest text-[10px] italic transition-all">Módosítás</button>
              <button onClick={handleDelete} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black hover:bg-red-700 shadow-lg uppercase tracking-widest text-[10px] italic transition-all">Törlés</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;