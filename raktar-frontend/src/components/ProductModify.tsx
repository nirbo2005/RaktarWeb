/* eslint-disable @typescript-eslint/no-explicit-any */
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
  const [stockMode, setStockMode] = useState<StockMode>("add"); // Új: add (+) vagy remove (-)
  const [isDeleted, setIsDeleted] = useState(false);
  const [inputValue, setInputValue] = useState<number>(0); // Csak a bevitt szám
  
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
    getProductById(Number(id), user.admin)
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
      })
      .catch(() => navigate("/"));
  }, [id, user, navigate]);

  const handleStockUpdate = async () => {
    if (!id || !user) return;
    
    // Számítás a mód alapján
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
        user.id
      );
      navigate(`/product/${id}`);
    } catch (err) {
      alert("Hiba történt a mentés során.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "lejarat") {
      setForm((prev) => ({ ...prev, lejarat: new Date(value) }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDataSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;
    try {
      await updateProduct(
        Number(id),
        { ...form, ar: Number(form.ar), mennyiseg: Number(form.mennyiseg), isDeleted },
        user.id,
      );
      navigate(`/product/${id}`);
    } catch (err) { alert("Hiba a mentésnél."); }
  };

  const inputStyle = "w-full p-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900 dark:text-white text-center";
  const labelStyle = "block mb-2 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center";

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-500">
      
      {/* VÁLASZTÓ GOMBOK (Stock vs Data) */}
      {!isDeleted && (
        <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 mb-8 w-full max-w-md">
          <button 
            onClick={() => setViewMode("stock")}
            className={`flex-1 py-3 px-6 rounded-[1.5rem] font-black text-sm transition-all ${viewMode === "stock" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-slate-400 hover:text-slate-600"}`}
          >
            📦 Készletkezelés
          </button>
          <button 
            onClick={() => setViewMode("data")}
            className={`flex-1 py-3 px-6 rounded-[1.5rem] font-black text-sm transition-all ${viewMode === "data" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:text-slate-600"}`}
          >
            📝 Adatok
          </button>
        </div>
      )}

      <div className={`w-full max-w-2xl bg-white dark:bg-slate-900/60 p-10 rounded-[3rem] shadow-2xl border backdrop-blur-2xl transition-all ${isDeleted ? "opacity-40 grayscale pointer-events-none" : "dark:border-slate-800"}`}>
        
        {viewMode === "stock" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center">
              <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter uppercase italic">Készlet frissítése</h2>
              <p className="text-slate-400 font-bold mt-1 uppercase text-[10px] tracking-widest">{form.nev}</p>
            </div>

            {/* Jelenlegi kijelző */}
            <div className="text-center py-4">
              <span className="block text-xs font-black text-slate-300 dark:text-slate-600 uppercase mb-2 tracking-widest">Jelenlegi állomány</span>
              <span className="text-6xl font-black text-slate-800 dark:text-white tracking-tighter">
                {form.mennyiseg} <span className="text-2xl text-slate-400 font-medium">db</span>
              </span>
            </div>

            {/* + / - Gombok egymás mellett */}
            <div className="flex gap-4 max-w-xs mx-auto">
              <button 
                type="button"
                onClick={() => setStockMode("add")}
                className={`flex-1 py-4 rounded-2xl font-black text-2xl transition-all border-2 ${stockMode === "add" ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-transparent border-slate-200 text-slate-400"}`}
              >
                +
              </button>
              <button 
                type="button"
                onClick={() => setStockMode("remove")}
                className={`flex-1 py-4 rounded-2xl font-black text-2xl transition-all border-2 ${stockMode === "remove" ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-500/20" : "bg-transparent border-slate-200 text-slate-400"}`}
              >
                -
              </button>
            </div>

            {/* Számos input */}
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

            {/* Eredmény előnézet */}
            {inputValue > 0 && (
              <div className={`text-center px-6 py-3 rounded-2xl font-black uppercase text-sm animate-in zoom-in-95 ${stockMode === "add" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                Új készlet: {stockMode === "add" ? form.mennyiseg + inputValue : form.mennyiseg - inputValue} db
              </div>
            )}

            <div className="flex gap-4 pt-4 border-t border-slate-50 dark:border-slate-800">
              <button onClick={() => navigate(-1)} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs tracking-widest">Mégse</button>
              <button 
                onClick={handleStockUpdate}
                disabled={inputValue === 0}
                className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-500/20 hover:bg-blue-500 transition-all active:scale-95 disabled:opacity-20 uppercase text-xs tracking-widest"
              >
                Változtatás mentése
              </button>
            </div>
          </div>
        )}

        {viewMode === "data" && (
          <form onSubmit={handleDataSubmit} className="space-y-6 animate-in fade-in duration-500 text-left">
            <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter uppercase italic mb-8">Alapadatok módosítása</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block mb-2 text-xs font-black text-slate-400 uppercase tracking-widest">Termék neve</label>
                <input name="nev" value={form.nev} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900 dark:text-white" required />
              </div>
              <div>
                <label className="block mb-2 text-xs font-black text-slate-400 uppercase tracking-widest">Gyártó</label>
                <input name="gyarto" value={form.gyarto} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900 dark:text-white" required />
              </div>
              <div>
                <label className="block mb-2 text-xs font-black text-slate-400 uppercase tracking-widest">Lejárat</label>
                <input name="lejarat" type="date" value={form.lejarat.toISOString().split("T")[0]} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900 dark:text-white" required />
              </div>
              <div>
                <label className="block mb-2 text-xs font-black text-slate-400 uppercase tracking-widest">Ár (Ft)</label>
                <input name="ar" type="number" value={form.ar} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900 dark:text-white" required />
              </div>
              <div>
                <label className="block mb-2 text-xs font-black text-slate-400 uppercase tracking-widest">Parcella</label>
                <input name="parcella" value={form.parcella} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900 dark:text-white" required />
              </div>
            </div>
            <div className="flex gap-4 pt-6 border-t border-slate-50 dark:border-slate-800">
              <button type="button" onClick={() => navigate(-1)} className="flex-1 py-4 text-slate-400 dark:text-slate-500 font-black uppercase text-xs tracking-widest">Mégse</button>
              <button type="submit" className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all uppercase text-xs tracking-widest">Mentés</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ProductModify;