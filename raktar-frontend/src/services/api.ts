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

export async function login(felhasznalonev: string, jelszo: string) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ felhasznalonev, jelszo }),
  });
  return handleResponse(res);
}

export async function register(userData: {
  nev: string;
  felhasznalonev: string;
  jelszo: string;
}) {
  const res = await fetch(`${BASE_URL}/user/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return handleResponse(res);
}

export async function getAuditLogs(userId: number, isAdmin: boolean) {
  const res = await fetch(`${BASE_URL}/audit/user/${userId}?admin=${isAdmin}`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${BASE_URL}/stock`, { headers: getHeaders() });
  return handleResponse(res);
}

export async function getProductById(
  id: number,
  isAdmin: boolean = false,
): Promise<Product & { isDeleted: boolean }> {
  const res = await fetch(`${BASE_URL}/stock/${id}?admin=${isAdmin}`, {
    headers: getHeaders(),
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

export async function updateProduct(
  id: number | string,
  productData: Partial<Product>, // Partial-ra váltunk, hogy lehessen részleges
  userId: number,
) {
  const res = await fetch(`${BASE_URL}/stock/${id}`, {
    method: "PUT", // Maradhat PUT, ha a backend azt várja, de a törzs már rugalmas
    headers: getHeaders(),
    body: JSON.stringify({ ...productData, userId }),
  });
  return handleResponse(res);
}

export async function deleteProduct(id: number, userId: number) {
  const res = await fetch(`${BASE_URL}/stock/${id}?userId=${userId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function restoreProduct(id: number, userId: number) {
  const res = await fetch(`${BASE_URL}/stock/${id}/restore?userId=${userId}`, {
    method: "PATCH",
    headers: getHeaders(),
  });
  return handleResponse(res);
}
