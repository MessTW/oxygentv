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

  // Добавляем класс для анимации
  const homeElement = document.querySelector('.home');
  if (homeElement) {
    homeElement.classList.add('transitioning');
  }

  setTimeout(() => {
    currentFeaturedIndex.value = index;
    // Обновляем фоновое изображение
    if (homeElement) {
      const bgImage = getBackgroundImage();
      homeElement.style.setProperty('--featured-bg', bgImage);
      setTimeout(() => {
        homeElement.classList.remove('transitioning');
      }, 300);
    }
  }, 300);

  startProgress();
  startAutoplay();
}

const handleScroll = () => {
  // Проверяем, что мы на десктопе
  if (window.innerWidth <= 768) return;

  const scrolled = window.scrollY;
  const vh = window.innerHeight;
  const darkness = Math.min(scrolled / vh, 1);

  const homeElement = document.querySelector('.home');
  if (homeElement) {
    homeElement.style.setProperty('--scroll-darkness', darkness);
  }
};

const getBackgroundImage = () => {
  const movie = featuredMovies.value[currentFeaturedIndex.value];
  if (!movie) return '';

  const isMobile = window.innerWidth <= 768;
  const path = isMobile ? movie.poster_path : movie.backdrop_path;
  const imageUrl = `url(https://imagetmdb.com/t/p/original${path})`;

  // Обновляем фон страницы только для десктопа
  if (!isMobile) {
    const homeElement = document.querySelector('.home');
    if (homeElement) {
      homeElement.style.setProperty('--featured-bg', imageUrl);
    }
  }

  return imageUrl;
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
  window.addEventListener('scroll', handleScroll)

  // Устанавливаем фоновое изображение
  const homeElement = document.querySelector('.home');
  if (homeElement && featuredMovies.value[currentFeaturedIndex.value]) {
    const bgImage = getBackgroundImage();
    homeElement.style.setProperty('--featured-bg', bgImage);
  }
})

onUnmounted(() => {
  stopAutoplay()
  resetProgress()
  window.removeEventListener('resize', updateBackgroundImage)
  window.removeEventListener('scroll', handleScroll)
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
      <div class="content-section-inner">
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
      </div>
    </section>

    <section class="content-section">
      <div class="content-section-inner">
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
      </div>
    </section>
  </div>
</template>

<style scoped>


/* Добавляем стили для фонового изображения только для десктопа */
@media (min-width: 769px) {
  .home {
    position: relative;
    min-height: 100vh;
    --featured-bg: none;
    --scroll-darkness: 0;
  }

  .home::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background-size: cover;
    background-position: center;
    z-index: 1;
    transition: opacity 0.3s ease, filter 0.3s ease;
    background-image: var(--featured-bg);
    filter: brightness(calc(0.5 - var(--scroll-darkness) * 0.5));
  }

  .hero {
    position: relative;
    width: 100vw;
    height: 90vh;
    z-index: 1;
  }

  /* Контент */
  .content-section {
    position: relative;
    z-index: 2;
    margin-top: -15vh; /* Поднимаем контент выше */
    background: linear-gradient(transparent 0%, var(--surface) 15%);
    padding-top: 10vh;
  }

  .content-section:not(:first-of-type) {
    margin-top: 0;
    background: var(--surface);
  }

  /* Featured информация и слайдер всегда поверх */
  .featured-info,
  .slider-dots {
    position: fixed;
    z-index: 3;
  }

  /* Скрываем featured-backdrop на десктопе */
  .featured-backdrop {
    display: none;
  }
}

/* Возвращаем стандартные стили для мобильных устройств */
@media (max-width: 768px) {
  .hero {
    height: min(100vh, 645px);
  }

  .content-section {
    background: var(--surface);
  }
}

/* Hero секция */
.hero {
  position: relative;
  margin-left: calc(-1 * var(--side-menu-width));
  height: 100vh; /* Изменяем на полную высоту */
  overflow: hidden;
}

.featured-content {
  height: 100%;
  padding: 0 var(--spacing-large);
  padding-left: calc(var(--side-menu-width) + var(--spacing-large));
}

.featured-backdrop {
  filter: brightness(50%);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  z-index: 1;
}

/* Featured информация */
.featured-info {
  position: absolute;
  bottom: var(--spacing-featured-info-bottom);
  left: calc(var(--side-menu-width) + var(--spacing-featured-info-side));
  width: min(600px, calc(100% - var(--side-menu-width) - var(--spacing-featured-info-side) * 2));
  z-index: 101;
}

.featured-info h2 {
  font-size: var(--font-size-h1);
  line-height: 1.2;
  margin-bottom: var(--spacing-base);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.featured-overview {
  font-size: var(--font-size-body);
  line-height: 1.6;
  margin: var(--spacing-base) 0;
  height: 4.8em; /* Точно 3 строки */
  -webkit-line-clamp: 3;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Кнопки */
.video-button {
  cursor: pointer;
  transition: all 0.2s ease;
  height: var(--button-height);
  padding: 0 var(--spacing-large);
  font-size: var(--font-size-body);
  min-width: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: var(--button-bg);
  border: none;
  border-radius: 8px;
  color: white;
  position: relative;
  z-index: 101;
}

.video-button:hover {
  background-color: var(--button-hover);
}

/* Сетка контента */
.content-section {
  padding: var(--spacing-large) 0;
  width: 100vw;
  margin-left: calc(-1 * var(--side-menu-width));
  position: relative;
  z-index: 1;
}

.content-section-inner {
  padding: 0 var(--spacing-large);
  padding-left: calc(var(--side-menu-width) + var(--spacing-large));
}

.content-section h2 {
  font-size: var(--font-size-h2);
  margin-bottom: var(--spacing-large);
}

.content-grid {
  display: grid;
  gap: var(--spacing-base);
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  width: 100%;
}

/* Карточки */
.content-card {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid transparent;
  transition: border-color 0.2s ease;
  width: 100%;
  aspect-ratio: 2/3;
}

.content-card:hover {
  border-color: rgba(255, 255, 255, 0.3);
}

.content-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: filter 0.2s ease;
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
  padding: var(--spacing-base);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: clamp(14px, 1vw, 16px);
}

.content-title {
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: var(--spacing-base);
  margin: 0;
  color: white;
  font-size: clamp(16px, 1.2vw, 18px);
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.rating, .year {
  color: white;
  font-size: clamp(14px, 1vw, 16px);
}

/* Медиа-запросы для адаптации размеров текста */
@media (max-width: 1200px) {
  .content-title {
    font-size: clamp(15px, 1.1vw, 17px);
    padding: calc(var(--spacing-base) * 0.75);
  }

  .meta-info, .rating, .year {
    font-size: clamp(13px, 0.9vw, 15px);
    padding: calc(var(--spacing-base) * 0.75);
  }
}

@media (max-width: 768px) {
  .content-title {
    font-size: clamp(14px, 3.5vw, 16px);
    padding: calc(var(--spacing-base) * 0.5);
  }

  .meta-info, .rating, .year {
    font-size: clamp(12px, 3vw, 14px);
    padding: calc(var(--spacing-base) * 0.5);
  }
}

/* Адаптивность */
@media (max-width: 768px) {
  .hero {
    width: 100%;
    margin-left: 0;
    height: min(100vh, 645px);
    overflow: hidden;
  }

  .featured-backdrop {
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    transform: none;
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    background-color: var(--surface);
  }

  .featured-content {
    padding: 0 var(--spacing-base);
  }

  .featured-info {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: calc(100% - var(--spacing-base) * 2);
    text-align: center;
    bottom: var(--spacing-featured-info-mobile);
  }

  .featured-meta {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .meta-details {
    justify-content: center;
  }

  .featured-overview {
    display: none;
  }

  .actions {
    display: flex;
    justify-content: center;
    margin-top: 1rem;
  }

  .video-button {
    min-width: 180px;
  }

  .slider-dots {
    left: 0;
    width: 100%;
  }

  .content-section {
    width: 100vw;
    margin-left: 0;
    padding: var(--spacing-base);
  }

  .content-section-inner {
    padding: 0;
  }

  .content-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .content-section h2 {
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .content-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }
}

@media (min-width: 1025px) and (max-width: 1440px) {
  .content-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem;
  }
}

@media (min-width: 1441px) {
  .content-grid {
    grid-template-columns: repeat(5, 1fr);
    gap: 2rem;
  }
}

/* Слайдер */
.slider-dots {
  position: absolute;
  bottom: var(--spacing-base);
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: var(--spacing-base);
  z-index: 101;
}

.dot {
  width: 24px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border: none;
  border-radius: 2px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: background-color 0.3s ease;
}

.dot.active {
  background: rgba(255, 255, 255, 0.5);
}

.progress-bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  background: white;
  transform-origin: left;
  transition: transform 0.1s linear;
}

/* Анимации для featured контента */
.featured-backdrop {
  transition: opacity 0.3s ease;
}

.featured-backdrop.transitioning {
  opacity: 0;
}

.featured-info {
  transition: opacity 0.3s ease;
}

.featured-backdrop.transitioning + .featured-info {
  opacity: 0;
}

.home.transitioning .featured-info {
  opacity: 0;
}

/* Hero секция */
@media (min-width: 769px) {
  .hero {
    position: relative; /* Фиксируем секцию */
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 1;
  }

  /* Добавляем отступ для контента, чтобы он начинался после hero секции */
  .content-section:first-of-type {
    margin-top: 100vh;
  }

  .featured-info {
    position: fixed;
    bottom: var(--spacing-featured-info-bottom);
    left: calc(var(--side-menu-width) + var(--spacing-featured-info-side));
    width: min(600px, calc(100% - var(--side-menu-width) - var(--spacing-featured-info-side) * 2));
    z-index: 2;
    opacity: calc(1 - (var(--scroll-darkness) * 5));
  }

  .slider-dots {
    position: fixed; /* Фиксируем точки слайдера */
    bottom: var(--spacing-base);
    left: 0;
    width: 100%;
    z-index: 2;
    opacity: calc(1 - var(--scroll-darkness));
  }

  /* Контент поверх фона */
  .content-section {
    position: relative;
    z-index: 3;
  }
}
</style>
