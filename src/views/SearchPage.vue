<template>
  <div class="search-page">
    <section class="search-section">
      <div class="search-container">
        <div class="search-input-wrapper">
          <Icon icon="mynaui:search-solid" width="28" class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="Поиск фильмов и сериалов..."
            @input="handleSearch"
          >
          <button v-if="searchQuery" class="clear-button" @click="clearSearch">
            <Icon icon="mdi:close" width="20" />
          </button>
          <button class="filter-button" @click="showFilters = !showFilters">
            <Icon icon="lucide:settings-2" width="28" />
      </button>
        </div>

        <!-- Фильтры -->
        <div v-if="showFilters" class="filters-panel">
          <div class="content-type-filter">
      <button
              v-for="type in contentTypes"
              :key="type.value"
              :class="{ active: selectedType === type.value }"
              @click="handleTypeSelect(type.value)"
            >
              <Icon :icon="type.icon" width="20" />
              {{ type.label }}
      </button>
    </div>

      <div class="genres-filter">
        <button
          class="genre-chip"
          :class="{ active: selectedGenre === null }"
          @click="handleGenreSelect(null)"
        >
              Все жанры
        </button>
        <button
              v-for="genre in currentGenres"
          :key="genre.id"
          class="genre-chip"
          :class="{ active: selectedGenre === genre.id }"
          @click="handleGenreSelect(genre.id)"
        >
          {{ genre.name }}
        </button>
      </div>

          <div class="studios-filter" v-if="showStudios">
            <div class="filter-section-title">{{ selectedType === 'tv' ? 'Телестудии' : 'Киностудии' }}</div>
            <div class="studios-grid">
              <button
                v-for="studio in studios"
                :key="studio.id"
                class="studio-chip"
                :class="{ active: selectedStudio === studio.id }"
                @click="handleStudioSelect(studio.id)"
              >
                <img
                  v-if="studio.logo_path"
                  :src="`https://imagetmdb.com/t/p/w92${studio.logo_path}`"
                  :alt="studio.name"
                  class="studio-logo"
                  :class="{ 'invert': shouldInvertLogo(studio.id) }"
                >
                <span v-else>{{ studio.name }}</span>
          </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Results Section -->
    <div class="results-section" v-if="items.length">
      <div class="pagination-controls">
        <button
          class="pagination-button"
          @click="prevPage"
          :disabled="page === 1"
        >
          <Icon icon="mdi:chevron-left" width="24" />
          Назад
        </button>
        <span class="pagination-info">Страница {{ page }}</span>
        <button
          class="pagination-button"
          @click="nextPage"
          :disabled="!hasMorePages"
        >
          Вперед
          <Icon icon="mdi:chevron-right" width="24" />
        </button>
      </div>

      <div class="results-grid">
        <div
          v-for="item in items"
          :key="item.id"
          class="result-card"
          @click="navigateToDetails(item)"
        >
          <div class="poster-wrapper">
            <img
              :src="item.poster_path
                ? `https://imagetmdb.com/t/p/w342${item.poster_path}`
                : '/no-poster.png'"
              :alt="getTitle(item)"
              class="poster"
            >
          </div>
          <div class="card-info">
            <div class="title">{{ getTitle(item) }}</div>
          </div>
        </div>
      </div>

      <div v-if="isLoading" class="loading-state">
        <div class="loader"></div>
      </div>
    </div>

    <!-- Empty State -->
    <div class="empty-state" v-else-if="searchQuery && !isLoading">
      <Icon icon="mdi:movie-search" width="64" class="empty-icon" />
      <p class="empty-text">Ничего не найдено</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useContentStore } from '@/stores/content'
import { API_KEY, TMDB_BASE_URL } from '@/config/api'

const router = useRouter()
const contentStore = useContentStore()
const searchQuery = ref('')
const searchResults = ref([])
const isLoading = ref(false)
const selectedGenre = ref(null)
const page = ref(1)
const allItems = ref([])
const totalPages = ref(1)
const hasMorePages = computed(() => page.value < totalPages.value)

// Объединяем результаты поиска и обычного контента
const items = computed(() => {
  if (searchQuery.value) {
    return searchResults.value
  }
  return allItems.value
})

onMounted(async () => {
  await Promise.all([
    contentStore.fetchGenres('movie'),
    contentStore.fetchGenres('tv')
  ])
  await fetchStudios()
  await loadPage()
})

// Сброс и первая загрузка
const resetAndLoad = async () => {
  page.value = 1
  totalPages.value = 1
  allItems.value = []
  searchResults.value = []
  await loadPage()
}

// Обработчики
const handleSearch = () => {
  resetAndLoad()
}

const handleGenreSelect = async (genreId) => {
  selectedGenre.value = genreId
  resetAndLoad()
}

const clearSearch = () => {
  searchQuery.value = ''
  page.value = 1
  resetAndLoad()
}

const getTitle = (item) => {
  return item.media_type === 'movie' || selectedType.value === 'movie'
    ? (item.title || item.original_title)
    : (item.name || item.original_name)
}

const navigateToDetails = (item) => {
  router.push({
    name: 'cinema-details',
    params: {
      type: item.media_type || selectedType.value,
      id: item.id
    }
  })
}

const showFilters = ref(false)
const selectedType = ref('movie')

const currentGenres = computed(() => {
  if (selectedType.value === 'movie') return contentStore.movieGenres
  if (selectedType.value === 'tv') return contentStore.tvGenres
  return []
})

const selectedStudio = ref(null)
const studios = ref([])
const showStudios = computed(() => selectedType.value !== 'all')

const darkLogoStudios = {
  tv: [49, 2552, 318, 174, 3353], // Netflix, Amazon, Hulu
  movie: [2, 4, 25, 7, 34, 1632, 21, 5] // Disney, Universal, Paramount, 20th Century, Sony
}

// Функция определения инверсии логотипа
const shouldInvertLogo = (id) => {
  // Если студия выбрана и она в списке darkLogoStudios, отменяем инверсию
  if (selectedStudio.value === id && darkLogoStudios[selectedType.value]?.includes(id)) {
    return false
  }
  // В остальных случаях инвертируем по списку
  return darkLogoStudios[selectedType.value]?.includes(id)
}

// Обновим массив студий
const popularStudios = {
  movie: [
    { id: 2, name: 'Disney', logo_path: '/wdrCwmRnLFJhEoH8GSfymY85KHT.png' },
    { id: 33, name: 'Universal Pictures', logo_path: '/8lvHyhjr8oUKOOy2dKXoALWKdp0.png' },
    { id: 4, name: 'Paramount', logo_path: '/fycMZt242LVjagMByZOLUGbCvv3.png' },
    { id: 25, name: '20th Century Studios', logo_path: '/qZCc1lty5FzX30aOCVRBLzaVmcp.png' },
    { id: 7, name: 'DreamWorks', logo_path: '/vru2SssLX3FPhnKZGtYw00pVIS9.png' },
    { id: 34, name: 'Sony Pictures', logo_path: '/jqgK6CSkPrEsIv6Nk390JaBcXYF.png' },
    { id: 1632, name: 'Lionsgate', logo_path: '/cisLn1YAUuptXVBa0xjq7ST9cH0.png' },
    { id: 21, name: 'Metro-Goldwyn-Mayer', logo_path: '/aOWKh4gkNrfFZ3Ep7n0ckPhoGb5.png' },
    { id: 5, name: 'Columbia Pictures', logo_path: '/71BqEFAF4V3qjjMPCpLuyJFB9A.png' },
    { id: 174, name: 'Warner Bros. Pictures', logo_path: '/IuAlhI9eVC9Z8UQWOIDdWRKSEJ.png' }
  ],
  tv: [
    { id: 213, name: 'Netflix', logo_path: '/wwemzKWzjKYJFfCeiB57q3r4Bcm.png' },
    { id: 2739, name: 'Amazon', logo_path: '/ifhbNuuVnlwYy5oXA5VIb2YR8AZ.png' },
    { id: 453, name: 'Hulu', logo_path: '/pqUTCleNUiTLAVlelGxUgWn1ELh.png' },
    { id: 49, name: 'HBO', logo_path: '/tuomPhY2UtuPTqqFnKMVHvSb724.png' },
    { id: 2552, name: 'Apple TV+', logo_path: '/4KAy34EHvRM25Ih8wb82AuGU7zJ.png' },
    { id: 174, name: 'AMC', logo_path: '/pmvRmATOCaDykE6JrVoeYxlFHw3.png' },
    { id: 67, name: 'Showtime', logo_path: '/Allse9kbjiP6ExaQrnSpIhkurEi.png' },
    { id: 4330, name: 'Paramount+', logo_path: '/fi83B1oztoS47xxcemFdPMhIzK.png' },
    { id: 318, name: 'Starz', logo_path: '/8GJjw3HHsAJYwIWKIPBPfqMxlEa.png' },
    { id: 3353, name: 'Peacock', logo_path: '/gIAcGTjKKr0KOHL5s4O36roJ8p7.png' }
  ]
}

const fetchStudios = async () => {
  studios.value = popularStudios['movie']
}

// Обработчик выбора студии
const handleStudioSelect = (studioId) => {
  selectedStudio.value = selectedStudio.value === studioId ? null : studioId
  resetAndLoad()
}

// Обновим функцию handleTypeSelect
const handleTypeSelect = async (type) => {
  selectedType.value = type
  selectedGenre.value = null
  selectedStudio.value = null
  studios.value = popularStudios[type]
  resetAndLoad()
}

// Обновим функцию loadPage для учета выбранной студии
const loadPage = async () => {
  if (isLoading.value) return
  isLoading.value = true

  try {
    if (searchQuery.value) {
      // Поиск по обоим типам контента
      const [moviesResponse, tvResponse] = await Promise.all([
        fetch(`${TMDB_BASE_URL}/search/movie?api_key=${API_KEY}&language=ru&query=${encodeURIComponent(searchQuery.value)}&page=${page.value}`),
        fetch(`${TMDB_BASE_URL}/search/tv?api_key=${API_KEY}&language=ru&query=${encodeURIComponent(searchQuery.value)}&page=${page.value}`)
      ])

      const [moviesData, tvData] = await Promise.all([
        moviesResponse.json(),
        tvResponse.json()
      ])

      // Фильтруем и объединяем результаты
      const movies = moviesData.results
        .filter(item => {
          return item.poster_path &&
                 item.title !== item.original_title &&
                 new Date(item.release_date) <= new Date()
        })
        .map(item => ({ ...item, media_type: 'movie' }))

      const tvShows = tvData.results
        .filter(item => {
          return item.poster_path &&
                 item.name !== item.original_name &&
                 new Date(item.first_air_date) <= new Date()
        })
        .map(item => ({ ...item, media_type: 'tv' }))

      // Объединяем и сортируем по популярности
      searchResults.value = [...movies, ...tvShows]
        .sort((a, b) => b.popularity - a.popularity)

      totalPages.value = Math.max(moviesData.total_pages, tvData.total_pages)
    } else {
      const studioParam = selectedStudio.value ?
        (selectedType.value === 'tv' ? `&with_networks=${selectedStudio.value}` :
         `&with_companies=${selectedStudio.value}`) : ''

      const { results, total_pages } = await contentStore.fetchContent(
        page.value,
        selectedGenre.value,
        selectedType.value,
        studioParam
      )
      totalPages.value = total_pages
      allItems.value = results
    }
  } catch (error) {
    console.error('Load error:', error)
  } finally {
    isLoading.value = false
  }
}

const prevPage = async () => {
  if (page.value > 1) {
    page.value--
    await loadPage()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const nextPage = async () => {
  if (hasMorePages.value) {
    page.value++
    await loadPage()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const contentTypes = [
  { value: 'movie', label: 'Фильмы', icon: 'material-symbols:movie' },
  { value: 'tv', label: 'Сериалы', icon: 'material-symbols:tv' }
]
</script>

<style scoped>
.genres-filter {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0 2% 1rem;
  margin-bottom: 1rem;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.genres-filter::-webkit-scrollbar {
  display: none;
}

.genre-chip {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  font-size: 0.9rem;
}

.genre-chip:hover {
  background: rgba(255, 255, 255, 0.2);
}

.genre-chip.active {
  background: white;
  color: black;
}

.search-page {
  min-height: 100vh;
  padding: 2rem;
  background: #0A0A0A;
}

.search-section {
  margin-bottom: 2rem;
}

.search-container {
  max-width: 800px;
  margin: 0 auto;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 0.75rem 1rem;
}

.search-icon {
  color: rgba(255, 255, 255, 0.5);
  margin-right: 0.75rem;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  color: white;
  font-size: 1.1rem;
  outline: none;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.clear-button {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.clear-button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 2rem;
  padding: 0 2%;
}

.result-card {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
}

.result-card:hover {
  transform: translateY(-5px);
}

.poster-wrapper {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 2/3;
}

.poster {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-type-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  backdrop-filter: blur(4px);
}

.card-info {
  padding: 0.75rem 0.5rem;
  text-align: center;
}

.title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: #fff;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 0;
  color: rgba(255, 255, 255, 0.5);
}

.empty-icon {
  margin-bottom: 1rem;
}

.empty-text {
  font-size: 1.1rem;
  margin: 0;
}

.loading-state {
  padding: 2rem;
  display: flex;
  justify-content: center;
}

.loader {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .search-page {
    padding: 1rem;
  }

  .results-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .title {
    font-size: 0.9rem;
  }

  .meta {
    font-size: 0.8rem;
  }
}

.content-type-switch {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.content-type-switch button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(0, 0, 0, 0.8);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.content-type-switch button:hover {
  background: rgba(255, 255, 255, 0.15);
}

.content-type-switch button.active {
  background: var(--button-hover);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.pagination-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.results-section {
  min-height: 100vh;
}

.load-more-trigger {
  width: 100%;
  height: 20px;
  margin-top: 20px;
}

.filter-button {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  margin-left: 0.5rem;
}

.filter-button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.filters-panel {
  position: absolute;
  z-index: 100;
  width: 100%;
  top: 100%;
  left: 0;
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  margin-top: 1rem;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.search-container {
  position: relative;
}

.search-section {
  position: sticky;
  top: 0;
  z-index: 100;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.8) 0%, transparent 100%);
  padding: 1rem;
}

.content-type-filter {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.content-type-filter button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
}

.content-type-filter button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.content-type-filter button.active {
  background: white;
  color: black;
  border-color: white;
}

.genres-filter {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0.5rem 0;
}

.genre-chip {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  padding: 0.5rem 1rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.genre-chip:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.genre-chip.active {
  background: white;
  color: black;
  border-color: white;
}

@media (max-width: 768px) {
  .content-type-filter {
    justify-content: center;
  }

  .genres-filter {
    justify-content: center;
  }
}

.studios-filter {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.filter-section-title {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 1rem;
}

.studios-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
}

.studio-chip {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
}

.studio-chip:hover {
  background: rgba(255, 255, 255, 0.1);
}

.studio-chip.active {
  background: white;
  border-color: white;
  .studio-logo.invert {
    filter: none;
  }
}

.studio-logo {
  max-width: 100%;
  max-height: 40px;
  object-fit: contain;
}

.studio-logo.invert {
  filter: invert(1);
}

@media (max-width: 768px) {
  .studios-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
}
</style>
