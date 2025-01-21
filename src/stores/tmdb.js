import { defineStore } from 'pinia';
import { API_KEY, TMDB_BASE_URL } from '@/config/api';

export const useTMDBStore = defineStore('tmdb', {
  state: () => ({
    loading: false,
    error: null
  }),

  actions: {
    async getDetails(type, id) {
      try {
        this.loading = true;
        const response = await fetch(
          `${TMDB_BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=ru`
        );
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching details:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    }
  }
});
