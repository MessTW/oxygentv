<template>
  <section class="content-section">
    <div class="content-section-inner">
      <h2 class="section-title">{{ title }}</h2>
      <div class="content-grid">
        <template v-if="heroStore.isLoading">
          <div v-for="n in 10" :key="n" class="content-card skeleton">
            <div class="skeleton-poster"></div>
          </div>
        </template>
        <div
          v-else
          v-for="item in filteredItems"
          :key="item.id"
          class="content-card"
          @click="navigateToContent(item)"
        >
          <div class="movie-type">{{ item.media_type === 'movie' ? 'Фильм' : 'Сериал' }}</div>
          <LazyImage
            :src="`https://imagetmdb.com/t/p/w342${item.poster_path}`"
            :alt="getTitle(item)"
          />
          <div class="content-overlay bottom">
            <h3 class="content-title">{{ getTitle(item) }}</h3>
            <div class="release-year">{{ getYear(item) }}</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useRouter } from 'vue-router';
import LazyImage from '../components/LazyImage.vue';
import { useHeroStore } from '@/stores/heroStore';
import { onMounted, computed } from 'vue';

const router = useRouter();
const heroStore = useHeroStore();

defineProps({
  title: {
    type: String,
    required: true
  }
});

// Фильтруем и сортируем элементы
const filteredItems = computed(() => {
  return heroStore.trendingItems
    .filter(item => item.poster_path && (item.media_type === 'movie' || item.media_type === 'tv'))
    .sort(() => Math.random() - 0.5);
});

const getYear = (item) => {
  const date = item.release_date || item.first_air_date;
  return date ? date.split('-')[0] : '';
};

const getTitle = (item) => {
  return item.media_type === 'movie' ? item.title : item.name;
};

const navigateToContent = (item) => {
  const route = item.media_type === 'movie' ? 'movie' : 'series';
  router.push(`/${route}/${item.id}`);
};

onMounted(() => {
  if (!heroStore.trendingItems.length) {
    heroStore.fetchTrending();
  }
});
</script>

<style scoped>
.content-section {
  padding: 0 4%;
  margin-bottom: 3rem;
}

.content-section-inner {
  max-width: 1800px;
  margin: 0 auto;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 500;
  margin-bottom: 1rem;
}

.content-grid {
  display: grid;
  gap: 1.5rem;
}

.content-card {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  border-radius: 10px;
  background: rgba(32, 32, 32, 0.5);
}

.content-card:hover {
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.content-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.content-overlay {
  position: absolute;
  left: 0;
  right: 0;
  padding: 1rem;
  background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%);
  transition: opacity 0.3s ease;
}

.content-overlay.bottom {
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.content-card:hover .content-overlay.top {
  opacity: 1;
}

.meta-info {
  display: flex;
  justify-content: flex-end;
}

.movie-type {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  padding: 4px 8px;
  border-radius: 4px;
}

.content-title {
  font-size: 1rem;
  color: white;
  margin: 0;
  font-weight: 500;
}

.release-year {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
}

/* Mobile (до 768px) */
@media (max-width: 768px) {
  .content-section {
    padding: 0 20px;
  }

  .content-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .content-card {
    aspect-ratio: 2/3;
  }
}

/* Tablet (769px - 1024px) */
@media (min-width: 769px) {
  .content-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .content-card {
    aspect-ratio: 2/3;
  }
}

/* Desktop (>1024px) */
@media (min-width: 1025px) {
  .content-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

/* Skeleton styles */
.skeleton {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  animation: pulse 1.5s infinite;
}

.skeleton-poster {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.05);
}

@keyframes pulse {
  0% { opacity: 0.3; }
  50% { opacity: 0.1; }
  100% { opacity: 0.3; }
}

.trend-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--spacing-base);
  width: 100%;
}

.poster {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  transition: transform 0.2s ease;
  will-change: transform; /* Оптимизация производительности */
  backface-visibility: hidden; /* Предотвращает мерцание */
}

.poster-wrapper {
  position: relative;
  width: 100%;
  padding-top: 150%; /* Соотношение сторон 2:3 */
  overflow: hidden;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1); /* Placeholder до загрузки */
}

.poster-wrapper img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* Оптимизация для мобильных устройств */
@media (max-width: 768px) {
  .trend-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
  }
}
</style>
