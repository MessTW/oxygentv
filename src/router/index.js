import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import SearchView from '../views/SearchView.vue'
import DetailsPage from '../views/DetailsPage.vue'
import LibraryView from '../views/LibraryView.vue'
import TorrentPage from '../views/TorrentPage.vue'
import AdminPanel from '../views/admin/AdminPanel.vue'
import AdminLogin from '../views/admin/AdminLogin.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
      meta: {
        title: 'Главная | absolute cinema'
      }
    },
    {
      path: '/search',
      name: 'search',
      component: SearchView,
      meta: {
        title: 'Поиск | absolute cinema'
      }
    },
    {
      path: '/movie/:id',
      name: 'movie',
      component: DetailsPage,
      meta: {
        title: 'Загрузка...'
      }
    },
    {
      path: '/series/:id',
      name: 'series',
      component: DetailsPage,
      meta: {
        title: 'Загрузка...'
      }
    },
    {
      path: '/tv/:id',
      name: 'tv',
      component: DetailsPage,
      meta: {
        title: 'Загрузка...'
      }
    },
    {
      path: '/library',
      name: 'library',
      component: LibraryView,
      meta: {
        title: 'Моя бибилиотека | absolute cinema'
      }
    },
    {
      path: '/movie/:id/torrent',
      name: 'movie-torrents',
      component: TorrentPage,
      meta: {
        title: 'Загрузка...'
      }
    },
    {
      path: '/series/:id/torrent',
      name: 'series-torrents',
      component: TorrentPage,
      meta: {
        title: 'Загрузка...'
      }
    },
    {
      path: '/watch/:title',
      name: 'watch',
      component: () => import('../views/WatchPage.vue'),
      meta: {
        title: 'Смотреть'
      }
    },
    {
      path: '/admin/login',
      name: 'admin-login',
      component: AdminLogin,
      meta: {
        title: 'Вход в админ-панель'
      }
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminPanel,
      meta: {
        requiresAuth: true,
        title: 'Админ панель'
      },
      children: [
        {
          path: 'movies',
          name: 'admin-movies',
          component: () => import('../views/admin/MoviesManager.vue')
        },
        {
          path: 'series',
          name: 'admin-series',
          component: () => import('../views/admin/SeriesManager.vue')
        },
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('../views/admin/UsersManager.vue')
        }
      ]
    },
    {
      path: '/collections',
      children: [
        {
          path: '',
          name: 'collections',
          component: () => import('../components/SmartCollections.vue'),
          meta: {
            title: 'Коллекции | absolute cinema'
          }
        },
        {
          path: ':slug',
          name: 'collection',
          component: () => import('../views/CollectionView.vue'),
          meta: {
            title: 'Коллекция | absolute cinema'
          }
        }
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title}`
  if (to.matched.some(record => record.meta.requiresAuth)) {
    const isAuthenticated = localStorage.getItem('admin_token');
    if (!isAuthenticated) {
      next({ name: 'admin-login' });
    } else {
      next();
    }
  } else {
    next();
  }
})

export default router
