<script setup>
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { ref } from 'vue';

const authStore = useAuthStore();
const router = useRouter();
const isDeleting = ref(false);

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};

const handleDeleteAccount = async () => {
  if (!confirm('Вы уверены, что хотите удалить аккаунт? Это действие нельзя отменить.')) {
    return;
  }

  try {
    isDeleting.value = true;
    await authStore.deleteAccount();
    router.push('/login');
  } catch (error) {
    console.error('Error deleting account:', error);
    alert('Ошибка при удалении аккаунта. Попробуйте позже.');
  } finally {
    isDeleting.value = false;
  }
};
</script>

<template>
  <div class="profile-page">
    <div class="profile-header">
      <h1>Профиль</h1>
    </div>

    <div class="profile-content" v-if="authStore.user">
      <div class="profile-info">
        <img
          :src="authStore.user.photoURL"
          :alt="authStore.user.displayName"
          class="profile-avatar"
        >
        <div class="profile-details">
          <h2>{{ authStore.user.displayName }}</h2>
          <p>{{ authStore.user.email }}</p>
        </div>
      </div>

      <div class="profile-actions">
        <button class="action-button" @click="handleLogout">
          <Icon icon="mdi:logout" width="20" />
          Выйти
        </button>
        <button
          class="action-button danger"
          @click="handleDeleteAccount"
          :disabled="isDeleting"
        >
          <Icon icon="mdi:delete" width="20" />
          {{ isDeleting ? 'Удаление...' : 'Удалить аккаунт' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.profile-header {
  margin-bottom: 2rem;
}

.profile-content {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 2rem;
}

.profile-info {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.profile-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
}

.profile-details h2 {
  margin: 0;
  margin-bottom: 0.5rem;
}

.profile-details p {
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
}

.profile-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.action-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.action-button.danger {
  background: rgba(255, 0, 0, 0.1);
}

.action-button.danger:hover {
  background: rgba(255, 0, 0, 0.2);
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .profile-page {
    padding: 1rem;
  }

  .profile-info {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .profile-actions {
    flex-direction: column;
  }

  .action-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
