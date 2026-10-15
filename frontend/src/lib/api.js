/** API base URL without trailing slash (includes `/api`). Set `VITE_API_BASE_URL` for production builds. */
export function getApiBaseUrl() {
  const v = import.meta.env.VITE_API_BASE_URL;
  if (v != null && String(v).trim() !== "") {
    return String(v).replace(/\/+$/, "");
  }
  return "http://127.0.0.1:8080/api";
}

/** @param {string} subpath e.g. `/register/` or `datasets/` */
export function apiUrl(subpath) {
  const p = subpath.startsWith("/") ? subpath : `/${subpath}`;
  return `${getApiBaseUrl()}${p}`;
}
