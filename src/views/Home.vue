<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'

const API_KEY = 'd341436234a2bb8f0adc73114e093ab2'
const BASE_URL = 'https://apitmdb.cub.red/3'

const trendingMovies = ref([])
const trendingSeries = ref([])
const featuredMovies = ref([])
const genres = ref([])
const currentFeaturedIndex = ref(0)
const autoplayInterval = ref(null)
const progressInterval = ref(null)
const progress = ref(0)

const router = useRouter()

const getYear = (movie) => {
  return movie.release_date?.split('-')[0] || ''
}

const getGenre = (movie) => {
  if (!movie.genre_ids || !movie.genre_ids[0]) return ''
  const genre = genres.value.find(g => g.id === movie.genre_ids[0])
  return genre ? genre.name : ''
}

const fetchGenres = async () => {
  try {
    const response = await fetch(
      `${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=ru-RU`
    )
    const data = await response.json()
    genres.value = data.genres
  } catch (error) {
    console.error('Error fetching genres:', error)
  }
}

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
      movie.overview.trim() !== ''
    );

    trendingMovies.value = filteredMovies;
    featuredMovies.value = filteredMovies.slice(0, 5);

    const seriesResponse = await fetch(
      `${BASE_URL}/trending/tv/week?api_key=${API_KEY}&language=ru-RU`,
    )
    const seriesData = await seriesResponse.json()
    const filteredSeries = seriesData.results.filter(show =>
      show.name &&
      show.name.trim() !== '' &&
      show.overview &&
      show.overview.trim() !== ''
    );

    trendingSeries.value = filteredSeries;
  } catch (error) {
    console.error('Error:', error)
  }
}

const resetProgress = () => {
  progress.value = 0;
  if (progressInterval.value) {
    clearInterval(progressInterval.value);
  }
}

const startProgress = () => {
  resetProgress();
  progress.value = 0;
  progressInterval.value = setInterval(() => {
    progress.value += (100 / 80); // 100% за 8 секунд (80 * 100ms)
  }, 100);
}

const startAutoplay = () => {
  resetProgress();
  startProgress();
  autoplayInterval.value = setInterval(() => {
    const backdrop = document.querySelector('.featured-backdrop');
    backdrop.classList.add('transitioning');

    setTimeout(() => {
      currentFeaturedIndex.value = (currentFeaturedIndex.value + 1) % featuredMovies.value.length;
      setTimeout(() => {
        backdrop.classList.remove('transitioning');
      }, 300);
    }, 300);

    resetProgress();
    startProgress();
  }, 8000);
}

const stopAutoplay = () => {
  if (autoplayInterval.value) {
    clearInterval(autoplayInterval.value);
    clearInterval(progressInterval.value);
  }
}

const handleFeaturedClick = () => {
  if (featuredMovies.value[currentFeaturedIndex.value]) {
    router.push(`/movie/${featuredMovies.value[currentFeaturedIndex.value].id}`)
  }
}

const navigateToMovie = (movie) => {
  router.push(`/movie/${movie.id}`)
}

const navigateToSeries = (series) => {
  router.push(`/series/${series.id}`)
}

const switchToSlide = (index) => {
  if (autoplayInterval.value) {
    clearInterval(autoplayInterval.value);
  }
  resetProgress();

  const backdrop = document.querySelector('.featured-backdrop');
  backdrop.classList.add('transitioning');

  setTimeout(() => {
    currentFeaturedIndex.value = index;
    setTimeout(() => {
      backdrop.classList.remove('transitioning');
    }, 300);
  }, 300);

  startProgress();
  startAutoplay();
}

const showNextSlide = () => {
  currentFeaturedIndex.value = (currentFeaturedIndex.value + 1) % featuredMovies.value.length;
}

const showPrevSlide = () => {
  currentFeaturedIndex.value = currentFeaturedIndex.value === 0
    ? featuredMovies.value.length - 1
    : currentFeaturedIndex.value - 1;
}

const getBackgroundImage = () => {
  const movie = featuredMovies.value[currentFeaturedIndex.value];
  if (!movie) return '';

  // Проверяем ширину экрана
  const isMobile = window.innerWidth <= 768;
  const path = isMobile ? movie.poster_path : movie.backdrop_path;
  return `url(https://imagetmdb.com/t/p/original${path})`;
};

const updateBackgroundImage = () => {
  const backdrop = document.querySelector('.featured-backdrop');
  if (backdrop) {
    backdrop.style.backgroundImage = getBackgroundImage();
  }
};

onMounted(() => {
  fetchTrending()
  fetchGenres()
  startAutoplay()
  window.addEventListener('resize', updateBackgroundImage)
})

onUnmounted(() => {
  stopAutoplay()
  resetProgress()
  window.removeEventListener('resize', updateBackgroundImage)
})
</script>

<template>
  <div class="home">
    <section v-if="featuredMovies.length" class="hero">
      <div class="featured-content">
        <div class="featured-backdrop" :style="{
          backgroundImage: getBackgroundImage(),
        }"></div>
        <div class="featured-info">
          <div class="featured-meta">
            <h2>{{ featuredMovies[currentFeaturedIndex].title }}</h2>
            <div class="meta-details">
              <span class="year">{{ getYear(featuredMovies[currentFeaturedIndex]) }}</span>
              <span class="dot-separator">•</span>
              <span class="genre">{{ getGenre(featuredMovies[currentFeaturedIndex]) }}</span>
            </div>
            <p class="featured-overview">{{ featuredMovies[currentFeaturedIndex].overview }}</p>
          </div>
          <div class="actions">
            <button class="video-button" @click="handleFeaturedClick">
              <Icon icon="material-symbols:play-arrow" width="24" />
              <span>Смотреть</span>
            </button>
          </div>
        </div>
        <div class="slider-dots">
          <button
            v-for="(_, index) in featuredMovies"
            :key="index"
            :class="['dot', { active: index === currentFeaturedIndex }]"
            @click="switchToSlide(index)">
            <div
              v-if="index === currentFeaturedIndex"
              class="progress-bar"
              :style="{ transform: `scaleX(${progress / 100})` }"
            ></div>
          </button>
        </div>
      </div>
    </section>

    <section class="content-section">
      <h2>Фильмы в тренде</h2>
      <div class="content-grid">
        <div v-for="movie in trendingMovies" :key="movie.id"
          class="content-card"
          @click="navigateToMovie(movie)">
          <img :src="`https://imagetmdb.com/t/p/w500${movie.poster_path}`" :alt="movie.title" />
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
        <div v-for="series in trendingSeries" :key="series.id"
          class="content-card"
          @click="navigateToSeries(series)">
          <img :src="`https://imagetmdb.com/t/p/w500${series.poster_path}`" :alt="series.name" />
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
  max-width: 1440px;
  margin: 0 auto;
}

.featured-info {
  position: absolute;
  top: 40%;
  left: 0;
  right: 0;
  padding: 0 var(--mobile-padding);
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 50%;
  margin-left: 5%;
}

.featured-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.meta-details {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ffffff;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.dot-separator {
  font-size: 0.5rem;
}

.featured-info h2 {
  font-size: 2.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
  max-width: 100%;
  line-height: 1.2;
  margin-bottom: 0.5rem;
}

.featured-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  transition: opacity 0.3s ease;
  z-index: 1;
  filter: brightness(0.4);
}

.featured-backdrop.transitioning {
  opacity: 0;
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
  padding: var(--mobile-padding);
}

.content-section h2 {
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
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
  border: 3px solid transparent;
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

.rating, .year {
  color: white;
}

@media (max-width: 768px) {
  .hero {
    height: 60vh;
  }

  .content-section {
    padding: 1rem var(--mobile-padding);
  }

  .content-section h2 {
    font-size: 1.2rem;
    margin-bottom: 1rem;
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

  .featured-backdrop {
    background-position: top center;
    background-repeat: no-repeat;
    background-color: #000;
    height: 100%;
  }

  .featured-info {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    padding: 2rem var(--mobile-padding);
    max-width: 100%;
    transform: translateY(-5%);
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .featured-meta {
    width: 100%;
    align-items: center;
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    max-width: 100%;
  }

  .featured-info h2 {
    font-size: 1.25rem;
    text-align: center;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    width: 100%;
    white-space: normal;
    padding: 0 1rem;
    margin-bottom: 0.25rem;
  }

  .meta-details {
    font-size: 0.8rem;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
    justify-content: center;
    width: 100%;
    display: flex;
  }

  .actions {
    position: static;
    margin-top: 1.5rem;
  }

  .video-button {
    font-size: 0.9rem;
    padding: 10px 20px;
    min-width: 160px;
    background: rgba(255, 255, 255, 0.1);
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .slider-dots {
    position: fixed;
    bottom: 0;
    background: none;
    z-index: 3;
    padding: 10px 0;
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .dot {
    background: rgba(255, 255, 255, 0.2);
    width: 24px;
    height: 4px;
    margin: 0 4px;
  }

  .dot.active {
    background: rgba(255, 255, 255, 0.4);
  }
}

.home {
  padding: 0;
}

.content-title {
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 1rem;
  margin: 0;
  color: white;
  font-size: 0.9rem;
}

.poster-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  position: relative;
  z-index: 2;
}

.video-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 12px 24px;
  background: var(--button-bg);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 160px;
  position: relative;
  z-index: 3;
}

.video-button:hover {
  background: var(--button-hover);
  transform: translateY(-1px);
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
  color: #ffffff;
  font-size: 1rem;
}

.genre {
  padding: 0.2rem 0.5rem;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.content-card {
  transition: opacity 0.3s ease;
}

.info-footer {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

.meta-details {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.slider-nav {
  position: absolute;
  top: 50%;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  z-index: 3;
  transition: all 0.2s ease;
}

.slider-nav:hover {
  background: rgba(0, 0, 0, 0.8);
}

.slider-nav.prev {
  left: 20px;
}

.slider-nav.next {
  right: 20px;
}

.slider-dots {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 3;
  padding: 20px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.5));
  width: 100%;
  justify-content: center;
}

.dot {
  width: 24px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.3);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  margin-bottom: 10px;
}

.dot.active {
  background: rgba(255, 255, 255, 0.5);
}

.progress-bar {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.1s linear;
}

.featured-info {
  transition: opacity 0.3s ease;
}

.featured-backdrop.transitioning + .featured-info {
  opacity: 0;
}

.actions {
  width: 100%;
  display: flex;
  justify-content: flex-start;
  margin-top: 1rem;
}

.video-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 12px 24px;
  background: var(--button-bg);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 160px;
}

.video-button:hover {
  background: var(--button-hover);
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .featured-info h2 {
    font-size: 1.25rem;
  }

  .meta-details {
    font-size: 0.8rem;
  }

  .video-button {
    font-size: 0.9rem;
    padding: 10px 20px;
    min-width: 140px;
  }
}

.featured-overview {
  max-width: 600px;
  margin-top: 1rem;
  font-size: 1rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  display: none; /* Скрыто по умолчанию для мобильных */
  max-height: 120px; /* Ограничиваем высоту */
  overflow: hidden; /* Скрываем излишки */
  display: -webkit-box;
  -webkit-line-clamp: 4; /* Показываем максимум 4 строки */
  -webkit-box-orient: vertical;
  margin-bottom: 1rem; /* Отступ до кнопки */
}

@media (min-width: 769px) {
  .featured-overview {
    display: -webkit-box;
  }

  .featured-info {
    position: absolute;
    bottom: 20%;
    left: 5%;
    max-width: none;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .featured-meta {
    margin-bottom: 0;
    width: 100%;
    max-width: none;
  }

  .actions {
    margin-top: 0;
  }

  .video-button {
    margin-top: 1rem;
  }

  .featured-info h2 {
    white-space: nowrap;
    overflow: visible;
    line-height: 1.2;
  }
}

@media (max-width: 768px) {
  .hero {
    height: 60vh;
  }

  .featured-backdrop {
    background-position: top center;
    background-size: contain;
    background-repeat: no-repeat;
    background-color: #000;
    height: 100%;
  }

  .featured-info {
    position: absolute;
    top: 75%;
    left: 0;
    right: 0;
    transform: translateY(-50%);
    padding: 2rem var(--mobile-padding);
    max-width: 100%;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .featured-overview {
    display: none; /* Скрываем на мобильных устройствах */
  }

  /* ... остальные мобильные стили ... */
}

</style>
