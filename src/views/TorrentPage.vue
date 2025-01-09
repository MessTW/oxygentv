<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import TorrentList from '../components/TorrentList.vue';

const route = useRoute();
const router = useRouter();
const content = ref(null);
const loading = ref(true);

const goBack = () => {
  const type = route.name === 'movie-torrents' ? 'movie' : 'series';
  router.push(`/${type}/${route.params.id}`);
};

onMounted(async () => {
  const endpoint = route.name === 'movie-torrents' ? 'movie' : 'tv';
  const id = route.params.id;

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/${endpoint}/${id}?api_key=d341436234a2bb8f0adc73114e093ab2&language=ru-RU`
    );
    const data = await response.json();

    content.value = {
      title: data.title || data.name,
      originalTitle: data.original_title || data.original_name,
      year: new Date(data.release_date || data.first_air_date).getFullYear()
    };

    document.title = `${content.value.title}`;
  } catch (e) {
    console.error('Error fetching content:', e);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="torrent-page">
    <button class="back-button" @click="goBack">
      <Icon icon="mdi:arrow-left" width="24" />
      <span>Назад к описанию</span>
    </button>
    <div v-if="loading" class="loading">
      <div class="loader"></div>
    </div>
    <div v-else-if="content">
      <h1 class="page-title">Список торрент трекеров для {{ content.title }}</h1>
      <TorrentList
        :title="content.title"
        :original-title="content.originalTitle"
        :year="content.year"
        :is-open="true"
      />
    </div>
  </div>
</template>

<style scoped>
.torrent-page {
  padding: var(--spacing-large);
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  margin-bottom: var(--spacing-large);
  color: var(--text-primary);
  font-size: 1.8rem;
}

.loading {
  display: flex;
  justify-content: center;
  padding: var(--spacing-large);
}

.loader {
  width: 24px;
  height: 24px;
  border: 2px solid var(--text-secondary);
  border-bottom-color: transparent;
  border-radius: 50%;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .torrent-page {
    padding: var(--spacing-mobile);
  }

  .page-title {
    font-size: 1.3rem;
    margin-bottom: var(--spacing-mobile);
    line-height: 1.3;
  }

  .loading {
    padding: var(--spacing-mobile);
  }

  .back-button {
    width: 100%;
    justify-content: center;
    padding: calc(var(--spacing-mobile) * 0.5) var(--spacing-mobile);
    font-size: 0.9rem;
    margin-bottom: var(--spacing-mobile);
  }
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--surface);
  border: none;
  border-radius: 8px;
  color: var(--text-primary);
  cursor: pointer;
  margin-bottom: var(--spacing-base);
  transition: background 0.2s;
  font-size: 1rem;
}

.back-button:hover {
  background: var(--surface-hover);
}
</style>
