//raktar-frontend/src/components/Profile.tsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  getAuditLogs,
  updateProfile,
  submitChangeRequest,
  getAllUsers,
  toggleUserBan,
  deleteUserPermanently,
  getPendingRequests,
  handleAdminRequest,
  restoreAction,
} from "../services/api";
import type { AuditLog, User } from "../types";

// Kiterjesztett típus a csoportosításhoz
type DisplayLog = AuditLog & {
  isGroup?: boolean;
  items?: AuditLog[];
  count?: number;
};

const Profile = () => {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [openSection, setOpenSection] = useState<string | null>("details");
  const [loading, setLoading] = useState(false);
  const [restoringGroup, setRestoringGroup] = useState(false); // Új state a csoportos loadinghoz
  const [formError, setFormError] = useState<string | null>(null);
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [profileForm, setProfileForm] = useState({
    felhasznalonev: user?.felhasznalonev || "",
    nev: user?.nev || "",
    email: user?.email || "",
    telefonszam: user?.telefonszam || "",
    regiJelszo: "",
    ujJelszo: "",
  });

  const [adminEditForm, setAdminEditForm] = useState({
    nev: "",
    felhasznalonev: "",
    email: "",
    telefonszam: "",
    ujJelszo: "",
    admin: false,
  });

  const [logFilters, setLogFilters] = useState({
    muvelet: "",
    startDate: "",
    endDate: "",
    targetUserId: "",
  });

  // --- CSOPORTOSÍTÁSI LOGIKA ---
  const groupedLogs = useMemo(() => {
    const result: DisplayLog[] = [];
    let currentGroup: DisplayLog | null = null;

    logs.forEach((log) => {
      // Csak a BULK_DELETE műveleteket csoportosítjuk
      if (log.muvelet === "BULK_DELETE") {
        // Ha már van nyitott csoport, és ez a log is oda tartozik (időben közel van és ugyanaz a user)
        // Megengedünk 2 másodperc eltérést, mivel a loop a backendben időbe telik
        const timeDiff = currentGroup
          ? Math.abs(
              new Date(currentGroup.idopont).getTime() -
                new Date(log.idopont).getTime(),
            )
          : 0;

        if (
          currentGroup &&
          currentGroup.userId === log.userId &&
          timeDiff < 2000
        ) {
          currentGroup.items!.push(log);
          currentGroup.count!++;
        } else {
          // Ha nincs nyitott csoport, vagy ez már egy új műveletsor
          if (currentGroup) result.push(currentGroup);
          currentGroup = {
            ...log,
            isGroup: true,
            items: [log],
            count: 1,
          };
        }
      } else {
        // Ha nem BULK_DELETE, lezárjuk az előző csoportot (ha volt) és hozzáadjuk a sima logot
        if (currentGroup) {
          result.push(currentGroup);
          currentGroup = null;
        }
        result.push(log);
      }
    });

    // A végén, ha maradt nyitott csoport
    if (currentGroup) result.push(currentGroup);

    return result;
  }, [logs]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const activeFilters = Object.fromEntries(
        Object.entries(logFilters).filter(([_, value]) => value !== ""),
      );

      const logData = await getAuditLogs(user.id, user.admin, activeFilters);
      setLogs(logData);

      if (user.admin) {
        const [users, reqs] = await Promise.all([
          getAllUsers(),
          getPendingRequests(),
        ]);
        setAllUsers(users);
        setPendingRequests(reqs);
      }
    } catch (err) {
      console.error("Hiba az adatok betöltésekor:", err);
    } finally {
      setLoading(false);
    }
  }, [user, logFilters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- EGYEDI VISSZAÁLLÍTÁS ---
  const handleRestore = async (e: React.MouseEvent, logId: number) => {
    e.stopPropagation();
    if (!user || !confirm("Biztosan visszaállítod ezt az állapotot?")) return;
    setLoading(true);
    try {
      await restoreAction(logId, user.id);
      alert("Sikeres visszaállítás!");
      await loadData();
    } catch (err: any) {
      alert("Hiba: " + (err.message || "A visszaállítás nem sikerült."));
    } finally {
      setLoading(false);
    }
  };

  // --- CSOPORTOS VISSZAÁLLÍTÁS ---
  const handleGroupRestore = async (e: React.MouseEvent, group: DisplayLog) => {
    e.stopPropagation();
    if (
      !user ||
      !group.items ||
      !confirm(
        `Biztosan visszaállítod mind a(z) ${group.count} törölt terméket?`,
      )
    )
      return;

    setRestoringGroup(true);
    try {
      // Párhuzamosan indítjuk a visszaállításokat a backend felé
      // Ez hatékonyabb, mintha egyesével várnánk meg őket
      await Promise.all(
        group.items.map((item) => restoreAction(item.id, user.id)),
      );
      alert("A teljes csoport sikeresen visszaállítva!");
      await loadData();
    } catch (err: any) {
      alert(
        "Hiba történt a csoportos visszaállítás közben. Lehet, hogy néhány elem már nem létezik.",
      );
      await loadData(); // Újratöltjük, hogy lássuk mi sikerült
    } finally {
      setRestoringGroup(false);
    }
  };

  const requestAdminRank = async () => {
    if (!user || user.admin) return;
    if (
      !confirm(
        "Biztosan igényelsz Adminisztrátori rangot? A kérelem az adminokhoz kerül jóváhagyásra.",
      )
    )
      return;
    setLoading(true);
    try {
      await submitChangeRequest({
        userId: user.id,
        tipus: "RANG_MODOSITAS",
        ujErtek: "ADMIN",
      });
      alert("Admin kérelem sikeresen beküldve!");
    } catch (err: any) {
      alert("Hiba: " + (err.message || "Nem sikerült a kérelmet elküldeni."));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      if (!user?.admin && profileForm.nev !== user?.nev) {
        await submitChangeRequest({
          userId: user!.id,
          tipus: "NEV_MODOSITAS",
          ujErtek: profileForm.nev,
        });
        alert("A név módosítására vonatkozó kérelem beküldve az adminoknak!");
      }

      const updateData: any = {
        felhasznalonev: profileForm.felhasznalonev,
        email: profileForm.email,
        telefonszam: profileForm.telefonszam,
      };

      if (profileForm.ujJelszo) {
        if (!profileForm.regiJelszo) throw new Error("A régi jelszó kötelező!");
        updateData.regiJelszo = profileForm.regiJelszo;
        updateData.ujJelszo = profileForm.ujJelszo;
      }
      if (user?.admin) updateData.nev = profileForm.nev;

      const updatedUser = await updateProfile(user!.id, updateData);
      setUser(updatedUser);
      setProfileForm((prev) => ({ ...prev, regiJelszo: "", ujJelszo: "" }));
      alert("Profil adatok sikeresen frissítve!");
    } catch (err: any) {
      setFormError(err.message || "Hiba történt a mentés során!");
    }
  };

  const openAdminEdit = (u: User) => {
    setEditingUser(u);
    setAdminEditForm({
      nev: u.nev,
      felhasznalonev: u.felhasznalonev,
      email: u.email || "",
      telefonszam: u.telefonszam || "",
      ujJelszo: "",
      admin: u.admin,
    });
  };

  const handleAdminUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await updateProfile(editingUser.id, adminEditForm);
      alert("Felhasználó sikeresen módosítva!");
      setEditingUser(null);
      loadData();
    } catch (err) {
      alert("Hiba a módosítás során!");
    }
  };

  const formatDate = (dateStr: any) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("hu-HU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatChangeDetailed = (log: AuditLog) => {
    if (log.muvelet === "RESTORE" && log.regiAdat?.status === "deleted") {
      return (
        <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mt-2">
          <span className="text-[10px] font-black uppercase text-slate-400 w-full md:w-20">
            Művelet:
          </span>
          <span className="text-emerald-500 font-black text-lg italic uppercase tracking-tight">
            Törlés visszavonása
          </span>
        </div>
      );
    }

    if (
      (log.muvelet !== "UPDATE" && log.muvelet !== "RESTORE") ||
      !log.regiAdat ||
      !log.ujAdat
    )
      return null;

    const labels: any = {
      nev: "Név",
      ar: "Ár",
      mennyiseg: "Készlet",
      parcella: "Hely",
      gyarto: "Gyártó",
      lejarat: "Lejárat",
    };

    return Object.keys(log.ujAdat).map((key) => {
      if (
        key !== "status" &&
        JSON.stringify(log.regiAdat[key]) !== JSON.stringify(log.ujAdat[key])
      ) {
        let oldVal = log.regiAdat[key];
        let newVal = log.ujAdat[key];

        if (key === "lejarat") {
          oldVal = new Date(oldVal).toLocaleDateString("hu-HU");
          newVal = new Date(newVal).toLocaleDateString("hu-HU");
        }
        return (
          <div
            key={key}
            className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mt-2"
          >
            <span className="text-[10px] font-black uppercase text-slate-400 w-full md:w-20">
              {labels[key] || key}:
            </span>
            <span className="text-slate-400 line-through text-sm">
              {oldVal ?? "nincs"}
            </span>
            <span className="text-blue-500 font-black text-lg">➔ {newVal}</span>
          </div>
        );
      }
      return null;
    });
  };

  const inputClass =
    "w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm";
  const labelClass =
    "block mb-1.5 ml-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest";

  if (!user)
    return (
      <div className="p-10 text-center font-black italic uppercase">
        Betöltés...
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 space-y-6 select-none">
      <header className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
        <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-700" />
        <div className="px-10 pb-6 flex flex-col md:flex-row items-center gap-6 -mt-10">
          <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center justify-center text-3xl border-4 border-white dark:border-slate-900 font-black italic text-blue-600 shadow-blue-500/10">
            {user.nev.charAt(0)}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic">
              {user.nev}
            </h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
              @{user.felhasznalonev} • {user.admin ? "🛡️ Admin" : "📦 Kezelő"}
            </p>
          </div>
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 shadow-lg"
          >
            Kijelentkezés
          </button>
        </div>
      </header>

      {loading && (
        <div className="text-center font-black text-blue-500 animate-pulse text-[10px] uppercase tracking-widest">
          Adatok frissítése...
        </div>
      )}

      <div className="space-y-6">
        <section className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <button
            onClick={() =>
              setOpenSection(openSection === "details" ? null : "details")
            }
            className="w-full p-5 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors font-black uppercase text-lg dark:text-white"
          >
            <span>👤 Saját profil adatok</span>
            <span
              className={`transition-transform ${openSection === "details" ? "rotate-180" : ""}`}
            >
              ▼
            </span>
          </button>
          {openSection === "details" && (
            <div className="p-8 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2">
              <form onSubmit={handleUpdateSubmit} className="space-y-6">
                {/* ... (Profil form kódja változatlan) ... */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Felhasználónév</label>
                    <input
                      type="text"
                      value={profileForm.felhasznalonev}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          felhasznalonev: e.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Teljes név</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={profileForm.nev}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            nev: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                      {!user.admin && (
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateSubmit({
                              preventDefault: () => {},
                            } as any)
                          }
                          className="absolute right-2 top-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg font-black text-[8px] uppercase hover:bg-blue-500 transition-all shadow-md"
                          title="Névváltoztatás kérése"
                        >
                          Kérelem
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Email cím</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          email: e.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Telefonszám</label>
                    <input
                      type="text"
                      value={profileForm.telefonszam}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          telefonszam: e.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div className="relative">
                    <label className={labelClass}>Régi jelszó</label>
                    <input
                      type={showOldPass ? "text" : "password"}
                      value={profileForm.regiJelszo}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          regiJelszo: e.target.value,
                        })
                      }
                      className={inputClass}
                      placeholder="Módosításhoz kötelező"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPass(!showOldPass)}
                      className="absolute right-3 top-8 text-lg"
                    >
                      {showOldPass ? "👁️" : "🙈"}
                    </button>
                  </div>
                  <div className="relative">
                    <label className={labelClass}>Új jelszó</label>
                    <input
                      type={showNewPass ? "text" : "password"}
                      value={profileForm.ujJelszo}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          ujJelszo: e.target.value,
                        })
                      }
                      className={inputClass}
                      placeholder="Hagyd üresen, ha nem változik"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-8 text-lg"
                    >
                      {showNewPass ? "👁️" : "🙈"}
                    </button>
                  </div>
                </div>

                {formError && (
                  <div className="text-red-600 text-[10px] font-black uppercase bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100">
                    ❌ {formError}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white p-4 rounded-xl font-black uppercase text-xs shadow-lg hover:bg-blue-500 transition-all"
                  >
                    Saját adatok mentése
                  </button>
                  {!user.admin && (
                    <button
                      type="button"
                      onClick={requestAdminRank}
                      className="bg-indigo-600 text-white p-4 rounded-xl font-black uppercase text-xs shadow-lg hover:bg-indigo-500 transition-all border-2 border-white/10"
                    >
                      🛡️ Admin rang igénylése
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </section>
        <section className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <button
            onClick={() =>
              setOpenSection(openSection === "logs" ? null : "logs")
            }
            className="w-full p-5 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors font-black uppercase text-lg dark:text-white"
          >
            <span>📜 Tevékenységnapló</span>
            <span
              className={`transition-transform ${openSection === "logs" ? "rotate-180" : ""}`}
            >
              ▼
            </span>
          </button>
          {openSection === "logs" && (
            <div className="p-6 border-t border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mb-8">
                {user.admin && (
                  <select
                    value={logFilters.targetUserId}
                    onChange={(e) =>
                      setLogFilters({
                        ...logFilters,
                        targetUserId: e.target.value,
                      })
                    }
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-[10px] font-bold dark:text-white border border-slate-200 outline-none"
                  >
                    <option value="">Összes felhasználó</option>
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nev}
                      </option>
                    ))}
                  </select>
                )}
                <select
                  value={logFilters.muvelet}
                  onChange={(e) =>
                    setLogFilters({ ...logFilters, muvelet: e.target.value })
                  }
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-[10px] font-bold dark:text-white border border-slate-200 outline-none"
                >
                  <option value="">Minden művelet</option>
                  <option value="CREATE">✨ Létrehozás</option>
                  <option value="UPDATE">📝 Módosítás</option>
                  <option value="DELETE">🗑️ Törlés</option>
                  <option value="BULK_DELETE">🗑️ Tömeges Törlés</option>
                  <option value="RESTORE">♻️ Visszaállítás</option>
                </select>
                <input
                  type="date"
                  value={logFilters.startDate}
                  onChange={(e) =>
                    setLogFilters({ ...logFilters, startDate: e.target.value })
                  }
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-[10px] font-bold dark:text-white border border-slate-200 outline-none"
                />
                <input
                  type="date"
                  value={logFilters.endDate}
                  onChange={(e) =>
                    setLogFilters({ ...logFilters, endDate: e.target.value })
                  }
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-[10px] font-bold dark:text-white border border-slate-200 outline-none"
                />
                <button
                  onClick={loadData}
                  className="bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all"
                >
                  Szűrés
                </button>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {groupedLogs.map((log, index) => (
                  <div
                    key={log.isGroup ? `group-${index}` : log.id}
                    onClick={() =>
                      !log.isGroup &&
                      log.stockId &&
                      navigate(`/product/${log.stockId}`)
                    }
                    className={`p-6 rounded-[1.5rem] border border-transparent transition-all relative group ${
                      log.isGroup
                        ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/50"
                        : "bg-slate-50 dark:bg-slate-800/30 hover:border-blue-200 cursor-pointer"
                    }`}
                  >
                    {log.isGroup ? (
                      // CSOPORTOS MEGJELENÍTÉS
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 font-black text-lg shadow-inner">
                              🗑️
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase text-red-600 tracking-tight">
                                Tömeges Törlés ({log.count} elem)
                              </p>
                              <p className="text-base font-black dark:text-white">
                                {formatDate(log.idopont)}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 mt-1">
                                {log.user?.nev} (@{log.user?.felhasznalonev})
                              </p>
                            </div>
                          </div>
                          {user.admin && (
                            <button
                              onClick={(e) => handleGroupRestore(e, log)}
                              disabled={restoringGroup}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest disabled:opacity-50"
                            >
                              {restoringGroup
                                ? "⏳ Visszaállítás..."
                                : "♻️ Mind visszavonása"}
                            </button>
                          )}
                        </div>
                        <div className="pl-14">
                          <details className="group/details">
                            <summary className="text-xs font-bold text-slate-500 cursor-pointer hover:text-slate-800 dark:hover:text-slate-300 transition-colors select-none">
                              Érintett termékek megjelenítése ({log.count} db) ▼
                            </summary>
                            <ul className="mt-3 space-y-1 bg-white/50 dark:bg-black/20 p-3 rounded-xl">
                              {log.items?.map((item) => (
                                <li
                                  key={item.id}
                                  className="text-xs flex justify-between items-center text-slate-700 dark:text-slate-300"
                                >
                                  <span>
                                    •{" "}
                                    <strong>
                                      {item.stock?.nev || "Ismeretlen"}
                                    </strong>
                                  </span>
                                  <span className="opacity-50 font-mono text-[10px]">
                                    #{item.stockId}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </details>
                        </div>
                      </div>
                    ) : (
                      // EGYEDI MEGJELENÍTÉS (Marad a régi)
                      <>
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-black text-sm">
                              {log.user?.nev?.charAt(0) || "?"}
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase text-blue-600 tracking-tight">
                                {log.user?.nev || "Törölt user"} • @
                                {log.user?.felhasznalonev || "---"}
                              </p>
                              <p className="text-base font-black dark:text-white">
                                {log.stock?.nev || "Törölt termék"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-slate-400 block mb-1">
                                {formatDate(log.idopont)}
                              </span>
                              <span
                                className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase ${
                                  log.muvelet === "DELETE"
                                    ? "bg-red-100 text-red-600"
                                    : log.muvelet === "CREATE"
                                      ? "bg-green-100 text-green-600"
                                      : log.muvelet === "RESTORE"
                                        ? "bg-emerald-100 text-emerald-600"
                                        : "bg-blue-100 text-blue-600"
                                }`}
                              >
                                {log.muvelet === "UPDATE"
                                  ? "📝 MÓDOSÍTÁS"
                                  : log.muvelet === "DELETE"
                                    ? "🗑️ TÖRLÉS"
                                    : log.muvelet === "CREATE"
                                      ? "✨ LÉTREHOZÁS"
                                      : "♻️ VISSZAÁLLÍTÁS"}
                              </span>
                            </div>
                            {user.admin &&
                              (log.muvelet === "UPDATE" ||
                                log.muvelet === "DELETE") && (
                                <button
                                  onClick={(e) => handleRestore(e, log.id)}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-90"
                                  title="Visszaállítás erre az állapotra"
                                >
                                  ♻️
                                </button>
                              )}
                          </div>
                        </div>
                        <div className="ml-12">
                          {log.muvelet === "UPDATE" ||
                          log.muvelet === "RESTORE" ? (
                            formatChangeDetailed(log)
                          ) : (
                            <p className="text-sm text-slate-500 italic">
                              {log.muvelet === "CREATE"
                                ? "✨ Termék felvétele a készletbe."
                                : "🗑️ Termék eltávolítása."}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {logs.length === 0 && (
                  <p className="text-center py-10 text-slate-400 italic">
                    Nincs rögzített tevékenység.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
        {user.admin && (
          <section className="bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-indigo-600/20 shadow-lg shadow-indigo-500/5 overflow-hidden">
            <button
              onClick={() =>
                setOpenSection(openSection === "admin" ? null : "admin")
              }
              className="w-full p-6 flex justify-between items-center bg-indigo-600/5 transition-colors font-black uppercase text-lg text-indigo-600"
            >
              <span>🛡️ Admin Felület</span>
              <span
                className={`transition-transform ${openSection === "admin" ? "rotate-180" : ""}`}
              >
                ▼
              </span>
            </button>
            {openSection === "admin" && (
              <div className="p-8 space-y-10 animate-in slide-in-from-top-2">
                {editingUser && (
                  <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-200 rounded-[2rem] animate-in zoom-in-95">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-black uppercase text-xs text-blue-600">
                        Adminisztrátori szerkesztés:{" "}
                        {editingUser.felhasznalonev}
                      </h4>
                      <button
                        onClick={() => setEditingUser(null)}
                        className="text-slate-400 text-xl font-bold"
                      >
                        ✕
                      </button>
                    </div>
                    <form
                      onSubmit={handleAdminUpdate}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      <div>
                        <label className={labelClass}>Teljes Név</label>
                        <input
                          type="text"
                          value={adminEditForm.nev}
                          onChange={(e) =>
                            setAdminEditForm({
                              ...adminEditForm,
                              nev: e.target.value,
                            })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Felhasználónév</label>
                        <input
                          type="text"
                          value={adminEditForm.felhasznalonev}
                          onChange={(e) =>
                            setAdminEditForm({
                              ...adminEditForm,
                              felhasznalonev: e.target.value,
                            })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Email</label>
                        <input
                          type="email"
                          value={adminEditForm.email}
                          onChange={(e) =>
                            setAdminEditForm({
                              ...adminEditForm,
                              email: e.target.value,
                            })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Telefon</label>
                        <input
                          type="text"
                          value={adminEditForm.telefonszam}
                          onChange={(e) =>
                            setAdminEditForm({
                              ...adminEditForm,
                              telefonszam: e.target.value,
                            })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>
                          Új jelszó (felülírás)
                        </label>
                        <input
                          type="text"
                          value={adminEditForm.ujJelszo}
                          onChange={(e) =>
                            setAdminEditForm({
                              ...adminEditForm,
                              ujJelszo: e.target.value,
                            })
                          }
                          className={inputClass}
                          placeholder="Csak ha változik..."
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Rang</label>
                        <select
                          value={adminEditForm.admin ? "true" : "false"}
                          onChange={(e) =>
                            setAdminEditForm({
                              ...adminEditForm,
                              admin: e.target.value === "true",
                            })
                          }
                          className={inputClass}
                        >
                          <option value="false">📦 Kezelő</option>
                          <option value="true">🛡️ Adminisztrátor</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        className="md:col-span-2 bg-blue-600 text-white p-3 rounded-xl font-black uppercase text-xs shadow-lg"
                      >
                        Módosítások mentése adminként
                      </button>
                    </form>
                  </div>
                )}

                <div className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b pb-2">
                    Várakozó kérelmek
                  </h3>
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 rounded-2xl flex justify-between items-center"
                    >
                      <div>
                        <p className="text-[10px] font-black text-amber-600 uppercase">
                          {req.tipus}
                        </p>
                        <p className="text-xs font-black dark:text-white">
                          @{req.user.felhasznalonev} ➔ {req.ujErtek}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            await handleAdminRequest(req.id, "APPROVED");
                            await loadData();
                          }}
                          className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase"
                        >
                          OK
                        </button>
                        <button
                          onClick={async () => {
                            await handleAdminRequest(req.id, "REJECTED");
                            await loadData();
                          }}
                          className="bg-rose-500 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase"
                        >
                          X
                        </button>
                      </div>
                    </div>
                  ))}
                  {pendingRequests.length === 0 && (
                    <p className="text-center py-4 text-slate-400 italic text-sm">
                      Nincs várakozó kérelem.
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b pb-2">
                    Rendszer felhasználói
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allUsers.map((u) => (
                      <div
                        key={u.id}
                        className={`p-4 rounded-2xl border transition-all ${u.isBanned ? "bg-red-50 dark:bg-red-900/10 border-red-200" : "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-700"}`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-black text-sm dark:text-white">
                              {u.nev} {u.admin && "🛡️"}
                            </p>
                            <p className="text-[10px] text-slate-500 font-bold">
                              {u.email}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => openAdminEdit(u)}
                              className="p-2 bg-white dark:bg-slate-700 rounded-xl border border-slate-200 text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={async () => {
                                await toggleUserBan(u.id);
                                await loadData();
                              }}
                              className={`p-2 rounded-xl border transition-all ${u.isBanned ? "bg-emerald-500 text-white border-emerald-400" : "bg-white dark:bg-slate-700 border-slate-200 shadow-sm"}`}
                            >
                              {u.isBanned ? "🔓" : "🚫"}
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(`Törlöd ${u.nev} felhasználót?`)) {
                                  await deleteUserPermanently(u.id);
                                  await loadData();
                                }
                              }}
                              className="p-2 bg-white dark:bg-slate-700 rounded-xl border border-slate-200 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default Profile;