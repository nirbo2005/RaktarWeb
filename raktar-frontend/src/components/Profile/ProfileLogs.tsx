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
    popup: "rounded-[2.5rem] bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl font-sans",
    confirmButton: "bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest mx-2 transition-all active:scale-95",
    cancelButton: "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest mx-2 transition-all active:scale-95",
    denyButton: "bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest mx-2 transition-all active:scale-95",
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
  const { t, i18n } = useTranslation();
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
      console.error(t("logs.misc.fetchError"), err);
    }
  }, [user?.id, isAdmin, filters, allUsers.length, t]);

  useAutoRefresh(loadData);

  const executeRestore = async (ids: number[]) => {
    MySwal.fire({
      title: t("common.loading"),
      allowOutsideClick: false,
      didOpen: () => {
        MySwal.showLoading();
      }
    });

    try {
      await Promise.all(ids.map(id => restoreAction(id, user!.id)));
      MySwal.close();
      toast.fire({ icon: "success", title: t("profile.alerts.restored") });
      loadData();
    } catch (err) {
      MySwal.close();
      MySwal.fire(t("common.error"), t("profile.alerts.restoreFailed"), "error");
    }
  };

  const handleRestore = async (logOrGroup: any) => {
    if (logOrGroup.isGroup) {
      const result = await MySwal.fire({
        title: t("profile.alerts.groupRestoreTitle"),
        text: t("profile.alerts.groupRestoreText", { count: logOrGroup.items.length }),
        icon: "question",
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: t("profile.alerts.groupRestoreConfirmAll"),
        denyButtonText: t("profile.alerts.groupRestoreChoose"),
        cancelButtonText: t("common.back"),
      });

      if (result.isConfirmed) {
        await executeRestore(logOrGroup.items.map((i: any) => i.id));
      } else if (result.isDenied) {
        const { value: selectedIds } = await MySwal.fire({
          title: t("logs.operations.bulkDelete"),
          html: `
            <div class="flex flex-col gap-2 max-h-64 overflow-y-auto p-4 custom-scrollbar text-left">
              ${logOrGroup.items.map((item: any) => `
                <label class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                  <input type="checkbox" value="${item.id}" class="swal2-restore-check w-4 h-4 rounded border-slate-300 text-blue-600" checked>
                  <span class="text-sm font-bold text-slate-700 dark:text-slate-200">${item.product?.nev || t("common.unknown")}</span>
                </label>
              `).join('')}
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: t("common.restore"),
          cancelButtonText: t("common.cancel"),
          preConfirm: () => {
            const checks = document.querySelectorAll('.swal2-restore-check:checked') as NodeListOf<HTMLInputElement>;
            return Array.from(checks).map(c => parseInt(c.value));
          }
        });

        if (selectedIds && selectedIds.length > 0) {
          await executeRestore(selectedIds);
        }
      }
    } else {
      const result = await MySwal.fire({
        title: t("profile.alerts.restoreTitle"),
        text: t("profile.alerts.restoreText"),
        icon: "question",
        showCancelButton: true,
        confirmButtonText: t("profile.alerts.restoreBtn"),
        cancelButtonText: t("common.cancel"),
      });

      if (result.isConfirmed) {
        await executeRestore([logOrGroup.id]);
      }
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleString(i18n.language === "hu" ? "hu-HU" : "en-US");

  const getMuveletLabel = (muvelet: string, isGroup: boolean = false) => {
    if (isGroup) return t("logs.operations.bulkDelete");
    switch (muvelet) {
      case "PRODUCT_CREATE": return t("logs.operations.productCreate");
      case "PRODUCT_UPDATE": return t("logs.operations.update");
      case "BATCH_UPDATE": return t("logs.operations.batch");
      case "BATCH_CREATE": return t("logs.operations.batchCreate", "Új sarzs");
      case "PRODUCT_DELETE": return t("logs.operations.delete");
      case "PRODUCT_RESTORE": return t("logs.operations.restored");
      case "PRODUCT_BULK_DELETE": return t("logs.operations.bulkDelete");
      case "WAREHOUSE_SORT": return t("logs.operations.warehouseSort", "Raktár optimalizálás");
      default: return muvelet;
    }
  };

  const getMuveletColor = (muvelet: string, isGroup: boolean = false) => {
    if (isGroup || muvelet.includes('DELETE')) return "bg-rose-100 text-rose-700";
    if (muvelet === 'BATCH_UPDATE') return "bg-amber-100 text-amber-700";
    if (muvelet === 'PRODUCT_CREATE') return "bg-emerald-100 text-emerald-700";
    if (muvelet === 'PRODUCT_RESTORE') return "bg-indigo-100 text-indigo-700";
    if (muvelet === 'WAREHOUSE_SORT') return "bg-teal-100 text-teal-700";
    return "bg-blue-100 text-blue-700";
  };

  // Adatbázis mezőnevek dinamikus fordítása
  const translateKey = (key: string) => {
    const keyMap: Record<string, string> = {
      message: t("logs.fields.message", "Üzenet"),
      nev: t("logs.fields.name", "Név"),
      gyarto: t("logs.fields.manufacturer", "Gyártó"),
      kategoria: t("logs.fields.category", "Kategória"),
      mennyiseg: t("logs.fields.quantity", "Mennyiség"),
      minimumKeszlet: t("logs.fields.minStock", "Min. Készlet"),
      lejarat: t("logs.fields.expiry", "Lejárat"),
      parcella: t("logs.fields.plot", "Polc/Parcella"),
    };
    return keyMap[key] || key;
  };

  // Backendről érkező nyers szövegek fordítása
  const translateValue = (val: any) => {
    if (val === null || val === undefined) return "Ø";
    if (typeof val === "string") {
      if (val.includes("Optimalizált rendezés lefutott")) {
        return t("logs.misc.sortRun", "Optimalizált rendezés lefutott");
      }
    }
    return val instanceof Object ? JSON.stringify(val) : String(val);
  };

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
              <span className="text-slate-400 font-bold uppercase text-[9px]">{t("logs.fields.sourceShelf")} ({regi?.parcella || t("logs.fields.na")}):</span>
              <span className="font-black text-rose-500">
                {regi?.mennyiseg ?? 0} {t("common.pieces")} ➔ {uj.source ? uj.source.mennyiseg : 0} {t("common.pieces")}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold uppercase text-[9px]">{t("logs.fields.targetShelf")} ({uj.target?.parcella || t("logs.fields.na")}):</span>
              <span className="font-black text-emerald-500">
                  +{uj._movedQty} {t("common.pieces")} ({t("logs.fields.total")}: {uj.target?.mennyiseg ?? 0} {t("common.pieces")})
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
        const displayOld = translateValue(valOld);
        const displayNew = translateValue(valNew);

        changes.push(
          <div key={key} className="flex items-center gap-2 text-xs py-0.5">
            <span className="font-black uppercase text-[9px] text-slate-400 w-24 truncate" title={key}>{translateKey(key)}:</span>
            <span className="text-rose-400 font-medium truncate max-w-[120px]" title={displayOld}>{displayOld}</span>
            <span className="text-slate-400 shrink-0">➔</span>
            <span className="text-emerald-500 font-black truncate flex-1" title={displayNew}>{displayNew}</span>
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
              <option value="PRODUCT_RESTORE">{t("logs.operations.restored")}</option>
              <option value="PRODUCT_BULK_DELETE">{t("logs.operations.bulkDelete")}</option>
              <option value="WAREHOUSE_SORT">{t("logs.operations.warehouseSort", "Raktár optimalizálás")}</option>
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
                 className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-[2rem] shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getMuveletColor(log.muvelet, log.isGroup)}`}>
                     {getMuveletLabel(log.muvelet, log.isGroup)}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 italic">{formatDate(log.idopont)}</span>
                </div>
                {log.muvelet !== "PRODUCT_RESTORE" && !log.ujAdat?._moveType && (
                  <button onClick={(e) => { e.stopPropagation(); handleRestore(log); }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg">
                    {t("common.restore")}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 mb-3 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl">
                 <span className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-[10px] font-black text-white">{log.user.nev.charAt(0)}</span>
                 <span className="text-xs font-black dark:text-white">{log.user.nev} <span className="text-slate-400 font-medium">(@{log.user.felhasznalonev})</span></span>
              </div>
              <div className="pl-4 mt-2">
                {log.isGroup ? (
                  <div className="space-y-1">
                    <p className="text-xs font-black text-rose-500 mb-2 uppercase tracking-tighter">{t("logs.operations.bulkItems", { count: log.items.length })}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {log.items.map((item: any) => (
                        <div key={item.id} onClick={() => item.productId && navigate(`/product/${item.productId}`)} 
                             className="text-xs dark:text-slate-300 font-medium bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 cursor-pointer hover:border-blue-300 transition-all">
                            • {item.product?.nev}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-800/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 cursor-pointer"
                       onClick={() => log.productId && navigate(`/product/${log.productId}`)}>
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