// raktar-frontend/src/components/Profile/ProfileDetails.tsx
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { updateProfile, submitChangeRequest } from "../../services/api";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import hu from "react-phone-input-2/lang/hu.json";

const MySwal = Swal.mixin({
  customClass: {
    popup: "rounded-[2.5rem] bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl",
    confirmButton: "bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest mx-2 transition-all active:scale-95",
    cancelButton: "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest mx-2 transition-all active:scale-95",
  },
  buttonsStyling: false,
});

const toast = MySwal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: "rgb(15, 23, 42)",
  color: "#fff",
});

const ProfileDetails = () => {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const { t } = useTranslation();

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

  if (!user) return null;
  const isAdmin = user.rang === "ADMIN";
  const isKezelo = user.rang === "KEZELO" || isAdmin;

  const validateField = (name: string, value: string) => {
    let error = "";
    switch (name) {
      case "nev":
        if (!value) error = t("details.validation.nameEmpty");
        else if (!/^[a-zA-ZÁÉÍÓÖŐÚÜŰáéíóöőúüű\s-]+$/.test(value))
          error = t("details.validation.nameNumbers");
        break;
      case "email":
        if (!/\S+@\S+\.\S+/.test(value))
          error = t("details.validation.emailInvalid");
        break;
      case "telefonszam":
        if (!value || value.length < 5)
          error = t("details.validation.phoneRequired");
        break;
    }
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
  };

  const isDirty = useMemo(() => {
    return (
      profileForm.nev !== user.nev ||
      profileForm.felhasznalonev !== user.felhasznalonev ||
      profileForm.email !== (user.email || "") ||
      profileForm.telefonszam !== (user.telefonszam || "") ||
      profileForm.ujJelszo !== ""
    );
  }, [profileForm, user]);

  const hasErrors = useMemo(
    () => Object.values(fieldErrors).some((err) => err !== ""),
    [fieldErrors],
  );

  const isNameChanged = !isAdmin && profileForm.nev !== user?.nev;

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.telefonszam || profileForm.telefonszam.length < 5) {
      setFormError(t("details.validation.phoneRequired"));
      return;
    }
    if (!isDirty) {
      toast.fire({ icon: "info", title: t("details.alerts.noChanges") });
      return;
    }
    if (hasErrors) {
      setFormError(t("details.alerts.fixBeforeSave"));
      return;
    }

    setFormError(null);
    try {
      if (isNameChanged) {
        await submitChangeRequest({
          userId: user.id,
          tipus: "NEV_MODOSITAS",
          ujErtek: profileForm.nev,
        });
      }

      const updateData: any = {
        felhasznalonev: profileForm.felhasznalonev,
        email: profileForm.email,
        telefonszam: profileForm.telefonszam.startsWith("+")
          ? profileForm.telefonszam
          : `+${profileForm.telefonszam}`,
      };

      if (profileForm.ujJelszo) {
        if (!profileForm.regiJelszo)
          throw new Error(t("details.alerts.oldPassRequired"));
        updateData.regiJelszo = profileForm.regiJelszo;
        updateData.ujJelszo = profileForm.ujJelszo;
      }
      if (isAdmin) updateData.nev = profileForm.nev;

      const updatedUser = await updateProfile(user.id, updateData);
      setUser(updatedUser);
      setProfileForm((prev) => ({ ...prev, regiJelszo: "", ujJelszo: "" }));
      toast.fire({ icon: "success", title: t("details.alerts.dataUpdated") });
    } catch (err: any) {
      setFormError(err.message || t("details.alerts.errorOccurred"));
    }
  };

  const getInitial = () => user?.nev ? user.nev.charAt(0).toUpperCase() : "?";
  const labelClass = "block mb-1.5 ml-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest";
  const inputClass = "w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all";
  const errorTextClass = "text-[9px] text-red-500 font-bold mt-1 ml-2 uppercase animate-pulse";

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-left transition-colors duration-300 py-6">
      <div className="flex items-center gap-4 mb-4 px-2">
        <button
          onClick={() => navigate("/profile")}
          className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:text-blue-500 transition-colors"
        >
          ←
        </button>
        <h2 className="text-2xl font-black uppercase italic tracking-tighter dark:text-white">
          {t("profile.dashboard.details.title")}
        </h2>
      </div>

      {/* MINI HEADER BEÉPÍTVE */}
      <header className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 transition-all relative">
        <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-800" />
        <div className="px-6 md:px-12 flex flex-col md:flex-row gap-4 md:gap-8 pb-6">
          <div className="flex justify-center md:flex-col md:justify-end md:pb-2 -mt-12 z-10 shrink-0">
            <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex items-center justify-center text-4xl border-4 border-white dark:border-slate-900 font-black italic text-blue-600">
              {getInitial()}
            </div>
          </div>
          <div className="flex-1 flex flex-col md:-mt-8">
            <div className="md:h-12 flex flex-col justify-center md:justify-end">
              <h1 className="text-xl md:text-2xl font-black uppercase italic tracking-tight text-center md:text-left text-slate-900 dark:text-white md:text-white">
                {user.nev}
              </h1>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mt-2">
              <span className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest bg-slate-100 dark:bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/50">
                @{user.felhasznalonev}
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-black text-[9px] uppercase tracking-wider bg-blue-100 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800/50">
                {isAdmin ? `🛡️ ${t("header.admin")}` : isKezelo ? `📦 ${t("header.handler")}` : `👁️ ${t("header.viewer")}`}
              </span>
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => logout()}
              className="w-full md:w-auto bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 shadow-lg"
            >
              {t("header.logout")}
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-8">
          <form onSubmit={handleUpdateSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>{t("details.fullName")}</label>
                <input
                  type="text"
                  value={profileForm.nev}
                  onChange={(e) => setProfileForm({ ...profileForm, nev: e.target.value })}
                  onBlur={(e) => validateField("nev", e.target.value)}
                  className={`${inputClass} ${fieldErrors.nev ? "border-red-500" : ""} ${isNameChanged ? "border-amber-400 ring-1 ring-amber-400/20" : ""}`}
                />
                {fieldErrors.nev && <p className={errorTextClass}>❌ {fieldErrors.nev}</p>}
                {isNameChanged && (
                  <p className="mt-2 ml-2 text-[9px] font-bold text-amber-600 dark:text-amber-500 uppercase italic">
                    ⚠️ {t("details.adminApprovalNeeded")}
                  </p>
                )}
              </div>

              <div className="relative">
                <label className={labelClass}>{t("details.phoneLabel")}</label>
                <PhoneInput
                  country={"hu"}
                  value={profileForm.telefonszam}
                  onChange={(phone) => {
                    setProfileForm({ ...profileForm, telefonszam: phone });
                    if (fieldErrors.telefonszam) validateField("telefonszam", phone);
                  }}
                  onBlur={() => validateField("telefonszam", profileForm.telefonszam)}
                  localization={hu}
                  masks={{ hu: ".. ... ...." }}
                  countryCodeEditable={false}
                  enableSearch={true}
                  searchPlaceholder={t("common.search")}
                  containerClass="phone-container"
                  inputClass={`phone-input-field ${fieldErrors.telefonszam ? "!border-red-500" : ""}`}
                  buttonClass="phone-dropdown-btn"
                  dropdownClass="phone-dropdown-list"
                  dropdownStyle={{ height: "350px" }}
                />
                {fieldErrors.telefonszam && <p className={errorTextClass}>❌ {fieldErrors.telefonszam}</p>}
              </div>

              <div>
                <label className={labelClass}>{t("details.username")}</label>
                <input
                  type="text"
                  value={profileForm.felhasznalonev}
                  onChange={(e) => setProfileForm({ ...profileForm, felhasznalonev: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>{t("details.email")}</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  onBlur={(e) => validateField("email", e.target.value)}
                  className={`${inputClass} ${fieldErrors.email ? "border-red-500" : ""}`}
                />
                {fieldErrors.email && <p className={errorTextClass}>❌ {fieldErrors.email}</p>}
              </div>

              <div className="relative">
                <label className={labelClass}>{t("details.oldPassword")}</label>
                <input
                  type={showOldPass ? "text" : "password"}
                  value={profileForm.regiJelszo}
                  onChange={(e) => setProfileForm({ ...profileForm, regiJelszo: e.target.value })}
                  className={inputClass}
                />
                <button type="button" onClick={() => setShowOldPass(!showOldPass)} className="absolute right-3 top-8 text-lg">
                  {showOldPass ? "👁️" : "🙈"}
                </button>
              </div>

              <div className="relative">
                <label className={labelClass}>{t("details.newPassword")}</label>
                <input
                  type={showNewPass ? "text" : "password"}
                  value={profileForm.ujJelszo}
                  onChange={(e) => setProfileForm({ ...profileForm, ujJelszo: e.target.value })}
                  className={inputClass}
                />
                <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-8 text-lg">
                  {showNewPass ? "👁️" : "🙈"}
                </button>
              </div>
            </div>

            {formError && (
              <div className="text-red-600 text-[10px] font-black uppercase bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-200 dark:border-red-900/30">
                ❌ {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={hasErrors}
              className={`w-full p-4 rounded-xl font-black uppercase text-xs shadow-lg transition-all active:scale-95 ${!isDirty || hasErrors ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none" : isNameChanged ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-blue-600 text-white hover:bg-blue-500"}`}
            >
              {hasErrors ? t("details.buttons.fixErrors") : !isDirty ? t("details.buttons.noChanges") : isNameChanged ? t("details.buttons.saveAndRequest") : t("details.buttons.saveData")}
            </button>
          </form>
        </div>
      </div>
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
        .phone-dropdown-btn { 
          background: transparent !important; border: none !important; 
          border-radius: 0.75rem 0 0 0.75rem !important; width: 48px !important;
        }
        .phone-container .flag-dropdown, .phone-container .selected-flag { background: transparent !important; }
        .phone-container .selected-flag:hover, .phone-container .selected-flag:focus, .phone-container .flag-dropdown.open .selected-flag { background: rgba(0, 0, 0, 0.05) !important; }
        .dark .phone-container .selected-flag:hover, .dark .phone-container .selected-flag:focus, .dark .phone-container .flag-dropdown.open .selected-flag { background: rgba(255, 255, 255, 0.05) !important; }
        .phone-dropdown-list { background: white !important; border-radius: 1rem !important; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1) !important; border: 1px solid #eee !important; z-index: 50 !important; }
        .dark .phone-dropdown-list { background: rgb(15 23 42) !important; border-color: rgb(51 65 85) !important; color: white !important; }
        .dark .search-box { background: rgb(30 41 59) !important; color: white !important; border: 1px solid rgb(51 65 85) !important; }
        .dark .phone-dropdown-list .country:hover { background: rgb(30 41 59) !important; }
        .phone-dropdown-list::-webkit-scrollbar { width: 6px; }
        .phone-dropdown-list::-webkit-scrollbar-thumb { background: #444; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default ProfileDetails;