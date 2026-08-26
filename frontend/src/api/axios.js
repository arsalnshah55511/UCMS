import axios from "axios";

const api = axios.create({
    baseURL:import.meta.env.VITE_API_URL || "http://localhost:5000/api",
})

// Attach the JWT (if present) to every outgoing request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ucms_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


// Centralize "session expired" handling.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("ucms_token");
      localStorage.removeItem("ucms_user");
    }
    return Promise.reject(err);
  }
);

export default api;