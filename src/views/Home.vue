<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const API_KEY = 'd341436234a2bb8f0adc73114e093ab2'
const BASE_URL = 'https://apitmdb.cub.red/3'

const trendingMovies = ref([])
const trendingSeries = ref([])
const featuredContent = ref(null)

const router = useRouter()

const fetchTrending = async () => {
  try {
    const moviesResponse = await fetch(
      `${BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=ru-RU`,
    )
    const moviesData = await moviesResponse.json()
    const filteredMovies = moviesData.results.filter(movie => 
      movie.title && 
      movie.title.trim() !== '' && 
      movie.overview && 
      movie.overview.trim() !== '' &&
      !movie.title.includes('[') &&
      !movie.title.includes(']') &&
      movie.backdrop_path
    );

    const moviesWithLogos = await Promise.all(
      filteredMovies.map(async (movie) => {
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
    trendingMovies.value = moviesWithLogos;

    const seriesResponse = await fetch(
      `${BASE_URL}/trending/tv/week?api_key=${API_KEY}&language=ru-RU`,
    )
    const seriesData = await seriesResponse.json()
    const filteredSeries = seriesData.results.filter(show => 
      show.name && 
      show.name.trim() !== '' && 
      show.overview && 
      show.overview.trim() !== '' &&
      !show.name.includes('[') &&
      !show.name.includes(']') &&
      show.backdrop_path
    );

    const seriesWithLogos = await Promise.all(
      filteredSeries.map(async (series) => {
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
    trendingSeries.value = seriesWithLogos;

    featuredContent.value = moviesData.results.find(movie => 
      movie.title && movie.title.trim() !== '' && 
      movie.overview && movie.overview.trim() !== ''
    )
  } catch (error) {
    console.error('Error:', error)
  }
}

const handleFeaturedClick = () => {
  if (featuredContent.value) {
    router.push(`/movie/${featuredContent.value.id}`)
  }
}

const navigateToMovie = (movie) => {
  router.push(`/movie/${movie.id}`)
}

const navigateToSeries = (series) => {
  router.push(`/series/${series.id}`)
}

onMounted(() => {
  fetchTrending()
})
</script>

<template>
  <div class="home">
    <section v-if="featuredContent" class="hero">
      <div class="featured-content">
        <div class="poster-buttons">
          <button class="watch-button" @click="handleFeaturedClick">
            <Icon icon="material-symbols:play-arrow" />
            <span>Смотреть</span>
          </button>
        </div>
        <div class="header-ratings">
          <div class="rating-item">
            <Icon icon="lineicons:imdb" class="rating-icon" />
            <span class="rating-value">{{ featuredContent.vote_average.toFixed(1) }}</span>
          </div>
          <span class="year">{{ new Date(featuredContent.release_date).getFullYear() }}</span>
          <span v-for="genre in featuredContent.genres" :key="genre.id" class="genre">
            {{ genre.name }}
          </span>
        </div>
        <div class="featured-info">
          <h2>{{ featuredContent.title }}</h2>
          <p>{{ featuredContent.overview }}</p>
        </div>
        <div class="featured-backdrop" :style="{
          backgroundImage: `url(https://imagetmdb.com/t/p/original${featuredContent.backdrop_path})`,
        }"></div>
      </div>
    </section>

    <section class="content-section">
      <h2>Фильмы в тренде</h2>
      <div class="content-grid">
        <div v-for="movie in trendingMovies" :key="movie.id" class="content-card" @click="navigateToMovie(movie)">
          <img :src="`https://imagetmdb.com/t/p/w500${movie.backdrop_path}`" :alt="movie.title" />
          <div class="content-overlay">
            <div class="meta-info">
              <span class="year">{{ movie.release_date?.split('-')[0] }}</span>
              <span class="rating">★ {{ movie.vote_average.toFixed(1) }}</span>
            </div>
            <h3 class="content-title">{{ movie.title }}</h3>
          </div>
        </div>
      </div>
    </section>

    <section class="content-section">
      <h2>Сериалы в тренде</h2>
      <div class="content-grid">
        <div v-for="series in trendingSeries" :key="series.id" class="content-card" @click="navigateToSeries(series)">
          <img :src="`https://imagetmdb.com/t/p/w500${series.backdrop_path}`" :alt="series.name" />
          <div class="content-overlay">
            <div class="meta-info">
              <span class="year">{{ series.first_air_date?.split('-')[0] }}</span>
              <span class="rating">★ {{ series.vote_average.toFixed(1) }}</span>
            </div>
            <h3 class="content-title">{{ series.name }}</h3>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  height: 80vh;
  position: relative;
  overflow: hidden;
}

.featured-content {
  position: relative;
  height: 100%;
}

.featured-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 4rem;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.9));
  z-index: 2;
}

.featured-info h2 {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.featured-info p {
  max-width: 600px;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.featured-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  filter: brightness(0.5);
}

.featured-button {
  padding: 0.8rem 2rem;
  font-size: 1.1rem;
  background-color: #e50914;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.featured-button:hover {
  background-color: #f40612;
}

.content-section {
  padding: 2rem;
}

.content-section h2 {
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.content-card {
  position: relative;
  cursor: pointer;
  transition: transform 0.2s;
  border-radius: 8px;
  overflow: hidden;
}

.content-card:hover {
  transform: scale(1.05);
}

.content-card img {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  display: block;
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

@media (max-width: 768px) {
  .featured-info {
    padding: 2rem;
  }

  .featured-info h2 {
    font-size: 2rem;
  }
}

.home {
  padding: 0;
}

.content-title {
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.9));
  padding: 1rem;
  margin: 0;
  color: white;
  font-size: 0.9rem;
}

.content-card:hover {
  transform: scale(1.05);
}

.poster-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  position: relative;
  z-index: 2;
}

.watch-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background-color: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.header-ratings {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  z-index: 2;
  position: relative;
}

.rating-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rating-value {
  font-size: 1.2rem;
  font-weight: 600;
}

.rating-icon {
  font-size: 24px;
  color: #f5c518;
}

.year, .genre {
  color: #999;
  font-size: 1rem;
}

.genre {
  padding: 0.2rem 0.5rem;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}
</style>