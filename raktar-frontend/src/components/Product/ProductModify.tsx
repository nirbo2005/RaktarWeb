//raktar-frontend/src/components/ProductModify.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProductById, updateProduct, restoreProduct } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
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

  const [parcellaParts, setParcellaParts] = useState({
    reszleg: "A",
    sor: "1",
    oszlop: "1"
  });

  const [form, setForm] = useState({
    nev: "",
    gyarto: "",
    lejarat: new Date(),
    ar: 0,
    mennyiseg: 0,
    parcella: "",
  });

  useEffect(() => {
    if (!id || !user) return;
    
    if (!canSeeDataTab && viewMode === "data") {
      setViewMode("stock");
    }

    getProductById(Number(id), isAdmin)
      .then((data) => {
        setForm({
          nev: data.nev,
          gyarto: data.gyarto,
          lejarat: new Date(data.lejarat),
          ar: data.ar,
          mennyiseg: data.mennyiseg,
          parcella: data.parcella,
        });
        setIsDeleted(data.isDeleted);

        const match = data.parcella.match(/^([AB])([1-5])-([1-4])$/);
        if (match) {
          setParcellaParts({
            reszleg: match[1],
            sor: match[2],
            oszlop: match[3]
          });
        }
      })
      .catch(() => navigate("/"));
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
        await MySwal.fire({
          icon: 'success',
          title: 'Visszaállítva!',
          text: 'A termék sikeresen újraaktiválva.',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (err) {
        MySwal.fire('Hiba!', 'Sikertelen visszaállítás.', 'error');
      }
    }
  };

  const handleStockUpdate = async () => {
    if (!id || !user) return;
    const change = stockMode === "add" ? inputValue : -inputValue;
    const newQuantity = form.mennyiseg + change;
    
    if (newQuantity < 0) {
      MySwal.fire({
        icon: 'error',
        title: 'Készlethiba',
        text: 'A készlet nem mehet nulla alá!',
      });
      return;
    }

    try {
      await updateProduct(
        Number(id),
        { ...form, mennyiseg: newQuantity, isDeleted },
        user.id,
      );
      
      await toast.fire({
        icon: 'success',
        title: `Készlet frissítve: ${newQuantity} db`
      });

      navigate(`/product/${id}`);
    } catch (err) {
      MySwal.fire('Hiba!', 'Nem sikerült elmenteni a módosítást.', 'error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (["reszleg", "sor", "oszlop"].includes(name)) {
      setParcellaParts(prev => ({ ...prev, [name]: value }));
      return;
    }

    if (name === "lejarat") {
      setForm((prev) => ({ ...prev, lejarat: new Date(value) }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDataSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user || !canSeeDataTab) return;

    const parcellaString = `${parcellaParts.reszleg}${parcellaParts.sor}-${parcellaParts.oszlop}`;

    try {
      await updateProduct(
        Number(id),
        {
          ...form,
          ar: Number(form.ar),
          mennyiseg: Number(form.mennyiseg),
          parcella: parcellaString,
          isDeleted,
        },
        user.id,
      );
      
      await toast.fire({
        icon: 'success',
        title: 'Adatok sikeresen mentve! ✨'
      });

      navigate(`/product/${id}`);
    } catch (err) {
      MySwal.fire('Hiba!', 'Sikertelen mentés.', 'error');
    }
  };

  const inputStyle =
    "w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900 dark:text-white text-center appearance-none disabled:opacity-50 disabled:cursor-not-allowed";
  const labelStyle =
    "block mb-2 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center transition-colors";

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-300">
      {!isDeleted && (
        <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 mb-8 w-full max-w-md transition-colors">
          <button
            onClick={() => setViewMode("stock")}
            className={`flex-1 py-3 px-6 rounded-[1.5rem] font-black text-sm transition-all ${viewMode === "stock" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
          >
            📦 Készlet
          </button>
          {canSeeDataTab && (
            <button
              onClick={() => setViewMode("data")}
              className={`flex-1 py-3 px-6 rounded-[1.5rem] font-black text-sm transition-all ${viewMode === "data" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
            >
              📍 Áthelyezés / Adatok
            </button>
          )}
        </div>
      )}

      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 transition-all relative overflow-hidden">
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

        {viewMode === "stock" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-black dark:text-white tracking-tighter uppercase italic">Készlet frissítése</h2>
              <p className="text-blue-600 font-bold mt-1 uppercase text-[10px] tracking-widest">{form.nev}</p>
            </div>
            <div className="text-center py-4 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800/50 transition-colors">
              <span className="text-5xl md:text-6xl font-black dark:text-white">{form.mennyiseg} <span className="text-xl text-slate-400 font-medium">db</span></span>
            </div>
            <div className="flex gap-4 max-w-xs mx-auto">
              <button onClick={() => setStockMode("add")} className={`flex-1 py-4 rounded-2xl font-black text-2xl border-2 transition-all ${stockMode === "add" ? "bg-emerald-600 border-emerald-500 text-white shadow-lg" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"}`}>+</button>
              <button onClick={() => setStockMode("remove")} className={`flex-1 py-4 rounded-2xl font-black text-2xl border-2 transition-all ${stockMode === "remove" ? "bg-red-600 border-red-500 text-white shadow-lg" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"}`}>-</button>
            </div>
            <div className="max-w-xs mx-auto">
              <label className={labelStyle}>Módosítás mértéke</label>
              <input type="number" min="0" value={inputValue === 0 ? "" : inputValue} onChange={(e) => setInputValue(Math.abs(Number(e.target.value)))} placeholder="0" className={inputStyle} />
            </div>
            <div className="flex gap-4 pt-6 border-t dark:border-slate-800">
              <button onClick={() => navigate(-1)} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs">Mégse</button>
              <button onClick={handleStockUpdate} disabled={inputValue === 0} className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-500/20 active:scale-95 transition-all">Készlet Mentése</button>
            </div>
          </div>
        )}

        {viewMode === "data" && canSeeDataTab && (
          <form onSubmit={handleDataSubmit} className="space-y-6 animate-in fade-in duration-500 text-left">
            <h2 className="text-2xl md:text-3xl font-black dark:text-white tracking-tighter uppercase italic mb-8">Adatok és Helyszín</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className={labelStyle}>Termék neve</label>
                <input name="nev" value={form.nev} onChange={handleChange} className={inputStyle} disabled={!isAdmin} required />
              </div>
              <div>
                <label className={labelStyle}>Gyártó</label>
                <input name="gyarto" value={form.gyarto} onChange={handleChange} className={inputStyle} disabled={!isAdmin} required />
              </div>
              <div>
                <label className={labelStyle}>Lejárat</label>
                <input name="lejarat" type="date" value={form.lejarat.toISOString().split("T")[0]} onChange={handleChange} className={inputStyle} disabled={!isAdmin} required />
              </div>
              <div>
                <label className={labelStyle}>Ár (Ft)</label>
                <input name="ar" type="number" value={form.ar} onChange={handleChange} className={inputStyle} disabled={!isAdmin} required />
              </div>
              <div>
                <label className={labelStyle}>Parcella (Áthelyezés)</label>
                <div className="grid grid-cols-3 gap-2">
                    <select name="reszleg" className={inputStyle} onChange={handleChange} value={parcellaParts.reszleg}>
                        <option value="A">A</option>
                        <option value="B">B</option>
                    </select>
                    <select name="sor" className={inputStyle} onChange={handleChange} value={parcellaParts.sor}>
                        {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <select name="oszlop" className={inputStyle} onChange={handleChange} value={parcellaParts.oszlop}>
                        {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
              </div>
            </div>
            <div className="flex gap-4 pt-6 border-t dark:border-slate-800">
              <button type="button" onClick={() => navigate(-1)} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs">Mégse</button>
              <button type="submit" className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-500/20 active:scale-95 transition-all uppercase text-xs">Változtatások Mentése</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ProductModify;