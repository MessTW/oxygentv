<template>
  <div v-if="movieData" class="preview-modal">
    <div class="preview-header">
      <button class="back-button" @click="handleBack">
        <span>←</span>
      </button>
      <button class="refresh-button" @click="handleRefresh">
        <span>↻</span>
      </button>
    </div>

    <div
      class="preview-modal-backdrop"
      :style="{ backgroundImage: `url(https://imagetmdb.com/t/p/original${movieData.backdrop_path})` }"
    />

    <div class="preview-modal-content">
      <div class="badges">
        <span v-if="isNewContent" class="badge new">New</span>
        <span v-if="isNewContent" class="badge dot">•</span>
        <span class="badge">{{ getSeasonInfo }}</span>
      </div>

      <h1 class="title">{{ getTitle }}</h1>

      <div class="meta-tags">
        <span class="age-rating">{{ getAgeRating }}</span>
        <span class="studio">{{ getStudioName }}</span>
        <span v-if="isNetflixContent" class="platform">Netflix</span>
      </div>

      <div class="episode-info">
        <div class="episode-title">
          <span>{{ getEpisodeInfo }}</span>
          <span class="duration">{{ getDuration }}</span>
        </div>
        <div class="progress-bar">
          <div class="progress" style="width: 30%"></div>
        </div>
      </div>

      <button class="continue-button">
        Continue Watch
      </button>

      <div class="cast-section">
        <div class="section-header">
          <h3>The Cast</h3>
          <button>See all</button>
        </div>
        <div class="cast-list">
          <div
            v-for="actor in movieData.credits?.cast?.slice(0, 4)"
            :key="actor.id"
            class="cast-item"
          >
            <div
              class="cast-avatar"
              :style="actor.profile_path ? {
                backgroundImage: `url(https://imagetmdb.com/t/p/w200${actor.profile_path})`
              } : {}"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
  movieData: {
    type: Object,
    default: () => ({})
  }
})

// Вычисляемые свойства для информации о контенте
const getTitle = computed(() => {
  return props.movieData?.title || props.movieData?.name || ''
})

const getStudioInfo = computed(() => {
  if (!props.movieData) return null
  const netflix = props.movieData.networks?.find(n => n.name === 'Netflix')
  if (netflix) return netflix
  return props.movieData.networks?.[0] || props.movieData.production_companies?.[0]
})

const getStudioName = computed(() => {
  return getStudioInfo.value?.name || 'League of Legend'
})

const isNetflixContent = computed(() => {
  return getStudioInfo.value?.name === 'Netflix'
})

const isNewContent = computed(() => {
  const releaseDate = props.movieData?.first_air_date || props.movieData?.release_date
  if (!releaseDate) return false
  const monthsAgo = (new Date() - new Date(releaseDate)) / (1000 * 60 * 60 * 24 * 30)
  return monthsAgo <= 3
})

const getSeasonInfo = computed(() => {
  if (props.movieData?.number_of_seasons) {
    return `Season ${props.movieData.season_number || 1}`
  }
  return 'Movie'
})

const getEpisodeInfo = computed(() => {
  if (props.movieData?.episodes?.[0]) {
    const episode = props.movieData.episodes[0]
    return `S1: E1 "${episode?.name || 'Episode 1: Jinx Born'}"`
  }
  return props.movieData?.tagline || ''
})

const getAgeRating = computed(() => {
  if (props.movieData?.adult) return '18+'
  const ruRating = props.movieData?.content_ratings?.results?.find(
    r => r.iso_3166_1 === 'RU'
  )?.rating
  return ruRating || '12+'
})

const getDuration = computed(() => {
  const runtime = props.movieData?.runtime || props.movieData?.episode_run_time?.[0]
  if (!runtime) return ''
  const hours = Math.floor(runtime / 60)
  const mins = runtime % 60
  return `${hours}ч ${mins}м`
})

const handleBack = () => {
  router.back()
}

const handleRefresh = () => {
  window.location.reload()
}
</script>

<style scoped>
.preview-modal {
  height: 100vh;
  position: relative;
  background: #141414;
  color: white;
}

.preview-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  z-index: 2;
}

.back-button,
.refresh-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(71, 71, 71, 0.9);
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
}

.preview-modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 70%;
  background-size: cover;
  background-position: center;
  mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 60%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 60%, transparent);
}

.preview-modal-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1.5rem;
  padding-bottom: 2rem;
  background: linear-gradient(transparent 10%, #141414 30%);
  min-height: 45%;
}

.badges {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.badge {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.badge.new {
  color: white;
  font-weight: 500;
}

.badge.dot {
  opacity: 0.5;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  letter-spacing: -0.5px;
}

.meta-tags {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.age-rating,
.studio,
.platform {
  padding: 0.25rem 0.75rem;
  background: rgba(71, 71, 71, 0.9);
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
}

.episode-info {
  margin-bottom: 1.5rem;
}

.episode-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
}

.duration {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
}

.progress-bar {
  width: 100%;
  height: 3px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: #D4B887;
  border-radius: 2px;
}

.continue-button {
  width: 100%;
  padding: 1rem;
  background: #D4B887;
  border: none;
  border-radius: 8px;
  color: black;
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 2rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.continue-button:hover {
  background: #c5aa7d;
}

.cast-section {
  margin-top: 1rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h3 {
  font-size: 1.1rem;
  font-weight: 500;
}

.section-header button {
  color: rgba(255, 255, 255, 0.7);
  background: none;
  border: none;
  font-size: 0.9rem;
  cursor: pointer;
}

.cast-list {
  display: flex;
  gap: 1rem;
}

.cast-item {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(71, 71, 71, 0.9);
  overflow: hidden;
}

.cast-avatar {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
}
</style>
