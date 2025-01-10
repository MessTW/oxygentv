import { defineStore } from 'pinia'

export const useLogoStore = defineStore('logo', {
  state: () => ({
    logos: {}
  }),

  actions: {
    async fetchLogo(id, baseUrl, apiKey, type = 'movie') {
      try {
        const response = await fetch(
          `${baseUrl}/${type}/${id}/images?api_key=${apiKey}`
        )
        const data = await response.json()

        if (data.logos && data.logos.length > 0) {
          // Ищем русский или английский логотип
          const logo = data.logos.find(l => l.iso_639_1 === 'ru') ||
                      data.logos.find(l => l.iso_639_1 === 'en') ||
                      data.logos[0]

          if (logo) {
            const logoUrl = `https://imagetmdb.com/t/p/w500${logo.file_path}`
            this.logos[id] = logoUrl
            return logoUrl
          }
        }
        return null
      } catch (error) {
        console.error('Error fetching logo:', error)
        return null
      }
    },

    async prefetchLogos(movies, baseUrl, apiKey) {
      if (this.isLoading) return
      this.isLoading = true

      try {
        await Promise.all(
          movies.map(movie => this.fetchLogo(movie.id, baseUrl, apiKey))
        )
      } finally {
        this.isLoading = false
      }
    }
  }
})
