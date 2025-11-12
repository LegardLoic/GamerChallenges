import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});


let refreshing = false;


axiosInstance.interceptors.response.use(undefined, async (error) => {
  if (error.response?.status === 401 && !refreshing) {
    refreshing = true;
      try {
        await axiosInstance.post("/auth/refresh");
        return axiosInstance(error.config);
      } finally {
        refreshing = false;
      }
  }
  throw error;
});
