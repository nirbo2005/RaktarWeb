// raktar-frontend/src/components/Product/ProductGridView.tsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getProducts, updateBatch, createBatch, sortWarehouse } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useAutoRefresh } from "../../hooks/useAutoRefresh"; 
import type { Batch } from "../../types/Batch";
import Swal from 'sweetalert2';
import { useTranslation } from "react-i18next";

const MySwal = Swal.mixin({
  customClass: {
    popup: 'rounded-[2.5rem] bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl font-sans',
    confirmButton: 'bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 mx-2',
    cancelButton: 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 mx-2',
  },
  buttonsStyling: false,
  focusConfirm: false,
  allowOutsideClick: false
});

const toast = MySwal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: 'rgb(15, 23, 42)',
  color: '#fff',
  customClass: {
    popup: 'rounded-2xl border border-slate-700 shadow-2xl'
  }
});

const rows = ["A", "B", "C", "D"];
const cols = [1, 2, 3, 4, 5];
const polcCount = 4;
const MAX_SHELF_WEIGHT = 2000;

type BatchWithProductInfo = Batch & { 
  productNev: string; 
  productGyarto: string; 
  minimumKeszlet: number; 
  suly: number; 
  productId: number 
};

interface BatchesByPolc {
  [polc: string]: BatchWithProductInfo[];
}

export const ProductGridView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const targetProductId = searchParams.get("productId");
  const targetParcelName = searchParams.get("parcel");

  const [selectedParcella, setSelectedParcella] = useState<string | null>(null);
  const [batchesByPolc, setBatchesByPolc] = useState<BatchesByPolc>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [draggedBatchId, setDraggedBatchId] = useState<number | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<boolean>(false);

  const highlightedProductRef = useRef<HTMLLIElement | null>(null);
  const isAdmin = user?.rang === "ADMIN";
  const canMove = !!(user && (user.rang === "KEZELO" || isAdmin));
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const loadProductsAndBatches = useCallback(async () => {
    if (Object.keys(batchesByPolc).length === 0) setLoading(true);
    try {
      const products = await getProducts();
      const byPolc: BatchesByPolc = {};
      
      products.forEach((p) => {
        if (p.batches) {
          p.batches.forEach(b => {
            if (!byPolc[b.parcella]) byPolc[b.parcella] = [];
            byPolc[b.parcella].push({
              ...b,
              productId: p.id,
              productNev: p.nev,
              productGyarto: p.gyarto,
              minimumKeszlet: p.minimumKeszlet,
              suly: p.suly
            });
          });
        }
      });
      setBatchesByPolc(byPolc);
    } catch (err: any) {
      console.error("Hiba az adatok betöltésekor:", err);
    } finally {
      setLoading(false);
    }
  }, [batchesByPolc]);

  useAutoRefresh(loadProductsAndBatches);

  useEffect(() => {
    const parcelParam = searchParams.get("parcel");
    if (parcelParam) setSelectedParcella(parcelParam.split("-")[0]);
    
    if (parcelParam || targetProductId) {
      setActiveHighlight(true);
      const timer = window.setTimeout(() => setActiveHighlight(false), 3500);
      return () => window.clearTimeout(timer);
    }
  }, [searchParams, targetProductId]);

  useEffect(() => {
    if (activeHighlight && highlightedProductRef.current) {
      setTimeout(() => {
        highlightedProductRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 500);
    }
  }, [selectedParcella, batchesByPolc, activeHighlight]);

  const performMove = async (batchId: number, targetParcella: string) => {
    const draggedBatch = Object.values(batchesByPolc).flat().find(b => b.id === batchId);
    if (!draggedBatch || draggedBatch.parcella === targetParcella) {
      setDraggedBatchId(null);
      return;
    }

    const currentWeightOnTarget = (batchesByPolc[targetParcella] || []).reduce((s, b) => s + (b.mennyiseg * b.suly), 0);
    const availableWeight = MAX_SHELF_WEIGHT - currentWeightOnTarget;
    const maxFitting = Math.floor(availableWeight / draggedBatch.suly);
    const absoluteMax = Math.min(draggedBatch.mennyiseg, maxFitting);

    if (maxFitting <= 0) {
      MySwal.fire({ title: t('product.grid.alerts.weightStop'), text: t('product.grid.alerts.shelfFull', { shelf: targetParcella }), icon: 'error' });
      setDraggedBatchId(null);
      return;
    }

    const { value: moveQuantity, isConfirmed } = await MySwal.fire({
      title: t('product.grid.alerts.moveHowMuch'),
      html: `
        <div class="flex flex-col gap-6 p-2 text-left">
          ${draggedBatch.mennyiseg > maxFitting ? `
            <div class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 rounded-xl text-red-700 dark:text-red-400 text-[10px] font-black uppercase tracking-tighter">
              ${t('product.grid.alerts.weightWarning', { max: maxFitting })}
            </div>
          ` : ''}
          <div class="flex items-center gap-4">
            <input type="range" id="swal-range" class="flex-grow h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
              min="1" max="${absoluteMax}" value="${absoluteMax}">
            <input type="number" id="swal-input" class="w-24 p-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-black text-center" 
              min="1" max="${absoluteMax}" value="${absoluteMax}">
          </div>
        </div>
      `,
      didOpen: () => {
        const range = document.getElementById('swal-range') as HTMLInputElement;
        const input = document.getElementById('swal-input') as HTMLInputElement;
        const updateValues = (val: number) => {
          const v = Math.min(Math.max(1, val), absoluteMax);
          range.value = v.toString();
          input.value = v.toString();
        };
        range.addEventListener('input', () => updateValues(parseInt(range.value)));
        input.addEventListener('input', () => updateValues(parseInt(input.value)));
      },
      preConfirm: () => {
        const val = parseInt((document.getElementById('swal-input') as HTMLInputElement).value);
        if (isNaN(val) || val < 1 || val > absoluteMax) return false;
        return val;
      },
      showCancelButton: true,
      confirmButtonText: t('product.grid.alerts.moveBtn'),
      cancelButtonText: t('common.cancel')
    });

    if (isConfirmed && moveQuantity) {
      setLoading(true);
      try {
        if (moveQuantity === draggedBatch.mennyiseg) {
          await updateBatch(batchId, { parcella: targetParcella }, user!.id);
        } else {
          await updateBatch(batchId, { mennyiseg: draggedBatch.mennyiseg - moveQuantity }, user!.id);
          await createBatch({ productId: draggedBatch.productId, parcella: targetParcella, mennyiseg: moveQuantity, lejarat: draggedBatch.lejarat }, user!.id);
        }
        toast.fire({ icon: 'success', title: t('product.grid.alerts.movedSuccess') });
        loadProductsAndBatches();
      } catch (err: any) {
        MySwal.fire(t('common.error'), err.message, 'error');
      } finally {
        setLoading(false);
      }
    }
    setDraggedBatchId(null);
  };

  const handleDragStart = (e: React.DragEvent, batchId: number) => {
    if (!canMove || isMobile) return e.preventDefault();
    setDraggedBatchId(batchId);
    e.dataTransfer.setData("batchId", batchId.toString());
  };

  const handleSortClick = async () => {
    if (!isAdmin || !user) return;
    const res = await MySwal.fire({
      title: t('product.grid.alerts.sortTitle'),
      text: t('product.grid.alerts.sortText'),
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: t('product.grid.alerts.start'),
      cancelButtonText: t('common.cancel')
    });
    if (res.isConfirmed) {
      setLoading(true);
      try {
        await sortWarehouse(user.id);
        loadProductsAndBatches();
        toast.fire({ icon: 'success', title: t('product.grid.alerts.sortedSuccess') });
      } catch (err: any) { MySwal.fire(t('common.error'), err.message, 'error'); } finally { setLoading(false); }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 transition-colors duration-300 text-left">
      <style>{`
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-6px) rotate(-1deg); }
          50% { transform: translateX(6px) rotate(1deg); }
          75% { transform: translateX(-6px) rotate(-1deg); }
          100% { transform: translateX(0); }
        }
        .shake-shelf { animation: shake 0.6s both; border-color: #3b82f6 !important; border-width: 3px !important; }
        .shake-product { animation: shake 0.5s both; animation-delay: 0.4s; border-color: #3b82f6 !important; transform: scale(1.05); }
        .drag-over-shelf { background-color: rgba(59, 130, 246, 0.1) !important; border-color: #3b82f6 !important; border-width: 3px !important; }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <header className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">{t('product.grid.title')}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm italic tracking-wide">{t('product.grid.subtitle')}</p>
          </div>
          <div className="flex gap-4 items-center">
            {loading && <span className="animate-pulse text-blue-600 font-black text-[10px] uppercase">{t('common.updating')}</span>}
            {isAdmin && (
              <button onClick={handleSortClick} className="bg-indigo-600 text-white px-6 py-2.5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-transform">
                {t('product.grid.sorting')}
              </button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {rows.map(row => (
            <div key={row} className="flex flex-col gap-2">
               <span className="font-black text-slate-300 dark:text-slate-800 text-xs uppercase pl-2">{row} {t('product.grid.sector')}</span>
               <div className="flex gap-2">
                 {cols.map(col => {
                   const name = `${row}${col}`;
                   return (
                     <button key={name} onClick={() => setSelectedParcella(name)}
                       className={`flex-1 py-4 rounded-2xl font-black transition-all border-2 
                         ${selectedParcella === name ? 'bg-blue-600 border-blue-500 text-white shadow-xl scale-105' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-blue-400'}`}>
                       {name}
                     </button>
                   );
                 })}
               </div>
            </div>
          ))}
        </div>

        <div className="text-left pb-20">
          {selectedParcella ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: polcCount }, (_, i) => i + 1).map(idx => {
                const polcName = `${selectedParcella}-${idx}`;
                const shelfBatches = batchesByPolc[polcName] || [];
                const weight = shelfBatches.reduce((s, b) => s + (b.mennyiseg * b.suly), 0);
                const isTargetShelf = activeHighlight && targetParcelName === polcName;

                return (
                  <div key={polcName}
                    onDragOver={e => { e.preventDefault(); !isMobile && e.currentTarget.classList.add('drag-over-shelf'); }}
                    onDragLeave={e => !isMobile && e.currentTarget.classList.remove('drag-over-shelf')}
                    onDrop={e => {
                      if (isMobile) return;
                      e.preventDefault();
                      e.currentTarget.classList.remove('drag-over-shelf');
                      const bId = parseInt(e.dataTransfer.getData("batchId"), 10);
                      if (bId) performMove(bId, polcName);
                    }}
                    className={`bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 shadow-sm flex flex-col min-h-[300px] transition-all
                      ${isTargetShelf ? 'shake-shelf shadow-blue-500/20' : 'border-slate-200 dark:border-slate-800'}`}>
                    <div className="p-5 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 rounded-t-[2.5rem]">
                       <div className="flex justify-between items-center mb-2">
                         <span className="font-black italic uppercase text-xs dark:text-white tracking-widest">{polcName}</span>
                         <span className={`text-[10px] font-black px-2 py-0.5 rounded ${weight > 1800 ? 'bg-red-500 text-white' : 'text-slate-500'}`}>
                           {weight.toFixed(0)} / {MAX_SHELF_WEIGHT} KG
                         </span>
                       </div>
                       <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                          <div className={`h-full transition-all duration-500 ${weight > 1800 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${(weight / MAX_SHELF_WEIGHT) * 100}%` }} />
                       </div>
                    </div>
                    <ul className="p-4 space-y-3 flex-grow">
                      {shelfBatches.map(b => {
                        const isTargetBatch = activeHighlight && targetProductId === b.productId.toString();
                        return (
                          <li key={b.id} 
                            draggable={canMove && !isMobile} 
                            ref={isTargetBatch ? highlightedProductRef : null}
                            onDragStart={e => handleDragStart(e, b.id)}
                            onClick={() => navigate(`/product/${b.productId}`)}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all bg-white dark:bg-slate-800
                              ${draggedBatchId === b.id ? 'opacity-30 border-blue-500 scale-95' : isTargetBatch ? 'shake-product border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-blue-400'}`}>
                            <div className="font-black text-[11px] uppercase truncate mb-1 dark:text-white tracking-tight italic">{b.productNev}</div>
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                               <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400 font-black">{b.mennyiseg} DB</span>
                               <span className="italic">{(b.mennyiseg * b.suly).toFixed(1)} KG</span>
                            </div>
                          </li>
                        );
                      })}
                      {shelfBatches.length === 0 && <li className="text-slate-300 dark:text-slate-700 text-[10px] font-black uppercase text-center py-10 tracking-widest italic opacity-50">{t('product.grid.emptyShelf')}</li>}
                    </ul>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800 transition-all shadow-inner">
                <p className="text-slate-400 font-black uppercase tracking-widest italic text-xs">{t('product.grid.selectSector')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductGridView;