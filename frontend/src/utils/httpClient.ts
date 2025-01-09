import axios, { AxiosError } from 'axios';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/auth.store';
import router from '../router';


interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const httpClient = axios.create({
  baseURL: '/api', 
  timeout: 10000, 
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onRefreshed = (newToken: string): void => {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void): void => {
  refreshSubscribers.push(callback);
};

httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authStore = useAuthStore();
    if (authStore.isAuthenticated && authStore.accessToken) {
      config.headers.set('Authorization', `Bearer ${authStore.accessToken}`);
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

httpClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const authStore = useAuthStore();
    const originalRequest = error.config as RetryableRequestConfig;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          await authStore.refreshToken();
          const newToken = authStore.accessToken!;
          onRefreshed(newToken); 
          isRefreshing = false;
        } catch (refreshError) {
          isRefreshing = false;
          authStore.logout();
          router.push('/login');
          return Promise.reject(refreshError);
        }
      }

      return new Promise<AxiosResponse>((resolve) => {
        addRefreshSubscriber((newToken) => {
          originalRequest._retry = true;
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          resolve(httpClient(originalRequest));
        });
      });
    }

    return Promise.reject(error);
  }
);

export default httpClient;
