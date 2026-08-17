import axios from "axios";

const api = axios.create({
  baseURL:import.meta.env.VITE_API_URL || "/api",
});

api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("vyaparsathi_user"));
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("vyaparsathi_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
