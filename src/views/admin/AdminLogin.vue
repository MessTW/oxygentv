<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { checkAdminAccess } from '../../services/adminAuth';

const router = useRouter();
const username = ref('');
const password = ref('');
const error = ref('');
const hasAccess = ref(false);

onMounted(async () => {
  hasAccess.value = await checkAdminAccess();
  if (!hasAccess.value) {
    error.value = 'Доступ запрещен';
  }
});

const handleLogin = async () => {
  try {
    if (!hasAccess.value) {
      error.value = 'Доступ запрещен';
      return;
    }

    if (username.value === '123' && password.value === '123') {
      localStorage.setItem('admin_token', 'temp_token');
      router.push({ name: 'admin' });
    } else {
      error.value = 'Неверные учетные данные';
    }
  } catch {
    error.value = 'Ошибка при входе';
  }
};
</script>

<template>
  <div class="admin-login">
    <div class="login-form">
      <h1>Вход в админ-панель</h1>
      <div v-if="!hasAccess" class="error-message">
        Доступ запрещен с вашего IP-адреса
      </div>
      <div v-else>
        <div class="form-group">
          <input
            v-model="username"
            type="text"
            placeholder="Имя пользователя"
            @keyup.enter="handleLogin"
          >
        </div>
        <div class="form-group">
          <input
            v-model="password"
            type="password"
            placeholder="Пароль"
            @keyup.enter="handleLogin"
          >
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <button @click="handleLogin" class="login-button">
          Войти
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-login {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--background);
}

.login-form {
  background: var(--surface);
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
}

.form-group {
  margin-bottom: 1rem;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface-light);
  color: var(--text-primary);
}

.login-button {
  width: 100%;
  padding: 0.75rem;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.error {
  color: #ff4444;
  margin-bottom: 1rem;
}
</style>
