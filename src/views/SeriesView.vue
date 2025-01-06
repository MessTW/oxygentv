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
      show.overview.trim() !== '' &&
      !show.name.includes('[') &&
      !show.name.includes(']') &&
      show.backdrop_path
    );

    const seriesWithLogos = await Promise.all(
      filteredResults.map(async (series) => {
        const detailsResponse = await fetch(
          `${BASE_URL}/tv/${series.id}/images?api_key=${API_KEY}&include_image_language=ru,en,null`
        );
        const details = await detailsResponse.json();
        const russianLogo = details.logos?.find(logo => logo.iso_639_1 === 'ru');
        const defaultLogo = details.logos?.[0];
        return {
          ...series,
          logoPath: (russianLogo || defaultLogo)?.file_path || null
        };
      })
    );
    series.value = seriesWithLogos;
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
      show.name && 
      show.name.trim() !== '' && 
      show.overview && 
      show.overview.trim() !== '' &&
      !show.name.includes('[') &&
      !show.name.includes(']') &&
      show.backdrop_path
    );

    const seriesWithLogos = await Promise.all(
      filteredResults.map(async (series) => {
        const detailsResponse = await fetch(
          `${BASE_URL}/tv/${series.id}/images?api_key=${API_KEY}&include_image_language=ru,en,null`
        );
        const details = await detailsResponse.json();
        const russianLogo = details.logos?.find(logo => logo.iso_639_1 === 'ru');
        const defaultLogo = details.logos?.[0];
        return {
          ...series,
          logoPath: (russianLogo || defaultLogo)?.file_path || null
        };
      })
    );
    series.value = seriesWithLogos;
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
        <input type="text" v-model="searchQuery" @keyup.enter="searchSeries" placeholder="Поиск сериалов...">
        <button @click="searchSeries">Поиск</button>
      </div>

      <div class="genres">
        <button @click="fetchSeries('', 1)" :class="{ active: !selectedGenre }">
          Все
        </button>
        <button v-for="genre in genres" :key="genre.id" @click="fetchSeries(genre.id, 1)"
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
        <img :src="`https://imagetmdb.com/t/p/w500${show.backdrop_path}`" :alt="show.name"
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

    <div class="pagination" v-if="totalPages > 1">
      <button :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
        Предыдущая
      </button>
      <span>Страница {{ currentPage }} из {{ totalPages }}</span>
      <button :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
        Следующая
      </button>
    </div>
  </div>
</template>

<style scoped>
.series {
  padding: 1rem;
}

.filters {
  margin-bottom: 2rem;
}

.search-container {
  margin-bottom: 1rem;
  display: flex;
  gap: 0.5rem;
}

.search-container input {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.genres {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.genres button {
  padding: 0.5rem 1rem;
  background-color: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.genres button.active {
  background-color: #e50914;
}

.series-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.series-card {
  position: relative;
  cursor: pointer;
  transition: transform 0.2s;
  border-radius: 8px;
  overflow: hidden;
}

.series-card:hover {
  transform: scale(1.05);
}

.series-card img {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  display: block;
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
}

.meta-info {
  background: linear-gradient(rgba(0, 0, 0, 0.8), transparent);
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.rating, .year {
  color: white;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 1rem;
  align-items: center;
  margin-top: 2rem;
}

.pagination button {
  padding: 0.5rem 1rem;
  background-color: #e50914;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
}

.pagination button:disabled {
  background-color: #666;
  cursor: not-allowed;
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
  transition: opacity 0.3s ease, transform 0.2s ease;
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
</style>