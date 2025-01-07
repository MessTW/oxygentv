import { defineStore } from 'pinia'

export const useUIStore = defineStore('ui', {
  state: () => ({
    isPlayerOpen: false,
    loading: false,
    currentPage: 1,
    totalPages: 1,
    showGenresDrawer: false
  }),
  actions: {
    setPlayerOpen(value) {
      this.isPlayerOpen = value
    },
    setLoading(value) {
      if (!value) {
        setTimeout(() => {
          this.loading = value
        }, 300)
      } else {
        this.loading = value
      }
    },
    setCurrentPage(page) {
      this.currentPage = page
    },
    setTotalPages(total) {
      this.totalPages = total
    },
    toggleGenresDrawer(value) {
      this.showGenresDrawer = value ?? !this.showGenresDrawer
    }
  }
})
