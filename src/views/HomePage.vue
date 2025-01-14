<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="hero" v-if="trendingMovie"
             :style="`background-image: linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(20,20,20,1)),
                     url(https://imagetmdb.com/t/p/original${trendingMovie.backdrop_path})`">
      <div class="progress-container">
        <div
          v-for="(_, index) in maxHeroItems"
          :key="index"
          class="progress-item"
          :class="{ active: index === currentHeroIndex }"
          @click="switchToSlide(index)"
        >
          <div
            class="progress-bar"
            :style="{
              height: getProgressWidth(index),
              backgroundColor: index === currentHeroIndex ? '#fff' : 'rgba(255, 255, 255, 0.3)'
            }"
          ></div>
        </div>
      </div>
      <div class="hero-content">
        <div class="content-wrapper">
          <div v-if="networkName" class="network">
            <span >{{ networkName }}</span>
          </div>
          <div class="logo-container">
            <img
              v-if="getLogo(trendingMovie)"
              :src="`https://imagetmdb.com/t/p/w500${getLogo(trendingMovie)}`"
              :alt="getTitle(trendingMovie)"
              class="title-logo"
            >
            <h1 v-else class="title">{{ getTitle(trendingMovie) }}</h1>
          </div>
          <div class="meta-info">
            <div class="categories">
              {{ getCategories(trendingMovie) }}
            </div>
            <span class="dot">|</span>
            <span class="year">{{ getYear(trendingMovie) }}</span>
            <span class="dot">|</span>
            <span class="duration">{{ trendingMovie.media_type === 'movie' ? 'Фильм' : 'Сериал' }} {{ getDuration(trendingMovie) }}</span>
          </div>
          <p class="description">
            {{ truncateDescription(trendingMovie.overview) }}
          </p>
          <div class="buttons">
            <button
              class="video-button"
              @click="navigateToDetails(trendingMovie)"
            >
              СМОТРЕТЬ СЕЙЧАС
            </button>
            <FavoriteButton
              :item="trendingMovie"
              :type="trendingMovie.media_type"
              class="episodes-button"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Trending Section -->
    <div class="trending-section">
      <TrendList title="В тренде" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import TrendList from '@/module/TrendList.vue'
import { useHeroStore } from '@/stores/heroStore'
import { useRouter } from 'vue-router'
import FavoriteButton from '@/components/FavoriteButton.vue'

const heroStore = useHeroStore()
const router = useRouter()

const trendingMovie = ref(null)
const currentHeroIndex = ref(0)
const maxHeroItems = 6
const progress = ref(0)
const isTransitioning = ref(false)
let progressInterval
let slideInterval
const networkName = ref(null)
const networkLogo = ref(null)
const shouldInvertLogo = ref(false)

// Маппинг ID жанров на русские названия
const genreMap = {
   28: 'Боевик',
   12: 'Приключения',
   16: 'Мультфильм',
   35: 'Комедия',
   80: 'Криминал',
   99: 'Документальный',
   18: 'Драма',
   10751: 'Семейный',
   14: 'Фэнтези',
   36: 'История',
   27: 'Ужасы',
   10402: 'Музыка',
   9648: 'Детектив',
   10749: 'Мелодрама',
   878: 'Фантастика',
   10770: 'ТВ фильм',
   53: 'Триллер',
   10752: 'Военный',
   37: 'Вестерн',
   10762: 'Детский',
   10763: 'Новости',
   10764: 'Реалити-шоу',
   10765: 'Научная фантастика',
   10766: 'Сериал',
   10767: 'Ток-шоу',
   10768: 'Война и Политика'
}

// Функция для плавного переключения слайдов
const smoothTransition = async (nextIndex) => {
  if (isTransitioning.value) return

  isTransitioning.value = true

  // Переключаем слайд
  currentHeroIndex.value = nextIndex
  const filteredResults = heroStore.trendingItems
    .filter(item => item.backdrop_path)
    .slice(0, maxHeroItems)
  trendingMovie.value = filteredResults[nextIndex]

  progress.value = 0
  isTransitioning.value = false
  startProgress()
}

// Функция для переключения на конкретный слайд
const switchToSlide = (index) => {
  if (index === currentHeroIndex.value || isTransitioning.value) return

  // Сбрасываем все таймеры
  if (progressInterval) clearInterval(progressInterval)
  if (slideInterval) clearInterval(slideInterval)

  smoothTransition(index)

  // Перезапускаем автоматическое переключение
  startSlideShow()
}

const startProgress = () => {
  if (progressInterval) {
    clearInterval(progressInterval)
  }

  progress.value = 0
  progressInterval = setInterval(() => {
    if (progress.value >= 100) {
      clearInterval(progressInterval)
      smoothTransition((currentHeroIndex.value + 1) % maxHeroItems)
    } else {
      progress.value = Math.min(100, progress.value + 0.2)
    }
  }, 10)
}

const startSlideShow = () => {
  slideInterval = setInterval(() => {
    smoothTransition((currentHeroIndex.value + 1) % maxHeroItems)
  }, 5000)
}

// Очистка интервала при размонтировании компонента
onUnmounted(() => {
  if (progressInterval) clearInterval(progressInterval)
  if (slideInterval) clearInterval(slideInterval)
})

// Обновляем функцию updateHeroContent
const updateHeroContent = (index) => {
  const filteredResults = heroStore.trendingItems
    .filter(item => item.backdrop_path)
    .slice(0, maxHeroItems)

  const item = filteredResults[index]
  if (!item) return

  trendingMovie.value = item

  // Обновляем информацию о сети
  if (item.media_type === 'tv' && item.networks?.[0]) {
    networkName.value = item.networks[0].name
    networkLogo.value = item.networks[0].logo_path
    shouldInvertLogo.value = item.networks[0].name === 'Netflix'
  } else {
    networkName.value = null
    networkLogo.value = null
    shouldInvertLogo.value = false
  }
}

// Обновляем watch эффект для currentHeroIndex
watch(currentHeroIndex, (newIndex) => {
  updateHeroContent(newIndex)
})

// Обновляем onMounted
onMounted(async () => {
  if (!heroStore.trendingItems.length) {
    await heroStore.fetchTrending()
  }
  updateHeroContent(0)
  startProgress()
  startSlideShow()
})

// Следим за изменениями в трендах
watch(() => heroStore.trendingItems, () => {
  if (heroStore.trendingItems.length > 0) {
    updateHeroContent()
  }
})

// Функция для получения правильного заголовка
const getTitle = (item) => {
  return item.media_type === 'movie' ?
    (item.title || item.original_title) :
    (item.name || item.original_name)
}

// Функция для получения логотипа
const getLogo = (item) => {
  const logos = item?.images?.logos;
  if (!logos || !logos.length) return null;

  // Ищем логотип в порядке приоритета: ru -> en -> без языка
  const ruLogo = logos.find(logo => logo.iso_639_1 === 'ru');
  if (ruLogo) return ruLogo.file_path;

  const enLogo = logos.find(logo => logo.iso_639_1 === 'en');
  if (enLogo) return enLogo.file_path;

  const noLangLogo = logos.find(logo => !logo.iso_639_1);
  if (noLangLogo) return noLangLogo.file_path;

  return logos[0].file_path;
}

// Функция для умного сокращения описания
const truncateDescription = (text, maxLength = 200) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;

  // Обрезаем до максимальной длины
  const truncated = text.slice(0, maxLength);
  // Находим последний пробел
  const lastSpace = truncated.lastIndexOf(' ');

  // Обрезаем до последнего полного слова
  return truncated.slice(0, lastSpace).trim() + '...';
}

// Функция для получения телесети или производственной компании
const getNetwork = async (item) => {
  if (!item) return;

  try {
    if (item.media_type === 'tv') {
      const networks = item.networks || [];
      if (networks.length > 0) {
        networkName.value = networks[0].name.toUpperCase();
        networkLogo.value = networks[0].logo_path;
        // Список сетей с темными логотипами
        const darkLogoNetworks = [49, 16, 19, 88, 77, 80, 56, 54, 2552, 4, 332, 493, 26];
        shouldInvertLogo.value = darkLogoNetworks.includes(networks[0].id);
      }
    } else if (item.media_type === 'movie') {
      const companies = item.production_companies || [];
      const mainCompanies = companies.filter(company => company.name);
      if (mainCompanies.length > 0) {
        networkName.value = mainCompanies[0].name.toUpperCase();
        networkLogo.value = mainCompanies[0].logo_path;
        // Список компаний с темными логотипами
        const darkLogoCompanies = [1, 2, 3, 4, 5, 7, 33, 25, 41, 521, 10342, 128064, 9993, 41077, 1632, 12, 20580, 318, 34];
        shouldInvertLogo.value = darkLogoCompanies.includes(mainCompanies[0].id);
      }
    }
  } catch (error) {
    console.error('Error fetching network/company:', error);
    networkName.value = null;
    networkLogo.value = null;
  }
};

// Следим за изменениями trendingMovie
watch(trendingMovie, async (newMovie) => {
  if (newMovie) {
    await getNetwork(newMovie)
  }
}, { immediate: true })

const getProgressWidth = (index) => {
  if (index === currentHeroIndex.value) {
    return `${progress.value}%`
  }
  if (index === (currentHeroIndex.value + 1) % maxHeroItems && progress.value > 90) {
    return `${(progress.value - 90) * 10}%`
  }
  return '0%'
}

const getYear = (item) => {
  const date = item.media_type === 'movie' ? item.release_date : item.first_air_date
  return date ? date.split('-')[0] : ''
}

const getDuration = (item) => {
  if (item.media_type === 'tv') {
    const seasons = item.number_of_seasons;
    const episodes = item.number_of_episodes;
    if (!seasons) return '';

    // Функция для правильного склонения слова "сезон"
    const getSeasonsWord = (num) => {
      if (num % 10 === 1 && num % 100 !== 11) return 'сезон';
      if ([2, 3, 4].includes(num % 10) && ![12, 13, 14].includes(num % 100)) return 'сезона';
      return 'сезонов';
    };

    return `${seasons} ${getSeasonsWord(seasons)} (${episodes} сери${episodes === 1 ? 'я' : episodes < 5 ? 'и' : 'й'})`;
  }

  if (!item?.runtime) return '';

  const minutes = item.runtime;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}ч ${remainingMinutes}м` : `${hours}ч`;
  }
  return `${minutes}м`;
}

const getCategories = (item) => {
  // Проверяем есть ли genre_ids или genres
  const genres = item.genre_ids || item.genres?.map(g => g.id)
  if (!genres) return ''

  return genres
    .map(id => genreMap[id])
    .filter(name => name)
    .slice(0, 3) // Ограничиваем до 3 жанров
    .join(' | ')
}

const navigateToDetails = (item) => {
  const route = item.media_type === 'movie' ? 'movie' : 'series';
  router.push({
    name: route,
    params: { id: item.id },
    state: { movieData: item } // Передаем данные через state
  });
};
</script>

<style scoped>
.home-page {
  background-color: #141414;
  min-height: 90vh;
  color: white;
  padding-bottom: 2rem;
}

.slide-indicators {
  position: absolute;
  top: 50%;
  right: 48px;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.indicator {
  width: 3px;
  height: 20px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.indicator.active {
  background-color: #fff;
}

.indicator .progress {
  height: 100%;
  background-color: #fff;
  transition: width 0.1s linear;
}

.hero {
  height: 100vh;
  background-size: cover;
  background-position: center 20%;
  position: relative;
  margin-bottom: -200px;
  z-index: 1;
}

.hero-content {
  position: absolute;
  bottom: 35%;
  left: 4%;
  max-width: 900px;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
}

.network {
  height: 32px;
  margin-bottom: 1rem;
}

.network-logo {
  height: 100%;
  object-fit: contain;
}

.invert-logo {
  filter: brightness(0) invert(1);
}

.network span {
  color: #e5e5e5;
  font-size: 1.2rem;
  letter-spacing: 4px;
  text-transform: uppercase;
}

.logo-container {
  max-width: 100%;
  margin-bottom: 1.5rem;
}

.title-logo {
  max-width: 100%;
  max-height: 140px;
  object-fit: contain;
  filter: drop-shadow(2px 2px 4px rgba(0,0,0,.45));
}

.title {
  font-size: 2.8rem;
  font-weight: 700;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 1.5rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,.45);
}

.description {
  font-size: 1.1rem;
  line-height: 1.5;
  color: #e5e5e5;
  max-width: 500px;
  margin-bottom: 2rem;
  text-shadow: 1px 1px 2px rgba(0,0,0,.3);
  opacity: 0.9;
}

@media (max-width: 768px) {
  .hero-content {
    padding: 0 20px;
    bottom: 30%;
  }

  .network {
    font-size: 1rem;
  }

  .description {
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
  }

  button {
    font-size: 1rem;
    padding: 8px 20px;
    min-width: 120px;
  }
}

.trending-section {
  position: relative;
  z-index: 1;
}

.buttons {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-top: 2rem;
}

.video-button,
.episodes-button {
  cursor: pointer;
  transition: all 0.2s ease;
  height: 48px;
  padding: 0 2rem;
  font-size: 0.9rem;
  min-width: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  border-radius: 2px;
  font-weight: 600;
  letter-spacing: 2px;
}

.video-button {
  background: snow;
  color: black;
}

.episodes-button {
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.video-button:hover,
.episodes-button:hover {
  border-color: #fff;
}

@media (max-width: 768px) {
  .buttons {
    flex-direction: column;
    width: 100%;
    padding: 0 var(--spacing-base);
  }

  .video-button {
    width: 100%;
  }
}

.progress-container {
  position: absolute;
  top: 50%;
  right: 4%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 2;
}

.progress-item {
  width: 3px;
  height: 16px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
  cursor: pointer;
  transition: width 0.3s ease, transform 0.3s ease;
}

.progress-item:hover,
.progress-item.active {
  width: 4px;
  transform: scaleY(1.2);
  background: rgba(255, 255, 255, 0.4);
}

.progress-bar {
  width: 100%;
  height: 0%;
  background: #fff;
  transition: height 0.025s linear;
}

@media (max-width: 768px) {
  .progress-container {
    right: 16px;
  }
}

.meta-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  color: #fff;
  letter-spacing: 1px;
  text-transform: uppercase;
  font-weight: 500;
}

.categories {
  color: rgba(255, 255, 255, 0.7);
}

.dot {
  color: rgba(255, 255, 255, 0.7);
  margin: 0 -2px;
}

.year, .duration {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.type {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.age-rating {
  color: rgba(255, 255, 255, 0.7);
}

@media (max-width: 768px) {
  .meta-info {
    font-size: 0.9rem;
    gap: 6px;
    flex-wrap: wrap;
  }
}

.buttons {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-top: 2rem;
}

.episodes-button {
  cursor: pointer;
  transition: all 0.2s ease;
  height: 48px;
  padding: 0 2rem;
  font-size: 0.9rem;
  min-width: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  border-radius: 2px;
  font-weight: 600;
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.5);
  letter-spacing: 2px;
  text-transform: uppercase;
}

.episodes-button:hover {
  border-color: #fff;
  background: rgba(255, 255, 255, 0.1);
}
</style>
