<template>
  <div class="details-page">
    <div class="preview-modal">
      <div class="studio-tag" v-if="getStudioInfo">
        <span class="studio-name">{{ getStudioInfo.name }}</span>
        <span class="original-text"></span>
      </div>

      <div class="preview-modal-player" :style="movieData?.backdrop_path ? {
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.9) 100%), url(https://imagetmdb.com/t/p/original${movieData.backdrop_path})`
      } : { backgroundColor: '#000' }">
      </div>
    </div>

    <div class="preview-modal-info">


      <div class="header-info">
        <div class="poster-wrapper">
          <img
            v-if="movieData?.poster_path"
            :src="`https://imagetmdb.com/t/p/w500${movieData.poster_path}`"
            :alt="movieData?.title || movieData?.name"
            class="poster"
          />
          <FavoriteButton
            v-if="movieData"
            :item="movieData"
            :type="isMovie ? 'movie' : 'tv'"
            class="favorite-button-wrapper"
          />
        </div>
        <div class="content-info">
          <h1 class="title">{{ movieData?.title || movieData?.name }}</h1>
          <div class="meta-info">
            <span class="year">{{ getYear(movieData) }}</span>
            <span class="duration" v-if="isMovie">{{ Math.floor(movieData?.runtime / 60) }}ч {{ movieData?.runtime % 60 }}м</span>
            <span class="seasons" v-else>{{ movieData?.number_of_seasons }} сезона</span>
          </div>
          <div class="actions">
            <AllohaPlayer
              v-if="isMovie && movieData?.id"
              :tmdb-id="movieData?.id"
              :type="'movie'"
              class="watch-button"
            />
          </div>
          <div class="preview-modal-tab-content">
            <div
              class="preview-modal-tab"
              :class="{ active: activeTab === 'ОПИСАНИЕ' }"
              @click="activeTab = 'ОПИСАНИЕ'"
            >
              ОПИСАНИЕ
            </div>
            <div
              v-if="!isMovie && canShowEpisodes"
              class="preview-modal-tab"
              :class="{ active: activeTab === 'ЭПИЗОДЫ' }"
              @click="activeTab = 'ЭПИЗОДЫ'"
            >
              ЭПИЗОДЫ
            </div>
            <div
              class="preview-modal-tab"
              :class="{ active: activeTab === 'ПОХОЖЕЕ' }"
              @click="activeTab = 'ПОХОЖЕЕ'"
            >
              БОЛЬШЕ, ЧЕМ ПОХОЖИЙ
            </div>
          </div>

          <div v-if="activeTab === 'ОПИСАНИЕ'">
            <p class="overview">{{ movieData?.overview }}</p>
            <div class="info-meta">
              <div class="meta-item">
                <span class="meta-label">В главных ролях:</span>
                <span class="meta-value">{{ movieData?.credits?.cast?.slice(0, 3).map(actor => actor.name).join(', ') }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Режиссер:</span>
                <span class="meta-value">{{ movieData?.created_by?.[0]?.name || 'The Duffer Brothers' }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Жанр:</span>
                <span class="meta-value">{{ movieData?.genres?.map(genre => genre.name).join(', ') }}</span>
              </div>
            </div>
          </div>

          <div v-else-if="activeTab === 'ЭПИЗОДЫ' && canShowEpisodes" class="episodes-section">
            <div class="season-selector">
              <select v-model="selectedSeason" class="season-select">
                <option
                  v-for="season in filteredSeasons"
                  :key="season.id"
                  :value="season"
                >
                  Сезон {{ season.season_number }}
                </option>
              </select>
            </div>
            <div class="episodes-list">
              <AllohaPlayer
                v-for="episode in episodes"
                :key="episode.id"
                :tmdb-id="movieData?.id"
                :type="'tv'"
                :season="selectedSeason?.season_number"
                :episode="episode.episode_number"
                :episode-data="episode"
              />
            </div>
          </div>

          <div v-else-if="activeTab === 'ПОХОЖЕЕ'" class="similar-section">
            <div class="similar-list">
              <div
                v-for="item in similarContent"
                :key="item.id"
                class="similar-item"
                @click="navigateToDetails(item)"
              >
                <img
                  :src="item.poster_path ? `https://imagetmdb.com/t/p/w300${item.poster_path}` : '/no-image.jpg'"
                  :alt="item.name || item.title"
                />
                <div class="similar-overlay">
                  <div class="similar-info">
                    <div class="similar-title">{{ item.name || item.title }}</div>
                    <div class="similar-year">{{ getYear(item) }}</div>
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

<script setup>
import { ref, onMounted, computed, watch, onBeforeMount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AllohaPlayer from '../components/AllohaPlayer.vue';
import FavoriteButton from '../components/FavoriteButton.vue';

const API_KEY = 'd341436234a2bb8f0adc73114e093ab2';
const route = useRoute();
const router = useRouter();
const movieData = ref(null);
const selectedSeason = ref(null);
const episodes = ref([]);
const isLoading = ref(true);
const activeTab = ref('ОПИСАНИЕ');
const similarContent = ref([]);

const isMovie = computed(() => route.name === 'movie');

const getStudioInfo = computed(() => {
  if (!movieData.value) return null;

  if (isMovie.value) {
    // Для фильмов берем первую production company
    return movieData.value.production_companies?.[0];
  } else {
    // Для сериалов проверяем networks
    const netflix = movieData.value.networks?.find(n => n.name === 'Netflix');
    if (netflix) return netflix;

    // Если нет Netflix, берем первую сеть
    return movieData.value.networks?.[0] || movieData.value.production_companies?.[0];
  }
});

const filteredSeasons = computed(() => {
  if (!movieData.value?.seasons) return [];
  return movieData.value.seasons.filter(season => season.season_number > 0);
});

// Добавим computed свойство для проверки возможности отображения эпизодов
const canShowEpisodes = computed(() => {
  // Проверяем наличие сезонов
  if (!movieData.value?.seasons?.length || !filteredSeasons.value.length) {
    return false;
  }

  // Проверяем наличие эпизодов
  if (!episodes.value?.length) {
    return false;
  }

  // Проверяем, что у всех эпизодов есть необходимые данные
  const hasValidEpisodes = episodes.value.every(episode => {
    return (
      episode.name && // есть название
      episode.episode_number && // есть номер эпизода
      episode.runtime && // есть длительность
      (episode.still_path || episode.overview) // есть постер или описание
    );
  });

  return hasValidEpisodes;
});

onBeforeMount(() => {
  const state = router.currentRoute.value.state;
  if (state?.movieData) {
    movieData.value = state.movieData;
    if (!isMovie.value && filteredSeasons.value.length) {
      selectedSeason.value = filteredSeasons.value[0];
    }
    fetchDetails();
  } else {
    fetchDetails();
  }
});

const getYear = (item) => {
  if (!item) return '';
  const date = item.release_date || item.first_air_date;
  return date ? date.split('-')[0] : '';
};

const fetchDetails = async () => {
  try {
    isLoading.value = true;
    const type = isMovie.value ? 'movie' : 'tv';
    const response = await fetch(
      `https://apitmdb.cub.red/3/${type}/${route.params.id}?api_key=${API_KEY}&language=ru&append_to_response=credits`
    );
    movieData.value = await response.json();

    if (!isMovie.value && filteredSeasons.value.length) {
      selectedSeason.value = filteredSeasons.value[0];
    }

    // Загружаем похожий контент
    await fetchSimilarContent();
  } catch (error) {
    console.error('Error fetching details:', error);
  } finally {
    isLoading.value = false;
  }
};

const fetchEpisodes = async (seasonNumber) => {
  if (!seasonNumber) return;
  try {
    const response = await fetch(
      `https://apitmdb.cub.red/3/tv/${route.params.id}/season/${seasonNumber}?api_key=${API_KEY}&language=ru`
    );
    const data = await response.json();

    // Фильтруем эпизоды с недостающими данными
    episodes.value = data.episodes.filter(episode =>
      episode.name &&
      episode.episode_number &&
      episode.runtime &&
      (episode.still_path || episode.overview)
    );
  } catch (error) {
    console.error('Error fetching episodes:', error);
  }
};

const fetchSimilarContent = async () => {
  if (!movieData.value?.id) return;

  try {
    const type = isMovie.value ? 'movie' : 'tv';
    const response = await fetch(
      `https://apitmdb.cub.red/3/${type}/${movieData.value.id}/similar?api_key=${API_KEY}&language=ru&page=1`
    );
    const data = await response.json();

    // Получаем детальную информацию и фильтруем
    const detailedResults = await Promise.all(
      data.results.slice(0, 24).map(async (item) => { // Увеличиваем количество для фильтрации
        const detailResponse = await fetch(
          `https://apitmdb.cub.red/3/${type}/${item.id}?api_key=${API_KEY}&language=ru`
        );
        return detailResponse.json();
      })
    );

    // Фильтруем только контент с русскими названиями
    const filteredResults = detailedResults.filter(item => {
      // Проверяем наличие русского названия и описания
      const hasRussianTitle = item.name || item.title;
      const hasRussianOverview = item.overview;

      // Проверяем, что название содержит кириллицу
      const hasRussianChars = /[а-яёА-ЯЁ]/.test(hasRussianTitle);

      return hasRussianTitle && hasRussianOverview && hasRussianChars;
    });

    // Ограничиваем до 12 элементов после фильтрации
    similarContent.value = filteredResults.slice(0, 12);
  } catch (error) {
    console.error('Error fetching similar content:', error);
  }
};

const navigateToDetails = async (item) => {
  try {
    // Определяем тип контента по наличию полей
    const type = item.first_air_date ? 'tv' : 'movie';

    // Сначала загружаем детальную информацию
    const response = await fetch(
      `https://apitmdb.cub.red/3/${type}/${item.id}?api_key=${API_KEY}&language=ru`
    );
    const detailedData = await response.json();

    // Выполняем навигацию с полными данными
    await router.push({
      name: type,
      params: { id: item.id },
      state: { movieData: detailedData }
    });

    // После успешной навигации
    activeTab.value = 'ОПИСАНИЕ';

    // Убираем эти строки, так как данные обновятся через watch
    // movieData.value = detailedData;
    // if (!isMovie.value && filteredSeasons.value.length) {
    //   selectedSeason.value = filteredSeasons.value[0];
    //   await fetchEpisodes(selectedSeason.value.season_number);
    // }
  } catch (error) {
    console.error('Error navigating to details:', error);
  }
};

watch(selectedSeason, (newSeason) => {
  if (newSeason) {
    fetchEpisodes(newSeason.season_number);
  }
});

watch(
  () => route.params.id,
  async (newId) => {
    if (newId) {
      // Сбрасываем состояние
      movieData.value = null;
      similarContent.value = [];
      episodes.value = [];

      // Загружаем новые данные
      await fetchDetails();
    }
  }
);

onMounted(() => {
  fetchDetails();
});
</script>

<style scoped>
.details-page {
  min-height: 100vh;
  background: #141414;
  color: #fff;
}

.preview-modal {
  height: 100vh;
  background-size: cover;
  background-position: center 20%;
  position: relative;
  z-index: 1;
}

.preview-modal-player {
  width: 100%;
  height: 100vh;
  background-size: cover;
  background-position: center top;
  position: relative;
  z-index: 1;
}

.preview-modal-player-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-modal-button-player {
  width: 112px;
  height: 112px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.preview-modal-button-player:hover {
  transform: scale(1.1);
  background: rgba(255, 255, 255, 0.3);
}

.play-icon {
  font-size: 48px;
  color: #fff;
}

.preview-modal-info {
  padding: 0 4%;
  position: relative;
  margin-top: -85vh;
  z-index: 2;
  min-height: fit-content;
}

.preview-modal-tab-content {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.preview-modal-tab {
  padding: 0.5rem 0;
  color: #777;
  cursor: pointer;
  font-size: 1.2rem;
  position: relative;
}

.preview-modal-tab.active {
  color: #fff;
}

.preview-modal-tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: #ffffff;
}

.netflix-tag {
  font-size: 1.2rem;
  font-weight: 500;
  letter-spacing: 2px;
  margin-bottom: 1rem;
  color: #e5e5e5;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0.5rem 0;
  color: white;
}

.meta-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1rem 0;
  font-size: 1.1rem;
}

.dot {
  color: #646464;
}

.rating {
  color: #46d369;
  font-weight: 600;
}

.maturity-rating {
  border: 1px solid rgba(255, 255, 255, 0.4);
  padding: 0.1rem 0.5rem;
  border-radius: 2px;
}

.overview {
  font-size: 1.2rem;
  line-height: 1.5;
  margin: 1rem 0;
  max-width: 100%;
  color: #fff;
}

.info-meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 2rem;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.meta-label {
  color: #777;
  font-size: 0.9rem;
}

.meta-value {
  color: #fff;
  font-size: 0.9rem;
}

.header-info {
  display: flex;
  gap: 3rem;
  align-items: flex-start;
  position: relative;
  min-height: fit-content;
  overflow: visible;
}

.poster-wrapper {
  flex-shrink: 0;
  width: 300px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

.poster {
  width: 100%;
  height: auto;
  display: block;
}

.content-info {
  flex: 1;
  position: relative;
  overflow: visible;
  min-height: 400px;
}

.studio-tag {
  position: absolute;
  top: 32px;
  left: 4%;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 8px;
}

.studio-logo {
  height: 32px;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

.studio-name {
  color: #fff;
  font-size: 1.5rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.original-text {
  color: #999;
  font-size: 1.5rem;
  letter-spacing: 1px;
}

@media (max-width: 768px) {
  .preview-modal-info {
    margin-top: -30vh;
    padding: 0 1rem;
  }

  .preview-modal-tab-content {
    gap: 1rem;
    font-size: 1rem;
  }

  .title {
    font-size: 2rem;
  }

  .overview {
    max-width: 100%;
    font-size: 1rem;
  }

  .info-meta {
    grid-template-columns: 1fr;
  }

  .header-info {
    flex-direction: column;
    gap: 1.5rem;
  }

  .poster-wrapper {
    width: 200px;
    margin: 0 auto;
  }

  .studio-tag {
    top: 16px;
    left: 1rem;
  }

  .studio-logo {
    height: 24px;
  }

  .studio-name,
  .original-text {
    font-size: 1.2rem;
  }
}

.actions {
  margin: 1rem 0;
}

.watch-button {
  margin-bottom: 1rem;
}

.episodes-section {
  margin-top: 2rem;
  position: relative;
  max-height: 400px;
  overflow-y: auto;
}

.episodes-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0.5rem;
  padding-bottom: 1rem;
}

.episodes-section::-webkit-scrollbar {
  width: 8px;
}

.episodes-section::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.episodes-section::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.episodes-section::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}

.episode-player {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.episode-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px;
  background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%);
  color: white;
  z-index: 2;
}

.episode-info {
  position: relative;
  z-index: 3;
}

.episode-number {
  font-size: 0.8rem;
  color: #999;
  margin-bottom: 0.3rem;
}

.episode-name {
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 0.3rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.episode-duration {
  font-size: 0.8rem;
  color: #999;
}

.play-overlay,
.episode-item:hover .play-overlay {
  display: none;
}

@media (max-width: 1200px) {
  .episode-item {
    width: calc(33.33% - 0.67rem);
  }
}

@media (max-width: 992px) {
  .episode-item {
    width: calc(50% - 0.5rem);
  }
}

@media (max-width: 576px) {
  .episode-item {
    width: 100%;
  }
}

.season-selector {
  margin-bottom: 1rem;
}

.season-select {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  outline: none;
}

.season-select:hover {
  background: rgba(255, 255, 255, 0.2);
}

.season-select option {
  background: #141414;
  color: white;
}

.similar-section {
  margin-top: 2rem;
  position: relative;
  max-height: 400px;
  overflow-y: auto;
}

.similar-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0.5rem;
  padding-bottom: 1rem;
}

.similar-item {
  width: calc(20% - 0.8rem); /* 5 элементов в ряд */
  position: relative;
  cursor: pointer;
  border-radius: 4px;
  overflow: hidden;
  aspect-ratio: 2/3;
}

.similar-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.similar-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px;
  background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%);
  color: white;
}

.similar-info {
  position: relative;
}

.similar-title {
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 0.3rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.similar-year {
  font-size: 0.8rem;
  color: #999;
}

/* Стили скроллбара как в episodes-section */
.similar-section::-webkit-scrollbar {
  width: 8px;
}

.similar-section::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.similar-section::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.similar-section::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}

@media (max-width: 1200px) {
  .similar-item {
    width: calc(25% - 0.75rem); /* 4 элемента в ряд */
  }
}

@media (max-width: 992px) {
  .similar-item {
    width: calc(33.33% - 0.67rem); /* 3 элемента в ряд */
  }
}

@media (max-width: 576px) {
  .similar-item {
    width: calc(50% - 0.5rem); /* 2 элемента в ряд */
  }
}

.favorite-button-wrapper {
  margin-top: 1rem;
  width: 100%;
}

.favorite-button-wrapper :deep(.favorite-button) {
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.favorite-button-wrapper :deep(.favorite-button:hover) {
  background: rgba(255, 255, 255, 0.2);
}

.favorite-button-wrapper :deep(.favorite-button.active) {
  background: rgba(255, 255, 255, 0.3);
}

@media (max-width: 768px) {
  .favorite-button-wrapper {
    margin-top: 0.5rem;
  }
}
</style>
