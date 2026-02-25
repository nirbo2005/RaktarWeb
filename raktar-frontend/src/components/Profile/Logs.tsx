import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { AuditLog } from "../../types";
import Swal from 'sweetalert2';
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useTranslation } from "react-i18next";

const MySwal = Swal.mixin({
  customClass: {
    popup: 'rounded-[2.5rem] bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl',
    confirmButton: 'bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest mx-2 transition-all active:scale-95',
  },
  buttonsStyling: false,
});

interface Props {
  logs: AuditLog[];
  allUsers: any[];
  filters: any;
  setFilters: (f: any) => void;
  onRefresh: () => void;
  onRestore: (logId: number) => void;
  onGroupRestore: (group: any) => void;
}

const Logs = ({ logs, allUsers, filters, setFilters, onRefresh, onRestore, onGroupRestore }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.rang === "ADMIN";
  const isKezelo = user?.rang === "KEZELO";

  const formatDate = (dateStr: any) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString("hu-HU", { 
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" 
    });
  };

  const getDiffText = (log: AuditLog) => {
    if (log.muvelet === "CREATE") return t('logs.diff.productAdded');
    if (log.muvelet === "DELETE" || log.muvelet === "BULK_DELETE") return t('logs.diff.productDeleted');
    try {
      const regi = typeof log.regiAdat === 'string' ? JSON.parse(log.regiAdat) : log.regiAdat;
      const uj = typeof log.ujAdat === 'string' ? JSON.parse(log.ujAdat) : log.ujAdat;
      if (!regi || !uj) return log.muvelet;
      
      const diffs: string[] = [];
      const labels: { [key: string]: string } = { nev: t('logs.labels.name'), mennyiseg: t('logs.labels.quantity'), parcella: t('logs.labels.plot'), gyarto: t('logs.labels.manufacturer'), ar: t('logs.labels.price') };
      
      Object.keys(labels).forEach(key => {
        if (regi[key] !== uj[key]) {
          diffs.push(`${labels[key]}: ${regi[key] ?? 'N/A'} -> ${uj[key] ?? 'N/A'}`);
        }
      });
      return diffs.join(", ");
    } catch (e) { return t('logs.diff.dataChanged'); }
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(t('logs.excel.sheetName'));

    worksheet.columns = [
      { header: t('logs.excel.product'), key: "termek", width: 30 },
      { header: t('logs.excel.changes'), key: "valtozasok", width: 50 },
      { header: t('logs.excel.action'), key: "muvelet", width: 15 },
      { header: t('logs.excel.user'), key: "user", width: 25 },
      { header: t('logs.excel.date'), key: "idopont", width: 20 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };

    logs.forEach(log => {
      worksheet.addRow({
        termek: (log as any).product?.nev || log.termekNev || t('logs.excel.system'),
        valtozasok: getDiffText(log),
        muvelet: log.muvelet,
        user: `${log.user?.nev || t('logs.excel.unknown')} (@${log.user?.felhasznalonev || '?'})`,
        idopont: formatDate(log.idopont),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `raktar_naplo_${new Date().toISOString().split('T')[0]}.xlsx`);
    MySwal.fire({ icon: 'success', title: t('logs.excel.ready'), timer: 2000, showConfirmButton: false });
  };

  const renderDiff = (log: AuditLog) => {
    if (log.muvelet === "CREATE") return <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest text-left">✨ {t('logs.diff.productAdded')}</p>;
    if (log.muvelet === "DELETE" || log.muvelet === "BULK_DELETE") return <p className="text-xs font-bold text-rose-500 uppercase tracking-widest text-left">🗑️ {t('logs.diff.productDeleted')}</p>;

    try {
      const regi = typeof log.regiAdat === 'string' ? JSON.parse(log.regiAdat) : log.regiAdat;
      const uj = typeof log.ujAdat === 'string' ? JSON.parse(log.ujAdat) : log.ujAdat;

      if (!regi || !uj) {
         if (log.muvelet === "RESTORE") return <p className="text-xs font-bold text-blue-500 uppercase tracking-widest text-left">♻️ {t('logs.diff.productRestored')}</p>;
         return null;
      }

      const changes: React.ReactNode[] = [];
      const keys = ['nev', 'mennyiseg', 'parcella', 'gyarto', 'ar'];
      const labels: { [key: string]: string } = { nev: t('logs.labels.name'), mennyiseg: t('logs.labels.quantity'), parcella: t('logs.labels.plot'), gyarto: t('logs.labels.manufacturer'), ar: t('logs.labels.price') };

      keys.forEach(key => {
        if (regi[key] !== uj[key]) {
          changes.push(
            <div key={key} className="flex items-center gap-2 text-xs py-1 border-b border-slate-100 dark:border-slate-800/50 last:border-0">
              <span className="font-black text-slate-400 dark:text-slate-500 uppercase text-[9px] w-20 text-left">{labels[key]}:</span>
              {log.muvelet === "RESTORE" ? (
                <>
                  <span className="text-emerald-500 font-bold">{regi[key] ?? 'N/A'}</span>
                  <span className="text-slate-400">←</span>
                  <span className="text-slate-400 line-through decoration-rose-500/50">{uj[key] ?? 'N/A'}</span>
                </>
              ) : (
                <>
                  <span className="text-rose-500 font-bold">{regi[key] ?? 'N/A'}</span>
                  <span className="text-slate-400">➔</span>
                  <span className="text-emerald-500 font-bold">{uj[key] ?? 'N/A'}</span>
                </>
              )}
            </div>
          );
        }
      });

      if (changes.length > 0) {
        return (
          <div className="space-y-1">
            {log.muvelet === "RESTORE" && (
              <p className="text-[10px] font-black text-blue-500 uppercase mb-2 tracking-tighter italic text-left">♻️ {t('logs.diff.reverted')}</p>
            )}
            <div className="space-y-1">{changes}</div>
          </div>
        );
      }
      return log.muvelet === "RESTORE" ? <p className="text-xs font-bold text-blue-500 uppercase tracking-widest text-left">♻️ {t('logs.diff.productRestored')}</p> : null;
    } catch (e) {
      return <p className="text-xs font-bold text-blue-500 uppercase tracking-widest text-left">♻️ {t('logs.diff.dataChanged')}</p>;
    }
  };

  const groupedLogs = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    const result: any[] = [];
    let currentGroup: any = null;
    logs.forEach((log: AuditLog) => {
      if (log.muvelet === "BULK_DELETE") {
        const timeDiff = currentGroup ? Math.abs(new Date(currentGroup.idopont).getTime() - new Date(log.idopont).getTime()) : 0;
        if (currentGroup && currentGroup.userId === log.userId && timeDiff < 2000) {
          currentGroup.items.push(log);
          currentGroup.count++;
        } else {
          if (currentGroup) result.push(currentGroup);
          currentGroup = { ...log, isGroup: true, items: [log], count: 1 };
        }
      } else {
        if (currentGroup) { result.push(currentGroup); currentGroup = null; }
        result.push(log);
      }
    });
    if (currentGroup) result.push(currentGroup);
    return result;
  }, [logs]);

  const getActionColor = (muvelet: string) => {
    switch (muvelet) {
      case 'CREATE': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'UPDATE': return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
      case 'DELETE':
      case 'BULK_DELETE': return 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400';
      case 'RESTORE': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="p-6 border-t border-slate-100 dark:border-slate-800">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 mb-8">
        {isAdmin && (
          <select value={filters.targetUserId} onChange={(e) => setFilters({ ...filters, targetUserId: e.target.value })} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-[10px] font-bold dark:text-white border border-slate-200 dark:border-slate-700 outline-none transition-all">
            <option value="">{t('logs.filters.allUsers')}</option>
            {allUsers?.map((u: any) => <option key={u.id} value={u.id}>{u.nev}</option>)}
          </select>
        )}
        <select value={filters.muvelet} onChange={(e) => setFilters({ ...filters, muvelet: e.target.value })} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-[10px] font-bold dark:text-white border border-slate-200 dark:border-slate-700 outline-none">
          <option value="">{t('logs.filters.allActions')}</option>
          <option value="CREATE">{t('logs.filters.create')}</option>
          <option value="UPDATE">{t('logs.filters.update')}</option>
          <option value="DELETE">{t('logs.filters.delete')}</option>
          <option value="BULK_DELETE">{t('logs.filters.bulkDelete')}</option>
          <option value="RESTORE">{t('logs.filters.restore')}</option>
        </select>
        <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 text-[10px] font-bold" />
        <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 text-[10px] font-bold" />
        <button onClick={() => onRefresh()} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-500/10">{t('logs.filters.filterBtn')}</button>
        <button onClick={exportToExcel} className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"><span>📊</span> {t('logs.filters.exportBtn')}</button>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {groupedLogs.map((log, index) => {
          const productId = (log as any).productId;
          return (
            <div 
              key={log.isGroup ? `group-${index}` : log.id} 
              className={`p-5 rounded-[2rem] border transition-all ${log.isGroup ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30" : "bg-white dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 hover:border-blue-300 dark:hover:bg-slate-800/60 cursor-pointer shadow-sm hover:shadow-xl"}`} 
              onClick={() => {
                if (!log.isGroup && productId) navigate(`/product/${productId}`);
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-inner">
                    {log.user?.nev?.charAt(0) || "?"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${getActionColor(log.muvelet)}`}>
                        {log.muvelet}
                      </span>
                      <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-tighter">
                        {log.user?.nev} <span className="text-blue-500/50">•</span> @{log.user?.felhasznalonev}
                      </p>
                    </div>
                    <h4 className="text-base font-black dark:text-white leading-tight">
                      {log.isGroup ? t('logs.misc.bulkDeleteCount', { count: log.count }) : ((log as any).product?.nev || log.termekNev || t('logs.misc.systemProcess'))}
                    </h4>
                  </div>
                </div>
                
                {(isAdmin || isKezelo) && log.muvelet !== "RESTORE" && (log.muvelet === "UPDATE" || log.muvelet === "DELETE" || log.isGroup) && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); log.isGroup ? onGroupRestore(log) : onRestore(log.id); }} 
                    className="bg-emerald-500 hover:bg-emerald-400 text-white p-2.5 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-90"
                    title={t('logs.filters.restore')}
                  >♻️</button>
                )}
              </div>

              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-950/40 rounded-[1.5rem] border border-slate-100 dark:border-slate-800/50">
                {renderDiff(log)}
              </div>

              <div className="mt-3 flex justify-between items-center px-2">
                <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 italic">{formatDate(log.idopont)}</p>
                {!log.isGroup && <span className="text-[9px] font-black uppercase text-blue-500/40 tracking-widest italic">{t('logs.misc.viewDetails')}</span>}
              </div>
            </div>
          );
        })}
        {groupedLogs.length === 0 && (
          <p className="text-center py-10 text-slate-400 font-bold uppercase text-xs tracking-widest animate-pulse">
            {t('logs.misc.noLogs')}
          </p>
        )}
      </div>
    </div>
  );
};

export default Logs;