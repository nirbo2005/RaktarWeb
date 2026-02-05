import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addProduct } from "../services/api";
import { useAuth } from "../context/AuthContext";

function ProductAdd() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    nev: "",
    gyarto: "",
    lejarat: new Date(),
    ar: 0,
    mennyiseg: 0,
    parcella: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "lejarat") {
      setForm((prev) => ({
        ...prev,
        lejarat: new Date(value),
      }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Hiba: Nem sikerült azonosítani a felhasználót a naplózáshoz!");
      return;
    }

    try {
      await addProduct(
        {
          nev: form.nev,
          gyarto: form.gyarto,
          lejarat: form.lejarat,
          ar: Number(form.ar),
          mennyiseg: Number(form.mennyiseg),
          parcella: form.parcella,
          isDeleted: false, // JAVÍTÁS: Itt adjuk meg az alapértelmezett értéket
        },
        user.id,
      );
      navigate("/");
    } catch (error) {
      alert("Hiba történt a termék hozzáadása során.");
    }
  };

  const inputStyle =
    "w-full p-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white text-sm rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block transition-all outline-none placeholder-gray-400";
  const labelStyle = "block mb-2 text-xs font-black text-gray-700 dark:text-slate-400 uppercase tracking-widest";

  return (
    <div className="flex items-center justify-center min-h-[80vh] transition-colors duration-500">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900/80 p-8 md:p-10 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-slate-800 backdrop-blur-xl">
        
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-3xl font-black text-gray-800 dark:text-white italic uppercase tracking-tighter">
            📦 Új termék <span className="text-blue-600">rögzítése</span>
          </h1>
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-gray-400 hover:text-red-500 transition-all active:scale-90"
            title="Vissza"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelStyle}>Termék név</label>
              <input
                name="nev"
                placeholder="Pl. Acélcsavar"
                className={inputStyle}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className={labelStyle}>Gyártó</label>
              <input
                name="gyarto"
                placeholder="Pl. IronWorks Kft."
                className={inputStyle}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelStyle}>Lejárati idő</label>
              <input
                name="lejarat"
                type="date"
                className={inputStyle}
                value={form.lejarat.toISOString().split("T")[0]}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className={labelStyle}>Parcella / Helyszín</label>
              <input
                name="parcella"
                placeholder="Pl. B2-4"
                className={inputStyle}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t dark:border-slate-800 pt-6">
            <div>
              <label className={labelStyle}>Egységár (Ft)</label>
              <input
                name="ar"
                type="number"
                placeholder="0"
                className={inputStyle}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className={labelStyle}>Mennyiség</label>
              <input
                name="mennyiseg"
                type="number"
                placeholder="0"
                className={inputStyle}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-95 uppercase tracking-widest text-xs"
            >
              Hozzáadás a készlethez
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductAdd;