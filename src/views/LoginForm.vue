<template>
  <div class="login-container">
    <el-form class="loginForm" :model="loginForm" label-width="80px">
      <el-form-item label="用户名" prop="username">
        <el-input v-model="loginForm.user.username"></el-input>
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input type="password" v-model="loginForm.user.password"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="login">登录</el-button>
        <el-button @click="visible = true">注册</el-button>
      </el-form-item>
    </el-form>
  </div>

  <el-dialog title="注册" v-model="visible" width="600px">
    <template #default>
      <el-form ref="registerFormRef" :model="registerForm" :rules="registerRules">
        <el-form-item
          label="用户名"
          :label-width="registerForm.formLabelWidth"
          prop="user.username"
        >
          <el-input v-model="registerForm.user.username"></el-input>
        </el-form-item>
        <el-form-item label="邮箱" :label-width="registerForm.formLabelWidth" prop="user.email">
          <el-input v-model="registerForm.user.email" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="密码" :label-width="registerForm.formLabelWidth" prop="user.password">
          <el-input
            type="password"
            v-model="registerForm.user.password"
            autocomplete="off"
            show-password
          />
        </el-form-item>
        <el-form-item
          label="确认密码"
          :label-width="registerForm.formLabelWidth"
          prop="user.password_confirmation"
        >
          <el-input
            type="password"
            v-model="registerForm.user.password_confirmation"
            autocomplete="off"
            show-password
          />
        </el-form-item>
        <el-form-item label="邀请码" :label-width="registerForm.formLabelWidth" prop="user.captcha">
          <el-input v-model="registerForm.user.captcha" autocomplete="off" />
        </el-form-item>
      </el-form>
    </template>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="register">注册</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { apiClient } from '@/utils'

export default {
  setup() {
    const loginForm = reactive({
      user: {
        username: '',
        password: ''
      }
    })

    const visible = ref(false)

    const registerForm = reactive({
      formLabelWidth: '70px',
      user: {
        username: '',
        email: '',
        password: '',
        password_confirmation: '',
        captcha: ''
      }
    })
    const registerFormRef = ref()

    const registerRules = reactive({
      user: {
        username: [
          { required: true, message: '用户名不能为空', trigger: 'blur' },
          { min: 6, max: 10, message: '用户名长度为6~10位', trigger: 'blur' }
        ],
        email: [
          { type: 'string', required: true, message: '请输入邮箱地址', trigger: 'blur' },
          {
            type: 'email',
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: '请输入正确的邮箱地址',
            trigger: ['blur', 'change']
          }
        ],
        password: [{ required: true, message: '密码不能为空', trigger: 'blur' }],
        password_confirmation: [{ validator: passwordConfirmationRule, trigger: 'blur' }],
        captcha: [{ required: true, message: '验证码不能为空', trigger: 'blur' }]
      }
    })

    function passwordConfirmationRule(rule, value, callback) {
      const { password, password_confirmation } = registerForm.user
      if (password_confirmation == '') {
        callback(new Error('请再次输入密码'))
      } else if (password_confirmation !== password) {
        callback(new Error('两次输入密码不一致!'))
      } else {
        callback()
      }
    }

    const router = useRouter()
    const login = () => {
      const { user } = loginForm
      let messageInstance = ElMessage({
        message: '登陆中...',
        type: 'info',
        duration: 0
      })
      // 发送登录请求
      apiClient
        .post('/api/v1/sessions/create', {
          user: user,
          token: localStorage.getItem('token')
        })
        .then((response) => {
          messageInstance.close()
          const code = response.data.code

          if (code == 1) {
            const token = response.data.data.token
            const user_data = response.data.data.user_data

            localStorage.setItem('token', token)
            sessionStorage.setItem('user_data', JSON.stringify(user_data))
            ElMessage({
              message: '登陆成功',
              type: 'success',
              plain: true
            })

            router.push('/homepage')
          } else {
            const message = response.data.message

            ElMessage({
              message: '登录失败: ' + message,
              type: 'error',
              plain: true
            })
          }
        })
        .catch((error) => {
          console.error('发生错误：', error)
        })
    }

    const register = () => {
      registerFormRef.value.validate((valid) => {
        if (!valid) {
          ElMessage({
            message: '验证未通过',
            type: 'error',
            plain: true
          })
          return
        }
      })

      const { user } = registerForm
      // console.log(user)
      apiClient
        .post('/api/v1/users/create', { user })
        .then((response) => {
          const code = response.data.code
          if (code == 1) {
            ElMessage({
              message: '注册成功！',
              type: 'success',
              plain: true
            })

            visible.value = false
          } else {
            const message = response.data.message
            ElMessage({
              message: '注册失败: ' + message,
              type: 'error',
              plain: true
            })
          }
        })
        .catch((error) => {
          console.error('发生错误:', error)
        })
    }

    return {
      loginForm,
      login,
      register,
      registerForm,
      visible,
      registerRules,
      registerFormRef
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  /*  height: 100vh;*/
}

.loginForm {
  max-width: 400px;
  margin: 250px;
  padding: 40px 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
}
</style>
