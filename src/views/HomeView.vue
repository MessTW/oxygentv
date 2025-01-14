<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useLogoStore } from '@/stores/logoStore'
import { useBlockListStore } from '@/stores/blockList'
import api from '@/plugins/axios'
import ContentSkeleton from '@/components/ContentSkeleton.vue'
import TrendList from '../module/TrendList.vue'

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
const isLoading = ref(true)

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

// Функция для обрезки текста
const truncateText = (text, maxLength = 80) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

// Добавьте новую функцию для получения изображений с текстом
const getBackdropWithText = async (item) => {
  try {
    const response = await api.get(`${item.mediaType}/${item.id}/images`, {
      params: {
        language: 'ru-RU',
        include_image_language: 'ru'
      }
    });

    // Ищем первый backdrop с русским текстом
    const russianBackdrop = response.data.backdrops?.find(backdrop =>
      backdrop.iso_639_1 === 'ru'
    );

    // Если нашли backdrop с текстом - возвращаем его путь, иначе стандартный
    return russianBackdrop
      ? `https://imagetmdb.com/t/p/w780${russianBackdrop.file_path}`
      : `https://imagetmdb.com/t/p/w780${item.backdrop_path}`;
  } catch (error) {
    console.error('Error fetching backdrop with text:', error);
    return `https://imagetmdb.com/t/p/w780${item.backdrop_path}`;
  }
};

// Добавьте новый реактивный объект для хранения путей к изображениям
const backdropPaths = ref({});

// Модифицируйте fetchTrending для загрузки изображений с текстом
const fetchTrending = async () => {
  try {
    // Проверяем есть ли все данные в кэше
    const hasAllCachedData = featuredItems.value.every(item =>
      logoStore.logos[item.id] &&
      logoStore.details[item.id]
    );

    // Устанавливаем isLoading только если нет кэшированных данных
    if (!hasAllCachedData) {
      isLoading.value = true
    }

    const [moviesData, seriesData] = await Promise.all([
      api.get('trending/movie/week', {
        params: {
          language: 'ru-RU'
        }
      }).then(res => res.data),
      api.get('trending/tv/week', {
        params: {
          language: 'ru-RU'
        }
      }).then(res => res.data)
    ]);

    const filteredMovies = moviesData.results
      .filter(movie =>
        movie.title &&
        movie.title.trim() !== '' &&
        movie.overview &&
        movie.overview.trim() !== '' &&
        !blockListStore.isMovieBlocked(movie.id)
      )
      .map(movie => ({ ...movie, mediaType: 'movie' }));

    const filteredSeries = seriesData.results
      .filter(show =>
        show.name &&
        show.name.trim() !== '' &&
        show.overview &&
        show.overview.trim() !== '' &&
        !blockListStore.isSeriesBlocked(show.id)
      )
      .map(show => ({ ...show, mediaType: 'tv', routeType: 'series' }));

    // Set default values if both requests fail
    featuredItems.value = (filteredMovies.length || filteredSeries.length)
      ? [...filteredMovies, ...filteredSeries]
          .sort(() => Math.random() - 0.5)
          .slice(0, 5)
      : [];

    featuredContent.value = (filteredMovies.length || filteredSeries.length)
      ? [...filteredMovies, ...filteredSeries]
          .sort(() => Math.random() - 0.5)
      : [];

    // Загружаем логотипы только для тех элементов, которых нет в кэше
    await Promise.all(featuredItems.value
      .filter(item => !logoStore.logos[item.id])
      .map(item => fetchLogo(item))
    );

    // Загружаем детали только для тех элементов, которых нет в кэше
    await Promise.all(featuredItems.value
      .filter(item => !logoStore.details[item.id])
      .map(async (item) => {
      try {
        const { data: details } = await api.get(`${item.mediaType}/${item.id}`, {
          params: {
            language: 'ru-RU',
            append_to_response: 'release_dates'
          }
        })

        // Fallback data in case of missing information
        const fallbackData = {
          tagline: item.overview?.split('.')[0] + '.',
          rating: getAgeRating(item),
          genres: '',
          status: item.mediaType === 'tv' ? 'Выходит' : undefined
        }

        // Разная обработка для фильмов и сериалов
        if (item.mediaType === 'tv') {
          const status = details.status === 'Ended' ? 'Завершен' : 'Выходит';

          const itemDetails = {
            type: 'Сериал',
            tagline: truncateText(details.tagline || fallbackData.tagline),
            rating: getAgeRating(details) || fallbackData.rating,
            genres: formatGenres(details.genres) || '',
            status: status
          };

          movieDetails.value[item.id] = itemDetails;
          logoStore.cacheDetails(item.id, itemDetails);
        } else {
          const itemDetails = {
            type: 'Фильм',
            tagline: truncateText(details.tagline || fallbackData.tagline),
            rating: getAgeRating(details) || fallbackData.rating,
            genres: formatGenres(details.genres) || ''
          };

          movieDetails.value[item.id] = itemDetails;
          logoStore.cacheDetails(item.id, itemDetails);
        }
      } catch (error) {
        console.error('Error fetching details:', error)
        // Use fallback data if the API request fails
        movieDetails.value[item.id] = {
          tagline: item.overview?.split('.')[0] + '.',
          rating: getAgeRating(item),
          genres: '',
          status: item.mediaType === 'tv' ? 'Выходит' : undefined
        }
      }
    }));

    // После получения списка фильмов/сериалов загружаем изображения с текстом
    await Promise.all(featuredContent.value.map(async (item) => {
      backdropPaths.value[item.id] = await getBackdropWithText(item);
    }));

  } catch (error) {
    console.error('Error:', error)
  } finally {
    isLoading.value = false
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
        updateBackgroundImage();

        // Ждем обновления DOM и запускаем анимацию появления
        nextTick(() => {
          requestAnimationFrame(() => {
            backdrop.classList.remove('transitioning');
            meta.classList.remove('transitioning');
          });
        });
      }, 500);
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

// Добавляем кэш для фоновых изображений
const backgroundCache = ref({})

// Функция для предзагрузки изображения
const preloadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(url)
    img.onerror = reject
    img.src = url
  })
}

const getBackgroundImage = () => {
  const movie = featuredItems.value[currentFeaturedIndex.value];
  if (!movie) return '';

  const isMobile = window.innerWidth <= 768;
  const path = isMobile ? movie.poster_path : movie.backdrop_path;
  const cacheKey = `${movie.id}-${isMobile ? 'mobile' : 'desktop'}`

  // Проверяем кэш
  if (backgroundCache.value[cacheKey]) {
    return backgroundCache.value[cacheKey];
  }

  const imageUrl = `url(https://imagetmdb.com/t/p/original${path})`;
  backgroundCache.value[cacheKey] = imageUrl;

  // Обновляем фон страницы только для десктопа
  if (!isMobile) {
    const homeElement = document.querySelector('.home');
    if (homeElement) {
      homeElement.style.setProperty('--featured-bg', imageUrl);
    }
  }

  return imageUrl;
};

const preloadNextImage = async () => {
  const nextIndex = (currentFeaturedIndex.value + 1) % featuredItems.value.length;
  const nextMovie = featuredItems.value[nextIndex];
  if (nextMovie) {
    const isMobile = window.innerWidth <= 768;
    const path = isMobile ? nextMovie.poster_path : nextMovie.backdrop_path;
    const cacheKey = `${nextMovie.id}-${isMobile ? 'mobile' : 'desktop'}`

    // Загружаем только если нет в кэше
    if (!backgroundCache.value[cacheKey]) {
      const imageUrl = `https://imagetmdb.com/t/p/original${path}`;
      try {
        await preloadImage(imageUrl);
        backgroundCache.value[cacheKey] = `url(${imageUrl})`;
      } catch (error) {
        console.error('Error preloading image:', error);
      }
    }
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

const updateBackgroundImage = () => {
  const backdrop = document.querySelector('.featured-backdrop');
  const homeElement = document.querySelector('.home');
  if (backdrop) {
    // Добавляем класс для анимации
    backdrop.classList.add('transitioning');
    backdrop.style.backgroundImage = getBackgroundImage();

    // Обновляем фон для десктопа
    if (!isMobile.value && homeElement) {
      homeElement.style.setProperty('--featured-bg', getBackgroundImage());
    }

    // Удаляем класс после завершения перехода
    setTimeout(() => {
      backdrop.classList.remove('transitioning');
    }, 300);
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

// Добавляем computed свойство для деталей текущего элемента
const currentItemDetails = computed(() => {
  const item = getCurrentItem.value;
  if (!item) return null;

  // Сначала проверяем кэш
  const cachedDetails = logoStore.getDetails(item.id);
  if (cachedDetails) return cachedDetails;

  return {
    type: item.mediaType === 'movie' ? 'Фильм' : 'Сериал',
    rating: movieDetails.value[item.id]?.rating || getAgeRating(item),
    status: item.mediaType === 'tv'
      ? (movieDetails.value[item.id]?.status || 'Выходит')
      : undefined,
    genres: movieDetails.value[item.id]?.genres || '',
    tagline: movieDetails.value[item.id]?.tagline ||
      truncateText(item.overview?.split('.')[0] + '.')
  };
});

// Функция для очистки деталей
const clearDetails = () => {
  movieDetails.value = {}
}

// Функция для установки начальных деталей
const setInitialDetails = () => {
  if (!getCurrentItem.value) return;

  const item = getCurrentItem.value;
  movieDetails.value[item.id] = {
    type: item.mediaType === 'movie' ? 'Фильм' : 'Сериал',
    rating: getAgeRating(item),
    status: item.mediaType === 'tv' ? 'Выходит' : undefined,
    genres: '',
    tagline: truncateText(item.overview?.split('.')[0] + '.')
  }
}

onMounted(() => {
  fetchTrending()
  fetchGenres()
  startAutoplay()
  setInitialDetails() // Добавляем начальные значения
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
  updateBackgroundImage();
})

onUnmounted(() => {
  stopAutoplay()
  resetProgress()
  clearDetails() // Очищаем детали при размонтировании
  backgroundCache.value = {} // Очищаем кэш фоновых изображений
  window.removeEventListener('resize', updateBackgroundImage)
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', updateIsMobile)
})
</script>

<template>
  <div class="home-wrapper">
    <div class="home">
      <!-- Фиксированная hero секция -->
        <section v-if="featuredItems.length" class="hero">
          <div class="featured-content">
            <div class="featured-backdrop" :style="{
              backgroundImage: getBackgroundImage(),
            }">
            </div>
            <div class="featured-info">
              <ContentSkeleton v-if="isLoading" />
              <div v-else class="featured-meta">
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
                  <span class="movie-rating">{{ currentItemDetails?.rating }}</span>
                  <span class="movie-rating">{{ currentItemDetails?.type }}</span>
                  <span v-if="getCurrentItem.mediaType === 'tv'"
                        :class="['movie-rating', currentItemDetails?.status === 'Завершен' ? 'ended' : 'ongoing']">
                    {{ currentItemDetails?.status }}
                  </span>

                  <span class="movie-genres">{{ currentItemDetails?.genres }}</span>
                </div>
                <p class="featured-overview">{{ currentItemDetails?.tagline }}</p>
                <div class="actions">
                  <button class="video-button" @click="handleFeaturedClick">
                    <Icon icon="ic:outline-info" width="24" />
                    <span>Подробнее</span>
                  </button>
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
      <TrendList
        title="В тренде"
        :items="featuredContent"
        :isLoading="isLoading"
      />
    </div>
</template>

<style scoped>
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
    grid-template-columns: repeat(1, 1fr);
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

.movie-type {
  padding: 0.2rem 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  font-weight: 500;
  flex-shrink: 0;
  margin-left: auto;
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

/* Добавляем стили для скелетона карточек */
.content-card.skeleton {
  width: 100%;
  aspect-ratio: 2/3;
  background: rgba(255, 255, 255, 0.1);
  animation: pulse 1.5s infinite;
}

.skeleton-poster {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

@keyframes pulse {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.3;
  }
  100% {
    opacity: 0.6;
  }
}

/* Добавляем плавные переходы для контента */
.featured-meta,
.content-card {
  transition: opacity 0.3s ease;
}

.featured-meta > *,
.content-card > * {
  transition: opacity 0.3s ease;
}

.featured-backdrop {
  transition: opacity 0.3s ease;
}

.featured-backdrop.transitioning {
  opacity: 0;
}

/* Добавляем задержку для возврата opacity */
.featured-backdrop:not(.transitioning) {
  opacity: 1;
}
</style>
