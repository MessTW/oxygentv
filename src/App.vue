<script setup>
import { RouterView, useRouter } from 'vue-router'
import { onMounted } from 'vue'
import SideMenu from './components/SideMenu.vue'
import LoadingScreen from './components/LoadingScreen.vue'
import { useContentStore } from './stores/content'
import { useLogoStore } from './stores/logoStore'
import { useLoadingStore } from './stores/loadingStore'

const contentStore = useContentStore()
const logoStore = useLogoStore()
const loadingStore = useLoadingStore()
const router = useRouter()

// Инициализация приложения
const initializeApp = async () => {
  try {
    loadingStore.updateProgress(10)

    // Загружаем фильмы
    await contentStore.fetchMovies()
    loadingStore.updateProgress(40)

    // Предварительно загружаем логотипы
    const moviesToPreload = contentStore.trendingMovies?.slice(0, 5) || []
    await logoStore.prefetchLogos(
      moviesToPreload,
      contentStore.baseUrl,
      contentStore.apiKey
    )
    loadingStore.updateProgress(80)

    await new Promise(resolve => setTimeout(resolve, 500))
    loadingStore.updateProgress(100)

    setTimeout(() => {
      loadingStore.setLoading(false)
    }, 500)
  } catch (error) {
    console.error('Error initializing app:', error)
    loadingStore.setLoading(false)
  }
}

// Сброс позиции прокрутки при каждом переходе
router.beforeEach((to, from, next) => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'instant'
  })
  next()
})

onMounted(() => {
  initializeApp()
})
</script>

<template>
  <LoadingScreen
    :is-loading="loadingStore.isLoading"
    :progress="loadingStore.progress"
  />
  <div class="app" :class="{ 'app-loaded': !loadingStore.isLoading }">
    <div class="app-layout">
      <SideMenu class="app-sidebar" />
      <main class="app-main">
        <RouterView v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<style>
:root {
  /* Базовые размеры */
  --content-width: min(1800px, 100%);
  --header-height: 60px;
  --side-menu-width: 60px;
  --mobile-bottom-nav-height: 60px;

  /* Отступы */
  --spacing-base: 1rem;
  --spacing-large: 2rem;
  --spacing-logo: -0.5rem;
  --spacing-featured-info-bottom: 20rem;
  --spacing-featured-info-side: 2rem;
  --spacing-featured-info-mobile: 5rem;

  /* Отступы для мобильных устройств */
  --spacing-mobile: 1rem;
  --featured-height-mobile: 70vh;

  /* Размеры текста */
  --font-size-h1: 2rem;
  --font-size-h2: 1.8rem;
  --font-size-body: 1rem;
  --font-size-small: 0.9rem;

  /* Размеры компонентов */
  --button-height: 48px;
  --card-width: 250px;
}

.app {
  min-height: 100vh;
  width: 100%;
  opacity: 0;
  transition: opacity 0.5s ease;
}

.app-loaded {
  opacity: 1;
}

.app-layout {
  display: flex;
  min-height: 100vh;
  width: 100%;
}

.app-sidebar {
  flex: 0 0 var(--side-menu-width);
  position: fixed;
  height: 100vh;
  z-index: 100;
}

.app-main {
  flex: 1;
  width: 100%;
  margin-left: var(--side-menu-width);
  max-width: 100%;
}

@media (max-width: 768px) {
  .app-layout {
    flex-direction: column;
  }

  .app-sidebar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: var(--mobile-bottom-nav-height);
    order: 2;
    background: var(--background);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .app-main {
    margin-left: 0;
    width: 100%;
    padding-bottom: var(--mobile-bottom-nav-height);
    min-height: calc(100vh - var(--mobile-bottom-nav-height));
  }
}

/* Анимации переключения страниц */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
