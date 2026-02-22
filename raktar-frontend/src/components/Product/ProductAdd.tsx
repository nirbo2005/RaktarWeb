import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { addProduct, createBatch, getProducts } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import type { Product, ProductCategory } from "../../types/Product";
import Swal from 'sweetalert2';

const MySwal = Swal.mixin({
  customClass: {
    popup: 'rounded-[2.5rem] bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl font-sans',
    confirmButton: 'bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 mx-2',
  },
  buttonsStyling: false,
});

const toast = MySwal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
  background: 'rgb(15, 23, 42)',
  color: '#fff'
});

const KATEGORIAK: ProductCategory[] = [
  "ELEKTRONIKA", "ELELMISZER", "VEGYSZER", "IRODASZER", "AUTO_MOTOR",
  "RUHAZAT", "BARKACS", "SPORT", "JATEK", "HAZTARTAS",
  "KOZMETIKA", "KONYVEK", "BUTOR", "EGESZSEGUGY", "EGYEB"
];

function ProductAdd() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Kereső és módválasztó állapotok
  const [existingProducts, setExistingProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [mode, setMode] = useState<"SEARCH" | "NEW_MASTER">("SEARCH");

  // Mesteradat Form (Cikktörzs)
  const [masterForm, setMasterForm] = useState({
    nev: "",
    gyarto: "",
    kategoria: "EGYEB" as ProductCategory,
    beszerzesiAr: 0,
    eladasiAr: 0,
    suly: 1,
    minimumKeszlet: 10,
  });

  // Fizikai Készlet Form (Sarzs)
  const [batchForm, setBatchForm] = useState({
    mennyiseg: 0,
    lejarat: "",
  });

  const [parcellaParts, setParcellaParts] = useState({
    reszleg: "A",
    sor: "1",
    oszlop: "1"
  });

  useEffect(() => {
    getProducts().then(setExistingProducts).catch(console.error);
  }, []);

  const handleMasterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMasterForm(prev => ({ ...prev, [name]: value }));
  };

  const handleBatchChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (["reszleg", "sor", "oszlop"].includes(name)) {
      setParcellaParts(prev => ({ ...prev, [name]: value }));
    } else {
      setBatchForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const parcellaString = `${parcellaParts.reszleg}${parcellaParts.sor}-${parcellaParts.oszlop}`;
    const lejaratDate = batchForm.lejarat ? new Date(batchForm.lejarat) : null;

    try {
      if (selectedProduct) {
        // MEGLÉVŐ TERMÉKHEZ ÚJ SARZS (BATCH)
        await createBatch({
          productId: selectedProduct.id,
          parcella: parcellaString,
          mennyiseg: Number(batchForm.mennyiseg),
          lejarat: lejaratDate,
        }, user.id);

        await toast.fire({ icon: 'success', title: 'Új készlet (Sarzs) sikeresen bevételezve! 📦' });
      } else {
        // TELJESEN ÚJ CIKKTÖRZS + KEZDŐ SARZS
        // 1. Cikktörzs mentése
        const newProduct = await addProduct({
          nev: masterForm.nev,
          gyarto: masterForm.gyarto,
          kategoria: masterForm.kategoria,
          beszerzesiAr: Number(masterForm.beszerzesiAr),
          eladasiAr: Number(masterForm.eladasiAr),
          suly: Number(masterForm.suly),
          minimumKeszlet: Number(masterForm.minimumKeszlet),
          isDeleted: false,
        }, user.id);

        // 2. Kezdő készlet (Batch) mentése
        await createBatch({
          productId: newProduct.id,
          parcella: parcellaString,
          mennyiseg: Number(batchForm.mennyiseg),
          lejarat: lejaratDate,
        }, user.id);

        await toast.fire({ icon: 'success', title: 'Új cikktörzs és kezdőkészlet rögzítve! ✨' });
      }
      navigate("/");
    } catch (error: any) {
      MySwal.fire({
        icon: 'error',
        title: 'Mentési hiba',
        text: error.message || 'Ellenőrizze az adatokat, és a polc kapacitását!',
      });
    }
  };

  const filteredProducts = existingProducts.filter(p => 
    p.nev.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.gyarto.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5); // Csak az első 5 találatot mutatjuk

  const inputStyle = "w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all";
  const labelStyle = "block mb-2 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest";

  return (
    <div className="flex items-center justify-center min-h-[80vh] py-10">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 relative">
        <button onClick={() => navigate("/")} className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-all active:scale-90">✕</button>
        
        <h1 className="text-3xl font-black text-slate-800 dark:text-white italic uppercase tracking-tighter mb-8 text-left">
          📦 Raktári <span className="text-blue-600">Bevételezés</span>
        </h1>

        {/* KERESŐ ÉS VÁLASZTÓ SZEKCIÓ */}
        {!selectedProduct && mode === "SEARCH" && (
          <div className="mb-10 text-left animate-in fade-in zoom-in duration-300">
            <label className={labelStyle}>Keresés meglévő cikktörzsben</label>
            <input 
              type="text" 
              placeholder="Keresés név vagy gyártó alapján..." 
              className={inputStyle}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            {searchTerm && filteredProducts.length > 0 && (
              <div className="mt-4 flex flex-col gap-2">
                {filteredProducts.map(p => (
                  <button 
                    key={p.id} 
                    onClick={() => setSelectedProduct(p)}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 text-left flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 transition-all"
                  >
                    <div>
                      <span className="font-black italic uppercase text-slate-800 dark:text-white">{p.nev}</span>
                      <span className="text-xs ml-2 text-slate-500">{p.gyarto}</span>
                    </div>
                    <span className="text-blue-500 font-black text-xs uppercase tracking-widest">Kiválaszt →</span>
                  </button>
                ))}
              </div>
            )}
            
            <div className="mt-6 flex items-center gap-4">
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">VAGY</span>
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
            </div>

            <button 
              onClick={() => setMode("NEW_MASTER")}
              className="w-full mt-6 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black py-4 rounded-2xl transition-all hover:bg-slate-200 dark:hover:bg-slate-700 uppercase tracking-widest text-xs"
            >
              + Új Cikktörzs Létrehozása
            </button>
          </div>
        )}

        {/* KIVÁLASZTOTT TERMÉK MUTATÁSA */}
        {selectedProduct && (
          <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 flex justify-between items-center animate-in slide-in-from-top-4 text-left">
            <div>
              <span className="block text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest mb-1">Kijelölt Cikktörzs</span>
              <span className="text-xl font-black italic uppercase text-slate-800 dark:text-white">{selectedProduct.nev}</span>
            </div>
            <button onClick={() => setSelectedProduct(null)} className="text-xs text-red-500 hover:text-red-700 font-bold uppercase underline">Mégse</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="text-left space-y-8">
          {/* MESTERADATOK (Csak ha új terméket hozunk létre) */}
          {mode === "NEW_MASTER" && !selectedProduct && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-lg font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Mesteradatok (Cikktörzs)</h3>
                <button type="button" onClick={() => setMode("SEARCH")} className="text-xs text-slate-400 hover:text-slate-600 underline uppercase font-bold">Vissza a keresőhöz</button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelStyle}>Termék név</label>
                  <input name="nev" placeholder="Pl. Acélcsavar" className={inputStyle} onChange={handleMasterChange} required />
                </div>
                <div>
                  <label className={labelStyle}>Gyártó</label>
                  <input name="gyarto" placeholder="Pl. IronWorks Kft." className={inputStyle} onChange={handleMasterChange} required />
                </div>
                <div>
                  <label className={labelStyle}>Kategória</label>
                  <select name="kategoria" className={inputStyle} onChange={handleMasterChange} value={masterForm.kategoria}>
                    {KATEGORIAK.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelStyle}>Súly (kg / db)</label>
                  <input name="suly" type="number" step="0.01" className={inputStyle} onChange={handleMasterChange} required />
                </div>
                <div>
                  <label className={labelStyle}>Beszerzési Ár (Ft)</label>
                  <input name="beszerzesiAr" type="number" className={inputStyle} onChange={handleMasterChange} required />
                </div>
                <div>
                  <label className={labelStyle}>Eladási Ár (Ft)</label>
                  <input name="eladasiAr" type="number" className={inputStyle} onChange={handleMasterChange} required />
                </div>
              </div>
            </div>
          )}

          {/* FIZIKAI KÉSZLET (SARZS) ADATAI - Ez mindig megjelenik */}
          {(selectedProduct || mode === "NEW_MASTER") && (
            <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom-4">
              <h3 className="text-lg font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Készlet (Sarzs) Bevételezése</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelStyle}>Lejárati idő (Opcionális)</label>
                  <input name="lejarat" type="date" className={inputStyle} onChange={handleBatchChange} />
                </div>
                
                <div>
                  <label className={labelStyle}>Helyszín (Célpolc)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <select name="reszleg" className={inputStyle} onChange={handleBatchChange} value={parcellaParts.reszleg}>
                      {["A", "B", "C", "D"].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                    <select name="sor" className={inputStyle} onChange={handleBatchChange} value={parcellaParts.sor}>
                      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <select name="oszlop" className={inputStyle} onChange={handleBatchChange} value={parcellaParts.oszlop}>
                      {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className={labelStyle}>Bevételezett Mennyiség (db)</label>
                  <input name="mennyiseg" type="number" min="1" className={`${inputStyle} text-2xl font-black text-center`} onChange={handleBatchChange} required />
                </div>
              </div>

              <div className="pt-8">
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-95 uppercase tracking-widest text-xs">
                  Mentés a Raktárba
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default ProductAdd;