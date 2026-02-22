import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProductById, updateProduct, restoreProduct, updateBatch, createBatch, deleteBatch } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import type { Batch } from "../../types/Batch";
import type { ProductCategory } from "../../types/Product";
import Swal from 'sweetalert2';

const MySwal = Swal.mixin({
  customClass: {
    popup: 'rounded-[2.5rem] bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl font-sans',
    confirmButton: 'bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 mx-2',
    cancelButton: 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 mx-2',
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

type ViewMode = "data" | "stock";
type StockMode = "add" | "remove";

const KATEGORIAK: ProductCategory[] = [
  "ELEKTRONIKA", "ELELMISZER", "VEGYSZER", "IRODASZER", "AUTO_MOTOR",
  "RUHAZAT", "BARKACS", "SPORT", "JATEK", "HAZTARTAS",
  "KOZMETIKA", "KONYVEK", "BUTOR", "EGESZSEGUGY", "EGYEB"
];

function ProductModify() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = user?.rang === "ADMIN";
  const isKezelo = user?.rang === "KEZELO";
  const canSeeDataTab = isAdmin || isKezelo;

  const [viewMode, setViewMode] = useState<ViewMode>("stock");
  const [stockMode, setStockMode] = useState<StockMode>("add");
  const [isDeleted, setIsDeleted] = useState(false);
  const [inputValue, setInputValue] = useState<number>(0);

  // Készletkezeléshez (Sarzsok)
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<number | 'NEW'>('NEW');
  const [newBatchForm, setNewBatchForm] = useState({ reszleg: "A", sor: "1", oszlop: "1", lejarat: "" });

  // Mesteradatok form (Cikktörzs)
  const [masterForm, setMasterForm] = useState({
    nev: "",
    gyarto: "",
    kategoria: "EGYEB" as ProductCategory,
    beszerzesiAr: 0,
    eladasiAr: 0,
    suly: 1,
    minimumKeszlet: 10,
  });

  const loadData = () => {
    if (!id || !user) return;
    getProductById(Number(id), isAdmin)
      .then((data) => {
        setMasterForm({
          nev: data.nev,
          gyarto: data.gyarto,
          kategoria: data.kategoria,
          beszerzesiAr: data.beszerzesiAr,
          eladasiAr: data.eladasiAr,
          suly: data.suly,
          minimumKeszlet: data.minimumKeszlet,
        });
        setBatches(data.batches || []);
        if (data.batches && data.batches.length > 0) {
          setSelectedBatchId(data.batches[0].id);
        } else {
          setSelectedBatchId('NEW');
        }
        setIsDeleted(data.isDeleted);
      })
      .catch(() => navigate("/"));
  };

  useEffect(() => {
    loadData();
    if (!canSeeDataTab && viewMode === "data") {
      setViewMode("stock");
    }
  }, [id, user, navigate, isAdmin, viewMode, canSeeDataTab]);

  const handleRestore = async () => {
    if (!id || !user) return;
    
    const result = await MySwal.fire({
      title: 'Visszaállítás?',
      text: "A termék újra elérhető lesz a készletben.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Igen, állítsd vissza',
      cancelButtonText: 'Mégse'
    });

    if (result.isConfirmed) {
      try {
        await restoreProduct(Number(id), user.id);
        setIsDeleted(false);
        await toast.fire({ icon: 'success', title: 'A termék sikeresen újraaktiválva.' });
      } catch (err) {
        MySwal.fire('Hiba!', 'Sikertelen visszaállítás.', 'error');
      }
    }
  };

  // ... (imports és stílusok változatlanok)

  const handleStockUpdate = async () => {
    if (!id || !user || inputValue === 0) return;

    try {
      if (selectedBatchId === 'NEW') {
        if (stockMode === 'remove') {
          return MySwal.fire('Hiba', 'Nem vehetsz le készletet a semmiből. Válassz meglévő sarzsot!', 'error');
        }
        const parcellaString = `${newBatchForm.reszleg}${newBatchForm.sor}-${newBatchForm.oszlop}`;
        await createBatch({
          productId: Number(id),
          parcella: parcellaString,
          mennyiseg: inputValue,
          lejarat: newBatchForm.lejarat ? new Date(newBatchForm.lejarat) : null,
        }, user.id);
        await toast.fire({ icon: 'success', title: `Új sarzs létrehozva: +${inputValue} db` });

      } else {
        const targetBatch = batches.find(b => b.id === selectedBatchId);
        if (!targetBatch) return;

        const change = stockMode === "add" ? inputValue : -inputValue;
        const newQuantity = targetBatch.mennyiseg + change;

        if (newQuantity < 0) {
          return MySwal.fire('Hiba', `Nincs elég készlet. Max: ${targetBatch.mennyiseg} db`, 'error');
        }

        // --- ÚJ LOGIKA KEZDETE ---
        if (newQuantity === 0) {
          const otherBatchesCount = batches.filter(b => b.id !== targetBatch.id).length;

          if (otherBatchesCount > 0) {
            // Van másik sarzs -> Automatikus törlés kérdezés nélkül
            await deleteBatch(targetBatch.id, user.id);
            await toast.fire({ icon: 'success', title: `Sarzs kiürült és automatikusan törölve lett.` });
          } else {
            // Ez az utolsó sarzs -> Kérdés a felhasználónak
            const confirmDelete = await MySwal.fire({
              title: 'Utolsó sarzs kiürült',
              text: 'Kívánod törölni ezt a fizikai sarzsot a rendszerről?',
              icon: 'question',
              showCancelButton: true,
              confirmButtonText: 'Igen, törlés',
              cancelButtonText: 'Nem, maradjon 0-val'
            });

            if (confirmDelete.isConfirmed) {
              await deleteBatch(targetBatch.id, user.id);
              await toast.fire({ icon: 'success', title: 'Sarzs törölve.' });
            } else {
              // Megpróbáljuk a 0-t elmenteni (a backend DTO már engedi)
              await updateBatch(targetBatch.id, { mennyiseg: 0 }, user.id);
              await toast.fire({ icon: 'success', title: 'Sarzs 0 mennyiséggel megmaradt.' });
            }
          }
        } else {
          // Sima mennyiség frissítés (> 0)
          await updateBatch(targetBatch.id, { mennyiseg: newQuantity }, user.id);
          await toast.fire({ icon: 'success', title: `Készlet frissítve.` });
        }
        // --- ÚJ LOGIKA VÉGE ---
      }

      setInputValue(0);
      loadData();
    } catch (err: any) {
      MySwal.fire({
        icon: 'error',
        title: 'Sikertelen művelet!',
        text: err.message || 'Hiba történt a mentés során.',
      });
    }
  };

  const handleMasterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMasterForm(prev => ({ ...prev, [name]: value }));
  };

  const handleMasterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user || !canSeeDataTab) return;

    try {
      await updateProduct(
        Number(id),
        {
          nev: masterForm.nev,
          gyarto: masterForm.gyarto,
          kategoria: masterForm.kategoria,
          beszerzesiAr: Number(masterForm.beszerzesiAr),
          eladasiAr: Number(masterForm.eladasiAr),
          suly: Number(masterForm.suly),
          minimumKeszlet: Number(masterForm.minimumKeszlet),
          isDeleted,
        },
        user.id,
      );
      
      await toast.fire({ icon: 'success', title: 'Mesteradatok sikeresen frissítve! ✨' });
      navigate(`/product/${id}`);
    } catch (err) {
      MySwal.fire('Hiba!', 'Sikertelen mentés.', 'error');
    }
  };

  const inputStyle = "w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900 dark:text-white appearance-none disabled:opacity-50 disabled:cursor-not-allowed text-center";
  const labelStyle = "block mb-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center transition-colors";

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-300 py-10">
      {!isDeleted && (
        <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 mb-8 w-full max-w-md transition-colors">
          <button
            onClick={() => setViewMode("stock")}
            className={`flex-1 py-3 px-6 rounded-[1.5rem] font-black text-sm transition-all ${viewMode === "stock" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
          >
            📦 Fizikai Készlet
          </button>
          {canSeeDataTab && (
            <button
              onClick={() => setViewMode("data")}
              className={`flex-1 py-3 px-6 rounded-[1.5rem] font-black text-sm transition-all ${viewMode === "data" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
            >
              ⚙️ Cikktörzs Adatok
            </button>
          )}
        </div>
      )}

      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 transition-all relative overflow-hidden text-left">
        {isDeleted && (
          <div className="absolute inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-red-500/30 max-w-sm">
              <span className="text-5xl mb-4 block">🗑️</span>
              <h2 className="text-2xl font-black text-red-600 dark:text-red-500 uppercase italic tracking-tighter mb-2">Termék törölve</h2>
              <button onClick={handleRestore} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl mb-4 transition-all active:scale-95">Visszaállítás</button>
              <button onClick={() => navigate("/")} className="w-full text-slate-400 font-black uppercase text-[10px] tracking-widest">Vissza a listához</button>
            </div>
          </div>
        )}

        {/* FIZIKAI KÉSZLET (SARZSOK) MODUL */}
        {viewMode === "stock" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-6">
              <h2 className="text-2xl md:text-3xl font-black dark:text-white tracking-tighter uppercase italic">Készlet (Sarzs) kezelése</h2>
              <p className="text-blue-600 font-bold mt-1 uppercase text-xs tracking-widest">{masterForm.nev}</p>
            </div>

            <div>
              <label className="block mb-4 text-xs font-black text-slate-500 uppercase tracking-widest">Célzott Fizikai Polc (Sarzs) Kiválasztása</label>
              <select 
                className={inputStyle} 
                value={selectedBatchId} 
                onChange={(e) => setSelectedBatchId(e.target.value === 'NEW' ? 'NEW' : Number(e.target.value))}
              >
                {batches.map(b => (
                  <option key={b.id} value={b.id}>
                    📍 {b.parcella} - Jelenleg {b.mennyiseg} db {b.lejarat ? `(Lejár: ${new Date(b.lejarat).toLocaleDateString()})` : ''}
                  </option>
                ))}
                <option value="NEW" className="font-bold text-emerald-600">➕ ÚJ SARZS LÉTREHOZÁSA (Új polcra)</option>
              </select>
            </div>

            {selectedBatchId === 'NEW' && (
              <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-[2rem] border border-emerald-200 dark:border-emerald-800/30 animate-in slide-in-from-top-4">
                <h4 className="text-emerald-700 dark:text-emerald-500 font-black uppercase tracking-widest text-xs mb-4">Új Sarzs Adatok</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>Helyszín (Polc)</label>
                    <div className="grid grid-cols-3 gap-1">
                      <select className={inputStyle} value={newBatchForm.reszleg} onChange={(e) => setNewBatchForm({...newBatchForm, reszleg: e.target.value})}>
                        {["A", "B", "C", "D"].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                      <select className={inputStyle} value={newBatchForm.sor} onChange={(e) => setNewBatchForm({...newBatchForm, sor: e.target.value})}>
                        {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                      <select className={inputStyle} value={newBatchForm.oszlop} onChange={(e) => setNewBatchForm({...newBatchForm, oszlop: e.target.value})}>
                        {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelStyle}>Lejárati Idő (Opcionális)</label>
                    <input type="date" className={inputStyle} value={newBatchForm.lejarat} onChange={(e) => setNewBatchForm({...newBatchForm, lejarat: e.target.value})} />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center gap-4">
              <button onClick={() => setStockMode("add")} className={`w-24 h-20 rounded-3xl font-black text-3xl border-4 transition-all flex items-center justify-center ${stockMode === "add" ? "bg-emerald-600 border-emerald-500 text-white scale-110 shadow-lg" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"}`}>+</button>
              {selectedBatchId !== 'NEW' && (
                <button onClick={() => setStockMode("remove")} className={`w-24 h-20 rounded-3xl font-black text-3xl border-4 transition-all flex items-center justify-center ${stockMode === "remove" ? "bg-red-600 border-red-500 text-white scale-110 shadow-lg" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"}`}>-</button>
              )}
            </div>

            <div className="max-w-xs mx-auto text-center">
              <label className={labelStyle}>Módosítás Mértéke (Darab)</label>
              <input type="number" min="0" value={inputValue === 0 ? "" : inputValue} onChange={(e) => setInputValue(Math.abs(Number(e.target.value)))} placeholder="0" className={`${inputStyle} text-3xl h-20`} />
            </div>

            <div className="flex gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
              <button onClick={() => navigate(-1)} className="flex-1 py-4 text-slate-500 hover:text-slate-800 dark:hover:text-white font-black uppercase text-xs transition-colors">Vissza</button>
              <button onClick={handleStockUpdate} disabled={inputValue === 0} className="flex-[2] bg-blue-600 disabled:bg-slate-300 disabled:text-slate-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-500/20 active:scale-95 transition-all">Módosítás Végrehajtása</button>
            </div>
          </div>
        )}

        {/* MESTERADATOK MODUL */}
        {viewMode === "data" && canSeeDataTab && (
          <form onSubmit={handleMasterSubmit} className="space-y-6 animate-in fade-in duration-500">
            <h2 className="text-2xl md:text-3xl font-black dark:text-white tracking-tighter uppercase italic mb-8 border-b border-slate-200 dark:border-slate-800 pb-6 text-center">Cikktörzs Szerkesztése</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className={labelStyle}>Termék Neve</label>
                <input name="nev" value={masterForm.nev} onChange={handleMasterChange} className={inputStyle} disabled={!isAdmin} required />
              </div>
              
              <div>
                <label className={labelStyle}>Gyártó</label>
                <input name="gyarto" value={masterForm.gyarto} onChange={handleMasterChange} className={inputStyle} disabled={!isAdmin} required />
              </div>
              
              <div>
                <label className={labelStyle}>Kategória</label>
                <select name="kategoria" value={masterForm.kategoria} onChange={handleMasterChange} className={inputStyle} disabled={!isAdmin}>
                  {KATEGORIAK.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              
              <div>
                <label className={labelStyle}>Súly (kg / db)</label>
                <input name="suly" type="number" step="0.01" value={masterForm.suly} onChange={handleMasterChange} className={inputStyle} disabled={!isAdmin} required />
              </div>

              <div>
                <label className={labelStyle}>Riasztás (Minimum Készlet)</label>
                <input name="minimumKeszlet" type="number" value={masterForm.minimumKeszlet} onChange={handleMasterChange} className={inputStyle} disabled={!isAdmin} required />
              </div>
              
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <label className={labelStyle}>Beszerzési Ár (Ft)</label>
                <input name="beszerzesiAr" type="number" value={masterForm.beszerzesiAr} onChange={handleMasterChange} className={inputStyle} disabled={!isAdmin} required />
              </div>
              
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <label className={labelStyle}>Eladási Ár (Ft)</label>
                <input name="eladasiAr" type="number" value={masterForm.eladasiAr} onChange={handleMasterChange} className={inputStyle} disabled={!isAdmin} required />
              </div>
            </div>

            <div className="flex gap-4 pt-8 border-t border-slate-200 dark:border-slate-800">
              <button type="button" onClick={() => navigate(-1)} className="flex-1 py-4 text-slate-500 hover:text-slate-800 dark:hover:text-white font-black uppercase text-xs transition-colors">Mégse</button>
              <button type="submit" className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-500/20 active:scale-95 transition-all uppercase text-xs tracking-widest">Adatok Mentése</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ProductModify;