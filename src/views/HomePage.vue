<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <swiper
        :modules="[Navigation, EffectFade, Autoplay]"
        :effect="'fade'"
        :loop="heroItems?.length > 1"
        :autoplay="{
          delay: 5000,
          disableOnInteraction: false,
        }"
        :navigation="true"
        class="hero-swiper"
      >
        <swiper-slide v-for="item in heroItems" :key="item.id" class="hero-slide">
          <div class="hero-background">
            <div class="hero-background-desktop"
                 :style="`background-image: url(https://imagetmdb.com/t/p/original${item.backdrop_path})`">
            </div>
            <div class="hero-background-mobile"
                 :style="`background-image: url(https://imagetmdb.com/t/p/original${item.poster_path})`">
            </div>
            <div class="network-badge" v-if="item.networks?.[0] || item.production_companies?.[0]">
              <span class="network-badge-text">{{ getCompanyName(item) }}</span>
            </div>
            <div class="hero-gradient"></div>
          </div>
          <div class="hero-content">
            <div class="content-wrapper">
              <div class="hero-logo">
                <div class="logo-container">
                  <img
                    v-if="item.images?.logos?.length"
                    :src="`https://imagetmdb.com/t/p/w500${getPreferredLogo(item.images.logos).file_path}`"
                    :alt="getTitle(item)"
                    class="network-logo"
                  >
                  <h1 v-else class="title">{{ getTitle(item) }}</h1>
                </div>
                <div class="subtitle">{{ getTitle(item) }}</div>
                <button class="more-button" @click="navigateToDetails(item)">
                  <Icon icon="mynaui:play-solid" width="34" />
                  <span>Смотреть</span>
                </button>
              </div>
            </div>
          </div>
        </swiper-slide>
      </swiper>
    </section>
    <!-- Continue Watching & Trending Sections -->
    <div class="content-sections">
      <TrendList title="В тренде" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import TrendList from '@/module/TrendList.vue'
import { useHeroStore } from '@/stores/heroStore'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, EffectFade, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/effect-fade'

const heroStore = useHeroStore()
const authStore = useAuthStore()
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

const navigateToDetails = (item) => {
  if (!authStore.user && !authStore.demoMode) {
    router.push('/login')
    return
  }
  router.push({
    name: 'cinema-details',
    params: {
      type: item.media_type || 'movie',
      id: item.id
    }
  })
}

const heroItems = computed(() => {
  return heroStore.trendingItems
    .filter(item => item.backdrop_path)
    .slice(0, 6);
});

const getPreferredLogo = (logos) => {
  if (!logos?.length) return null;
  // Сначала ищем русский логотип
  const ruLogo = logos.find(logo => logo.iso_639_1 === 'ru');
  if (ruLogo) return ruLogo;
  // Если русского нет, берем английский
  const enLogo = logos.find(logo => logo.iso_639_1 === 'en');
  if (enLogo) return enLogo;
  // Если ни русского, ни английского нет, берем первый доступный
  return logos[0];
};

const getCompanyName = (item) => {
  if (item.media_type === 'tv' && item.networks?.[0]) {
    return item.networks[0].name.toUpperCase();
  }
  if (item.media_type === 'movie' && item.production_companies?.[0]) {
    return item.production_companies[0].name.toUpperCase();
  }
  return '';
};
</script>

<style scoped>
.home-page {
  background: #0A0A0A;
  min-height: 100vh;
  padding-bottom: 4rem;
  padding-right: 4rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #fff;
}

.see-all {
  color: rgba(255, 255, 255, 0.7);
  background: none;
  border: none;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 6px;
}

.see-all:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.content-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

.watching-grid {
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.watching-card {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.watching-card:hover {
  transform: translateY(-5px);
}

.watching-card .card-image {
  position: relative;
  width: 100%;
  height: 100%;
  aspect-ratio: 16/9;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.2);
}

.progress {
  height: 100%;
  background: #E50914;
}

.card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.7) 70%,
    rgba(0, 0, 0, 0.9) 100%
  );
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.card-content {
  color: #fff;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #fff;
}

.episode-info {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
}

.play-button {
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  cursor: pointer;
  transition: all 0.2s ease;
}

.play-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

/* Swiper Navigation Styles */
:deep(.swiper-button-next),
:deep(.swiper-button-prev) {
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

:deep(.swiper-button-next)::after,
:deep(.swiper-button-prev)::after {
  font-size: 18px;
}

:deep(.swiper-button-disabled) {
  opacity: 0 !important;
}

@media (max-width: 768px) {
  .watching-swiper {
    padding: 0 1rem;
  }

  :deep(.swiper-slide) {
    width: 300px;
    height: 169px;
  }

  .card-title {
    font-size: 0.9rem;
  }

  .episode-info {
    font-size: 0.75rem;
  }
}

.hero-section {
  position: relative;
  border-radius: 0 0 24px 24px;
  overflow: hidden;
  height: 600px;
  width: 100%;
  margin: 0;
}

.hero-swiper,
.hero-slide {
  border-radius: 0 0 24px 24px;
  overflow: hidden;
  width: 100%;
  height: 100%;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 0 0 24px 24px;
}

.hero-background-desktop,
.hero-background-mobile {
  width: 100%;
  height: 100%;
  border-radius: 0 0 24px 24px;
  background-size: cover;
  background-position: center top;
}

.hero-gradient {
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.9) 0%,
    rgba(0, 0, 0, 0.6) 50%,
    rgba(0, 0, 0, 0.4) 100%
  );
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 0 0 24px 24px;
}

.hero-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 40px;
  max-width: 1600px;
  margin: 0 auto;
}

.content-wrapper {
  padding: 0;
  width: 100%;
  max-width: 600px;
}

.hero-logo {
  width: 100%;
}

.logo-container {
  margin-bottom: 20px;
  height: 120px;
  display: flex;
  align-items: center;
}

.network-logo {
  height: auto;
  max-height: 120px;
  object-fit: contain;
}

.network-logo.invert {
  filter: invert(1);
}

.title {
  color: white;
  font-size: 3rem;
  margin: 0;
  line-height: 1.2;
}

.subtitle {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.2rem;
  margin: 20px 0;
}

.more-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 12px 24px;
  border-radius: 12px;
  color: white;
  transition: all 0.3s ease;
  cursor: pointer;
  font-size: 1.1rem;
}

.more-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Медиа-запрос для мобильных устройств */
@media (max-width: 768px) {
  .home-page {
    padding-right: 0;
  }

  .hero-section {
    height: 400px;
  }

  .hero-content {
    padding: 0 16px;
    align-items: flex-end;
    padding-bottom: 24px;
  }

  .content-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    width: 100%;
  }

  .hero-logo {
    width: auto;
    max-width: 70%;
    display: flex;
    flex-direction: column;
  }

  .logo-container {
    height: 80px;
    margin-bottom: 8px;
  }

  .network-logo {
    max-width: 280px;
    max-height: 80px;
  }

  .title {
    font-size: 1.8rem;
  }

  .subtitle {
    font-size: 0.9rem;
    margin: 0;
    margin-bottom: 4px;
  }

  .more-button {
    position: absolute;
    right: 40px;
    bottom: 40px;
    padding: 12px;
    font-size: 0.9rem;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(8px);
    margin-left: auto;
    border-radius: 50%;
    width: 56px;
    height: 56px;
    justify-content: center;
  }

  .more-button span {
    display: none;
  }

  .more-button .iconify {
    width: 28px;
    height: 28px;
    margin: 0;
  }
}

.network-badge {
  position: absolute;
  top: 20px;
  left: 20px;
  padding: 8px 16px;
  border-radius: 8px;
  z-index: 2;
}

.network-badge-text {
  color: white;
  font-size: 14px;
}

@media (max-width: 768px) {
  .network-badge {
    top: 1rem;
    left: 1rem;
    padding: 0.5rem;
  }

  .network-badge-text {
    font-size: 0.8rem;
  }
}
</style>
