import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addProduct } from "../services/api";

function ProductAdd() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nev: "",
    gyarto: "",
    lejarat: new Date(), // ⬅️ Date
    ar: 0,
    mennyiseg: 0,
    parcella: "",
  });

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

    await addProduct({
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
      <h1>Új termék</h1>

      <input name="nev" placeholder="Név" onChange={handleChange} />
      <input name="gyarto" placeholder="Gyártó" onChange={handleChange} />

      <input
        name="lejarat"
        type="date"
        value={form.lejarat.toISOString().split("T")[0]}
        onChange={handleChange}
      />

      <input name="ar" type="number" placeholder="Ár" onChange={handleChange} />
      <input
        name="mennyiseg"
        type="number"
        placeholder="Mennyiség"
        onChange={handleChange}
      />
      <input name="parcella" placeholder="Parcella" onChange={handleChange} />

      <button type="submit">Mentés</button>
    </form>
  );
}

export default ProductAdd;
