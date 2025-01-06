<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useFavoritesStore } from '../stores/favorites';
import { Icon } from '@iconify/vue';

const API_KEY = 'd341436234a2bb8f0adc73114e093ab2';
const BASE_URL = 'https://apitmdb.cub.red/3';

const series = ref([]);
const genres = ref([]);
const selectedGenre = ref(null);
const searchQuery = ref('');
const currentPage = ref(1);
const totalPages = ref(1);
const loading = ref(false);

const router = useRouter();
const favoritesStore = useFavoritesStore();

const fetchGenres = async () => {
  try {
    const response = await fetch(
      `${BASE_URL}/genre/tv/list?api_key=${API_KEY}&language=ru-RU`
    );
    const data = await response.json();
    genres.value = data.genres;
  } catch (error) {
    console.error('Erro ao buscar gêneros:', error);
  }
};

const fetchSeries = async (genreId = '', page = 1) => {
  loading.value = true;
  try {
    const url = genreId
      ? `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=${genreId}&language=ru-RU&page=${page}`
      : `${BASE_URL}/tv/popular?api_key=${API_KEY}&language=ru-RU&page=${page}`;

    const response = await fetch(url);
    const data = await response.json();
    const filteredResults = data.results.filter(show => 
      show.name && 
      show.name.trim() !== '' && 
      show.overview && 
      show.overview.trim() !== ''
    );

    series.value = filteredResults;
    totalPages.value = data.total_pages;
    currentPage.value = page;
    selectedGenre.value = genreId;
  } catch (error) {
    console.error('Error:', error);
  } finally {
    loading.value = false;
  }
};

const searchSeries = async () => {
  if (!searchQuery.value) {
    fetchSeries('', 1);
    return;
  }

  loading.value = true;
  try {
    const response = await fetch(
      `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${searchQuery.value}&language=ru-RU&page=${currentPage.value}`
    );
    const data = await response.json();
    const filteredResults = data.results.filter(show => 
      show.name && show.name.trim() !== '' && 
      show.overview && show.overview.trim() !== ''
    );

    const seriesWithBackdrops = await Promise.all(
      filteredResults.map(async (series) => {
        const imagesResponse = await fetch(
          `${BASE_URL}/tv/${series.id}/images?api_key=${API_KEY}&include_image_language=ru,en,null`
        );
        const imagesData = await imagesResponse.json();
        
        let textlessBackdrop = imagesData.backdrops?.find(
          backdrop => backdrop.iso_639_1 === 'ru' && 
          backdrop.width === 3840 && 
          backdrop.height === 2160
        );
        
        if (!textlessBackdrop) {
          textlessBackdrop = imagesData.backdrops?.find(
            backdrop => backdrop.iso_639_1 === 'en' && 
            backdrop.width === 3840 && 
            backdrop.height === 2160
          );
        }
        
        if (!textlessBackdrop) {
          textlessBackdrop = imagesData.backdrops?.find(
            backdrop => backdrop.iso_639_1 === 'ru'
          );
        }
        
        if (!textlessBackdrop) {
          textlessBackdrop = imagesData.backdrops?.find(
            backdrop => backdrop.iso_639_1 === 'en'
          );
        }
        
        if (!textlessBackdrop && imagesData.backdrops?.length > 0) {
          textlessBackdrop = imagesData.backdrops[0];
        }
        
        return {
          ...series,
          backdrop_with_text: textlessBackdrop?.file_path || series.poster_path
        };
      })
    );

    series.value = seriesWithBackdrops;
    totalPages.value = data.total_pages;
  } catch (error) {
    console.error('Error:', error);
  } finally {
    loading.value = false;
  }
};

const showSeriesDetails = (series) => {
  router.push(`/series/${series.id}`);
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('ru-RU');
};

const changePage = (page) => {
  if (selectedGenre.value) {
    fetchSeries(selectedGenre.value, page);
  } else if (searchQuery.value) {
    currentPage.value = page;
    searchSeries();
  } else {
    fetchSeries('', page);
  }
};

onMounted(() => {
  favoritesStore.loadFavorites();
  fetchGenres();
  fetchSeries();
});

const toggleFavorite = (event, series) => {
  event.stopPropagation();
  favoritesStore.toggleSeries(series);
};
</script>

<template>
  <div class="series">
    <div class="filters">
      <div class="search-container">
        <div class="search-wrapper">
          <input type="text" v-model="searchQuery" @keyup.enter="searchSeries" placeholder="Поиск сериалов...">
          <button @click="searchSeries">
            <Icon icon="mdi:magnify" width="24" />
          </button>
        </div>
      </div>

      <div class="genres">
        <button class="genre-button" @click="fetchSeries('', 1)" :class="{ active: !selectedGenre }">
          Все
        </button>
        <button class="genre-button" v-for="genre in genres" :key="genre.id" @click="fetchSeries(genre.id, 1)"
          :class="{ active: selectedGenre === genre.id }">
          {{ genre.name }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="loader"></div>
    </div>

    <div v-else class="series-grid">
      <div v-for="show in series" :key="show.id" class="series-card" @click="showSeriesDetails(show)">
        <img :src="`https://imagetmdb.com/t/p/w500${show.poster_path}`" :alt="show.name"
          @error="$event.target.src = '/placeholder-poster.jpg'">
        <button 
          class="favorite-button" 
          :class="{ active: favoritesStore.isSeriesFavorite(show.id) }"
          @click="(e) => toggleFavorite(e, show)"
          :title="favoritesStore.isSeriesFavorite(show.id) ? 'Удалить из избранного' : 'Добавить в избранное'"
        >
          <Icon 
            :icon="favoritesStore.isSeriesFavorite(show.id) ? 'mdi:heart' : 'mdi:heart-outline'" 
            width="24" 
          />
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

    <div class="pagination" v-show="totalPages > 1">
      <button :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
        Предыдущая
      </button>
      <div class="page-info">
        <span class="page-label">Страница</span>
        <span class="page-numbers">{{ currentPage }}</span>
      </div>
      <button :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
        Следующая
      </button>
    </div>
  </div>
</template>

<style scoped>
.series {
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

.series-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: calc(var(--mobile-bottom-offset) + 2rem);
}

.series-card {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  border: 3px solid transparent;
  transition: border-color 0.2s ease;
}

.series-card:hover {
  border-color: rgba(255, 255, 255, 0.3);
}

.series-card img {
  width: 100%;
  aspect-ratio: 2/3;
  object-fit: cover;
  display: block;
}

.series-card:hover img {
  filter: brightness(0.7);
}

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

.series-title {
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 1rem;
  margin: 0;
  color: white;
  font-size: 0.9rem;
  text-align: center;
  width: 100%;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
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

@media (max-width: 768px) {
  .series-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }

  .series-title {
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
    max-width: 100px;
  }
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
  margin-bottom: -0.25rem;
}

.page-numbers {
  color: white;
  font-size: 1.2rem;
  font-weight: 500;
}
</style>