import { defineStore } from 'pinia'

export const useWatchProgressStore = defineStore('watchProgress', {
  state: () => ({
    progress: JSON.parse(localStorage.getItem('watchProgress')) || {}
  }),

  actions: {
    updateProgress(showId, season, episode) {
      this.progress[showId] = { season, episode }
      localStorage.setItem('watchProgress', JSON.stringify(this.progress))
    },

    getProgress(showId) {
      return this.progress[showId] || { season: 1, episode: 1 }
    }
  }
})
