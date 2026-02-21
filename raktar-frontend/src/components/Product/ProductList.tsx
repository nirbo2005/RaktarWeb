//raktar-frontend/src/components/Product/ProductList.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getProducts,
  deleteProduct,
  deleteManyProducts,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import type { Product } from "../../types/Product";
import { QRCodeSVG } from "qrcode.react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import Swal from 'sweetalert2';

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

type SortColumn = "nev" | "lejarat" | "mennyiseg";

const getAlertPriority = (p: Product) => {
  const now = new Date();
  const oneWeekLater = new Date();
  oneWeekLater.setDate(now.getDate() + 7);
  if (p.lejarat <= now) return 100;
  if (p.lejarat <= oneWeekLater) return 90;
  if (p.mennyiseg < 10) return 80;
  if (p.mennyiseg < 100) return 70;
  return 0;
};

function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sortColumn, setSortColumn] = useState<SortColumn>("nev");
  const [isAscending, setIsAscending] = useState(true);
  const [showAlertsOnly, setShowAlertsOnly] = useState(false);
  
  // ÚJ ÁLLAPOT A KIJELÖLÉS MÓDHOZ
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const navigate = useNavigate();
  const { user } = useAuth();

  const canEdit = user && (user.rang === "KEZELO" || user.rang === "ADMIN");

  const fetchProducts = () => {
    getProducts().then((data) => {
      setProducts(data.map((p) => ({ ...p, lejarat: new Date(p.lejarat) })));
    });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleShowQR = (p: Product) => {
    const productUrl = `${window.location.origin}/product/${p.id}`;

    MySwal.fire({
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonText: '🖨️ Nyomtatás',
      cancelButtonText: 'Bezárás',
      html: `
        <div id="print-qr-area" class="flex flex-col items-center justify-center p-8 bg-white rounded-3xl">
          <div class="mb-4 text-center">
            <h2 class="text-3xl font-black text-black uppercase tracking-tighter">${p.nev}</h2>
            <p class="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">#${p.id} - ${p.parcella}</p>
          </div>
          <div class="p-4 border-4 border-black rounded-xl">
             <div id="qr-svg-container"></div>
          </div>
        </div>
      `,
      didOpen: () => {
        import("react-dom/client").then((ReactDOMClient) => {
          const container = document.getElementById("qr-svg-container");
          if (container) {
            const root = ReactDOMClient.createRoot(container);
            root.render(<QRCodeSVG value={productUrl} size={300} level="H" includeMargin={false} />);
          }
        });
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
      if (sortColumn === "lejarat")
        comp = a.lejarat.getTime() - b.lejarat.getTime();
      else if (sortColumn === "mennyiseg") comp = a.mennyiseg - b.mennyiseg;
      else comp = a.nev.localeCompare(b.nev);
      return isAscending ? comp : -comp;
    });
    return list;
  }, [products, sortColumn, isAscending, showAlertsOnly]);

  const exportToExcel = async () => {
    if (!canEdit) return;
    if (showAlertsOnly && filteredAndSortedProducts.length === 0) return; // Biztonsági gát

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Raktárkészlet");

    const columns = [
      { header: "Terméknév", key: "nev" },
      { header: "Gyártó", key: "gyarto" },
      { header: "Parcella", key: "parcella" },
      { header: "Lejárat", key: "lejarat" },
      { header: "Mennyiség (db)", key: "mennyiseg" },
    ];

    worksheet.columns = columns.map((col) => ({ ...col, width: 15 }));
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } };

    const now = new Date();
    const oneWeekLater = new Date();
    oneWeekLater.setDate(now.getDate() + 7);

    filteredAndSortedProducts.forEach((p) => {
      const row = worksheet.addRow({
        nev: p.nev,
        gyarto: p.gyarto,
        parcella: p.parcella,
        lejarat: p.lejarat.toLocaleDateString("hu-HU"),
        mennyiseg: p.mennyiseg,
      });

      const isExpired = p.lejarat <= now;
      const isCriticalQty = p.mennyiseg < 10;
      const isWarningDate = p.lejarat <= oneWeekLater;
      const isLowStock = p.mennyiseg < 100;

      if (isExpired || isCriticalQty) {
        row.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
          cell.font = { color: { argb: "FF991B1B" }, bold: true };
        });
      } else if (isWarningDate || isLowStock) {
        row.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };
          cell.font = { color: { argb: "FF92400E" }, bold: true };
        });
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const prefix = showAlertsOnly ? "problemas_tetelek" : "raktar_export";
    saveAs(new Blob([buffer]), `${prefix}_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.fire({ icon: 'success', title: 'Excel riport sikeresen legenerálva! 📊' });
  };

  // ÚJ: Kijelölési mód billentése
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedIds([]); // Ha kilépünk, töröljük a kijelölést
    }
  };

  const handleBulkDelete = async () => {
    if (!user || !canEdit || selectedIds.length === 0) return;

    const result = await MySwal.fire({
      title: 'Tömeges törlés',
      text: `Biztosan törölni szeretnél ${selectedIds.length} kijelölt terméket?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Igen, törlöm őket!',
      cancelButtonText: 'Mégse',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        await deleteManyProducts(selectedIds, user.id);
        setProducts((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
        setSelectedIds([]);
        setIsSelectionMode(false); // Sikeres törlés után kilépünk a módból
        toast.fire({ icon: 'success', title: 'A kijelölt tételek törlésre kerültek.' });
      } catch (err) {
        MySwal.fire('Hiba', 'Hiba történt a tömeges törlés során.', 'error');
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!user || !canEdit) return;

    const result = await MySwal.fire({
      title: 'Termék törlése',
      text: "Biztosan törölni szeretnéd ezt a terméket? Ez a művelet naplózásra kerül.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Törlés',
      cancelButtonText: 'Mégse'
    });

    if (result.isConfirmed) {
      try {
        await deleteProduct(id, user.id);
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setSelectedIds((prev) => prev.filter((i) => i !== id));
        toast.fire({ icon: 'success', title: 'Termék törölve.' });
      } catch (err) {
        MySwal.fire('Hiba', 'Nem sikerült a termék törlése.', 'error');
      }
    }
  };

  const handleSort = (column: SortColumn) => {
    if (column === sortColumn) {
      setIsAscending((prev) => !prev);
    } else {
      setSortColumn(column);
      setIsAscending(true);
    }
  };

  const toggleSelect = (id: number) => {
    if (!canEdit) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (!canEdit) return;
    if (selectedIds.length === filteredAndSortedProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAndSortedProducts.map((p) => p.id));
    }
  };

  const getDateStyles = (lejarat: Date) => {
    const now = new Date();
    const oneWeek = new Date();
    oneWeek.setDate(now.getDate() + 7);
    if (lejarat <= now)
      return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
    if (lejarat <= oneWeek)
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";
  };

  const getStockStyles = (qty: number) => {
    if (qty < 10)
      return "bg-red-600/10 text-red-600 dark:text-red-400 border-red-500/20";
    if (qty < 100)
      return "bg-amber-600/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    return "bg-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
  };

  return (
    <div className="min-h-screen p-4 md:p-10 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-12 text-left">
          <div
            className="flex items-center gap-4 group cursor-pointer shrink-0"
            onClick={() => navigate("/")}
          >
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <span className="text-3xl text-white">📦</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase transition-colors">
              Raktár
            </h1>
          </div>

          <div className="flex flex-wrap gap-3 w-full xl:w-auto xl:justify-end">
            {/* TÖMEGES TÖRLÉS VÉGREHAJTÓ GOMB */}
            {canEdit && isSelectionMode && selectedIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex-1 sm:flex-none bg-red-600 hover:bg-red-500 text-white px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-red-600/30 transition-all active:scale-95 flex items-center justify-center gap-2 animate-in fade-in zoom-in duration-300"
              >
                🗑️ Törlés ({selectedIds.length})
              </button>
            )}

            {/* SZŰRÉS GOMB */}
            {canEdit && (
              <button
                onClick={() => setShowAlertsOnly(!showAlertsOnly)}
                className={`flex-1 sm:flex-none px-6 py-4 rounded-2xl font-bold transition-all border-2 uppercase text-xs tracking-widest ${
                  showAlertsOnly
                    ? "bg-red-600 border-red-400 text-white shadow-lg shadow-red-600/30"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 shadow-sm hover:border-blue-400"
                }`}
              >
                {showAlertsOnly ? "🚨 Csak hibák" : "⚠️ Szűrés"}
              </button>
            )}

            {/* OKOS EXCEL GOMB */}
            {canEdit && (
              <button
                onClick={exportToExcel}
                disabled={showAlertsOnly && filteredAndSortedProducts.length === 0}
                className={`flex-1 sm:flex-none px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  showAlertsOnly && filteredAndSortedProducts.length === 0
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/30'
                }`}
              >
                {showAlertsOnly 
                  ? (filteredAndSortedProducts.length === 0 ? "☕ Igyál Egy Kávét (Minden Oké)" : "🚨 Baj Van, Főnök! (Excel)") 
                  : "📦 Csinálj Excelt Belőle!"}
              </button>
            )}

            {/* KIJELÖLÉS MÓD GOMB */}
            {canEdit && filteredAndSortedProducts.length > 0 && (
              <button
                onClick={toggleSelectionMode}
                className={`flex-1 sm:flex-none px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  isSelectionMode
                    ? "bg-slate-700 hover:bg-slate-600 text-white shadow-slate-700/30"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-400"
                }`}
              >
                {isSelectionMode ? "✖ Kijelölés vége" : "☑️ Több kijelölése"}
              </button>
            )}

            {/* ÚJ TERMÉK GOMB */}
            {canEdit && (
              <button
                onClick={() => navigate("/add")}
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="text-xl leading-none">+</span> Új Termék
              </button>
            )}
          </div>
        </div>

        {filteredAndSortedProducts.length > 0 ? (
          <>
            <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-all text-left">
              <table className="w-full border-collapse text-left transition-all">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-200 dark:border-slate-800">
                    {/* CSAK KIJELÖLÉS MÓDBAN JELENIK MEG */}
                    {canEdit && isSelectionMode && (
                      <th className="p-6 text-center w-12 animate-in fade-in zoom-in duration-300">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer transition-transform hover:scale-110"
                          checked={
                            selectedIds.length === filteredAndSortedProducts.length &&
                            filteredAndSortedProducts.length > 0
                          }
                          onChange={toggleSelectAll}
                        />
                      </th>
                    )}
                    <th className="p-6 text-center w-24">QR</th>
                    <th
                      className="p-6 cursor-pointer hover:text-blue-500 transition-colors"
                      onClick={() => handleSort("nev")}
                    >
                      Termék {sortColumn === "nev" && (isAscending ? "↑" : "↓")}
                    </th>
                    <th className="p-6">Helyszín</th>
                    <th
                      className="p-6 cursor-pointer hover:text-blue-500 transition-colors"
                      onClick={() => handleSort("lejarat")}
                    >
                      Lejárat{" "}
                      {sortColumn === "lejarat" && (isAscending ? "↑" : "↓")}
                    </th>
                    <th
                      className="p-6 cursor-pointer hover:text-blue-500 transition-colors"
                      onClick={() => handleSort("mennyiseg")}
                    >
                      Készlet{" "}
                      {sortColumn === "mennyiseg" && (isAscending ? "↑" : "↓")}
                    </th>
                    {canEdit && <th className="p-6 text-right">Művelet</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {filteredAndSortedProducts.map((p) => (
                    <tr
                      key={p.id}
                      className={`transition-colors group ${
                        selectedIds.includes(p.id)
                          ? "bg-blue-50/50 dark:bg-blue-900/20"
                          : "hover:bg-blue-50/30 dark:hover:bg-blue-900/10"
                      }`}
                    >
                      {/* CSAK KIJELÖLÉS MÓDBAN JELENIK MEG */}
                      {canEdit && isSelectionMode && (
                        <td className="p-6 text-center animate-in fade-in zoom-in duration-300">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer transition-transform hover:scale-110"
                            checked={selectedIds.includes(p.id)}
                            onChange={() => toggleSelect(p.id)}
                          />
                        </td>
                      )}
                      <td className="p-6 text-center">
                        <div 
                          className="inline-block bg-white p-1.5 rounded-xl border border-slate-100 cursor-zoom-in hover:scale-110 transition-transform active:scale-95 shadow-sm"
                          onClick={() => handleShowQR(p)}
                          title="Kattints a nagyításhoz és nyomtatáshoz"
                        >
                          <QRCodeSVG value={`${window.location.origin}/product/${p.id}`} size={35} />
                        </div>
                      </td>
                      <td className="p-6">
                        <div
                          className="font-black text-slate-800 dark:text-slate-100 text-lg cursor-pointer hover:text-blue-500 transition-colors inline-block"
                          onClick={() => navigate(`/product/${p.id}`)}
                        >
                          {p.nev}
                        </div>
                        <div className="text-slate-400 dark:text-slate-500 text-xs uppercase font-bold tracking-tight">
                          {p.gyarto}
                        </div>
                      </td>
                      <td className="p-6">
                        <button
                          onClick={() =>
                            navigate(
                              `/grid?parcel=${p.parcella}&productId=${p.id}`,
                            )
                          }
                          className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-1.5 rounded-xl border border-blue-100 dark:border-blue-500/20 font-mono font-black text-xs hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest"
                        >
                          {p.parcella}
                        </button>
                      </td>
                      <td className="p-6">
                        <span
                          className={`px-4 py-1.5 rounded-full text-xs font-black border transition-colors ${getDateStyles(p.lejarat)}`}
                        >
                          {p.lejarat.toLocaleDateString("hu-HU")}
                        </span>
                      </td>
                      <td className="p-6 whitespace-nowrap">
                        <span
                          className={`px-4 py-1.5 rounded-full text-xs font-black border transition-colors ${getStockStyles(p.mennyiseg)}`}
                        >
                          {p.mennyiseg} db
                        </span>
                      </td>
                      {canEdit && (
                        <td className="p-6 text-right">
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => navigate(`/modify/${p.id}`)}
                              className="bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white p-2.5 rounded-xl text-slate-600 dark:text-slate-300 transition-all shadow-sm"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="bg-slate-100 dark:bg-slate-800 hover:bg-red-600 hover:text-white p-2.5 rounded-xl text-slate-600 dark:text-slate-300 transition-all shadow-sm"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
              {filteredAndSortedProducts.map((p) => (
                <div
                  key={p.id}
                  className={`rounded-[2rem] p-6 border shadow-lg relative overflow-hidden transition-all ${
                    selectedIds.includes(p.id)
                      ? "bg-blue-50/50 dark:bg-blue-900/40 border-blue-400"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  {/* CSAK KIJELÖLÉS MÓDBAN JELENIK MEG */}
                  {canEdit && isSelectionMode && (
                    <div className="absolute top-4 right-4 z-10 animate-in fade-in duration-300">
                      <input
                        type="checkbox"
                        className="w-6 h-6 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => toggleSelect(p.id)}
                      />
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-6">
                    <div 
                      className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 cursor-zoom-in active:scale-95 transition-transform"
                      onClick={() => handleShowQR(p)}
                      title="Kattints a nagyításhoz és nyomtatáshoz"
                    >
                      <QRCodeSVG value={`${window.location.origin}/product/${p.id}`} size={50} />
                    </div>
                    <div className="flex flex-col gap-2 mr-8">
                      <span
                        className={`px-3 py-1 rounded-lg text-[10px] font-black border text-center transition-colors ${getDateStyles(p.lejarat)}`}
                      >
                        ⌛ {p.lejarat.toLocaleDateString("hu-HU")}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-lg text-[10px] font-black border text-center transition-colors ${getStockStyles(p.mennyiseg)}`}
                      >
                        📦 {p.mennyiseg} DB
                      </span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3
                      className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none mb-1 cursor-pointer hover:text-blue-500 transition-colors"
                      onClick={() => navigate(`/product/${p.id}`)}
                    >
                      {p.nev}
                    </h3>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-blue-600 dark:text-blue-500 font-bold text-xs uppercase tracking-widest">
                        {p.gyarto}
                      </p>
                      <button
                        onClick={() =>
                          navigate(
                            `/grid?parcel=${p.parcella}&productId=${p.id}`,
                          )
                        }
                        className="text-blue-600 dark:text-blue-400 text-xs font-mono font-black border-b border-blue-500/30 hover:text-blue-500"
                      >
                        {p.parcella}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => navigate(`/product/${p.id}`)}
                      className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold text-xs uppercase transition-all"
                    >
                      Részletek
                    </button>
                    {canEdit && (
                      <>
                        <button
                          onClick={() => navigate(`/modify/${p.id}`)}
                          className="bg-blue-600/10 text-blue-600 dark:text-blue-400 p-3 rounded-xl border border-blue-500/10 hover:bg-blue-600 hover:text-white transition-colors"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="bg-red-600/10 text-red-600 dark:text-red-400 p-3 rounded-xl border border-red-500/10 hover:bg-red-600 hover:text-white transition-colors"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="py-32 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
            <div className="text-6xl mb-4">✨</div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">
              Minden polc rendben
            </h2>
            <p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-xs tracking-[0.3em] mt-2 transition-colors">
              Nincs beavatkozást igénylő tétel
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductList;