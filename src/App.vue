<script setup>
import { ref, watch } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';
import { Icon } from '@iconify/vue';

const route = useRoute();
const showSidebar = ref(true);

watch(() => route.query.hideMenu, (newVal) => {
  showSidebar.value = !newVal;
}, { immediate: true });
</script>

<template>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <div class="app-container">
    <aside class="sidebar" v-show="showSidebar">
      <div class="logo">N</div>
      <nav>
        <RouterLink to="/" class="nav-item" title="Главная">
          <Icon icon="material-symbols:home-outline" width="24" />
          <span class="nav-text">Главная</span>
        </RouterLink>
        <RouterLink to="/movies" class="nav-item" title="Фильмы">
          <Icon icon="material-symbols:movie-outline" width="24" />
          <span class="nav-text">Фильмы</span>
        </RouterLink>
        <RouterLink to="/series" class="nav-item" title="Сериалы">
          <Icon icon="material-symbols:tv-outline" width="24" />
          <span class="nav-text">Сериалы</span>
        </RouterLink>
        <RouterLink to="/favorites" class="nav-item" title="Избранное">
          <Icon icon="mdi:heart-outline" width="24" />
          <span class="nav-text">Избранное</span>
        </RouterLink>
      </nav>
    </aside>
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style>
:root {
  /* Основные цвета */
  --background: #000000;
  --surface: rgba(0, 0, 0, 0.3);
  --surface-light: rgba(255, 255, 255, 0.05);
  --button-bg: rgba(255, 255, 255, 0.1);
  --button-hover: rgba(255, 255, 255, 0.2);
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --blur-bg: rgba(0, 0, 0, 0.7);
  --mobile-padding: 1rem;
  --mobile-bottom-offset: 60px;
}

body {
  background-color: var(--background);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

/* Общие стили */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

/* Контейнер приложения */
.app-container {
  display: flex;
  min-height: 100vh;
  overflow-x: hidden;
}

/* Стили для бокового меню */
.sidebar {
  width: 60px;
  background-color: var(--surface);
  padding: 1rem 0;
  position: fixed;
  height: 100vh;
  transition: width 0.3s ease;
  z-index: 1000;
  backdrop-filter: blur(10px);
  border: none;
}

.sidebar:hover {
  width: 200px;
}

/* Логотип */
.logo {
  color: #e50914;
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 2rem;
}

/* Навигация */
nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.2s ease;
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  margin: 4px 8px;
}

.nav-item .iconify {
  margin: 0 auto;
  width: 24px;
  transition: margin 0.3s ease;
}

.sidebar:hover .nav-item .iconify {
  margin: 0;
}

.nav-item:hover {
  background-color: var(--surface-light);
  color: var(--text-primary);
}

.nav-item.router-link-active {
  background-color: var(--surface-light);
  color: var(--accent);
  font-weight: 500;
}

.nav-text {
  margin-left: 1rem;
  opacity: 0;
  white-space: nowrap;
  transform: translateX(-20px);
  transition: all 0.3s ease;
  width: 0;
}

.sidebar:hover .nav-text {
  opacity: 1;
  transform: translateX(0);
  width: auto;
}

/* Основной контент */
.main-content {
  flex: 1;
  margin-left: 60px;
  min-height: 100vh;
  width: 100%;
}

/* Адаптивность */
@media (max-width: 768px) {
  .sidebar {
    height: var(--mobile-bottom-offset);
    bottom: 0;
    width: 100%;
    flex-direction: row;
    justify-content: space-around;
    padding: 0;
  }

  .sidebar:hover {
    width: 100%;
  }

  .logo {
    display: none;
  }

  nav {
    flex-direction: row;
    justify-content: space-around;
    height: 100%;
  }

  .nav-item {
    flex-direction: column;
    padding: 0.5rem;
    gap: 0.25rem;
  }

  .nav-item .iconify {
    margin: 0;
  }

  .nav-text {
    font-size: 0.75rem;
    margin-left: 0;
    opacity: 1;
    transform: none;
    width: auto;
  }

  .main-content {
    margin-left: 0;
    padding: var(--mobile-padding);
    padding-bottom: calc(var(--mobile-bottom-offset) + 1rem);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
}

/* Общие стили для карточек */
.content-card, .movie-card, .series-card {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
}

.content-card img, .movie-card img, .series-card img {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  display: block;
}

.content-overlay, .movie-overlay, .series-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.meta-info {
  background: linear-gradient(rgba(0, 0, 0, 0.8), transparent);
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.content-title, .movie-title, .series-title {
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.9));
  padding: 1rem;
  margin: 0;
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
  line-height: 1.2;
  height: auto;
  min-height: 3.5rem;
  display: flex;
  align-items: flex-end;
}

/* Стили для страниц деталей */
.details-title {
  font-size: 2rem;
  margin: 0;
  margin-bottom: 1rem;
  color: white;
  background: none;
  padding: 0;
  min-height: auto;
}

@media (max-width: 600px) {
  .content-title, .movie-title, .series-title {
    font-size: 0.85rem;
    min-height: 3rem;
  }
}

/* Стили для контейнера кнопок в деталях */
.poster-buttons {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  margin-top: 1rem;
  width: 100%;
}

.poster-buttons > * {
  flex: 1;
}

@media (max-width: 768px) {
  .poster-buttons {
    flex-wrap: wrap;
  }

  .poster-buttons > * {
    min-width: unset;
  }

  .poster-buttons > :first-child {
    min-width: 200px;
  }
}

/* Кнопки */
.watch-button {
  color: white;
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  font-weight: 500;
  transition: all 0.2s ease;
}

.watch-button:hover {
  transform: translateY(-1px);
}

/* Карточки */
.content-card {
  background-color: var(--surface);
  border-radius: 8px;
  overflow: hidden;
}

.content-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>