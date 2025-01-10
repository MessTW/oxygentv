<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const handleLogout = () => {
  localStorage.removeItem('admin_token');
  router.push({ name: 'admin-login' });
};
</script>

<template>
  <div class="admin-panel">
    <aside class="sidebar">
      <div class="logo">
        Admin Panel
      </div>
      <nav>
        <RouterLink to="/admin/movies" class="nav-item">
          Фильмы
        </RouterLink>
        <RouterLink to="/admin/series" class="nav-item">
          Сериалы
        </RouterLink>
        <RouterLink to="/admin/users" class="nav-item">
          Пользователи
        </RouterLink>
      </nav>
      <button @click="handleLogout" class="logout-button">
        Выйти
      </button>
    </aside>
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.admin-panel {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 250px;
  background: var(--surface);
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 2rem;
  color: var(--accent);
}

nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.nav-item {
  padding: 0.75rem 1rem;
  color: var(--text-primary);
  text-decoration: none;
  border-radius: 4px;
}

.nav-item:hover,
.nav-item.router-link-active {
  background: var(--surface-light);
}

.main-content {
  flex: 1;
  padding: 2rem;
  background: var(--background);
}

.logout-button {
  padding: 0.75rem;
  background: var(--surface-light);
  border: none;
  border-radius: 4px;
  color: var(--text-primary);
  cursor: pointer;
}

.logout-button:hover {
  background: var(--surface-hover);
}
</style>
