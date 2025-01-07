<script setup>
import { RouterView, useRouter } from 'vue-router'
import SideMenu from './components/SideMenu.vue'
import { useContentStore } from './stores/content'
import { onMounted } from 'vue'

const contentStore = useContentStore()
const router = useRouter()

// Сброс позиции прокрутки при каждом переходе
router.beforeEach((to, from, next) => {
  // Прокручиваем страницу вверх
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'instant' // Используем 'instant' вместо 'smooth' для мгновенной прокрутки
  })
  next()
})

onMounted(async () => {
  await contentStore.fetchMovies()
})
</script>

<template>
  <div class="app">
    <SideMenu />
    <main class="main-content">
      <RouterView v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>
  </div>
</template>

<style>
.app {
  display: flex;
  min-height: 100vh;
}

main {
  flex: 1;
  margin-left: 60px;
  transition: margin-left 0.3s ease;
}

@media (max-width: 768px) {
  main {
    margin-left: 0;
    padding-bottom: var(--mobile-bottom-offset);
  }
}

main.no-menu {
  margin-left: 0;
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
