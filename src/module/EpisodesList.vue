<template>
  <div class="episodes-section" v-if="filteredSeasons.length">
    <div class="seasons-select">
      <button
        v-for="season in filteredSeasons"
        :key="season.season_number"
        :class="['season-button', { active: currentSeason === season.season_number }]"
        @click="selectSeason(season.season_number)"
      >
        Сезон {{ season.season_number }}
      </button>
    </div>

    <div class="episodes-grid">
      <div
        v-for="episode in currentEpisodes"
        :key="episode.episode_number"
        class="episode-card"
        @click="playEpisode(currentSeason, episode.episode_number)"
      >
        <div class="episode-image">
          <img
            :src="episode.still_path
              ? `https://imagetmdb.com/t/p/w300${episode.still_path}`
              : `https://imagetmdb.com/t/p/w300${details.backdrop_path}`"
            :alt="episode.name"
          >
          <div class="play-overlay">
            <Icon icon="mynaui:play-solid" width="54" />
          </div>
          <div v-if="isEpisodeWatched(currentSeason, episode.episode_number)" class="watched-badge">
            <Icon icon="mdi:check" width="16" />
          </div>
        </div>
        <div class="episode-info">
          <div class="episode-number">Серия {{ episode.episode_number }}</div>
          <div class="episode-name">{{ episode.name }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { fetchSeasonDetails } from '@/services/tmdb'
import { useWatchProgressStore } from '@/stores/watchProgress'

const props = defineProps({
  details: {
    type: Object,
    required: true
  },
  kinopoiskId: {
    type: String,
    default: null
  }
})

const router = useRouter()
const currentSeason = ref(1)
const seasonDetails = ref({})

const filteredSeasons = computed(() => {
  return props.details.seasons?.filter(season =>
    season.season_number > 0 &&
    season.episode_count > 0 &&
    new Date(season.air_date) <= new Date()
  ) || []
})

const currentEpisodes = computed(() => {
  return seasonDetails.value[currentSeason.value] || []
})

const selectSeason = async (seasonNum) => {
  currentSeason.value = seasonNum
  if (!seasonDetails.value[seasonNum]) {
    await loadSeasonDetails(seasonNum)
  }
}

const loadSeasonDetails = async (seasonNum) => {
  const episodes = await fetchSeasonDetails(props.details.id, seasonNum)
  seasonDetails.value[seasonNum] = episodes
}

const playEpisode = (season, episode) => {
  router.push({
    name: 'watch',
    params: {
      type: 'tv',
      id: props.details.id,
      season,
      episode,
      kpId: props.kinopoiskId
    }
  })
}

const watchProgressStore = useWatchProgressStore()

const isEpisodeWatched = (seasonNumber, episodeNumber) => {
  const progress = watchProgressStore.getProgress(props.details.id)
  return (progress.season > seasonNumber) ||
         (progress.season === seasonNumber && progress.episode >= episodeNumber)
}

onMounted(async () => {
  if (filteredSeasons.value.length) {
    await loadSeasonDetails(currentSeason.value)
  }
})
</script>

<style scoped>
.episodes-section {
  margin-top: -2rem;
  padding: 2rem;
  border-radius: 16px;
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}

.seasons-select {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  overflow-x: auto;
  padding-bottom: 1rem;
}

.season-button {
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: transparent;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.season-button.active {
  background: white;
  color: black;
}

.episodes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.episode-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.episode-card:hover {
  transform: scale(1.05);
}

.episode-image {
  position: relative;
  aspect-ratio: 16/9;
  border-radius: 8px;
  overflow: hidden;
}

.episode-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.episode-card:hover .play-overlay {
  opacity: 1;
}

.episode-info {
  padding: 0.5rem;
}

.episode-number {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
}

.episode-name {
  font-weight: 500;
  margin-top: 0.25rem;
}

.watched-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(76, 175, 80, 0.9);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 2;
}

@media (max-width: 768px) {
  .episodes-section {
    padding: 1rem;
  }

  .episodes-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}
</style>
