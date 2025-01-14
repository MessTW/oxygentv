<template>
  <section class="smart-collections">
    <h1 class="section-title">Коллекции</h1>
    <div class="collections-grid">
      <div
        v-for="collection in collections"
        :key="collection.id"
        class="collection-card"
        :class="{ 'skeleton': isLoading }"
        @click="handleCollectionClick(collection)"
      >
        <img
          :src="`https://imagetmdb.com/t/p/w342${collection.poster_path}`"
          :alt="collection.name"
          class="collection-poster"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/plugins/axios'

const router = useRouter()
const isLoading = ref(true)
const collections = ref([])

const fetchCollectionDetails = async (collectionId) => {
  try {
    const { data } = await api.get(`collection/${collectionId}`, {
      params: { language: 'ru-RU' }
    })
    return data
  } catch (error) {
    console.error(`Error fetching collection ${collectionId}:`, error)
    return null
  }
}

const initializeCollections = async () => {
  const collectionIds = [
    86092, // Step Up Collection
    1241,  // Harry Potter
    119,   // Lord of the Rings
    295,   // Pirates of the Caribbean
    10,    // Star Wars Collection
    2980,  // The Hobbit
    263,   // The Dark Knight Collection
    9485,  // Fast & Furious
    87359, // Mission: Impossible
    2344,  // Transformers Collection
    84,    // Indiana Jones Collection
    328,   // Jurassic Park Collection
    435259,// Fantastic Beasts
    304,   // Ocean's Collection
    86066, // Predator Collection
    8091,  // Alien Collection
    1570,  // Die Hard Collection
    87118, // Terminator Collection
    1575   // The Matrix Collection
  ]

  // Простые комбинированные коллекции
  const combinedCollections = [
    {
      ids: [556, 125574, 531241, 573436], // Spider-Man (2002), Amazing Spider-Man, Spider-Verse
      name: 'Человек паук: Все фильмы',
      poster_path: '/rweIrveL43TaxUN0akQEaAXL6x0.jpg'
    },
    {
      ids: [86311, 131292, 531241], // Marvel + DC + другие фильмы Marvel
      name: 'Marvel',
      poster_path: '/tqXiOD5rTyHgabO73Tpw9JDbd88.jpg'
    }
  ]

  const collectionsData = await Promise.all(
    collectionIds.map(fetchCollectionDetails)
  )

  // Получаем данные для комбинированных коллекций
  const combinedData = await Promise.all(
    combinedCollections.map(async (combined) => {
      const collections = await Promise.all(
        combined.ids.map(fetchCollectionDetails)
      )
      // Фильтруем null значения и объединяем части
      const validCollections = collections.filter(Boolean)
      if (validCollections.length === 0) return null
      return {
        id: `combined-${combined.ids.join('-')}`,
        name: combined.name,
        poster_path: combined.poster_path,
        parts: validCollections.flatMap(c => c.parts)
      }
    })
  )

  collections.value = [
    ...collectionsData.filter(Boolean),
    ...combinedData.filter(Boolean)
  ].sort((a, b) => b.parts.length - a.parts.length)

  isLoading.value = false
}

const handleCollectionClick = (collection) => {
  const slug = collection.name
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s]/g, '')
    .replace(/\s+/g, '-')
  localStorage.setItem('currentCollectionId', collection.id)
  router.push({
    name: 'collection',
    params: { slug }
  })
}

onMounted(() => {
  initializeCollections()
})
</script>

<style scoped>
.section-title {
  font-size: 2rem;
  font-weight: 600;
  margin: 0;
  padding: var(--spacing-base);
  color: white;
}

.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-base);
  padding: var(--spacing-base);
}

.collection-card {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 2/3;
  cursor: pointer;
  background: var(--surface-variant);
}

.collection-card:hover {
}

.collection-poster {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Skeleton styles */
.collection-card.skeleton {
  background: rgba(255, 255, 255, 0.1);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 0.3; }
  100% { opacity: 0.6; }
}
</style>
