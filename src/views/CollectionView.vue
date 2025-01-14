<template>
  <div class="collection-page" v-if="collection">
    <h1 class="collection-title">{{ collection.name }}</h1>
    <div class="movies-grid">
      <div
        v-for="movie in collection.parts"
        :key="movie.id"
        class="movie-card"
        @click="router.push(`/movie/${movie.id}`)"
      >
        <img
          :src="`https://imagetmdb.com/t/p/w342${movie.poster_path}`"
          :alt="movie.title"
          class="movie-poster"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/plugins/axios'

const router = useRouter()
const route = useRoute()
const collection = ref(null)

onMounted(async () => {
  try {
    const collectionId = localStorage.getItem('currentCollectionId')
    if (!collectionId) {
      router.push('/collections')
      return
    }

    if (collectionId.startsWith('combined-')) {
      const ids = collectionId.split('-').slice(1)
      const collections = await Promise.all(
        ids.map(id => api.get(`collection/${id}`, {
          params: { language: 'ru-RU' }
        }).then(res => res.data))
      )

      collection.value = {
        name: route.params.slug
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        parts: collections.flatMap(c => c.parts)
      }
    } else {
      const { data } = await api.get(`collection/${collectionId}`, {
        params: { language: 'ru-RU' }
      })
      data.name = data.name.replace(/\s*коллекция\s*/gi, '')
      collection.value = data
    }

    document.title = `${collection.value.name} | oxyge tv`
  } catch (error) {
    console.error('Error fetching collection:', error)
    router.push('/collections')
  }
})

onUnmounted(() => {
  localStorage.removeItem('currentCollectionId')
})
</script>

<style scoped>
.collection-title {
  font-size: 2rem;
  font-weight: 600;
  margin: 0;
  padding: var(--spacing-base);
  color: white;
  margin-bottom: var(--spacing-base);
}

.collection-page {
  padding: var(--spacing-large);
}

.movies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--spacing-base);
}

.movie-card {
  cursor: pointer;
  transition: transform 0.2s ease;
  border-radius: 8px;
  overflow: hidden;
}

.movie-card:hover {
  transform: translateY(-4px);
}

.movie-poster {
  width: 100%;
  aspect-ratio: 2/3;
  object-fit: cover;
}
</style>
