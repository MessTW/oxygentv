import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/plugins/axios'
import { useLogoStore } from './logoStore'
import { useBlockListStore } from './blockList'

export const useFeaturedStore = defineStore('featured', () => {
  const items = ref([])
  const currentIndex = ref(0)
  const isLoading = ref(true)
  const backgroundCache = ref({})
  const movieDetails = ref({})

  const logoStore = useLogoStore()
  const blockListStore = useBlockListStore()

  const currentItem = computed(() => items.value[currentIndex.value])

  const currentMovieLogo = computed(() =>
    currentItem.value ? logoStore.logos[currentItem.value.id] : null
  )

  const fetchFeatured = async () => {
    if (items.value.length) {
      return items.value
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
        .filter(movie =>
          movie.title?.trim() &&
          movie.overview?.trim() &&
          !blockListStore.isMovieBlocked(movie.id)
        )
        .map(movie => ({ ...movie, mediaType: 'movie' }))

      const filteredSeries = seriesData.results
        .filter(show =>
          show.name?.trim() &&
          show.overview?.trim() &&
          !blockListStore.isSeriesBlocked(show.id)
        )
        .map(show => ({ ...show, mediaType: 'tv', routeType: 'series' }))

      items.value = [...filteredMovies, ...filteredSeries]
        .sort(() => Math.random() - 0.5)
        .slice(0, 5)

      // Предзагрузка логотипов и деталей
      await Promise.all(items.value.map(item => logoStore.fetchLogo(item.id, item.mediaType)))
      await Promise.all(items.value.map(fetchItemDetails))

    } catch (error) {
      console.error('Error:', error)
    } finally {
      isLoading.value = false
    }
  }

  const fetchItemDetails = async (item) => {
    if (logoStore.details[item.id]) return

    try {
      const { data: details } = await api.get(`${item.mediaType}/${item.id}`, {
        params: {
          language: 'ru-RU',
          append_to_response: 'release_dates'
        }
      })

      const itemDetails = {
        type: item.mediaType === 'movie' ? 'Фильм' : 'Сериал',
        tagline: details.tagline || item.overview?.split('.')[0] + '.',
        rating: details.adult ? '18+' : '12+',
        genres: details.genres?.map(g => g.name).slice(0, 3).join(' ') || '',
        status: item.mediaType === 'tv' ?
          (details.status === 'Ended' ? 'Завершен' : 'Выходит') : undefined
      }

      movieDetails.value[item.id] = itemDetails
      logoStore.cacheDetails(item.id, itemDetails)
    } catch (error) {
      console.error('Error fetching details:', error)
    }
  }

  const setCurrentIndex = (index) => {
    currentIndex.value = index
  }

  const getBackgroundImage = (path, isMobile = false) => {
    if (!path) return ''

    const cacheKey = `${path}-${isMobile ? 'mobile' : 'desktop'}`
    if (backgroundCache.value[cacheKey]) {
      return backgroundCache.value[cacheKey]
    }

    const imageUrl = `url(https://imagetmdb.com/t/p/w1280${path})`
    backgroundCache.value[cacheKey] = imageUrl
    return imageUrl
  }

  return {
    items,
    currentIndex,
    isLoading,
    currentItem,
    currentMovieLogo,
    movieDetails,
    fetchFeatured,
    setCurrentIndex,
    getBackgroundImage
  }
})
