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
  >
    <Icon :icon="isFavorite() ? 'mdi:heart' : 'mdi:heart-outline'" width="24" />
    <span>{{ isFavorite() ? 'Удалить из библиотеки' : 'Добавить в библиотеку' }}</span>
  </button>
</template>
