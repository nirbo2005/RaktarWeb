import type { Product } from "../types/Product";
import type { Batch } from "../types/Batch";
import type { AppNotification } from "../types/Notification";
import type { User } from "../types/User";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// ==========================================
// SEGÉDFÜGGVÉNYEK (HELPERS)
// ==========================================

function getHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse(response: Response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // ... handleResponse belseje
  if (response.status === 401) {
    const msg = data.message || "";
    if (msg.includes("Munkamenet lejárt") || msg.includes("máshol jelentkeztek be")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Azonnali átirányítás paraméterrel
      window.location.href = "/login?reason=session_expired";
      return Promise.reject(new Error("Munkamenet lejárt"));
    }
  }
      const error = (data && data.message) || response.statusText;
      return Promise.reject(new Error(error));
    }
    return data;
  }

// ==========================================
// AUTHENTICATION API
// ==========================================

export async function login(felhasznalonev: string, jelszo: string) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ felhasznalonev, jelszo }),
  });
  return handleResponse(res);
}

export async function getMe(): Promise<User> {
  const res = await fetch(`${BASE_URL}/user/me`, { 
    headers: getHeaders() 
  });
  return handleResponse(res);
}

export async function forgotPassword(data: { felhasznalonev: string; email: string; telefonszam: string }) {
  const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function forceChangePassword(data: { felhasznalonev: string; ideiglenesJelszo: string; ujJelszo: string }) {
  const res = await fetch(`${BASE_URL}/auth/force-change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ... (A többi API hívás változatlan, maradnak a korábbi handleResponse-szal)

export async function register(userData: any) {
  const res = await fetch(`${BASE_URL}/user/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return handleResponse(res);
}

export async function getAllUsers() {
  const res = await fetch(`${BASE_URL}/user/all`, { headers: getHeaders() });
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

export async function submitChangeRequest(requestData: any) {
  const res = await fetch(`${BASE_URL}/user/request-change`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(requestData),
  });
  return handleResponse(res);
}

export async function getPendingRequests() {
  const res = await fetch(`${BASE_URL}/user/admin/pending-requests`, { headers: getHeaders() });
  return handleResponse(res);
}

export async function handleAdminRequest(requestId: number, statusz: string) {
  const res = await fetch(`${BASE_URL}/user/admin/handle-request/${requestId}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ statusz }),
  });
  return handleResponse(res);
}

export async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${BASE_URL}/product`, { headers: getHeaders() });
  return handleResponse(res);
}

export async function getProductById(id: number | string, isAdmin: boolean = false): Promise<any> {
  const res = await fetch(`${BASE_URL}/product/${id}?admin=${isAdmin}`, { headers: getHeaders() });
  return handleResponse(res);
}

export async function addProduct(product: any, userId: number) {
  const res = await fetch(`${BASE_URL}/product`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ ...product, userId }),
  });
  return handleResponse(res);
}

export async function updateProduct(id: number | string, productData: any, userId: number) {
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

export async function createBatch(batchData: any, userId: number): Promise<Batch> {
  const res = await fetch(`${BASE_URL}/batch?userId=${userId}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(batchData),
  });
  return handleResponse(res);
}

export async function updateBatch(id: number, batchData: any, userId: number): Promise<Batch> {
  const res = await fetch(`${BASE_URL}/batch/${id}?userId=${userId}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(batchData),
  });
  return handleResponse(res);
}

export async function deleteBatch(id: number, userId: number) {
  const res = await fetch(`${BASE_URL}/batch/${id}?userId=${userId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function sortWarehouse(userId: number) {
  const res = await fetch(`${BASE_URL}/batch/sort-warehouse?userId=${userId}`, {
    method: "POST",
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function getMyNotifications(): Promise<AppNotification[]> {
  const res = await fetch(`${BASE_URL}/notification`, { headers: getHeaders() });
  return handleResponse(res);
}

export async function markNotificationAsRead(id: number) {
  const res = await fetch(`${BASE_URL}/notification/${id}/read`, {
    method: "PATCH",
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function markAllNotificationsAsRead() {
  const res = await fetch(`${BASE_URL}/notification/read-all`, {
    method: "PATCH",
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function deleteReadNotifications(): Promise<void> {
  const res = await fetch(`${BASE_URL}/notification/read`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function getAuditLogs(userId: number, isAdmin: boolean, filters: any = {}) {
  const params = new URLSearchParams();
  params.append("admin", String(isAdmin));
  Object.keys(filters).forEach((key) => {
    const value = filters[key];
    if (value) params.append(key, String(value));
  });
  const res = await fetch(`${BASE_URL}/audit/user/${userId}?${params.toString()}`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function restoreAction(logId: number, userId: number) {
  const res = await fetch(`${BASE_URL}/product/restore-log/${logId}?userId=${userId}`, {
    method: "POST",
    headers: getHeaders(),
  });
  return handleResponse(res);
}