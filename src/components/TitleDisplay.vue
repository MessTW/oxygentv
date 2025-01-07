<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  logoPath: {
    type: String,
    default: null
  }
});
</script>

<template>
  <div class="title-display">
    <template v-if="logoPath">
      <img :src="`https://imagetmdb.com/t/p/w500${logoPath}`" :alt="title" class="title-logo">
    </template>
    <h3 v-else class="title-text">{{ title }}</h3>
  </div>
</template>

<style scoped>
.title-display {
  padding: 1rem;
  padding-bottom: 0.5rem;
  display: flex;
  align-items: flex-start;
  min-height: 60px;
  width: 100%;
}

.title-logo {
  max-width: 200px;
  width: auto;
  height: auto;
  filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.5));
  max-height: 60px;
  object-fit: contain;
  object-position: left;
  margin-left: 0;
}

.title-text {
  margin: 0;
  margin-left: 0;
  color: white;
  font-size: 1.2rem;
  font-weight: 500;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  text-align: left;
  padding-left: 0;
}

@media (max-width: 600px) {
  .title-logo {
    max-width: 150px;
    max-height: 50px;
  }
  
  .title-display {
    min-height: 50px;
    padding: 0.5rem;
    padding-left: 0.75rem;
  }

  .title-text {
    font-size: 1rem;
  }
}

/* Специальные стили для страницы деталей */
:global(.details-title) {
  margin-top: 1rem;
  background: none;
}

:global(.details-title) .title-logo {
  max-width: 300px;
  max-height: 80px;
  margin-left: 0;
}

:global(.details-title) .title-text {
  font-size: 2rem;
  margin-left: 0;
  padding-left: 0;
}

/* Оставляем тени только для карточек в списках */
.title-logo:not(:global(.details-title) .title-logo) {
  filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.5));
}

.title-text:not(:global(.details-title) .title-text) {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}
</style> 