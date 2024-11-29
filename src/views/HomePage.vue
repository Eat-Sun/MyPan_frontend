<template>
  <el-container class="full-height-container">
    <HeadComp :list="uploadList" :free_space="freeSpace" />
    <el-container>
      <AsideComp @viewControl="setView" />
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
    console.log('触发1：', this.livingData)
    const url = apiClient.defaults.baseURL + '/api/v1/sessions/quit'
    const formData = new FormData()
    formData.append('token', localStorage.getItem('token'))
    formData.append(
      'data',
      JSON.stringify({
        folder_data: this.livingData,
        free_space: Number(this.freeSpace)
      })
    )
    navigator.sendBeacon(url, formData)

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
    const livingData = ref([])
    const recycledData = ref([])
    const view = ref('living')
    const freeSpace = ref([])
    const uploadList = ref([])
    provide('livingData', livingData)
    provide('recycledData', recycledData)

    onBeforeMount(() => {
      // console.log("父组件触发dataInFolderData")
      console.log('route.query.folder_data', route.query.folder_data)
      if (Array.isArray(route.query.folder_data)) {
        livingData.value = processData(route.query.folder_data)
      } else {
        livingData.value = route.query.folder_data
      }
      freeSpace.value = route.query.free_space
      // console.log("freeSpace", freeSpace.value)

      window.addEventListener('unload', () => {
        const url = apiClient.defaults.baseURL + '/api/v1/sessions/quit'
        const formData = new FormData()
        formData.append('token', localStorage.getItem('token'))
        formData.append(
          'data',
          JSON.stringify({
            folder_data: livingData.value,
            free_space: Number(freeSpace.value)
          })
        )

        navigator.sendBeacon(url, formData)
      })
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

    const setView = (operate) => {
      if (operate.type == 'recycled') {
        recycledData.value = operate.data
      }
      view.value = operate.type
      // console.log('设置数据', data.value, view.value)
    }

    return {
      view,
      setView,
      uploadList,
      freeSpace,
      livingData
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
