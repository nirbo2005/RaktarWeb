/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Product } from "../types/Product";
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

function getHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API Error ${res.status}: ${errorText}`);
  }
  return res.json();
}

// --- STOCK MŰVELETEK ---

export async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${BASE_URL}/stock`, { headers: getHeaders() });
  return handleResponse(res);
}

export async function deleteProduct(id: number, userId: number) {
  const res = await fetch(`${BASE_URL}/stock/${id}?userId=${userId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function deleteManyProducts(ids: number[], userId: number) {
  const res = await fetch(`${BASE_URL}/stock/bulk-delete`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ ids, userId }),
  });
  return handleResponse(res);
}

// ... (többi korábbi függvény változatlan marad)
export async function login(felhasznalonev: string, jelszo: string) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ felhasznalonev, jelszo }),
  });
  return handleResponse(res);
}
export async function addProduct(product: Omit<Product, "id">, userId: number) {
  const res = await fetch(`${BASE_URL}/stock`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ ...product, userId }),
  });
  return handleResponse(res);
}
export async function updateProduct(id: number | string, productData: Partial<Product>, userId: number) {
  const res = await fetch(`${BASE_URL}/stock/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ ...productData, userId }),
  });
  return handleResponse(res);
}