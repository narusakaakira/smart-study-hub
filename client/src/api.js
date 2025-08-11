// client/src/api.js
import axios from "axios";

/**
 * API client dùng chung.
 * Prod (Firebase Hosting): baseURL="/api" -> rewrite sang Cloud Run.
 * Dev (Vite): baseURL="/api" -> proxy trong vite.config.js tới localhost:8000.
 */
const api = axios.create({
  baseURL: "/api",
  withCredentials: false, // bật true nếu cần cookie session
  timeout: 15000,
});

// Tự động gắn token nếu có lưu trong localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;