/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // Link hozzáadva
import { login } from "../services/api";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [form, setForm] = useState({ felhasznalonev: "", jelszo: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const data = await login(form.felhasznalonev, form.jelszo);
      loginUser(data);
      navigate("/");
    } catch (err: any) {
      setError("Hibás felhasználónév vagy jelszó!");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center transition-colors duration-500">
      <div className="bg-white dark:bg-slate-900/80 p-8 rounded-[2rem] shadow-2xl w-full max-w-md border border-gray-100 dark:border-slate-800 backdrop-blur-xl">
        <h1 className="text-3xl font-black text-gray-800 dark:text-white mb-6 text-center italic uppercase tracking-tighter">
          Bejelentkezés
        </h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl py-3 mb-4">
             <p className="text-red-500 text-sm text-center font-bold">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            className="w-full px-5 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="Felhasználónév"
            onChange={(e) => setForm({ ...form, felhasznalonev: e.target.value })}
            required
          />
          <input
            type="password"
            className="w-full px-5 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="Jelszó"
            onChange={(e) => setForm({ ...form, jelszo: e.target.value })}
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 uppercase tracking-widest text-xs"
          >
            Belépés a rendszerbe
          </button>
        </form>

        {/* REGISZTRÁCIÓS SZEKCIÓ */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800 text-center">
          <p className="text-gray-500 dark:text-slate-400 text-sm font-medium mb-3">
            Még nincs fiókod?
          </p>
          <Link 
            to="/register" 
            className="text-blue-600 dark:text-blue-400 font-black uppercase text-xs tracking-widest hover:underline"
          >
            Új fiók regisztrálása
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;