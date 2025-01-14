import { defineStore } from 'pinia'
import { useUIStore } from './ui'
import { useCacheStore } from './cache'

const API_KEY = 'd341436234a2bb8f0adc73114e093ab2'
const BASE_URL = 'https://apitmdb.cub.red/3'
const ITEMS_PER_PAGE = 15

export const useContentStore = defineStore('content', {
  state: () => ({
    movies: [],
    series: [],
    genres: [],
    selectedMovieGenre: null,
    selectedSeriesGenre: null,
    searchQuery: '',
    previousMovies: [],
    previousSeries: [],
    allMovies: [],
    allSeries: [],
    currentMoviePage: 1,
    currentSeriesPage: 1,
  }),

  actions: {
    async fetchGenres(type = 'movie') {
      const cache = useCacheStore()
      const cachedGenres = type === 'movie' ? cache.movieGenres : cache.seriesGenres

      if (cachedGenres.length > 0) {
        this.genres = cachedGenres
        return
      }

      try {
        const response = await fetch(
          `${BASE_URL}/genre/${type}/list?api_key=${API_KEY}&language=ru-RU`
        )
        const data = await response.json()
        this.genres = data.genres
        if (type === 'movie') {
          cache.cacheMovieGenres(data.genres)
        } else {
          cache.cacheSeriesGenres(data.genres)
        }
      } catch (error) {
        console.error('Error fetching genres:', error)
      }
    },

    async fetchMovies(page = 1) {
      const ui = useUIStore()
      const cache = useCacheStore()

      ui.setLoading(true)
      try {
        const url = this.selectedMovieGenre
          ? `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${this.selectedMovieGenre}&language=ru-RU&page=${page}`
          : `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=ru-RU&page=${page}`

        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json()

        const uniqueIds = new Set()
        const filteredMovies = data.results.filter(movie =>
          !uniqueIds.has(movie.id) &&
          uniqueIds.add(movie.id) &&
          movie.title &&
          movie.title.trim() !== '' &&
          movie.overview &&
          movie.overview.trim() !== ''
        )

        this.movies = filteredMovies.slice(0, ITEMS_PER_PAGE)
        cache.cacheMovies(page, filteredMovies)
        ui.setTotalPages(data.total_pages)
        ui.setCurrentPage(page)
        this.previousMovies = this.movies
      } catch (error) {
        console.error('Error:', error)
        this.movies = []
        return Promise.reject(error)
      } finally {
        ui.setLoading(false)
      }
    },

    async searchContent(type = 'movie') {
      if (!this.searchQuery) {
        if (type === 'movie') {
          await this.fetchMovies()
        } else {
          await this.fetchSeries()
        }
        return
      }

      const ui = useUIStore()
      ui.setLoading(true)
      try {
        const response = await fetch(
          `${BASE_URL}/search/${type}?api_key=${API_KEY}&query=${this.searchQuery}&language=ru-RU&page=${ui.currentPage}`
        )
        const data = await response.json()

        if (type === 'movie') {
          this.movies = data.results
            .filter(movie =>
              movie.title &&
              movie.title.trim() !== '' &&
              movie.overview &&
              movie.overview.trim() !== ''
            )
            .slice(0, ITEMS_PER_PAGE)
        } else {
          this.series = data.results
            .filter(series =>
              series.name &&
              series.name.trim() !== '' &&
              series.overview &&
              series.overview.trim() !== ''
            )
            .slice(0, ITEMS_PER_PAGE)
        }

        ui.setTotalPages(data.total_pages)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        ui.setLoading(false)
      }
    },

    setSelectedMovieGenre(genreId) {
      this.selectedMovieGenre = genreId
      this.movies = []
      this.previousMovies = []
      const cache = useCacheStore()
      cache.clearMoviesCache()
      this.fetchMovies(1)
    },

    setSelectedSeriesGenre(genreId) {
      this.selectedSeriesGenre = genreId
      this.series = []
      this.previousSeries = []
      const cache = useCacheStore()
      cache.clearSeriesCache()
      this.fetchSeries(1)
    },

    setSearchQuery(query) {
      this.searchQuery = query
    },

    async fetchSeries(page = 1) {
      const ui = useUIStore()
      const cache = useCacheStore()

      ui.setLoading(true)
      try {
        const url = this.selectedSeriesGenre
          ? `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=${this.selectedSeriesGenre}&language=ru-RU&page=${page}`
          : `${BASE_URL}/tv/popular?api_key=${API_KEY}&language=ru-RU&page=${page}`

        const response = await fetch(url)
        const data = await response.json()

        const uniqueIds = new Set()
        const filteredSeries = data.results.filter(series =>
          !uniqueIds.has(series.id) &&
          uniqueIds.add(series.id) &&
          series.name &&
          series.name.trim() !== '' &&
          series.overview &&
          series.overview.trim() !== ''
        )

        if (filteredSeries.length < ITEMS_PER_PAGE && page < data.total_pages) {
          const nextUrl = this.selectedSeriesGenre
            ? `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=${this.selectedSeriesGenre}&language=ru-RU&page=${page + 1}`
            : `${BASE_URL}/tv/popular?api_key=${API_KEY}&language=ru-RU&page=${page + 1}`

          const nextResponse = await fetch(nextUrl)
          const nextData = await nextResponse.json()

          const nextFilteredSeries = nextData.results.filter(series =>
            !uniqueIds.has(series.id) &&
            uniqueIds.add(series.id) &&
            series.name &&
            series.name.trim() !== '' &&
            series.overview &&
            series.overview.trim() !== ''
          )

          filteredSeries.push(...nextFilteredSeries)
        }

        this.series = filteredSeries.slice(0, ITEMS_PER_PAGE)
        cache.cacheSeries(page, filteredSeries)
        ui.setTotalPages(data.total_pages)
        ui.setCurrentPage(page)
        this.previousSeries = this.series
      } catch (error) {
        console.error('Error:', error)
      } finally {
        ui.setLoading(false)
      }
    },

    resetGenres() {
      this.selectedMovieGenre = null;
      this.selectedSeriesGenre = null;
    },
  }
})
