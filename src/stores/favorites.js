import { defineStore } from 'pinia'

export const useFavoritesStore = defineStore('favorites', {
  state: () => ({
    movies: [],
    series: []
  }),

  actions: {
    toggleMovie(movie) {
      const index = this.movies.findIndex(m => m.id === movie.id)
      if (index === -1) {
        this.movies.push(movie)
      } else {
        this.movies.splice(index, 1)
      }
      // Сохраняем в localStorage
      localStorage.setItem('favoriteMovies', JSON.stringify(this.movies))
    },

    toggleSeries(series) {
      const index = this.series.findIndex(s => s.id === series.id)
      if (index === -1) {
        this.series.push(series)
      } else {
        this.series.splice(index, 1)
      }
      // Сохраняем в localStorage
      localStorage.setItem('favoriteSeries', JSON.stringify(this.series))
    },

    isMovieFavorite(movie) {
      const movieId = typeof movie === 'object' ? movie.id : movie;
      return this.movies.some(m => m.id === movieId);
    },

    isSeriesFavorite(seriesId) {
      return this.series.some(series => series.id === seriesId)
    },

    // Загрузка избранного из localStorage при инициализации
    loadFavorites() {
      const movies = localStorage.getItem('favoriteMovies')
      const series = localStorage.getItem('favoriteSeries')
      if (movies) this.movies = JSON.parse(movies)
      if (series) this.series = JSON.parse(series)
    }
  }
})
