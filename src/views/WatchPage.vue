<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { getKinopoiskId } from '../services/movieIds';
import { ALLOHA_BASE_URL, ALLOHA_TOKEN } from '../config/api';

const API_KEY = 'd341436234a2bb8f0adc73114e093ab2';

const router = useRouter();
const playerContainer = ref(null);
const kinopoiskId = ref(null);
const state = ref({
  title: '',
  type: '',
  id: '',
  year: '',
  imdb: '',
  season: 1,
  episode: 1,
  source: ''
});

try {
  const data = localStorage.getItem('playerData');
  if (data) {
    const parsedData = JSON.parse(data);
    state.value = {
      ...state.value,
      ...parsedData
    };
    document.title = `${state.value.title} - Смотреть онлайн`;
  }
} catch (error) {
  console.error('Error parsing player data:', error);
}

const currentSeason = ref(parseInt(state.value.season) || 1);
const currentEpisode = ref(parseInt(state.value.episode) || 1);
const totalSeasons = ref(1);
const seasonsData = ref({});

const seasonEpisodeParams = computed(() => {
  if (currentSeason.value && currentEpisode.value) {
    return `&hidden=season,episode&season=${currentSeason.value}&episode=${currentEpisode.value}`;
  }
  return '';
});

const fetchSeasonData = async () => {
  try {
    if (state.value.source === 'alloha') {
      // Получаем данные о сезонах с API
      const response = await fetch(
        `https://apitmdb.cub.red/3/tv/${state.value.id}?api_key=${API_KEY}&language=ru`
      );
      const data = await response.json();

      if (!data || !data.seasons) {
        console.error('No seasons data received');
        seasonsData.value = { 1: 1 };
        totalSeasons.value = 1;
        return;
      }

      // Создаем объект с количеством эпизодов для каждого сезона
      const seasons = {};
      data.seasons.forEach(season => {
        seasons[season.season_number] = season.episode_count;
      });

      seasonsData.value = seasons;
      totalSeasons.value = data.seasons.length;
      return;
    }
  } catch (error) {
    console.error('Error fetching season data:', error);
    seasonsData.value = { 1: 1 };
    totalSeasons.value = 1;
  }
};

// Функции управления сериями
const nextEpisode = () => {
  const currentSeasonEpisodes = getCurrentSeasonEpisodes.value;

  if (currentEpisode.value < currentSeasonEpisodes) {
    // Если есть ещё серии в текущем сезоне
    currentEpisode.value++;
  } else if (currentSeason.value < totalSeasons.value) {
    // Проверяем, есть ли эпизоды в следующем сезоне
    const nextSeasonEpisodes = seasonsData.value[currentSeason.value + 1];
    if (nextSeasonEpisodes > 0) {
      // Если текущий сезон закончился и есть следующий сезон с сериями
      currentSeason.value++;
      currentEpisode.value = 1;
    }
  }
};

const previousEpisode = () => {
  if (currentEpisode.value > 1) {
    // Если не первая серия текущего сезона
    currentEpisode.value--;
  } else if (currentSeason.value > 1) {
    // Если первая серия сезона, переходим к предыдущему сезону
    currentSeason.value--;
    currentEpisode.value = getCurrentSeasonEpisodes.value;
  }
};

// Следим за изменениями серии/сезона и обновляем URL плеера
watch([currentSeason, currentEpisode], ([newSeason, newEpisode]) => {
  if (state.value.source === 'alloha') {
    // Проверяем, не превышает ли номер эпизода максимальное значение
    const maxEpisodes = seasonsData.value[newSeason] || 24;
    if (newEpisode > maxEpisodes) {
      currentEpisode.value = maxEpisodes;
      return;
    }

    state.value.season = newSeason;
    state.value.episode = newEpisode;

    // Обновляем URL iframe
    const iframe = document.querySelector('.player-iframe');
    if (iframe) {
      const newUrl = `${ALLOHA_BASE_URL}/?token=${ALLOHA_TOKEN}&tmdb=${state.value.id}&hidden=season,episode&season=${newSeason}&episode=${newEpisode}`;
      if (iframe.src !== newUrl) {  // Добавляем проверку на изменение URL
        iframe.src = newUrl;
      }
    }
  }
}, { immediate: true });

// Обновляем computed свойство
const getCurrentSeasonEpisodes = computed(() => {
  return seasonsData.value[currentSeason.value] || 0;
});

document.title = `${state.value.title} - Смотреть онлайн`;

onMounted(async () => {
  // Обновляем URL с правильным названием
  const title = state.value.title.toLowerCase().replace(/[^a-zа-яё0-9\s-]/g, '').replace(/\s+/g, '-');
  if (router.currentRoute.value.params.title !== title) {
    router.replace({
      name: 'watch',
      params: { title }
    });
  }

  if (state.value.source === 'alloha') {
    console.log('Initial state:', {
      season: currentSeason.value,
      episode: currentEpisode.value
    });

    await fetchSeasonData();

    // Обновляем URL плеера сразу после монтирования
    const iframe = document.querySelector('.player-iframe');
    if (iframe) {
      const initialUrl = `${ALLOHA_BASE_URL}/?token=${ALLOHA_TOKEN}&tmdb=${state.value.id}${seasonEpisodeParams.value}`;
      console.log('Setting initial URL:', initialUrl);
      iframe.src = initialUrl;
    }
    return;
  }

  if (state.value.type === 'series') {
    await fetchSeasonData();
  }

  if (state.value.totalSeasons) {
    totalSeasons.value = parseInt(state.value.totalSeasons);
  }

  // Загружаем скрипт kinobox
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://fridayprivate.vercel.app/assets/js/kinobox.min.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  // Получаем kinopoisk ID
  if (state.value.title && state.value.year) {
    kinopoiskId.value = await getKinopoiskId(
      state.value.title,
      String(state.value.year)
    );
  }

  // Ждем небольшую паузу для уверенности, что DOM обновился
  await new Promise(resolve => setTimeout(resolve, 100));

  if (window.kbox && playerContainer.value) {
    const searchParams = {
      query: kinopoiskId.value
    };

    console.log('Initializing player with params:', searchParams);

    window.kbox(playerContainer.value, {
      search: searchParams,
      sourceList: true,
      players: {
        turbo: true,
        alloha: true,
        kodik: true,
        videocdn: true,
        collaps: true,
        hdvb: true,
      },
      menu: {
        enable: true,
        default: 'menu_button',
        mobile: 'menu_button',
        format: '{T}',
        limit: null
      },
      autoplay: true,
      events: {
        init: function() {
          console.log('Player initialized');
        },
        playerLoaded: function(status, sources) {
          console.log('Player loaded with params:', searchParams, 'Status:', status, 'Sources:', sources);
          if (!sources || sources.length === 0) {
            console.log('No sources found, trying alternative search...');
            window.kbox(playerContainer.value, {
              search: {
                query: state.value.type === 'series' ?
                  `${state.value.title} ${state.value.year} сериал` :
                  `${state.value.title} ${state.value.year}`
              },
              players: {
                turbo: true,
                alloha: true,
                kodik: true,
                videocdn: true,
                collaps: true,
                hdvb: true,
              }
            });
          }
        }
      }
    });
  }
});

const goBack = () => {
  const playerData = JSON.parse(localStorage.getItem('playerData'));
  if (playerData) {
    const routeName = playerData.type === 'tv' ? 'series' : 'movie';
    router.push({ name: routeName, params: { id: playerData.id } });
  } else {
    router.push('/');
  }
};
</script>

<template>
  <div class="watch-page">
    <div class="mui-app-bar">
      <button class="back-button" @click="goBack">
        <Icon icon="mdi:arrow-left" width="24" />
        <span>Назад</span>
      </button>

      <!-- Добавляем элементы управления для сериалов -->
      <div v-if="state.type === 'tv'" class="episode-controls">
        <button
          class="episode-button"
          @click="previousEpisode"
          :disabled="currentSeason === 1 && currentEpisode === 1"
        >
          <Icon icon="mdi:skip-previous" width="24" />
        </button>
        <span class="episode-info">
          Сезон {{ currentSeason }} Серия {{ currentEpisode }}
        </span>
        <button
          class="episode-button"
          @click="nextEpisode"
          :disabled="currentSeason === totalSeasons && currentEpisode === getCurrentSeasonEpisodes"
        >
          <Icon icon="mdi:skip-next" width="24" />
        </button>
      </div>
    </div>
    <div ref="playerContainer" class="player-container">
      <iframe
    v-if="state.source === 'alloha'"
    :src="`${ALLOHA_BASE_URL}/?token=${ALLOHA_TOKEN}&tmdb=${state.id}${seasonEpisodeParams}`"
    class="player-iframe"
    frameborder="0"
    scrolling="no"
    width="100%"
    height="100%"
    allowfullscreen
    loading="lazy"
  ></iframe>
    </div>
  </div>
</template>

<style scoped>
.watch-page {
  width: 100%;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  display: flex;
  flex-direction: column;
  z-index: 9999;
}

.mui-app-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 56px;
  padding: 0 16px;
  background-color: #1a1a1a;
  color: #fff;
  z-index: 1001;
  position: relative;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  background: transparent;
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
  position: absolute;
  left: 16px;
  z-index: 1;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.title {
  margin: 0;
  font-size: 1.2rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  width: 100%;
  padding: 0 64px;
  position: absolute;
  left: 0;
  }

  .player-container {
    flex: 1;
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

.episode-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.episode-button {
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  transition: background 0.2s;
}

.episode-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}

.episode-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.episode-info {
  color: white;
  font-size: 0.9rem;
  min-width: 150px;
  text-align: center;
}

.player-iframe {
  width: 100% !important;
  height: 100% !important;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

@media (max-width: 768px) {
  .player-container {
    pointer-events: auto;
    touch-action: auto;
  }

  .player-iframe {
    pointer-events: auto;
    touch-action: auto;
    -webkit-overflow-scrolling: touch;
  }
}
</style>
