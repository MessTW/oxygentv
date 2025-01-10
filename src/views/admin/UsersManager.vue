<script setup>
import { ref, onMounted } from 'vue';

const users = ref([]);
const isLoading = ref(true);

onMounted(async () => {
  try {
    // TODO: Здесь будет реальный API запрос
    isLoading.value = false;
  } catch {
    console.error('Ошибка при загрузке пользователей');
  }
});
</script>

<template>
  <div class="users-manager">
    <div class="header">
      <h1>Управление пользователями</h1>
      <button class="add-button">
        Добавить пользователя
      </button>
    </div>
    <div v-if="isLoading" class="loading">
      Загрузка...
    </div>
    <div v-else class="users-list">
      <div v-for="user in users" :key="user.id" class="user-item">
        {{ user.name }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.users-manager {
  padding: 1rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.add-button {
  padding: 0.75rem 1.5rem;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}
</style>
