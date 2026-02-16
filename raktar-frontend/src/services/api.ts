/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Product } from "../types/Product";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

/**
 * Segédfüggvény a fejlécek összeállításához (Token kezeléssel)
 */
function getHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Központi válaszkezelő a hibák egységesítésére
 */
async function handleResponse(res: Response) {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API Error ${res.status}: ${errorText}`);
  }
  return res.json();
}

// --- AUTH & USER ALAPMŰVELETEK ---

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
  email?: string;
  telefonszam?: string;
}) {
  const res = await fetch(`${BASE_URL}/user/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return handleResponse(res);
}

// --- PROFIL & KÉRELMEK ---

export async function updateProfile(id: number, data: any) {
  const res = await fetch(`${BASE_URL}/user/update-profile/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function submitChangeRequest(requestData: { userId: number; tipus: string; ujErtek: string }) {
  const res = await fetch(`${BASE_URL}/user/request-change`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(requestData),
  });
  return handleResponse(res);
}

// --- ADMIN FUNKCIÓK (User kezelés) ---

export async function getAllUsers() {
  const res = await fetch(`${BASE_URL}/user/all`, { headers: getHeaders() });
  return handleResponse(res);
}

export async function toggleUserBan(id: number) {
  const res = await fetch(`${BASE_URL}/user/admin/toggle-ban/${id}`, {
    method: "PATCH",
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function deleteUserPermanently(id: number) {
  const res = await fetch(`${BASE_URL}/user/admin/delete/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function getPendingRequests() {
  const res = await fetch(`${BASE_URL}/user/admin/pending-requests`, { headers: getHeaders() });
  return handleResponse(res);
}

export async function handleAdminRequest(requestId: number, statusz: "APPROVED" | "REJECTED") {
  const res = await fetch(`${BASE_URL}/user/admin/handle-request/${requestId}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ statusz }),
  });
  return handleResponse(res);
}

// --- AUDIT LOGOK ---

export async function getAuditLogs(userId: number, isAdmin: boolean, filters: any = {}) {
  const params = new URLSearchParams({
    admin: isAdmin.toString(),
    ...filters
  });
  const res = await fetch(`${BASE_URL}/audit/user/${userId}?${params.toString()}`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

// --- STOCK (TERMÉK) MŰVELETEK ---

export async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${BASE_URL}/stock`, { headers: getHeaders() });
  return handleResponse(res);
}

export async function getProductById(id: number | string, isAdmin: boolean = false): Promise<Product & { isDeleted: boolean }> {
  const res = await fetch(`${BASE_URL}/stock/${id}?admin=${isAdmin}`, { headers: getHeaders() });
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

export async function deleteProduct(id: number, userId: number) {
  const res = await fetch(`${BASE_URL}/stock/${id}?userId=${userId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse(res);
}

/**
 * ÚJ: Tömegeges törlés
 */
export async function deleteManyProducts(ids: number[], userId: number) {
  const res = await fetch(`${BASE_URL}/stock/bulk-delete`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ ids, userId }),
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

/**
 * Visszaállítás konkrét naplóbejegyzés alapján
 */
export async function restoreAction(logId: number, userId: number) {
  const res = await fetch(`${BASE_URL}/stock/restore-log/${logId}?userId=${userId}`, {
    method: "POST",
    headers: getHeaders(),
  });
  return handleResponse(res);
}