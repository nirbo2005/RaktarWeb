/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getProducts } from "../services/api";
import type { Product } from "../types/Product";

const rows = ["A", "B"];
const cols = [1, 2, 3, 4, 5];
const polcCount = 4;

interface ProductsByPolc {
  [polc: string]: Product[];
}

const ProductGridView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedParcella, setSelectedParcella] = useState<string | null>(null);
  const [productsByPolc, setProductsByPolc] = useState<ProductsByPolc>({});
  const [loading, setLoading] = useState<boolean>(false);

  // FŐ GÖRDÍTÉSI LOGIKA
  useEffect(() => {
    const parcelParam = searchParams.get("parcel");
    const productIdParam = searchParams.get("productId");

    if (parcelParam) {
      const base = parcelParam.split("-")[0];
      setSelectedParcella(base);

      // Késleltetés, hogy a React renderelje a polcokat
      setTimeout(() => {
        let elementToScroll: HTMLElement | null = null;

        if (productIdParam) {
          // Konkrét termék kártyájának keresése
          elementToScroll = document.getElementById(`product-card-${productIdParam}`);
        } else {
          // Ha nincs termék, csak a polcok konténere
          elementToScroll = document.getElementById("shelves-container");
        }

        if (elementToScroll) {
          elementToScroll.scrollIntoView({ 
            behavior: "smooth", 
            block: "center" // EZ VISZI A KÉPERNYŐ KÖZEPÉRE
          });
        }
      }, 600);
    }
  }, [searchParams]);

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
      console.error("Hiba a termékek betöltésekor:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const getStatusClass = (product: Product) => {
    const now = new Date();
    const oneWeekLater = new Date();
    oneWeekLater.setDate(now.getDate() + 7);
    const lejaratDate = product.lejarat ? new Date(product.lejarat) : null;
    
    if ((lejaratDate && lejaratDate <= now) || product.mennyiseg < 10)
      return "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50 ring-red-500";
    if ((lejaratDate && lejaratDate <= oneWeekLater) || product.mennyiseg < 100)
      return "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 ring-amber-500";
    return "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30 ring-emerald-500";
  };

  const renderBadges = (product: Product) => {
    const now = new Date();
    const oneWeekLater = new Date();
    oneWeekLater.setDate(now.getDate() + 7);
    const lejaratDate = product.lejarat ? new Date(product.lejarat) : null;
    const badges = [];
    if (lejaratDate && lejaratDate <= now) {
      badges.push(<span key="exp-red" className="bg-red-600 text-white text-[8px] px-1.5 py-0.5 rounded font-black uppercase">Lejárt</span>);
    } else if (lejaratDate && lejaratDate <= oneWeekLater) {
      badges.push(<span key="exp-amber" className="bg-amber-500 text-white text-[8px] px-1.5 py-0.5 rounded font-black uppercase">Lejárat</span>);
    }
    if (product.mennyiseg < 10) {
      badges.push(<span key="qty-red" className="bg-red-600 text-white text-[8px] px-1.5 py-0.5 rounded font-black uppercase">Kritikus</span>);
    } else if (product.mennyiseg < 100) {
      badges.push(<span key="qty-amber" className="bg-amber-500 text-white text-[8px] px-1.5 py-0.5 rounded font-black uppercase">Készlet</span>);
    }
    return badges.length > 0 ? (
      <div className="absolute -top-2 -right-2 flex flex-col gap-1 items-end z-20">
        {badges}
      </div>
    ) : null;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-4 md:p-6 transition-colors duration-500">
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
          box-shadow: 0 0 25px rgba(59, 130, 246, 0.6) !important;
          z-index: 10;
        }
        .shake-product {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
          animation-delay: 1.2s;
          animation-iteration-count: 2;
          border-color: #3b82f6 !important;
          border-width: 2px !important;
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
      `}</style>

      <div className="max-w-6xl mx-auto">
        <header className="mb-8 border-b dark:border-slate-800 pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight italic uppercase">Raktár áttekintés</h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm md:text-base italic">Kattints a parcellára a részletekért</p>
          </div>
          {loading && <span className="animate-pulse text-blue-600 font-bold text-xs md:text-sm uppercase">Frissítés...</span>}
        </header>

        <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-[2rem] shadow-sm border border-gray-200 dark:border-slate-800 mb-8 overflow-hidden">
          <div className="flex flex-col gap-4 md:gap-6">
            {rows.map((row) => (
              <div key={row} className="flex gap-2 md:gap-6 items-center">
                <span className="hidden sm:block w-10 font-black text-gray-200 dark:text-slate-800 text-3xl">{row}</span>
                <div className="grid grid-cols-5 gap-2 md:gap-4 w-full sm:w-auto">
                  {cols.map((col) => {
                    const baseParcella = `${row}${col}`;
                    const isActive = selectedParcella === baseParcella;
                    return (
                      <button
                        key={baseParcella}
                        onClick={() => setSelectedParcella(baseParcella)}
                        className={`aspect-square w-full sm:w-16 h-auto sm:h-16 rounded-xl md:rounded-2xl font-black transition-all duration-300 shadow-sm flex items-center justify-center border-2 text-sm md:text-xl
                          ${isActive 
                            ? "bg-blue-600 border-blue-600 text-white scale-105 shadow-blue-200 dark:shadow-blue-900/20" 
                            : "bg-white dark:bg-slate-800 border-gray-50 dark:border-slate-700 text-gray-400 dark:text-slate-500 hover:border-blue-400 hover:text-blue-600"}`}
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

        <div id="shelves-container" className="scroll-mt-20">
          {selectedParcella ? (
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-8 w-2 bg-blue-600 rounded-full"></div>
                <h3 className="text-xl md:text-3xl font-black text-gray-800 dark:text-white tracking-tight italic uppercase">
                  {selectedParcella} Parcella
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
                      className={`bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-200 dark:border-slate-800 shadow-lg overflow-hidden flex flex-col transition-all duration-500 
                        ${isHighlightedShelf ? 'shake-shelf' : ''}`}
                    >
                      <div className={`p-4 transition-colors duration-500 ${isHighlightedShelf ? 'bg-blue-600 shadow-inner' : 'bg-gray-800 dark:bg-slate-800'}`}>
                        <h4 className="text-white font-black text-center uppercase tracking-widest italic text-xs md:text-sm">
                          {polcIndex}. POLC
                        </h4>
                      </div>
                      <div className="p-4 md:p-5 flex-grow bg-slate-50/30 dark:bg-slate-900/50">
                        <ul className="space-y-4">
                          {products && products.length > 0 ? (
                            products.map((p) => {
                              const isTargetProduct = searchParams.get("productId") === p.id.toString();
                              return (
                                <li
                                  key={p.id}
                                  id={`product-card-${p.id}`} // EGYEDI ID A GÖRDÍTÉSHEZ
                                  onClick={() => navigate(`/product/${p.id}`)}
                                  className={`relative p-4 rounded-2xl border-2 text-sm font-bold shadow-sm cursor-pointer transition-all active:scale-95
                                    ${getStatusClass(p)} 
                                    ${isTargetProduct ? 'shake-product' : 'hover:border-blue-300 dark:hover:border-blue-700 hover:bg-white dark:hover:bg-slate-800'}`}
                                >
                                  {renderBadges(p)}
                                  <div className="flex flex-col gap-1">
                                    <span className="truncate pr-4 text-sm md:text-base leading-tight font-black uppercase tracking-tighter italic">{p.nev}</span>
                                    <div className="flex justify-between items-center mt-1">
                                      <span className="text-[9px] uppercase opacity-60 font-black tracking-widest">Készlet</span>
                                      <span className="font-black text-xs md:text-sm">{p.mennyiseg} db</span>
                                    </div>
                                  </div>
                                </li>
                              );
                            })
                          ) : (
                            <li className="text-gray-300 dark:text-slate-700 text-center py-6 md:py-8 text-xs font-medium italic">
                              Üres polc
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[3rem] border-4 border-dashed border-gray-100 dark:border-slate-800 px-6">
              <span className="text-6xl mb-4 block animate-bounce text-blue-500">🗺️</span>
              <p className="text-gray-400 dark:text-slate-500 text-lg md:text-xl font-black uppercase tracking-tighter italic">Válassz parcellát a térképen!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductGridView;