<template>
  <el-container class="full-height-container">
    <HeadComp :list="uploadList" :free_space="freeSpace" />
    <el-container>
      <AsideComp @viewControl="setView" :data="data" />
      <el-container>
        <Suspense>
          <MainComp :upload_list="uploadList" :operate_view="view" :form_data="formData" />
        </Suspense>
      </el-container>
    </el-container>
    <FootComp />
  </el-container>
</template>

<script setup>
import { ref, onBeforeMount, provide, reactive } from 'vue'
import HeadComp from '@/components/HeadComp.vue'
import AsideComp from '@/components/AsideComp.vue'
import MainComp from '@/components/MainComp.vue'
import FootComp from '@/components/FootComp.vue'
import { processData } from '@/utils'
import { onBeforeRouteLeave } from 'vue-router'
import { useDataStore } from '@/stores/data'

let dataStore = useDataStore()
onBeforeRouteLeave((to, from, next) => {
  dataStore.resetStore()
  next()
})

const data = reactive({
  folders: [],
  attachments: []
})
let formData
const freeSpace = ref('')
const classifyData = ref([])
const view = ref('living')

const uploadList = ref([])

provide('freeSpace', freeSpace)
provide('originData', data)
provide('classifyData', classifyData)
provide('uploadList', uploadList)

onBeforeMount(() => {
  const user_data = JSON.parse(sessionStorage.getItem('user_data'))
  data.folders = user_data.form_data.folders
  data.attachments = user_data.form_data.attachments
  formData = processData(data)
  freeSpace.value = Number(user_data.free_space)
  // console.log('freeSpace.value', freeSpace.value)
  // console.log('data', data)
  // console.log('formData', formData.value)
  sessionStorage.removeItem('user_data')
})

const setView = (change) => {
  view.value = change
  // console.log('设置数据', view.value)
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
