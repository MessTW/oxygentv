import { defineStore } from 'pinia';

export const useBlockListStore = defineStore('blockList', {
  state: () => ({
    blockedMovies: JSON.parse(localStorage.getItem('blocked_movies') || '[]'),
    blockedSeries: JSON.parse(localStorage.getItem('blocked_series') || '[]'),
    blockedMoviesInfo: JSON.parse(localStorage.getItem('blocked_movies_info') || '{}'),
    blockedSeriesInfo: JSON.parse(localStorage.getItem('blocked_series_info') || '{}')
  }),

  actions: {
    blockMovie(id, title) {
      if (!this.blockedMovies.includes(id)) {
        this.blockedMovies.push(id);
        this.blockedMoviesInfo[id] = {
          title,
          blockedAt: new Date().toISOString()
        };
        localStorage.setItem('blocked_movies', JSON.stringify(this.blockedMovies));
        localStorage.setItem('blocked_movies_info', JSON.stringify(this.blockedMoviesInfo));
      }
    },

    blockSeries(id, title) {
      if (!this.blockedSeries.includes(id)) {
        this.blockedSeries.push(id);
        this.blockedSeriesInfo[id] = {
          title,
          blockedAt: new Date().toISOString()
        };
        localStorage.setItem('blocked_series', JSON.stringify(this.blockedSeries));
        localStorage.setItem('blocked_series_info', JSON.stringify(this.blockedSeriesInfo));
      }
    },

    unblockMovie(id) {
      const index = this.blockedMovies.indexOf(id);
      if (index > -1) {
        this.blockedMovies.splice(index, 1);
        delete this.blockedMoviesInfo[id];
        localStorage.setItem('blocked_movies', JSON.stringify(this.blockedMovies));
        localStorage.setItem('blocked_movies_info', JSON.stringify(this.blockedMoviesInfo));
      }
    },

    unblockSeries(id) {
      const index = this.blockedSeries.indexOf(id);
      if (index > -1) {
        this.blockedSeries.splice(index, 1);
        delete this.blockedSeriesInfo[id];
        localStorage.setItem('blocked_series', JSON.stringify(this.blockedSeries));
        localStorage.setItem('blocked_series_info', JSON.stringify(this.blockedSeriesInfo));
      }
    },

    isMovieBlocked(id) {
      return this.blockedMovies.includes(id);
    },

    isSeriesBlocked(id) {
      return this.blockedSeries.includes(id);
    },

    getBlockedMovieInfo(id) {
      return this.blockedMoviesInfo[id];
    },

    getBlockedSeriesInfo(id) {
      return this.blockedSeriesInfo[id];
    },

    unblockAllMovies() {
      this.blockedMovies = [];
      this.blockedMoviesInfo = {};
      localStorage.setItem('blocked_movies', '[]');
      localStorage.setItem('blocked_movies_info', '{}');
    },

    unblockAllSeries() {
      this.blockedSeries = [];
      this.blockedSeriesInfo = {};
      localStorage.setItem('blocked_series', '[]');
      localStorage.setItem('blocked_series_info', '{}');
    }
  }
});
