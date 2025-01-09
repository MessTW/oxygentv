<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  progress: {
    type: Number,
    default: 0
  },
  isLoading: {
    type: Boolean,
    required: true
  }
})

const opacity = ref(1)

watch(() => props.isLoading, (newValue) => {
  if (!newValue) {
    opacity.value = 0
  }
})
</script>

<template>
  <Transition name="fade">
    <div v-show="isLoading || opacity > 0" class="loading-screen" :style="{ opacity }">
      <div class="loading-content">
        <div class="loading-text">Воруем печеньки...</div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
        </div>
        <div class="progress-text">{{ Math.round(progress) }}%</div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: var(--surface);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  transition: opacity 0.3s ease-out;
}

.loading-content {
  width: 80%;
  max-width: 400px;
}

.progress-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: white;
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
}

.loading-text {
  text-align: center;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.9);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
