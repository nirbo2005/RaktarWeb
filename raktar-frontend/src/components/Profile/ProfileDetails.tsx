// raktar-frontend/src/components/Profile/ProfileDetails.tsx
import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { updateProfile, submitChangeRequest, getUsers, deleteUser, getUserPendingRequests } from "../../services/api";
import ProfileAvatar from "./ProfileAvatar";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import hu from "react-phone-input-2/lang/hu.json";

const MySwal = Swal.mixin({
  customClass: {
    popup: "rounded-[2.5rem] bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl font-sans",
    confirmButton: "bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest mx-2 transition-all active:scale-95",
    cancelButton: "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest mx-2 transition-all active:scale-95",
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
  
  const [activeRequests, setActiveRequests] = useState<any[]>([]);

  const [profileForm, setProfileForm] = useState({
    felhasznalonev: user?.felhasznalonev || "",
    nev: user?.nev || "",
    email: user?.email || "",
    telefonszam: user?.telefonszam || "",
    regiJelszo: "",
    ujJelszo: "",
  });

  const fetchMyRequests = useCallback(async () => {
    if (!user) return;
    try {
      const myReqs = await getUserPendingRequests(user.id);
      setActiveRequests(myReqs);
    } catch (err) {
      console.warn(t("profile.details.alerts.fetchRequestsError"));
    }
  }, [user, t]);

  useEffect(() => {
    fetchMyRequests();
  }, [fetchMyRequests]);

  if (!user) return null;

  const isAdmin = user.rang === "ADMIN";
  const isKezelo = user.rang === "KEZELO";
  const isNezelodo = user.rang === "NEZELODO";

  const isKezeloPending = activeRequests.some((r: any) => r.tipus === 'RANG_MODOSITAS' && r.ujErtek === 'KEZELO');
  const isAdminPending = activeRequests.some((r: any) => r.tipus === 'RANG_MODOSITAS' && r.ujErtek === 'ADMIN');
  const isNamePending = activeRequests.some((r: any) => r.tipus === 'NEV_MODOSITAS');

  const validateField = (name: string, value: string) => {
    let error = "";
    
    if (
      (name === "nev" && value === user.nev) ||
      (name === "felhasznalonev" && value === user.felhasznalonev) ||
      (name === "email" && value === user.email) ||
      (name === "telefonszam" && value === user.telefonszam)
    ) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
      return;
    }

    switch (name) {
      case "nev":
        if (!value) error = t("auth.register.validation.nameEmpty");
        else if (!/^[a-zA-ZÁÉÍÓÖŐÚÜŰáéíóöőúüű\s-]+$/.test(value))
          error = t("auth.register.validation.nameNumbers");
        else if (value.trim().split(" ").length < 2)
          error = t("auth.register.validation.nameTwoWords");
        break;
      case "felhasznalonev":
        if (value.length < 4)
          error = t("auth.register.validation.usernameShort");
        break;
      case "email":
        if (!/\S+@\S+\.\S+/.test(value))
          error = t("auth.register.validation.emailInvalid");
        break;
      case "telefonszam":
        if (!value || value.length < 5)
          error = t("auth.register.validation.phoneRequired");
        break;
      case "ujJelszo":
        if (value === "") break; 
        const passwordRegex = /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;
        if (value.length < 8) {
          error = t("auth.register.validation.passwordShort");
        } else if (!passwordRegex.test(value)) {
          error = t("auth.register.validation.passwordWeak");
        }
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
    
    validateField("nev", profileForm.nev);
    validateField("telefonszam", profileForm.telefonszam);
    validateField("email", profileForm.email);
    if (profileForm.ujJelszo) validateField("ujJelszo", profileForm.ujJelszo);

    if (!profileForm.telefonszam || profileForm.telefonszam.length < 5) {
      setFormError(t("auth.register.validation.phoneRequired"));
      return;
    }

    if (!isDirty) {
      toast.fire({ icon: "info", title: t("details.alerts.noChanges") });
      return;
    }

    if (hasErrors || Object.values(fieldErrors).some(e => e !== "")) {
      setFormError(t("details.alerts.fixBeforeSave"));
      return;
    }

    if (profileForm.ujJelszo && !profileForm.regiJelszo) {
      setFormError(t("details.alerts.oldPassRequired"));
      return;
    }

    setFormError(null);
    try {
      const updateData: any = {
        felhasznalonev: profileForm.felhasznalonev,
        email: profileForm.email,
        telefonszam: profileForm.telefonszam.startsWith("+") ? profileForm.telefonszam : `+${profileForm.telefonszam}`,
      };

      if (user.rang === "ADMIN") {
        updateData.nev = profileForm.nev;
      } else if (profileForm.nev !== user.nev) {
        await submitChangeRequest({
          userId: user.id,
          tipus: "NEV_MODOSITAS",
          ujErtek: profileForm.nev,
        });
      }

      if (profileForm.ujJelszo) {
        updateData.regiJelszo = profileForm.regiJelszo;
        updateData.ujJelszo = profileForm.ujJelszo;
      }

      const updatedUser = await updateProfile(user.id, updateData);
      setUser(updatedUser);
      setProfileForm((prev) => ({ ...prev, regiJelszo: "", ujJelszo: "" }));
      toast.fire({ icon: "success", title: t("details.alerts.dataUpdated") });
      fetchMyRequests();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || t("details.alerts.errorOccurred"));
    }
  };

  const handleRequestRang = async (rang: "KEZELO" | "ADMIN") => {
    const rangNev = rang === "ADMIN" ? t("header.admin") : t("header.handler");
    const result = await MySwal.fire({
      title: t("profile.details.requestRankTitle", { rank: rangNev }),
      text: t("profile.details.requestRankText", { rank: rangNev }),
      icon: "question",
      showCancelButton: true,
      confirmButtonText: t("common.yes"),
      cancelButtonText: t("common.cancel"),
    });

    if (result.isConfirmed) {
      try {
        await submitChangeRequest({ userId: user.id, tipus: "RANG_MODOSITAS", ujErtek: rang });
        toast.fire({ icon: "success", title: t("profile.details.alerts.requestSent") });
        fetchMyRequests();
      } catch (err: any) {
        MySwal.fire(t("common.error"), err.message, "error");
      }
    }
  };

  const handleDeleteProfile = async () => {
    if (user.rang === "ADMIN") {
      const allUsers = await getUsers();
      const activeAdmins = allUsers.filter((u: any) => u.rang === "ADMIN" && !u.isBanned && !u.isDeleted);
      if (activeAdmins.length <= 1) {
        return MySwal.fire({
          title: t("profile.details.alerts.deleteDeniedTitle"),
          text: t("profile.details.alerts.deleteDeniedText"),
          icon: "error",
          confirmButtonText: t("auth.login.alerts.gotIt"),
        });
      }
    }

    const result = await MySwal.fire({
      title: t("profile.details.alerts.deleteTitle"),
      text: t("profile.details.alerts.deleteText"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: t("profile.details.alerts.deleteConfirm"),
      cancelButtonText: t("common.cancel"),
    });

    if (result.isConfirmed) {
      try {
        await deleteUser(user.id);
        await MySwal.fire(t("profile.details.alerts.deletedTitle"), t("profile.details.alerts.deletedText"), "success");
        logout();
      } catch (err: any) {
        MySwal.fire(t("common.error"), err.message, "error");
      }
    }
  };

  const labelClass = "block mb-1.5 ml-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest";
  const inputClass = "w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all";
  const errorTextClass = "text-[9px] text-red-500 font-bold mt-1 ml-2 uppercase animate-pulse";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-8 py-6 text-left px-4">
        <div className="flex items-center gap-4 mb-4 px-2">
          <button onClick={() => navigate("/profile")} className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:text-blue-500 transition-colors">
            ←
          </button>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter dark:text-white">
            {t("profile.dashboard.details.title")}
          </h2>
        </div>

        <header className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 relative">
          <div className="h-32 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800" />
          <div className="px-6 md:px-12 flex flex-col md:flex-row gap-6 md:gap-8 pb-8">
            <div className="flex justify-center md:flex-col md:justify-end md:pb-2 -mt-16 z-10 shrink-0">
              <div className="w-32 h-32 md:w-40 md:h-40">
                <ProfileAvatar user={user} onUploadSuccess={(updated) => setUser(updated)} />
              </div>
            </div>
            <div className="flex-1 flex flex-col md:mt-4">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-3 text-center md:text-left">
                  <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter dark:text-white">
                    {user?.nev || t("header.anonymous")}
                  </h1>
                  <div className="flex flex-wrap justify-center md:justify-start items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                      @{user?.felhasznalonev}
                    </span>
                    <span className="text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-wider bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg border border-blue-100 dark:border-blue-800/30">
                      {user.rang === "ADMIN" ? `🛡️ ${t("header.admin")}` : user.rang === "KEZELO" ? `📦 ${t("header.handler")}` : `👁️ ${t("header.viewer")}`}
                    </span>
                  </div>
                </div>
                <button onClick={() => logout()} className="w-full md:w-auto bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-red-500/20 flex items-center justify-center gap-2">
                  <span>🚪</span> {t("header.logout")}
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 md:p-8">
            <form onSubmit={handleUpdateSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>{t("details.fullName")}</label>
                  <input
                    type="text"
                    value={profileForm.nev}
                    onChange={(e) => { setProfileForm({ ...profileForm, nev: e.target.value }); validateField("nev", e.target.value); }}
                    className={`${inputClass} ${fieldErrors.nev ? "border-red-500" : ""}`}
                  />
                  {fieldErrors.nev && <p className={errorTextClass}>❌ {fieldErrors.nev}</p>}
                </div>

                <div className="relative">
                  <label className={labelClass}>{t("details.phoneLabel")}</label>
                  <PhoneInput
                    country={"hu"}
                    value={profileForm.telefonszam}
                    onChange={(phone) => { setProfileForm({ ...profileForm, telefonszam: phone }); validateField("telefonszam", phone); }}
                    localization={hu}
                    masks={{ hu: ".. ... ...." }}
                    countryCodeEditable={false}
                    enableSearch={true}
                    searchPlaceholder={t("common.search")}
                    containerClass="phone-container"
                    inputClass={`phone-input-field ${fieldErrors.telefonszam ? "!border-red-500" : ""}`}
                    buttonClass="phone-dropdown-btn"
                    dropdownClass="phone-dropdown-list"
                  />
                  {fieldErrors.telefonszam && <p className={errorTextClass}>❌ {fieldErrors.telefonszam}</p>}
                </div>

                <div>
                  <label className={labelClass}>{t("details.username")}</label>
                  <input
                    type="text"
                    value={profileForm.felhasznalonev}
                    onChange={(e) => { setProfileForm({ ...profileForm, felhasznalonev: e.target.value }); validateField("felhasznalonev", e.target.value); }}
                    className={`${inputClass} ${fieldErrors.felhasznalonev ? "border-red-500" : ""}`}
                  />
                  {fieldErrors.felhasznalonev && <p className={errorTextClass}>❌ {fieldErrors.felhasznalonev}</p>}
                </div>

                <div>
                  <label className={labelClass}>{t("details.email")}</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => { setProfileForm({ ...profileForm, email: e.target.value }); validateField("email", e.target.value); }}
                    className={`${inputClass} ${fieldErrors.email ? "border-red-500" : ""}`}
                  />
                  {fieldErrors.email && <p className={errorTextClass}>❌ {fieldErrors.email}</p>}
                </div>

                <div className="relative">
                  <label className={labelClass}>{t("details.oldPassword")}</label>
                  <div className="relative">
                    <input
                      type={showOldPass ? "text" : "password"}
                      value={profileForm.regiJelszo}
                      onChange={(e) => setProfileForm({ ...profileForm, regiJelszo: e.target.value })}
                      className={inputClass}
                    />
                    <button type="button" onClick={() => setShowOldPass(!showOldPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-lg">
                      {showOldPass ? "👁️" : "🙈"}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <label className={labelClass}>{t("details.newPassword")}</label>
                  <div className="relative">
                    <input
                      type={showNewPass ? "text" : "password"}
                      value={profileForm.ujJelszo}
                      onChange={(e) => { setProfileForm({ ...profileForm, ujJelszo: e.target.value }); validateField("ujJelszo", e.target.value); }}
                      className={`${inputClass} ${fieldErrors.ujJelszo ? "border-red-500" : ""}`}
                    />
                    <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-lg">
                      {showNewPass ? "👁️" : "🙈"}
                    </button>
                  </div>
                  {fieldErrors.ujJelszo && <p className={errorTextClass}>❌ {fieldErrors.ujJelszo}</p>}
                </div>
              </div>

              {formError && (
                <div className="text-red-600 text-[10px] font-black uppercase bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-200 dark:border-red-900/30">
                  ❌ {formError}
                </div>
              )}

              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={hasErrors || !isDirty}
                  className={`w-full p-4 rounded-xl font-black uppercase text-xs shadow-lg transition-all active:scale-95 ${!isDirty || hasErrors ? "bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed shadow-none" : "bg-blue-600 text-white hover:bg-blue-500"}`}
                >
                  {hasErrors ? t("details.buttons.fixErrors") : !isDirty ? t("details.buttons.noChanges") : t("details.buttons.saveData")}
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {isNezelodo && (
                    <>
                      <button type="button" disabled={isKezeloPending} onClick={() => handleRequestRang("KEZELO")} className={`p-3 rounded-xl font-black uppercase text-[10px] transition-all flex justify-center items-center gap-2 border border-slate-200 dark:border-slate-700 ${isKezeloPending ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white active:scale-95'}`}>
                        {isKezeloPending ? t("profile.details.kezeloPending") : `<span>📦</span> ${t("profile.details.requestKezelo")}`}
                      </button>
                      <button type="button" disabled={isAdminPending} onClick={() => handleRequestRang("ADMIN")} className={`p-3 rounded-xl font-black uppercase text-[10px] transition-all flex justify-center items-center gap-2 border border-slate-200 dark:border-slate-700 ${isAdminPending ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white active:scale-95'}`}>
                        {isAdminPending ? t("profile.details.adminPending") : `<span>🛡️</span> ${t("profile.details.requestAdmin")}`}
                      </button>
                    </>
                  )}
                  {isKezelo && (
                    <button type="button" disabled={isAdminPending} onClick={() => handleRequestRang("ADMIN")} className={`p-3 rounded-xl font-black uppercase text-[10px] transition-all flex justify-center items-center gap-2 border border-slate-200 dark:border-slate-700 ${isAdminPending ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white active:scale-95'}`}>
                      {isAdminPending ? t("profile.details.adminPending") : `<span>🛡️</span> ${t("profile.details.requestAdmin")}`}
                    </button>
                  )}
                  <button type="button" onClick={handleDeleteProfile} className="bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 p-3 rounded-xl font-black uppercase text-[10px] transition-all active:scale-95 flex justify-center items-center gap-2">
                    <span>🗑️</span> {t("profile.details.deleteAccount")}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        .phone-container { width: 100% !important; font-family: inherit !important; }
        .phone-input-field { 
          width: 100% !important; 
          height: 46px !important; 
          border-radius: 0.75rem !important;
          border: 1px solid #e2e8f0 !important; 
          background: #f8fafc !important;
          padding-left: 58px !important; 
          font-size: 0.875rem !important; 
          transition: all 0.2s !important;
          color: #0f172a !important;
        }
        .dark .phone-input-field {
          border-color: #334155 !important;
          background-color: #1e293b !important;
          color: #f8fafc !important;
        }
        .phone-input-field:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5) !important;
        }
        .phone-dropdown-btn { background: transparent !important; border: none !important; width: 48px !important; }
        .phone-dropdown-list { 
          background: #ffffff !important; 
          border-radius: 1rem !important; 
          border: 1px solid #e2e8f0 !important; 
          color: #0f172a !important; 
        }
        .dark .phone-dropdown-list {
          background-color: #0f172a !important;
          border-color: #334155 !important;
          color: #f8fafc !important;
        }
        .phone-dropdown-list .country:hover { background: #f1f5f9 !important; }
        .dark .phone-dropdown-list .country:hover { background-color: #1e293b !important; }
        .phone-dropdown-list .country.highlight { background: #f1f5f9 !important; }
        .dark .phone-dropdown-list .country.highlight { background-color: #1e293b !important; }
      `}</style>
    </div>
  );
};

export default ProfileDetails;