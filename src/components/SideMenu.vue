<script setup>
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import { useAuthStore } from '@/stores/auth';
import { useRoute } from 'vue-router';

const authStore = useAuthStore();
const route = useRoute();
const isAuthenticated = computed(() => authStore.user !== null);

const isVisible = computed(() => {
  const isPlayerPage = window.location.pathname.includes('/watch/');
  const isLoginPage = route.name === 'login';
  return !isPlayerPage && !isLoginPage;
});
</script>

<template>
  <aside class="sidebar" v-show="isVisible">
    <div class="logo"><Icon icon="mynaui:letter-a-solid" width="30" height="138" /></div>
    <nav>
      <RouterLink to="/" class="nav-item" title="Главная">
        <Icon icon="solar:home-2-bold" width="28" />
      </RouterLink>
      <RouterLink
        to="/search"
        class="nav-item"
        title="Поиск"
      >
        <Icon icon="mynaui:search-solid" width="28" />
      </RouterLink>
      <RouterLink
        to="/library"
        class="nav-item"
        title="Библиотека"
      >
        <Icon icon="solar:library-bold-duotone" width="28" />
      </RouterLink>
      <RouterLink
        to="/collections"
        class="nav-item"
        title="Коллекции"
      >
        <Icon icon="mdi:collection" width="28" />
      </RouterLink>
      <div class="nav-divider"></div>
      <RouterLink
        v-if="!isAuthenticated"
        to="/login"
        class="nav-item"
        title="Войти"
      >
        <Icon icon="mdi:login" width="28" />
      </RouterLink>
      <RouterLink
        v-else
        to="/profile"
        class="nav-item"
        title="Профиль"
      >
        <Icon icon="mdi:account-circle" width="28" />
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
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
  background: rgb(10, 10, 10);
  border-top-right-radius: 16px;
  border-right: 1px solid rgba(255, 255, 255, 0);
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 1rem auto;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: transparent;
  color: white;
  flex-shrink: 0;
}

nav {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  width: 100%;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  position: relative;
  border-radius: 12px;
  width: 42px;
  height: 42px;
  transition: all 0.2s ease;
}

.nav-item:hover {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.1);
}

.nav-item.router-link-active {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

/* Удаляем подчеркивание */
.nav-item::after {
  display: none;
}

.nav-divider {
  width: 30px;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0.5rem 0;
}

@media (max-width: 768px) {
  .sidebar {
    height: var(--mobile-bottom-offset);
    width: 100%;
    flex-direction: row;
    justify-content: center;
    padding: 0;
    background: rgb(10, 10, 10);
    position: fixed;
    bottom: 0;
    top: auto;
    left: 0;
    border-right: none;
    border-top: 1px solid rgba(255, 255, 255, 0);
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
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
    padding: 0.5rem 1rem;
  }

  .nav-item {
    padding: 0.5rem;
    width: auto;
    height: auto;
    color: rgba(255, 255, 255, 0.6);
  }

  .nav-item:hover,
  .nav-item.router-link-active {
    color: white;
    background: transparent;
  }

  .nav-divider {
    display: none;
  }
}

.nav-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.nav-item.disabled:hover {
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
}
</style>
