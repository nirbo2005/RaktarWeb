// raktar-frontend/src/components/Inventory/BatchSplitter.tsx
import React, { useState, useEffect } from "react";
import { suggestPlacement } from "../../services/api";
import { useTranslation } from "react-i18next";

interface SplitRow {
  id: string;
  parcella: string;
  mennyiseg: number;
}

interface BatchSplitterProps {
  productId: number;
  totalQuantity: number;
  onSplitsChange: (splits: { parcella: string; mennyiseg: number }[] | null) => void;
  onManualSelectRequested: () => void;
  externalSelectedShelf?: string;
}

const BatchSplitter: React.FC<BatchSplitterProps> = ({
  productId,
  totalQuantity,
  onSplitsChange,
  onManualSelectRequested,
  externalSelectedShelf
}) => {
  const { t } = useTranslation();
  const [splits, setSplits] = useState<SplitRow[]>([]);
  const [mode, setMode] = useState<"IDLE" | "AUTO" | "MANUAL">("IDLE");
  const [loading, setLoading] = useState(false);

  const allocatedQuantity = splits.reduce((sum, s) => sum + s.mennyiseg, 0);
  const remainingQuantity = totalQuantity - allocatedQuantity;

  // Ha a térképen rákattintanak egy polcra, azt az utolsó üres vagy új sorba tesszük
  useEffect(() => {
    if (externalSelectedShelf && mode === "MANUAL") {
      setSplits(prev => {
        const last = prev[prev.length - 1];
        if (last && !last.parcella) {
          return prev.map((s, idx) => idx === prev.length - 1 ? { ...s, parcella: externalSelectedShelf } : s);
        }
        return [...prev, { id: Math.random().toString(), parcella: externalSelectedShelf, mennyiseg: 0 }];
      });
    }
  }, [externalSelectedShelf, mode]);

  useEffect(() => {
    if (mode !== "IDLE" && remainingQuantity === 0 && splits.length > 0) {
      onSplitsChange(splits.map(s => ({ parcella: s.parcella, mennyiseg: s.mennyiseg })));
    } else {
      onSplitsChange(null);
    }
  }, [splits, mode, remainingQuantity, onSplitsChange]);

  const handleAutoSuggest = async () => {
    setLoading(true);
    try {
      const suggestions = await suggestPlacement(productId, totalQuantity);
      setSplits(suggestions.map((s: any) => ({
        id: Math.random().toString(),
        parcella: s.parcella,
        mennyiseg: s.mennyiseg
      })));
      setMode("AUTO");
    } catch (err) {
      setMode("MANUAL");
    } finally {
      setLoading(false);
    }
  };

  const handleManualStart = () => {
    setSplits([{ id: Math.random().toString(), parcella: "", mennyiseg: totalQuantity }]);
    setMode("MANUAL");
    onManualSelectRequested();
  };

  const updateSplit = (id: string, field: keyof SplitRow, value: any) => {
    setSplits(splits.map(s => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const removeSplit = (id: string) => {
    if (splits.length <= 1) return;
    setSplits(splits.filter(s => s.id !== id));
  };

  if (mode === "IDLE") {
    return (
      <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-[2rem] border border-blue-100 dark:border-blue-900/30 text-center space-y-4">
        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
          {t("inventory.splitter.chooseMethod")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleAutoSuggest}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-tighter hover:bg-blue-500 transition-all disabled:opacity-50"
          >
            {loading ? "..." : t("inventory.splitter.autoBtn")}
          </button>
          <button
            onClick={handleManualStart}
            className="flex-1 border-2 border-blue-600 text-blue-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-tighter hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
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
        <h4 className="text-sm font-black uppercase italic tracking-tight dark:text-white">
          {mode === "AUTO" ? t("inventory.splitter.autoTitle") : t("inventory.splitter.manualTitle")}
        </h4>
        <button 
          onClick={() => setMode("IDLE")}
          className="text-[9px] font-black text-slate-400 hover:text-rose-500 uppercase underline"
        >
          {t("common.reset")}
        </button>
      </div>

      <div className="space-y-3">
        {splits.map((split) => (
          <div key={split.id} className="flex gap-3 items-end bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex-1">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-2">{t("inventory.splitter.shelf")}</label>
              <input
                type="text"
                value={split.parcella}
                readOnly={mode === "AUTO"}
                onChange={(e) => updateSplit(split.id, "parcella", e.target.value.toUpperCase())}
                className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl text-xs font-bold outline-none border border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:text-white"
              />
            </div>
            <div className="w-24">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-2">{t("inventory.splitter.qty")}</label>
              <input
                type="number"
                value={split.mennyiseg}
                onChange={(e) => updateSplit(split.id, "mennyiseg", parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl text-xs font-bold outline-none border border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:text-white"
              />
            </div>
            {mode === "MANUAL" && splits.length > 1 && (
              <button onClick={() => removeSplit(split.id)} className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">🗑️</button>
            )}
          </div>
        ))}
      </div>

      {mode === "MANUAL" && remainingQuantity > 0 && (
        <button
          onClick={() => setSplits([...splits, { id: Math.random().toString(), parcella: "", mennyiseg: remainingQuantity }])}
          className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-slate-400 hover:text-blue-500 hover:border-blue-500 transition-all text-[10px] font-black uppercase tracking-widest"
        >
          + {t("inventory.splitter.addSplit")}
        </button>
      )}

      {remainingQuantity !== 0 && (
        <p className={`text-[10px] font-bold text-center ${remainingQuantity < 0 ? "text-rose-500" : "text-amber-500"}`}>
          {remainingQuantity < 0 
            ? t("inventory.splitter.overAllocated", { amount: Math.abs(remainingQuantity) })
            : t("inventory.splitter.remainingQty", { count: remainingQuantity })}
        </p>
      )}
    </div>
  );
};

export default BatchSplitter;