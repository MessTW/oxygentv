<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'

const API_KEY = 'd341436234a2bb8f0adc73114e093ab2'
const BASE_URL = 'https://apitmdb.cub.red/3'

const trendingMovies = ref([])
const trendingSeries = ref([])
const featuredMovies = ref([])
const currentFeaturedIndex = ref(0)
const autoplayInterval = ref(null)
const progressInterval = ref(null)
const progress = ref(0)

const router = useRouter()

const fetchTrending = async () => {
  try {
    const moviesResponse = await fetch(
      `${BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=ru-RU`,
    )
    const moviesData = await moviesResponse.json()
    const filteredMovies = moviesData.results.filter(movie => 
      movie.title && 
      movie.title.trim() !== '' && 
      movie.overview && 
      movie.overview.trim() !== ''
    );

    trendingMovies.value = filteredMovies;
    featuredMovies.value = filteredMovies.slice(0, 5);

    const seriesResponse = await fetch(
      `${BASE_URL}/trending/tv/week?api_key=${API_KEY}&language=ru-RU`,
    )
    const seriesData = await seriesResponse.json()
    const filteredSeries = seriesData.results.filter(show => 
      show.name && 
      show.name.trim() !== '' && 
      show.overview && 
      show.overview.trim() !== ''
    );

    trendingSeries.value = filteredSeries;
  } catch (error) {
    console.error('Error:', error)
  }
}

const resetProgress = () => {
  progress.value = 0;
  if (progressInterval.value) {
    clearInterval(progressInterval.value);
  }
}

const startProgress = () => {
  resetProgress();
  progress.value = 0;
  progressInterval.value = setInterval(() => {
    progress.value += (100 / 80); // 100% за 8 секунд (80 * 100ms)
  }, 100);
}

const startAutoplay = () => {
  resetProgress();
  startProgress();
  autoplayInterval.value = setInterval(() => {
    const backdrop = document.querySelector('.featured-backdrop');
    backdrop.classList.add('transitioning');
    
    setTimeout(() => {
      currentFeaturedIndex.value = (currentFeaturedIndex.value + 1) % featuredMovies.value.length;
      setTimeout(() => {
        backdrop.classList.remove('transitioning');
      }, 300);
    }, 300);

    resetProgress();
    startProgress();
  }, 8000);
}

const stopAutoplay = () => {
  if (autoplayInterval.value) {
    clearInterval(autoplayInterval.value);
    clearInterval(progressInterval.value);
  }
}

const handleFeaturedClick = () => {
  if (featuredMovies.value[currentFeaturedIndex.value]) {
    router.push(`/movie/${featuredMovies.value[currentFeaturedIndex.value].id}`)
  }
}

const navigateToMovie = (movie) => {
  router.push(`/movie/${movie.id}`)
}

const navigateToSeries = (series) => {
  router.push(`/series/${series.id}`)
}

const switchToSlide = (index) => {
  if (autoplayInterval.value) {
    clearInterval(autoplayInterval.value);
  }
  resetProgress();

  const backdrop = document.querySelector('.featured-backdrop');
  backdrop.classList.add('transitioning');
  
  setTimeout(() => {
    currentFeaturedIndex.value = index;
    setTimeout(() => {
      backdrop.classList.remove('transitioning');
    }, 300);
  }, 300);

  startProgress();
  startAutoplay();
}

const showNextSlide = () => {
  currentFeaturedIndex.value = (currentFeaturedIndex.value + 1) % featuredMovies.value.length;
}

const showPrevSlide = () => {
  currentFeaturedIndex.value = currentFeaturedIndex.value === 0 
    ? featuredMovies.value.length - 1 
    : currentFeaturedIndex.value - 1;
}

onMounted(() => {
  fetchTrending()
  startAutoplay()
})

onUnmounted(() => {
  stopAutoplay()
  resetProgress()
})
</script>

<template>
  <div class="home">
    <section v-if="featuredMovies.length" class="hero">
      <div class="featured-content">
        <div class="featured-backdrop" :style="{
          backgroundImage: `url(https://imagetmdb.com/t/p/original${featuredMovies[currentFeaturedIndex].backdrop_path})`,
        }"></div>
        <div class="featured-info">
          <h2>{{ featuredMovies[currentFeaturedIndex].title }}</h2>
          <p>{{ featuredMovies[currentFeaturedIndex].overview }}</p>
          <div class="actions">
            <button class="video-button" @click="handleFeaturedClick">
              <Icon icon="material-symbols:play-arrow" width="24" />
              <span>Смотреть</span>
            </button>
          </div>
        </div>
        <div class="slider-dots">
          <button 
            v-for="(_, index) in featuredMovies" 
            :key="index"
            :class="['dot', { active: index === currentFeaturedIndex }]"
            @click="switchToSlide(index)">
            <div 
              v-if="index === currentFeaturedIndex" 
              class="progress-bar" 
              :style="{ transform: `scaleX(${progress / 100})` }"
            ></div>
          </button>
        </div>
      </div>
    </section>

    <section class="content-section">
      <h2>Фильмы в тренде</h2>
      <div class="content-grid">
        <div v-for="movie in trendingMovies" :key="movie.id" 
          class="content-card" 
          @click="navigateToMovie(movie)">
          <img :src="`https://imagetmdb.com/t/p/w500${movie.poster_path}`" :alt="movie.title" />
          <div class="content-overlay">
            <div class="meta-info">
              <span class="year">{{ movie.release_date?.split('-')[0] }}</span>
              <span class="rating">★ {{ movie.vote_average.toFixed(1) }}</span>
            </div>
            <h3 class="content-title">{{ movie.title }}</h3>
          </div>
        </div>
      </div>
    </section>

    <section class="content-section">
      <h2>Сериалы в тренде</h2>
      <div class="content-grid">
        <div v-for="series in trendingSeries" :key="series.id" 
          class="content-card" 
          @click="navigateToSeries(series)">
          <img :src="`https://imagetmdb.com/t/p/w500${series.poster_path}`" :alt="series.name" />
          <div class="content-overlay">
            <div class="meta-info">
              <span class="year">{{ series.first_air_date?.split('-')[0] }}</span>
              <span class="rating">★ {{ series.vote_average.toFixed(1) }}</span>
            </div>
            <h3 class="content-title">{{ series.name }}</h3>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  height: 80vh;
  position: relative;
  overflow: hidden;
  padding-bottom: 40px;
}

.featured-content {
  position: relative;
  height: 100%;
}

.featured-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8rem var(--mobile-padding) 80px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.9));
  z-index: 2;
  transition: opacity 0.3s ease;
  min-height: 45%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.featured-info h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.featured-info p {
  max-width: 600px;
  margin-bottom: 1.5rem;
  line-height: 1.6;
  font-size: 0.875rem;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  overflow: hidden;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.featured-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  filter: brightness(0.5);
  transition: opacity 0.3s ease;
}

.featured-backdrop.transitioning {
  opacity: 0;
}

.featured-button {
  padding: 0.8rem 2rem;
  font-size: 1.1rem;
  background-color: #e50914;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.featured-button:hover {
  background-color: #f40612;
}

.content-section {
  padding: var(--mobile-padding);
}

.content-section h2 {
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
}

.content-card {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  border: 3px solid transparent;
  transition: border-color 0.2s ease;
}

.content-card:hover {
  border-color: rgba(255, 255, 255, 0.3);
}

.content-card img {
  width: 100%;
  aspect-ratio: 2/3;
  object-fit: cover;
  display: block;
}

.content-card:hover img {
  filter: brightness(0.7);
}

.content-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  z-index: 1;
}

.meta-info {
  background: linear-gradient(rgba(0, 0, 0, 0.6), transparent);
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.rating, .year {
  color: white;
}

@media (max-width: 768px) {
  .hero {
    height: 50vh;
    padding-bottom: 50px;
  }

  .featured-info {
    padding: 8rem var(--mobile-padding) 5px;
    min-height: 50%;
  }

  .featured-info h2 {
    font-size: 1.5rem;
  }

  .featured-info p {
    font-size: 0.875rem;
    -webkit-line-clamp: 4;
    line-clamp: 4;
  }

  .video-button {
    width: 100%;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    margin-bottom: 20px;
  }

  .content-section {
    padding: var(--mobile-padding);
  }

  .content-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }

  .actions {
    margin-bottom: 1.5rem;
  }
}

.home {
  padding: 0;
}

.content-title {
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 1rem;
  margin: 0;
  color: white;
  font-size: 0.9rem;
}

.poster-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  position: relative;
  z-index: 2;
}

.video-button {
  width: fit-content;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  background-color: var(--button-bg);
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: white;
}

.video-button:hover {
  background-color: var(--button-hover);
}

.header-ratings {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  z-index: 2;
  position: relative;
}

.rating-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rating-value {
  font-size: 1.2rem;
  font-weight: 600;
}

.rating-icon {
  font-size: 24px;
  color: #f5c518;
}

.year, .genre {
  color: #999;
  font-size: 1rem;
}

.genre {
  padding: 0.2rem 0.5rem;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.content-card {
  transition: opacity 0.3s ease;
}

.info-footer {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

.meta-details {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.slider-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  z-index: 3;
  transition: all 0.2s ease;
}

.slider-nav:hover {
  background: rgba(0, 0, 0, 0.8);
}

.slider-nav.prev {
  left: 20px;
}

.slider-nav.next {
  right: 20px;
}

.slider-dots {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 3;
  padding: 20px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.5));
  width: 100%;
  justify-content: center;
}

.dot {
  width: 24px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.3);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  margin-bottom: 10px;
}

.dot.active {
  background: rgba(255, 255, 255, 0.5);
}

.progress-bar {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.1s linear;
}

.featured-info {
  transition: opacity 0.3s ease;
}

.featured-backdrop.transitioning + .featured-info {
  opacity: 0;
}

.actions {
  margin-top: 1.5rem;
  margin-bottom: 2rem;
}
</style>