<template>
  <el-main class="main">
    <div style="display: flex; flex-direction: row">
      <UploadAndDownloadForm
        :parent_folder="parentFolder"
        :selectedData="selectedData"
        :consumer="consumer"
      />
      <CreateFolder />
      <OperateForm
        :parent_folder="parentFolder"
        :selectedData="selectedData"
        :topSelectedData="topSelectedData"
        :recycledData="recycledData"
      />
      <ShareData :Data="formData" :selectedData="selectedData" :topSelectedData="topSelectedData" />
    </div>
    <keep-alive>
      <FolderData
        v-if="view == 'living'"
        @selected="setSelectedData"
        @topSelection="setTopSelection"
      />
      <ClassifyVeiw
        v-else-if="view == 'classify'"
        :selectedData="selectedData"
        @selected="setSelectedData"
        @topSelection="setTopSelection"
      >
      </ClassifyVeiw>
      <RecycleBin v-else-if="view == 'recycled'"></RecycleBin>
    </keep-alive>
  </el-main>
</template>

<script setup>
import UploadAndDownloadForm from './partial/UploadAndDownloadForm.vue'
import CreateFolder from './partial/CreateFolder.vue'
import OperateForm from './partial/OperateForm.vue'
import ShareData from './partial/ShareData.vue'
import FolderData from './partial/FolderData.vue'
import ClassifyVeiw from './partial/ClassifyVeiw.vue'
import RecycleBin from './partial/RecycleBin.vue'
import { inject, provide, reactive, ref, toRef, watch } from 'vue'
import { createConsumer } from '@rails/actioncable'
import { useDataStore } from '@/stores/data'

const props = defineProps({
  operate_view: {
    type: String,
    required: true
  },
  upload_list: {
    type: Array,
    required: true
  },
  form_data: {
    type: Object,
    required: true
  }
})
const freeSpace = inject('freeSpace')

let dataStore = useDataStore()

let recycledData = await dataStore.getRecycledData()
// console.log("recycledData", recycledData)
const view = toRef(props, 'operate_view')
const consumer = createConsumer(import.meta.env.VITE_WEBSOCKET_URL)
// const uploadList = toRef(props, 'upload_list')

let formData = props.form_data
const breadcrumb = reactive([formData])
const moveBreadcrumb = reactive([formData])
const binBreadcrumb = reactive([{ id: null, name: 'root', children: recycledData }])
const parentFolder = ref({})
const binParentFolder = ref({})

provide('breadcrumb', breadcrumb)
provide('moveBreadcrumb', moveBreadcrumb)
provide('binBreadcrumb', binBreadcrumb)
provide('parentFolder', parentFolder)
provide('binParentFolder', binParentFolder)

const selectedData = ref([])
const topSelectedData = ref([])

const setSelectedData = (selected) => {
  selectedData.value = selected
  console.log('selected:', selected)
}

const setTopSelection = (topSelected) => {
  topSelectedData.value = topSelected
  // console.log('topSelectedData', topSelectedData.value)
}

watch(
  () => view,
  () => {
    // console.log('现在是：', view.value)
  }
)
watch(freeSpace, () => {
  console.log('watch freeSpace.value', freeSpace.value, typeof freeSpace.value)
})
watch(
  breadcrumb,
  () => {
    parentFolder.value = breadcrumb[breadcrumb.length - 1]
    // console.log("breadcrumb", breadcrumb)
  },
  { immediate: true }
)
watch(
  binBreadcrumb,
  () => {
    binParentFolder.value = binBreadcrumb[binBreadcrumb.length - 1]
    console.log('binBreadcrumb', binBreadcrumb)
  },
  { immediate: true }
)
</script>
<style>
.main {
  background-color: #ffffff;
  padding: 20px;
  overflow-y: auto;
  /* Ensure content is scrollable if it overflows */
}

.el-main {
  flex: 1;
  /* Allow main content to grow and fill the space */
  overflow-y: auto;
  /* Ensure content is scrollable if it overflows */
}
</style>
