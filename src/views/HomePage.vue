<template>
  <el-container class="full-height-container">
    <HeadComp :list="uploadList" :free_space="freeSpace" />
    <el-container>
      <AsideComp @viewControl="setView" :data="data" :formData="formData" />
      <el-container>
        <MainComp :upload_list="uploadList" :free_space="freeSpace" :operate_view="view" />
      </el-container>
    </el-container>
    <FootComp />
  </el-container>
</template>

<script>
import { ref, onBeforeMount, provide } from 'vue'
import { useRoute } from 'vue-router'
import HeadComp from '@/components/HeadComp.vue'
import AsideComp from '@/components/AsideComp.vue'
import MainComp from '@/components/MainComp.vue'
import FootComp from '@/components/FootComp.vue'
import apiClient from '@/axios'

export default {
  beforeRouteLeave(to, from, next) {
    this.quitLogin()

    next()
  },
  components: {
    HeadComp,
    AsideComp,
    MainComp,
    FootComp
  },
  setup() {
    const route = useRoute()
    const data = ref([])
    const formData = ref({})
    const classifyData = ref([])
    const recycledData = ref([])
    const view = ref('living')
    const freeSpace = ref('')
    const uploadList = ref([])

    provide('classifyData', classifyData)
    provide('recycledData', recycledData)
    provide('formData', formData)
    provide('uploadList', uploadList)

    onBeforeMount(() => {
      data.value = route.query.form_data
      // console.log('data.value', data.value)
      formData.value = processData(JSON.parse(JSON.stringify(data.value)))
      freeSpace.value = route.query.free_space

      window.addEventListener('unload', quitLogin())
    })

    const processData = (data) => {
      // console.log(data)
      let stack = []
      let folders = data[0]
      let attachments = data[1]
      let root = folders.find((item) => item.ancestry == null)

      stack.push(root)

      while (stack.length > 0) {
        let folder = stack.pop()

        let subFolders = folders.filter((item) => item.ancestry == folder.numbering)
        let subAttachments = attachments.filter((item) => item.folder_id == folder.id)
        // console.log("subFolders", subFolders)
        if (subFolders && subFolders.length > 0) {
          folder.children.push(...subFolders)
          stack.push(...subFolders)
        }
        if (subAttachments && subAttachments.length > 0) {
          folder.children.push(...subAttachments)
        }
      }

      return root
    }

    const setView = (change) => {
      // if (operate.type == 'recycled') {
      //   recycledData.value = operate.data
      // } else {
      // }
      // view.value = operate.type
      // console.log('设置数据', data.value, view.value)
      view.value = change
      console.log('设置数据', view.value)
    }

    const quitLogin = () => {
      const url = apiClient.defaults.baseURL + '/api/v1/sessions/quit'
      const formData = new FormData()
      // console.log('quit', data.value)
      formData.append('token', localStorage.getItem('token'))
      formData.append(
        'userData',
        JSON.stringify({
          form_data: data.value,
          free_space: Number(freeSpace.value)
        })
      )

      navigator.sendBeacon(url, formData)
    }

    return {
      data,
      view,
      setView,
      uploadList,
      formData,
      freeSpace,
      quitLogin
    }
  }
}
</script>

<style scoped>
html,
body {
  height: 100%;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
}

.full-height-container {
  height: 100vh;
  /* Make the container fill the full height of the viewport */
  display: flex;
  flex-direction: column;
}

.el-button {
  display: flex;
}

.el-button-group {
  display: flex;
}
</style>
