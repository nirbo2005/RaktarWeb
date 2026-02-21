//raktar-frontend/src/components/Profile/index.tsx
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { getAuditLogs, getAllUsers, getPendingRequests, restoreAction } from "../../services/api";
import Header from "./Header";
import Details from "./Details";
import Logs from "./Logs";
import Admin from "./Admin";
import type { AuditLog, User } from "../../types";
import Swal from 'sweetalert2';

const MySwal = Swal.mixin({
  customClass: {
    popup: 'rounded-[2.5rem] bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl',
    confirmButton: 'bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest mx-2 transition-all active:scale-95',
    cancelButton: 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest mx-2 transition-all active:scale-95',
    title: 'text-2xl font-black uppercase italic tracking-tighter',
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

const Profile = () => {
  const { user } = useAuth();
  const [openSection, setOpenSection] = useState<string | null>("details");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [logFilters, setLogFilters] = useState({ muvelet: "", startDate: "", endDate: "", targetUserId: "" });

  const isAdmin = user?.rang === "ADMIN";

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const activeFilters = Object.fromEntries(Object.entries(logFilters).filter(([_, value]) => value !== ""));
      const logData = await getAuditLogs(user.id, isAdmin, activeFilters);
      setLogs(logData);
      if (isAdmin) {
        const [users, reqs] = await Promise.all([getAllUsers(), getPendingRequests()]);
        setAllUsers(users);
        setPendingRequests(reqs);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [user, logFilters, isAdmin]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRestore = async (logId: number) => {
    const result = await MySwal.fire({
      title: 'Visszaállítás?',
      text: "Biztosan vissza szeretnéd állítani az eredeti állapotot?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Visszaállítás',
      cancelButtonText: 'Mégse',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        await restoreAction(logId, user!.id);
        toast.fire({ icon: 'success', title: 'Visszaállítás sikeres!' });
        loadData();
      } catch (err) {
        MySwal.fire('Hiba!', 'Nem sikerült a visszaállítás.', 'error');
      }
    }
  };

  const handleGroupRestore = async (group: any) => {
    const result = await MySwal.fire({
      title: 'Csoportos visszaállítás',
      text: `Biztosan visszaállítod mind a ${group.count} elemet?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Mindet vissza',
      cancelButtonText: 'Mégse',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        await Promise.all(group.items.map((item: any) => restoreAction(item.id, user!.id)));
        toast.fire({ icon: 'success', title: 'Csoportos visszaállítás kész!' });
        loadData();
      } catch (err) {
        MySwal.fire('Hiba!', 'Részleges vagy teljes hiba a visszaállításnál.', 'error');
      }
    }
  };

  if (!user) return <div className="p-10 text-center font-black italic uppercase animate-pulse">Betöltés...</div>;

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 space-y-6 select-none">
      <Header />
      {loading && <div className="text-center font-black text-blue-500 animate-pulse text-[10px] uppercase">Frissítés...</div>}
      
      <div className="space-y-6">
        {/* Saját profil szekció */}
        <section className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <button 
            onClick={() => setOpenSection(openSection === "details" ? null : "details")} 
            className="w-full p-5 flex justify-between items-center font-black uppercase text-lg dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span>👤 Saját profil adatok</span>
            <span className={`transition-transform duration-300 ${openSection === "details" ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {openSection === "details" && <Details />}
        </section>

        {/* Tevékenységnapló szekció */}
        <section className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <button 
            onClick={() => setOpenSection(openSection === "logs" ? null : "logs")} 
            className="w-full p-5 flex justify-between items-center font-black uppercase text-lg dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span>📜 Tevékenységnapló</span>
            <span className={`transition-transform duration-300 ${openSection === "logs" ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {openSection === "logs" && (
            <Logs 
              logs={logs} 
              allUsers={allUsers} 
              filters={logFilters} 
              setFilters={setLogFilters} 
              onRefresh={loadData} 
              onRestore={handleRestore} 
              onGroupRestore={handleGroupRestore} 
            />
          )}
        </section>

        {/* Admin felület szekció */}
        {isAdmin && (
          <section className="bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-indigo-600/20 shadow-lg overflow-hidden">
            <button 
              onClick={() => setOpenSection(openSection === "admin" ? null : "admin")} 
              className="w-full p-6 flex justify-between items-center font-black uppercase text-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
            >
              <span>🛡️ Admin Felület</span>
              <span className={`transition-transform duration-300 ${openSection === "admin" ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {openSection === "admin" && <Admin allUsers={allUsers} pendingRequests={pendingRequests} onRefresh={loadData} />}
          </section>
        )}
      </div>
    </div>
  );
};

export default Profile;