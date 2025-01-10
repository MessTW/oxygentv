<script setup>
import { computed, ref, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import { checkAdminAccess } from '../services/adminAuth';

const isVisible = computed(() => {
  const isPlayerPage = window.location.pathname.includes('/watch/');
  return !isPlayerPage;
});

const showAdminButton = ref(false);

onMounted(async () => {
  showAdminButton.value = await checkAdminAccess();
});

</script>

<template>
  <aside class="sidebar" v-show="isVisible">
    <div class="logo"><Icon icon="fluent-mdl2:gradle-logo-32" width="30" height="138" /></div>
    <nav>
      <RouterLink to="/" class="nav-item" title="Главная">
        <Icon icon="material-symbols:home-outline" width="24" />
      </RouterLink>
      <RouterLink to="/search" class="nav-item" title="Поиск">
        <Icon icon="iconamoon:search-fill" width="24" />
      </RouterLink>
      <RouterLink to="/library" class="nav-item" title="Избранное">
        <Icon icon="proicons:library" width="24" />
      </RouterLink>
      <RouterLink
        v-if="showAdminButton"
        to="/admin/login"
        class="nav-item"
        title="Админ панель"
      >
        <Icon icon="mdi:shield-crown" width="24" />
      </RouterLink>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  height: 100vh;
  width: var(--side-menu-width);
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
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
  flex-shrink: 0;
}

nav {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  width: 100%;
  flex: 1;
  justify-content: center;
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  color: var(--text-secondary);
  text-decoration: none;
  position: relative;
  border-radius: 12px;
  margin: 4px;
  width: 44px;
  height: 44px;
}

.nav-item::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 3px;
  background-color: var(--accent);
  transition: width 0.2s ease;
}

.nav-item.router-link-active::after {
  width: 24px;
}

.nav-item:hover::after {
  width: 24px;
}

.nav-item.router-link-active {
  color: var(--accent);
}

@media (max-width: 768px) {
  .sidebar {
    height: var(--mobile-bottom-offset);
    width: 100%;
    flex-direction: row;
    justify-content: center;
    padding: 0;
    background-color: rgb(0, 0, 0);
    position: fixed;
    bottom: 0;
    top: auto;
    left: 0;
    border-right: none;
    z-index: 1000;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    background-color: rgba(0, 0, 0, 0.8);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .logo {
    display: none;
  }

  nav {
    flex-direction: row;
    justify-content: space-around;
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
    height: 100%;
    padding: 0 1rem;
  }

  .nav-item {
    padding: 0.75rem;
    margin: 0;
    width: 33.33%;
    height: 56px;
    color: rgb(255, 255, 255);
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .nav-item::after {
    height: 3px;
    bottom: 2px;
  }

  .nav-item.router-link-active::after {
    width: 24px;
  }

  .nav-item:hover {
    color: rgba(255, 255, 255, 0.8);
  }

  .nav-item.router-link-active {
    color: var(--accent);
  }
}
</style>
