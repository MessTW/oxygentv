<template>
  <div class="skeleton-wrapper">
    <div class="skeleton-meta">
      <div class="skeleton-logo"></div>
      <div class="skeleton-tags">
        <div class="skeleton-tag"></div>
        <div class="skeleton-tag"></div>
        <div class="skeleton-tag"></div>
      </div>
      <div class="skeleton-text"></div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-wrapper {
  width: 100%;
  height: 100%;
  animation: pulse 1.5s infinite;
}

.skeleton-meta {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
}

.skeleton-logo {
  width: 200px;
  height: 60px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.skeleton-tags {
  display: flex;
  gap: 8px;
}

.skeleton-tag {
  width: 60px;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.skeleton-text {
  width: 80%;
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

@keyframes pulse {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.3;
  }
  100% {
    opacity: 0.6;
  }
}
</style>
