//raktar-frontend/src/components/ProductModify.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProductById, updateProduct, restoreProduct } from "../services/api";
import { useAuth } from "../context/AuthContext";

type ViewMode = "data" | "stock";
type StockMode = "add" | "remove";

function ProductModify() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

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
    // user.admin helyett user.rang check
    getProductById(Number(id), user.rang === "ADMIN")
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

        // Parcella szétbontása dropdownokhoz (pl "A1-1")
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
  }, [id, user, navigate]);

  const handleRestore = async () => {
    if (!id || !user) return;
    if (window.confirm("Biztosan vissza szeretnéd állítani ezt a terméket?")) {
      try {
        await restoreProduct(Number(id), user.id);
        setIsDeleted(false);
        alert("Termék sikeresen visszaállítva!");
      } catch (err) {
        alert("Hiba a visszaállítás során.");
      }
    }
  };

  const handleStockUpdate = async () => {
    if (!id || !user) return;
    const change = stockMode === "add" ? inputValue : -inputValue;
    const newQuantity = form.mennyiseg + change;
    if (newQuantity < 0) {
      alert("Hiba: A készlet nem mehet nulla alá!");
      return;
    }
    try {
      await updateProduct(
        Number(id),
        { ...form, mennyiseg: newQuantity, isDeleted },
        user.id,
      );
      navigate(`/product/${id}`);
    } catch (err) {
      alert("Hiba történt a mentés során.");
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
    if (!id || !user) return;

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
      navigate(`/product/${id}`);
    } catch (err) {
      alert("Hiba a mentésnél.");
    }
  };

  const inputStyle =
    "w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900 dark:text-white text-center appearance-none";
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
            📦 Készletkezelés
          </button>
          <button
            onClick={() => setViewMode("data")}
            className={`flex-1 py-3 px-6 rounded-[1.5rem] font-black text-sm transition-all ${viewMode === "data" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
          >
            📝 Adatok
          </button>
        </div>
      )}

      <div
        className={`w-full max-w-2xl bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 transition-all relative overflow-hidden`}
      >
        {isDeleted && (
          <div className="absolute inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-red-500/30 max-w-sm">
              <span className="text-5xl mb-4 block">🗑️</span>
              <h2 className="text-2xl font-black text-red-600 dark:text-red-500 uppercase italic tracking-tighter mb-2">
                Ez a termék törölve van
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-bold mb-8 uppercase tracking-widest leading-relaxed">
                Módosítás előtt vissza kell állítanod a készletbe.
              </p>
              <button
                onClick={handleRestore}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-500/30 transition-all active:scale-95 uppercase tracking-widest text-xs"
              >
                Visszaállítás a készletbe
              </button>
              <button
                onClick={() => navigate("/")}
                className="w-full mt-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600"
              >
                Vissza a listához
              </button>
            </div>
          </div>
        )}

        {viewMode === "stock" && (
          <div className={`space-y-8 animate-in fade-in duration-500 ${isDeleted ? "blur-sm grayscale opacity-50" : ""}`}>
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic transition-colors">
                Készlet frissítése
              </h2>
              <p className="text-blue-600 dark:text-blue-400 font-bold mt-1 uppercase text-[10px] tracking-widest">
                {form.nev}
              </p>
            </div>

            <div className="text-center py-4 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800/50 transition-colors">
              <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-2 tracking-widest italic">
                Jelenlegi állomány
              </span>
              <span className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter">
                {form.mennyiseg}{" "}
                <span className="text-xl text-slate-400 font-medium lowercase">db</span>
              </span>
            </div>

            <div className="flex gap-4 max-w-xs mx-auto">
              <button
                type="button"
                onClick={() => setStockMode("add")}
                className={`flex-1 py-4 rounded-2xl font-black text-2xl transition-all border-2 ${stockMode === "add" ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"}`}
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setStockMode("remove")}
                className={`flex-1 py-4 rounded-2xl font-black text-2xl transition-all border-2 ${stockMode === "remove" ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/30" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"}`}
              >
                -
              </button>
            </div>

            <div className="max-w-xs mx-auto">
              <label className={labelStyle}>Módosítandó mennyiség</label>
              <input
                type="number"
                min="0"
                value={inputValue === 0 ? "" : inputValue}
                onChange={(e) => setInputValue(Math.abs(Number(e.target.value)))}
                placeholder="0"
                className={inputStyle}
              />
            </div>

            <div className="flex gap-4 pt-6 border-t border-slate-50 dark:border-slate-800 transition-colors">
              <button
                onClick={() => navigate(-1)}
                className="flex-1 py-4 text-slate-400 dark:text-slate-500 font-black uppercase text-xs tracking-widest hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                Mégse
              </button>
              <button
                onClick={handleStockUpdate}
                disabled={inputValue === 0}
                className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all active:scale-95 disabled:opacity-20 uppercase text-xs tracking-widest"
              >
                Változtatás mentése
              </button>
            </div>
          </div>
        )}

        {viewMode === "data" && (
          <form onSubmit={handleDataSubmit} className={`space-y-6 animate-in fade-in duration-500 text-left ${isDeleted ? "blur-sm grayscale opacity-50" : ""}`}>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic mb-8 transition-colors">
              Alapadatok módosítása
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block mb-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Termék neve</label>
                <input name="nev" value={form.nev} onChange={handleChange} className={inputStyle} required />
              </div>
              <div>
                <label className="block mb-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Gyártó</label>
                <input name="gyarto" value={form.gyarto} onChange={handleChange} className={inputStyle} required />
              </div>
              <div>
                <label className="block mb-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Lejárat</label>
                <input name="lejarat" type="date" value={form.lejarat.toISOString().split("T")[0]} onChange={handleChange} className={inputStyle} required />
              </div>
              <div>
                <label className="block mb-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Ár (Ft)</label>
                <input name="ar" type="number" value={form.ar} onChange={handleChange} className={inputStyle} required />
              </div>
              <div>
                <label className="block mb-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Parcella</label>
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
            <div className="flex gap-4 pt-6 border-t border-slate-50 dark:border-slate-800 transition-colors">
              <button type="button" onClick={() => navigate(-1)} className="flex-1 py-4 text-slate-400 dark:text-slate-500 font-black uppercase text-xs tracking-widest hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Mégse</button>
              <button type="submit" className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all uppercase text-xs tracking-widest active:scale-95">Adatok Mentése</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ProductModify;