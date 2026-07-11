import axios from 'axios';

// All API calls go through this single client.
// The baseURL points to /api which Vite proxies to the Gateway in dev,
// and to your real Gateway URL in production via VITE_GATEWAY_URL env var.
const api = axios.create({
  baseURL: '/api',  
});

// Request interceptor — runs before every request.
// It reads the token from localStorage and attaches it as a header.
// This means every component can just call api.get('/reports') without
// manually adding the token every time.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — runs when any request returns a 401.
// That means the token expired or is invalid — log the user out
// and redirect to login automatically.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
