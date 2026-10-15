import axios from "axios";

function getAuthToken(): string | null {
  try {
    // Prefer in-memory / sessionStorage, fallback to localStorage
    return sessionStorage.getItem("authToken") || localStorage.getItem("authToken") || null;
  } catch {
    return null;
  }
}

const axiosInstance = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL as string) ?? "http://localhost:8080",
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token && config && config.headers) {
      // attach Authorization only when token is available (backend may prefer HttpOnly cookie)
      (config.headers as any)["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
