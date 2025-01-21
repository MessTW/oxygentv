<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-header">
        <h1>Вход</h1>
        <p>Войдите для доступа к сайту</p>
      </div>

      <div class="auth-form">
        <button
          type="button"
          class="google-button"
          @click="loginWithGoogle"
          :disabled="loading"
        >
          <Icon v-if="loading" icon="eos-icons:loading" class="loading-icon" />
          <Icon v-else icon="flat-color-icons:google" />
          <span>Продолжить с Google</span>
        </button>

        <div class="divider">или</div>

        <button
          type="button"
          class="demo-button"
          @click="startDemo"
          :disabled="loading"
        >
          <Icon icon="mdi:eye-outline" />
          <span>Открыть демо-версию</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Icon } from '@iconify/vue'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const error = ref(null)

const startDemo = () => {
  authStore.enableDemoMode()
  authStore.isInitialized = true;
  router.push('/')
}

const loginWithGoogle = async () => {
  try {
    loading.value = true;
    error.value = null;
    await authStore.signInWithGoogle();
    router.push('/');
  } catch (err) {
    error.value = 'Ошибка при входе через Google';
    console.error(err);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: var(--background);
}

.auth-container {
  width: 100%;
  max-width: 400px;
  background: var(--surface);
  border-radius: 16px;
  padding: 32px;
}

.auth-header {
  text-align: center;
  margin-bottom: 32px;
}

.auth-header h1 {
  margin: 0;
  font-size: 24px;
  color: var(--text-primary);
}

.auth-header p {
  margin: 8px 0 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.google-button {
  padding: 12px;
  border-radius: 8px;
  border: none;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--surface-light);
  color: var(--text-primary);
  width: 100%;
  transition: all 0.2s;
}

.google-button:hover {
  background: var(--surface-lighter);
}

.google-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 480px) {
  .auth-container {
    padding: 24px;
  }
}

.divider {
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
  margin: 16px 0;
  position: relative;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 45%;
  height: 1px;
  background: var(--border);
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.demo-button {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: transparent;
  color: var(--text-primary);
  width: 100%;
  transition: all 0.2s;
}

.demo-button:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>
