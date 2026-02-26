//raktar-frontend/src/services/api.ts
import type { Batch } from "../types/Batch";
import type { Product } from "../types/Product";
import type { AppNotification } from "../types/Notification";
import type { User } from "../types/User";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// ==========================================
// SEGÉDFÜGGVÉNYEK (HELPERS)
// ==========================================

export const notifyServerOffline = () => {
  window.dispatchEvent(new CustomEvent("server-offline"));
};

function getHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const handleResponse = async (response: Response) => {
  if (response.status === 401 || response.status === 403) {
    if (response.url.includes("/auth/login")) {
      const error = await response
        .json()
        .catch(() => ({ message: "Tiltott hozzáférés" }));
      const customError: any = new Error(error.message);
      customError.response = { status: response.status, data: error };
      throw customError;
    }

    if (window.location.pathname.includes("/force-change-password")) {
      console.warn("API 401/403 elnyomva jelszócsere közben:", response.url);
      return;
    }

    localStorage.clear();
    if (!window.location.pathname.includes("/login")) {
      window.location.href = "/login?reason=session_lost";
    }
    return;
  }

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Ismeretlen hiba" }));
    const customError: any = new Error(error.message);
    customError.response = { status: response.status, data: error };
    throw customError;
  }
  return response.json();
};

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
  const res = await fetch(`${BASE_URL}/users/me`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function forgotPassword(data: {
  felhasznalonev: string;
  email: string;
  telefonszam: string;
}) {
  const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function forceChangePassword(data: {
  felhasznalonev: string;
  ideiglenesJelszo: string;
  ujJelszo: string;
}) {
  const res = await fetch(`${BASE_URL}/auth/force-change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ==========================================
// USER MANAGEMENT
// ==========================================

export async function register(userData: any) {
  const res = await fetch(`${BASE_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return handleResponse(res);
}

export async function getAllUsers() {
  const res = await fetch(`${BASE_URL}/users`, { headers: getHeaders() });
  return handleResponse(res);
}

export async function updateProfile(id: number, data: any) {
  const res = await fetch(`${BASE_URL}/users/${id}/profile`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function toggleUserBan(id: number) {
  const res = await fetch(`${BASE_URL}/users/${id}/ban`, {
    method: "PATCH",
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function deleteUserPermanently(id: number) {
  const res = await fetch(`${BASE_URL}/users/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse(res);
}

// ==========================================
// CHANGE REQUESTS
// ==========================================

export async function submitChangeRequest(requestData: any) {
  const res = await fetch(`${BASE_URL}/users/change-request`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(requestData),
  });
  return handleResponse(res);
}

export async function getPendingRequests() {
  const res = await fetch(`${BASE_URL}/users/pending-requests`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function handleAdminRequest(requestId: number, statusz: string) {
  const res = await fetch(
    `${BASE_URL}/users/handle-request`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ requestId, statusz }),
    },
  );
  return handleResponse(res);
}

// ==========================================
// PRODUCT API
// ==========================================

export const getProducts = async (): Promise<Product[]> => {
  try {
    const response = await fetch(`${BASE_URL}/product`, {
      headers: getHeaders(),
    });
    return await handleResponse(response);
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      notifyServerOffline();
      throw new Error("A szerver nem elérhető.");
    }
    throw error;
  }
};

export async function getProductById(
  id: number | string,
  isAdmin: boolean = false,
): Promise<any> {
  const res = await fetch(`${BASE_URL}/product/${id}?admin=${isAdmin}`, {
    headers: getHeaders(),
  });
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

export async function updateProduct(
  id: number | string,
  productData: any,
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
  const res = await fetch(
    `${BASE_URL}/product/${id}/restore?userId=${userId}`,
    {
      method: "PATCH",
      headers: getHeaders(),
    },
  );
  return handleResponse(res);
}

// ==========================================
// BATCH API
// ==========================================

export async function createBatch(
  batchData: any,
  userId: number,
): Promise<Batch> {
  const res = await fetch(`${BASE_URL}/batch?userId=${userId}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(batchData),
  });
  return handleResponse(res);
}

export async function createBulkBatches(
  splits: any[],
  userId: number,
): Promise<Batch[]> {
  const res = await fetch(`${BASE_URL}/batch/bulk?userId=${userId}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(splits),
  });
  return handleResponse(res);
}

export async function updateBatch(
  id: number,
  batchData: any,
  userId: number,
): Promise<Batch> {
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

export async function getWarehouseMap(): Promise<any> {
  const res = await fetch(`${BASE_URL}/batch/warehouse-map`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function findBestSpace(
  productId: number,
  mennyiseg: number,
): Promise<any> {
  const res = await fetch(
    `${BASE_URL}/batch/best-space?productId=${productId}&mennyiseg=${mennyiseg}`,
    {
      headers: getHeaders(),
    },
  );
  return handleResponse(res);
}

// ==========================================
// NOTIFICATIONS
// ==========================================

export async function getMyNotifications(): Promise<AppNotification[]> {
  const res = await fetch(`${BASE_URL}/notification`, {
    headers: getHeaders(),
  });
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

// ==========================================
// AUDIT LOGS
// ==========================================

export async function getAuditLogs(
  userId: number,
  isAdmin: boolean,
  filters: any = {},
) {
  const params = new URLSearchParams();
  params.append("admin", String(isAdmin));
  Object.keys(filters).forEach((key) => {
    const value = filters[key];
    if (value) params.append(key, String(value));
  });
  const res = await fetch(
    `${BASE_URL}/audit/user/${userId}?${params.toString()}`,
    {
      headers: getHeaders(),
    },
  );
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

// ==========================================
// SYSTEM & SESSIONS
// ==========================================

export const revokeSessions = async (userId: number): Promise<void> => {
  const res = await fetch(`${BASE_URL}/users/${userId}/revoke-sessions`, {
    method: "POST",
    headers: getHeaders(),
  });
  return handleResponse(res);
};

export const getSystemStatus = async (): Promise<any> => {
  const res = await fetch(`${BASE_URL}/system/status`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
};

export async function suggestPlacement(
  productId: number,
  mennyiseg: number
): Promise<any> {
  const res = await fetch(
    `${BASE_URL}/batch/suggest-placement?productId=${productId}&mennyiseg=${mennyiseg}`,
    {
      headers: getHeaders(),
    }
  );
  return handleResponse(res);
}