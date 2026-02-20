//raktar-frontend/src/components/ForgotPassword.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { forgotPassword } from "../../services/api";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import hu from 'react-phone-input-2/lang/hu.json';
import Swal from 'sweetalert2';

const MySwal = Swal.mixin({
  customClass: {
    popup: 'rounded-[2.5rem] bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl font-sans',
    confirmButton: 'bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 mx-2',
  },
  buttonsStyling: false,
});

function ForgotPassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    felhasznalonev: "",
    email: "",
    telefonszam: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.felhasznalonev || !form.email || !form.telefonszam || form.telefonszam.length < 5) {
      setError("Kérjük, tölts ki minden mezőt érvényes adatokkal!");
      return;
    }
    
    setLoading(true);
    try {
      const submitData = {
        ...form,
        telefonszam: form.telefonszam.startsWith('+') ? form.telefonszam : `+${form.telefonszam}`
      };

      const data = await forgotPassword(submitData);
      
      MySwal.fire({
        icon: 'success',
        title: 'Sikeres azonosítás!',
        html: `
          <p class="text-slate-500 dark:text-slate-400 text-sm mb-4">A rendszer legenerálta az ideiglenes jelszavadat. Kérjük, másold ki, mert csak most látod!</p>
          <div class="bg-slate-100 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 select-all font-mono text-2xl font-black tracking-widest text-blue-600 dark:text-blue-400">
            ${data.tempPassword}
          </div>
          <p class="text-[10px] uppercase font-bold text-red-500 mt-4 tracking-widest">Belépés után kötelező lesz megváltoztatnod!</p>
        `,
        confirmButtonText: 'Irány a belépés',
        allowOutsideClick: false,
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/login");
        }
      });
      
    } catch (err: any) {
      const errorMsg = err.message || "Hiba az adatok ellenőrzésekor.";
      setError(errorMsg);

      MySwal.fire({
        icon: 'error',
        title: 'Hiba történt',
        text: errorMsg,
        confirmButtonText: 'Értem'
      });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = `w-full px-5 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm`;
  const labelStyle = "block mb-1.5 ml-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-left";

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-gray-100 dark:border-slate-800 transition-colors">
        <h1 className="text-3xl font-black text-gray-800 dark:text-white mb-2 text-center italic uppercase tracking-tighter">
          Jelszó <span className="text-blue-600">visszaállítás</span>
        </h1>
        <p className="text-slate-400 text-xs text-center font-bold mb-8 uppercase tracking-widest leading-relaxed">
          Kérjük, add meg a fiókodhoz tartozó biztonsági adatokat a jelszó cseréjéhez.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl py-3 mb-6 text-center px-4 animate-in zoom-in-95">
            <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelStyle}>Felhasználónév</label>
            <input
              className={inputStyle}
              placeholder="Pl. kjanos88"
              value={form.felhasznalonev}
              onChange={(e) => setForm({ ...form, felhasznalonev: e.target.value })}
              required
            />
          </div>

          <div>
            <label className={labelStyle}>Regisztrált Email</label>
            <input
              type="email"
              className={inputStyle}
              placeholder="pelda@email.hu"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className={labelStyle}>Regisztrált Telefonszám</label>
            <PhoneInput
              country={'hu'}
              value={form.telefonszam}
              onChange={(phone) => setForm({ ...form, telefonszam: phone })}
              localization={hu}
              masks={{ hu: '.. ... ....' }} /* ÚJ MASZK: a helyes tagoláshoz */
              countryCodeEditable={false}
              enableSearch={true}
              searchPlaceholder="Keresés..."
              containerClass="phone-container-fp"
              inputClass="phone-input-fp"
              buttonClass="phone-button-fp"
              dropdownClass="phone-dropdown-fp"
              dropdownStyle={{ height: '300px' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 uppercase tracking-widest text-xs mt-6 disabled:opacity-50"
          >
            {loading ? "Ellenőrzés..." : "Új jelszó kérése"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800 text-center">
          <Link
            to="/login"
            className="text-slate-500 dark:text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-blue-500 transition-all"
          >
            ← Vissza a bejelentkezéshez
          </Link>
        </div>
      </div>

      <style>{`
        .phone-container-fp { width: 100% !important; text-align: left; }
        .phone-input-fp { 
          width: 100% !important; height: 46px !important; border-radius: 1rem !important;
          border: 1px solid rgb(226 232 240) !important; background: rgb(249 250 251) !important;
          padding-left: 58px !important; font-size: 0.875rem !important; color: #111827 !important;
          transition: all 0.2s !important;
        }
        .dark .phone-input-fp { 
          background: rgba(30, 41, 59, 0.5) !important; border-color: rgb(51 65 85) !important; color: white !important;
        }
        .phone-input-fp:focus { border-color: rgb(37 99 235) !important; }
        
        /* GOMB HÁTTÉR JAVÍTÁSA */
        .phone-button-fp { 
          background: transparent !important; border: none !important; 
          border-radius: 1rem 0 0 1rem !important; width: 48px !important;
        }
        .phone-container-fp .flag-dropdown,
        .phone-container-fp .selected-flag {
          background: transparent !important;
        }
        .phone-container-fp .selected-flag:hover, 
        .phone-container-fp .selected-flag:focus,
        .phone-container-fp .flag-dropdown.open .selected-flag {
          background: rgba(0, 0, 0, 0.05) !important;
        }
        .dark .phone-container-fp .selected-flag:hover, 
        .dark .phone-container-fp .selected-flag:focus,
        .dark .phone-container-fp .flag-dropdown.open .selected-flag {
          background: rgba(255, 255, 255, 0.05) !important;
        }
        /* --- */

        .phone-dropdown-fp { 
          background: white !important; border-radius: 1rem !important; color: #111827 !important;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1) !important;
        }
        .dark .phone-dropdown-fp { 
          background: rgb(15, 23, 42) !important; color: white !important; border-color: rgb(51 65 85) !important;
        }
        .dark .country-list { background: rgb(15, 23, 42) !important; }
        .dark .phone-dropdown-fp .country:hover { background: rgb(30, 41, 59) !important; }
        .dark .phone-dropdown-fp .search { background: rgb(15, 23, 42) !important; }
        .dark .phone-dropdown-fp .search-box { background: rgb(30, 41, 59) !important; color: white !important; border-color: rgb(51 65 85) !important; }
      `}</style>
    </div>
  );
}

export default ForgotPassword;