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
      // Átadjuk az admin státuszt a lekéréshez
      getProductById(Number(id), user?.admin)
        .then((data) => {
          // Ellenőrizzük a törölt állapotot
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

  // 1. BETÖLTÉS ÁLLAPOT
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-blue-400 font-medium tracking-widest uppercase text-xs">Adatok lekérése...</p>
        </div>
      </div>
    );
  }

  // 2. HIBA / TÖRÖLT ÁLLAPOT (Hupsz nézet)
  if (isDeletedError || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[3rem] p-10 shadow-2xl text-center border border-gray-100 animate-in fade-in zoom-in duration-500">
          <div className="text-8xl mb-6">🏜️</div>
          <h1 className="text-3xl font-black text-gray-800 mb-4 tracking-tight leading-tight">
            Hupsz, itt nincs semmi!
          </h1>
          <p className="text-gray-500 leading-relaxed mb-8 font-medium">
            Úgy tűnik, ez a termék köddé vált. Lehet, hogy már törölték a készletből, vagy rossz linket használtál.
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => navigate("/")}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100"
            >
              Vissza a főoldalra
            </button>
            <button 
              onClick={() => navigate("/scanner")}
              className="w-full bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all"
            >
              Másik beolvasása
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. NORMÁL ADATLAP NÉZET
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100">
        
        {/* Admin figyelmeztetés ha törölt a termék */}
        {(product as any).isDeleted && (
          <div className="bg-amber-500 text-white px-8 py-2 text-center text-xs font-black uppercase tracking-widest">
            ⚠️ Figyelem: Ez a termék törölt állapotban van!
          </div>
        )}

        <div className="bg-blue-600 p-8 text-white relative">
          <button 
            onClick={() => navigate(-1)} 
            className="mb-4 opacity-80 hover:opacity-100 flex items-center gap-2 transition-all"
          >
            ← Vissza
          </button>
          <h1 className="text-4xl font-black tracking-tight">{product.nev}</h1>
          <p className="opacity-80 font-medium">Gyártó: {product.gyarto}</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
              <span className="text-gray-400 text-sm font-bold uppercase block mb-1">Pozíció</span>
              <button 
                onClick={() => navigate(`/grid?parcel=${product.parcella}&productId=${product.id}`)}
                className="text-2xl font-black text-blue-600 hover:text-blue-800 transition-colors"
              >
                {product.parcella} →
              </button>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
              <span className="text-gray-400 text-sm font-bold uppercase block mb-1">Készlet</span>
              <span className="text-2xl font-black text-gray-800">{product.mennyiseg} db</span>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
              <span className="text-gray-400 text-sm font-bold uppercase block mb-1">Ár</span>
              <span className="text-2xl font-black text-gray-800">{product.ar.toLocaleString()} Ft</span>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
              <span className="text-gray-400 text-sm font-bold uppercase block mb-1">Lejárat</span>
              <span className="text-2xl font-black text-gray-800">{product.lejarat.toLocaleDateString()}</span>
            </div>
          </div>

          {user && !(product as any).isDeleted && (
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button 
                onClick={() => navigate(`/modify/${product.id}`)}
                className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all active:scale-95 shadow-lg shadow-gray-200"
              >
                Szerkesztés
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 bg-red-50 text-red-600 py-4 rounded-2xl font-bold hover:bg-red-100 transition-all border border-red-100"
              >
                Törlés
              </button>
            </div>
          )}

          {user?.admin && (product as any).isDeleted && (
             <button 
                onClick={() => navigate(`/modify/${product.id}`)}
                className="w-full bg-amber-600 text-white py-4 rounded-2xl font-bold hover:bg-amber-700 transition-all shadow-lg shadow-amber-100"
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