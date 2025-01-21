<script setup>
import { onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useFavoritesStore } from '@/stores/favorites';
import { useRouter } from 'vue-router';
import ContentCard from '../components/ContentCard.vue';
import { Icon } from '@iconify/vue';

const authStore = useAuthStore();
const favoritesStore = useFavoritesStore();
const router = useRouter();

const movies = computed(() => {
  return favoritesStore.favorites.filter(item => item.media_type === 'movie' || item.title);
});

const series = computed(() => {
  return favoritesStore.favorites.filter(item => item.media_type === 'tv' || item.name);
});

onMounted(async () => {
  if (!authStore.user) {
    router.push('/login');
    return;
  }
  if (!favoritesStore.isInitialized && authStore.accessToken) {
    try {
      await favoritesStore.initGoogleDrive(authStore.accessToken);
    } catch (error) {
      console.error('Failed to initialize Google Drive:', error);
      router.push('/login');
      return;
    }
  }
  if (favoritesStore.isInitialized) {
    await favoritesStore.loadFavorites();
  }
});

const clearFavorites = async () => {
  if (confirm('Вы уверены, что хотите очистить весь список избранного?')) {
    await favoritesStore.clearFavorites();
  }
};
</script>

<template>
  <div class="library-page">
    <div class="library-header">
      <h1>Библиотека</h1>
      <div class="library-actions">
        <button class="action-button warning" @click="clearFavorites">
          <Icon icon="mdi:delete" width="20" />
          Очистить
        </button>
      </div>
    </div>

    <div v-if="movies.length || series.length">
      <div class="favorites-section" v-if="movies.length">
        <h2>Избранные фильмы</h2>
        <div class="content-grid">
          <ContentCard
            v-for="item in movies"
            :key="item.id"
            :item="item"
          />
        </div>
      </div>

      <div class="favorites-section" v-if="series.length">
        <h2>Избранные сериалы</h2>
        <div class="content-grid">
          <ContentCard
            v-for="item in series"
            :key="item.id"
            :item="item"
          />
        </div>
      </div>
    </div>
    <div v-else class="empty-state">
      <p>В библиотеке пока ничего нет</p>
    </div>
  </div>
</template>

<style scoped>
.library-page {
  padding: 2rem;
}

.library-header {
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.library-actions {
  display: flex;
  gap: 1rem;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.action-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.action-button.warning {
  background: rgba(255, 0, 0, 0.1);
}

.action-button.warning:hover {
  background: rgba(255, 0, 0, 0.2);
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 2rem;
}

.favorites-section {
  margin-bottom: 3rem;
}

.favorites-section h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #fff;
  opacity: 0.8;
}

.empty-state {
  text-align: center;
  padding: 4rem;
  color: rgba(255, 255, 255, 0.6);
}

@media (max-width: 768px) {
  .library-page {
    padding: 1rem;
  }

  .content-grid {
    gap: 1rem;
  }
}

.favorites {
  padding: 1rem;
  padding-bottom: var(--mobile-bottom-offset);
}

.empty-favorites {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
  color: #808080;
}

.empty-favorites h2 {
  margin: 1rem 0;
}

.empty-favorites p {
  max-width: 400px;
  line-height: 1.5;
}

.movie-card,
.series-card {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
}

.movie-card:hover,
.series-card:hover {
  transform: translateY(-5px);
}

.favorite-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  z-index: 10;
  opacity: 0.8;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.movie-card:hover .favorite-button,
.series-card:hover .favorite-button {
  opacity: 1;
  transform: scale(1.1);
}

.favorite-button.active {
  color: var(--accent);
  opacity: 1;
}

.favorite-button:hover {
  transform: scale(1.2) !important;
  background: rgba(0, 0, 0, 0.8);
}

.movie-overlay,
.series-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  z-index: 1;
  pointer-events: none;
}

.meta-info {
  background: linear-gradient(rgba(0, 0, 0, 0.8), transparent);
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.movie-title,
.series-title {
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.9));
  padding: 1rem;
  margin: 0;
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
}

.rating,
.year {
  color: white;
  font-weight: 500;
}

.rating {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
</style>
