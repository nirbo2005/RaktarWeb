// raktar-frontend/src/components/Inventory/ShelfMap.tsx
import React, { useEffect, useState } from "react";
import { getWarehouseMap } from "../../services/api";
import type { WarehouseMapData } from "../../types/Batch";
import { useTranslation } from "react-i18next";

interface ShelfMapProps {
  onSelectShelf?: (parcella: string) => void;
  selectedShelf?: string;
  highlightCategory?: string;
  validShelves?: string[]; // ÚJ: Csak ezek a polcok választhatóak (Strict Mode)
}

const ShelfMap: React.FC<ShelfMapProps> = ({ 
  onSelectShelf, 
  selectedShelf,
  highlightCategory,
  validShelves
}) => {
  const { t } = useTranslation();
  const [mapData, setMapData] = useState<WarehouseMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSector, setActiveSector] = useState<string>("A");

  const sectors = ["A", "B", "C", "D"];
  const rows = [5, 4, 3, 2, 1]; 
  const cols = [1, 2, 3, 4];    

  useEffect(() => {
    getWarehouseMap()
      .then(setMapData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getShelfStatus = (parcella: string) => {
    const shelf = mapData?.shelves[parcella];
    if (!shelf) return { percent: 0, color: "bg-slate-100 dark:bg-slate-800" };

    const percent = (shelf.weight / mapData!.maxWeight) * 100;
    
    if (percent > 100) return { percent, color: "bg-purple-500 animate-pulse", text: "text-white" };
    if (percent > 80) return { percent, color: "bg-rose-500", text: "text-white" };
    if (percent > 50) return { percent, color: "bg-amber-500", text: "text-white" };
    return { percent, color: "bg-emerald-500", text: "text-white" };
  };

  if (loading) return <div className="h-64 flex items-center justify-center animate-pulse text-slate-400">Loading Map...</div>;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h3 className="text-lg font-black uppercase italic tracking-tighter dark:text-white">
          {t("inventory.shelfMap.title")}
        </h3>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {sectors.map(s => (
            <button
              key={s}
              onClick={() => setActiveSector(s)}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                activeSector === s 
                ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600" 
                : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {s} {t("inventory.shelfMap.sector")}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {rows.map(row => (
          <React.Fragment key={row}>
            {cols.map(col => {
              const parcella = `${activeSector}${row}-${col}`;
              const status = getShelfStatus(parcella);
              const isSelected = selectedShelf === parcella;
              const shelfData = mapData?.shelves[parcella];
              const isSameCategory = highlightCategory && shelfData?.category === highlightCategory;
              
              // Strict Mode ellenőrzés
              const isDisabled = validShelves && !validShelves.includes(parcella);

              return (
                <div
                  key={parcella}
                  onClick={() => !isDisabled && onSelectShelf?.(parcella)}
                  className={`relative group h-20 rounded-xl border-2 transition-all overflow-hidden ${
                    isDisabled 
                      ? "opacity-20 grayscale cursor-not-allowed border-transparent" 
                      : "cursor-pointer"
                  } ${
                    isSelected 
                    ? "border-blue-500 ring-4 ring-blue-500/20 scale-105 z-10" 
                    : isSameCategory 
                      ? "border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]" 
                      : "border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                  } ${status.color}`}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
                    <span className={`text-[10px] font-black uppercase tracking-tighter ${status.text || "text-slate-400"}`}>
                      {parcella}
                    </span>
                    <span className={`text-[8px] font-bold ${status.text || "text-slate-500"}`}>
                      {Math.round(status.percent)}%
                    </span>
                  </div>
                  
                  {!isDisabled && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-slate-900 text-white text-[9px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20">
                      <p className="font-black border-b border-slate-700 pb-1 mb-1">{parcella}</p>
                      <p>{t("inventory.shelfMap.weight")}: {Math.round(shelfData?.weight || 0)} kg</p>
                      <p>{t("inventory.shelfMap.category")}: {shelfData?.category || "---"}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-4 justify-center text-[9px] font-black uppercase text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"></span> {t("inventory.shelfMap.empty")}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-500"></span> {t("inventory.shelfMap.low")}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-500"></span> {t("inventory.shelfMap.mid")}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-rose-500"></span> {t("inventory.shelfMap.high")}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border-2 border-emerald-400"></span> {t("inventory.shelfMap.recommended")}
        </div>
      </div>
    </div>
  );
};

export default ShelfMap;