<script setup>
import { Icon } from '@iconify/vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const props = defineProps({
  tmdbId: {
    type: [String, Number],
    required: true
  },
  season: {
    type: Number,
    default: 1
  },
  episode: {
    type: Number,
    default: 1
  },
  type: {
    type: String,
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
  router.push({
    name: 'watch',
    params: { title: playerData.title.toLowerCase().replace(/\s+/g, '-') }
  });
};
</script>

<template>
  <div class="alloha-player">
    <button
      class="alloha-button"
      @click="openPlayer"
      v-if="tmdbId"
    >
      <Icon icon="mdi:play-circle" width="24" />
      <span>Смотреть на Alloha</span>
    </button>
  </div>
</template>

<style scoped>
.alloha-player {
  position: relative;
}

.alloha-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 8px 16px;
  background: var(--button-bg);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.alloha-button:hover {
  background: var(--button-hover);
}

.alloha-button.is-loading {
  opacity: 0.7;
  cursor: wait;
}

.translations-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.9);
  border-radius: 8px;
  margin-top: 0.5rem;
  padding: 0.5rem;
  z-index: 100;
}

.translation-item {
  padding: 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.translation-item:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>
