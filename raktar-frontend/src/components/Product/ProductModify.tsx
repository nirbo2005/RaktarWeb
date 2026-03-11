// src/components/Product/ProductModify.tsx
import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getProductById,
  updateProduct,
  restoreProduct,
  updateBatch,
  deleteBatch,
  getWarehouseMap,
  createBulkBatches,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import type { Batch, WarehouseMapData } from "../../types/Batch";
import type { ProductCategory } from "../../types/Product";
import ShelfMap from "../Inventory/ShelfMap";
import BatchSplitter from "../Inventory/BatchSplitter";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";

const MySwal = Swal.mixin({
  customClass: {
    popup: "rounded-[2.5rem] bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl font-sans",
    confirmButton: "bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 mx-2",
    cancelButton: "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 mx-2",
  },
  buttonsStyling: false,
});

const toast = MySwal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
  background: "rgb(15, 23, 42)",
  color: "#fff",
});

type ViewMode = "data" | "stock";
type StockMode = "add" | "remove";

const KATEGORIAK: ProductCategory[] = [
  "ELEKTRONIKA", "ELELMISZER", "VEGYSZER", "IRODASZER", "AUTO_MOTOR",
  "RUHAZAT", "BARKACS", "SPORT", "JATEK", "HAZTARTAS",
  "KOZMETIKA", "KONYVEK", "BUTOR", "EGESZSEGUGY", "EGYEB",
];

function ProductModify() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const isAdmin = user?.rang === "ADMIN";
  const isKezelo = user?.rang === "KEZELO";
  const canSeeDataTab = isAdmin || isKezelo;

  const isFirstLoad = useRef(true);

  const [viewMode, setViewMode] = useState<ViewMode>("stock");
  const [stockMode, setStockMode] = useState<StockMode>("add");
  const [isDeleted, setIsDeleted] = useState(false);
  const [inputValue, setInputValue] = useState<number>(0);
  const [mapData, setMapData] = useState<WarehouseMapData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<number | "NEW">("NEW");

  const [newBatchQuantity, setNewBatchQuantity] = useState<number>(0);
  const [newBatchExpiry, setNewBatchExpiry] = useState<string>("");
  const [splits, setSplits] = useState<{ parcella: string; mennyiseg: number }[] | null>(null);
  
  const [selectedShelfFromMap, setSelectedShelfFromMap] = useState<string>("");
  const [currentSelectedShelves, setCurrentSelectedShelves] = useState<string[]>([]);
  const [showMap, setShowMap] = useState(false);

  const [masterForm, setMasterForm] = useState({
    nev: "",
    gyarto: "",
    kategoria: "EGYEB" as ProductCategory,
    beszerzesiAr: 0,
    eladasiAr: 0,
    suly: 1,
    minimumKeszlet: 10,
  });

  const loadData = useCallback(async () => {
    if (!id || !user) return;
    try {
      const [data, warehouseMap] = await Promise.all([
        getProductById(Number(id), isAdmin),
        getWarehouseMap()
      ]);
      
      setMapData(warehouseMap);
      
      setMasterForm(prev => prev.nev === "" ? {
        nev: data.nev,
        gyarto: data.gyarto,
        kategoria: data.kategoria,
        beszerzesiAr: data.beszerzesiAr,
        eladasiAr: data.eladasiAr,
        suly: data.suly,
        minimumKeszlet: data.minimumKeszlet,
      } : prev);

      setBatches(data.batches || []);
      
      if (isFirstLoad.current && data.batches?.length > 0) {
        setSelectedBatchId(data.batches[0].id);
        isFirstLoad.current = false;
      }

      setIsDeleted(data.isDeleted);
    } catch (err) {
      console.error(t("product.add.alerts.fetchError"), err);
    }
  }, [id, isAdmin, user, t]);

  useAutoRefresh(loadData);

  useEffect(() => {
    if (!canSeeDataTab && viewMode === "data") {
      setViewMode("stock");
    }
  }, [canSeeDataTab, viewMode]);

  const handleMapClick = (parcella: string) => {
    setSelectedShelfFromMap(`${parcella}_${Date.now()}`);
  };

  // MEMOIZÁLT CALLBACK - Megszünteti a végtelen ciklust
  const handleManualSelection = useCallback((shelves: string[]) => {
    setShowMap(true);
    setCurrentSelectedShelves(shelves);
  }, []);

  const handleExistingStockUpdate = async () => {
    if (!id || !user || inputValue === 0 || isSubmitting || selectedBatchId === "NEW") return;
    setIsSubmitting(true);
    
    try {
      const targetBatch = batches.find((b) => b.id === selectedBatchId);
      if (!targetBatch) return;

      const change = stockMode === "add" ? inputValue : -inputValue;
      const newQuantity = targetBatch.mennyiseg + change;

      if (newQuantity < 0) {
        setIsSubmitting(false);
        return MySwal.fire(t("common.error"), t("product.modify.alerts.notEnoughStock", { max: targetBatch.mennyiseg }), "error");
      }

      if (stockMode === "add") {
          const shelfWeight = mapData?.shelves[targetBatch.parcella]?.weight || 0;
          const addedWeight = inputValue * masterForm.suly;
          if (shelfWeight + addedWeight > (mapData?.maxWeight || 2000)) {
             setIsSubmitting(false);
             return MySwal.fire(t("common.error"), t("product.grid.alerts.weightStop"), "error");
          }
      }

      await updateBatch(targetBatch.id, { mennyiseg: newQuantity }, user.id);
      toast.fire({ icon: "success", title: t("product.modify.alerts.stockUpdated") });

      setInputValue(0);
      if (newQuantity === 0) setSelectedBatchId("NEW");
      loadData();
    } catch (err: any) {
      MySwal.fire({ icon: "error", title: t("common.error"), text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBatch = async () => {
    if (selectedBatchId === "NEW" || !user || isSubmitting) return;
    
    const targetBatch = batches.find(b => b.id === selectedBatchId);
    if (!targetBatch) return;

    const result = await MySwal.fire({
      title: t("product.modify.alerts.deletePhysicalBatch"),
      text: `${targetBatch.parcella} (${targetBatch.mennyiseg} ${t("common.pieces")})`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("common.yes"),
      cancelButtonText: t("common.cancel")
    });

    if (result.isConfirmed) {
      setIsSubmitting(true);
      try {
        await deleteBatch(targetBatch.id, user.id);
        toast.fire({ icon: "success", title: t("product.modify.alerts.batchDeleted") });
        setSelectedBatchId("NEW");
        loadData();
      } catch (err: any) {
        MySwal.fire(t("common.error"), err.message, "error");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleNewBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user || !splits || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const lejaratDate = newBatchExpiry ? new Date(newBatchExpiry) : null;
      const bulkData = splits.map(s => ({
        productId: Number(id),
        parcella: s.parcella,
        mennyiseg: s.mennyiseg,
        lejarat: lejaratDate
      }));

      await createBulkBatches(bulkData, user.id);

      await toast.fire({ icon: "success", title: t("product.modify.alerts.intakeSuccess", { count: newBatchQuantity }) });
      
      setNewBatchQuantity(0);
      setNewBatchExpiry("");
      setSplits(null);
      setShowMap(false);
      setSelectedShelfFromMap("");
      setCurrentSelectedShelves([]);
      
      loadData();
    } catch (error: any) {
      MySwal.fire({
        icon: "error",
        title: t("product.add.alerts.errorOccurred"),
        text: error.message || t("product.add.alerts.errorText"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async () => {
    if (!id || !user || isSubmitting) return;
    const result = await MySwal.fire({
      title: t("product.modify.alerts.restoreTitle"),
      icon: "question",
      showCancelButton: true,
      confirmButtonText: t("common.yes"),
    });
    if (result.isConfirmed) {
      setIsSubmitting(true);
      try {
        await restoreProduct(Number(id), user.id);
        setIsDeleted(false);
        loadData();
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleMasterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMasterForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMasterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user || !canSeeDataTab || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await updateProduct(Number(id), masterForm, user.id);
      toast.fire({ icon: "success", title: t("product.modify.alerts.dataUpdated") });
      navigate(`/product/${id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = "w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900 dark:text-white text-center";
  const labelStyle = "block mb-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center";

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 p-4 py-10 relative text-left">
      {!isDeleted && (
        <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-[2rem] shadow-sm border border-slate-300 dark:border-slate-800 mb-8 w-full max-w-md z-10 relative transition-colors">
          <button onClick={() => setViewMode("stock")} className={`flex-1 py-3 px-6 rounded-[1.5rem] font-black text-sm transition-all ${viewMode === "stock" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-600"}`}>
            {t("product.modify.tabs.physicalStock")}
          </button>
          {canSeeDataTab && (
            <button onClick={() => setViewMode("data")} className={`flex-1 py-3 px-6 rounded-[1.5rem] font-black text-sm transition-all ${viewMode === "data" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-600"}`}>
              {t("product.modify.tabs.masterData")}
            </button>
          )}
        </div>
      )}

      <div className="w-full max-w-6xl bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 relative transition-all">
        {isDeleted && (
          <div className="absolute inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center p-6">
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl text-center">
              <h2 className="text-2xl font-black text-red-500 uppercase mb-4">{t("product.modify.deletedTitle")}</h2>
              <button onClick={handleRestore} disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white py-4 rounded-2xl font-black mb-4 transition-all">{t("product.modify.restoreBtn")}</button>
              <button onClick={() => navigate("/")} className="text-slate-400 font-black uppercase text-[10px]">{t("product.details.backToHome")}</button>
            </div>
          </div>
        )}

        {viewMode === "stock" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-8">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-black dark:text-white uppercase italic tracking-tighter">{t("product.modify.stockManagement")}</h2>
                  <p className="text-blue-600 font-black uppercase text-xs tracking-[0.2em] mt-1">{masterForm.nev}</p>
                </div>
                {selectedBatchId !== "NEW" && (
                  <button 
                    onClick={handleDeleteBatch}
                    disabled={isSubmitting}
                    className="text-[10px] font-black text-rose-500 hover:text-rose-700 disabled:text-slate-400 uppercase tracking-widest mb-1 underline"
                  >
                    {t("product.details.delete")}
                  </button>
                )}
              </div>

              <div className="col-span-2">
                <label className={labelStyle}>{t("product.modify.selectBatch")}</label>
                <select className={inputStyle} value={selectedBatchId} onChange={(e) => {
                  const val = e.target.value === "NEW" ? "NEW" : Number(e.target.value);
                  setSelectedBatchId(val);
                  if (val !== "NEW") {
                    setShowMap(false);
                    setSplits(null);
                    setCurrentSelectedShelves([]);
                  }
                }}>
                  {batches.map(b => <option key={b.id} value={b.id}>📍 {b.parcella} ({b.mennyiseg} {t("common.pieces")})</option>)}
                  <option value="NEW">{t("product.modify.createNewBatch")}</option>
                </select>
              </div>

              {selectedBatchId !== "NEW" && (
                <div className="space-y-6 animate-in fade-in zoom-in">
                  <div className="flex justify-center gap-4 py-2">
                    <button onClick={() => setStockMode("add")} className={`w-20 h-20 rounded-3xl font-black text-3xl transition-all ${stockMode === "add" ? "bg-emerald-500 text-white scale-110 shadow-lg" : "bg-slate-200 dark:bg-slate-800 text-slate-500"}`}>+</button>
                    <button onClick={() => setStockMode("remove")} className={`w-20 h-20 rounded-3xl font-black text-3xl transition-all ${stockMode === "remove" ? "bg-rose-500 text-white scale-110 shadow-lg" : "bg-slate-200 dark:bg-slate-800 text-slate-500"}`}>-</button>
                  </div>
                  <div>
                    <label className={labelStyle}>{t("product.modify.quantity")}</label>
                    <input type="number" value={inputValue || ""} onChange={(e) => setInputValue(Math.abs(Number(e.target.value)))} className={`${inputStyle} text-4xl h-20 font-black`} placeholder="0" />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button onClick={() => navigate(-1)} className="flex-1 py-4 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-600 font-black uppercase text-[10px] tracking-widest">{t("common.cancel")}</button>
                    <button onClick={handleExistingStockUpdate} disabled={inputValue === 0 || isSubmitting} className="flex-[2] bg-blue-600 disabled:bg-slate-300 disabled:dark:bg-slate-800 disabled:text-slate-500 text-white py-4 rounded-2xl font-black shadow-xl uppercase text-xs tracking-widest italic">{isSubmitting ? t("common.updating") : t("product.modify.execute")}</button>
                  </div>
                </div>
              )}

              {selectedBatchId === "NEW" && (
                <form onSubmit={handleNewBatchSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 transition-colors">
                      <label className={labelStyle}>{t("product.add.quantity")}</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={newBatchQuantity || ""} 
                        onChange={(e) => {
                          setNewBatchQuantity(Math.abs(Number(e.target.value)));
                          setSplits(null);
                        }} 
                        className={`${inputStyle} border-slate-300 dark:border-slate-600 text-4xl font-black text-center bg-transparent focus:ring-0`} 
                        required 
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={labelStyle}>{t("product.add.expiry")}</label>
                      <input 
                        type="date" 
                        className={`${inputStyle} border-slate-300 dark:border-slate-600`} 
                        value={newBatchExpiry} 
                        onChange={(e) => setNewBatchExpiry(e.target.value)} 
                      />
                    </div>
                  </div>

                  {newBatchQuantity > 0 && (
                    <BatchSplitter
                      productId={Number(id)}
                      totalQuantity={newBatchQuantity}
                      productWeight={masterForm.suly}
                      onSplitsChange={setSplits}
                      onManualSelectRequested={handleManualSelection}
                      externalSelectedShelf={selectedShelfFromMap}
                      mapData={mapData}
                    />
                  )}

                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => navigate(-1)} className="flex-1 py-4 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-600 font-black uppercase text-[10px] tracking-widest">{t("common.cancel")}</button>
                    <button 
                      type="submit" 
                      disabled={!splits || isSubmitting} 
                      className="flex-[2] bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 disabled:dark:bg-slate-800 disabled:text-slate-500 text-white py-4 rounded-2xl font-black shadow-xl shadow-emerald-500/20 uppercase text-xs tracking-widest italic transition-all"
                    >
                      {isSubmitting ? t("common.identifying") : t("product.add.saveToWarehouse")}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="lg:border-l lg:border-slate-200 lg:dark:border-slate-800 lg:pl-8">
              {selectedBatchId === "NEW" && showMap && (
                <ShelfMap 
                  onSelectShelf={handleMapClick} 
                  selectedShelves={currentSelectedShelves}
                  highlightCategory={masterForm.kategoria}
                  onMapDataLoaded={setMapData}
                />
              )}
              {selectedBatchId !== "NEW" && (
                 <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                   <span className="text-6xl mb-4 grayscale">📍</span>
                   <p className="font-black uppercase tracking-widest text-slate-500 text-sm">
                     {batches.find(b => b.id === selectedBatchId)?.parcella}
                   </p>
                 </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleMasterSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in">
              <div className="md:col-span-2 border-b border-slate-200 dark:border-slate-800 pb-4">
                <h2 className="text-3xl font-black dark:text-white uppercase italic tracking-tighter">{t("product.modify.editData")}</h2>
              </div>
              <div className="md:col-span-2">
                <label className={labelStyle}>{t("product.add.name")}</label>
                <input name="nev" value={masterForm.nev} onChange={handleMasterChange} className={inputStyle} disabled={!isAdmin} required />
              </div>
              <div>
                <label className={labelStyle}>{t("product.add.manufacturer")}</label>
                <input name="gyarto" value={masterForm.gyarto} onChange={handleMasterChange} className={inputStyle} disabled={!isAdmin} required />
              </div>
              <div>
                <label className={labelStyle}>{t("product.add.category")}</label>
                <select name="kategoria" value={masterForm.kategoria} onChange={handleMasterChange} className={inputStyle} disabled={!isAdmin}>
                  {KATEGORIAK.map(k => <option key={k} value={k}>{t(`product.categories.${k}`)}</option>)}
                </select>
              </div>
              <div>
                <label className={labelStyle}>{t("product.add.weight")}</label>
                <input name="suly" type="number" step="0.01" value={masterForm.suly} onChange={handleMasterChange} className={inputStyle} disabled={!isAdmin} required />
              </div>
              <div>
                <label className={labelStyle}>{t("product.add.minStock")}</label>
                <input name="minimumKeszlet" type="number" value={masterForm.minimumKeszlet} onChange={handleMasterChange} className={inputStyle} disabled={!isKezelo && !isAdmin} required />
              </div>
              <div className="md:col-span-2 grid grid-cols-2 gap-8 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <label className={labelStyle}>{t("product.add.purchasePrice")}</label>
                  <input name="beszerzesiAr" type="number" value={masterForm.beszerzesiAr} onChange={handleMasterChange} className={inputStyle} disabled={!isAdmin} required />
                </div>
                <div>
                  <label className={labelStyle}>{t("product.add.salePrice")}</label>
                  <input name="eladasiAr" type="number" value={masterForm.eladasiAr} onChange={handleMasterChange} className={inputStyle} disabled={!isAdmin} required />
                </div>
              </div>
              <div className="md:col-span-2 flex gap-4 pt-8 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => navigate(-1)} className="flex-1 py-4 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-600 font-black uppercase text-[10px] tracking-widest">{t("common.cancel")}</button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] bg-indigo-600 disabled:bg-slate-300 disabled:dark:bg-slate-800 text-white py-4 rounded-2xl font-black shadow-xl uppercase text-xs tracking-widest italic">{isSubmitting ? t("common.updating") : t("common.save")}</button>
              </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ProductModify;