<script setup>
import { Icon } from '@iconify/vue';
import { ref } from 'vue';

const props = defineProps({
  url: {
    type: String,
    required: true
  }
});

const showCopiedMessage = ref(false);

const share = async () => {
  try {
    await navigator.clipboard.writeText(props.url);
    showCopiedMessage.value = true;
    setTimeout(() => {
      showCopiedMessage.value = false;
    }, 2000);
  } catch (err) {
    console.error('Error copying:', err);
  }
};
</script>

<template>
  <button class="share-button" @click="share">
    <Icon icon="mdi:content-copy" width="24" />
  </button>
  <div class="copied-message" :class="{ show: showCopiedMessage }">
    Ссылка скопирована
  </div>
</template>

<style scoped>
.share-button {
  width: 100%;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  background-color: rgba(255, 255, 255, 0.1);
  transition: background-color 0.2s ease;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: white;
}

.share-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.copied-message {
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 0.9rem;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  white-space: nowrap;
  pointer-events: none;
  z-index: 10;
}

.copied-message.show {
  opacity: 1;
  visibility: visible;
  bottom: -30px;
}
</style> 