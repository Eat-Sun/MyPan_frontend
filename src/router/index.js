import { createRouter, createWebHistory } from 'vue-router'
import LoginForm from '../components/LoginForm.vue'
import HomePage from '../components/HomePage.vue'
import axios from 'axios'
// import { useRouter } from 'vue-router';


const routes = [
  { path: '/', name: 'LoginForm', component: LoginForm },
  { path: '/homepage',
    name: 'HomePage',
    component: HomePage,
    beforeEnter(to, from, next){
      axios.get('http://localhost:3000/api/v1/attachments/getter', {
        params: {
          token: localStorage.getItem('token')
        }
      }).then(response => {
        let code = response.data.code

        if(code == 1){
          to.query.folder_data = JSON.stringify(response.data.data)

          next()
        }else{

          next({ name: 'LoginForm' })
        }
      })
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// router.beforeEach(async (to, from, next) => {
//   // 检查路由是否需要用户验证
//   if (to.meta.requiresAuth) {
//     // 检查用户是否已登录
//     const isLoggedIn = await checkIfUserIsLoggedIn()

//     if (!isLoggedIn) {
//       // 如果用户未登录，则重定向到登录页面
//       next('/')
//     } else {
//       // 用户已登录，允许访问
//       next()
//     }
//   } else {
//     // 如果路由不需要用户验证，则直接放行
//     next()
//   }
// })

// async function checkIfUserIsLoggedIn() {
//   const token = localStorage.getItem('token')

//   if (token) {
//     try {
//       const response = await axios.post('http://localhost:3000/api/v1/sessions/create', {
//         user: null,
//         token: token
//       })
//       if (response.data.code == 1) {
//         return true
//       } else {
//         return false
//       }
//     } catch (error) {
//       console.error('token验证失败:', error)
//       return false
//     }
//   } else {
//     return false
//   }
// }

export default router
