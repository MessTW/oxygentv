<script setup>
import { Icon } from '@iconify/vue';
import { useFavoritesStore } from '../stores/favorites';

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  type: {
    type: String,
    required: true
  }
});

const favoritesStore = useFavoritesStore();

const toggleFavorite = () => {
  if (props.type === 'movie') {
    favoritesStore.toggleMovie(props.item);
  } else {
    favoritesStore.toggleSeries(props.item);
  }
};

const isFavorite = () => {
  if (props.type === 'movie') {
    return favoritesStore.isMovieFavorite(props.item.id);
  }
  return favoritesStore.isSeriesFavorite(props.item.id);
};
</script>

<template>
  <button 
    class="favorite-button"
    @click="toggleFavorite" 
    :class="{ active: isFavorite() }"
    :title="isFavorite() ? 'Удалить из избранного' : 'Добавить в избранное'"
  >
    <Icon :icon="isFavorite() ? 'mdi:heart' : 'mdi:heart-outline'" width="24" />
  </button>
</template>

<style scoped>
.favorite-button {
  width: 100%;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  background-color: rgba(255, 255, 255, 0.1);
  transition: background-color 0.2s ease;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: white;
}

.favorite-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}
</style> 