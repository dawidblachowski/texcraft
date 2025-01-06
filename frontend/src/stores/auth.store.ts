import { defineStore } from 'pinia'
import axios from 'axios'
import type { ToastServiceMethods } from 'primevue/toastservice'
import router from '../router'
const serverUrl = '/api'

export const useAuthStore = defineStore(
  'auth',
  {
    state: () => {
      if(localStorage.getItem('pinia')) {
        return JSON.parse(localStorage.getItem('pinia') as string).auth
      }
      return {
        accessToken: null,
        isAuthenticated: false
      }
    },
    actions: {
      async login(toast: ToastServiceMethods, email: string, password: string) {
        try {
          const response = await axios.post(serverUrl + '/auth/login', { email, password });
          this.accessToken = response.data.accessToken;
          this.isAuthenticated = true;
          if (this.accessToken) {
            localStorage.setItem('accessToken', this.accessToken);
          }
          toast.add({
            severity: 'success',
            summary: 'Login successful',
            detail: 'You are now logged in',
            life: 3000,
          });
        } catch (error) {
          toast.add({
            severity: 'error',
            summary: 'Login failed',
            detail: (error as any).response.data.message,
            life: 3000,
          });
          console.error('Login failed', error);
        }
      },
      async refreshToken(toast?: ToastServiceMethods) {
        try {
          const response = await axios.post(serverUrl + '/auth/refresh')
          this.accessToken = response.data.accessToken
          if (this.accessToken) {
            localStorage.setItem('accessToken', this.accessToken)
          }
          if(toast)
          toast.add({
            severity: 'success',
            summary: 'Token refresh successful',
            detail: 'Your token has been refreshed',
            life: 3000
          }
          )
          this.isAuthenticated = true;
        } catch (error) {
          this.isAuthenticated = false;
          if(toast)
          toast.add({
            severity: 'error',
            life: 3000,
            summary: 'Token refresh failed',
            detail: 'Your token has expired, please log in again'
          }
          )
          console.error('Token refresh failed', error)
        }
      },
      async logout(toast?: ToastServiceMethods) {
        this.accessToken = null
        this.isAuthenticated = false
        localStorage.removeItem('accessToken')
        if(toast)
        toast.add({
          severity: 'success',
          summary: 'Logout successful',
          detail: 'You have been logged out',
          life: 3000
        }
        )
        axios.post(serverUrl + '/auth/logout')
        router.push('/login')
      }
    }
  }
)
