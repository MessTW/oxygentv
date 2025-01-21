import { defineStore } from 'pinia'
import { API_KEY, TMDB_BASE_URL } from '@/config/api'

const genreNameMap = {
  12: 'Приключения',
  16: 'Мультфильм',
  35: 'Комедия',
  80: 'Криминал',
  18: 'Драма',
  10751: 'Семейный',
  14: 'Фэнтези',
  36: 'История',
  27: 'Ужасы',
  10402: 'Музыка',
  9648: 'Детектив',
  10749: 'Мелодрама',
  878: 'Фантастика',
  53: 'Триллер',
  10752: 'Военный',
  37: 'Вестерн',
  10759: 'Боевик',
  10762: 'Детский',
  10765: 'Фэнтези',
  10768: 'Военный'
}

export const useContentStore = defineStore('content', {
  state: () => ({
    movies: [],
    series: [],
    movieGenres: [],
    tvGenres: [],
    currentPage: 1,
    selectedGenre: null,
    contentType: 'movie',
    loadedIds: new Set(),
    itemsPerPage: 20,
    cachedResults: {}
  }),

  getters: {
    mixedContent: (state) => {
      const mixed = [...state.movies.map(m => ({...m, media_type: 'movie'})),
                     ...state.series.map(s => ({...s, media_type: 'tv'}))]
      return mixed.sort(() => Math.random() - 0.5)
    }
  },

  actions: {
    async fetchGenres(type) {
      const response = await fetch(`${TMDB_BASE_URL}/genre/${type}/list?api_key=${API_KEY}&language=ru`)
      const data = await response.json()

      const mappedGenres = data.genres
        .filter(genre => genreNameMap[genre.id])
        .map(genre => ({
          ...genre,
          name: genreNameMap[genre.id]
        }))
        .sort((a, b) => a.name.localeCompare(b.name))

      if (type === 'movie') {
        this.movieGenres = mappedGenres
      } else {
        this.tvGenres = mappedGenres
      }
    },

    clearCache() {
      this.cachedResults = {}
      this.loadedIds.clear()
    },

    async fetchContent(page = 1, genreId = null, type = 'movie', studioParam = '') {
      const genreParam = genreId ? `&with_genres=${genreId}` : ''
      const url = `${TMDB_BASE_URL}/discover/${type}?api_key=${API_KEY}&language=ru&page=${page}${genreParam}${studioParam}`

      const response = await fetch(url)
      const data = await response.json()

      const filteredResults = data.results
        .filter(item => {
          const hasRussianTitle = type === 'movie'
            ? (item.title !== item.original_title)
            : (item.name !== item.original_name)
          const isReleased = type === 'movie'
            ? new Date(item.release_date) <= new Date()
            : new Date(item.first_air_date) <= new Date()

          return hasRussianTitle && isReleased
        })
        .map(item => ({
          ...item,
          media_type: type
        }))

      return {
        results: filteredResults,
        total_pages: data.total_pages
      }
    },

    setContentType(type) {
      if (type === this.contentType) return
      this.contentType = type
      this.currentPage = 1
      this.selectedGenre = null
      this.clearCache()
    }
  }
})
