<script setup>
import { ref, onMounted, computed } from 'vue';
import { Icon } from '@iconify/vue';

const API_URL = 'https://torapi.vercel.app/api';

const props = defineProps({
  title: String,
  originalTitle: String,
  year: Number,
  isOpen: Boolean
});

const torrents = ref([]);
const loading = ref(false);
const error = ref(null);
const selectedTracker = ref('all');

const filteredTorrents = computed(() => {
  // Сначала фильтруем по трекеру
  const filtered = selectedTracker.value === 'all'
    ? torrents.value
    : torrents.value.filter(t => t.source === selectedTracker.value);

  // Затем сортируем отфильтрованные результаты
  return filtered.sort((a, b) => (parseInt(b.seeds) || 0) - (parseInt(a.seeds) || 0));
});

const availableTrackers = computed(() => {
  const trackers = new Set(torrents.value.map(t => t.source));
  return ['all', ...trackers];
});

const getTrackerName = (tracker) => {
  const names = {
    'RuTracker': 'RuTracker',
    'Kinozal': 'KinozaL',
    'RuTor': 'RuTor',
    'NoNameClub': 'NoNameClub',
    'all': 'Все'
  };
  return names[tracker] || tracker;
};

const requiresAuth = (link) => {
  return link?.includes('forum/dl.php') ||
         link?.includes('details.php') ||
         link?.includes('forum/download.php') ||
         link?.includes('download.php');
};

const mapTorrents = (items, source) => {
  return items.map(item => {
    const torrentLink = item.Torrent || item.TorrentUrl || item.Link;

    return {
      id: `${source}_${item.Id || item.Hash || Math.random().toString()}`,
      title: item.Name,
      size: item.Size || 'N/A',
      seeds: item.Seeds || '0',
      source: source,
      link: torrentLink,
      requiresAuth: requiresAuth(torrentLink)
    };
  });
};

const searchTorrents = async () => {
  loading.value = true;
  torrents.value = [];
  const processedIds = new Set();

  try {
    // Поиск по русскому названию
    if (props.title) {
      const searchQuery = `${props.title} ${props.year}`;
      const response = await fetch(`${API_URL}/search/title/all?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      console.log('Full API response:', data);

      if (data && typeof data === 'object') {
        for (const [tracker, results] of Object.entries(data)) {
          if (Array.isArray(results)) {
            const mappedTorrents = mapTorrents(results, tracker);
            // Добавляем только уникальные торренты
            mappedTorrents.forEach(torrent => {
              if (!processedIds.has(torrent.id)) {
                processedIds.add(torrent.id);
                torrents.value.push(torrent);
              }
            });
          }
        }
      }
    }

    // Поиск по оригинальному названию
    if (props.originalTitle && props.originalTitle !== props.title) {
      const searchQuery = `${props.originalTitle} ${props.year}`;
      const response = await fetch(`${API_URL}/search/title/all?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      console.log('Full API response:', data);

      if (data && typeof data === 'object') {
        for (const [tracker, results] of Object.entries(data)) {
          if (Array.isArray(results)) {
            const mappedTorrents = mapTorrents(results, tracker);
            // Добавляем только уникальные торренты
            mappedTorrents.forEach(torrent => {
              if (!processedIds.has(torrent.id)) {
                processedIds.add(torrent.id);
                torrents.value.push(torrent);
              }
            });
          }
        }
      }
    }
  } catch (e) {
    console.error('Torrent search error:', e);
    error.value = 'Ошибка при поиске торрентов';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  searchTorrents();
});
</script>

<template>
  <div class="torrent-list">
    <div v-if="loading" class="torrent-loading">
      <div class="loader"></div>
    </div>
    <div v-else-if="error" class="torrent-error">
      {{ error }}
    </div>
    <div v-else>
      <div class="tracker-filters">
        <button
          v-for="tracker in availableTrackers"
          :key="tracker"
          class="tracker-button"
          :class="{ active: selectedTracker === tracker }"
          @click="selectedTracker = tracker"
        >
          {{ tracker === 'all' ? 'Все' : getTrackerName(tracker) }}
        </button>
      </div>

      <div v-if="filteredTorrents.length === 0" class="no-torrents">
        Торренты не найдены
      </div>
      <div v-else class="torrents-container">
        <div v-for="torrent in filteredTorrents" :key="torrent.id" class="torrent-item">
          <div class="torrent-title">{{ torrent.title }}</div>
          <div class="torrent-info">
            <span class="torrent-size">{{ torrent.size }}</span>
            <span class="torrent-seeds">Seeds: {{ torrent.seeds }}</span>
            <span class="torrent-source">{{ getTrackerName(torrent.source) }}</span>
            <div class="download-container">
              <a
                :href="torrent.link"
                class="torrent-link"
                target="_blank"
              >
                <Icon icon="mdi:download" />
                <span>Скачать</span>
              </a>
            </div>
            <span v-if="torrent.requiresAuth" class="auth-note">Может потребоваться авторизация</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.torrent-list {
  margin-top: 1rem;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  padding: 1rem;
}

@media (max-width: 768px) {
  .torrent-list {
    margin-top: 0;
    padding: 0.5rem;
    margin-bottom: var(--mobile-bottom-offset);
  }

  .torrent-info {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
  }

  .torrent-size,
  .torrent-seeds,
  .torrent-source {
    flex: 0 0 auto;
  }

  .download-container {
    border-radius: 4px;
    font-size: 0.9em;
  }

  .torrent-link {
    flex: 1;
    justify-content: center;
    margin-right: 0.5rem;
  }

  .auth-note {
    text-align: center;
    flex: 1;
  }

  .tracker-filters {
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 0.5rem;
    margin: 0 -0.5rem;
    padding: 0 0.5rem;
    -webkit-overflow-scrolling: touch;
  }

  .tracker-button {
    white-space: nowrap;
    flex: 0 0 auto;
  }

  .torrent-item {
    padding: 0.75rem 0.5rem;
  }
}

.torrent-item {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.torrent-info {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  color: var(--text-secondary);
  align-items: center;
}

.torrent-seeds {
  color: #4CAF50;
  font-weight: 500;
}

.torrent-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-primary);
  text-decoration: none;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  transition: background 0.2s;
}

.torrent-link:hover {
  background: rgba(255, 255, 255, 0.2);
}

.loader {
  width: 24px;
  height: 24px;
  border: 2px solid var(--text-secondary);
  border-bottom-color: transparent;
  border-radius: 50%;
  animation: rotation 1s linear infinite;
  margin: 1rem auto;
}

@keyframes rotation {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.torrent-source {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-primary);
  text-decoration: none;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  transition: background 0.2s;
}

.torrent-link.auth-required {
  background: rgba(255, 165, 0, 0.2);
}

.torrent-link.auth-required:hover {
  background: rgba(255, 165, 0, 0.3);
}

.download-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.auth-note {
  font-size: 0.8rem;
  color: #FFA500;
  opacity: 0.8;
  white-space: nowrap;
}

.tracker-filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.tracker-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.tracker-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.tracker-button.active {
  background: rgba(255, 255, 255, 0.3);
  font-weight: 500;
}
</style>
