<script setup>
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';

const router = useRouter();
const props = defineProps({
  tmdbId: {
    type: String,
    required: true
  },
  imdbId: {
    type: String,
    default: ''
  },
  year: {
    type: [String, Number],
    default: ''
  },
  type: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  class: {
    type: String,
    default: ''
  }
});

const openPlayer = () => {
  // Устанавливаем заголовок страницы
  document.title = `${props.title} - Смотреть онлайн`;

  // Сохраняем данные в localStorage
  localStorage.setItem('playerData', JSON.stringify({
    title: props.title,
    type: props.type,
    id: props.tmdbId,
    year: props.year,
    imdb: props.imdbId
  }));

  router.push({
    name: 'watch',
    params: {
      title: props.title.toLowerCase().replace(/[^a-zа-яё0-9\s]/gi, '').replace(/\s+/g, '-')
    }
  });
};
</script>

<template>
  <button
    class="video-button"
    :class="[props.class]"
    @click="openPlayer"
  >
    <Icon icon="material-symbols:play-arrow" width="24" />
    <span>Смотреть</span>
  </button>
</template>

<style scoped>
.video-button {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  background-color: var(--button-bg);
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: white;
}

.video-button:hover {
  background-color: var(--button-hover);
}

.mui-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgb(0, 0, 0);
  z-index: 1000;
}

.mui-modal-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: rgb(0, 0, 0);
  overflow: hidden;
}

.mui-app-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 56px;
  padding: 0 16px;
  background-color: #1a1a1a;
  color: #fff;
  z-index: 100;
}

.mui-typography {
  margin: 0;
  font-size: 1.2rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mui-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border-radius: 50%;
  border: 0;
  color: #fff;
  background-color: transparent;
  cursor: pointer;
  transition: background-color 0.2s;
}

.mui-icon-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.player-container {
  flex: 1;
  position: relative;
  background: #000;
}

.touch-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}
</style>
