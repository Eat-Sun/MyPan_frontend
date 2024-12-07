<template>
  <el-main class="main">
    <div style="display: flex; flex-direction: row">
      <UploadAndDownloadForm :parent_folder="parentFolder" :selectedData="selectedData" :consumer="consumer"
        :free_space="freeSpace" />
      <CreateFolder :parent_folder="parentFolder" />
      <OperateForm :parent_folder="parentFolder" :selectedData="selectedData" :topSelectedData="topSelectedData"
        :free_space="freeSpace" :recycledData="recycledData" />
      <ShareData :Data="formData" :selectedData="selectedData" :topSelectedData="topSelectedData" />
    </div>

    <FolderData v-if="view == 'living'" @selected="setSelectedData" @topSelection="setTopSelection"
      @parentFolder="setparentFolder" />
    <ClassifyVeiw v-else-if="view == 'classify'" :selectedData="selectedData" @selected="setSelectedData">
    </ClassifyVeiw>
    <RecycleBin v-else-if="view == 'recycled'"></RecycleBin>
  </el-main>
</template>

<script>
import UploadAndDownloadForm from './partial/UploadAndDownloadForm.vue'
import CreateFolder from './partial/CreateFolder.vue'
import OperateForm from './partial/OperateForm.vue'
import ShareData from './partial/ShareData.vue'
import FolderData from './partial/FolderData.vue'
import ClassifyVeiw from './partial/ClassifyVeiw.vue'
import RecycleBin from './partial/RecycleBin.vue'
import { inject, onBeforeMount, ref, watch } from 'vue'
import { createConsumer } from '@rails/actioncable'


export default {
  props: {
    operate_view: {
      type: String,
      required: true
    },
    upload_list: {
      type: Array,
      required: true
    },
    free_space: {
      required: true
    }
  },
  components: {
    UploadAndDownloadForm,
    CreateFolder,
    OperateForm,
    ShareData,
    FolderData,
    ClassifyVeiw,
    RecycleBin
  },
  setup(props) {
    const formData = inject('formData')
    const recycledData = inject('recycledData')
    const view = ref(props.operate_view)
    const consumer = createConsumer('ws://localhost:3000/cable')
    const uploadList = ref(props.upload_list)
    const freeSpace = ref(props.free_space)

    const parentFolder = ref()
    const selectedData = ref([])
    const topSelectedData = ref([])

    onBeforeMount(() => {
      parentFolder.value = { id: formData.value.id, name: formData.value.name, data: formData.value.children }
    })

    const setparentFolder = (now) => {
      parentFolder.value = now
      // console.log("parentFolder.value:", parentFolder.value)
    }

    const setSelectedData = (selected) => {
      selectedData.value = selected
      // console.log('selectedData.value:', selectedData.value)
    }

    const setTopSelection = (topSelected) => {
      topSelectedData.value = topSelected
      // console.log('topSelectedData', topSelectedData.value)
    }

    watch(
      () => props.operate_view,
      () => {
        view.value = props.operate_view
        console.log('现在是：', view.value)
      }
    )
    // watch(() => selectedData, () => console.log('selectedData', selectedData.value))

    return {
      formData,
      recycledData,
      view,
      consumer,
      uploadList,
      freeSpace,
      parentFolder,
      setparentFolder,
      selectedData,
      setSelectedData,
      topSelectedData,
      setTopSelection
    }
  }
}
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
