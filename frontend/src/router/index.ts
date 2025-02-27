import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/Home.vue'
import LoginPage from '../views/Login.vue'
import RegisterPage from '../views/Register.vue'
import OAuth2Callback from '../views/OAuth2Callback.vue'
import Editor from '../views/Editor.vue'

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
  {
    path: '/projects/:id', 
    name: 'Project',
    component: Editor
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _, next) => {
  const publicPages = ['/login', '/register', '/auth/callback']
  const authRequired = !publicPages.includes(to.path)
  const piniaState = localStorage.getItem('pinia');
  let loggedIn = false;
  if(piniaState) {
    loggedIn = JSON.parse(piniaState).auth?.isAuthenticated;
  }
  if (authRequired && !loggedIn) {
    return next('/login')
  }

  next()
});


export default router
