/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react"; // useRef eltávolítva
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
  // Az 'error' változót eltávolítottuk, mert nem volt használva a JSX-ben

  // Animációk és görgetés kezelése URL paraméter alapján
  useEffect(() => {
    const parcelParam = searchParams.get("parcel");
    if (parcelParam) {
      const base = parcelParam.split("-")[0];
      setSelectedParcella(base);

      // Finom görgetés a polcokhoz
      setTimeout(() => {
        const element = document.getElementById("shelves-container");
        element?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 500);
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
      return "bg-red-100 text-red-700 border-red-200 ring-red-500";
    if ((lejaratDate && lejaratDate <= oneWeekLater) || product.mennyiseg < 100)
      return "bg-amber-100 text-amber-700 border-amber-200 ring-amber-500";
    return "bg-emerald-100 text-emerald-700 border-emerald-200 ring-emerald-500";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
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
          background-color: #eff6ff !important;
          border-color: #3b82f6 !important;
          border-width: 2px !important;
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
      `}</style>

      <div className="max-w-6xl mx-auto">
        <header className="mb-8 border-b pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Raktár áttekintés</h1>
            <p className="text-gray-500 italic">Kattints a parcellára a részletekért</p>
          </div>
          {loading && <span className="animate-pulse text-blue-600 font-bold">Adatok frissítése...</span>}
        </header>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-200 mb-8">
          <div className="flex flex-col gap-6">
            {rows.map((row) => (
              <div key={row} className="flex gap-6 items-center">
                <span className="w-10 font-black text-gray-300 text-3xl">{row}</span>
                <div className="flex flex-wrap gap-4">
                  {cols.map((col) => {
                    const baseParcella = `${row}${col}`;
                    const isActive = selectedParcella === baseParcella;
                    return (
                      <button
                        key={baseParcella}
                        onClick={() => setSelectedParcella(baseParcella)}
                        className={`w-16 h-16 rounded-2xl font-black transition-all duration-300 shadow-md flex items-center justify-center border-2 text-xl
                          ${isActive 
                            ? "bg-blue-600 border-blue-600 text-white scale-110 shadow-blue-300 rotate-3" 
                            : "bg-white border-gray-100 text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:-translate-y-1"}`}
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

        <div id="shelves-container" className="scroll-mt-10">
          {selectedParcella ? (
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-10 w-3 bg-blue-600 rounded-full shadow-lg shadow-blue-200"></div>
                <h3 className="text-3xl font-black text-gray-800 tracking-tight">
                  {selectedParcella} Parcella egységei
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {Array.from({ length: polcCount }, (_, i) => i + 1).map((polcIndex) => {
                  const polcName = `${selectedParcella}-${polcIndex}`;
                  const products = productsByPolc[polcName];
                  const isHighlightedShelf = searchParams.get("parcel") === polcName;

                  return (
                    <div
                      key={polcName}
                      className={`bg-white rounded-[2rem] border border-gray-200 shadow-lg overflow-hidden flex flex-col transition-all duration-500 
                        ${isHighlightedShelf ? 'shake-shelf' : ''}`}
                    >
                      <div className={`p-4 transition-colors duration-500 ${isHighlightedShelf ? 'bg-blue-600' : 'bg-gray-800'}`}>
                        <h4 className="text-white font-black text-center uppercase tracking-widest italic">
                          {polcIndex}. POLC
                        </h4>
                      </div>
                      <div className="p-5 flex-grow bg-slate-50/50">
                        <ul className="space-y-4">
                          {products && products.length > 0 ? (
                            products.map((p) => {
                              const isTargetProduct = searchParams.get("productId") === p.id.toString();
                              return (
                                <li
                                  key={p.id}
                                  onClick={() => navigate(`/product/${p.id}`)}
                                  className={`p-4 rounded-2xl border-2 text-sm font-bold shadow-sm cursor-pointer transition-all active:scale-95
                                    ${getStatusClass(p)} 
                                    ${isTargetProduct ? 'shake-product' : 'hover:border-blue-300 hover:bg-white'}`}
                                >
                                  <div className="flex flex-col gap-1">
                                    <span className="truncate pr-2 text-base">{p.nev}</span>
                                    <div className="flex justify-between items-center mt-1">
                                      <span className="text-[10px] uppercase opacity-60">Készlet:</span>
                                      <span className="font-black">{p.mennyiseg} db</span>
                                    </div>
                                  </div>
                                </li>
                              );
                            })
                          ) : (
                            <li className="text-gray-300 text-center py-8 text-sm font-medium italic">
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
            <div className="text-center py-24 bg-white rounded-[3rem] border-4 border-dashed border-gray-100">
              <span className="text-6xl mb-4 block">🗺️</span>
              <p className="text-gray-400 text-xl font-medium">Válassz parcellát a fenti térképen!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductGridView;