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

  // Lekérjük az összes terméket és csoportosítjuk polc szerint
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
      console.error("Hiba a termékek betöltésekor:", err);
      setError("Hiba a termékek betöltésekor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Színezés mennyiség / lejárat szerint
  const getRowClass = (product: Product) => {
    const now = new Date();
    const oneWeekLater = new Date();
    oneWeekLater.setDate(now.getDate() + 7);

    const lejaratDate = product.lejarat ? new Date(product.lejarat) : null;

    if ((lejaratDate && lejaratDate <= now) || product.mennyiseg < 10) return "danger";
    if ((lejaratDate && lejaratDate <= oneWeekLater) || product.mennyiseg < 100) return "warning";
    return "";
  };

  return (
    <div className="product-grid-view">
      <h2>Raktár áttekintés</h2>

      {/* Parcella választó */}
      <div className="parcella-valaszto">
        {rows.map((row) => (
          <div key={row} className="parcella-row">
            {cols.map((col) => {
              const baseParcella = `${row}${col}`;
              return (
                <button
                  key={baseParcella}
                  className={`parcella-btn ${selectedParcella === baseParcella ? "active" : ""}`}
                  onClick={() => setSelectedParcella(baseParcella)}
                >
                  {baseParcella}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Polcok és termékek */}
      <div className="polc-termekek">
        {loading && <p>Betöltés...</p>}
        {error && <p className="error">{error}</p>}

        {selectedParcella && !loading && !error && (
          <div>
            <h3>{selectedParcella} polcai:</h3>
            <div className="polc-container">
              {Array.from({ length: polcCount }, (_, i) => i + 1).map((polcIndex) => {
                const polcName = `${selectedParcella}-${polcIndex}`;
                const products = productsByPolc[polcName];

                return (
                  <div key={polcName} className="polc">
                    <h4>{polcIndex}. polc</h4>
                    <ul>
                      {products && products.length > 0 ? (
                        products.map((p) => (
                          <li key={p.id} className={getRowClass(p)}>
                            {p.nev} ({p.mennyiseg} db)
                          </li>
                        ))
                      ) : (
                        <li>Nincs termék ezen a polcon.</li>
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductGridView;
