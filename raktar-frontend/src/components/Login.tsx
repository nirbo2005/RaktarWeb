/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 transition-all">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-6 text-center italic uppercase tracking-tighter transition-colors">
          Bejelentkezés
        </h1>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl py-3 mb-4 text-center">
            <p className="text-red-600 dark:text-red-400 text-sm font-bold">
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-1.5 ml-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">
              Felhasználónév
            </label>
            <input
              className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none transition-all"
              placeholder="Adja meg a nevét..."
              value={form.felhasznalonev}
              onChange={(e) =>
                setForm({ ...form, felhasznalonev: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block mb-1.5 ml-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">
              Jelszó
            </label>
            <input
              type="password"
              className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none transition-all"
              placeholder="••••••••"
              value={form.jelszo}
              onChange={(e) => setForm({ ...form, jelszo: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-600/20 active:scale-95 uppercase tracking-widest text-xs mt-2 transition-all"
          >
            Belépés a rendszerbe
          </button>
        </form>
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-3 transition-colors">
            Még nincs fiókod?
          </p>
          <Link
            to="/register"
            className="text-blue-600 dark:text-blue-400 font-black uppercase text-xs tracking-widest hover:text-blue-500 transition-colors"
          >
            Új fiók regisztrálása
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
