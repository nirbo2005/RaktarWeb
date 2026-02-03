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
    await addProduct(
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
  };

  const inputStyle =
    "w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block transition-all outline-none";
  const labelStyle = "block mb-2 text-sm font-medium text-gray-700";

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            📦 Új termék rögzítése
          </h1>
          <button
            onClick={() => navigate("/")}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Vissza"
          >
            {" "}
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                placeholder="B szektor, 4. polc"
                className={inputStyle}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
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
          <div className="pt-4 text-right">
            <button
              type="submit"
              className="w-full md:w-auto px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95"
            >
              Termék hozzáadása
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductAdd;
