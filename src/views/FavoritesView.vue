<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useFavoritesStore } from '../stores/favorites';
import { Icon } from '@iconify/vue';

const router = useRouter();
const favoritesStore = useFavoritesStore();

const showMovieDetails = (movie) => {
  router.push(`/movie/${movie.id}`);
};

const showSeriesDetails = (series) => {
  router.push(`/series/${series.id}`);
};

const toggleFavoriteMovie = (event, movie) => {
  event.stopPropagation();
  favoritesStore.toggleMovie(movie);
};

const toggleFavoriteSeries = (event, series) => {
  event.stopPropagation();
  favoritesStore.toggleSeries(series);
};

onMounted(() => {
  favoritesStore.loadFavorites();
});
</script>

<template>
  <div class="favorites">
    <section class="favorites-section" v-if="favoritesStore.movies.length > 0">
      <h2>Избранные фильмы</h2>
      <div class="content-grid">
        <div v-for="movie in favoritesStore.movies" :key="movie.id" class="movie-card" @click="showMovieDetails(movie)">
          <img :src="`https://imagetmdb.com/t/p/w500${movie.backdrop_path}`" :alt="movie.title"
            @error="$event.target.src = '/placeholder-poster.jpg'">
          <button class="favorite-button active" @click="(e) => toggleFavoriteMovie(e, movie)"
            title="Удалить из избранного">
            <Icon icon="mdi:heart" width="24" />
          </button>
          <div class="movie-overlay">
            <div class="meta-info">
              <span class="year">{{ movie.release_date?.split('-')[0] }}</span>
              <span class="rating">★ {{ movie.vote_average.toFixed(1) }}</span>
            </div>
            <h3 class="movie-title">{{ movie.title }}</h3>
          </div>
        </div>
      </div>
    </section>

    <section class="favorites-section" v-if="favoritesStore.series.length > 0">
      <h2>Избранные сериалы</h2>
      <div class="content-grid">
        <div v-for="series in favoritesStore.series" :key="series.id" class="series-card" @click="showSeriesDetails(series)">
          <img :src="`https://imagetmdb.com/t/p/w500${series.backdrop_path}`" :alt="series.name"
            @error="$event.target.src = '/placeholder-poster.jpg'">
          <button class="favorite-button active" @click="(e) => toggleFavoriteSeries(e, series)"
            title="Удалить из избранного">
            <Icon icon="mdi:heart" width="24" />
          </button>
          <div class="series-overlay">
            <div class="meta-info">
              <span class="year">{{ series.first_air_date?.split('-')[0] }}</span>
              <span class="rating">★ {{ series.vote_average.toFixed(1) }}</span>
            </div>
            <h3 class="series-title">{{ series.name }}</h3>
          </div>
        </div>
      </div>
    </section>

    <div v-if="favoritesStore.movies.length === 0 && favoritesStore.series.length === 0" class="empty-favorites">
      <Icon icon="mdi:heart-outline" width="48" />
      <h2>Список избранного пуст</h2>
      <p>Добавляйте фильмы и сериалы в избранное, чтобы они отображались здесь</p>
    </div>
  </div>
</template>

<style scoped>
.favorites {
  padding: 2rem;
}

.favorites-section {
  margin-bottom: 3rem;
}

.favorites-section h2 {
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.empty-favorites {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
  color: #808080;
}

.empty-favorites h2 {
  margin: 1rem 0;
}

.empty-favorites p {
  max-width: 400px;
  line-height: 1.5;
}
</style> 