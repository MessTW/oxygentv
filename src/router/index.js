import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import SearchView from '../views/SearchView.vue'
import CinemaDetails from '../views/CinemaDetails.vue'
import LibraryView from '../views/LibraryView.vue'
import TorrentPage from '../views/TorrentPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: 'Главная | oxyge tv'
      }
    },
    {
      path: '/search',
      name: 'search',
      component: SearchView,
      meta: {
        title: 'Поиск | oxyge tv'
      }
    },
    {
      path: '/movie/:id',
      name: 'movie',
      component: CinemaDetails,
      meta: {
        title: 'Загрузка...'
      }
    },
    {
      path: '/series/:id',
      name: 'series',
      component: CinemaDetails,
      meta: {
        title: 'Загрузка...'
      }
    },
    {
      path: '/library',
      name: 'library',
      component: LibraryView,
      meta: {
        title: 'Моя бибилиотека | oxyge tv'
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
    }
  ]
})

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title}`
  next()
})

export default router
