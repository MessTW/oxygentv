<script setup>
import { onMounted, computed, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useFavoritesStore } from '../stores/favorites';
import { useContentStore } from '../stores/content';
import { useUIStore } from '../stores/ui';
import { Icon } from '@iconify/vue';
import LazyImage from '../components/LazyImage.vue';

const router = useRouter();
const favoritesStore = useFavoritesStore();
const contentStore = useContentStore();
const uiStore = useUIStore();

const activeTab = ref('movie'); // 'movie' или 'tv'

const showDetails = (item) => {
  router.push(`/${activeTab.value === 'movie' ? 'movie' : 'series'}/${item.id}`);
};

const toggleFavorite = (event, item) => {
  event.stopPropagation();
  if (activeTab.value === 'movie') {
    favoritesStore.toggleMovie(item);
  } else {
    favoritesStore.toggleSeries(item);
  }
};

const handleGenreSelect = (genreId) => {
  if (activeTab.value === 'movie') {
    contentStore.setSelectedMovieGenre(genreId);
  } else {
    contentStore.setSelectedSeriesGenre(genreId);
  }
};

const isFavorite = (item) => {
  return activeTab.value === 'movie'
    ? favoritesStore.isMovieFavorite(item.id)
    : favoritesStore.isSeriesFavorite(item.id);
};

const getTitle = (item) => {
  return activeTab.value === 'movie' ? item.title : item.name;
};

const getYear = (item) => {
  const date = activeTab.value === 'movie' ? item.release_date : item.first_air_date;
  return date?.split('-')[0];
};

const items = computed(() => {
  return activeTab.value === 'movie' ? contentStore.movies : contentStore.series;
});

const selectedGenre = computed(() => {
  return activeTab.value === 'movie'
    ? contentStore.selectedMovieGenre
    : contentStore.selectedSeriesGenre;
});

const fetchContent = (page = 1) => {
  if (activeTab.value === 'movie') {
    contentStore.fetchMovies(page);
  } else {
    contentStore.fetchSeries(page);
  }
};

const switchContentType = (type) => {
  activeTab.value = type;
  contentStore.resetGenres();
  contentStore.fetchGenres(type);
  fetchContent(1);
};

onMounted(() => {
  favoritesStore.loadFavorites();
  contentStore.fetchGenres(activeTab.value);
  fetchContent();
});
</script>

<template>
  <div class="content">
    <div class="content-type-switch">
      <button
        :class="{ active: activeTab === 'movie' }"
        @click="switchContentType('movie')"
      >
        <Icon icon="mdi:movie" width="20" />
        Фильмы
      </button>
      <button
        :class="{ active: activeTab === 'tv' }"
        @click="switchContentType('tv')"
      >
        <Icon icon="mdi:television-classic" width="20" />
        Сериалы
      </button>
    </div>

    <div class="filters">
      <div class="search-container">
        <div class="search-wrapper">
          <input
            type="text"
            v-model="contentStore.searchQuery"
            @keyup.enter="contentStore.searchContent(activeTab)"
            :placeholder="activeTab === 'movie' ? 'Поиск фильмов...' : 'Поиск сериалов...'"
          >
          <button @click="contentStore.searchContent(activeTab)">
            <Icon icon="mdi:magnify" width="24" />
          </button>
        </div>
      </div>
    </div>

    <div class="filter-button" @click="uiStore.toggleGenresDrawer()">
      <Icon icon="mdi:filter-variant" width="24" />
      <span>Жанры</span>
    </div>

    <div class="genres-drawer" :class="{ 'show': uiStore.showGenresDrawer }">
      <div class="drawer-overlay" @click="uiStore.toggleGenresDrawer(false)"></div>
      <div class="drawer-content">
        <div class="genres-header">
          <div class="drawer-handle"></div>
          <button class="close-button" @click="uiStore.toggleGenresDrawer(false)">
            <Icon icon="mdi:close" width="24" />
          </button>
        </div>
        <div class="genres-list">
          <button
            class="genre-button"
            @click="handleGenreSelect(null)"
            :class="{ active: !selectedGenre }"
          >
            Все
          </button>
          <button
            v-for="genre in contentStore.genres"
            :key="genre.id"
            class="genre-button"
            :class="{ active: selectedGenre === genre.id }"
            @click="handleGenreSelect(genre.id)"
          >
            {{ genre.name }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="uiStore.loading && !items.length" class="loading">
      <div class="loader"></div>
    </div>

    <div v-else class="content-grid">
      <div
        v-for="item in items"
        :key="item.id"
        class="content-card"
        @click="showDetails(item)"
      >
        <LazyImage
          :src="`https://imagetmdb.com/t/p/w500${item.poster_path}`"
          :alt="getTitle(item)"
        />
        <button
          class="favorite-button"
          :class="{ active: isFavorite(item) }"
          @click="(e) => toggleFavorite(e, item)"
          :title="isFavorite(item) ? 'Удалить из избранного' : 'Добавить в избранное'"
        >
          <Icon
            :icon="isFavorite(item) ? 'mdi:heart' : 'mdi:heart-outline'"
            width="24"
          />
        </button>
        <div class="content-overlay">
          <div class="meta-info">
            <span class="year">{{ getYear(item) }}</span>
            <span class="rating">★ {{ item.vote_average.toFixed(1) }}</span>
          </div>
          <h3 class="content-title">{{ getTitle(item) }}</h3>
        </div>
      </div>
    </div>

    <div class="pagination" v-show="uiStore.totalPages > 1">
      <button
        :disabled="uiStore.currentPage === 1"
        @click="fetchContent(uiStore.currentPage - 1)"
      >
        Предыдущая
      </button>
      <div class="page-info">
        <span class="page-label">Страница</span>
        <span class="page-numbers">{{ uiStore.currentPage }}</span>
      </div>
      <button
        :disabled="uiStore.currentPage === uiStore.totalPages"
        @click="fetchContent(uiStore.currentPage + 1)"
      >
        Следующая
      </button>
    </div>
  </div>
</template>

<style scoped>
.content {
  padding: var(--mobile-padding);
}
.movies {
  padding: var(--mobile-padding);
}

.filters {
  padding: 0;
  margin-bottom: 1rem;
}

.search-container {
  margin-bottom: 1rem;
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.search-wrapper {
  display: flex;
  gap: 0.5rem;
  max-width: 600px;
  width: 100%;
  background: rgba(0, 0, 0, 0.8);
  padding: 0.5rem;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.search-container input {
  flex: 1;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
}

.search-container input:focus {
  outline: none;
  border-color: var(--ring);
  box-shadow: 0 0 0 1px var(--ring);
}

.search-container button {
  padding: 0.5rem;
  width: 40px;
  height: 40px;
  background-color: var(--button-bg);
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.search-container button:hover {
  background-color: var(--button-hover);
}

.genres {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  padding: 1rem;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.genre-button {
  padding: 0.5rem 1rem;
  background-color: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.genre-button:hover {
  background-color: var(--button-hover);
}

.genre-button.active {
  background-color: var(--button-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.genre-button.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--accent);
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
}

.content-card {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid transparent;
  transition: border-color 0.2s ease;
}

.content-card:hover {
  border-color: rgba(255, 255, 255, 0.3);
}

.content-card img {
  width: 100%;
  aspect-ratio: 2/3;
  object-fit: cover;
  display: block;
}

.content-card:hover img {
  filter: brightness(0.7);
}

.content-overlay {
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

.content-title {
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 1rem;
  margin: 0;
  color: white;
  font-size: 0.9rem;
}

.rating, .year {
  color: white;
}

.pagination {
  position: fixed;
  bottom: calc(var(--mobile-bottom-offset) + 1rem);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  z-index: 100;
}

.pagination button {
  padding: 0.5rem;
  background-color: var(--button-bg);
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 44px;
  min-height: 44px;
  font-size: 0.875rem;
}

.pagination button:hover:not(:disabled) {
  background-color: var(--button-hover);
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination span {
  color: var(--text-secondary);
}

.movies-grid, .series-grid {
  margin-bottom: 6rem;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.loader {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-radius: 50%;
  border-top: 5px solid #e50914;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background-color: #141414;
  border-radius: 8px;
  max-width: 1000px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  padding: 2rem;
}

.close-button {
  position: absolute;
  right: 1rem;
  top: 1rem;
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
}

.modal-header {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
}

.modal-header img {
  width: 300px;
  border-radius: 8px;
}

.modal-info {
  flex: 1;
}

.tagline {
  color: #999;
  font-style: italic;
  margin: 1rem 0;
}

.meta-info {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
}

.genres-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.genres-tags span {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.overview {
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.cast {
  margin-bottom: 1.5rem;
}

.cast-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 0.5rem;
}

.trailer-section {
  margin-top: 2rem;
}

.trailer-section iframe {
  width: 100%;
  aspect-ratio: 16/9;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .modal-header {
    flex-direction: column;
  }

  .modal-header img {
    width: 100%;
  }

  .genres {
    justify-content: center;
  }

  .movies {
    padding: var(--mobile-padding);
  }

  .filters {
    padding: 0;
    margin-bottom: 1rem;
  }

  .movies-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: calc(var(--mobile-bottom-offset) + 2rem);
  }

  .movie-card {
    border-width: 2px;
  }

  .movie-title {
    font-size: 0.8rem;
  }

  .pagination {
    bottom: calc(var(--mobile-bottom-offset) + 1rem);
    padding: 0.75rem 1rem;
  }

  .pagination button {
    min-width: 44px;
    min-height: 44px;
    padding: 0.5rem;
    font-size: 0.875rem;
  }

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

.content-card:hover .favorite-button,
.movie-card:hover .favorite-button,
.series-card:hover .favorite-button {
  opacity: 1;
}

.favorite-button.active {
  color: #e50914;
}

.favorite-button:hover {
  transform: scale(1.2);
}

.page-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.page-label {
  color: var(--text-secondary);
  font-size: 0.75rem;
}

.page-numbers {
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
}

.filter-button {
  position: fixed;
  bottom: calc(var(--mobile-bottom-offset) + 5rem);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.8);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  border: none;
  color: white;
  cursor: pointer;
  z-index: 99;
  font-size: 0.9rem;
  font-weight: 500;
}

.genres-drawer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 70vh;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  transform: translateY(100%);
  transition: transform 0.3s ease-out;
}

.genres-drawer.show {
  transform: translateY(0);
}

.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  z-index: -1;
}

.drawer-content {
  background: rgba(0, 0, 0, 0.95);
  border-radius: 20px 20px 0 0;
  padding: 1.5rem;
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

.genres-header {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 0 0.5rem;
  position: relative;
}

.drawer-handle {
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  margin-bottom: 1rem;
}

.close-button {
  position: absolute;
  right: 0;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.close-button:hover {
  background-color: var(--button-hover);
}

.genres-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  padding: 0 0.5rem;
}

.genre-button {
  width: 100%;
  padding: 1rem;
  text-align: center;
  background-color: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 12px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  font-weight: 500;
}

.genre-button:hover {
  background-color: var(--button-hover);
}

.genre-button.active {
  background-color: var(--button-hover);
  transform: scale(0.98);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  position: relative;
}

.genre-button.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--accent);
}

.content-type-switch {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.content-type-switch button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(0, 0, 0, 0.8);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.content-type-switch button:hover {
  background: rgba(255, 255, 255, 0.15);
}

.content-type-switch button.active {
  background: var(--button-hover);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
</style>
