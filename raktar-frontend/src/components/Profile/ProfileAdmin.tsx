// raktar-frontend/src/components/Profile/ProfileAdmin.tsx
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  updateProfile,
  handleAdminRequest,
  toggleUserBan,
  deleteUserPermanently,
  getAllUsers,
  getPendingRequests,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import type { User } from "../../types";
import Swal from "sweetalert2";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import hu from "react-phone-input-2/lang/hu.json";
import { useTranslation } from "react-i18next";

const MySwal = Swal.mixin({
  customClass: {
    popup: "rounded-[2.5rem] bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl",
    confirmButton: "bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest mx-2 transition-all active:scale-95",
    cancelButton: "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest mx-2 transition-all active:scale-95",
    title: "text-2xl font-black uppercase italic tracking-tighter",
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

const ProfileAdmin = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { t } = useTranslation();

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [adminEditForm, setAdminEditForm] = useState<any>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const loadData = useCallback(async () => {
    if (currentUser?.rang !== "ADMIN") return;
    try {
      const [users, reqs] = await Promise.all([
        getAllUsers(),
        getPendingRequests(),
      ]);
      setAllUsers(users);
      setPendingRequests(reqs);
    } catch (err) {
      console.error("Hiba az admin adatok betöltésekor:", err);
    }
  }, [currentUser]);

  useAutoRefresh(loadData);

  const openEdit = (u: User) => {
    setEditingUser(u);
    setFieldErrors({});
    setAdminEditForm({
      nev: u.nev,
      felhasznalonev: u.felhasznalonev,
      email: u.email || "",
      telefonszam: u.telefonszam || "",
      ujJelszo: "",
      rang: u.rang,
    });
  };

  const validateField = (name: string, value: string) => {
    let error = "";
    if (name === "nev") {
      if (!value) error = t("admin.validation.nameRequired");
      else if (!/^[a-zA-ZÁÉÍÓÖŐÚÜŰáéíóöőúüű\s-]+$/.test(value))
        error = t("admin.validation.nameNoNumbers");
    }
    if (name === "telefonszam" && (!value || value.length < 5)) {
      error = t("admin.validation.phoneRequired");
    }
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
    return error;
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const nError = validateField("nev", adminEditForm.nev);
    const tError = validateField("telefonszam", adminEditForm.telefonszam);

    if (nError || tError) {
      toast.fire({ icon: "error", title: t("admin.alerts.fixErrors") });
      return;
    }

    try {
      const submitData = {
        ...adminEditForm,
        telefonszam: adminEditForm.telefonszam.startsWith("+")
          ? adminEditForm.telefonszam
          : `+${adminEditForm.telefonszam}`,
      };

      await updateProfile(editingUser!.id, submitData);
      toast.fire({ icon: "success", title: t("admin.alerts.userUpdated") });
      setEditingUser(null);
      loadData();
    } catch (error: any) {
      MySwal.fire(t("common.error"), error.message || t("admin.alerts.saveFailed"), "error");
    }
  };

  const handleToggleBan = async (u: User) => {
    if (u.id === currentUser?.id) {
      toast.fire({ icon: "error", title: t("admin.alerts.cantBanSelf") });
      return;
    }
    try {
      await toggleUserBan(u.id);
      toast.fire({
        icon: "info",
        title: u.isBanned ? t("admin.alerts.accountUnbanned") : t("admin.alerts.accountBanned"),
      });
      loadData();
    } catch (error) {
      MySwal.fire(t("common.error"), t("admin.alerts.actionFailed"), "error");
    }
  };

  const handleDeleteUser = async (u: User) => {
    if (u.id === currentUser?.id) {
      MySwal.fire(t("common.error"), t("admin.alerts.cantDeleteSelf"), "error");
      return;
    }

    const result = await MySwal.fire({
      title: t("admin.alerts.deleteTitle"),
      text: t("admin.alerts.deleteText", { name: u.nev }),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("admin.alerts.yesDelete"),
      cancelButtonText: t("common.cancel"),
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        await deleteUserPermanently(u.id);
        toast.fire({ icon: "success", title: t("admin.alerts.userDeleted") });
        loadData();
      } catch (error) {
        MySwal.fire(t("common.error"), t("admin.alerts.deleteFailed"), "error");
      }
    }
  };

  const labelClass = "block mb-1.5 ml-2 text-[10px] font-black text-slate-400 uppercase tracking-widest";
  const inputClass = (name: string) => `w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white border ${fieldErrors[name] ? "border-red-500" : "border-slate-200 dark:border-slate-700"} text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all`;

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
          {t("profile.dashboard.admin.title")}
        </h2>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 p-8 space-y-10">
        {editingUser && (
          <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-200 dark:border-blue-800 rounded-[2rem] animate-in fade-in slide-in-from-top-4 duration-300">
            <h4 className="font-black uppercase text-xs text-blue-600 dark:text-blue-400 mb-4 italic">
              {t("admin.editTitle", { name: editingUser.felhasznalonev })}
            </h4>
            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t("admin.fullName")}</label>
                <input
                  type="text"
                  value={adminEditForm.nev}
                  onChange={(e) => setAdminEditForm({ ...adminEditForm, nev: e.target.value })}
                  onBlur={(e) => validateField("nev", e.target.value)}
                  className={inputClass("nev")}
                />
                {fieldErrors.nev && <p className="text-[9px] text-red-500 font-bold ml-2 mt-1 uppercase italic">{fieldErrors.nev}</p>}
              </div>
              <div>
                <label className={labelClass}>{t("admin.rank")}</label>
                <select
                  value={adminEditForm.rang}
                  onChange={(e) => setAdminEditForm({ ...adminEditForm, rang: e.target.value })}
                  className={inputClass("rang")}
                >
                  <option value="NEZELODO">👁️ {t("header.viewer")}</option>
                  <option value="KEZELO">📦 {t("header.handler")}</option>
                  <option value="ADMIN">🛡️ {t("header.admin")}</option>
                </select>
              </div>
              <div className="md:col-span-1">
                <label className={labelClass}>{t("admin.phone")}</label>
                <PhoneInput
                  country={"hu"}
                  value={adminEditForm.telefonszam}
                  onChange={(phone) => setAdminEditForm({ ...adminEditForm, telefonszam: phone })}
                  localization={hu}
                  masks={{ hu: ".. ... ...." }}
                  countryCodeEditable={false}
                  enableSearch={true}
                  searchPlaceholder={t("common.search")}
                  containerClass="phone-container"
                  inputClass={`phone-input-field ${fieldErrors.telefonszam ? "!border-red-500" : ""}`}
                  buttonClass="phone-dropdown-btn"
                  dropdownClass="phone-dropdown-list"
                  dropdownStyle={{ height: "250px" }}
                />
                {fieldErrors.telefonszam && <p className="text-[9px] text-red-500 font-bold ml-2 mt-1 uppercase italic">{fieldErrors.telefonszam}</p>}
              </div>
              <div>
                <label className={labelClass}>{t("admin.newPassword")}</label>
                <input
                  type="password"
                  value={adminEditForm.ujJelszo}
                  onChange={(e) => setAdminEditForm({ ...adminEditForm, ujJelszo: e.target.value })}
                  className={inputClass("ujJelszo")}
                  placeholder="••••••••"
                />
              </div>
              <div className="md:col-span-2 grid grid-cols-2 gap-2 mt-2">
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl font-black uppercase text-xs shadow-lg shadow-blue-600/20 transition-all active:scale-95">
                  {t("common.save")}
                </button>
                <button type="button" onClick={() => setEditingUser(null)} className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 p-3 rounded-xl text-xs font-black uppercase hover:bg-slate-300 dark:hover:bg-slate-700 transition-all">
                  {t("common.cancel")}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
            {t("admin.pendingRequests")}
          </h3>
          {pendingRequests.length === 0 && <p className="text-center py-4 text-slate-400 italic text-sm">{t("admin.noRequests")}</p>}
          {pendingRequests.map((req) => (
            <div key={req.id} className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl flex justify-between items-center transition-all">
              <div>
                <p className="text-[10px] font-black text-amber-600 uppercase">{req.tipus}</p>
                <p className="text-xs font-black dark:text-white">
                  @{req.user.felhasznalonev} ➔ <span className="text-blue-600 dark:text-blue-400">{req.ujErtek}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={async () => { await handleAdminRequest(req.id, "APPROVED"); toast.fire({ icon: "success", title: t("admin.alerts.accepted") }); loadData(); }} className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase active:scale-90 transition-all">OK</button>
                <button onClick={async () => { await handleAdminRequest(req.id, "REJECTED"); toast.fire({ icon: "info", title: t("admin.alerts.rejected") }); loadData(); }} className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase active:scale-90 transition-all">X</button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
            {t("admin.systemUsers")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allUsers.map((u) => (
              <div key={u.id} className={`p-4 rounded-2xl border transition-all ${u.isBanned ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30" : "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:border-blue-300 dark:hover:bg-slate-800/60"}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className={`font-black text-sm ${u.isBanned ? "text-red-600" : "dark:text-white"}`}>
                      {u.nev} {u.rang === "ADMIN" ? "🛡️" : u.rang === "KEZELO" ? "📦" : "👁️"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold italic">@{u.felhasznalonev}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(u)} className="p-2 bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all">✏️</button>
                    {u.id !== currentUser?.id && (
                      <>
                        <button onClick={() => handleToggleBan(u)} className="p-2 bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-all">{u.isBanned ? "🔓" : "🚫"}</button>
                        <button onClick={() => handleDeleteUser(u)} className="p-2 bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all">🗑️</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        .phone-container { width: 100% !important; }
        .phone-input-field { 
          width: 100% !important; height: 46px !important; border-radius: 0.75rem !important;
          border: 1px solid rgb(226 232 240) !important; background: rgb(248 250 252) !important;
          padding-left: 58px !important; font-size: 0.875rem !important;
        }
        .dark .phone-input-field { background: rgb(30 41 59) !important; border-color: rgb(51 65 85) !important; color: white !important; }
        .phone-dropdown-btn { background: transparent !important; border: none !important; border-radius: 0.75rem 0 0 0.75rem !important; width: 48px !important; }
        .phone-dropdown-list { background: white !important; border-radius: 1rem !important; z-index: 50 !important; }
        .dark .phone-dropdown-list { background: rgb(15 23 42) !important; border-color: rgb(51 65 85) !important; color: white !important; }
      `}</style>
    </div>
  );
};

export default ProfileAdmin;