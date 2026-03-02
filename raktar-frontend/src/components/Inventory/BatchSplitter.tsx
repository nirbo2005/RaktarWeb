// raktar-frontend/src/components/Inventory/BatchSplitter.tsx
import React, { useState, useEffect } from "react";
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
  onManualSelectRequested: () => void;
  externalSelectedShelf?: string;
  mapData?: any; // A térképtől kapott adatok az előkalkulációhoz
}

const MySwal = Swal.mixin({
  customClass: {
    popup: "rounded-[2.5rem] bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl font-sans",
    confirmButton: "bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 mx-2",
  },
  buttonsStyling: false,
});

const BatchSplitter: React.FC<BatchSplitterProps> = ({
  productId,
  totalQuantity,
  productWeight = 1, // Biztosítjuk, hogy sose osszunk 0-val
  onSplitsChange,
  onManualSelectRequested,
  externalSelectedShelf,
  mapData,
}) => {
  const { t } = useTranslation();
  const [splits, setSplits] = useState<SplitRow[]>([]);
  const [mode, setMode] = useState<"IDLE" | "AUTO" | "MANUAL">("IDLE");
  const [loading, setLoading] = useState(false);

  const allocatedQuantity = splits.reduce((sum, s) => sum + s.mennyiseg, 0);
  const remainingQuantity = totalQuantity - allocatedQuantity;

  useEffect(() => {
    if (externalSelectedShelf && mode === "MANUAL") {
      // 1. Kapacitás kiszámítása a mapData alapján
      let maxAllowedQty = remainingQuantity;
      
      if (mapData && mapData.shelves) {
        const shelfData = mapData.shelves[externalSelectedShelf];
        const currentWeight = shelfData?.weight || 0;
        const maxWeight = mapData.maxWeight || 2000;
        const availableKg = maxWeight - currentWeight;
        const canFitQty = Math.floor(availableKg / productWeight);

        // 2. Ha tele van a polc (Vak vagy validáció)
        if (canFitQty <= 0) {
          MySwal.fire({
            icon: "warning",
            title: "Hoppá, vak vagy? 😅",
            text: `A(z) ${externalSelectedShelf} polc már teljesen tele van. Válassz másikat!`,
          });
          return; // Kilépünk, nem adjuk hozzá a polcot
        }

        // 3. Mennyiségi korlátozás: Ne tegyünk többet, mint amennyi elfér, vagy amennyire szükség van
        maxAllowedQty = Math.min(remainingQuantity, canFitQty);
      }

      setSplits((prev) => {
        // Ha az utolsó sor még üres (nincs benne polcnév), frissítjük azt
        const last = prev[prev.length - 1];
        if (last && !last.parcella) {
          return prev.map((s, idx) =>
            idx === prev.length - 1 ? { ...s, parcella: externalSelectedShelf, mennyiseg: maxAllowedQty } : s
          );
        }
        
        // Egyébként megnézzük, hogy ez a polc szerepel-e már a listában
        const isAlreadyAdded = prev.some(s => s.parcella === externalSelectedShelf);
        if (isAlreadyAdded) {
          return prev; // Ha már hozzáadtuk, nem adjuk hozzá duplán
        }

        // Új sor hozzáadása az előkalkulált mennyiséggel
        return [
          ...prev,
          { id: Math.random().toString(), parcella: externalSelectedShelf, mennyiseg: maxAllowedQty },
        ];
      });
    }
  }, [externalSelectedShelf, mode, mapData, productWeight, remainingQuantity]);

  useEffect(() => {
    if (mode !== "IDLE" && remainingQuantity === 0 && splits.length > 0) {
      onSplitsChange(splits.map((s) => ({ parcella: s.parcella, mennyiseg: s.mennyiseg })));
    } else {
      onSplitsChange(null);
    }
  }, [splits, mode, remainingQuantity, onSplitsChange]);

  const handleAutoSuggest = async () => {
    setLoading(true);
    try {
      const suggestions = await suggestPlacement(productId, totalQuantity, productWeight);
      if (!suggestions || suggestions.length === 0) throw new Error();

      setSplits(
        suggestions.map((s: any) => ({
          id: Math.random().toString(),
          parcella: s.parcella,
          mennyiseg: s.mennyiseg,
        }))
      );
      setMode("AUTO");
    } catch (err) {
      handleManualStart();
    } finally {
      setLoading(false);
    }
  };

  const handleManualStart = () => {
    // Alapból egy üres sort adunk hozzá, majd várjuk a térképkattintást
    setSplits([{ id: Math.random().toString(), parcella: "", mennyiseg: 0 }]);
    setMode("MANUAL");
    onManualSelectRequested();
  };

  const updateSplit = (id: string, field: keyof SplitRow, value: any) => {
    setSplits(splits.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const removeSplit = (id: string) => {
    if (splits.length <= 1) return;
    setSplits(splits.filter((s) => s.id !== id));
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
          }}
          className="text-[9px] font-black text-rose-500 hover:text-rose-700 uppercase underline"
        >
          {t("common.reset")}
        </button>
      </div>

      <div className="space-y-3">
        {splits.map((split) => (
          <div
            key={split.id}
            className="flex gap-3 items-end bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800"
          >
            <div className="flex-1">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-2">
                {t("inventory.splitter.shelf")}
              </label>
              <input
                type="text"
                value={split.parcella}
                readOnly={mode === "AUTO"}
                onChange={(e) => updateSplit(split.id, "parcella", e.target.value.toUpperCase())}
                className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl text-xs font-bold outline-none border border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:text-white"
              />
            </div>
            <div className="w-24">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-2">
                {t("inventory.splitter.qty")}
              </label>
              <input
                type="number"
                value={split.mennyiseg}
                onChange={(e) => updateSplit(split.id, "mennyiseg", parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl text-xs font-bold outline-none border border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:text-white"
              />
            </div>
            {mode === "MANUAL" && splits.length > 1 && (
              <button
                type="button"
                onClick={() => removeSplit(split.id)}
                className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
              >
                🗑️
              </button>
            )}
          </div>
        ))}
      </div>

      {mode === "MANUAL" && remainingQuantity > 0 && (
        <button
          type="button"
          onClick={() =>
            setSplits([
              ...splits,
              { id: Math.random().toString(), parcella: "", mennyiseg: remainingQuantity },
            ])
          }
          className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-slate-400 hover:text-blue-500 hover:border-blue-500 transition-all text-[10px] font-black uppercase tracking-widest"
        >
          + {t("inventory.splitter.addSplit")}
        </button>
      )}

      <div className="pt-2">
        {remainingQuantity === 0 ? (
          <p className="text-[10px] font-black text-emerald-500 text-center uppercase tracking-widest">
            ✨ {t("inventory.splitter.allAllocated")}
          </p>
        ) : (
          <p
            className={`text-[10px] font-black text-center uppercase tracking-widest ${
              remainingQuantity < 0 ? "text-rose-500" : "text-amber-500"
            }`}
          >
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