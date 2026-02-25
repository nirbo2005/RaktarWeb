import React, { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getProducts,
  deleteProduct,
  deleteManyProducts,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import type { Product } from "../../types/Product";
import { QRCodeSVG } from "qrcode.react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import Swal from 'sweetalert2';
import { useTranslation } from "react-i18next";

const MySwal = Swal.mixin({
  customClass: {
    popup: 'rounded-[2.5rem] bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl font-sans',
    confirmButton: 'bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 mx-2',
    cancelButton: 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 mx-2',
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

type SortColumn = "nev" | "kategoria" | "mennyiseg";

const getTotalQuantity = (product: Product) => {
  if (!product.batches || product.batches.length === 0) return 0;
  return product.batches.reduce((sum, b) => sum + b.mennyiseg, 0);
};

const getEarliestExpiry = (product: Product) => {
  if (!product.batches || product.batches.length === 0) return null;
  const dates = product.batches
    .filter(b => b.lejarat)
    .map(b => new Date(b.lejarat!));
  if (dates.length === 0) return null;
  return new Date(Math.min(...dates.map(d => d.getTime())));
};

const getAlertPriority = (p: Product) => {
  const now = new Date();
  const oneWeekLater = new Date();
  oneWeekLater.setDate(now.getDate() + 7);
  const earliestExpiry = getEarliestExpiry(p);
  const totalQty = getTotalQuantity(p);

  if (earliestExpiry && earliestExpiry <= now) return 100;
  if (earliestExpiry && earliestExpiry <= oneWeekLater) return 90;
  if (totalQty < p.minimumKeszlet) return 80;
  if (totalQty < p.minimumKeszlet * 2) return 70;
  return 0;
};

function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sortColumn, setSortColumn] = useState<SortColumn>("nev");
  const [isAscending, setIsAscending] = useState(true);
  const [showAlertsOnly, setShowAlertsOnly] = useState(false);
  const [expandedRowIds, setExpandedRowIds] = useState<number[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const canEdit = user && (user.rang === "KEZELO" || user.rang === "ADMIN");

  const fetchProducts = useCallback(async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      console.error("Adatbetöltési hiba:", err);
    }
  }, []);

  useAutoRefresh(fetchProducts);

  const toggleRow = (id: number) => {
    setExpandedRowIds(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const handleShowQR = (p: Product) => {
    const productUrl = `${window.location.origin}/product/${p.id}`;
    MySwal.fire({
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonText: t('product.list.print'),
      cancelButtonText: t('common.close'),
      html: `
        <div id="print-qr-area" class="flex flex-col items-center justify-center p-8 bg-white rounded-3xl">
          <div class="mb-4 text-center">
            <h2 class="text-3xl font-black text-black uppercase tracking-tighter">${p.nev}</h2>
            <p class="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">#${p.id} - ${p.gyarto}</p>
          </div>
          <div class="p-4 border-4 border-black rounded-xl">
             <div id="qr-svg-container"></div>
          </div>
        </div>
      `,
      didOpen: async () => {
        const ReactDOMClient = await import("react-dom/client");
        const container = document.getElementById("qr-svg-container");
        if (container) {
          const root = ReactDOMClient.createRoot(container);
          root.render(<QRCodeSVG value={productUrl} size={300} level="H" includeMargin={false} />);
        }
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const printContent = document.getElementById('print-qr-area');
        if (printContent) {
          const originalContent = document.body.innerHTML;
          document.body.innerHTML = printContent.innerHTML;
          window.print();
          document.body.innerHTML = originalContent;
          window.location.reload(); 
        }
      }
    });
  };

  const filteredAndSortedProducts = useMemo(() => {
    let list = showAlertsOnly
      ? products.filter((p) => getAlertPriority(p) > 0)
      : [...products];
    list.sort((a, b) => {
      if (showAlertsOnly) {
        const prioA = getAlertPriority(a);
        const prioB = getAlertPriority(b);
        if (prioA !== prioB) return prioB - prioA;
      }
      let comp = 0;
      if (sortColumn === "mennyiseg") comp = getTotalQuantity(a) - getTotalQuantity(b);
      else if (sortColumn === "kategoria") comp = a.kategoria.localeCompare(b.kategoria);
      else comp = a.nev.localeCompare(b.nev);
      return isAscending ? comp : -comp;
    });
    return list;
  }, [products, sortColumn, isAscending, showAlertsOnly]);

  const exportToExcel = async () => {
    if (!canEdit) return;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(t('product.list.excel.sheetName'));

    worksheet.columns = [
      { header: t('product.list.excel.name'), key: "nev", width: 25 },
      { header: t('product.list.excel.manufacturer'), key: "gyarto", width: 20 },
      { header: t('product.list.excel.category'), key: "kategoria", width: 20 },
      { header: t('product.list.excel.quantity'), key: "mennyiseg", width: 20 },
      { header: t('product.list.excel.earliestExpiry'), key: "lejarat", width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } };

    const now = new Date();

    filteredAndSortedProducts.forEach((p) => {
      const earliestExpiry = getEarliestExpiry(p);
      const totalQty = getTotalQuantity(p);
      const row = worksheet.addRow({
        nev: p.nev,
        gyarto: p.gyarto,
        kategoria: t(`product.categories.${p.kategoria}`),
        mennyiseg: totalQty,
        lejarat: earliestExpiry ? earliestExpiry.toLocaleDateString("hu-HU") : t('product.list.nonPerishable'),
      });

      if ((earliestExpiry && earliestExpiry <= now) || totalQty < p.minimumKeszlet) {
        row.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
          cell.font = { color: { argb: "FF991B1B" }, bold: true };
        });
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `raktar_export_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.fire({ icon: 'success', title: t('product.list.alerts.excelReady') });
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    if (!user || !canEdit || selectedIds.length === 0) return;
    const result = await MySwal.fire({
      title: t('product.list.alerts.bulkDeleteTitle'),
      text: t('product.list.alerts.bulkDeleteText', { count: selectedIds.length }),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t('common.yes'),
      cancelButtonText: t('common.cancel')
    });
    if (result.isConfirmed) {
      try {
        await deleteManyProducts(selectedIds, user.id);
        setSelectedIds([]);
        setIsSelectionMode(false);
        toast.fire({ icon: 'success', title: t('product.list.alerts.bulkDeleted') });
      } catch (err) {
        MySwal.fire(t('common.error'), t('product.list.alerts.bulkDeleteFailed'), 'error');
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!user || !canEdit) return;
    const result = await MySwal.fire({
      title: t('product.list.alerts.deleteTitle'),
      text: t('product.list.alerts.deleteText'),
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: t('common.yes'),
      cancelButtonText: t('common.cancel')
    });
    if (result.isConfirmed) {
      try {
        await deleteProduct(id, user.id);
        toast.fire({ icon: 'success', title: t('product.list.alerts.deleted') });
      } catch (err) {
        MySwal.fire(t('common.error'), t('product.list.alerts.deleteFailed'), 'error');
      }
    }
  };

  const handleSort = (column: SortColumn) => {
    if (column === sortColumn) setIsAscending(!isAscending);
    else { setSortColumn(column); setIsAscending(true); }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAndSortedProducts.length) setSelectedIds([]);
    else setSelectedIds(filteredAndSortedProducts.map(p => p.id));
  };

  const getDateStyles = (lejaratStr: string | Date | null) => {
    if (!lejaratStr) return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400";
    const lejarat = new Date(lejaratStr);
    const now = new Date();
    const oneWeek = new Date();
    oneWeek.setDate(now.getDate() + 7);
    if (lejarat <= now) return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
    if (lejarat <= oneWeek) return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400";
  };

  return (
    <div className="min-h-screen p-4 md:p-10 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 text-left">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-12">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate("/")}>
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <span className="text-3xl text-white">📦</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">
              {t('product.list.title')}
            </h1>
          </div>

          <div className="flex flex-wrap gap-3 w-full xl:w-auto xl:justify-end">
            {canEdit && isSelectionMode && selectedIds.length > 0 && (
              <button onClick={handleBulkDelete} className="flex-1 sm:flex-none bg-red-600 text-white px-6 py-4 rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all">
                {t('product.list.bulkDelete', { count: selectedIds.length })}
              </button>
            )}

            {canEdit && (
              <>
                <button onClick={() => setShowAlertsOnly(!showAlertsOnly)} className={`flex-1 sm:flex-none px-6 py-4 rounded-2xl font-bold border-2 text-xs uppercase tracking-widest transition-all ${showAlertsOnly ? "bg-red-600 border-red-400 text-white" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"}`}>
                  {showAlertsOnly ? t('product.list.filterErrors') : t('product.list.filterAll')}
                </button>
                <button onClick={exportToExcel} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-4 rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all">
                  {t('product.list.export')}
                </button>
                <button onClick={toggleSelectionMode} className={`flex-1 sm:flex-none px-6 py-4 rounded-2xl font-black uppercase text-xs shadow-lg transition-all ${isSelectionMode ? "bg-slate-700 text-white" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600"}`}>
                  {isSelectionMode ? t('product.list.selectModeOn') : t('product.list.selectModeOff')}
                </button>
                <button onClick={() => navigate("/add")} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all">
                  {t('product.list.newProduct')}
                </button>
              </>
            )}
          </div>
        </div>

        {filteredAndSortedProducts.length > 0 ? (
          <>
            <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-all">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-200 dark:border-slate-800">
                    <th className="p-6 text-center w-12"></th>
                    {canEdit && isSelectionMode && (
                      <th className="p-6 text-center w-12"><input type="checkbox" checked={selectedIds.length === filteredAndSortedProducts.length} onChange={toggleSelectAll} className="w-4 h-4 rounded text-blue-600" /></th>
                    )}
                    <th className="p-6 text-center w-24">{t('product.list.headers.qr')}</th>
                    <th className="p-6 cursor-pointer hover:text-blue-500 text-left" onClick={() => handleSort("nev")}>{t('product.list.headers.product')} {sortColumn === "nev" && (isAscending ? "↑" : "↓")}</th>
                    <th className="p-6 cursor-pointer hover:text-blue-500 text-left" onClick={() => handleSort("kategoria")}>{t('product.list.headers.category')} {sortColumn === "kategoria" && (isAscending ? "↑" : "↓")}</th>
                    <th className="p-6 cursor-pointer hover:text-blue-500 text-left" onClick={() => handleSort("mennyiseg")}>{t('product.list.headers.totalStock')} {sortColumn === "mennyiseg" && (isAscending ? "↑" : "↓")}</th>
                    {canEdit && <th className="p-6 text-right">{t('product.list.headers.actions')}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {filteredAndSortedProducts.map((p) => {
                    const totalQty = getTotalQuantity(p);
                    const isExpanded = expandedRowIds.includes(p.id);
                    return (
                      <React.Fragment key={p.id}>
                        <tr className={`transition-colors group ${selectedIds.includes(p.id) ? "bg-blue-50/50 dark:bg-blue-900/20" : "hover:bg-blue-50/30 dark:hover:bg-blue-900/10"}`}>
                          <td className="p-6 text-center cursor-pointer" onClick={() => toggleRow(p.id)}>
                            <div className={`transform transition-transform ${isExpanded ? "rotate-90 text-blue-500" : "text-slate-400"}`}>▶</div>
                          </td>
                          {canEdit && isSelectionMode && (
                            <td className="p-6 text-center"><input type="checkbox" className="w-4 h-4 rounded text-blue-600" checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} /></td>
                          )}
                          <td className="p-6 text-center">
                            <div className="inline-block bg-white p-1.5 rounded-xl border border-slate-100 cursor-zoom-in shadow-sm hover:scale-110 transition-transform" onClick={() => handleShowQR(p)}>
                              <QRCodeSVG value={`${window.location.origin}/product/${p.id}`} size={35} />
                            </div>
                          </td>
                          <td className="p-6 text-left">
                            <div className="font-black text-slate-800 dark:text-slate-100 text-lg cursor-pointer hover:text-blue-500" onClick={() => navigate(`/product/${p.id}`)}>{p.nev}</div>
                            <div className="text-slate-400 text-xs uppercase font-bold tracking-tight">{p.gyarto}</div>
                          </td>
                          <td className="p-6 text-left"><span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-black uppercase text-slate-600 dark:text-slate-400">{t(`product.categories.${p.kategoria}`)}</span></td>
                          <td className="p-6 text-left"><span className={`px-4 py-1.5 rounded-full text-xs font-black border ${totalQty < p.minimumKeszlet ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>{totalQty} {t('common.pieces')}</span></td>
                          {canEdit && (
                            <td className="p-6 text-right">
                              <div className="flex justify-end gap-3">
                                <button onClick={() => navigate(`/modify/${p.id}`)} className="bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white p-2.5 rounded-xl text-slate-600 dark:text-slate-300 shadow-sm transition-all">✏️</button>
                                <button onClick={() => handleDelete(p.id)} className="bg-slate-100 dark:bg-slate-800 hover:bg-red-600 hover:text-white p-2.5 rounded-xl text-slate-600 dark:text-slate-300 shadow-sm transition-all">🗑️</button>
                              </div>
                            </td>
                          )}
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                            <td colSpan={10} className="p-6 border-l-4 border-blue-500">
                              <div className="pl-6">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">{t('product.list.batches')}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {p.batches?.map(batch => (
                                    <div key={batch.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center group">
                                      <div>
                                        <button onClick={() => navigate(`/grid?parcel=${batch.parcella}&productId=${p.id}`)} className="block text-xl font-black italic text-slate-800 dark:text-white mb-1 hover:text-blue-500">{batch.parcella}</button>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getDateStyles(batch.lejarat)}`}>{batch.lejarat ? new Date(batch.lejarat).toLocaleDateString('hu-HU') : t('product.list.nonPerishable')}</span>
                                      </div>
                                      <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{batch.mennyiseg} <span className="text-xs">{t('common.pieces')}</span></div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredAndSortedProducts.map((p) => {
                const totalQty = getTotalQuantity(p);
                const isExpanded = expandedRowIds.includes(p.id);
                return (
                  <div key={p.id} className={`rounded-[2rem] p-6 border shadow-lg relative transition-all ${selectedIds.includes(p.id) ? "bg-blue-50/50 dark:bg-blue-900/40 border-blue-400" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"}`}>
                    {canEdit && isSelectionMode && (<div className="absolute top-4 right-4"><input type="checkbox" className="w-6 h-6 rounded border-slate-300 text-blue-600" checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} /></div>)}
                    <div className="flex justify-between items-start mb-6">
                      <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100" onClick={() => handleShowQR(p)}><QRCodeSVG value={`${window.location.origin}/product/${p.id}`} size={50} /></div>
                      <div className="flex flex-col gap-2 mr-8">
                        <span className="px-3 py-1 rounded-lg text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{t(`product.categories.${p.kategoria}`)}</span>
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black border ${totalQty < p.minimumKeszlet ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>📦 {totalQty} {t('common.pieces')}</span>
                      </div>
                    </div>
                    <div className="mb-6">
                      <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight cursor-pointer hover:text-blue-500" onClick={() => navigate(`/product/${p.id}`)}>{p.nev}</h3>
                      <p className="text-blue-600 dark:text-blue-500 font-bold text-xs uppercase tracking-widest mt-2">{p.gyarto}</p>
                    </div>
                    <button onClick={() => toggleRow(p.id)} className="w-full mb-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 flex justify-between items-center px-4">
                      <span>{t('product.list.batches')} ({p.batches?.length || 0})</span>
                      <span className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}>▼</span>
                    </button>
                    {isExpanded && (
                      <div className="mb-6 space-y-2">
                        {p.batches?.map(batch => (
                          <div key={batch.id} className="flex justify-between items-center bg-slate-100 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div>
                              <span className="font-black italic text-sm block">{batch.parcella}</span>
                              <span className={`text-[9px] font-bold uppercase ${getDateStyles(batch.lejarat)} px-1 rounded`}>{batch.lejarat ? new Date(batch.lejarat).toLocaleDateString() : t('product.list.nonPerishable')}</span>
                            </div>
                            <span className="font-black text-blue-600">{batch.mennyiseg} {t('common.pieces')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button onClick={() => navigate(`/product/${p.id}`)} className="flex-1 bg-slate-100 dark:bg-slate-800 py-3 rounded-xl font-bold text-xs uppercase">{t('product.list.details')}</button>
                      {canEdit && (
                        <>
                          <button onClick={() => navigate(`/modify/${p.id}`)} className="bg-blue-600/10 text-blue-600 p-3 rounded-xl">✏️</button>
                          <button onClick={() => handleDelete(p.id)} className="bg-red-600/10 text-red-600 p-3 rounded-xl">🗑️</button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="py-32 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 transition-all">
            <div className="text-6xl mb-4">✨</div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">{t('product.list.allGoodTitle')}</h2>
            <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.3em] mt-2">{t('product.list.allGoodSubtitle')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductList;