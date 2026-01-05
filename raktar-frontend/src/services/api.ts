import type { Product } from "../types/Product";

const BASE_URL = "http://localhost:3000/stock";

/**
 * Közös response handler – normális hibaüzenetekhez
 */
async function handleResponse(res: Response) {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API Error ${res.status}: ${errorText}`);
  }
  return res.json();
}

export async function getProducts(): Promise<Product[]> {
  const res = await fetch(BASE_URL);
  return handleResponse(res);
}

export async function getProductById(id: number): Promise<Product> {
  const res = await fetch(`${BASE_URL}/${id}`);
  return handleResponse(res);
}

export async function addProduct(product: Omit<Product, "id">) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });

  return handleResponse(res);
}

export async function updateProduct(
  id: number,
  product: Omit<Product, "id">
) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product), // ⬅️ lejarat STRING
  });

  return handleResponse(res);
}

export async function deleteProduct(id: number) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });

  return handleResponse(res);
}
