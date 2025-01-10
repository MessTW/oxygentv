<script setup>
import { ref, onMounted, watch } from 'vue';
import { Icon } from '@iconify/vue';

const props = defineProps({
  mediaId: Number,
  mediaType: String, // 'movie' или 'tv'
  isOpen: Boolean
});

const emit = defineEmits(['close', 'update']);

const API_KEY = 'd341436234a2bb8f0adc73114e093ab2';
const BASE_URL = 'https://apitmdb.cub.red/3';

const mediaData = ref(null);
const isLoading = ref(false);
const error = ref(null);
const editedData = ref({});

onMounted(() => {
  if (props.mediaId) {
    fetchMediaDetails();
  }
});

const fetchMediaDetails = async () => {
  if (!props.mediaId) return;

  isLoading.value = true;
  error.value = null;

  try {
    const response = await fetch(
      `${BASE_URL}/${props.mediaType}/${props.mediaId}?api_key=${API_KEY}&language=ru&append_to_response=credits,videos,images,release_dates,keywords,translations`
    );
    const data = await response.json();
    if (data.success === false) {
      throw new Error(data.status_message || 'Failed to fetch data');
    }
    mediaData.value = data;
    editedData.value = { ...data };
    console.log('Loaded media data:', data);
  } catch (err) {
    error.value = `Ошибка при загрузке данных: ${err.message}`;
    console.error(err);
  } finally {
    isLoading.value = false;
  }
};

const saveChanges = async () => {
  // В реальном приложении здесь был бы API запрос для сохранения изменений
  // Сейчас просто эмитим событие с измененными данными
  emit('update', {
    id: props.mediaId,
    changes: editedData.value
  });
  emit('close');
};

watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    fetchMediaDetails();
  }
});

watch(() => props.mediaId, (newValue) => {
  if (newValue && props.isOpen) {
    fetchMediaDetails();
  }
});

const close = () => {
  emit('close');
};
</script>

<template>
  <div class="media-editor">
    <div class="overlay" @click="close"></div>
    <div class="editor-content">
      <div class="editor-header">
        <h2>Редактирование {{ mediaType === 'movie' ? 'фильма' : 'сериала' }}</h2>
        <button class="close-button" @click="close">
          <Icon icon="mdi:close" />
        </button>
      </div>

      <div v-if="isLoading" class="loading">
        <div class="loader"></div>
      </div>

      <div v-else-if="error" class="error">
        {{ error }}
      </div>

      <div v-else-if="mediaData" class="editor-body">
        <div class="media-info">
          <div class="poster" v-if="mediaData.poster_path">
            <img
              :src="`https://image.tmdb.org/t/p/w300${mediaData.poster_path}`"
              :alt="mediaData.title || mediaData.name"
            >
          </div>

          <div class="info-fields">
            <div class="field-group">
              <label>ID:</label>
              <input type="text" :value="mediaData.id" disabled>
            </div>

            <div class="field-group">
              <label>Название:</label>
              <input
                v-model="editedData[mediaType === 'movie' ? 'title' : 'name']"
                type="text"
              >
            </div>

            <div class="field-group">
              <label>Оригинальное название:</label>
              <input
                v-model="editedData[mediaType === 'movie' ? 'original_title' : 'original_name']"
                type="text"
              >
            </div>

            <div class="field-group">
              <label>Описание:</label>
              <textarea v-model="editedData.overview" rows="4"></textarea>
            </div>

            <div class="field-group">
              <label>Дата выхода:</label>
              <input
                v-model="editedData[mediaType === 'movie' ? 'release_date' : 'first_air_date']"
                type="date"
              >
            </div>

            <div class="field-group">
              <label>Рейтинг:</label>
              <input
                v-model.number="editedData.vote_average"
                type="number"
                step="0.1"
                min="0"
                max="10"
              >
            </div>

            <div class="field-group">
              <label>Популярность:</label>
              <input
                v-model.number="editedData.popularity"
                type="number"
                step="0.01"
              >
            </div>

            <div class="field-group">
              <label>Статус:</label>
              <input v-model="editedData.status" type="text">
            </div>

            <div class="field-group">
              <label>Жанры:</label>
              <div class="genres-list">
                <span
                  v-for="genre in mediaData.genres"
                  :key="genre.id"
                  class="genre-tag"
                >
                  {{ genre.name }}
                </span>
              </div>
            </div>

            <div class="field-group">
              <label>Актеры:</label>
              <div class="cast-list" v-if="mediaData.credits?.cast">
                <div v-for="actor in mediaData.credits.cast.slice(0, 5)" :key="actor.id" class="cast-item">
                  {{ actor.name }} ({{ actor.character }})
                </div>
              </div>
            </div>

            <div class="field-group">
              <label>Трейлеры:</label>
              <div class="videos-list" v-if="mediaData.videos?.results">
                <div v-for="video in mediaData.videos.results.slice(0, 3)" :key="video.id" class="video-item">
                  {{ video.name }} ({{ video.type }})
                </div>
              </div>
            </div>

            <!-- Дополнительная информация -->
            <div class="additional-info">
              <h3>Полная информация</h3>
              <pre>{{ JSON.stringify(mediaData, null, 2) }}</pre>
            </div>
          </div>
        </div>

        <div class="editor-actions">
          <button class="save-button" @click="saveChanges">
            <Icon icon="mdi:content-save" />
            <span>Сохранить изменения</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.media-editor {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
}

.editor-content {
  position: relative;
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  background: var(--surface);
  border-radius: 8px;
  overflow-y: auto;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--border);
}

.close-button {
  background: none;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  padding: 0.5rem;
}

.editor-body {
  padding: 1rem;
}

.media-info {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
}

.info-fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-group label {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.field-group input,
.field-group textarea {
  padding: 0.5rem;
  background: var(--surface-light);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-primary);
}

.genres-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.genre-tag {
  padding: 0.25rem 0.5rem;
  background: var(--surface-light);
  border-radius: 4px;
  font-size: 0.9rem;
}

.editor-actions {
  display: flex;
  justify-content: flex-end;
  padding: 1rem;
  border-top: 1px solid var(--border);
  margin-top: 1rem;
}

.save-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.additional-info {
  margin-top: 2rem;
  background: var(--surface-light);
  padding: 1rem;
  border-radius: 4px;
}

.additional-info pre {
  max-height: 400px;
  overflow-y: auto;
  white-space: pre-wrap;
  font-size: 0.9rem;
}

.cast-list,
.videos-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cast-item,
.video-item {
  padding: 0.5rem;
  background: var(--surface-light);
  border-radius: 4px;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .media-info {
    grid-template-columns: 1fr;
  }

  .poster {
    text-align: center;
  }

  .poster img {
    max-width: 200px;
  }
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.loader {
  width: 24px;
  height: 24px;
  border: 2px solid var(--text-secondary);
  border-bottom-color: transparent;
  border-radius: 50%;
  animation: rotation 1s linear infinite;
  margin: 0 auto;
}

@keyframes rotation {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  color: #ff4444;
  text-align: center;
  padding: 1rem;
}
</style>
