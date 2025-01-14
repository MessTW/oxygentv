import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/plugins/axios'

export const useTrendStore = defineStore('trend', () => {
  const items = ref([])
  const isLoading = ref(true)

  const fetchTrending = async () => {
    if (items.value.length) {
      return items.value // Возвращаем кэшированные данные
    }

    try {
      isLoading.value = true
      const [moviesData, seriesData] = await Promise.all([
        api.get('trending/movie/week', {
          params: { language: 'ru-RU' }
        }).then(res => res.data),
        api.get('trending/tv/week', {
          params: { language: 'ru-RU' }
        }).then(res => res.data)
      ])

      const filteredMovies = moviesData.results
        .filter(movie => movie.title?.trim() && movie.overview?.trim())
        .map(movie => ({ ...movie, mediaType: 'movie' }))

      const filteredSeries = seriesData.results
        .filter(show => show.name?.trim() && show.overview?.trim())
        .map(show => ({ ...show, mediaType: 'tv', routeType: 'series' }))

      items.value = [...filteredMovies, ...filteredSeries]
        .sort(() => Math.random() - 0.5)

    } catch (error) {
      console.error('Error fetching trending:', error)
    } finally {
      isLoading.value = false
    }
  }

  return {
    items,
    isLoading,
    fetchTrending
  }
})
