// raktar-frontend/src/components/Inventory/ShelfMap.tsx
import React, { useEffect, useState } from "react";
import { getWarehouseMap } from "../../services/api";
import type { WarehouseMapData } from "../../types/Batch";
import { useTranslation } from "react-i18next";

interface ShelfMapProps {
  onSelectShelf?: (parcella: string) => void;
  selectedShelves?: string[]; 
  highlightCategory?: string;
  validShelves?: string[]; 
  onMapDataLoaded?: (data: WarehouseMapData) => void; 
}

const ShelfMap: React.FC<ShelfMapProps> = ({ 
  onSelectShelf, 
  selectedShelves = [],
  highlightCategory,
  validShelves,
  onMapDataLoaded
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
      .then((data) => {
        setMapData(data);
        if (onMapDataLoaded) {
          onMapDataLoaded(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [onMapDataLoaded]);

  const getShelfStatus = (parcella: string) => {
    const shelf = mapData?.shelves[parcella];
    if (!shelf) return { percent: 0, color: "bg-slate-100 dark:bg-slate-800" };

    const percent = (shelf.weight / mapData!.maxWeight) * 100;
    
    if (percent > 100) return { percent, color: "bg-purple-500 animate-pulse", text: "text-white" };
    if (percent > 80) return { percent, color: "bg-rose-500", text: "text-white" };
    if (percent > 50) return { percent, color: "bg-amber-500", text: "text-white" };
    return { percent, color: "bg-emerald-500", text: "text-white" };
  };

  if (loading) return (
    <div className="h-64 flex items-center justify-center animate-pulse text-slate-400 font-black uppercase text-xs tracking-widest">
      {t("common.loading")}...
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h3 className="text-xl font-black uppercase italic tracking-tighter dark:text-white">
          {t("inventory.shelfMap.title")}
        </h3>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl shadow-inner border border-slate-200/50 dark:border-slate-700/50">
          {sectors.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setActiveSector(s)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${
                activeSector === s 
                ? "bg-white dark:bg-slate-700 shadow-md text-blue-600 scale-105" 
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {rows.map(row => (
          <React.Fragment key={row}>
            {cols.map(col => {
              const parcella = `${activeSector}${row}-${col}`;
              const status = getShelfStatus(parcella);
              const isSelected = selectedShelves.includes(parcella);
              const shelfData = mapData?.shelves[parcella];
              const isSameCategory = highlightCategory && shelfData?.category === highlightCategory;
              const isDisabled = validShelves && !validShelves.includes(parcella);

              return (
                <div
                  key={parcella}
                  onClick={() => !isDisabled && onSelectShelf?.(parcella)}
                  className={`
                    relative group h-24 rounded-[1.25rem] border-[3px] transition-all duration-200 overflow-hidden
                    ${isDisabled ? "opacity-10 grayscale cursor-not-allowed border-transparent" : "cursor-pointer"}
                    ${isSelected 
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 scale-105 z-10 shadow-lg" 
                      : isSameCategory 
                        ? "border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]" 
                        : "border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                    } 
                    ${!isSelected ? status.color : ""}
                  `}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                    <span className={`text-xs font-black uppercase tracking-widest transition-colors duration-300 ${isSelected ? "text-blue-700 dark:text-blue-400" : (status.text || "text-slate-400")}`}>
                      {parcella}
                    </span>
                    <span className={`text-[9px] font-bold mt-1 transition-colors duration-300 ${isSelected ? "text-blue-600 dark:text-blue-300" : (status.text || "text-slate-500")}`}>
                      {Math.round(status.percent)}%
                    </span>
                  </div>
                  
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-md animate-in zoom-in duration-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}

                  {!isDisabled && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-40 p-3 bg-slate-900 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 shadow-2xl border border-slate-700 scale-90 group-hover:scale-100">
                      <p className="font-black border-b border-slate-700 pb-1.5 mb-1.5 flex justify-between uppercase tracking-tighter">
                        <span>{parcella}</span>
                        {isSelected && <span className="text-blue-400">{t("common.selected")}</span>}
                      </p>
                      <div className="space-y-1">
                        <p className="flex justify-between">
                          <span className="text-slate-400">{t("inventory.shelfMap.weight")}:</span>
                          <span className="font-bold">{Math.round(shelfData?.weight || 0)} kg</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400">{t("inventory.shelfMap.category")}:</span>
                          <span className="font-bold truncate ml-2">{shelfData?.category ? t(`product.categories.${shelfData.category}`) : "---"}</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-5 justify-center text-[10px] font-black uppercase text-slate-400 tracking-widest">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"></span> {t("inventory.shelfMap.empty")}
        </div>
        <div className="flex items-center gap-2 text-blue-600">
          <span className="w-3.5 h-3.5 rounded-md border-[3px] border-blue-600 bg-blue-50 dark:bg-blue-900/20"></span> {t("common.selected")}
        </div>
      </div>
    </div>
  );
};

export default ShelfMap;