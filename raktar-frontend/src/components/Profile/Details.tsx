//raktar-frontend/src/components/Profile/Details.tsx
import { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateProfile, submitChangeRequest } from "../../services/api";
import Swal from 'sweetalert2';

import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import hu from 'react-phone-input-2/lang/hu.json';

const MySwal = Swal.mixin({
  customClass: {
    popup: 'rounded-[2.5rem] bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl',
    confirmButton: 'bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest mx-2 transition-all active:scale-95',
    cancelButton: 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest mx-2 transition-all active:scale-95',
  },
  buttonsStyling: false,
});

const toast = MySwal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: 'rgb(15, 23, 42)',
  color: '#fff'
});

const Details = () => {
  const { user, setUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const [profileForm, setProfileForm] = useState({
    felhasznalonev: user?.felhasznalonev || "",
    nev: user?.nev || "",
    email: user?.email || "",
    telefonszam: user?.telefonszam || "",
    regiJelszo: "",
    ujJelszo: "",
  });

  const isAdmin = user?.rang === "ADMIN";

  const validateField = (name: string, value: string) => {
    let error = "";
    switch (name) {
      case "nev":
        if (!value) error = "A név nem lehet üres!";
        else if (!/^[a-zA-ZÁÉÍÓÖŐÚÜŰáéíóöőúüű\s-]+$/.test(value)) error = "A név nem tartalmazhat számokat!";
        break;
      case "email":
        if (!/\S+@\S+\.\S+/.test(value)) error = "Érvénytelen email formátum!";
        break;
      case "telefonszam":
        if (!value || value.length < 5) error = "A telefonszám megadása kötelező!";
        break;
    }
    setFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  const isDirty = useMemo(() => {
    if (!user) return false;
    return (
      profileForm.nev !== user.nev ||
      profileForm.felhasznalonev !== user.felhasznalonev ||
      profileForm.email !== (user.email || "") ||
      profileForm.telefonszam !== (user.telefonszam || "") ||
      profileForm.ujJelszo !== ""
    );
  }, [profileForm, user]);

  const hasErrors = useMemo(() => Object.values(fieldErrors).some(err => err !== ""), [fieldErrors]);

  const isNameChanged = !isAdmin && profileForm.nev !== user?.nev;

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileForm.telefonszam || profileForm.telefonszam.length < 5) {
      setFormError("A telefonszám megadása kötelező!");
      return;
    }

    if (!isDirty) {
      toast.fire({ icon: 'info', title: 'Még minden a régi... 😴' });
      return;
    }

    if (hasErrors) {
      setFormError("Kérjük, javítsd a hibákat mentés előtt!");
      return;
    }

    setFormError(null);
    try {
      if (isNameChanged) {
        await submitChangeRequest({ userId: user!.id, tipus: "NEV_MODOSITAS", ujErtek: profileForm.nev });
      }

      const updateData: any = {
        felhasznalonev: profileForm.felhasznalonev,
        email: profileForm.email,
        telefonszam: profileForm.telefonszam.startsWith('+') ? profileForm.telefonszam : `+${profileForm.telefonszam}`,
      };

      if (profileForm.ujJelszo) {
        if (!profileForm.regiJelszo) throw new Error("A régi jelszó kötelező!");
        updateData.regiJelszo = profileForm.regiJelszo;
        updateData.ujJelszo = profileForm.ujJelszo;
      }
      if (isAdmin) updateData.nev = profileForm.nev;

      const updatedUser = await updateProfile(user!.id, updateData);
      setUser(updatedUser);
      setProfileForm((prev) => ({ ...prev, regiJelszo: "", ujJelszo: "" }));
      toast.fire({ icon: 'success', title: 'Adatok frissítve! ✨' });
    } catch (err: any) {
      setFormError(err.message || "Hiba történt!");
    }
  };

  const labelClass = "block mb-1.5 ml-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest";
  const inputClass = "w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all";
  const errorTextClass = "text-[9px] text-red-500 font-bold mt-1 ml-2 uppercase animate-pulse";

  return (
    <div className="p-8 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2">
      <form onSubmit={handleUpdateSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 1. SOR: NÉV ÉS TELEFON */}
          <div>
            <label className={labelClass}>Teljes név</label>
            <input 
              type="text" 
              value={profileForm.nev} 
              onChange={(e) => setProfileForm({ ...profileForm, nev: e.target.value })} 
              onBlur={(e) => validateField("nev", e.target.value)}
              className={`${inputClass} ${fieldErrors.nev ? 'border-red-500' : ''} ${isNameChanged ? 'border-amber-400 ring-1 ring-amber-400/20' : ''}`} 
            />
            {fieldErrors.nev && <p className={errorTextClass}>❌ {fieldErrors.nev}</p>}
            {isNameChanged && <p className="mt-2 ml-2 text-[9px] font-bold text-amber-600 dark:text-amber-500 uppercase italic">⚠️ Admin jóváhagyás szükséges</p>}
          </div>

          <div className="relative">
            <label className={labelClass}>Telefonszám (Nemzetközi) *</label>
            <PhoneInput
              country={'hu'}
              value={profileForm.telefonszam}
              onChange={(phone) => {
                setProfileForm({ ...profileForm, telefonszam: phone });
                if (fieldErrors.telefonszam) validateField("telefonszam", phone);
              }}
              onBlur={() => validateField("telefonszam", profileForm.telefonszam)}
              localization={hu}
              masks={{ hu: '.. ... ....' }}
              countryCodeEditable={false} 
              enableSearch={true}
              searchPlaceholder="Keresés..."
              searchNotFound="Nincs találat"
              containerClass="phone-container"
              inputClass={`phone-input-field ${fieldErrors.telefonszam ? '!border-red-500' : ''}`}
              buttonClass="phone-dropdown-btn"
              dropdownClass="phone-dropdown-list"
              enableLongNumbers={false}
              dropdownStyle={{ height: '350px' }}
            />
            {fieldErrors.telefonszam && <p className={errorTextClass}>❌ {fieldErrors.telefonszam}</p>}
          </div>

          {/* 2. SOR: FELHASZNÁLÓNÉV ÉS EMAIL */}
          <div>
            <label className={labelClass}>Felhasználónév</label>
            <input 
              type="text" 
              value={profileForm.felhasznalonev} 
              onChange={(e) => setProfileForm({ ...profileForm, felhasznalonev: e.target.value })} 
              className={inputClass} 
            />
          </div>
          
          <div>
            <label className={labelClass}>Email cím</label>
            <input 
              type="email" 
              value={profileForm.email} 
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} 
              onBlur={(e) => validateField("email", e.target.value)}
              className={`${inputClass} ${fieldErrors.email ? 'border-red-500' : ''}`} 
            />
            {fieldErrors.email && <p className={errorTextClass}>❌ {fieldErrors.email}</p>}
          </div>
          
          {/* JELSZÓ MEZŐK */}
          <div className="relative">
            <label className={labelClass}>Régi jelszó</label>
            <input type={showOldPass ? "text" : "password"} value={profileForm.regiJelszo} onChange={(e) => setProfileForm({ ...profileForm, regiJelszo: e.target.value })} className={inputClass} />
            <button type="button" onClick={() => setShowOldPass(!showOldPass)} className="absolute right-3 top-8 text-lg">{showOldPass ? "👁️" : "🙈"}</button>
          </div>
          <div className="relative">
            <label className={labelClass}>Új jelszó</label>
            <input type={showNewPass ? "text" : "password"} value={profileForm.ujJelszo} onChange={(e) => setProfileForm({ ...profileForm, ujJelszo: e.target.value })} className={inputClass} />
            <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-8 text-lg">{showNewPass ? "👁️" : "🙈"}</button>
          </div>
        </div>

        {formError && <div className="text-red-600 text-[10px] font-black uppercase bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-200 dark:border-red-900/30">❌ {formError}</div>}

        <button 
          type="submit" 
          disabled={hasErrors}
          className={`w-full p-4 rounded-xl font-black uppercase text-xs shadow-lg transition-all active:scale-95 ${(!isDirty || hasErrors) ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none' : isNameChanged ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
        >
          {hasErrors ? 'Javítsd a hibákat...' : !isDirty ? '🤔 Semmi nem változott...' : isNameChanged ? '💾 Mentés és Névkérés' : '💾 Adatok mentése'}
        </button>
      </form>

      <style>{`
        .phone-container { width: 100% !important; font-family: inherit !important; }
        .phone-input-field { 
          width: 100% !important; height: 46px !important; border-radius: 0.75rem !important;
          border: 1px solid rgb(226 232 240) !important; background: rgb(248 250 252) !important;
          padding-left: 58px !important; font-size: 0.875rem !important; transition: all 0.2s !important;
        }
        .dark .phone-input-field { 
          background: rgb(30 41 59) !important; border-color: rgb(51 65 85) !important; color: white !important;
        }

        /* GOMB HÁTTÉR JAVÍTÁSA */
        .phone-dropdown-btn { 
          background: transparent !important; border: none !important; 
          border-radius: 0.75rem 0 0 0.75rem !important; width: 48px !important;
        }
        .phone-container .flag-dropdown,
        .phone-container .selected-flag {
          background: transparent !important;
        }
        .phone-container .selected-flag:hover, 
        .phone-container .selected-flag:focus,
        .phone-container .flag-dropdown.open .selected-flag {
          background: rgba(0, 0, 0, 0.05) !important;
        }
        .dark .phone-container .selected-flag:hover, 
        .dark .phone-container .selected-flag:focus,
        .dark .phone-container .flag-dropdown.open .selected-flag {
          background: rgba(255, 255, 255, 0.05) !important;
        }
        /* --- */

        .phone-dropdown-list { 
          background: white !important; border-radius: 1rem !important; 
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1) !important; border: 1px solid #eee !important;
          z-index: 50 !important;
        }
        .dark .phone-dropdown-list { background: rgb(15 23 42) !important; border-color: rgb(51 65 85) !important; color: white !important; }
        .dark .search-box { background: rgb(30 41 59) !important; color: white !important; border: 1px solid rgb(51 65 85) !important; }
        .dark .phone-dropdown-list .country:hover { background: rgb(30 41 59) !important; }
        .phone-dropdown-list::-webkit-scrollbar { width: 6px; }
        .phone-dropdown-list::-webkit-scrollbar-thumb { background: #444; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Details;