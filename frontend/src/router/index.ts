import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/Home.vue'
import LoginPage from '../views/Login.vue'
import RegisterPage from '../views/Register.vue'
import OAuth2Callback from '../views/OAuth2Callback.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage
  }, 
  {
    path: '/register',
    name: 'Register',
    component: RegisterPage
  }, 
  { path: '/auth/callback', name: 'OAuth2Callback', component: OAuth2Callback },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const publicPages = ['/login', '/register']
  const authRequired = !publicPages.includes(to.path)
  const loggedIn = JSON.parse(localStorage.getItem('pinia') as string).auth.isAuthenticated

  if (authRequired && !loggedIn) {
    return next('/login')
  }

  next()
});


export default router
