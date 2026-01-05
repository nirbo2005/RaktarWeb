import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProducts, deleteProduct } from "../services/api";
import type { Product } from "../types/Product";

type SortColumn = "nev" | "lejarat" | "mennyiseg";

function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sortColumn, setSortColumn] = useState<SortColumn>("nev");
  const [isAscending, setIsAscending] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    getProducts().then((data) => {
      setProducts(
        data.map((p) => ({
          ...p,
          lejarat: new Date(p.lejarat),
        }))
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
    await deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const getRowClass = (p: Product) => {
    const now = new Date();
    const oneWeekLater = new Date();
    oneWeekLater.setDate(now.getDate() + 7);

    if (p.lejarat <= now || p.mennyiseg < 10) {
      return "danger";
    }

    if (p.lejarat <= oneWeekLater || p.mennyiseg < 100) {
      return "warning";
    }

    return "";
  };

  return (
    <div>
      <h1>Raktárkészlet</h1>

      {/* RÉGI RENDEZŐ GOMBOK */}
      <div style={{ marginBottom: "1rem" }}>
        <button onClick={() => handleSort("nev")}>
          Rendezés név szerint
        </button>
        <button onClick={() => handleSort("lejarat")}>
          Rendezés lejárat szerint
        </button>
        <button onClick={() => handleSort("mennyiseg")}>
          Rendezés mennyiség szerint
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Név</th>
            <th>Gyártó</th>
            <th>Lejárat</th>
            <th>Ár</th>
            <th>Mennyiség</th>
            <th>Parcella</th>
            <th>Műveletek</th>
          </tr>
        </thead>
        <tbody>
          {sortedProducts.map((p) => {
            const rowClass = getRowClass(p);

            return (
              <tr key={p.id} className={rowClass}>
                <td>{p.id}</td>
                <td>{p.nev}</td>
                <td>{p.gyarto}</td>
                <td>{p.lejarat.toLocaleDateString()}</td>
                <td>{p.ar}</td>
                <td>{p.mennyiseg}</td>
                <td>{p.parcella}</td>
                <td>
                  <button onClick={() => navigate(`/modify/${p.id}`)}>
                    Módosítás
                  </button>
                  <button onClick={() => handleDelete(p.id)}>
                    Törlés
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ProductList;
