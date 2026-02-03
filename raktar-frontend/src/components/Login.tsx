/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/api";
import { useAuth } from "../context/AuthContext"; // Importáljuk a contextet

function Login() {
  const navigate = useNavigate();
  const { loginUser } = useAuth(); // Megkapjuk a loginUser függvényt
  const [form, setForm] = useState({ felhasznalonev: "", jelszo: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const data = await login(form.felhasznalonev, form.jelszo);
      loginUser(data); // Elmentjük a tokent és a user-t a contextbe
      navigate("/"); // Irány a főoldal
    } catch (err: any) {
      setError("Hibás felhasználónév vagy jelszó!");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Bejelentkezés</h1>
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            placeholder="Felhasználónév"
            onChange={(e) => setForm({ ...form, felhasznalonev: e.target.value })}
            required
          />
          <input
            type="password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            placeholder="Jelszó"
            onChange={(e) => setForm({ ...form, jelszo: e.target.value })}
            required
          />
          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-all">
            Belépés
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;