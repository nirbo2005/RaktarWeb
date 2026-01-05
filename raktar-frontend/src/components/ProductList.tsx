import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProducts, deleteProduct } from "../services/api";
import type { Product } from "../types/Product";

function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getProducts().then((data) => {
      // biztosítjuk, hogy Date legyen
      const mapped = data.map((p) => ({
        ...p,
        lejarat: new Date(p.lejarat),
      }));
      setProducts(mapped);
    });
  }, []);

  const handleDelete = async (id: number) => {
    await deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div>
      <h1>Raktárkészlet</h1>

      <table>
        <thead>
          <tr>
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
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.nev}</td>
              <td>{p.gyarto}</td>
              <td>{p.lejarat.toLocaleDateString()}</td>
              <td>{p.ar} Ft</td>
              <td>{p.mennyiseg}</td>
              <td>{p.parcella}</td>
              <td>
                <button onClick={() => navigate(`/modify/${p.id}`)}>
                  ✏️
                </button>
                <button onClick={() => handleDelete(p.id)}>
                  🗑
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProductList;
