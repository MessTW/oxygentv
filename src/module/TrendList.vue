<template>
  <section class="section">
    <div class="section-header">
      <h2>{{ title }}</h2>
    </div>
    <div v-if="heroStore.isLoading" class="content-grid">
      <div v-for="n in 10" :key="n" class="content-card skeleton">
        <div class="skeleton-poster"></div>
      </div>
    </div>
    <div v-else class="content-grid">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="content-card"
        @click="navigateToContent(item)"
      >
        <div class="card-image">
          <LazyImage
            :src="`https://imagetmdb.com/t/p/w780${item.backdrop_path}`"
            :alt="getTitle(item)"
            class="backdrop-image"
          />
          <div class="logo-container" v-if="item.images?.logos?.length">
            <img
              :src="`https://imagetmdb.com/t/p/w500${getPreferredLogo(item.images.logos).file_path}`"
              :alt="getTitle(item)"
              class="logo-image"
            />
          </div>
          <div class="title-fallback" v-else>
            {{ getTitle(item) }}
          </div>
          <div class="title-corner">
            {{ getTitle(item) }}
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

const filteredItems = computed(() => {
  return heroStore.trendingItems
    .filter(item => item.backdrop_path && (item.media_type === 'movie' || item.media_type === 'tv'))
    .sort(() => Math.random() - 0.5);
});

const getTitle = (item) => {
  return item.media_type === 'movie' ? item.title : item.name;
};

const getPreferredLogo = (logos) => {
  if (!logos?.length) return null
  const ruLogo = logos.find(logo => logo.iso_639_1 === 'ru')
  if (ruLogo) return ruLogo
  const enLogo = logos.find(logo => logo.iso_639_1 === 'en')
  if (enLogo) return enLogo
  return logos[0]
}

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
.section {
  margin: -1rem 0;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 0 4%;
}

.section-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #fff;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 0 4%;
}

.content-card {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
}

.content-card:hover {
  transform: translateY(-5px);
}

.card-image {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
}

.backdrop-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.logo-container {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%);
}

.logo-image {
  max-width: 80%;
  max-height: 80%;
  object-fit: contain;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.7)) invert(0) !important;
}

.title-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%);
  text-align: center;
  font-size: 1.5rem;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

.title-corner {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  right: 1rem;
  color: white;
  font-size: 1rem;
  font-weight: 500;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  z-index: 2;
  text-align: left;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.media-type {
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
}

.meta-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  justify-content: center;
}

.dot {
  font-size: 0.5rem;
}

/* Skeleton Loading */
.skeleton {
  background: rgba(255, 255, 255, 0.1);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 0.3; }
  100% { opacity: 0.6; }
}

/* Mobile Optimization */
@media (max-width: 768px) {
  .section-header {
    padding: 0 1rem;
  }

  .content-grid {
    padding: 0 1rem;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
  }

  .title-fallback {
    font-size: 0.9rem;
  }

  .meta-info {
    font-size: 0.75rem;
  }
}
</style>
