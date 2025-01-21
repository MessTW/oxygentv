<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { ALLOHA_BASE_URL, ALLOHA_TOKEN } from '../config/api';
import { fetchDetails } from '../services/tmdb';
import { useWatchProgressStore } from '@/stores/watchProgress';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const player = ref(null);
const details = ref(null);
const currentSeason = ref(1);
const currentEpisode = ref(1);
const totalSeasons = ref(1);
const seasonsData = ref({});
const watchProgressStore = useWatchProgressStore();
const authStore = useAuthStore();
const currentPlayer = ref('alloha');

defineProps({
  type: String,
  id: String
})

onMounted(async () => {
  const { type, id } = route.params;
  details.value = await fetchDetails(type, id);
  details.value.media_type = type;

  if (type === 'tv') {
    seasonsData.value = details.value.seasons.reduce((acc, season) => {
      if (season.season_number > 0 && season.episode_count > 0) {
        acc[season.season_number] = season.episode_count;
      }
      return acc;
    }, {});
    totalSeasons.value = Math.max(...Object.keys(seasonsData.value));

    if (route.params.season) {
      currentSeason.value = parseInt(route.params.season);
      if (!seasonsData.value[currentSeason.value]) {
        currentSeason.value = 1;
      }
    }
    if (route.params.episode) {
      currentEpisode.value = parseInt(route.params.episode);
      if (currentEpisode.value > seasonsData.value[currentSeason.value]) {
        currentEpisode.value = 1;
      }
    }
  }

  player.value?.addEventListener('ended', handleWatchComplete);

  const title = details.value.title || details.value.name;
  if (route.params.type === 'tv') {
    document.title = `${title} - Сезон ${currentSeason.value}, Серия ${currentEpisode.value}`;
  } else {
    document.title = title;
  }
});

onUnmounted(() => {
  player.value?.removeEventListener('ended', handleWatchComplete);
});

const seasonEpisodeParams = computed(() => {
  if (route.params.type === 'tv') {
    return `&hidden=season,episode&season=${currentSeason.value}&episode=${currentEpisode.value}`;
  }
  return '';
});

const getCurrentSeasonEpisodes = computed(() => {
  return seasonsData.value[currentSeason.value] || 0;
});

const nextEpisode = () => {
  const currentSeasonEpisodes = getCurrentSeasonEpisodes.value;
  if (currentEpisode.value < currentSeasonEpisodes) {
    currentEpisode.value++;
    updateRoute();
  } else if (currentSeason.value < totalSeasons.value) {
    const nextSeasonEpisodes = seasonsData.value[currentSeason.value + 1];
    if (nextSeasonEpisodes > 0) {
      currentSeason.value++;
      currentEpisode.value = 1;
      updateRoute();
    }
  }
};

const previousEpisode = () => {
  if (currentEpisode.value > 1) {
    currentEpisode.value--;
    updateRoute();
  } else if (currentSeason.value > 1) {
    currentSeason.value--;
    currentEpisode.value = seasonsData.value[currentSeason.value];
    updateRoute();
  }
};

const goBack = () => {
  router.push({
    name: 'cinema-details',
    params: {
      type: route.params.type,
      id: route.params.id
    }
  })
}

const embedUrl = computed(() => {
  const { id } = route.params;
  const baseParams = `tmdb=${id}${seasonEpisodeParams.value}`;
  return `${ALLOHA_BASE_URL}/?token=${ALLOHA_TOKEN}&${baseParams}`;
});

const tobacoUrl = computed(() => {
  const { kpId } = route.params;
  console.log('Current KinopoiskID in WatchPage:', kpId);
  if (!kpId) return '';

  if (route.params.type === 'tv') {
    console.log('Building Tobaco URL for TV show:', `https://api.tobaco.ws/embed/kp/${kpId}?season=${currentSeason.value}&episode=${currentEpisode.value}`);
    return `https://api.tobaco.ws/embed/kp/${kpId}?season=${currentSeason.value}&episode=${currentEpisode.value}`;
  }
  console.log('Building Tobaco URL for movie:', `https://api.tobaco.ws/embed/kp/${kpId}`);
  return `https://api.tobaco.ws/embed/kp/${kpId}`;
});

const isTobacoAvailable = computed(() => {
  return !!route.params.kpId;
});

const updateRoute = () => {
  router.replace({
    name: 'watch',
    params: {
      type: route.params.type,
      id: route.params.id,
      season: currentSeason.value,
      episode: currentEpisode.value,
      kpId: route.params.kpId
    }
  });
  onEpisodeChange(currentSeason.value, currentEpisode.value);
  setTimeout(() => {
    const title = details.value.title || details.value.name;
    if (route.params.type === 'tv') {
      document.title = `${title} - Сезон ${currentSeason.value}, Серия ${currentEpisode.value}`;
    } else {
      document.title = title;
    }
  }, 100);
};

const onEpisodeChange = (season, episode) => {
  if (route.params.type === 'tv') {
    watchProgressStore.updateProgress(route.params.id, season, episode);
  }
};

const handleWatchComplete = async () => {
  if (!authStore.user?.settings?.trackHistory) return;

  await authStore.updateStats(
    route.params.type,
    'watch'
  );
};
</script>

<template>
  <div class="watch-page">
    <div class="mui-app-bar">
      <button class="back-button" @click="goBack">
        <Icon icon="mdi:arrow-left" width="24" />
        <span>Назад</span>
      </button>

      <div class="player-switch">
        <button
          class="switch-button"
          :class="{ active: currentPlayer === 'alloha' }"
          @click="currentPlayer = 'alloha'"
        >
          Плеер 1
        </button>
        <button
          class="switch-button"
          :class="{ active: currentPlayer === 'tobaco' }"
          @click="currentPlayer = 'tobaco'"
          :disabled="!isTobacoAvailable"
        >
          Плеер 2
        </button>
      </div>

      <div v-if="route.params.type === 'tv'" class="episode-controls">
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

    <div class="player-container">
      <iframe
        v-if="currentPlayer === 'alloha'"
        :src="embedUrl"
        allow="autoplay; fullscreen"
        class="video-player"
        allowfullscreen
        @load="player = $event.target"
      ></iframe>
      <iframe
        v-else
        :src="tobacoUrl"
        allow="autoplay *"
        class="video-player"
        allowfullscreen=""
        webkitallowfullscreen=""
        mozallowfullscreen=""
        oallowfullscreen=""
        msallowfullscreen=""
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
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.episode-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
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

.player-container {
  flex: 1;
  position: relative;
  width: 100%;
  height: 100%;
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

  .player-switch {
    position: static;
    margin-left: auto;
  }
}

.video-player {
  width: 100%;
  height: 100%;
  border: none;
}

.player-switch {
  display: flex;
  gap: 0.5rem;
  margin: 0 auto;
}

.switch-button {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.switch-button.active {
  background: white;
  color: black;
}

.switch-button:hover:not(.active) {
  background: rgba(255, 255, 255, 0.2);
}

.switch-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
</style>
