<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useFavoritesStore } from '../stores/favorites';
import { Icon } from '@iconify/vue';
import LazyImage from '../components/LazyImage.vue';

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
          <LazyImage
            :src="`https://imagetmdb.com/t/p/w500${movie.poster_path}`"
            :alt="movie.title"
          />
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
        <div v-for="show in favoritesStore.series" :key="show.id" class="series-card" @click="showSeriesDetails(show)">
          <LazyImage
            :src="`https://imagetmdb.com/t/p/w500${show.poster_path}`"
            :alt="show.name"
          />
          <button class="favorite-button active" @click="(e) => toggleFavoriteSeries(e, show)"
            title="Удалить из избранного">
            <Icon icon="mdi:heart" width="24" />
          </button>
          <div class="series-overlay">
            <div class="meta-info">
              <span class="year">{{ show.first_air_date?.split('-')[0] }}</span>
              <span class="rating">★ {{ show.vote_average.toFixed(1) }}</span>
            </div>
            <h3 class="series-title">{{ show.name }}</h3>
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
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
}

@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .content-card {
    border-radius: 6px;
    border-width: 2px;
  }

  .content-overlay {
    font-size: 0.8rem;
  }

  .meta-info {
    padding: 0.5rem;
    font-size: 0.75rem;
  }

  .content-title {
    padding: 0.5rem;
    font-size: 0.8rem;
  }

  .empty-state {
    font-size: 0.9rem;
    padding: 2rem var(--mobile-padding);
  }
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

.movie-card img,
.series-card img {
  width: 100%;
  aspect-ratio: 2/3;
  object-fit: cover;
  display: block;
}

.movie-card:hover img,
.series-card:hover img {
  filter: brightness(0.7);
}

.movie-card,
.series-card {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  border: 3px solid transparent;
  transition: border-color 0.2s ease;
}

.movie-card:hover,
.series-card:hover {
  border-color: rgba(255, 255, 255, 0.3);
}

.favorite-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  z-index: 10;
  opacity: 0;
}

.movie-card:hover .favorite-button,
.series-card:hover .favorite-button {
  opacity: 1;
}

.favorite-button.active {
  color: #e50914;
  opacity: 1;
}

.favorite-button:hover {
  transform: scale(1.2);
}

.movie-overlay,
.series-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  z-index: 1;
}

.meta-info {
  background: linear-gradient(rgba(0, 0, 0, 0.6), transparent);
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.movie-title,
.series-title {
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 1rem;
  margin: 0;
  color: white;
  font-size: 0.9rem;
}

.rating,
.year {
  color: white;
}
</style>
