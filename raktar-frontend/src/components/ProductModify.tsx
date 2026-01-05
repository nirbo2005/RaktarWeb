import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProductById, updateProduct } from "../services/api";

function ProductModify() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nev: "",
    gyarto: "",
    lejarat: new Date(), // ⬅️ Date
    ar: 0,
    mennyiseg: 0,
    parcella: "",
  });

  useEffect(() => {
    if (!id) return;

    getProductById(Number(id)).then((data) => {
      setForm({
        nev: data.nev,
        gyarto: data.gyarto,
        lejarat: new Date(data.lejarat), // ⬅️ Date
        ar: data.ar,
        mennyiseg: data.mennyiseg,
        parcella: data.parcella,
      });
    });
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "lejarat") {
      setForm((prev) => ({
        ...prev,
        lejarat: new Date(value),
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    await updateProduct(Number(id), {
      nev: form.nev,
      gyarto: form.gyarto,
      lejarat: form.lejarat, // ⬅️ Date
      ar: Number(form.ar),
      mennyiseg: Number(form.mennyiseg),
      parcella: form.parcella,
    });

    navigate("/");
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Termék módosítása</h1>

      <input name="nev" value={form.nev} onChange={handleChange} />
      <input name="gyarto" value={form.gyarto} onChange={handleChange} />

      <input
        name="lejarat"
        type="date"
        value={form.lejarat.toISOString().split("T")[0]}
        onChange={handleChange}
      />

      <input name="ar" type="number" value={form.ar} onChange={handleChange} />
      <input
        name="mennyiseg"
        type="number"
        value={form.mennyiseg}
        onChange={handleChange}
      />
      <input
        name="parcella"
        value={form.parcella}
        onChange={handleChange}
      />

      <button type="submit">Mentés</button>
    </form>
  );
}

export default ProductModify;
