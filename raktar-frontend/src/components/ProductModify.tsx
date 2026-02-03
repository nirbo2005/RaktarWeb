import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProductById, updateProduct, restoreProduct } from "../services/api";
import { useAuth } from "../context/AuthContext";

function ProductModify() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isDeleted, setIsDeleted] = useState(false);
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
      .catch((err) => {
        console.error("Hiba a termék betöltésekor:", err);
        navigate("/");
      });
  }, [id, user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "lejarat") {
      setForm((prev) => ({ ...prev, lejarat: new Date(value) }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRestore = async () => {
    if (!id || !user) return;
    if (window.confirm("Biztosan visszaállítod ezt a terméket a készletbe?")) {
      try {
        await restoreProduct(Number(id), user.id);
        alert("Termék sikeresen visszaállítva!");
        navigate("/");
      } catch (err) {
        alert("Nem sikerült a visszaállítás." + err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;
    try {
      await updateProduct(
        Number(id),
        {
          nev: form.nev,
          gyarto: form.gyarto,
          lejarat: form.lejarat,
          ar: Number(form.ar),
          mennyiseg: Number(form.mennyiseg),
          parcella: form.parcella,
        },
        user.id,
      );
      navigate("/");
    } catch (err) {
      alert("Hiba történt a mentés során." + err);
    }
  };

  const inputStyle =
    "w-full p-2.5 bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block transition-all outline-none shadow-sm";
  const labelStyle = "block mb-1.5 text-sm font-semibold text-gray-600";

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-slate-50 p-4">
      {isDeleted && user?.admin && (
        <div className="w-full max-w-2xl mb-4 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3 text-amber-800">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-bold">
                Ez a termék jelenleg törölt állapotban van!
              </p>
              <p className="text-xs">
                Csak adminisztrátorként látod ezt az oldalt.
              </p>
            </div>
          </div>
          <button
            onClick={handleRestore}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all"
          >
            Visszaállítás
          </button>
        </div>
      )}

      <div
        className={`w-full max-w-2xl bg-white p-8 rounded-3xl shadow-2xl border ${isDeleted ? "border-amber-200" : "border-slate-100"}`}
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-indigo-100 rounded-2xl">
            <span className="text-2xl text-indigo-600 font-bold"># {id}</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-800 uppercase tracking-tight">
              Termék szerkesztése
            </h1>
            <p className="text-gray-400 text-sm font-medium italic">
              {form.nev || "Betöltés..."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className={labelStyle}>Termék megnevezése</label>
              <input
                name="nev"
                value={form.nev}
                onChange={handleChange}
                className={inputStyle}
                required
              />
            </div>
            <div>
              <label className={labelStyle}>Gyártó vállalat</label>
              <input
                name="gyarto"
                value={form.gyarto}
                onChange={handleChange}
                className={inputStyle}
                required
              />
            </div>
            <div>
              <label className={labelStyle}>Lejárati dátum</label>
              <input
                name="lejarat"
                type="date"
                className={inputStyle}
                value={form.lejarat.toISOString().split("T")[0]}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
            <div>
              <label className={labelStyle}>Egységár (Ft)</label>
              <input
                name="ar"
                type="number"
                value={form.ar}
                onChange={handleChange}
                className={inputStyle}
                required
              />
            </div>
            <div>
              <label className={labelStyle}>Mennyiség</label>
              <input
                name="mennyiseg"
                type="number"
                value={form.mennyiseg}
                onChange={handleChange}
                className={inputStyle}
                required
              />
            </div>
            <div>
              <label className={labelStyle}>Parcella</label>
              <input
                name="parcella"
                value={form.parcella}
                onChange={handleChange}
                className={inputStyle}
                required
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 pt-6">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex-1 px-6 py-3 bg-white border-2 border-gray-200 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition-all"
            >
              Mégse
            </button>
            <button
              type="submit"
              className="flex-[2] px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all transform active:scale-[0.98]"
            >
              Változtatások mentése
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductModify;
