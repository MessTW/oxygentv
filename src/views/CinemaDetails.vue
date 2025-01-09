<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useContentStore } from '../stores/content';
import VideoPlayer from '../components/VideoPlayer.vue';
import FavoriteButton from '../components/FavoriteButton.vue';
import ShareButton from '../components/ShareButton.vue';
import { Icon } from '@iconify/vue';

const API_KEY = 'd341436234a2bb8f0adc73114e093ab2';
const BASE_URL = 'https://apitmdb.cub.red/3';

const route = useRoute();
const content = ref(null);
const loading = ref(true);
const contentStore = useContentStore();

const isMovie = computed(() => route.name === 'movie');
const contentType = computed(() => isMovie.value ? 'movie' : 'series');

const getSeasonText = (count) => {
  if (count === 1) return 'сезон';
  if (count >= 2 && count <= 4) return 'сезона';
  return 'сезонов';
};

const getQualityText = (quality) => {
  const qualityMap = {
    '4k': '4K UHD',
    'fhd': 'Full HD',
    'hd': 'HD',
    'sd': 'SD',
    '4K': '4K UHD',
    'HD': 'HD',
    'FHD': 'Full HD',
    'webdl': 'WEB-DL',
    'ts': 'TS',
    'cam': 'CAM',
    'web': 'WEB',
    'dvdrip': 'DVDRip',
    'bdrip': 'BDRip',
    'hdrip': 'HDRip',
    'webrip': 'WEBRip',
    'tvrip': 'TVRip',
    'hdtv': 'HDTV',
    'bluray': 'Blu-ray',
    'remux': 'Remux',
    'uhd': 'UHD',
    'dvd': 'DVD',
    'screener': 'Screener',
    'tc': 'TC'
  };
  return qualityMap[quality] || quality || 'Неизвестно';
};

const getMovieQuality = (id) => {
  const movie = contentStore.movies.find(m => m.id === Number(id));
  if (movie?.release_quality) {
    return movie.release_quality;
  }

  if (content.value) {
    return content.value.release_quality ||
           content.value.quality ||
           content.value.video_quality ||
           'N/A';
  }

  return 'N/A';
};

const fetchDetails = async () => {
  try {
    const type = route.name === 'movie' ? 'movie' : 'tv';
    const detailsResponse = await fetch(
      `${BASE_URL}/${type}/${route.params.id}?api_key=${API_KEY}&language=ru-RU&append_to_response=credits,videos`
    );
    const details = await detailsResponse.json();

    const imagesResponse = await fetch(
      `${BASE_URL}/${type}/${route.params.id}/images?api_key=${API_KEY}`
    );
    const imagesData = await imagesResponse.json();

    console.log('Raw API response:', details);
    console.log('Images response:', imagesData);

    if (details.blocked === true || (!details.title && !details.name) || !details.id) {
      content.value = {
        id: route.params.id,
        name: 'Контент недоступен',
        overview: 'К сожалению, этот контент сейчас недоступен для просмотра.',
        blocked: true
      };
      return;
    }

    const filterLogos = (logos, language) => {
      if (!logos) return null;
      return logos
        .filter(logo =>
          logo.iso_639_1 === language &&
          logo.file_path &&
          (language === 'ru' || (
            logo.aspect_ratio >= 2 &&
            logo.aspect_ratio <= 5 &&
            logo.height >= 100 &&
            logo.height <= 200
          ))
        )
        [0];
    };

    const russianLogo = filterLogos(imagesData.logos, 'ru');
    const englishLogo = filterLogos(imagesData.logos, 'en');
    const anyLogo = imagesData.logos
      ?.filter(logo =>
        logo.file_path &&
        logo.aspect_ratio >= 2 &&
        logo.aspect_ratio <= 5 &&
        logo.height >= 100 &&
        logo.height <= 200
      )
      [0];

    content.value = {
      ...details,
      blocked: details.blocked || false,
      title: details.title || details.name,
      release_date: details.release_date || details.first_air_date,
      release_quality: getMovieQuality(route.params.id),
      logo_path: russianLogo?.file_path || englishLogo?.file_path || anyLogo?.file_path || null
    };

  } catch (error) {
    console.error('Error fetching details:', error);
  } finally {
    loading.value = false;
  }
};

const getCurrentUrl = () => window.location.href;

onMounted(() => {
  fetchDetails();
});

watch(() => content.value, (newData) => {
  if (newData?.title || newData?.name) {
    document.title = `${newData.title || newData.name}`
  }
})
</script>

<template>
  <div class="page-wrapper">
    <div class="cinema-details">
      <div class="backdrop" :style="content?.backdrop_path ? {
        backgroundImage: `url(https://imagetmdb.com/t/p/original${content.backdrop_path})`
      } : { backgroundColor: '#000' }">
      </div>
      <div v-if="loading" class="loading">
        <div class="loader"></div>
      </div>
      <div v-else-if="content">
        <div class="content">
          <div v-if="content.blocked" class="blocked-notice">
            <div class="blocked-content">
              <Icon icon="mdi:lock" class="lock-icon" width="48" />
              <h1>{{ content.title }}</h1>
              <p>{{ content.overview }}</p>
              <button class="home-button" @click="$router.push('/')">
                <Icon icon="mdi:home" width="24" />
                <span>На главную</span>
              </button>
            </div>
          </div>
          <div v-else class="content-wrapper">
            <div class="title-container">
              <img
                v-if="content.logo_path"
                :src="`https://imagetmdb.com/t/p/w500${content.logo_path}`"
                :alt="content.title"
                class="movie-logo"
              >
              <h1 v-else class="details-title">{{ content.title }}</h1>
            </div>
            <div class="left-column">
              <div class="meta-line">
                <span class="quality">
                  {{ getQualityText(content.release_quality || getMovieQuality(route.params.id)) }}
                </span>
                <span class="rating">{{ content.vote_average?.toFixed(1) || 'N/A' }}</span>
                <span class="dot-separator">•</span>
                <span v-if="content.release_date">
                  {{ new Date(content.release_date).getFullYear() }}
                </span>
                <span class="dot-separator">•</span>
                <div class="country-item" v-if="content.production_countries?.[0]">
                  <Icon
                    :icon="`flagpack:${content.production_countries[0].iso_3166_1.toLowerCase()}`"
                    class="flag-icon"
                  />
                </div>
                <span class="dot-separator">•</span>
                <span class="genres" v-if="content.genres?.length">
                  {{ content.genres?.map(genre => genre.name).join(', ') }}
                </span>
                <span class="dot-separator">•</span>
                <span v-if="!isMovie && content.number_of_seasons">
                  {{ content.number_of_seasons }} {{ getSeasonText(content.number_of_seasons) }}
                </span>
                <span v-if="content.runtime || content.episode_run_time?.[0]">
                  {{ content.runtime || content.episode_run_time[0] }} мин
                </span>
              </div>
              <p class="overview" v-if="content.overview">{{ content.overview }}</p>
              <div class="buttons-group">
                <div class="primary-buttons">
                  <VideoPlayer
                    :id="content.id.toString()"
                    :type="contentType"
                    :title="content.title"
                    class="watch-button"
                  />
                  <button
                    class="torrent-button"
                    @click="$router.push(`/${contentType}/${content.id}/torrent`)"
                  >
                    <Icon icon="mdi:download" width="24" />
                    Торренты
                  </button>
                  <div class="secondary-buttons">
                  <FavoriteButton
                    :item="content"
                    :type="contentType"
                  />
                  <ShareButton
                    :url="getCurrentUrl()"
                  />
                </div>
                </div>

              </div>
            </div>

            <div class="right-column">
              <div class="credits">
                <div class="credit-section" v-if="isMovie && content.credits?.crew">
                  <h3>Режиссеры:</h3>
                  <div class="persons-list">
                    <div v-for="director in content.credits?.crew?.filter(person => person.job === 'Director')"
                         :key="director.id"
                         class="person-card">
                      <img
                        :src="director.profile_path ? `https://imagetmdb.com/t/p/w185${director.profile_path}` : 'https://via.placeholder.com/185x278/1a1a1a/5f5f5f?text=No+Photo'"
                        :alt="director.name"
                        class="person-photo"
                      >
                      <div class="person-info">
                        <span class="person-name">{{ director.name }}</span>
                        <span class="person-role">Режиссер</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="credit-section">
                  <h3>В ролях:</h3>
                  <div class="persons-list">
                    <div v-for="actor in content.credits?.cast?.slice(0, 6)"
                         :key="actor.id"
                         class="person-card">
                      <img
                        :src="actor.profile_path ? `https://imagetmdb.com/t/p/w185${actor.profile_path}` : 'https://via.placeholder.com/185x278/1a1a1a/5f5f5f?text=No+Photo'"
                        :alt="actor.name"
                        class="person-photo"
                      >
                      <div class="person-info">
                        <span class="person-name">{{ actor.name }}</span>
                        <span class="person-role">{{ actor.character }}</span>
                      </div>
                    </div>
                  </div>
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
.page-wrapper {
  min-height: 100vh;
}

.cinema-details {
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
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  min-height: 100vh;
  z-index: 0;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-top: 2rem;
}

.left-column {
  width: 100%;
}

.right-column {
  width: 100%;
}

.details-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--text-primary);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.meta-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  color: var(--text-secondary);
  font-size: 1rem;
  flex-wrap: wrap;
}

.dot-separator {
  color: var(--text-secondary);
  opacity: 0.5;
}

.rating {
  font-weight: 600;
  color: var(--text-primary);
}

.buttons-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
  max-width: 400px;
}

.secondary-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.overview {
  font-size: 1.1rem;
  line-height: 1.8;
  color: var(--text-secondary);
  max-width: 800px;
  margin-bottom: 2rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.country-item {
  height: 32px;
  display: flex;
  align-items: center;
}

.flag-icon {
  width: 24px;
  height: 24px;
  border-radius: 8px;
}

.genres {
  color: var(--text-secondary);
}

.credit-section {
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.credit-section h3 {
  color: var(--text-secondary);
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.persons-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.person-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.person-photo {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.person-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.person-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.person-role {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.blocked-notice {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.9);
}

.blocked-content {
  max-width: 500px;
  width: 100%;
  text-align: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.blocked-content h1 {
  font-size: 1.5rem;
  margin: 1rem 0;
  color: white;
}

.blocked-notice p {
  color: var(--text-secondary);
  margin: 0;
  font-size: 1.1rem;
  margin-bottom: 2rem;
  line-height: 1.5;
}

.lock-icon {
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.home-button {
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
  backdrop-filter: blur(10px);
  margin: 0 auto;
}

.home-button:hover {
  background: var(--button-hover);
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .content {
    padding: 1rem;
  }

  .details-title {
    font-size: 1.75rem;
  }

  .buttons-group {
    max-width: 100%;
    flex-direction: column;
  }

  .meta-line {
    font-size: 0.9rem;
    gap: 0.35rem;
  }

  .overview {
    font-size: 1rem;
    line-height: 1.6;
  }

  .credit-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .persons-list {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .person-card {
    padding: 0.5rem;
  }

  .person-photo {
    aspect-ratio: 2/3;
    height: auto;
  }

  .person-info {
    padding: 0.5rem;
  }

  .person-name {
    font-size: 0.8rem;
  }

  .person-role {
    font-size: 0.7rem;
  }

  .secondary-buttons {
    justify-content: center;
  }

  .flag-icon {
    width: 20px;
    height: 20px;
  }

  .country-item {
    height: 24px;
  }

  .movie-logo {
    max-width: 100%;
  }

  .title-container {
    max-width: 280px;
    margin: 0 auto 1.5rem;
  }

  .primary-buttons {
    flex-direction: column;
  }

  .torrent-button {
    width: 100%;
  }
}

@media (max-width: 360px) {
  .persons-list {
    gap: 0.5rem;
  }

  .person-card {
    padding: 0.25rem;
  }

  .person-info {
    padding: 0.25rem;
  }
}

@media (min-width: 1024px) {
  .content {
    padding: 3rem;
  }

  .content-wrapper {
    max-width: 900px;
    margin: 0 auto;
  }

  .left-column {
    width: 100%;
  }

  .right-column {
    margin-top: 2rem;
  }

  .details-title {
    font-size: 3rem;
    margin-bottom: 2rem;
  }

  .persons-list {
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem;
  }

  .person-card {
    padding: 1rem;
  }

  .person-photo {
    height: 200px;
  }

  .person-name {
    font-size: 1.1rem;
  }

  .person-role {
    font-size: 1rem;
  }

  .buttons-group {
    flex-direction: row;
    align-items: center;
    max-width: none;
    gap: 1rem;
  }

  .watch-button {
    flex: 1;
    max-width: 400px;
  }

  .secondary-buttons {
    flex-direction: row;
    gap: 1rem;
    margin: 0;
  }

  .title-container {
    margin: 0 0 2rem;
  }
}

@media (min-width: 1280px) {
  .content-wrapper {
    max-width: 1100px;
  }

  .persons-list {
    grid-template-columns: repeat(5, 1fr);
  }
}

.quality {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 0 12px;
  border-radius: 4px;
  font-weight: 600;
  min-width: 60px;
  text-align: center;
}

.title-container {
  margin-bottom: 2rem;
  max-width: 400px;
}

.movie-logo {
  max-width: 100%;
  width: 100%;
  height: auto;
  filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.5));
}

.primary-buttons {
  display: flex;
  gap: 1rem;
  width: 100%;
}

.torrent-button {
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
  min-width: 140px;
}

.torrent-button:hover {
  background: var(--button-hover);
}

@media (max-width: 768px) {
  .primary-buttons {
    flex-direction: column;
  }

  .torrent-button {
    width: 100%;
  }
}
</style>
