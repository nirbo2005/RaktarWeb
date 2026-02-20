//raktar-frontend/src/components/ProductGridView.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getProducts, updateProduct } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import type { Product } from "../../types/Product";
import Swal from 'sweetalert2';

const toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: 'rgb(15, 23, 42)',
  color: '#fff',
  customClass: {
    popup: 'rounded-2xl border border-slate-700 shadow-2xl'
  }
});

const rows = ["A", "B"];
const cols = [1, 2, 3, 4, 5];
const polcCount = 4;

interface ProductsByPolc {
  [polc: string]: Product[];
}

const ProductGridView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedParcella, setSelectedParcella] = useState<string | null>(null);
  const [productsByPolc, setProductsByPolc] = useState<ProductsByPolc>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [draggedProductId, setDraggedProductId] = useState<number | null>(null);

  const canMove = user && (user.rang === "KEZELO" || user.rang === "ADMIN");

  const loadProducts = async () => {
    setLoading(true);
    try {
      const products = await getProducts();
      const byPolc: ProductsByPolc = {};
      products.forEach((p) => {
        if (!byPolc[p.parcella]) byPolc[p.parcella] = [];
        byPolc[p.parcella].push(p);
      });
      setProductsByPolc(byPolc);
    } catch (err: any) {
      console.error("Hiba:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const parcelParam = searchParams.get("parcel");
    if (parcelParam) {
      const base = parcelParam.split("-")[0];
      setSelectedParcella(base);
    }
  }, [searchParams]);

  const handleDragStart = (e: React.DragEvent, productId: number) => {
    if (!canMove) {
      e.preventDefault();
      return;
    }
    setDraggedProductId(productId);
    e.dataTransfer.setData("productId", productId.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDropOnShelf = async (
    e: React.DragEvent,
    targetParcella: string,
  ) => {
    e.preventDefault();
    if (!canMove) return;

    const productIdStr = e.dataTransfer.getData("productId");
    if (!productIdStr || !user) return;

    const productId = parseInt(productIdStr, 10);
    
    const draggedProduct = Object.values(productsByPolc)
      .flat()
      .find(p => p.id === productId);

    setLoading(true);
    try {
      await updateProduct(
        productId,
        { parcella: targetParcella } as any,
        Number(user.id),
      );
      toast.fire({
        icon: 'success',
        title: `"${draggedProduct?.nev || 'Termék'}" áthelyezve a(z) ${targetParcella} parcellába! 📦`
      });

      await loadProducts();
    } catch (err) {
      console.error("Áthelyezési hiba:", err);
      Swal.fire({
        icon: 'error',
        title: 'Hiba!',
        text: 'Nem sikerült az áthelyezés.',
        background: 'rgb(15, 23, 42)',
        color: '#fff',
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setLoading(false);
      setDraggedProductId(null);
    }
  };

  const getStatusClass = (product: Product) => {
    const now = new Date();
    const oneWeekLater = new Date();
    oneWeekLater.setDate(now.getDate() + 7);
    const lejaratDate = product.lejarat ? new Date(product.lejarat) : null;

    if ((lejaratDate && lejaratDate <= now) || product.mennyiseg < 10)
      return "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50";
    if ((lejaratDate && lejaratDate <= oneWeekLater) || product.mennyiseg < 100)
      return "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50";
    return "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30";
  };

  const renderBadges = (product: Product) => {
    const now = new Date();
    const oneWeekLater = new Date();
    oneWeekLater.setDate(now.getDate() + 7);
    const lejaratDate = product.lejarat ? new Date(product.lejarat) : null;
    const badges = [];
    if (lejaratDate && lejaratDate <= now)
      badges.push(<span key="e1" className="bg-red-600 text-white text-[8px] px-1.5 py-0.5 rounded font-black uppercase">Lejárt</span>);
    else if (lejaratDate && lejaratDate <= oneWeekLater)
      badges.push(<span key="e2" className="bg-amber-500 text-white text-[8px] px-1.5 py-0.5 rounded font-black uppercase">Lejárat</span>);
    
    if (product.mennyiseg < 10)
      badges.push(<span key="q1" className="bg-red-600 text-white text-[8px] px-1.5 py-0.5 rounded font-black uppercase">Kritikus</span>);
    else if (product.mennyiseg < 100)
      badges.push(<span key="q2" className="bg-amber-500 text-white text-[8px] px-1.5 py-0.5 rounded font-black uppercase">Készlet</span>);

    return badges.length > 0 ? (
      <div className="absolute -top-2 -right-2 flex flex-col gap-1 items-end z-20">
        {badges}
      </div>
    ) : null;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 transition-colors duration-300">
      <style>{`
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-6px) rotate(-1deg); }
          50% { transform: translateX(6px) rotate(1deg); }
          75% { transform: translateX(-6px) rotate(-1deg); }
          100% { transform: translateX(0); }
        }
        .shake-shelf {
          animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both;
          animation-iteration-count: 2;
          border-color: #3b82f6 !important;
          border-width: 4px !important;
        }
        .shake-product {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
          animation-delay: 1.2s;
          animation-iteration-count: 2;
          border-color: #3b82f6 !important;
          transform: scale(1.05);
        }
        .drag-over-sector {
          background-color: #3b82f6 !important;
          color: white !important;
          border-color: #2563eb !important;
          transform: scale(1.1);
        }
        .drag-over-shelf {
          border-color: #3b82f6 !important;
          background-color: rgba(59, 130, 246, 0.1) !important;
        }
      `}</style>

      <div className="max-w-6xl mx-auto">
        <header className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-4 flex justify-between items-center text-left">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter transition-colors">
              Raktár áttekintés
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm italic">
              {canMove 
                ? "Húzz egy terméket egy szektorra a váltáshoz, vagy egy polcra az áthelyezéshez"
                : "Válassz ki egy szektort a termékek megtekintéséhez"}
            </p>
          </div>
          {loading && (
            <span className="animate-pulse text-blue-600 font-black text-xs uppercase">Szinkronizálás...</span>
          )}
        </header>

        <div className="bg-white dark:bg-slate-900 p-4 md:p-8 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 mb-10 transition-colors">
          <div className="flex flex-col gap-6">
            {rows.map((row) => (
              <div key={row} className="flex gap-4 md:gap-8 items-center text-left">
                <span className="hidden sm:block w-12 font-black text-slate-200 dark:text-slate-800 text-4xl">{row}</span>
                <div className="grid grid-cols-5 gap-3 md:gap-5 w-full sm:w-auto">
                  {cols.map((col) => {
                    const baseParcella = `${row}${col}`;
                    const isActive = selectedParcella === baseParcella;
                    return (
                      <button
                        key={baseParcella}
                        onClick={() => setSelectedParcella(baseParcella)}
                        onDragEnter={() => canMove && setSelectedParcella(baseParcella)}
                        onDragOver={(e) => {
                          if (!canMove) return;
                          e.preventDefault();
                          e.currentTarget.classList.add("drag-over-sector");
                        }}
                        onDragLeave={(e) => e.currentTarget.classList.remove("drag-over-sector")}
                        onDrop={(e) => e.currentTarget.classList.remove("drag-over-sector")}
                        className={`aspect-square w-full sm:w-20 h-auto sm:h-20 rounded-2xl font-black transition-all duration-300 flex items-center justify-center border-2 text-base md:text-2xl
                          ${isActive
                              ? "bg-blue-600 border-blue-500 text-white scale-110 shadow-lg shadow-blue-500/30"
                              : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-blue-400"
                          }`}
                      >
                        {baseParcella}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div id="shelves-container" className="scroll-mt-24 text-left">
          {selectedParcella ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4 mb-10">
                <div className="h-10 w-2 bg-blue-600 rounded-full shadow-lg shadow-blue-500/20"></div>
                <h3 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">
                  {selectedParcella} szektor
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {Array.from({ length: polcCount }, (_, i) => i + 1).map((polcIndex) => {
                  const polcName = `${selectedParcella}-${polcIndex}`;
                  const products = productsByPolc[polcName];
                  const isHighlightedShelf = searchParams.get("parcel") === polcName;

                  return (
                    <div
                      key={polcName}
                      id={`shelf-${polcName}`}
                      onDragOver={(e) => {
                        if (!canMove) return;
                        e.preventDefault();
                        e.currentTarget.classList.add("drag-over-shelf");
                      }}
                      onDragLeave={(e) => e.currentTarget.classList.remove("drag-over-shelf")}
                      onDrop={(e) => {
                        e.currentTarget.classList.remove("drag-over-shelf");
                        handleDropOnShelf(e, polcName);
                      }}
                      className={`bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col transition-all
                        ${isHighlightedShelf ? "shake-shelf" : ""}`}
                    >
                      <div className={`p-4 text-center border-b transition-colors ${isHighlightedShelf ? "bg-blue-600 border-blue-500" : "bg-slate-800 dark:bg-slate-950 border-slate-700"}`}>
                        <h4 className="text-white font-black uppercase tracking-widest italic text-xs">
                          {polcIndex}. Polcszint
                        </h4>
                      </div>
                      <div className="p-5 flex-grow min-h-[150px]">
                        <ul className="space-y-4 h-full">
                          {products && products.length > 0 ? (
                            products.map((p) => (
                              <li
                                key={p.id}
                                id={`product-card-${p.id}`}
                                draggable={canMove || false}
                                onDragStart={(e) => handleDragStart(e, p.id)}
                                onClick={() => navigate(`/product/${p.id}`)}
                                className={`relative p-4 rounded-2xl border-2 text-sm font-bold shadow-sm transition-all active:scale-95 text-left
                                  ${canMove ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}
                                  ${getStatusClass(p)} 
                                  ${searchParams.get("productId") === p.id.toString() ? "shake-product shadow-lg" : "hover:border-blue-400 dark:hover:border-blue-600"}
                                  ${draggedProductId === p.id ? "opacity-40" : "opacity-100"}`}
                              >
                                {renderBadges(p)}
                                <div className="flex flex-col gap-1">
                                  <span className="truncate pr-4 font-black uppercase tracking-tight italic">{p.nev}</span>
                                  <div className="flex justify-between items-center mt-2 border-t border-current border-opacity-10 pt-2">
                                    <span className="text-[10px] uppercase opacity-60 font-black">Mennyiség</span>
                                    <span className="font-black text-xs">{p.mennyiseg} db</span>
                                  </div>
                                </div>
                              </li>
                            ))
                          ) : (
                            <li className="text-slate-300 dark:text-slate-700 text-center py-10 text-xs font-black uppercase tracking-widest italic">Üres</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[3rem] border-4 border-dashed border-slate-100 dark:border-slate-800 transition-colors">
              <span className="text-7xl mb-6 block grayscale opacity-30">📦</span>
              <p className="text-slate-400 dark:text-slate-600 text-xl font-black uppercase tracking-tighter italic">Válassz ki egy szektort!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductGridView;