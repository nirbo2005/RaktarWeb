// raktar-frontend/src/components/Profile/ProfileLogs.tsx
import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import { getAuditLogs, getAllUsers, restoreAction } from "../../services/api";
import type { AuditLog } from "../../types/AuditLog";
import Swal from "sweetalert2";

const MySwal = Swal.mixin({
  customClass: {
    popup: "rounded-[2.5rem] bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl",
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

const ProfileLogs = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    muvelet: "",
    startDate: "",
    endDate: "",
    targetUserId: "",
  });

  const isAdmin = user?.rang === "ADMIN";

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== "")
      );
      const logData = await getAuditLogs(user.id, isAdmin, activeFilters);
      setLogs(logData);
      
      if (isAdmin && allUsers.length === 0) {
        const users = await getAllUsers();
        setAllUsers(users);
      }
    } catch (err) {
      console.error("Hiba a napló betöltésekor:", err);
    }
  }, [user?.id, isAdmin, filters, allUsers.length]);

  useAutoRefresh(loadData);

  const handleRestore = async (logId: number) => {
    const result = await MySwal.fire({
      title: t("profile.alerts.restoreTitle"),
      text: t("profile.alerts.restoreText"),
      icon: "question",
      showCancelButton: true,
      confirmButtonText: t("profile.alerts.restoreBtn"),
      cancelButtonText: t("common.cancel"),
    });

    if (result.isConfirmed) {
      try {
        await restoreAction(logId, user!.id);
        toast.fire({ icon: "success", title: t("profile.alerts.restored") });
        loadData();
      } catch (err) {
        MySwal.fire(t("common.error"), t("profile.alerts.restoreFailed"), "error");
      }
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleString("hu-HU");

  const renderChanges = (log: AuditLog) => {
    const regi = log.regiAdat;
    const uj = log.ujAdat;

    if (uj && uj._moveType) {
      const isSplit = uj._moveType.includes("SPLIT");
      const isMerge = uj._moveType.includes("MERGE");

      return (
        <div className="space-y-3 mt-2 border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${isSplit ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"}`}>
              {isSplit ? t("logs.types.split") : t("logs.types.move")}
            </span>
            {isMerge && (
              <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-purple-100 text-purple-600">
                {t("logs.types.merge")}
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-2 bg-slate-100/50 dark:bg-slate-800/50 p-3 rounded-xl">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold uppercase text-[9px]">{t("logs.fields.sourceShelf")} ({regi?.parcella || "N/A"}):</span>
              <span className="font-black text-rose-500">
                {regi?.mennyiseg ?? 0} db ➔ {uj.source ? uj.source.mennyiseg : 0} db
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold uppercase text-[9px]">{t("logs.fields.targetShelf")} ({uj.target?.parcella || "N/A"}):</span>
              <span className="font-black text-emerald-500">
                  +{uj._movedQty} db ({t("logs.fields.total")}: {uj.target?.mennyiseg ?? 0} db)
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (log.muvelet === "PRODUCT_CREATE") return <span className="italic font-bold text-emerald-600">{t("logs.operations.productCreate")}</span>;
    if (log.muvelet === "PRODUCT_DELETE" || log.muvelet === "PRODUCT_BULK_DELETE") return <span className="italic text-rose-500">{t("logs.operations.productDelete")}</span>;
    if (log.muvelet === "PRODUCT_RESTORE") return <div className="text-xs text-indigo-500 font-bold">{t("logs.operations.restored")}: {regi?.nev || t("common.unknown")}</div>;

    if (!regi || !uj) return null;

    const changes: React.ReactNode[] = [];
    const keys = Object.keys(uj).filter(k => !k.startsWith('_') && k !== 'letrehozva' && k !== 'id' && k !== 'isDeleted' && k !== 'bekerules');

    for (const key of keys) {
      const valOld = regi[key];
      const valNew = uj[key];

      if (JSON.stringify(valOld) !== JSON.stringify(valNew)) {
        const displayOld = valOld instanceof Object ? JSON.stringify(valOld) : String(valOld ?? "Ø");
        const displayNew = valNew instanceof Object ? JSON.stringify(valNew) : String(valNew ?? "Ø");

        changes.push(
          <div key={key} className="flex items-center gap-2 text-xs py-0.5">
            <span className="font-black uppercase text-[9px] text-slate-400 w-24">{key}:</span>
            <span className="text-rose-400 font-medium">{displayOld}</span>
            <span className="text-slate-400">➔</span>
            <span className="text-emerald-500 font-black">{displayNew}</span>
          </div>
        );
      }
    }
    return changes.length > 0 ? <div className="space-y-1 mt-2 border-t border-slate-100 dark:border-slate-800 pt-2">{changes}</div> : null;
  };

  const groupedLogs = useMemo(() => {
    const groups: any[] = [];
    let currentBulk: any = null;
    logs.forEach((log) => {
      if (log.muvelet === "PRODUCT_BULK_DELETE") {
        const time = new Date(log.idopont).getTime();
        if (currentBulk && currentBulk.userId === log.userId && Math.abs(currentBulk.time - time) < 3000) {
          currentBulk.items.push(log);
        } else {
          currentBulk = { id: log.id, isGroup: true, userId: log.userId, time, muvelet: "PRODUCT_BULK_DELETE", user: log.user, idopont: log.idopont, items: [log] };
          groups.push(currentBulk);
        }
      } else {
        currentBulk = null;
        groups.push(log);
      }
    });
    return groups;
  }, [logs]);

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
          {t("profile.dashboard.logs.title")}
        </h2>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-2">{t("logs.filters.user")}</label>
            <select className="bg-white dark:bg-slate-900 p-2 rounded-xl text-xs font-bold outline-none dark:text-white border border-slate-200 dark:border-slate-700"
              value={filters.targetUserId} onChange={(e) => setFilters({...filters, targetUserId: e.target.value})}>
              <option value="">{t("logs.filters.allUsers")}</option>
              {allUsers.map(u => <option key={u.id} value={u.id}>{u.nev}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-2">{t("logs.filters.operation")}</label>
            <select className="bg-white dark:bg-slate-900 p-2 rounded-xl text-xs font-bold outline-none dark:text-white border border-slate-200 dark:border-slate-700"
              value={filters.muvelet} onChange={(e) => setFilters({...filters, muvelet: e.target.value})}>
              <option value="">{t("logs.filters.allOperations")}</option>
              <option value="PRODUCT_CREATE">{t("logs.operations.create")}</option>
              <option value="PRODUCT_UPDATE">{t("logs.operations.update")}</option>
              <option value="BATCH_UPDATE">{t("logs.operations.batch")}</option>
              <option value="PRODUCT_DELETE">{t("logs.operations.delete")}</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-2">{t("logs.filters.date")}</label>
            <input type="date" className="bg-white dark:bg-slate-900 p-2 rounded-xl text-xs font-bold outline-none dark:text-white border border-slate-200 dark:border-slate-700"
              value={filters.startDate} onChange={(e) => setFilters({...filters, startDate: e.target.value})} />
          </div>
          <button onClick={loadData} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all self-end h-10">
            {t("common.filterBtn")}
          </button>
        </div>

        <div className="space-y-4">
          {groupedLogs.map((log) => (
            <div key={log.isGroup ? `group-${log.id}` : log.id} 
                 onClick={() => !log.isGroup && log.productId && navigate(`/product/${log.productId}`)}
                 className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-[2rem] shadow-sm hover:shadow-md transition-all cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${log.muvelet === 'BATCH_UPDATE' ? "bg-amber-100 text-amber-700" : (log.muvelet === 'PRODUCT_CREATE' ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700")}`}>
                     {log.isGroup ? t("logs.operations.bulkDelete") : log.muvelet.replace("PRODUCT_", "TERMÉK ").replace("BATCH_", "KÉSZLET ")}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 italic">{formatDate(log.idopont)}</span>
                </div>
                {log.muvelet !== "PRODUCT_RESTORE" && !log.ujAdat?._moveType && (
                  <button onClick={(e) => { e.stopPropagation(); handleRestore(log.id); }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg">
                    {t("common.restore")}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 mb-3 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl inline-flex">
                 <span className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-[10px] font-black text-white">{log.user.nev.charAt(0)}</span>
                 <span className="text-xs font-black dark:text-white">{log.user.nev} <span className="text-slate-400 font-medium">(@{log.user.felhasznalonev})</span></span>
              </div>
              <div className="pl-4 mt-2">
                {log.isGroup ? (
                  <div className="space-y-1">
                    <p className="text-xs font-black text-rose-500 mb-2 uppercase tracking-tighter">{t("logs.operations.bulkItems", { count: log.items.length })}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {log.items.map((item: any) => <div key={item.id} className="text-xs dark:text-slate-300 font-medium bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100"> • {item.product?.nev}</div>)}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-800/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-black dark:text-slate-100 mb-1 uppercase tracking-tight">{log.product?.nev || t("logs.fields.system")}</p>
                    {renderChanges(log)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileLogs;