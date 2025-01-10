<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useLogoStore } from '@/stores/logoStore'
import { useBlockListStore } from '@/stores/blockList'
import FavoriteButton from '@/components/FavoriteButton.vue'

const API_KEY = 'd341436234a2bb8f0adc73114e093ab2'
const BASE_URL = 'https://apitmdb.cub.red/3'

const genres = ref([])
const movieLogos = ref({})
const featuredContent = ref([])
const featuredItems = ref([])
const progress = ref(0)
const progressInterval = ref(null)
const autoplayInterval = ref(null)
const currentFeaturedIndex = ref(0)
const isMobile = ref(false)
const movieDetails = ref({})

const router = useRouter()

// Инициализируем store
const logoStore = useLogoStore()
const blockListStore = useBlockListStore()

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

const fetchLogo = async (item) => {
  const logo = await logoStore.fetchLogo(item.id, BASE_URL, API_KEY, item.mediaType)
  if (logo) {
    movieLogos.value[item.id] = logo
  }
}

const getAgeRating = (movie) => {
  if (movie.release_dates?.results) {
    const ruRating = movie.release_dates.results.find(r => r.iso_3166_1 === 'RU')?.release_dates[0]?.certification
    const usRating = movie.release_dates.results.find(r => r.iso_3166_1 === 'US')?.release_dates[0]?.certification

    if (ruRating) return ruRating

    if (usRating) {
      // Кинорейтинги
      switch (usRating) {
        case 'G': return '0+'
        case 'PG': return '6+'
        case 'PG-13': return '13+'
        case 'R': return '17+'
        case 'NC-17': return '18+'
        // ТВ рейтинги
        case 'TV-Y': return '0+'
        case 'TV-Y7': return '7+'
        case 'TV-G': return '0+'
        case 'TV-PG': return '6+'
        case 'TV-14': return '14+'
        case 'TV-MA': return '17+'
        // Дополнительные рейтинги
        case 'NR': // Not Rated
        case 'UR': // Unrated
        default: return 'N/A'
      }
    }
  }

  if (movie.adult) return '18+'
  const rating = movie.vote_average
  if (rating >= 7.5) return '16+'
  if (rating >= 6) return '12+'
  return '6+'
}

// Функция для форматирования жанров
const formatGenres = (genres) => {
  if (!genres?.length) return '';

  // Маппинг для замены жанров
  const genreMapping = {
    'боевик и приключения': 'Приключения',
    'боевик': 'Боевик',
    'приключения': 'Приключения',
    'комедия': 'Комедия',
    'криминал': 'Криминал',
    'документальный': 'Документальный',
    'драма': 'Драма',
    'семейный': 'Семейный',
    'фэнтези': 'Фэнтези',
    'история': 'История',
    'ужасы': 'Ужасы',
    'детектив': 'Детектив',
    'музыка': 'Музыка',
    'мистика': 'Мистика',
    'мелодрама': 'Мелодрама',
    'нф и фэнтези': 'Научная фантастика',
    'телевизионный фильм': 'ТВ фильм',
    'триллер': 'Триллер',
    'военный': 'Военный',
    'вестерн': 'Вестерн',
    'боевик и триллер': 'Триллер',
    'анимация': 'Анимация',
    'детский': 'Детский'
  };

  return genres
    .slice(0, 3) // Берем только первые три жанра
    .map(g => {
      const genreName = g.name.toLowerCase();
      return genreMapping[genreName] || g.name.charAt(0).toUpperCase() + g.name.slice(1);
    })
    .join(' ')
    .replace(/ и /g, ' ');
}

// Добавим функцию для обрезки текста
const truncateText = (text, maxLength = 80) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

const fetchTrending = async () => {
  try {
    const moviesResponse = await fetch(
      `${BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=ru-RU`,
    )
    const moviesData = await moviesResponse.json()
    const filteredMovies = moviesData.results
      .filter(movie =>
        movie.title &&
        movie.title.trim() !== '' &&
        movie.overview &&
        movie.overview.trim() !== '' &&
        !blockListStore.isMovieBlocked(movie.id)
      )
      .map(movie => ({ ...movie, mediaType: 'movie' }));

    const seriesResponse = await fetch(
      `${BASE_URL}/trending/tv/week?api_key=${API_KEY}&language=ru-RU`,
    )
    const seriesData = await seriesResponse.json()
    const filteredSeries = seriesData.results
      .filter(show =>
        show.name &&
        show.name.trim() !== '' &&
        show.overview &&
        show.overview.trim() !== '' &&
        !blockListStore.isSeriesBlocked(show.id)
      )
      .map(show => ({ ...show, mediaType: 'tv', routeType: 'series' }));

    // Объединяем фильмы и сериалы для слайдера (берем первые 5)
    featuredItems.value = [...filteredMovies, ...filteredSeries]
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);

    // Объединяем и перемешиваем все фильмы и сериалы для сетки
    featuredContent.value = [...filteredMovies, ...filteredSeries]
      .sort(() => Math.random() - 0.5);

    // Загружаем логотипы для всех элементов (фильмов и сериалов)
    for (const item of featuredItems.value) {
      await fetchLogo(item)
    }

    for (const item of featuredItems.value) {
      try {
        const detailsResponse = await fetch(
          `${BASE_URL}/${item.mediaType}/${item.id}?api_key=${API_KEY}&language=ru-RU&append_to_response=release_dates`
        )
        const details = await detailsResponse.json()
        // Разная обработка для фильмов и сериалов
        if (item.mediaType === 'tv') {
          const status = details.status === 'Ended' ? 'Завершен' : 'Выходит';

          movieDetails.value[item.id] = {
            tagline: truncateText(details.tagline || item.overview.split('.')[0]),
            rating: getAgeRating(details),
            genres: formatGenres(details.genres) || '',
            status: status
          }
        } else {
          movieDetails.value[item.id] = {
            tagline: truncateText(details.tagline || item.overview.split('.')[0]),
            rating: getAgeRating(details),
            genres: formatGenres(details.genres) || ''
          }
        }
      } catch (error) {
        console.error('Error fetching details:', error)
        movieDetails.value[item.id] = {
          tagline: item.overview.split('.')[0] + '.',
          rating: getAgeRating(item),
          genres: ''
        }
      }
    }
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
    progress.value = Math.min(progress.value + (100 / 80), 100);
  }, 100);
}

const startAutoplay = () => {
  resetProgress();
  startProgress();
  autoplayInterval.value = setInterval(() => {
    const backdrop = document.querySelector('.featured-backdrop');
    const meta = document.querySelector('.featured-meta');

    if (backdrop && meta) {
      // Запускаем анимацию затухания
      backdrop.classList.add('transitioning');
      meta.classList.add('transitioning');

      // Ждем завершения анимации затухания
      setTimeout(() => {
        currentFeaturedIndex.value = (currentFeaturedIndex.value + 1) % featuredItems.value.length;

        // Ждем обновления DOM и запускаем анимацию появления
        nextTick(() => {
          requestAnimationFrame(() => {
            backdrop.classList.remove('transitioning');
            meta.classList.remove('transitioning');
          });
        });
      }, 500); // Время совпадает с длительностью transition в CSS
    }

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
  if (featuredItems.value[currentFeaturedIndex.value]) {
    const item = featuredItems.value[currentFeaturedIndex.value];
    const path = item.mediaType === 'movie' ? 'movie' : item.routeType;
    router.push(`/${path}/${item.id}`);
  }
}

const navigateToContent = (item) => {
  const path = item.mediaType === 'movie' ? 'movie' : item.routeType;
  router.push(`/${path}/${item.id}`);
}

const switchToSlide = (index) => {
  if (autoplayInterval.value) {
    clearInterval(autoplayInterval.value);
  }
  resetProgress();

  const backdrop = document.querySelector('.featured-backdrop');
  const meta = document.querySelector('.featured-meta');

  if (backdrop && meta) {
    // Запускаем анимацию затухания
    backdrop.classList.add('transitioning');
    meta.classList.add('transitioning');

    setTimeout(() => {
      currentFeaturedIndex.value = index;

      // Ждем обновления DOM и запускаем анимацию появления
      nextTick(() => {
        requestAnimationFrame(() => {
          backdrop.classList.remove('transitioning');
          meta.classList.remove('transitioning');
        });
      });
    }, 500);
  }

  startProgress();
  startAutoplay();
}

// Предзагрузка следующего изображения
const preloadNextImage = () => {
  const nextIndex = (currentFeaturedIndex.value + 1) % featuredItems.value.length;
  const nextMovie = featuredItems.value[nextIndex];
  if (nextMovie) {
    const isMobile = window.innerWidth <= 768;
    const path = isMobile ? nextMovie.poster_path : nextMovie.backdrop_path;
    const imageUrl = `https://imagetmdb.com/t/p/original${path}`;
    new Image().src = imageUrl;
  }
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
  const movie = featuredItems.value[currentFeaturedIndex.value];
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

// Функция для обновления состояния isMobile
const updateIsMobile = () => {
  isMobile.value = window?.innerWidth <= 768
}

// Функция для получения стиля прогресс-бара
const getProgressBarStyle = computed(() => {
  return {
    transform: `scaleX(${progress.value / 100})`
  }
})

// Добавляем computed свойство для текущего логотипа
const currentMovieLogo = computed(() => {
  const currentMovie = featuredItems.value[currentFeaturedIndex.value]
  return currentMovie ? logoStore.logos[currentMovie.id] : null
})

// Добавляем предзагрузку следующего логотипа при смене слайда
watch(currentFeaturedIndex, (newIndex) => {
  const nextIndex = (newIndex + 1) % featuredItems.value.length
  const nextItem = featuredItems.value[nextIndex]
  if (nextItem && !logoStore.logos[nextItem.id]) {
    fetchLogo(nextItem)
  }
})

const getCurrentItem = computed(() => {
  return featuredItems.value[currentFeaturedIndex.value]
})

onMounted(() => {
  fetchTrending()
  fetchGenres()
  startAutoplay()
  window.addEventListener('resize', updateBackgroundImage)
  window.addEventListener('scroll', handleScroll)
  updateIsMobile() // Инициализируем значение
  window.addEventListener('resize', updateIsMobile)

  // Устанавливаем фоновое изображение
  const homeElement = document.querySelector('.home');
  if (homeElement && featuredItems.value[currentFeaturedIndex.value]) {
    const bgImage = getBackgroundImage();
    homeElement.style.setProperty('--featured-bg', bgImage);
  }

  preloadNextImage();
})

watch(currentFeaturedIndex, () => {
  preloadNextImage();
})

onUnmounted(() => {
  stopAutoplay()
  resetProgress()
  window.removeEventListener('resize', updateBackgroundImage)
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', updateIsMobile)
})
</script>

<template>
  <div class="home-wrapper">
    <div class="home">
      <!-- Фиксированная hero секция -->
      <div class="fixed-container">
        <section v-if="featuredItems.length" class="hero">
          <div class="featured-content">
            <div class="featured-backdrop" :style="{
              backgroundImage: getBackgroundImage(),
            }"></div>
            <div class="featured-info">
              <div class="featured-meta">
                <div class="logo-container">
                  <img
                    v-if="currentMovieLogo"
                    :src="currentMovieLogo"
                    :alt="getCurrentItem.title || getCurrentItem.name"
                    class="movie-logo desktop-logo"
                  >
                  <h2 class="mobile-logo">{{ getCurrentItem.title || getCurrentItem.name }}</h2>
                </div>
                <div class="movie-meta">
                  <span class="movie-rating">{{ movieDetails[getCurrentItem.id]?.rating }}</span>
                  <span class="movie-rating">{{ getCurrentItem.mediaType === 'movie' ? 'Фильм' : 'Сериал' }}</span>
                  <span v-if="getCurrentItem.mediaType === 'tv'"
                        :class="['movie-rating', movieDetails[getCurrentItem.id]?.status === 'Завершен' ? 'ended' : 'ongoing']">
                    {{ movieDetails[getCurrentItem.id]?.status }}
                  </span>

                  <span class="movie-genres">{{ movieDetails[getCurrentItem.id]?.genres }}</span>
                </div>
                <p class="featured-overview">{{ movieDetails[getCurrentItem.id]?.tagline }}</p>
                <div class="actions">
                  <button class="video-button" @click="handleFeaturedClick">
                    <Icon icon="material-symbols:play-arrow" width="24" />
                    <span>Смотреть</span>
                  </button>
                  <FavoriteButton
                    v-if="getCurrentItem"
                    :item="getCurrentItem"
                    :type="getCurrentItem.mediaType"
                  />
                </div>
              </div>
              <div class="slider-dots">
                <button
                  v-for="(_, index) in featuredItems"
                  :key="index"
                  :class="['dot', { active: index === currentFeaturedIndex }]"
                  @click="switchToSlide(index)">
                  <div
                    v-if="index === currentFeaturedIndex"
                    class="progress-bar"
                    :style="getProgressBarStyle"
                  ></div>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Прокручиваемый контент -->
      <section class="content-section">
        <div class="content-section-inner">
          <h2>В тренде</h2>
          <div class="content-grid">
            <div v-for="item in featuredContent" :key="item.id"
              class="content-card"
              @click="navigateToContent(item)">
              <img :src="`https://imagetmdb.com/t/p/w500${item.poster_path}`" :alt="item.title || item.name" />
              <div class="content-overlay">
                <div class="meta-info">
                  <span class="year">{{ (item.release_date || item.first_air_date)?.split('-')[0] }}</span>
                  <div class="content-type">
                    <span class="type">{{ item.mediaType === 'movie' ? 'Фильм' : 'Сериал' }}</span>
                  </div>
                </div>
                <h3 class="content-title">{{ item.title || item.name }}</h3>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.home-wrapper {
  width: 100%;
  height: 100%;
}

/* Обновляем стили для контейнеров */
.fixed-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 60vh;
  z-index: 1;
}

.content-section {
  position: relative;
  padding: var(--spacing-large) 0;
  width: 100vw;
  margin-left: calc(-1 * var(--side-menu-width));
}

.content-section:first-of-type {
  margin-top: 0; /* Убираем отступ у первой секции */
}

/* Мобильные стили */
@media (max-width: 768px) {
  .fixed-container {
    position: relative;
    height: min(100vh, 645px);
  }

  .scrollable-container {
    transform: none; /* Убираем transform на мобильных */
    box-shadow: none;
  }

  .content-section {
    margin-left: 0;
    width: 100%;
  }
}

/* Обновленные стили для hero */
.hero {
  position: relative;
  height: 100%;
  width: 100vw;
  overflow: hidden;
}

/* Обновленные стили для content-section */
.content-section {
  position: relative;
  padding: var(--spacing-large) 0;
  width: 100vw;
  margin-left: calc(-1 * var(--side-menu-width));
}

/* Обновляем стили для десктопа */
@media (min-width: 769px) {
  .home::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-size: cover;
    background-position: center;
    z-index: 0; /* Фон под всем контентом */
    transition: opacity 0.3s ease, filter 0.3s ease;
    background-image: var(--featured-bg);
    filter: brightness(calc(0.5 - var(--scroll-darkness) * 0.5));
  }

  .featured-info {
    opacity: calc(1 - (var(--scroll-darkness) * 5));
  }
}

/* Базовые стили */
.hero {
  position: fixed;
  top: 0;
  left: 0;
  height: 60vh;
  width: 100vw;
  overflow: hidden;
  z-index: 1;
}

.featured-info {
  padding-top: 12%;
  bottom: 15vh;
  left: 0;
  width: 100%;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.featured-overview {
  font-size: calc(var(--font-size-body) * 1.2);
  line-height: 1.4;
  margin: var(--spacing-base) 0;
  height: auto;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
  font-weight: 600;
  padding: 0;
  display: block;
}

.slider-dots {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: var(--spacing-base);
}

.dot {
  width: 4px;
  height: 24px;
  background: rgba(255, 255, 255, 0.3);
  border: none;
  border-radius: 2px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.progress-bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  background: white;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.1s linear;
}

/* Десктопные стили */
@media (min-width: 769px) {
  .home {
    position: relative;
    --featured-bg: none;
    --scroll-darkness: 0;
  }

  .home::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-size: cover;
    background-position: center;
    z-index: 1;
    transition: opacity 0.3s ease, filter 0.3s ease;
    background-image: var(--featured-bg);
    filter: brightness(calc(0.5 - var(--scroll-darkness) * 0.5));
  }

  .featured-backdrop {
    display: none;
  }

  .featured-info {
    opacity: calc(1 - (var(--scroll-darkness) * 5));
  }
}

/* Адаптивные стили для разных размеров экрана */
@media (min-width: 769px) and (max-width: 1200px) {
  .featured-meta {
    width: 45vw;
    max-width: min(600px, calc(60vw - 100px));
  }
}

@media (min-width: 1201px) and (max-width: 1600px) {
  .featured-meta {
    width: 40vw;
    max-width: min(600px, calc(55vw - 100px));
  }
}

@media (min-width: 1601px) {
  .featured-meta {
    width: 35vw;
    max-width: min(600px, calc(50vw - 100px));
  }
}

/* Мобильные стили */
@media (max-width: 768px) {
  .hero {
    position: relative;
    width: 100%;
    margin-left: 0;
    height: min(100vh, 645px);
  }

  .featured-info {
    position: absolute;
    bottom: var(--spacing-featured-info-mobile);
    padding: 0 var(--spacing-base);
    flex-direction: column;
    align-items: center;
  }

  .featured-meta {
    width: 100%;
    margin-left: 0;
    text-align: center;
  }

  .slider-dots {
    flex-direction: row;
    margin: var(--spacing-base) 0 0 0;
  }


  .progress-bar {
    transform-origin: left;
    transform: scaleX(0);
  }

  .content-section {
    width: 100vw;
    margin-left: 0;
  }

  .content-section:first-of-type {
    margin-top: 0;
  }
}

.featured-content {
  height: 100%;
  padding: 0 var(--spacing-large);
  padding-left: calc(var(--side-menu-width) + var(--spacing-large));
}

.featured-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  filter: brightness(50%);
  z-index: 1;
}



.featured-info h2 {
  font-size: var(--font-size-h1);
  line-height: 1.2;
  margin-bottom: var(--spacing-base);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.featured-overview {
  font-size: calc(var(--font-size-body) * 1.2);
  line-height: 1.4;
  margin: var(--spacing-base) 0;
  height: auto;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
  font-weight: 600;
  padding: 0;
  display: block;
}

@media (max-width: 768px) {
  .featured-overview {
    font-size: calc(var(--font-size-body) * 1.3);
    margin: var(--spacing-base) auto;
    max-width: 100%;
    text-align: center;
    height: auto;
    white-space: normal !important;
    font-weight: 600;
    padding: 0;
    line-height: 1.3;
    display: block;
    overflow: visible;
    -webkit-line-clamp: unset;
    -webkit-box-orient: unset;
  }
}

/* Сетка контента */
.content-section {
  position: relative;
  padding: var(--spacing-large) 0;
  width: 100vw;
  margin-left: calc(-1 * var(--side-menu-width));
  z-index: 2;
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
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
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
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.8), transparent);
  padding: var(--spacing-base);
  display: flex;
  justify-content: space-between;
  font-size: 0.9em;
  color: rgba(255, 255, 255, 0.7);
}

.content-type {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.type {
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  font-size: 0.8em;
  color: white;
}

.year {
  font-weight: 500;
  color: white;
  font-size: clamp(14px, 1vw, 16px);
}

.content-title {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--spacing-base);
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
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: var(--spacing-base);
  pointer-events: auto;
}

.dot {
  width: 24px;
  height: 5px;
  background: rgba(255, 255, 255, 0.3);
  border: none;
  border-radius: 5px;
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
  transition: opacity 0.5s ease;
  opacity: 1;
}

.featured-backdrop.transitioning {
  opacity: 0;
}

/* Добавляем логотип в список анимируемых элементов */
.featured-meta .movie-logo,
.featured-meta h2,
.featured-meta .meta-details,
.featured-meta .featured-overview,
.featured-meta .movie-meta {
  transition: opacity 0.5s ease;
  opacity: 1;
}

.featured-meta.transitioning .movie-logo,
.featured-meta.transitioning h2,
.featured-meta.transitioning .meta-details,
.featured-meta.transitioning .featured-overview,
.featured-meta.transitioning .movie-meta {
  opacity: 0;
}

/* Кнопка всегда видима */
.featured-meta .actions {
  opacity: 1 !important;
  transition: none !important;
}

/* Удаляем неиспользуемые стили */
.home.transitioning .featured-backdrop,
.home.transitioning .featured-meta .movie-logo,
.home.transitioning .featured-meta h2,
.home.transitioning .featured-meta .meta-details,
.home.transitioning .featured-meta .featured-overview,
.home.transitioning .featured-meta .movie-meta {
  opacity: 1;
}

/* Hero секция */
@media (min-width: 769px) {

  /* Контент поверх фона */
  .content-section {
    position: relative;
    z-index: 3;
    transform: translateY(55vh);
  }
}

/* Мобильная версия */
@media (max-width: 768px) {
  .slider-dots {
    position: static;
    flex-direction: row;
  }
}

/* Обновляем стили для логотипа */
.movie-logo {
  max-width: 250px;
  max-height: 100px;
  width: auto;
  height: auto;
  margin-bottom: var(--spacing-base);
  filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.5));
  object-fit: contain;
  object-position: left center;
}

/* Добавляем контейнер для логотипа */
.logo-container {
  height: 100px;
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-logo);
}

/* Стили для текстового заголовка */
.logo-container h2 {
  font-size: var(--font-size-h1);
  line-height: 1.2;
  margin-bottom: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

/* Мобильные стили */
@media (max-width: 768px) {
  .logo-container {
    height: auto;
    justify-content: center;
    margin-bottom: var(--spacing-base);
  }

  .logo-container h2 {
    font-size: clamp(1.5rem, 5vw, 2rem);
    text-align: center;
  }
}

/* Обновляем стили для логотипов */
.desktop-logo {
  max-width: 250px;
  max-height: 100px;
  width: auto;
  height: auto;
  margin-bottom: var(--spacing-base);
  filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.5));
  object-fit: contain;
  object-position: left center;
}

.mobile-logo {
  display: none; /* По умолчанию скрыт */
}

/* Мобильные стили */
@media (max-width: 768px) {
  .desktop-logo {
    display: none; /* Скрываем картинку на мобильных */
  }

  .mobile-logo {
    display: block; /* Показываем текст на мобильных */
    font-size: clamp(1.5rem, 5vw, 2rem);
    text-align: center;
    line-height: 1.2;
    margin-bottom: 0;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  }
}

.slider-dots {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Добавим медиа-запрос для мобильных устройств */
@media (max-width: 768px) {
  .featured-overview {
    font-size: calc(var(--font-size-body) * 1.3);
    display: -webkit-box;
    margin: var(--spacing-base) auto;
    max-width: 100%;
    text-align: center;
    height: auto;
    white-space: normal !important;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 600;
    padding: 0 var(--spacing-base);
    line-height: 1.3;
  }
}

/* Стили для мета-информации */
.movie-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: var(--spacing-base) 0;
  font-size: calc(var(--font-size-body) * 0.9);
  color: rgba(255, 255, 255, 0.7);
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  padding-bottom: 5px; /* Для предотвращения обрезания тени */
}

/* Скрываем скроллбар для Chrome, Safari и Opera */
.movie-meta::-webkit-scrollbar {
  display: none;
}

.movie-rating {
  padding: 0.2rem 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  font-weight: 500;
  flex-shrink: 0;
}

.movie-genres {
  font-style: normal;
  opacity: 0.9;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .movie-meta {
    justify-content: center;
    flex-wrap: wrap;
    text-align: center;
    margin: calc(var(--spacing-base) * 0.5) 0;
  }
}

.actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.video-button{
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
  border: none;
  border-radius: 8px;
  position: relative;
  z-index: 101;
  font-weight: 600;
  background: whitesmoke;
  color: rgb(0, 0, 0);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;
}

@media (max-width: 768px) {
  .actions {
    flex-direction: column;
    width: 100%;
    padding: 0 var(--spacing-base);
  }

  .video-button,
  .favorite-button {
    width: 100%;
  }
}

.type {
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  font-size: 0.8em;
  color: white;
  flex-shrink: 0;
}

.meta-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9em;
  color: rgba(255, 255, 255, 0.7);
}

.series-info {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9em;
  white-space: nowrap;
  flex-shrink: 0;
}

.series-status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.9em;
  white-space: nowrap;
  flex-shrink: 0;
}

.series-status.ended {
  background: rgba(255, 87, 87, 0.2);
  color: #ff5757;
}

.series-status.ongoing {
  background: rgba(87, 255, 87, 0.2);
  color: #57ff57;
}
</style>
