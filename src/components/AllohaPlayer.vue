<template>
  <div class="episode-item" @click="openPlayer">
    <div class="episode-thumbnail">
      <img
        :src="episodeData?.still_path ? `https://imagetmdb.com/t/p/w300${episodeData.still_path}` : '/no-image.jpg'"
        :alt="episodeData?.name"
      />
      <div class="episode-overlay">
        <div class="episode-info">
          <div class="episode-number">СЕРИЯ {{ episodeData?.episode_number }}</div>
          <div class="episode-name">{{ episodeData?.name }}</div>
          <div class="episode-duration">{{ episodeData?.runtime }} мин</div>
        </div>
      </div>
      <div class="play-button">
        <Icon icon="mdi:play-circle" width="48" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const props = defineProps({
  tmdbId: {
    type: [String, Number],
    required: true
  },
  type: {
    type: String,
    required: true
  },
  season: {
    type: Number,
    required: true
  },
  episode: {
    type: Number,
    required: true
  },
  episodeData: {
    type: Object,
    required: true
  }
});

const openPlayer = () => {
  // Сохраняем данные для плеера
  const playerData = {
    title: document.title.split(' | ')[0],
    type: props.type,
    id: String(props.tmdbId),
    season: props.season,
    episode: props.episode,
    source: 'alloha'
  };

  console.log('Saving player data:', playerData);

  localStorage.setItem('playerData', JSON.stringify(playerData));
  const title = playerData.title.toLowerCase().replace(/[^a-zа-яё0-9\s-]/g, '').replace(/\s+/g, '-');
  router.push({
    name: 'watch',
    params: { title }
  });
};
</script>

<style scoped>
.episode-item:hover .play-button {
  opacity: 1;
  cursor: pointer;
}

.episode-thumbnail {
  position: relative;
  width: 100%;
  flex-shrink: 0;
  border-radius: 4px;
  overflow: hidden;
}

.episode-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s;
}

.play-button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 3;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  padding: 8px;
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
</style>
