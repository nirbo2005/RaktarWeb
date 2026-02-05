import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProducts, deleteProduct } from "../services/api";
import { useAuth } from "../context/AuthContext";
import type { Product } from "../types/Product";
import { QRCodeSVG } from "qrcode.react";

type SortColumn = "nev" | "lejarat" | "mennyiseg";

function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sortColumn, setSortColumn] = useState<SortColumn>("nev");
  const [isAscending, setIsAscending] = useState(true);

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    getProducts().then((data) => {
      setProducts(
        data.map((p) => ({
          ...p,
          lejarat: new Date(p.lejarat),
        })),
      );
    });
  }, []);

  const handleSort = (column: SortColumn) => {
    if (column === sortColumn) {
      setIsAscending((prev) => !prev);
    } else {
      setSortColumn(column);
      setIsAscending(true);
    }
  };

  const sortedProducts = useMemo(() => {
    const copy = [...products];
    copy.sort((a, b) => {
      if (sortColumn === "lejarat") {
        return isAscending
          ? a.lejarat.getTime() - b.lejarat.getTime()
          : b.lejarat.getTime() - a.lejarat.getTime();
      }
      if (sortColumn === "mennyiseg") {
        return isAscending
          ? a.mennyiseg - b.mennyiseg
          : b.mennyiseg - a.mennyiseg;
      }
      return isAscending
        ? a.nev.localeCompare(b.nev)
        : b.nev.localeCompare(a.nev);
    });
    return copy;
  }, [products, sortColumn, isAscending]);

  const handleDelete = async (id: number) => {
    if (!user) return;
    if (window.confirm("Biztosan törölni szeretnéd ezt a terméket?")) {
      try {
        await deleteProduct(id, user.id);
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } catch (err) {
        console.error("Hiba a törlés során:", err);
        alert("Nem sikerült a törlés.");
      }
    }
  };

  const getStatusClasses = (p: Product) => {
    const now = new Date();
    const oneWeekLater = new Date();
    oneWeekLater.setDate(now.getDate() + 7);
    if (p.lejarat <= now || p.mennyiseg < 10) return "bg-red-50 text-red-700";
    if (p.lejarat <= oneWeekLater || p.mennyiseg < 100) return "bg-amber-50 text-amber-700";
    return "bg-white text-gray-700";
  };

  const thClass = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors";

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">📦 Aktuális Raktárkészlet</h1>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/scanner")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center gap-2"
            >
              📷 Beolvasás
            </button>
            {user && (
              <button
                onClick={() => navigate("/add")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all active:scale-95"
              >
                + Új termék
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">QR</th>
                  <th className={thClass} onClick={() => handleSort("nev")}>Név {sortColumn === "nev" && (isAscending ? "↑" : "↓")}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gyártó</th>
                  <th className={thClass} onClick={() => handleSort("lejarat")}>Lejárat {sortColumn === "lejarat" && (isAscending ? "↑" : "↓")}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ár</th>
                  <th className={thClass} onClick={() => handleSort("mennyiseg")}>Készlet {sortColumn === "mennyiseg" && (isAscending ? "↑" : "↓")}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parcella</th>
                  {user && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Műveletek</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedProducts.map((p) => (
                  <tr key={p.id} className={`${getStatusClasses(p)} transition-colors hover:bg-opacity-50`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-400">{p.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="bg-white p-1 rounded border border-gray-100 shadow-sm inline-block">
                        <QRCodeSVG value={`raktarweb-id:${p.id}`} size={32} level="M" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                      <button onClick={() => navigate(`/product/${p.id}`)} className="text-blue-600 hover:underline">
                        {p.nev}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.gyarto}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{p.lejarat.toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{p.ar.toLocaleString()} Ft</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={`px-2.5 py-1 rounded-full text-xs ${p.mennyiseg < 10 ? "bg-red-200 text-red-800" : "bg-gray-100"}`}>
                        {p.mennyiseg} db
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <button 
                        onClick={() => navigate(`/grid?parcel=${p.parcella}&productId=${p.id}`)}
                        className="bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 uppercase text-xs font-bold hover:bg-blue-100 transition-colors"
                      >
                        {p.parcella}
                      </button>
                    </td>
                    {user && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button onClick={() => navigate(`/modify/${p.id}`)} className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">Szerkesztés</button>
                        <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1.5 rounded-lg transition-colors">Törlés</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductList;