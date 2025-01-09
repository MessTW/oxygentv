import { defineStore } from 'pinia'

export const useLogoStore = defineStore('logo', {
  state: () => ({
    logos: {},
    isLoading: false,
    loadingPromises: new Map()
  }),

  actions: {
    async fetchLogo(movieId, baseUrl, apiKey) {
      if (this.logos[movieId]) {
        return this.logos[movieId]
      }

      if (this.loadingPromises.has(movieId)) {
        return this.loadingPromises.get(movieId)
      }

      const promise = (async () => {
        try {
          const response = await fetch(
            `${baseUrl}/movie/${movieId}/images?api_key=${apiKey}`
          )
          const data = await response.json()
          const logo = data.logos?.find(logo => logo.iso_639_1 === 'ru') ||
                      data.logos?.find(logo => logo.iso_639_1 === 'en') ||
                      data.logos?.[0]

          if (logo) {
            const logoUrl = `https://imagetmdb.com/t/p/w500${logo.file_path}`
            this.logos[movieId] = logoUrl
            return logoUrl
          }
        } catch (error) {
          console.error('Error fetching movie logo:', error)
        } finally {
          this.loadingPromises.delete(movieId)
        }
        return null
      })()

      this.loadingPromises.set(movieId, promise)
      return promise
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
