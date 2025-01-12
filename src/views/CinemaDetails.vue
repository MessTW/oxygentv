<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useContentStore } from '../stores/content';
import VideoPlayer from '../components/VideoPlayer.vue';
import FavoriteButton from '../components/FavoriteButton.vue';
import ShareButton from '../components/ShareButton.vue';
import { Icon } from '@iconify/vue';
import AllohaPlayer from '../components/AllohaPlayer.vue';

const API_KEY = 'd341436234a2bb8f0adc73114e093ab2';
const BASE_URL = 'https://apitmdb.cub.red/3';
const IMAGE_BASE_URL = 'https://imagetmdb.com/t/p';

const route = useRoute();
const router = useRouter();
const movieData = ref(null);
const isLoading = ref(true);
const error = ref(null);
const showTitle = ref(false);
const seasons = ref([]);
const selectedSeason = ref(null);
const isLoadingSeasons = ref(false);

const handleLogoError = () => {
  showTitle.value = true;
};

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

const getMovieQuality = () => {
  const movie = contentStore.movies.find(m => m.id === Number(route.params.id));
  if (movie?.release_quality) {
    return movie.release_quality;
  }

  if (movieData.value) {
    return movieData.value.release_quality ||
           movieData.value.quality ||
           movieData.value.video_quality ||
           'N/A';
  }

  return 'N/A';
};

const fetchSeasons = async () => {
  if (!isMovie.value && movieData.value?.id) {
    try {
      isLoadingSeasons.value = true;

      // Получаем сезоны из основных данных сериала
      if (movieData.value.seasons) {
        // Фильтруем сезоны, исключая спецматериалы
        seasons.value = movieData.value.seasons
          .filter(season => season.season_number !== 0) // Исключаем спецвыпуски (season_number = 0)
          .map(season => ({
            ...season,
            episodes: []
          }));

        // Загружаем детали для каждого сезона
        await Promise.all(seasons.value.map(async (season) => {
          try {
            const seasonResponse = await fetch(
              `${BASE_URL}/tv/${movieData.value.id}/season/${season.season_number}?api_key=${API_KEY}&language=ru`
            );
            if (seasonResponse.ok) {
              const seasonData = await seasonResponse.json();
              // Фильтруем эпизоды, исключая спецвыпуски если они есть
              season.episodes = (seasonData.episodes || [])
                .filter(episode => episode.season_number !== 0);
            }
          } catch (err) {
            console.error(`Error fetching season ${season.season_number}:`, err);
            season.episodes = [];
          }
        }));

        if (seasons.value.length > 0) {
          selectedSeason.value = seasons.value[0];
        }
      }

      // Сохраняем данные о сериях для использования в плеере
      const seasonsData = seasons.value.reduce((acc, season) => {
        acc[season.season_number] = season.episodes.length;
        return acc;
      }, {});

      localStorage.setItem('currentSeriesData', JSON.stringify({
        seasons: seasonsData
      }));

    } catch (err) {
      console.error('Error fetching seasons:', err);
    } finally {
      isLoadingSeasons.value = false;
    }
  }
};

const fetchDetails = async () => {
  try {
    isLoading.value = true;
    const type = isMovie.value ? 'movie' : 'tv';
    const response = await fetch(
      `${BASE_URL}/${type}/${route.params.id}?api_key=${API_KEY}&language=ru&append_to_response=videos,credits,external_ids`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch movie details');
    }

    const data = await response.json();
    movieData.value = data;

    if (movieData.value.images?.logos?.length > 0) {
      const ruLogo = movieData.value.images.logos.find(logo => logo.iso_639_1 === 'ru');
      const enLogo = movieData.value.images.logos.find(logo => logo.iso_639_1 === 'en');
      movieData.value.logo_path = (ruLogo || enLogo)?.file_path;
    }
    document.title = `${movieData.value.title || movieData.value.name} | oxyge tv`;

    // Fetch seasons only if it's a series
    if (!isMovie.value) {
      await fetchSeasons();
    }

    isLoading.value = false;

  } catch (err) {
    console.error(err);
    error.value = err.message;
    isLoading.value = false;
    router.push('/');
  }
};

const getCurrentUrl = () => window.location.href;

onMounted(async () => {
  fetchDetails();
});

watch(() => movieData.value, (newData) => {
  if (newData?.title || newData?.name) {
    document.title = `${newData.title || newData.name}`
  }
})

const formattedItem = computed(() => {
  if (!movieData.value) return null;

  return {
    title: movieData.value.title || movieData.value.name || '',
    id: movieData.value.id?.toString() || '',
    imdb_id: movieData.value.imdb_id || '',
    year: (movieData.value.release_date || movieData.value.first_air_date)?.split('-')[0] || '',
    // ... другие свойства
  }
})
</script>

<template>
  <div class="page-wrapper">
    <div class="cinema-details">
      <div class="backdrop" :style="movieData?.backdrop_path ? {
        backgroundImage: `url(${IMAGE_BASE_URL}/original${movieData.backdrop_path})`
      } : { backgroundColor: '#000' }">
      </div>
      <div v-if="isLoading" class="loading">
        <div class="loader"></div>
      </div>
      <div v-else-if="movieData">
        <div class="content">
          <div v-if="movieData.blocked" class="blocked-notice">
            <div class="blocked-content">
              <Icon icon="mdi:lock" class="lock-icon" width="48" />
              <h1>{{ movieData.title }}</h1>
              <p>{{ movieData.overview }}</p>
              <button class="home-button" @click="$router.push('/')">
                <Icon icon="mdi:home" width="24" />
                <span>На главную</span>
              </button>
            </div>
          </div>
          <div v-else class="content-wrapper">
            <div class="title-container">
              <img
                v-if="movieData.logo_path"
                :src="`${IMAGE_BASE_URL}/original${movieData.logo_path}`"
                :alt="movieData.title"
                class="movie-logo"
                @error="handleLogoError"
              >
              <h1 v-if="!movieData.logo_path || showTitle" class="details-title">
                {{ movieData.title || movieData.name }}
              </h1>
            </div>
            <div class="left-column">
              <div class="meta-line">
                <span class="quality">
                  {{ getQualityText(movieData.release_quality || getMovieQuality()) }}
                </span>
                <span class="rating">{{ movieData.vote_average?.toFixed(1) || 'N/A' }}</span>
                <span class="dot-separator">•</span>
                <span v-if="movieData.release_date">
                  {{ new Date(movieData.release_date).getFullYear() }}
                </span>
                <span class="dot-separator">•</span>
                <div class="country-item" v-if="movieData.production_countries?.[0]">
                  <Icon
                    :icon="`flagpack:${movieData.production_countries[0].iso_3166_1.toLowerCase()}`"
                    class="flag-icon"
                  />
                </div>
                <span class="dot-separator">•</span>
                <span class="genres" v-if="movieData.genres?.length">
                  {{ movieData.genres?.map(genre => genre.name).join(', ') }}
                </span>
                <span class="dot-separator">•</span>
                <span v-if="!isMovie && movieData.number_of_seasons">
                  {{ movieData.number_of_seasons }} {{ getSeasonText(movieData.number_of_seasons) }}
                </span>
                <span v-if="movieData.runtime || movieData.episode_run_time?.[0]">
                  {{ movieData.runtime || movieData.episode_run_time[0] }} мин
                </span>
              </div>
              <p class="overview" v-if="movieData.overview">{{ movieData.overview }}</p>
              <div v-if="!isMovie && seasons.length > 0" class="seasons-section">
                <div class="seasons-header">
                  <h3>Сезоны</h3>
                  <div class="seasons-selector">
                    <select v-model="selectedSeason" class="season-select" :disabled="isLoadingSeasons">
                      <option v-for="season in seasons"
                              :key="season.id"
                              :value="season">
                        {{ season.name }}
                      </option>
                    </select>
                  </div>
                </div>

                <div v-if="isLoadingSeasons" class="episodes-loading">
                  <div class="loader"></div>
                </div>

                <div v-else-if="selectedSeason" class="episodes-list">
                  <div v-for="episode in selectedSeason.episodes"
                       :key="episode.id"
                       class="episode-card">
                    <div class="episode-image">
                      <img :src="episode.still_path ?
                                 `${IMAGE_BASE_URL}/w300${episode.still_path}` :
                                 'https://via.placeholder.com/300x170/1a1a1a/5f5f5f?text=No+Image'"
                           :alt="episode.name"
                           class="episode-still">
                    </div>
                    <div class="episode-info">
                      <div class="episode-header">
                        <h4>{{ episode.episode_number }}. {{ episode.name }}</h4>
                        <div class="episode-buttons">
                          <AllohaPlayer
                            :tmdbId="route.params.id"
                            :season="selectedSeason?.season_number"
                            :episode="episode.episode_number"
                            :type="contentType"
                          />
                        </div>
                      </div>
                      <p class="episode-overview">{{ episode.overview || 'Описание отсутствует' }}</p>
                      <div class="episode-meta">
                        <span class="air-date">{{ new Date(episode.air_date).toLocaleDateString('ru-RU') }}</span>
                        <span class="runtime" v-if="episode.runtime">{{ episode.runtime }} мин</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="buttons-group">
                <div class="primary-buttons">
                  <VideoPlayer
                    :tmdb-id="formattedItem.id"
                    :imdb-id="formattedItem.imdb_id"
                    :year="formattedItem.year"
                    :type="contentType"
                    :title="formattedItem.title"
                    class="watch-button"
                  />
                  <button
                    class="torrent-button"
                    @click="$router.push({
                      name: `${contentType}-torrents`,
                      params: { id: movieData.id }
                    })"
                  >
                    <Icon icon="mdi:download" width="24" />
                    Торренты
                  </button>
                  <div class="secondary-buttons">
                  <FavoriteButton
                    :item="movieData"
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
                <div
                  class="credit-section"
                  v-if="isMovie && movieData.credits?.crew?.some(person => person.job === 'Director')"
                >
                  <h3>Режиссеры:</h3>
                  <div class="persons-list">
                    <div v-for="director in movieData.credits?.crew?.filter(person => person.job === 'Director')"
                         :key="director.id"
                         class="person-card">
                      <img
                        :src="director.profile_path ? `${IMAGE_BASE_URL}/w500${director.profile_path}` : 'https://via.placeholder.com/185x278/1a1a1a/5f5f5f?text=No+Photo'"
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
                <div
                  class="credit-section"
                  v-if="movieData.credits?.cast?.length > 0"
                >
                  <h3>В ролях:</h3>
                  <div class="persons-list">
                    <div v-for="actor in movieData.credits?.cast?.slice(0, 6)"
                         :key="actor.id"
                         class="person-card">
                      <img
                        :src="actor.profile_path ? `${IMAGE_BASE_URL}/w500${actor.profile_path}` : 'https://via.placeholder.com/185x278/1a1a1a/5f5f5f?text=No+Photo'"
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
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
  min-height: 60px;
}

.movie-logo {
  max-height: 60px;
  max-width: 100%;
  object-fit: contain;
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

.seasons-section {
  margin-top: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
}

.seasons-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.seasons-header h3 {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin: 0;
}

.season-select {
  padding: 8px 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text-primary);
  font-size: 1rem;
  cursor: pointer;
}

.episodes-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.episode-card {
  display: flex;
  gap: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  overflow: hidden;
}

.episode-image {
  flex: 0 0 200px;
  position: relative;
}

.episode-play-button {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.episode-image:hover .episode-play-button {
  opacity: 1;
}

.episode-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.episode-play-button-mobile {
  display: none;
}

@media (max-width: 768px) {
  .episode-play-button {
    display: none;
  }

  .episode-play-button-mobile {
    display: block;
  }

  .episode-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}

.episode-still {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.episode-info {
  flex: 1;
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.episode-info h4 {
  margin: 0 0 0.5rem;
  color: var(--text-primary);
  font-size: 1.1rem;
}

.episode-overview {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0 0 auto;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.episode-meta {
  margin-top: 1rem;
  display: flex;
  gap: 1rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .episode-card {
    flex-direction: column;
  }

  .episode-image {
    flex: 0 0 auto;
  }

  .episode-still {
    aspect-ratio: 16/9;
  }

  .seasons-header {
    flex-direction: column;
    gap: 1rem;
  }

  .season-select {
    width: 100%;
  }
}

/* Добавим стили для прозрачной кнопки воспроизведения */
:deep(.transparent-play-button) {
  background: transparent;
  border: 2px solid white;
  padding: 8px 16px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.episode-buttons {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

@media (max-width: 768px) {
  .episode-buttons {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
