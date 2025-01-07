import { defineStore } from 'pinia'

export const useCacheStore = defineStore('cache', {
  state: () => ({
    movies: new Map(), // { page: movies[] }
    series: new Map(), // { page: series[] }
    movieGenres: [],
    seriesGenres: []
  }),

  actions: {
    cacheMovies(page, movies) {
      this.movies.set(page, movies)
    },

    cacheSeries(page, series) {
      this.series.set(page, series)
    },

    getCachedMovies(page) {
      return this.movies.get(page)
    },

    getCachedSeries(page) {
      return this.series.get(page)
    },

    cacheMovieGenres(genres) {
      this.movieGenres = genres
    },

    cacheSeriesGenres(genres) {
      this.seriesGenres = genres
    },

    clearCache() {
      this.movies.clear()
      this.series.clear()
    },

    clearMoviesCache() {
      this.movies.clear()
    },

    clearSeriesCache() {
      this.series.clear()
    }
  }
})
