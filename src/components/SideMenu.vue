<script setup>
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import { useUIStore } from '../stores/ui';

const uiStore = useUIStore();

const isVisible = computed(() => !uiStore.isPlayerOpen);


</script>

<template>
  <aside class="sidebar" v-show="isVisible">
    <div class="logo">N</div>
    <nav>
      <RouterLink to="/" class="nav-item" title="Главная">
        <Icon icon="material-symbols:home-outline" width="24" />
      </RouterLink>
      <RouterLink to="/search" class="nav-item" title="Поиск">
        <Icon icon="iconamoon:search-fill" width="24" />
      </RouterLink>
      <RouterLink to="/favorites" class="nav-item" title="Избранное">
        <Icon icon="mdi:heart-outline" width="24" />
      </RouterLink>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  background-color: var(--surface);
  position: fixed;
  left: 0;
  padding: 1rem 0;
  height: 100vh;
  transition: width 0.3s ease;
  z-index: 10;
  backdrop-filter: blur(10px);
  border: none;
  width: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo {
  color: var(--accent);
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 2rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background-color: var(--surface-light);
}

nav {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  width: 100%;
  margin: auto 0;
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  margin: 4px;
  width: 44px;
  height: 44px;
}

.nav-item .iconify {
  width: 24px;
  height: 24px;
}

.nav-item:hover {
  background-color: var(--surface-light);
  color: var(--text-primary);
  transform: scale(1.1);
}

.nav-item.router-link-active {
  background-color: var(--surface-light);
  color: var(--accent);
  font-weight: 500;
}

@media (max-width: 768px) {
  .sidebar {
    height: var(--mobile-bottom-offset);
    bottom: 0;
    width: 100%;
    position: fixed;
    flex-direction: row;
    justify-content: space-around;
    padding: 0;
    background-color: rgba(0, 0, 0, 0.8);
    left: 0;
  }

  .logo {
    display: none;
  }

  nav {
    flex-direction: row;
    justify-content: space-around;
    height: 100%;
    max-width: 300px;
    margin: 0 auto;
  }

  .nav-item {
    padding: 0.5rem;
    margin: 0;
  }
}
</style>
