import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import useUser from '../modules/useUser'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/register',
      name: 'register',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/Register.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue')
    },
    {
      path: '/files',
      name: 'files',
      component: () => import('../views/Files.vue')
    },
    {
      path: '/file/:id',
      component: () => import('../views/File.vue')
    },
    {
      path: '/public',
      name: 'public',
      component: () => import('../views/Public.vue')
    },
    {
      path: '/newseason',
      name: 'newseason',
      component: () => import('../views/Seasons/NewSeason.vue')
    },
    {
      path: '/listseasons',
      name: 'listseasons',
      component: () => import('../views/Seasons/ListSeasons.vue')
    },
    {
      path: '/editseason/:id',
      name: 'editseason',
      component: () => import('../views/Seasons/EditSeason.vue')
    },
    {
      path: '/newmovie',
      name: 'newmovie',
      component: () => import('../views/Movies/NewMovie.vue')
    },
    {
      path: '/listmovies',
      name: 'listmovies',
      component: () => import('../views/Movies/ListMovies.vue')
    },
    {
      path: '/editmovie/:id',
      name: 'editmovie',
      component: () => import('../views/Movies/EditMovie.vue')
    },
    {
      path: '/movies',
      name: 'movies',
      component: () => import('../views/Movies.vue')
    },
    {
      path: '/movie/:id',
      name: 'movie',
      component: () => import('../views/Movie.vue')
    },
    {
      path: '/season/:id',
      name: 'season',
      component: () => import('../views/Season.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

const authRoutes = ['files', 'newseason', 'listseasons', 'editseason', 'newmovie', 'listmovies', 'editmovie'];

router.beforeEach(async (to, from) => {
  const { theUser, loadUser } = useUser();
  if(!theUser.value)
    await loadUser();
  if(authRoutes.includes(to.name) && !theUser.value){
    return { name: "home" };
  }
})

export default router
