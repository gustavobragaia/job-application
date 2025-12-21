import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "jobtracker_token";

// Reads base URL from env when available; falls back to LAN/local defaults.
// Adjust `FALLBACK_BASE_URL` to your machine/IP as needed.
const FALLBACK_BASE_URL = "http://192.168.0.92:3333";
const API_BASE =
  process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "") ||
  FALLBACK_BASE_URL;

export class ApiError extends Error {
  status?: number;
  data: any;

  constructor(message: string, status?: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function setToken(token: string | null) {
  if (!token) {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
  
}

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  auth?: boolean;
  headers?: Record<string, string>;
  timeoutMs?: number;
};

export async function apiRequest<T>(
  path: string,
  {
    method = "GET",
    body,
    auth = true,
    headers: extraHeaders = {},
    timeoutMs = 8000,
  }: ApiRequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };

  if (auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeout);
    if (err?.name === "AbortError") {
      throw new ApiError("Request timed out", undefined, null);
    }
    throw new ApiError(err?.message || "Network error", undefined, null);
  } finally {
    clearTimeout(timeout);
  }

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message =
      data?.message ||
      data?.error ||
      `HTTP ${res.status} ${res.statusText || ""}`.trim();
    throw new ApiError(message, res.status, data);
  }

  return data as T;
}
