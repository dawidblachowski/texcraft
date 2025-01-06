import { defineStore } from 'pinia';

export const useDarkModeStore = defineStore('darkMode', {
  state: () => ({
    isDarkMode: false,
  }),

  actions: {
    initializeDarkMode() {
      const savedMode = localStorage.getItem('darkMode');
      this.isDarkMode = savedMode === 'true';

      if (this.isDarkMode) {
        document.documentElement.classList.add('dark-mode');
      }
    },

    toggleDarkMode(isDark: boolean) {
      this.isDarkMode = isDark;

      document.documentElement.classList.toggle('dark-mode', this.isDarkMode);

      localStorage.setItem('darkMode', String(this.isDarkMode));
    },
  },
});
