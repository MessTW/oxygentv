<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: ''
  },
  aspectRatio: {
    type: String,
    default: '2/3'
  }
});

const isLoaded = ref(false);
const hasError = ref(false);
const observer = ref(null);
const imageRef = ref(null);

const loadImage = () => {
  const img = new Image();
  img.src = props.src;
  img.onload = () => {
    isLoaded.value = true;
  };
  img.onerror = () => {
    hasError.value = true;
    isLoaded.value = true;
  };
};

onMounted(() => {
  observer.value = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      loadImage();
      observer.value?.disconnect();
    }
  });

  if (imageRef.value) {
    observer.value.observe(imageRef.value);
  }
});

onBeforeUnmount(() => {
  observer.value?.disconnect();
});
</script>

<template>
  <div
    ref="imageRef"
    class="lazy-image-container"
    :style="{ aspectRatio }"
  >
    <img
      v-show="isLoaded && !hasError"
      :src="src"
      :alt="alt"
      class="lazy-image"
      :class="{ 'is-loaded': isLoaded }"
    >
    <img
      v-if="hasError"
      src="https://i.pinimg.com/736x/d1/e0/68/d1e068474eb9ef462cda61c2aa8e7509.jpg"
      :alt="alt"
      class="lazy-image is-loaded"
    >
    <div
      v-if="!isLoaded"
      class="skeleton-loader"
    >
      <div class="skeleton-image"></div>
      <div class="skeleton-content">
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lazy-image-container {
  position: relative;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  overflow: hidden;
}

.skeleton-loader {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.05);
  overflow: hidden;
}

.skeleton-image {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 25%,
    rgba(255, 255, 255, 0.1) 37%,
    rgba(255, 255, 255, 0.05) 63%
  );
  background-size: 400% 100%;
  animation: skeleton-loading 1.4s ease infinite;
}

.skeleton-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
}

.skeleton-line {
  height: 12px;
  margin: 8px 0;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.skeleton-line::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  animation: shimmer 1.5s infinite;
}

.skeleton-line:first-child {
  width: 60%;
}

.lazy-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: all 0.5s ease;
  transform: scale(1.1);
  filter: blur(10px);
}

.lazy-image.is-loaded {
  opacity: 1;
  transform: scale(1);
  filter: blur(0);
}

@keyframes skeleton-loading {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>
