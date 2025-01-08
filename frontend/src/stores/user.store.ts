import { defineStore } from 'pinia';
import axios from '../utils/httpClient';

export const useUserStore = defineStore('user', {
  state: () => ({
    email: '',
    id: '',
  }),
  actions: {
    async fetchUserProfile() {
      try {
        const response = await axios.get('/user/profile');
        this.email = response.data.user.email;
        this.id = response.data.user.id;
      } catch (error) {
        console.error('Failed to fetch user profile', error);
      }
    },
  },
});
