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
  cursor: pointer;
  transition: all 0.2s ease;
  height: var(--button-height);
  padding: 0 var(--spacing-large);
  font-size: var(--font-size-body);
  min-width: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  border-radius: 8px;
  position: relative;
  z-index: 101;
  font-weight: 600;
  background: whitesmoke;
  color: rgb(0, 0, 0);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;
}

@media (max-width: 768px) {
  .favorite-button {
    width: 100%;
  }
}
</style>
