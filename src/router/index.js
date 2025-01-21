import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import SearchPage from '../views/SearchPage.vue'
import CinemaDetails from '../views/CinemaDetails.vue'
import LibraryView from '../views/LibraryPage.vue'
import TorrentPage from '../views/TorrentPage.vue'
import WatchPage from '../views/WatchPage.vue'
import SmartCollections from '@/components/SmartCollections.vue'
import CollectionView from '../views/CollectionView.vue'
import LoginPage from '../views/LoginPage.vue'
import ProfilePage from '../views/ProfilePage.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
      meta: {
        title: 'Главная'
      }
    },
    {
      path: '/search/:query?',
      name: 'search',
      component: SearchPage,
      meta: {
        title: 'Поиск'
      }
    },
    {
      path: '/:type/:id',
      name: 'cinema-details',
      component: CinemaDetails,
      meta: {
        title: 'Загрузка'
      }
    },
    {
      path: '/watch/:type/:id',
      redirect: to => ({
        name: 'watch',
        params: {
          type: to.params.type,
          id: to.params.id,
          season: '1',
          episode: '1',
          kpId: to.params.kpId
        }
      })
    },
    {
      path: '/watch/:type/:id/:season/:episode/:kpId?',
      name: 'watch',
      component: WatchPage,
      meta: {
        title: ''
      }
    },
    {
      path: '/library',
      name: 'library',
      component: LibraryView,
      meta: {
        title: 'Библиотека'
      }
    },
    {
      path: '/torrent',
      name: 'torrent',
      component: TorrentPage
    },
    {
      path: '/collections',
      meta: {
        title: 'Коллекции'
      },
      children: [
        {
          path: '',
          name: 'collections',
          component: SmartCollections
        },
        {
          path: ':slug',
          name: 'collection',
          component: CollectionView
        }
      ]
    },
    {
      path: '/series/:id',
      redirect: to => ({
        name: 'cinema-details',
        params: { type: 'tv', id: to.params.id }
      })
    },
    {
      path: '/movie/:id',
      redirect: to => ({
        name: 'cinema-details',
        params: { type: 'movie', id: to.params.id }
      })
    },
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
      meta: {
        guest: true,
        title: 'Вход'
      }
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfilePage,
      meta: {
        requiresAuth: true,
        title: 'Профиль'
      }
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  if (!authStore.user && !authStore.loading && !authStore.demoMode) {
    await authStore.init()
  }

  if (to.meta.guest && authStore.user) {
    next('/')
    return
  }

  if (to.name === 'home') {
    next()
    return
  }

  if (authStore.demoMode) {
    if (to.meta.requiresAuth) {
      next('/login')
      return
    }
  }

  next()
})

router.afterEach((to) => {
  document.title = to.meta.title || ''
})

export default router
