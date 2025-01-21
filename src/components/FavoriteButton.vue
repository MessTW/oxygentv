<script setup>
import { computed } from 'vue';
import { useFavoritesStore } from '@/stores/favorites';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';

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
const authStore = useAuthStore();
const router = useRouter();

const isFavorite = computed(() => {
  return favoritesStore.favorites.some(f => f.id === props.item.id);
});

const toggleFavorite = async (event) => {
  event.stopPropagation();
  if (!authStore.user || !authStore.accessToken) {
    router.push('/login');
    return;
  }
  await favoritesStore.toggleFavorite(props.item);
};
</script>

<template>
  <button
    class="favorite-button"
    :class="{ active: isFavorite }"
    @click="toggleFavorite"
  >
    <Icon
      :icon="isFavorite ? 'mdi:heart' : 'mdi:heart-outline'"
      width="24"
    />
  </button>
</template>

<style scoped>
.favorite-button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  opacity: 0.8;
  transition: all 0.2s;
}

.favorite-button:hover {
  opacity: 1;
  transform: scale(1.1);
}

.favorite-button.active {
  color: var(--accent);
  opacity: 1;
}
</style>
