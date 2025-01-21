<template>
  <div class="details-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-background">
        <div class="hero-background-desktop"
             :style="`background-image: url(https://imagetmdb.com/t/p/original${details?.backdrop_path})`">
        </div>
        <div class="hero-background-mobile"
             :style="`background-image: url(https://imagetmdb.com/t/p/original${details?.poster_path})`">
        </div>
        <div class="network-badge" v-if="details?.networks?.[0] || details?.production_companies?.[0]">
          <span class="network-badge-text">{{ getCompanyName(details) }}</span>
        </div>
        <div class="hero-gradient"></div>
      </div>
      <div class="hero-content">
        <div class="content-wrapper">
          <div class="hero-logo">
            <div class="logo-container">
              <img
                v-if="details?.images?.logos?.length"
                :src="`https://imagetmdb.com/t/p/w500${getPreferredLogo(details.images.logos).file_path}`"
                :alt="getTitle(details)"
                class="network-logo"
              >
              <h1 v-else class="title">{{ getTitle(details) }}</h1>
            </div>
            <div class="meta-info">
              <span class="year">{{ getYear(details) }}</span>
              <span class="dot">•</span>
              <span class="rating">{{ details?.vote_average?.toFixed(1) }}</span>
              <span class="dot">•</span>
              <span class="duration">{{ getDuration(details) }}</span>
            </div>
            <div class="genres">
              {{ getGenres(details) }}
            </div>
            <p class="overview">{{ details?.overview }}</p>
            <div class="actions">
              <button class="watch-button" @click="watchNow(details)">
                <Icon icon="mynaui:play-solid" width="24" />
                <span>{{ getWatchButtonText }}</span>
              </button>
              <FavoriteButton
                v-if="details"
                :item="details"
                :type="route.params.type"
                class="favorite-btn"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
    <EpisodesList
      v-if="details && route.params.type === 'tv'"
      :details="details"
      :kinopoiskId="kinopoiskId"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { fetchDetails, searchKinopoiskId } from '@/services/tmdb'
import EpisodesList from '@/module/EpisodesList.vue'
import FavoriteButton from '@/components/FavoriteButton.vue'
import { useWatchProgressStore } from '@/stores/watchProgress'

const route = useRoute()
const router = useRouter()
const details = ref(null)
const kinopoiskId = ref(null)
const watchProgressStore = useWatchProgressStore()

const getWatchButtonText = computed(() => {
  if (route.params.type === 'tv' && details.value) {
    const progress = watchProgressStore.getProgress(details.value.id)
    if (progress.season > 1 || progress.episode > 1) {
      return `Продолжить просмотр с ${progress.season} сезон ${progress.episode} серия`
    }
  }
  return 'Смотреть'
})

onMounted(async () => {
  const { type, id } = route.params
  const data = await fetchDetails(type, id)
  details.value = data
  document.title = details.value.title || details.value.name

  // Поиск ID кинопоиска по оригинальному и русскому названию
  const originalTitle = type === 'movie'
    ? details.value.original_title
    : details.value.original_name;
  const russianTitle = type === 'movie'
    ? details.value.title
    : details.value.name;
  const year = type === 'movie'
    ? new Date(details.value.release_date).getFullYear()
    : new Date(details.value.first_air_date).getFullYear();

  console.log('Searching KinopoiskID for:', {
    originalTitle,
    russianTitle,
    type,
    year
  });

  kinopoiskId.value = await searchKinopoiskId(originalTitle, type, year);
  console.log('Found KinopoiskID:', kinopoiskId.value);
})

const getTitle = (item) => {
  return item?.media_type === 'movie' || route.params.type === 'movie'
    ? (item?.title || item?.original_title)
    : (item?.name || item?.original_name)
}

const getYear = (item) => {
  const date = item?.media_type === 'movie' || route.params.type === 'movie'
    ? item?.release_date
    : item?.first_air_date
  return date ? new Date(date).getFullYear() : ''
}

const getDuration = (item) => {
  if (item?.media_type === 'movie' || route.params.type === 'movie') {
    const hours = Math.floor(item?.runtime / 60)
    const minutes = item?.runtime % 60
    return `${hours}ч ${minutes}м`
  }
  return `${item?.number_of_seasons} сезон${item?.number_of_seasons > 1 ? 'а' : ''}`
}

const getGenres = (item) => {
  return item?.genres?.map(genre => genre.name).join(', ')
}

const getPreferredLogo = (logos) => {
  if (!logos?.length) return null
  const ruLogo = logos.find(logo => logo.iso_639_1 === 'ru')
  if (ruLogo) return ruLogo
  const enLogo = logos.find(logo => logo.iso_639_1 === 'en')
  if (enLogo) return enLogo
  return logos[0]
}

const getCompanyName = (item) => {
  if (item?.media_type === 'tv' || route.params.type === 'tv') {
    return item?.networks?.[0]?.name.toUpperCase()
  }
  return item?.production_companies?.[0]?.name.toUpperCase()
}

const watchNow = (item) => {
  if (route.params.type === 'tv') {
    const progress = watchProgressStore.getProgress(item.id)
    router.push({
      name: 'watch',
      params: {
        type: route.params.type,
        id: item.id,
        season: progress.season,
        episode: progress.episode,
        kpId: kinopoiskId.value
      }
    })
  } else {
    router.push({
      name: 'watch',
      params: {
        type: 'movie',
        id: item.id,
        season: '1',
        episode: '1',
        kpId: kinopoiskId.value
      }
    })
  }
}
</script>

<style scoped>
/* Базовые стили из HomePage.vue */
.details-page {
  background: #0A0A0A;
  min-height: 100vh;
  padding-bottom: 4rem;
  padding-right: 0.2rem;
  position: relative;
  overflow: hidden;
}

.details-page::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url(https://imagetmdb.com/t/p/original${details?.backdrop_path});
  background-size: cover;
  background-position: center;
  filter: blur(50px) brightness(0.3);
  z-index: -1;
}

/* Переиспользуем стили для hero секции из HomePage.vue */
.hero-section {
  position: relative;
  height: 85vh;
  width: 100%;
  margin: 0;
  border-radius: 0 0 24px 24px;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
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
    180deg,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.6) 50%,
    rgba(10, 10, 10, 1) 100%
  ),
  linear-gradient(
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
  max-width: 400px;
  height: auto;
  max-height: 120px;
  object-fit: contain;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.7)) invert(0) !important;
}

.title {
  color: white;
  font-size: 3rem;
  margin: 0;
  line-height: 1.2;
}

/* Добавляем новые стили */
.meta-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  margin: 1rem 0;
}

.dot {
  color: rgba(255, 255, 255, 0.4);
}

.genres {
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
  margin-bottom: 1rem;
}

.overview {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  max-width: 700px;
}

.actions {
  display: flex;
  gap: 1rem;
}

.watch-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #ffffff;
  color: #000000;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.trailer-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.watch-button:hover,
.trailer-button:hover {
  transform: scale(1.05);
}

/* Медиа-запрос для мобильных устройств */
@media (max-width: 768px) {
  .details-page {
    padding-right: 0;
  }

  .hero-section {
    height: auto;
    min-height: 100vh;
  }

  .hero-content {
    padding: 1rem;
    margin-top: 50%;
  }

  .meta-info {
    font-size: 0.9rem;
    flex-wrap: wrap;
  }

  .overview {
    font-size: 1rem;
    margin-bottom: 1.5rem;
  }

  .actions {
    flex-direction: column;
    gap: 0.75rem;
  }

  .watch-button,
  .trailer-button {
    width: 100%;
    justify-content: center;
  }

  .favorite-btn {
    max-width: none;
  }
}

/* Добавляем стили для кнопки избранного */
.favorite-btn {
  max-width: 200px;
}

.progress {
  color: #4CAF50;
  font-weight: 500;
}
</style>
