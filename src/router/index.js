import { createRouter, createWebHistory } from 'vue-router'
import LoginForm from '../views/LoginForm.vue'
import HomePage from '../views/HomePage.vue'
import { ElMessage } from 'element-plus'

const routes = [
  { path: '/', redirect: '/login' }, // 默认路由重定向到 /login
  { path: '/login', name: 'LoginForm', component: LoginForm },
  {
    path: '/homepage',
    name: 'HomePage',
    component: HomePage,
    beforeEnter(to, from, next) {
      if (sessionStorage.getItem('user_data') == null) {
        next(
          { name: 'LoginForm' },
          ElMessage({
            message: '未登陆',
            type: 'error',
            plain: true
          })
        )
      } else {
        next()
      }
    }
    // beforeEnter(to, from, next) {
    //   let form_data = [
    //     [
    //       {
    //         id: 1,
    //         type: 'folder',
    //         name: 'root',
    //         numbering: '1_niqw',
    //         ancestry: null,
    //         children: []
    //       },
    //       {
    //         id: 12,
    //         type: 'folder',
    //         name: 'Folder1_2',
    //         numbering: '1_slfw',
    //         ancestry: '1_niqw',
    //         children: []
    //       },
    //       {
    //         id: 121,
    //         type: 'folder',
    //         name: 'Folder1_2_sub1',
    //         numbering: '1_gitm',
    //         ancestry: '1_slfw',
    //         children: []
    //       },
    //       {
    //         id: 122,
    //         type: 'folder',
    //         name: 'Folder1_2_sub2',
    //         numbering: '1_porc',
    //         ancestry: '1_slfw',
    //         children: []
    //       }
    //     ],
    //     [
    //       {
    //         id: 11,
    //         folder_id: 1,
    //         type: 'picture',
    //         name: 'att1_1',
    //         b2_key: 'wvWE20',
    //         size: '186154'
    //       },
    //       {
    //         id: 12,
    //         folder_id: 1,
    //         type: 'word',
    //         name: 'att1_2',
    //         b2_key: 'dwaW3B',
    //         size: '19861654'
    //       },
    //       {
    //         id: 121,
    //         folder_id: 12,
    //         type: 'video',
    //         name: 'att12_1',
    //         b2_key: 'nO90pQ',
    //         size: '1048576'
    //       },
    //       {
    //         id: 122,
    //         folder_id: 12,
    //         type: 'audio',
    //         name: 'att12_2',
    //         b2_key: 'rS12tU',
    //         size: '512000'
    //       },
    //       {
    //         id: 1211,
    //         folder_id: 121,
    //         type: 'undefined',
    //         name: 'att121_1',
    //         b2_key: 'dD78eF',
    //         size: '102400'
    //       },
    //       {
    //         id: 1212,
    //         folder_id: 121,
    //         type: 'word',
    //         name: 'att121_2',
    //         b2_key: 'gG90hJ',
    //         size: '10240'
    //       }
    //     ]
    //   ]
    //   let free_space = '10240000000'

    //   let user_data = {
    //     form_data: form_data,
    //     free_space: free_space
    //   }
    //   to.query.user_data = JSON.stringify(user_data)

    //   next()
    // }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
