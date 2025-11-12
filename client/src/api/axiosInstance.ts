import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// 401 interceptor
let refreshing = false;
let queue: Array<() => void> = [];

axiosInstance.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status !== 401 || err.config?._retry) {
      return Promise.reject(err);
    }
    err.config._retry = true;

    if (!refreshing) {
      refreshing = true;
      try {
        await axiosInstance.post("/auth/refresh");
        queue.forEach((resume) => resume());
        queue = [];
        return axiosInstance(err.config);
      } finally {
        refreshing = false;
      }
    }
    return new Promise((resolve) =>
      queue.push(() => resolve(axiosInstance(err.config)))
    );
  }
);
