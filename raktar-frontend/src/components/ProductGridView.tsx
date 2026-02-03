/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { getProducts } from "../services/api";
import type { Product } from "../types/Product";

const rows = ["A", "B"];
const cols = [1, 2, 3, 4, 5];
const polcCount = 4;

interface ProductsByPolc {
  [polc: string]: Product[];
}

const ProductGridView: React.FC = () => {
  const [selectedParcella, setSelectedParcella] = useState<string | null>(null);
  const [productsByPolc, setProductsByPolc] = useState<ProductsByPolc>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const products = await getProducts();
      const byPolc: ProductsByPolc = {};
      products.forEach((p) => {
        if (!byPolc[p.parcella]) byPolc[p.parcella] = [];
        byPolc[p.parcella].push(p);
      });
      setProductsByPolc(byPolc);
    } catch (err: any) {
      setError("Hiba a termékek betöltésekor:" + err);
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
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 border-b pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Raktár áttekintés
            </h1>
            <p className="text-gray-500">
              Válassz parcellát a polcok megtekintéséhez
            </p>
          </div>
          {loading && (
            <span className="animate-pulse text-blue-600 font-medium">
              Frissítés...
            </span>
          )}
        </header>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Parcella térkép
          </h2>
          <div className="flex flex-col gap-4">
            {rows.map((row) => (
              <div key={row} className="flex gap-4 items-center">
                <span className="w-8 font-bold text-gray-400 text-xl">
                  {row}
                </span>
                <div className="flex flex-wrap gap-3">
                  {cols.map((col) => {
                    const baseParcella = `${row}${col}`;
                    const isActive = selectedParcella === baseParcella;
                    return (
                      <button
                        key={baseParcella}
                        onClick={() => setSelectedParcella(baseParcella)}
                        className={`w-14 h-14 rounded-xl font-bold transition-all duration-200 shadow-sm flex items-center justify-center border-2 
                          ${
                            isActive
                              ? "bg-blue-600 border-blue-600 text-white scale-110 shadow-blue-200"
                              : "bg-white border-gray-100 text-gray-600 hover:border-blue-300 hover:text-blue-500"
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

        <div className="mt-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 border border-red-100">
              {error}
            </div>
          )}

          {selectedParcella ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-2 bg-blue-600 rounded-full"></div>
                <h3 className="text-2xl font-bold text-gray-800">
                  {selectedParcella} Parcella polcai
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: polcCount }, (_, i) => i + 1).map(
                  (polcIndex) => {
                    const polcName = `${selectedParcella}-${polcIndex}`;
                    const products = productsByPolc[polcName];

                    return (
                      <div
                        key={polcName}
                        className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
                      >
                        <div className="bg-gray-800 p-3">
                          <h4 className="text-white font-semibold text-center">
                            {polcIndex}. Polc
                          </h4>
                        </div>
                        <div className="p-4 flex-grow">
                          <ul className="space-y-3">
                            {products && products.length > 0 ? (
                              products.map((p) => (
                                <li
                                  key={p.id}
                                  className={`p-3 rounded-lg border text-sm font-medium shadow-sm ring-1 ring-inset ${getStatusClass(p)}`}
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="truncate pr-2">
                                      {p.nev}
                                    </span>
                                    <span className="font-bold whitespace-nowrap">
                                      {p.mennyiseg} db
                                    </span>
                                  </div>
                                </li>
                              ))
                            ) : (
                              <li className="text-gray-400 text-center py-4 text-sm italic">
                                Üres polc
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-100 rounded-3xl border-2 border-dashed border-gray-300">
              <p className="text-gray-500 text-lg italic">
                Válassz egy parcellát a fenti térképen az adatok
                megjelenítéséhez!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductGridView;
