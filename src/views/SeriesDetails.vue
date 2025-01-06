<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import VideoPlayer from '../components/VideoPlayer.vue';
import FavoriteButton from '../components/FavoriteButton.vue';
import ShareButton from '../components/ShareButton.vue';
import { Icon } from '@iconify/vue';

const API_KEY = 'd341436234a2bb8f0adc73114e093ab2';
const BASE_URL = 'https://apitmdb.cub.red/3';

const route = useRoute();
const router = useRouter();
const series = ref(null);
const loading = ref(true);

const handlePlayerOpen = () => {
  router.push({ 
    query: { 
      ...route.query,
      hideMenu: 'true'
    }
  });
};

const handlePlayerClose = () => {
  const query = { ...route.query };
  delete query.hideMenu;
  router.push({ query });
};

const getSeasonText = (count) => {
  if (count === 1) return 'сезон';
  if (count >= 2 && count <= 4) return 'сезона';
  return 'сезонов';
};

const translateCastNames = async (cast) => {
  try {
    // Получаем русские данные о сериале с актерами
    const ruResponse = await fetch(
      `${BASE_URL}/tv/${route.params.id}/credits?api_key=${API_KEY}&language=ru-RU`
    );
    const ruData = await ruResponse.json();
    
    // Создаем мапу русских имен по id актера
    const ruNamesMap = new Map(
      ruData.cast.map(actor => [actor.id, actor.name])
    );
    
    // Возвращаем русские имена, если есть, иначе оригинальные
    return cast.map(actor => ({
      ...actor,
      name: ruNamesMap.get(actor.id) || actor.name
    }));
  } catch (error) {
    console.error('Error translating names:', error);
    return cast;
  }
};

const fetchSeriesDetails = async () => {
  try {
    const [detailsResponse] = await Promise.all([
      fetch(`${BASE_URL}/tv/${route.params.id}?api_key=${API_KEY}&language=ru-RU&append_to_response=credits`)
    ]);
    
    const [details] = await Promise.all([
      detailsResponse.json()
    ]);
    
    // Получаем дополнительную информацию о сериале, включая release_quality
    const seriesInfoResponse = await fetch(
      `${BASE_URL}/discover/tv?api_key=${API_KEY}&language=ru-RU`
    );
    const seriesInfo = await seriesInfoResponse.json();
    const currentSeries = seriesInfo.results?.find(s => s.id === details.id);
    
    series.value = {
      ...details,
      release_quality: currentSeries?.release_quality
    };
    console.log('Series details:', series.value);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    loading.value = false;
  }
};

const getCurrentUrl = () => window.location.href;

const getQualityText = (quality) => {
  switch (quality) {
    case 'HD':
      return 'HD';
    case 'FHD':
      return 'Full HD';
    case '4K':
      return '4K UHD';
    case 'webdl':
      return 'WEB-DL';
    case 'ts':
      return 'TS';
    case 'cam':
      return 'CAM';
    case 'web':
      return 'WEB';
    case 'dvdrip':
      return 'DVDRip';
    case 'bdrip':
      return 'BDRip';
    case 'hdrip':
      return 'HDRip';
    case 'webrip':
      return 'WEBRip';
    case 'tvrip':
      return 'TVRip';
    case 'hdtv':
      return 'HDTV';
    case 'bluray':
      return 'Blu-ray';
    case 'remux':
      return 'Remux';
    case 'uhd':
      return 'UHD';
    case 'sd':
      return 'SD';
    case 'dvd':
      return 'DVD';
    case 'screener':
      return 'Screener';
    case 'tc':
      return 'TC';
    default:
      return quality || 'Неизвестно';
  }
};

onMounted(() => {
  fetchSeriesDetails();
});
</script>

<template>
  <div class="series-details">
    <div class="backdrop" :style="{ backgroundImage: `url(https://imagetmdb.com/t/p/original${series?.backdrop_path})` }">
    </div>
    <div v-if="loading" class="loading">
      <div class="loader"></div>
    </div>
    <div v-else-if="series">
      <div class="content">
        <h1 class="details-title">{{ series.name }}</h1>
        <div class="content-wrapper">
          <div class="left-column">
            <div class="buttons-group">
              <VideoPlayer 
                :id="series.id.toString()"
                type="tv"
                :title="series.name"
                class="watch-button"
                @player-opened="handlePlayerOpen"
                @player-closed="handlePlayerClose"
              />
              <div class="secondary-buttons">
                <FavoriteButton 
                  :item="series"
                  type="tv"
                />
                <ShareButton 
                  :url="getCurrentUrl()"
                />
              </div>
            </div>
          </div>

          <div class="right-column">
            <div class="header-ratings">
              <div class="rating-item">
                <span class="rating-value">{{ series.vote_average.toFixed(1) }}</span>
              </div>
              <span class="year">{{ new Date(series.first_air_date).getFullYear() }}</span>
              <span class="seasons">{{ series.number_of_seasons }} {{ getSeasonText(series.number_of_seasons) }}</span>
              <span class="quality">
                {{ getQualityText(series.release_quality) }}
              </span>
              <div class="country-item" v-if="series.production_countries?.[0]">
                <Icon 
                  :icon="`circle-flags:${series.production_countries[0].iso_3166_1.toLowerCase()}`" 
                  class="flag-icon"
                />
              </div>
              <span class="genres">
                {{ series.genres?.map(genre => genre.name).join(', ') }}
              </span>
            </div>

            <p class="overview">{{ series.overview }}</p>

            <div class="credits">
              <div class="credit-section">
                <h3>В ролях:</h3>
                <div class="actors-list">
                  {{ series.credits?.cast?.slice(0, 5).map(actor => actor.name).join(', ') }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.series-details {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background-size: cover;
  background-position: center;
  filter: brightness(0.5);
  z-index: -1;
}

.backdrop::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(0, 0, 0, 0.7) 50%,
    rgba(0, 0, 0, 0.9) 100%
  );
}

.content {
  padding: 3rem;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  min-height: 100vh;
  z-index: 1;
}

.content-wrapper {
  display: flex;
  gap: 4rem;
  margin-top: 2rem;
}

.left-column {
  flex: 1;
  max-width: 400px;
}

.right-column {
  flex: 2;
}

.buttons-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.secondary-buttons {
  display: flex;
  gap: 1rem;
}

.secondary-buttons > * {
  flex: 1;
}

.watch-button {
  width: 100%;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  background-color: rgba(255, 255, 255, 0.1);
  transition: background-color 0.2s ease;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: white;
}

.watch-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.details-title {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.overview {
  font-size: 1.1rem;
  line-height: 1.8;
  color: var(--text-secondary);
  max-width: 800px;
  margin-bottom: 2rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.header-ratings {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  height: 32px;
}

.rating-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 100%;
}

.rating-value {
  font-size: 1.2rem;
  font-weight: 600;
  line-height: 32px;
}

.rating-icon {
  font-size: 24px;
  color: #f5c518;
}

.year, .genres, .seasons, .quality {
  color: var(--text-secondary);
  font-size: 1rem;
  font-weight: 500;
  line-height: 32px;
  display: flex;
  align-items: center;
}

.quality {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 0 12px;
  border-radius: 4px;
  font-weight: 600;
}

.credit-section {
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.credit-section h3 {
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 600;
}

.actors-list {
  color: var(--text-primary);
  font-size: 1rem;
}

.country-item {
  height: 32px;
  display: flex;
  align-items: center;
}

.flag-icon {
  width: 24px;
  height: 24px;
}

@media (max-width: 768px) {
  .content-wrapper {
    flex-direction: column;
    gap: 2rem;
  }

  .left-column {
    max-width: 100%;
  }
}
</style> 