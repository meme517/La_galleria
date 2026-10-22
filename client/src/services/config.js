const API_ORIGIN = (
  import.meta.env.VITE_API_URL || 'http://localhost:3000'
).replace(/\/+$/, '');

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || API_ORIGIN;

export const API_BASE_URL = `${API_ORIGIN}/api`;
