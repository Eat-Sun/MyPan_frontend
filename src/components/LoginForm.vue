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
      <el-form :model="registerForm" :rules="registerFormRules">
        <el-form-item label="用户名" :label-width="registerForm.formLabelWidth" prop="username">
          <el-input v-model="registerForm.user.username"></el-input>
        </el-form-item>
        <el-form-item label="邮箱" :label-width="registerForm.formLabelWidth" prop="email">
          <el-input v-model="registerForm.user.email" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="密码" :label-width="registerForm.formLabelWidth" prop="password">
          <el-input v-model="registerForm.user.password" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="确认密码" :label-width="registerForm.formLabelWidth" prop="password_confirmation">
          <el-input v-model="registerForm.user.password_confirmation" autocomplete="off"></el-input>
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
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import apiClient from '@/axios';

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
        password_confirmation: ''
      }
    })

    const username_rule = (rule, value, callback) => {
      const { username } = registerForm.user;
      if (username == '') {
        callback(new Error('用户名不能为空'))
      } else {
        if (username.length > 5 && username.length < 10) {
          callback(new Error('用户名长度为6~10位'))
        }
      }

    }

    const email_rule = (rule, value, callback) => {
      const { email } = registerForm.user;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email == '') {
        callback(new Error('邮箱不能为空'))
      } else {
        if (!emailRegex.test(email)) {
          callback(new Error('邮箱格式不正确'))
        }
      }
    }

    const password_rule = (rule, value, callback) => {
      const { password } = registerForm.user;
      if (password == '') {
        callback(new Error('请输入密码'));
      } else {
        callback();
      }
    }
    const password_confirmation_rule = (rule, value, callback) => {
      const { password, password_confirmation } = registerForm.user;
      if (password_confirmation == '') {
        callback(new Error('请再次输入密码'));
      } else if (password_confirmation !== password) {
        callback(new Error('两次输入密码不一致!'));
      } else {
        callback();
      }
    }

    const registerFormRules = reactive({
      username: [
        { validator: username_rule, trigger: 'blur' }
      ],
      email: [
        { validator: email_rule, trigger: 'blur' }
      ],
      password: [
        { validator: password_rule, trigger: 'blur' }
      ],
      password_confirmation: [
        { validator: password_confirmation_rule, trigger: 'blur' }
      ],
    })


    const router = useRouter();
    const login = () => {
      const { user } = loginForm;
      // 发送登录请求
      apiClient.post('/api/v1/sessions/create', {
        user: user,
        token: localStorage.getItem('token')
      })
        .then(response => {
          const code = response.data.code;
          if (code == 1) {
            const token = response.data.data.token;
            // const dataInFolderData = response.data.data.folder_data
            localStorage.setItem('token', token);

            ElMessage({
              message: '登陆成功',
              type: 'success',
              plain: true,
            })
            router.push({ name: 'HomePage' });
          } else {
            const message = response.data.message

            ElMessage({
              message: '登录失败: ' + message,
              type: 'error',
              plain: true,
            })
          }

        })
        .catch(error => {
          console.error('发生错误：', error)
        });
    }

    const register = () => {
      const { user } = registerForm

      console.log(user)

      apiClient.post('/api/v1/users/create', { user })
        .then(response => {
          const code = response.data.code
          if (code == 1) {
            ElMessage({
              message: '注册成功！',
              type: 'success',
              plain: true,
            })

            visible.value = false
          } else {
            const message = response.data.message
            ElMessage({
              message: '注册失败: ' + message,
              type: 'error',
              plain: true,
            })
          }
        })
        .catch(error => {
          console.error('发生错误:', error);
        });
    }

    return {
      loginForm,
      login,
      register,
      registerForm,
      visible,
      registerFormRules

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