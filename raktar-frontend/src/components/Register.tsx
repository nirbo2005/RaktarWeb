/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../services/api";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nev: "", felhasznalonev: "", jelszo: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(form);
      alert("Sikeres regisztráció! Jelentkezz be.");
      navigate("/login");
    } catch (err: any) {
      setError(
        "Hiba a regisztráció során. Lehet, hogy már létezik ez a felhasználónév?",
      );
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Fiók létrehozása
        </h1>
        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Teljes név"
            onChange={(e) => setForm({ ...form, nev: e.target.value })}
            required
          />
          <input
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Felhasználónév"
            onChange={(e) =>
              setForm({ ...form, felhasznalonev: e.target.value })
            }
            required
          />
          <input
            type="password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Jelszó"
            onChange={(e) => setForm({ ...form, jelszo: e.target.value })}
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-all"
          >
            Regisztráció
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;
