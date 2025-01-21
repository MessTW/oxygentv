<script setup>
import { useRouter } from 'vue-router';
import { useFavoritesStore } from '@/stores/favorites';
import { Icon } from '@iconify/vue';
import { getImageUrl } from '@/config/api';
import { computed } from 'vue';

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
});

const router = useRouter();
const favoritesStore = useFavoritesStore();

const posterUrl = computed(() => getImageUrl(props.item.poster_path));

const showDetails = () => {
  router.push({
    name: 'cinema-details',
    params: {
      type: props.item.title ? 'movie' : 'tv',
      id: props.item.id
    }
  });
};

const toggleFavorite = async (event) => {
  event.stopPropagation();
  await favoritesStore.toggleFavorite(props.item);
};
</script>

<template>
  <div class="content-card" @click="showDetails">
    <div class="card-image">
      <img
        :src="posterUrl"
        :alt="item.title || item.name"
      >
      <button class="favorite-button" @click="toggleFavorite">
        <Icon icon="mdi:heart" width="24" />
      </button>
    </div>
    <div class="card-info">
      <h3>{{ item.title || item.name }}</h3>
      <div class="meta">
        <span class="year">{{ new Date(item.release_date || item.first_air_date).getFullYear() }}</span>
        <span class="rating">
          <Icon icon="mdi:star" width="16" />
          {{ item.vote_average.toFixed(1) }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-card {
  cursor: pointer;
  transition: transform 0.2s;
  position: relative;
}

.content-card:hover {
  transform: translateY(-5px);
}

.card-image {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: auto;
  display: block;
}

.favorite-button {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.favorite-button:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(1.1);
}

.card-info {
  padding: 1rem 0;
}

.card-info h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
}

.rating {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
