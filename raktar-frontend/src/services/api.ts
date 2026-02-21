//raktar-frontend/src/services/api.ts
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
    let errorData;
    try {
      errorData = await res.json();
    } catch (e) {
      errorData = { message: "Ismeretlen hiba történt a szerveren." };
    }
    
    // Ha a NestJS ValidationPipe hibaüzeneteket küld (tömbként vagy stringként)
    const errorMessage = errorData.message || `API Error ${res.status}`;
    
    // Ez a hibaobjektum már a konkrét üzenetet fogja tartalmazni a frontend catch blokkjának
    const error = new Error(Array.isArray(errorMessage) ? errorMessage[0] : errorMessage);
    (error as any).response = { data: errorData };
    throw error;
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

// ÚJ: Elfelejtett jelszó kérelem
export async function forgotPassword(data: { felhasznalonev: string; email: string; telefonszam: string }) {
  const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ÚJ: Kötelező jelszócsere
export async function forceChangePassword(data: { felhasznalonev: string; ideiglenesJelszo: string; ujJelszo: string }) {
  const res = await fetch(`${BASE_URL}/auth/force-change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
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

export async function updateProfile(id: number, data: any) {
  const res = await fetch(`${BASE_URL}/user/update-profile/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function submitChangeRequest(requestData: {
  userId: number;
  tipus: string;
  ujErtek: string;
}) {
  const res = await fetch(`${BASE_URL}/user/request-change`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(requestData),
  });
  return handleResponse(res);
}

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
  const res = await fetch(`${BASE_URL}/user/admin/pending-requests`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function handleAdminRequest(
  requestId: number,
  statusz: "APPROVED" | "REJECTED",
) {
  const res = await fetch(
    `${BASE_URL}/user/admin/handle-request/${requestId}`,
    {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ statusz }),
    },
  );
  return handleResponse(res);
}

export async function getAuditLogs(
  userId: number,
  isAdmin: boolean,
  filters: any = {},
) {
  const params = new URLSearchParams();
  params.append("admin", String(isAdmin));
  Object.keys(filters).forEach((key) => {
    const value = filters[key];
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });

  const res = await fetch(
    `${BASE_URL}/audit/user/${userId}?${params.toString()}`,
    {
      headers: getHeaders(),
    },
  );
  return handleResponse(res);
}

export async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${BASE_URL}/product`, { headers: getHeaders() });
  return handleResponse(res);
}

export async function getProductById(
  id: number | string,
  isAdmin: boolean = false,
): Promise<Product & { isDeleted: boolean }> {
  const res = await fetch(`${BASE_URL}/product/${id}?admin=${isAdmin}`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function addProduct(product: Omit<Product, "id">, userId: number) {
  const res = await fetch(`${BASE_URL}/product`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ ...product, userId }),
  });
  return handleResponse(res);
}

export async function updateProduct(
  id: number | string,
  productData: Partial<Product>,
  userId: number,
) {
  const res = await fetch(`${BASE_URL}/product/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ ...productData, userId }),
  });
  return handleResponse(res);
}

export async function deleteProduct(id: number, userId: number) {
  const res = await fetch(`${BASE_URL}/product/${id}?userId=${userId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function deleteManyProducts(ids: number[], userId: number) {
  const res = await fetch(`${BASE_URL}/product/bulk-delete`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ ids, userId }),
  });
  return handleResponse(res);
}

export async function restoreProduct(id: number, userId: number) {
  const res = await fetch(`${BASE_URL}/product/${id}/restore?userId=${userId}`, {
    method: "PATCH",
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function restoreAction(logId: number, userId: number) {
  const res = await fetch(
    `${BASE_URL}/product/restore-log/${logId}?userId=${userId}`,
    {
      method: "POST",
      headers: getHeaders(),
    },
  );
  return handleResponse(res);
}