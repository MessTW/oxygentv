<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { getKinopoiskId } from '../services/movieIds';

const router = useRouter();
const playerContainer = ref(null);
const kinopoiskId = ref(null);
const state = ref({
  title: '',
  type: '',
  id: '',
  year: '',
  imdb: ''
});

try {
  const data = localStorage.getItem('playerData');
  if (data) {
    state.value = JSON.parse(data);
  }
} catch (error) {
  console.error('Error parsing player data:', error);
}

onMounted(async () => {
  // Если нет данных в state, возвращаемся назад
  if (!state.value.title || !state.value.type) {
    console.error('No player data found');
    router.push('/');
    return;
  }

  // Устанавливаем заголовок страницы
  document.title = `${state.value.title} - Смотреть онлайн`;

  try {
    // Загружаем скрипт kinobox
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://fridayprivate.vercel.app/assets/js/kinobox.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });

    // Получаем kinopoisk ID
    if (state.value.title && state.value.year) {
      kinopoiskId.value = await getKinopoiskId(
        state.value.title,
        String(state.value.year)
      );
    }

    // Ждем небольшую паузу для уверенности, что DOM обновился
    await new Promise(resolve => setTimeout(resolve, 100));

    if (window.kbox && playerContainer.value) {
      const searchParams = {
        query: kinopoiskId.value
      };

      console.log('Initializing player with params:', searchParams);

      window.kbox(playerContainer.value, {
        search: searchParams,
        sourceList: true,
        players: {
          turbo: true,
          alloha: true,
          kodik: true,
          videocdn: true,
          collaps: true,
          hdvb: true,
        },
        menu: {
          enable: true,
          default: 'menu_button',
          mobile: 'menu_button',
          format: '{T}',
          limit: null
        },
        autoplay: true,
        events: {
          init: function() {
            console.log('Player initialized');
          },
          playerLoaded: function(status, sources) {
            console.log('Player loaded with params:', searchParams, 'Status:', status, 'Sources:', sources);
            if (!sources || sources.length === 0) {
              console.log('No sources found, trying alternative search...');
              window.kbox(playerContainer.value, {
                search: {
                  query: state.value.type === 'series' ?
                    `${state.value.title} ${state.value.year} сериал` :
                    `${state.value.title} ${state.value.year}`
                },
                players: {
                  turbo: true,
                  alloha: true,
                  kodik: true,
                  videocdn: true,
                  collaps: true,
                  hdvb: true,
                }
              });
            }
          }
        }
      });
    }
  } catch (error) {
    console.error('Error initializing player:', error);
    router.push('/');
  }
});

const goBack = () => {
  router.push({
    name: state.value.type || 'home',
    params: state.value.id ? { id: state.value.id } : {}
  });
};

onUnmounted(() => {
  localStorage.removeItem('playerData');
});
</script>

<template>
  <div class="watch-page">
    <div class="mui-app-bar">
      <button class="back-button" @click="goBack">
        <Icon icon="mdi:arrow-left" width="24" />
        <span>Назад</span>
      </button>
    </div>
    <div ref="playerContainer" class="player-container">
      <div class="touch-overlay"></div>
    </div>
  </div>
</template>

<style scoped>
.watch-page {
  width: 100%;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.mui-app-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 56px;
  padding: 0 16px;
  background-color: #1a1a1a;
  color: #fff;
  z-index: 1001;
  position: relative;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  background: transparent;
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
  position: absolute;
  left: 16px;
  z-index: 1;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.title {
  margin: 0;
  font-size: 1.2rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  width: 100%;
  padding: 0 64px;
  position: absolute;
  left: 0;
}

.player-container {
  flex: 1;
  position: relative;
  background: #000;
  width: 100%;
  height: calc(100vh - 56px);
}

.touch-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1002;
}
</style>
