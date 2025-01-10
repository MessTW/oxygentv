<script setup>
import { ref, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import { useBlockListStore } from '../../stores/blockList';

const API_KEY = 'd341436234a2bb8f0adc73114e093ab2';
const BASE_URL = 'https://apitmdb.cub.red/3';

const blockListStore = useBlockListStore();
const series = ref([]);
const isLoading = ref(true);
const error = ref(null);
const currentPage = ref(1);
const totalPages = ref(0);
const searchQuery = ref('');

const fetchSeries = async (page = 1) => {
  try {
    const endpoint = searchQuery.value
      ? `${BASE_URL}/search/tv?api_key=${API_KEY}&language=ru&query=${encodeURIComponent(searchQuery.value)}&page=${page}`
      : `${BASE_URL}/tv/popular?api_key=${API_KEY}&language=ru&page=${page}`;

    const response = await fetch(endpoint);
    const data = await response.json();
    totalPages.value = data.total_pages;
    currentPage.value = page;
    series.value = data.results.map(show => ({
      id: show.id,
      title: show.name,
      year: new Date(show.first_air_date).getFullYear(),
      isBlocked: blockListStore.isSeriesBlocked(show.id)
    }));
  } catch (err) {
    error.value = 'Ошибка при загрузке сериалов';
    console.error(err);
  } finally {
    isLoading.value = false;
  }
};

const handleSearch = () => {
  fetchSeries(1);
};

const unblockAll = () => {
  if (confirm('Вы уверены, что хотите разблокировать все сериалы?')) {
    blockListStore.unblockAllSeries();
    // Обновляем состояние UI
    series.value = series.value.map(show => ({
      ...show,
      isBlocked: false
    }));
  }
};

const toggleSeriesBlock = (seriesId, seriesTitle) => {
  const show = series.value.find(s => s.id === seriesId);
  if (show) {
    if (show.isBlocked) {
      blockListStore.unblockSeries(seriesId);
    } else {
      blockListStore.blockSeries(seriesId, seriesTitle);
    }
    show.isBlocked = !show.isBlocked;
  }
};

onMounted(() => {
  fetchSeries();
});
</script>

<template>
  <div class="series-manager">
    <div class="header">
      <h1>Управление сериалами</h1>
      <div class="header-actions">
        <button
          class="unblock-all-button"
          @click="unblockAll"
          v-if="series.some(s => s.isBlocked)"
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
              placeholder="Поиск сериалов..."
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

    <div v-else class="series-list">
      <div v-for="show in series"
           :key="show.id"
           class="series-item"
      >
        <div class="series-info">
          <span class="series-title">{{ show.title }}</span>
          <span class="series-year">{{ show.year }}</span>
          <span class="series-id">ID: {{ show.id }}</span>
          <span v-if="show.isBlocked" class="blocked-badge">Заблокирован</span>
        </div>
        <div class="series-actions">
          <button
            class="action-button"
            :class="show.isBlocked ? 'unblock-button' : 'block-button'"
            @click="toggleSeriesBlock(show.id, show.title)"
          >
            <Icon :icon="show.isBlocked ? 'mdi:eye' : 'mdi:eye-off'" />
            <span>{{ show.isBlocked ? 'Разблокировать' : 'Заблокировать' }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="pagination" v-if="totalPages > 1">
      <button
        :disabled="currentPage === 1"
        @click="fetchSeries(currentPage - 1)"
      >
        Предыдущая
      </button>
      <span>Страница {{ currentPage }} из {{ totalPages }}</span>
      <button
        :disabled="currentPage === totalPages"
        @click="fetchSeries(currentPage + 1)"
      >
        Следующая
      </button>
    </div>
  </div>
</template>

<style scoped>
.series-manager {
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

.series-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.series-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--surface);
  border-radius: 4px;
}

.series-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.series-title {
  font-weight: 500;
}

.series-year,
.series-id {
  color: var(--text-secondary);
}

.series-actions {
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
