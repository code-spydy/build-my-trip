import axios from "axios";
import environment from "../config/environment";

const apiClient = axios.create({
  baseURL: environment.apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong";

    return Promise.reject({
      ...error,
      userMessage: message,
    });
  }
);

export default apiClient;
