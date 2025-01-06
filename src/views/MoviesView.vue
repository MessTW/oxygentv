<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useFavoritesStore } from '../stores/favorites';
import { Icon } from '@iconify/vue';

const API_KEY = 'd341436234a2bb8f0adc73114e093ab2';
const BASE_URL = 'https://apitmdb.cub.red/3';

const router = useRouter();
const favoritesStore = useFavoritesStore();

const movies = ref([]);
const genres = ref([]);
const selectedGenre = ref(null);
const searchQuery = ref('');
const currentPage = ref(1);
const totalPages = ref(1);
const loading = ref(false);

const fetchGenres = async () => {
  try {
    const response = await fetch(
      `${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=ru-RU`
    );
    const data = await response.json();
    genres.value = data.genres;
  } catch (error) {
    console.error('Erro ao buscar gêneros:', error);
  }
};

const fetchMovies = async (genreId = '', page = 1) => {
  loading.value = true;
  try {
    const url = genreId
      ? `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&language=ru-RU&page=${page}`
      : `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=ru-RU&page=${page}`;

    const response = await fetch(url);
    const data = await response.json();
    const filteredResults = data.results.filter(movie => 
      movie.title && 
      movie.title.trim() !== '' && 
      movie.overview && 
      movie.overview.trim() !== '' &&
      !movie.title.includes('[') &&
      !movie.title.includes(']') &&
      movie.backdrop_path
    );

    const moviesWithLogos = await Promise.all(
      filteredResults.map(async (movie) => {
        const detailsResponse = await fetch(
          `${BASE_URL}/movie/${movie.id}/images?api_key=${API_KEY}&include_image_language=ru,en,null`
        );
        const details = await detailsResponse.json();
        const russianLogo = details.logos?.find(logo => logo.iso_639_1 === 'ru');
        const defaultLogo = details.logos?.[0];
        return {
          ...movie,
          logoPath: (russianLogo || defaultLogo)?.file_path || null
        };
      })
    );
    movies.value = moviesWithLogos;
    
    totalPages.value = data.total_pages;
    currentPage.value = page;
    selectedGenre.value = genreId;
  } catch (error) {
    console.error('Erro ao buscar filmes:', error);
  } finally {
    loading.value = false;
  }
};

const searchMovies = async () => {
  if (!searchQuery.value) {
    fetchMovies('', 1);
    return;
  }

  loading.value = true;
  try {
    const response = await fetch(
      `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${searchQuery.value}&language=ru-RU&page=${currentPage.value}`
    );
    const data = await response.json();
    const filteredResults = data.results.filter(movie => 
      movie.title && movie.title.trim() !== '' && 
      movie.overview && movie.overview.trim() !== ''
    );

    const moviesWithLogos = await Promise.all(
      filteredResults.map(async (movie) => {
        const detailsResponse = await fetch(
          `${BASE_URL}/movie/${movie.id}/images?api_key=${API_KEY}&include_image_language=ru,en,null`
        );
        const details = await detailsResponse.json();
        const russianLogo = details.logos?.find(logo => logo.iso_639_1 === 'ru');
        const defaultLogo = details.logos?.[0];
        return {
          ...movie,
          logoPath: (russianLogo || defaultLogo)?.file_path || null
        };
      })
    );
    movies.value = moviesWithLogos;
    totalPages.value = data.total_pages;
  } catch (error) {
    console.error('Error:', error);
  } finally {
    loading.value = false;
  }
};

const showMovieDetails = (movie) => {
  router.push(`/movie/${movie.id}`);
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('ru-RU');
};

const changePage = (page) => {
  if (selectedGenre.value) {
    fetchMovies(selectedGenre.value, page);
  } else if (searchQuery.value) {
    currentPage.value = page;
    searchMovies();
  } else {
    fetchMovies('', page);
  }
};

onMounted(() => {
  favoritesStore.loadFavorites();
  fetchGenres();
  fetchMovies();
});

const toggleFavorite = (event, movie) => {
  event.stopPropagation();
  favoritesStore.toggleMovie(movie);
};
</script>

<template>
  <div class="movies">
    <div class="filters">
      <div class="search-container">
        <input type="text" v-model="searchQuery" @keyup.enter="searchMovies" placeholder="Поиск фильмов...">
        <button @click="searchMovies">Поиск</button>
      </div>

      <div class="genres">
        <button @click="fetchMovies('', 1)" :class="{ active: !selectedGenre }">
          Todos
        </button>
        <button v-for="genre in genres" :key="genre.id" @click="fetchMovies(genre.id, 1)"
          :class="{ active: selectedGenre === genre.id }">
          {{ genre.name }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="loader"></div>
    </div>

    <div v-else class="movies-grid">
      <div v-for="movie in movies" :key="movie.id" class="movie-card" @click="showMovieDetails(movie)">
        <img :src="`https://imagetmdb.com/t/p/w500${movie.backdrop_path}`" :alt="movie.title"
          @error="$event.target.src = '/placeholder-poster.jpg'">
        <button 
          class="favorite-button" 
          :class="{ active: favoritesStore.isMovieFavorite(movie.id) }"
          @click="(e) => toggleFavorite(e, movie)"
          :title="favoritesStore.isMovieFavorite(movie.id) ? 'Удалить из избранного' : 'Добавить в избранное'"
        >
          <Icon 
            :icon="favoritesStore.isMovieFavorite(movie.id) ? 'mdi:heart' : 'mdi:heart-outline'" 
            width="24" 
          />
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
.movies {
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

.movies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.movie-card {
  position: relative;
  cursor: pointer;
  transition: transform 0.2s;
  border-radius: 8px;
  overflow: hidden;
}

.movie-card:hover {
  transform: scale(1.05);
}

.movie-card img {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  display: block;
}

.movie-overlay {
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

.movie-title {
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.9));
  padding: 1rem;
  margin: 0;
  color: white;
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