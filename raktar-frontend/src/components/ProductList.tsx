/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProducts, deleteProduct } from "../services/api";
import { useAuth } from "../context/AuthContext";
import type { Product } from "../types/Product";
import { QRCodeSVG } from "qrcode.react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

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

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    getProducts().then((data) => {
      setProducts(data.map((p) => ({ ...p, lejarat: new Date(p.lejarat) })));
    });
  }, []);

  // PROFESSZIONÁLIS EXCEL EXPORT (Színekkel és oszlopszélességgel)
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Raktárkészlet");

    // Fejlécek meghatározása
    const columns = [
      { header: "Terméknév", key: "nev" },
      { header: "Gyártó", key: "gyarto" },
      { header: "Parcella", key: "parcella" },
      { header: "Lejárat", key: "lejarat" },
      { header: "Mennyiség (db)", key: "mennyiseg" },
    ];

    worksheet.columns = columns.map(col => ({ ...col, width: 15 }));

    // Fejléc stílus (Félkövér, Szürke háttér)
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF334155" }, // Slate-700
    };

    const now = new Date();
    const oneWeekLater = new Date();
    oneWeekLater.setDate(now.getDate() + 7);

    // Adatok hozzáadása és színezése
    filteredAndSortedProducts.forEach((p) => {
      const row = worksheet.addRow({
        nev: p.nev,
        gyarto: p.gyarto,
        parcella: p.parcella,
        lejarat: p.lejarat.toLocaleDateString("hu-HU"),
        mennyiseg: p.mennyiseg,
      });

      // Szabályok ellenőrzése (Ugyanaz, mint a CSS-ben)
      const isExpired = p.lejarat <= now;
      const isCriticalQty = p.mennyiseg < 10;
      const isWarningDate = p.lejarat <= oneWeekLater;
      const isLowStock = p.mennyiseg < 100;

      // Piros riasztás (Lejárt vagy Kritikus mennyiség)
      if (isExpired || isCriticalQty) {
        row.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } }; // Red-100
          cell.font = { color: { argb: "FF991B1B" }, bold: true }; // Red-800
        });
      } 
      // Sárga figyelmeztetés (Hamarosan lejár vagy kevés készlet)
      else if (isWarningDate || isLowStock) {
        row.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } }; // Amber-100
          cell.font = { color: { argb: "FF92400E" }, bold: true }; // Amber-800
        });
      }
    });

    // OSZLOPSZÉLESSÉG AUTOMATIKUS BEÁLLÍTÁSA
    worksheet.columns.forEach((column: any) => {
      let maxLength = column.header.length;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const columnLength = cell.value ? cell.value.toString().length : 0;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength + 5; // Adunk hozzá egy kis "levegőt"
    });

    // Letöltés indítása
    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `raktar_export_${new Date().toISOString().split("T")[0]}.xlsx`;
    saveAs(new Blob([buffer]), fileName);
  };

  const handleSort = (column: SortColumn) => {
    if (column === sortColumn) {
      setIsAscending((prev) => !prev);
    } else {
      setSortColumn(column);
      setIsAscending(true);
    }
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

  const handleDelete = async (id: number) => {
    if (!user || !window.confirm("Biztosan törölni szeretnéd?")) return;
    try {
      await deleteProduct(id, user.id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert("Hiba a törlésnél.");
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
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <div
            className="flex items-center gap-4 group cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <span className="text-3xl text-white">📦</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase transition-colors">
              Raktár
            </h1>
          </div>

          <div className="flex flex-wrap md:flex-nowrap gap-4 w-full md:w-auto">
            <button
              onClick={() => setShowAlertsOnly(!showAlertsOnly)}
              className={`flex-1 md:flex-none px-6 py-4 rounded-2xl font-bold transition-all border-2 uppercase text-xs tracking-widest ${
                showAlertsOnly
                  ? "bg-red-600 border-red-400 text-white shadow-lg shadow-red-600/30"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 shadow-sm hover:border-blue-400"
              }`}
            >
              {showAlertsOnly ? "🚨 Csak hibák" : "⚠️ Szűrés"}
            </button>

            {user && (
              <button
                onClick={exportToExcel}
                className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-emerald-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                📊 Excel Riport
              </button>
            )}

            {user && (
              <button
                onClick={() => navigate("/add")}
                className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="text-xl leading-none">+</span> Új Termék
              </button>
            )}
          </div>
        </div>

        {filteredAndSortedProducts.length > 0 ? (
          <>
            <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-all">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-200 dark:border-slate-800">
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
                    {user && <th className="p-6 text-right">Művelet</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {filteredAndSortedProducts.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-blue-600/5 dark:hover:bg-blue-400/5 transition-colors group"
                    >
                      <td className="p-6 text-center">
                        <div className="inline-block bg-white p-1.5 rounded-xl border border-slate-100">
                          <QRCodeSVG value={p.id.toString()} size={35} />
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
                      {user && (
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

            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredAndSortedProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 shadow-lg relative overflow-hidden transition-all"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                      <QRCodeSVG value={p.id.toString()} size={50} />
                    </div>
                    <div className="flex flex-col gap-2">
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
                    {user && (
                      <>
                        <button
                          onClick={() => navigate(`/modify/${p.id}`)}
                          className="bg-blue-600/10 text-blue-600 dark:text-blue-400 p-3 rounded-xl border border-blue-500/10"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="bg-red-600/10 text-red-600 dark:text-red-400 p-3 rounded-xl border border-red-500/10"
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
          <div className="py-32 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
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