<script setup>
import { ref, onMounted } from 'vue';
import { Icon } from '@iconify/vue';

const props = defineProps({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  class: {
    type: String,
    default: ''
  }
});

const showPlayer = ref(false);
const playerContainer = ref(null);

onMounted(() => {
  const script = document.createElement('script');
  script.src = 'https://fridayprivate.vercel.app/assets/js/kinobox.min.js';
  document.head.appendChild(script);
});

const initPlayer = () => {
  if (window.kbox && playerContainer.value) {
    window.kbox(playerContainer.value, {
      search: {
        tmdb: props.id,
        query: props.title
      },
      players: {
        alloha: true,
      },
      menu: {
        enable: false,
      },
    });
  }
};

const openPlayer = () => {
  showPlayer.value = !showPlayer.value;
  if (showPlayer.value) {
    setTimeout(initPlayer, 100);
  }
};
</script>

<template>
  <button class="video-button" :class="props.class" @click="openPlayer">
    <Icon icon="material-symbols:play-arrow" width="24" />
    <span>Смотреть</span>
  </button>

  <div v-if="showPlayer" class="mui-modal">
    <div class="mui-modal-content">
      <div class="mui-app-bar">
        <h3 class="mui-typography">{{ title }}</h3>
        <button class="mui-icon-button" @click="openPlayer">
          <span class="mui-icon">×</span>
        </button>
      </div>
      <div class="mui-player-container">
        <div ref="playerContainer"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.video-button {
  width: 100%;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  background-color: var(--button-bg);
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: white;
}

.video-button:hover {
  background-color: var(--button-hover);
}

.mui-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1300;
  -webkit-tap-highlight-color: transparent;
}

.mui-modal-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #000;
  overflow: hidden;
}

.mui-app-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 56px;
  padding: 0 16px;
  background-color: #1a1a1a;
  color: #fff;
  box-shadow: 0px 2px 4px -1px rgba(0,0,0,0.2),
             0px 4px 5px 0px rgba(0,0,0,0.14),
             0px 1px 10px 0px rgba(0,0,0,0.12);
}

.mui-typography {
  margin: 0;
  font-family: "Roboto", "Helvetica", "Arial", sans-serif;
  font-size: 1rem;
  line-height: 1.5;
  letter-spacing: 0.00938em;
  font-weight: 400;
}

.mui-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 12px;
  border-radius: 50%;
  border: 0;
  color: #fff;
  background-color: transparent;
  cursor: pointer;
  transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
}

.mui-icon-button:hover {
  background-color: rgba(255, 255, 255, 0.08);
}

.mui-icon {
  font-size: 1.25rem;
  user-select: none;
}

.mui-player-container {
  position: relative;
  flex: 1;
  background-color: #000;
}

.mui-player-container > div {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* Mobile adaptations */
@media (max-width: 600px) {
  .mui-app-bar {
    min-height: 48px;
    padding: 0 8px;
  }

  .mui-typography {
    font-size: 0.875rem;
  }

  .mui-icon-button {
    padding: 8px;
  }

  .mui-button {
    padding: 4px 10px;
    font-size: 0.8125rem;
  }
}

/* Landscape orientation on mobile */
@media (max-height: 600px) and (orientation: landscape) {
  .mui-app-bar {
    min-height: 40px;
  }

  .mui-typography {
    font-size: 0.875rem;
  }
}

/* Safe area for notched phones */
@supports (padding: env(safe-area-inset-top)) {
  .mui-modal-content {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
  }
}
</style> 