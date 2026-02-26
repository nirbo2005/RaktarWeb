// raktar-frontend/src/components/Product/ProductAdd.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { addProduct, createBulkBatches, getProducts } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import type { Product, ProductCategory } from "../../types/Product";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";
import ShelfMap from "../Inventory/ShelfMap";
import BatchSplitter from "../Inventory/BatchSplitter";

const MySwal = Swal.mixin({
  customClass: {
    popup:
      "rounded-[2.5rem] bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl font-sans",
    confirmButton:
      "bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 mx-2",
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

const KATEGORIAK: ProductCategory[] = [
  "ELEKTRONIKA", "ELELMISZER", "VEGYSZER", "IRODASZER", "AUTO_MOTOR",
  "RUHAZAT", "BARKACS", "SPORT", "JATEK", "HAZTARTAS",
  "KOZMETIKA", "KONYVEK", "BUTOR", "EGESZSEGUGY", "EGYEB",
];

function ProductAdd() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [existingProducts, setExistingProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [mode, setMode] = useState<"SEARCH" | "NEW_MASTER">("SEARCH");

  const [masterForm, setMasterForm] = useState({
    nev: "",
    gyarto: "",
    kategoria: "EGYEB" as ProductCategory,
    beszerzesiAr: 0,
    eladasiAr: 0,
    suly: 1,
    minimumKeszlet: 10,
  });

  const [batchForm, setBatchForm] = useState({
    mennyiseg: 0,
    lejarat: "",
  });

  const [splits, setSplits] = useState<{ parcella: string; mennyiseg: number }[] | null>(null);
  const [selectedShelfFromMap, setSelectedShelfFromMap] = useState<string>("");
  const [showMap, setShowMap] = useState(false);

  const fetchSearchList = useCallback(async () => {
    try {
      const data = await getProducts();
      setExistingProducts(data);
    } catch (err) {
      console.error("Hiba a terméklista frissítésekor:", err);
    }
  }, []);

  useEffect(() => {
    fetchSearchList();
    window.addEventListener("server-online", fetchSearchList);
    return () => window.removeEventListener("server-online", fetchSearchList);
  }, [fetchSearchList]);

  const handleMasterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMasterForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBatchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBatchForm((prev) => ({ ...prev, [name]: value }));
    setSplits(null); // Reset splits if base quantity changes
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !splits) return;

    try {
      let productId = selectedProduct?.id;

      if (!productId) {
        const newProduct = await addProduct({
          ...masterForm,
          beszerzesiAr: Number(masterForm.beszerzesiAr),
          eladasiAr: Number(masterForm.eladasiAr),
          suly: Number(masterForm.suly),
          minimumKeszlet: Number(masterForm.minimumKeszlet),
          isDeleted: false,
        }, user.id);
        productId = newProduct.id;
      }

      const lejaratDate = batchForm.lejarat ? new Date(batchForm.lejarat) : null;
      const bulkData = splits.map(s => ({
        productId,
        parcella: s.parcella,
        mennyiseg: s.mennyiseg,
        lejarat: lejaratDate
      }));

      await createBulkBatches(bulkData, user.id);

      await toast.fire({
        icon: "success",
        title: selectedProduct ? t("product.add.alerts.intakeSuccess") : t("product.add.alerts.productCreated"),
      });
      navigate("/");
    } catch (error: any) {
      MySwal.fire({
        icon: "error",
        title: t("product.add.alerts.errorOccurred"),
        text: error.message || t("product.add.alerts.errorText"),
      });
    }
  };

  const filteredProducts = existingProducts
    .filter((p) =>
      p.nev.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.gyarto.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 5);

  const inputStyle = "w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all";
  const labelStyle = "block mb-2 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest";

  return (
    <div className="flex items-center justify-center min-h-[80vh] py-10 text-left">
      <div className="w-full max-w-6xl bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 relative transition-colors duration-300">
        <button
          onClick={() => navigate("/")}
          className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:rotate-90 transition-all active:scale-90"
        >✕</button>

        <h1 className="text-4xl font-black text-slate-800 dark:text-white italic uppercase tracking-tighter mb-10"
            dangerouslySetInnerHTML={{ __html: t("product.add.title") }}></h1>

        {!selectedProduct && mode === "SEARCH" && (
          <div className="mb-12 animate-in fade-in zoom-in duration-300">
            <label className={labelStyle}>{t("product.add.searchExisting")}</label>
            <input
              type="text"
              placeholder={t("product.add.searchPlaceholder")}
              className={`${inputStyle} text-lg py-4`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {searchTerm && filteredProducts.length > 0 && (
              <div className="mt-6 flex flex-col gap-3">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className="p-5 rounded-[2rem] border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 text-left flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 transition-all group"
                  >
                    <div>
                      <span className="font-black italic uppercase text-slate-800 dark:text-white group-hover:text-blue-500 transition-colors">{p.nev}</span>
                      <span className="text-xs ml-3 text-slate-500 font-bold tracking-widest">{p.gyarto}</span>
                    </div>
                    <span className="text-blue-500 font-black text-[10px] uppercase tracking-[0.2em]">{t("product.add.select")}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-10 flex items-center gap-6">
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{t("product.add.or")}</span>
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
            </div>

            <button
              onClick={() => setMode("NEW_MASTER")}
              className="w-full mt-8 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black py-5 rounded-[2rem] transition-all hover:bg-slate-200 dark:hover:bg-slate-700 uppercase tracking-[0.2em] text-[10px]"
            >{t("product.add.createNew")}</button>
          </div>
        )}

        {selectedProduct && (
          <div className="mb-10 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-[2.5rem] border border-blue-200 dark:border-blue-800 flex justify-between items-center animate-in slide-in-from-top-6">
            <div>
              <span className="block text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-[0.2em] mb-2">{t("product.add.selectedMaster")}</span>
              <span className="text-2xl font-black italic uppercase text-slate-800 dark:text-white">{selectedProduct.nev}</span>
            </div>
            <button onClick={() => setSelectedProduct(null)} className="text-[10px] text-red-500 hover:text-red-700 font-black uppercase underline tracking-widest">{t("common.cancel")}</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-12">
          {mode === "NEW_MASTER" && !selectedProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-slate-50 dark:bg-slate-800/30 rounded-[3rem] border border-slate-100 dark:border-slate-800 animate-in fade-in duration-500">
              <div className="md:col-span-2 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-4">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400">{t("product.add.masterData")}</h3>
                <button type="button" onClick={() => setMode("SEARCH")} className="text-[10px] text-slate-400 hover:text-slate-600 underline uppercase font-black tracking-widest">{t("common.search")}</button>
              </div>
              <div>
                <label className={labelStyle}>{t("product.add.name")}</label>
                <input name="nev" placeholder={t("product.add.namePlaceholder")} className={inputStyle} onChange={handleMasterChange} required />
              </div>
              <div>
                <label className={labelStyle}>{t("product.add.manufacturer")}</label>
                <input name="gyarto" placeholder={t("product.add.manufacturerPlaceholder")} className={inputStyle} onChange={handleMasterChange} required />
              </div>
              <div>
                <label className={labelStyle}>{t("product.add.category")}</label>
                <select name="kategoria" className={inputStyle} onChange={handleMasterChange} value={masterForm.kategoria}>
                  {KATEGORIAK.map((k) => (
                    <option key={k} value={k}>{t(`product.categories.${k}`)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelStyle}>{t("product.add.weight")} (kg)</label>
                <input name="suly" type="number" step="0.01" className={inputStyle} onChange={handleMasterChange} required />
              </div>
              <div>
                <label className={labelStyle}>{t("product.add.purchasePrice")}</label>
                <input name="beszerzesiAr" type="number" className={inputStyle} onChange={handleMasterChange} required />
              </div>
              <div>
                <label className={labelStyle}>{t("product.add.salePrice")}</label>
                <input name="eladasiAr" type="number" className={inputStyle} onChange={handleMasterChange} required />
              </div>
              <div className="md:col-span-2">
                <label className={labelStyle}>{t("product.add.minStock")}</label>
                <input name="minimumKeszlet" type="number" className={inputStyle} onChange={handleMasterChange} required value={masterForm.minimumKeszlet} />
              </div>
            </div>
          )}

          {(selectedProduct || mode === "NEW_MASTER") && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in slide-in-from-bottom-6">
              <div className="space-y-8">
                <h3 className="text-xl font-black uppercase tracking-tighter italic text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500/20 pb-2">{t("product.add.batchIntake")}</h3>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                    <label className={labelStyle}>{t("product.add.quantity")}</label>
                    <input name="mennyiseg" type="number" min="1" className={`${inputStyle} text-4xl font-black text-center bg-transparent border-none focus:ring-0`} onChange={handleBatchChange} required />
                  </div>
                  <div className="col-span-2">
                    <label className={labelStyle}>{t("product.add.expiry")}</label>
                    <input name="lejarat" type="date" className={inputStyle} onChange={handleBatchChange} />
                  </div>
                </div>

                {Number(batchForm.mennyiseg) > 0 && (
                  <BatchSplitter
                    productId={selectedProduct?.id || 0}
                    totalQuantity={Number(batchForm.mennyiseg)}
                    onSplitsChange={setSplits}
                    onManualSelectRequested={() => setShowMap(true)}
                    externalSelectedShelf={selectedShelfFromMap}
                  />
                )}
              </div>

              <div className="space-y-6">
                {showMap && (
                  <ShelfMap 
                    onSelectShelf={setSelectedShelfFromMap} 
                    selectedShelf={selectedShelfFromMap}
                    highlightCategory={selectedProduct?.kategoria || masterForm.kategoria}
                  />
                )}
              </div>

              <div className="lg:col-span-2 pt-6">
                <button
                  type="submit"
                  disabled={!splits}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black py-6 rounded-[2.5rem] shadow-2xl shadow-blue-600/30 transition-all active:scale-95 uppercase tracking-[0.3em] text-[10px]"
                >{t("product.add.saveToWarehouse")}</button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default ProductAdd;