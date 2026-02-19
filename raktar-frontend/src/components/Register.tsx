//raktar-frontend/src/components/Register.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../services/api";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import hu from 'react-phone-input-2/lang/hu.json';
import Swal from 'sweetalert2';

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nev: "",
    felhasznalonev: "",
    jelszo: "",
    email: "",
    telefonszam: "",
  });

  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [generalError, setGeneralError] = useState("");

  const validateField = (name: string, value: string) => {
    let error = "";
    
    switch (name) {
      case "nev":
        if (!value) error = "A név kötelező!";
        else if (!/^[a-zA-ZÁÉÍÓÖŐÚÜŰáéíóöőúüű\s-]+$/.test(value)) error = "A név nem tartalmazhat számokat!";
        else if (value.trim().split(" ").length < 2) error = "Vezetéknév és keresztnév is kell!";
        break;
      case "felhasznalonev":
        if (value.length < 4) error = "Minimum 4 karakter!";
        break;
      case "email":
        if (!/\S+@\S+\.\S+/.test(value)) error = "Érvénytelen email formátum!";
        break;
      case "telefonszam":
        // A PhoneInput-ban a hívókód miatt a hossz minimum 3-4 (pl +36)
        if (!value || value.length < 5) error = "A telefonszám megadása kötelező!";
        break;
      case "jelszo":
        if (value.length < 6) error = "Minimum 6 karakter!";
        break;
    }

    setFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    // Végső ellenőrzés: minden mező ki van-e töltve és nincs-e hiba
    const hasEmptyFields = !form.nev || !form.felhasznalonev || !form.email || !form.jelszo || !form.telefonszam;
    const hasErrors = Object.values(fieldErrors).some(err => err !== "");

    if (hasEmptyFields || hasErrors) {
      setGeneralError("Kérjük, tölts ki minden mezőt megfelelően!");
      return;
    }
    
    try {
      // Telefonszám prefix biztosítása
      const submitData = {
        ...form,
        telefonszam: form.telefonszam.startsWith('+') ? form.telefonszam : `+${form.telefonszam}`
      };

      await register(submitData);
      
      Swal.fire({
        icon: 'success',
        title: 'Sikeres regisztráció!',
        text: 'Most már bejelentkezhetsz.',
        timer: 3000,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#fff'
      });
      
      navigate("/login");
    } catch (err: any) {
      // A javított handleResponse-ból érkező konkrét hibaüzenet megjelenítése
      setGeneralError(err.message || "Hiba a regisztráció során.");
    }
  };

  const inputStyle = (fieldName: string) => `
    w-full px-5 py-3 bg-gray-50 dark:bg-slate-800/50 border rounded-2xl text-gray-900 dark:text-white 
    placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm
    ${fieldErrors[fieldName] ? "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]" : "border-gray-300 dark:border-slate-700"}
  `;
  
  const labelStyle = "block mb-1.5 ml-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest";
  const errorStyle = "text-[9px] text-red-500 font-bold mt-1 ml-2 uppercase tracking-tighter animate-in fade-in slide-in-from-left-1";

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-gray-100 dark:border-slate-800 backdrop-blur-xl">
        <h1 className="text-3xl font-black text-gray-800 dark:text-white mb-6 text-center italic uppercase tracking-tighter">
          Fiók létrehozása
        </h1>

        {generalError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl py-3 mb-4 text-center px-4 animate-in zoom-in-95">
            <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{generalError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Teljes Név */}
            <div>
              <label className={labelStyle}>Teljes Név *</label>
              <input
                className={inputStyle("nev")}
                placeholder="Pl. Kovács János"
                value={form.nev}
                onChange={(e) => setForm({ ...form, nev: e.target.value })}
                onBlur={(e) => validateField("nev", e.target.value)}
                required
              />
              {fieldErrors.nev && <p className={errorStyle}>❌ {fieldErrors.nev}</p>}
            </div>

            {/* Felhasználónév */}
            <div>
              <label className={labelStyle}>Felhasználónév *</label>
              <input
                className={inputStyle("felhasznalonev")}
                placeholder="kjanos88"
                value={form.felhasznalonev}
                onChange={(e) => setForm({ ...form, felhasznalonev: e.target.value })}
                onBlur={(e) => validateField("felhasznalonev", e.target.value)}
                required
              />
              {fieldErrors.felhasznalonev && <p className={errorStyle}>❌ {fieldErrors.felhasznalonev}</p>}
            </div>

            {/* Email */}
            <div>
              <label className={labelStyle}>Email cím *</label>
              <input
                type="email"
                className={inputStyle("email")}
                placeholder="pelda@email.hu"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onBlur={(e) => validateField("email", e.target.value)}
                required
              />
              {fieldErrors.email && <p className={errorStyle}>❌ {fieldErrors.email}</p>}
            </div>

            {/* Telefonszám */}
            <div>
              <label className={labelStyle}>Telefonszám (Nemzetközi) *</label>
              <PhoneInput
                country={'hu'}
                value={form.telefonszam}
                onChange={(phone) => setForm({ ...form, telefonszam: phone })}
                onBlur={() => validateField("telefonszam", form.telefonszam)}
                localization={hu}
                countryCodeEditable={false}
                enableSearch={true}
                searchPlaceholder="Keresés..."
                containerClass="phone-container-reg"
                inputClass={`phone-input-reg ${fieldErrors.telefonszam ? '!border-red-500' : ''}`}
                buttonClass="phone-button-reg"
                dropdownClass="phone-dropdown-reg"
                dropdownStyle={{ height: '300px' }}
              />
              {fieldErrors.telefonszam && <p className={errorStyle}>❌ {fieldErrors.telefonszam}</p>}
            </div>

            {/* Jelszó */}
            <div>
              <label className={labelStyle}>Jelszó *</label>
              <input
                type="password"
                className={inputStyle("jelszo")}
                placeholder="••••••••"
                value={form.jelszo}
                onChange={(e) => setForm({ ...form, jelszo: e.target.value })}
                onBlur={(e) => validateField("jelszo", e.target.value)}
                required
              />
              {fieldErrors.jelszo && <p className={errorStyle}>❌ {fieldErrors.jelszo}</p>}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 uppercase tracking-widest text-xs mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Regisztráció véglegesítése
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800 text-center">
          <Link
            to="/login"
            className="text-blue-600 dark:text-blue-400 font-black uppercase text-[10px] tracking-widest hover:underline transition-all"
          >
            Vissza a bejelentkezéshez
          </Link>
        </div>
      </div>

      <style>{`
        .phone-container-reg { width: 100% !important; }
        .phone-input-reg { 
          width: 100% !important; height: 46px !important; border-radius: 1rem !important;
          border: 1px solid rgb(226 232 240) !important; background: rgb(249 250 251) !important;
          padding-left: 58px !important; font-size: 0.875rem !important; color: #111827 !important;
          transition: all 0.2s !important;
        }
        .dark .phone-input-reg { 
          background: rgba(30, 41, 59, 0.5) !important; border-color: rgb(51 65 85) !important; color: white !important;
        }
        .phone-input-reg:focus { border-color: rgb(37 99 235) !important; }
        
        .phone-button-reg { 
          background: transparent !important; border: none !important; 
          border-radius: 1rem 0 0 1rem !important; width: 48px !important;
        }
        .phone-dropdown-reg { 
          background: white !important; border-radius: 1rem !important; color: #111827 !important;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1) !important;
        }
        .dark .phone-dropdown-reg { 
          background: rgb(15, 23, 42) !important; color: white !important; border-color: rgb(51 65 85) !important;
        }
        .dark .phone-dropdown-reg .country:hover { background: rgb(30, 41, 59) !important; }
        .dark .phone-dropdown-reg .search { background: rgb(15, 23, 42) !important; }
        .dark .phone-dropdown-reg .search-box { background: rgb(30, 41, 59) !important; color: white !important; border-color: rgb(51 65 85) !important; }
      `}</style>
    </div>
  );
}

export default Register;