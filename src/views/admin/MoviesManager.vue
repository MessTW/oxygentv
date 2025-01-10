<script setup>
import { ref, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import { useBlockListStore } from '../../stores/blockList';

const API_KEY = 'd341436234a2bb8f0adc73114e093ab2';
const BASE_URL = 'https://apitmdb.cub.red/3';

const blockListStore = useBlockListStore();
const movies = ref([]);
const isLoading = ref(true);
const error = ref(null);
const currentPage = ref(1);
const totalPages = ref(0);
const searchQuery = ref('');

const fetchMovies = async (page = 1) => {
  try {
    const endpoint = searchQuery.value
      ? `${BASE_URL}/search/movie?api_key=${API_KEY}&language=ru&query=${encodeURIComponent(searchQuery.value)}&page=${page}`
      : `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=ru&page=${page}`;

    const response = await fetch(endpoint);
    const data = await response.json();
    totalPages.value = data.total_pages;
    currentPage.value = page;
    movies.value = data.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      year: new Date(movie.release_date).getFullYear(),
      isBlocked: blockListStore.isMovieBlocked(movie.id)
    }));
  } catch (err) {
    error.value = 'Ошибка при загрузке фильмов';
    console.error(err);
  } finally {
    isLoading.value = false;
  }
};

const handleSearch = () => {
  fetchMovies(1);
};

const unblockAll = () => {
  if (confirm('Вы уверены, что хотите разблокировать все фильмы?')) {
    blockListStore.unblockAllMovies();
    // Обновляем состояние UI
    movies.value = movies.value.map(movie => ({
      ...movie,
      isBlocked: false
    }));
  }
};

const toggleMovieBlock = (movieId, movieTitle) => {
  const movie = movies.value.find(m => m.id === movieId);
  if (movie) {
    if (movie.isBlocked) {
      blockListStore.unblockMovie(movieId);
    } else {
      blockListStore.blockMovie(movieId, movieTitle);
    }
    movie.isBlocked = !movie.isBlocked;
  }
};

onMounted(() => {
  fetchMovies();
});
</script>

<template>
  <div class="movies-manager">
    <div class="header">
      <h1>Управление фильмами</h1>
      <div class="header-actions">
        <button
          class="unblock-all-button"
          @click="unblockAll"
          v-if="movies.some(m => m.isBlocked)"
        >
          <Icon icon="mdi:eye-check" />
          <span>Разблокировать все</span>
        </button>
        <div class="search-container">
          <div class="search-wrapper">
            <input
              type="text"
              v-model="searchQuery"
              @keyup.enter="handleSearch"
              placeholder="Поиск фильмов..."
            >
            <button @click="handleSearch">
              <Icon icon="mdi:magnify" width="24" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="loading">
      <div class="loader"></div>
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <div v-else class="movies-list">
      <div v-for="movie in movies"
           :key="movie.id"
           class="movie-item"
      >
        <div class="movie-info">
          <span class="movie-title">{{ movie.title }}</span>
          <span class="movie-year">{{ movie.year }}</span>
          <span class="movie-id">ID: {{ movie.id }}</span>
          <span v-if="movie.isBlocked" class="blocked-badge">Заблокирован</span>
        </div>
        <div class="movie-actions">
          <button
            class="action-button"
            :class="movie.isBlocked ? 'unblock-button' : 'block-button'"
            @click="toggleMovieBlock(movie.id, movie.title)"
          >
            <Icon :icon="movie.isBlocked ? 'mdi:eye' : 'mdi:eye-off'" />
            <span>{{ movie.isBlocked ? 'Разблокировать' : 'Заблокировать' }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="pagination" v-if="totalPages > 1">
      <button
        :disabled="currentPage === 1"
        @click="fetchMovies(currentPage - 1)"
      >
        Предыдущая
      </button>
      <span>Страница {{ currentPage }} из {{ totalPages }}</span>
      <button
        :disabled="currentPage === totalPages"
        @click="fetchMovies(currentPage + 1)"
      >
        Следующая
      </button>
    </div>
  </div>
</template>

<style scoped>
.movies-manager {
  padding: 1rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.add-button {
  padding: 0.75rem 1.5rem;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.loading {
  text-align: center;
  padding: 2rem;
}

.loader {
  width: 24px;
  height: 24px;
  border: 2px solid var(--text-secondary);
  border-bottom-color: transparent;
  border-radius: 50%;
  animation: rotation 1s linear infinite;
  margin: 0 auto;
}

@keyframes rotation {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.movies-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.movie-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--surface);
  border-radius: 4px;
}

.movie-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.movie-title {
  font-weight: 500;
}

.movie-year,
.movie-id {
  color: var(--text-secondary);
}

.movie-actions {
  display: flex;
  gap: 0.5rem;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: var(--surface-light);
  color: var(--text-primary);
}

.hide-button:hover {
  background: var(--surface-hover);
}

.error {
  color: #ff4444;
  text-align: center;
  padding: 1rem;
}

.blocked-badge {
  background: #ff4444;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.block-button {
  background: #ff4444;
  color: white;
}

.unblock-button {
  background: #4CAF50;
  color: white;
}

.search-container {
  margin-bottom: 1rem;
}

.search-wrapper {
  display: flex;
  gap: 0.5rem;
  max-width: 400px;
  width: 100%;
  background: var(--surface);
  padding: 0.5rem;
  border-radius: 8px;
}

.search-wrapper input {
  flex: 1;
  background: none;
  border: none;
  color: var(--text-primary);
  outline: none;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.pagination button {
  padding: 0.5rem 1rem;
  background: var(--surface);
  border: none;
  border-radius: 4px;
  color: var(--text-primary);
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.unblock-all-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.unblock-all-button:hover {
  background: var(--accent-hover);
}
</style>
