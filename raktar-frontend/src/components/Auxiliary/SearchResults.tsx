//raktar-frontend/src/components/Auxiliary/SearchResults.tsx
import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getProducts } from "../../services/api";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import type { Product } from "../../types/Product";
import { useTranslation } from "react-i18next";

function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const getTotalQuantity = (p: Product) =>
    p.batches?.reduce((sum, b) => sum + b.mennyiseg, 0) || 0;

  const getLocations = (p: Product) => {
    if (!p.batches || p.batches.length === 0)
      return t("auxiliary.search.noStock");
    return Array.from(new Set(p.batches.map((b) => b.parcella))).join(", ");
  };

  const getEarliestExpiry = (p: Product) => {
    if (!p.batches || p.batches.length === 0) return null;
    const dates = p.batches
      .filter((b) => b.lejarat)
      .map((b) => new Date(b.lejarat!));
    if (dates.length === 0) return null;
    return new Date(Math.min(...dates.map((d) => d.getTime())));
  };

  const performSearch = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getProducts();
      const filtered = all.filter((p) => {
        const searchIn =
          `${p.nev} ${p.gyarto} ${t(`product.categories.${p.kategoria}`)} ${getLocations(p)}`.toLowerCase();
        return searchIn.includes(query.toLowerCase());
      });
      setResults(filtered);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }, [query, t]);

  useAutoRefresh(performSearch);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [query]);

  const getStatusBadge = (product: Product) => {
    const now = new Date();
    const oneWeekLater = new Date();
    oneWeekLater.setDate(now.getDate() + 7);
    const earliestExpiry = getEarliestExpiry(product);
    const totalQty = getTotalQuantity(product);

    if (
      (earliestExpiry && earliestExpiry <= now) ||
      totalQty < product.minimumKeszlet
    )
      return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
    if (earliestExpiry && earliestExpiry <= oneWeekLater)
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 md:p-12 transition-colors duration-300 text-left">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-8 transition-colors">
          <div>
            <h1
              className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none"
              dangerouslySetInnerHTML={{ __html: t("auxiliary.search.title") }}
            ></h1>
            <p className="text-slate-500 dark:text-slate-400 font-semibold mt-3 text-sm md:text-base">
              {t("auxiliary.search.expression")}{" "}
              <span className="text-blue-500 underline decoration-2 underline-offset-4 font-bold italic">
                "{query}"
              </span>
            </p>
          </div>
          <div className="inline-block bg-white dark:bg-slate-900 px-6 py-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-slate-400 font-bold text-xs tracking-widest uppercase italic">
            {t("auxiliary.search.resultsCount", { count: results.length })}
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4 text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">
              {t("auxiliary.search.scanningStock")}
            </p>
          </div>
        ) : results.length > 0 ? (
          <div className="grid gap-6">
            {results.map((p) => {
              const totalQty = getTotalQuantity(p);
              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/product/${p.id}`)}
                  className="group bg-white dark:bg-slate-900 p-4 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer flex flex-col md:flex-row items-center gap-6"
                >
                  <div className="w-full md:w-32 h-24 md:h-32 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center text-4xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                    {totalQty < p.minimumKeszlet ? "⚠️" : "📦"}
                  </div>
                  <div className="flex-1 py-2">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusBadge(p)}`}
                      >
                        {totalQty < p.minimumKeszlet
                          ? t("auxiliary.search.lowStock")
                          : t("auxiliary.search.inStock")}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600 text-xs font-bold">
                        #{p.id}
                      </span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors tracking-tight mb-1 italic uppercase">
                      {p.nev}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wide">
                      {p.gyarto} •{" "}
                      <span className="text-blue-500 font-black">
                        {t(`product.categories.${p.kategoria}`)}
                      </span>
                    </p>
                  </div>
                  <div className="w-full md:w-auto flex md:flex-col items-center justify-around md:justify-center gap-4 bg-slate-50 dark:bg-slate-800/50 md:bg-transparent p-4 md:p-8 rounded-[2rem] md:rounded-none">
                    <div className="text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                        {t("auxiliary.search.location")}
                      </p>
                      <span className="bg-blue-600 text-white px-4 py-1.5 rounded-xl font-black text-sm shadow-lg block italic uppercase">
                        {getLocations(p)}
                      </span>
                    </div>
                    <div className="text-center border-l md:border-l-0 md:border-t border-slate-200 dark:border-slate-800 pl-4 md:pl-0 md:pt-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                        {t("auxiliary.search.stock")}
                      </p>
                      <span className="text-lg md:text-xl font-black text-slate-800 dark:text-white">
                        {totalQty} {t("common.pieces")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[3rem] border-4 border-dashed border-slate-100 dark:border-slate-800 px-6">
            <div className="text-6xl mb-6 animate-bounce">🏜️</div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 italic tracking-tighter uppercase">
              {t("auxiliary.search.noResultsTitle")}
            </h2>
            <p className="text-slate-400 font-bold mb-8 max-w-sm mx-auto uppercase text-[10px] tracking-widest italic">
              {t("auxiliary.search.noResultsText")}
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all uppercase text-xs tracking-widest italic"
            >
              {t("auxiliary.search.backToHub")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchResults;
