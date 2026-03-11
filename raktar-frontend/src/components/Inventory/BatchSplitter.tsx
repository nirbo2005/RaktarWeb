// raktar-frontend/src/components/Inventory/BatchSplitter.tsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { suggestPlacement } from "../../services/api";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";

interface SplitRow {
  id: string;
  parcella: string;
  mennyiseg: number;
}

interface BatchSplitterProps {
  productId: number;
  totalQuantity: number;
  productWeight?: number;
  onSplitsChange: (splits: { parcella: string; mennyiseg: number }[] | null) => void;
  onManualSelectRequested: (currentShelves: string[]) => void;
  externalSelectedShelf?: string; // Formátum: "PARCELLA_TIMESTAMP" a garantált frissítéshez
  mapData?: any; 
}

const MySwal = Swal.mixin({
  customClass: {
    popup: "rounded-[2.5rem] bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl font-sans",
    confirmButton: "bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 mx-2",
  },
  buttonsStyling: false,
});

const isValidShelf = (shelf: string) => /^[A-D][1-5]-[1-4]$/i.test(shelf);

const BatchSplitter: React.FC<BatchSplitterProps> = ({
  productId,
  totalQuantity,
  productWeight = 1, 
  onSplitsChange,
  onManualSelectRequested,
  externalSelectedShelf,
  mapData,
}) => {
  const { t } = useTranslation();
  const [splits, setSplits] = useState<SplitRow[]>([]);
  const [mode, setMode] = useState<"IDLE" | "AUTO" | "MANUAL">("IDLE");
  const [loading, setLoading] = useState(false);
  
  const [processedShelfToken, setProcessedShelfToken] = useState<string>("");
  const prevSentShelvesRef = useRef<string>("");

  const allocatedQuantity = splits.reduce((sum, s) => sum + s.mennyiseg, 0);
  const remainingQuantity = totalQuantity - allocatedQuantity;

  const currentSelectedShelves = useMemo(() => 
    splits.map(s => s.parcella).filter(p => p !== ""), 
    [splits]
  );

  const sortRows = (rows: SplitRow[]) => {
    return [...rows].sort((a, b) => {
      if (!a.parcella) return 1;
      if (!b.parcella) return -1;
      return a.parcella.localeCompare(b.parcella);
    });
  };

  useEffect(() => {
    if (mode === "MANUAL" && externalSelectedShelf && externalSelectedShelf !== processedShelfToken) {
      const shelfCode = externalSelectedShelf.split('_')[0];
      if (!shelfCode) return;

      setSplits((prev) => {
        const existingIdx = prev.findIndex(s => s.parcella === shelfCode);
        
        if (existingIdx !== -1) {
          const filtered = prev.filter(s => s.parcella !== shelfCode);
          return filtered.length === 0 
            ? [{ id: Math.random().toString(), parcella: "", mennyiseg: 0 }] 
            : sortRows(filtered);
        }

        if (remainingQuantity <= 0) {
          MySwal.fire({ icon: "info", title: t("inventory.splitter.allAllocated") });
          return prev;
        }

        let maxAllowedQty = remainingQuantity;
        if (mapData?.shelves) {
          const shelfData = mapData.shelves[shelfCode];
          const currentWeight = shelfData?.weight || 0;
          const maxWeight = mapData.maxWeight || 2000;
          const availableKg = maxWeight - currentWeight;
          const canFitQty = Math.floor(availableKg / productWeight);

          if (canFitQty <= 0) {
            MySwal.fire({
              icon: "warning",
              title: t("inventory.splitter.alerts.shelfFullTitle"),
              text: t("inventory.splitter.alerts.shelfFullText", { shelf: shelfCode }),
            });
            return prev; 
          }
          maxAllowedQty = Math.min(remainingQuantity, canFitQty);
        }

        const emptyRowIdx = prev.findIndex(s => !s.parcella);
        if (emptyRowIdx !== -1) {
          const updated = [...prev];
          updated[emptyRowIdx] = { 
            ...updated[emptyRowIdx], 
            parcella: shelfCode, 
            mennyiseg: maxAllowedQty 
          };
          return updated;
        }

        return [
          ...prev,
          { id: Math.random().toString(), parcella: shelfCode, mennyiseg: maxAllowedQty },
        ];
      });

      setProcessedShelfToken(externalSelectedShelf);
    }
  }, [externalSelectedShelf, mode, mapData, productWeight, remainingQuantity, t, processedShelfToken]);

  // Végtelen ciklus elleni védelem: csak akkor hívjuk a szülőt, ha változott a lista tartalma
  useEffect(() => {
    const currentSerialized = currentSelectedShelves.sort().join(",");
    if (currentSerialized !== prevSentShelvesRef.current) {
      prevSentShelvesRef.current = currentSerialized;
      onManualSelectRequested(currentSelectedShelves);
    }
  }, [currentSelectedShelves, onManualSelectRequested]);

  useEffect(() => {
    const activeSplits = splits.filter(s => s.mennyiseg > 0 && isValidShelf(s.parcella));

    if (mode !== "IDLE" && remainingQuantity === 0 && activeSplits.length > 0) {
      onSplitsChange(activeSplits.map((s) => ({ 
        parcella: s.parcella.toUpperCase(), 
        mennyiseg: s.mennyiseg 
      })));
    } else {
      onSplitsChange(null);
    }
  }, [splits, mode, remainingQuantity, onSplitsChange]);

  const handleAutoSuggest = async () => {
    setLoading(true);
    try {
      const suggestions = await suggestPlacement(productId, totalQuantity, productWeight);
      if (!suggestions || suggestions.length === 0) throw new Error();

      setSplits(sortRows(suggestions.map((s: any) => ({
        id: Math.random().toString(),
        parcella: s.parcella,
        mennyiseg: s.mennyiseg,
      }))));
      setMode("AUTO");
    } catch (err) {
      handleManualStart();
    } finally {
      setLoading(false);
    }
  };

  const handleManualStart = () => {
    setProcessedShelfToken("");
    prevSentShelvesRef.current = "";
    setSplits([{ id: Math.random().toString(), parcella: "", mennyiseg: 0 }]);
    setMode("MANUAL");
    onManualSelectRequested([]);
  };

  const updateSplitField = (id: string, field: keyof SplitRow, value: any) => {
    setSplits(prev => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleInputBlur = () => {
    setSplits(prev => sortRows(prev));
  };

  const removeSplit = (id: string) => {
    setSplits(prev => {
        if (prev.length <= 1) return [{ id: Math.random().toString(), parcella: "", mennyiseg: 0 }];
        return prev.filter((s) => s.id !== id);
    });
  };

  if (mode === "IDLE") {
    return (
      <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-[2rem] border border-blue-100 dark:border-blue-900/30 text-center space-y-4">
        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest italic">
          {t("inventory.splitter.chooseMethod")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleAutoSuggest}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 active:scale-95"
          >
            {loading ? "..." : t("inventory.splitter.autoBtn")}
          </button>
          <button
            type="button"
            onClick={handleManualStart}
            className="flex-1 border-2 border-blue-600 text-blue-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all active:scale-95"
          >
            {t("inventory.splitter.manualBtn")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-300">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-[10px] font-black uppercase italic tracking-widest text-slate-500">
          {mode === "AUTO" ? t("inventory.splitter.autoTitle") : t("inventory.splitter.manualTitle")}
        </h4>
        <button
          type="button"
          onClick={() => {
            setMode("IDLE");
            setSplits([]);
            setProcessedShelfToken("");
            prevSentShelvesRef.current = "";
            onManualSelectRequested([]);
          }}
          className="text-[9px] font-black text-rose-500 hover:text-rose-700 uppercase underline"
        >
          {t("common.reset")}
        </button>
      </div>

      <div className="space-y-3">
        {splits.map((split) => {
          const isInvalidShelf = split.parcella.length > 0 && !isValidShelf(split.parcella);

          return (
            <div
              key={split.id}
              className="flex gap-3 items-start bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800"
            >
              <div className="flex-1">
                <input
                  type="text"
                  value={split.parcella}
                  readOnly={mode === "AUTO"}
                  onBlur={handleInputBlur}
                  onChange={(e) => updateSplitField(split.id, "parcella", e.target.value.toUpperCase())}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold outline-none border transition-all ${
                    isInvalidShelf
                      ? "border-rose-500 bg-rose-50 text-rose-700 focus:border-rose-600 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-500/50"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:text-white"
                  }`}
                  placeholder={t("inventory.splitter.shelf")}
                />
                {isInvalidShelf && (
                  <span className="text-[8px] text-rose-500 font-black uppercase tracking-widest mt-1.5 ml-2 block">
                    ❌ {t("inventory.splitter.invalidFormat")}
                  </span>
                )}
              </div>
              <div className="w-24">
                <input
                  type="number"
                  value={split.mennyiseg || ""}
                  onBlur={handleInputBlur}
                  onChange={(e) => updateSplitField(split.id, "mennyiseg", parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl text-xs font-bold outline-none border border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:text-white"
                />
              </div>
              {mode === "MANUAL" && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => removeSplit(split.id)}
                    className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-2 text-center text-[10px] font-black uppercase tracking-widest">
        {remainingQuantity === 0 ? (
          <p className="text-emerald-500 animate-pulse">
            ✨ {t("inventory.splitter.allAllocated")}
          </p>
        ) : (
          <p className={remainingQuantity < 0 ? "text-rose-500" : "text-amber-500"}>
            {remainingQuantity < 0
              ? t("inventory.splitter.overAllocated", { amount: Math.abs(remainingQuantity) })
              : t("inventory.splitter.remainingQty", { count: remainingQuantity })}
          </p>
        )}
      </div>
    </div>
  );
};

export default BatchSplitter;