<template>
  <el-container class="full-height-container">
    <el-header class="header">
      <h1 class="header-title">MyPan</h1>
      <el-menu :default-active="activeIndex" mode="horizontal" background-color="#FFFFFF">
        <el-menu-item index="2" @click="uploadListVisible = true">上传列表</el-menu-item>
        <div>
          <el-avatar> user </el-avatar>
        </div>
      </el-menu>
    </el-header>
    <el-drawer v-model="uploadListVisible" title="上传列表" direction="rtl" size="50%">
      <el-table :data="uploadList">
        <el-table-column property="name" label="文件名" width="150" />
        <el-table-column property="size" label="大小" />
        <el-table-column property="percentage" label="上传进度" />
      </el-table>
    </el-drawer>
    <el-container>
      <el-aside width="200px" class="aside">
        <el-col :span="12">
          <el-menu default-active="1-1" class="el-menu-vertical-demo" @open="handleOpen" @close="handleClose"
            style="border-right: 10px solid #000">
            <el-sub-menu index="1">
              <template #title>
                <el-icon>
                  <Document />
                </el-icon>
                <span>我的文件</span>
              </template>
              <el-menu-item index="1-1">
                <el-icon>
                  <Files />
                </el-icon>全部文件
              </el-menu-item>
              <el-menu-item index="1-2">
                <el-icon>
                  <Picture />
                </el-icon>图片
              </el-menu-item>
              <el-menu-item index="1-3">
                <el-icon>
                  <Document />
                </el-icon>文档
              </el-menu-item>
              <el-menu-item index="1-4">
                <el-icon>
                  <VideoCamera />
                </el-icon>视频
              </el-menu-item>
              <el-menu-item index="1-5">
                <el-icon>
                  <Headset />
                </el-icon>音频
              </el-menu-item>
            </el-sub-menu>
            <el-menu-item index="2">
              <el-icon>
                <Delete />
              </el-icon>
              <span>回收站</span>
            </el-menu-item>
          </el-menu>
        </el-col>
      </el-aside>
      <el-container>
        <el-main class="main">
          <div style="display: flex; flex-direction: row">
            <UploadAndDownloadForm :uploadList="uploadList" :parent_folder="currentFolder" :selectedData="selectedData"
              :consumer="consumer" />
            <CreateFolder :parent_folder="currentFolder" />
            <OperateForm :parent_folder="currentFolder" :data="dataInFolderData" :selectedData="selectedData" />
            <ShareData :data="dataInFolderData" :selectedData="selectedData" :topSelectedData="topSelectedData" />
          </div>

          <FolderData :data="dataInFolderData" @selection="setSelectedData" @topSelection="setTopSelection"
            @currentFolder="setcurrentFolder" />
        </el-main>
        <el-footer class="footer">Footer</el-footer>
      </el-container>
    </el-container>
  </el-container>
</template>

<script>
import { ref, onBeforeMount } from 'vue'
import { useRoute } from 'vue-router'
import FolderData from './FolderData.vue'
import UploadAndDownloadForm from './UploadAndDownloadForm.vue'
import ShareData from './ShareData.vue'
import OperateForm from './OperateForm.vue'
import CreateFolder from './CreateFolder.vue'
import { createConsumer } from '@rails/actioncable'
import apiClient from '@/axios'

export default {
  beforeRouteLeave(to, from, next) {
    // console.log("触发1：", apiClient.defaults.baseURL)
    const url = apiClient.defaults.baseURL + '/api/v1/sessions/quit';
    const formData = new FormData();
    formData.append('token', localStorage.getItem('token'));
    formData.append('folder_data', JSON.stringify(this.dataInFolderData));

    navigator.sendBeacon(url, formData);

    next();
  },
  components: {
    UploadAndDownloadForm,
    CreateFolder,
    FolderData,
    ShareData,
    OperateForm
  },
  setup() {
    const route = useRoute()
    const dataInFolderData = ref([])
    const consumer = createConsumer('ws://localhost:3000/cable')
    const activeIndex = ref('1')
    const uploadListVisible = ref(false)
    const uploadList = ref([])

    const selectedData = ref([])
    const topSelectedData = ref([])
    const currentFolder = ref()

    onBeforeMount(() => {
      if (Array.isArray(JSON.parse(route.query.folder_data))) {
        dataInFolderData.value = processData(JSON.parse(route.query.folder_data))
      } else {
        dataInFolderData.value = JSON.parse(route.query.folder_data)
      }

      currentFolder.value = { id: dataInFolderData.value.id, name: dataInFolderData.value.name, data: dataInFolderData.value.children }

      window.addEventListener('unload', () => {
        const url = apiClient.defaults.baseURL + '/api/v1/sessions/quit';
        const formData = new FormData();
        formData.append('token', localStorage.getItem('token'));
        formData.append('folder_data', JSON.stringify(dataInFolderData.value));

        navigator.sendBeacon(url, formData);
      });
    })

    const processData = (data) => {
      console.log(data)
      let stack = []
      let folders = data[0]
      let attachments = data[1]
      let root = folders.find(item => item.ancestry == null)

      stack.push(root)

      while (stack.length > 0) {
        let folder = stack.pop()

        let subFolders = folders.filter(item => item.ancestry == folder.numbering)
        let subAttachments = attachments.filter(item => item.folder_id == folder.id)
        console.log("subFolders", subFolders)
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

    const handleSelect = (index) => {
      console.log('点击了菜单项 ' + index)
    }

    const handleOpen = (key, keyPath) => {
      console.log('点击了侧栏' + key, keyPath)
    }

    const handleClose = (key, keyPath) => {
      console.log(key, keyPath)
    }

    const setSelectedData = (selected) => {
      selectedData.value = selected
      console.log('selectedData.value:', selectedData.value)
    }

    const setTopSelection = (topSelected) => {
      topSelectedData.value = topSelected
      // console.log("topSelectedData", topSelectedData.value)
    }

    const setcurrentFolder = (now) => {
      currentFolder.value = now
      // console.log("currentFolder.value:", currentFolder.value)
    }

    return {
      activeIndex,
      uploadListVisible,
      uploadList,
      handleSelect,
      handleOpen,
      handleClose,
      dataInFolderData,
      setSelectedData,
      setTopSelection,
      selectedData,
      topSelectedData,
      setcurrentFolder,
      currentFolder,
      consumer
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

.el-header,
.el-footer {
  flex: none;
}

.el-menu {
  width: 300px;
  justify-content: flex-end;
  flex-grow: 1;
}

.el-main {
  flex: 1;
  /* Allow main content to grow and fill the space */
  overflow-y: auto;
  /* Ensure content is scrollable if it overflows */
}

.el-button {
  display: flex;
}

.el-button-group {
  display: flex;
}

.header {
  display: flex;
  align-items: center;
  /* 确保所有子元素在垂直方向上居中对齐 */
  justify-content: flex-end;
  background-color: #ffffff;
  line-height: 60px;
  /* Adjust this value according to the actual header height */
}

.aside {
  background-color: #ffffff;
  text-align: center;
  line-height: 300px;
  /* Adjust this value according to the actual aside height */
}

.main {
  background-color: #ffffff;
  padding: 20px;
  overflow-y: auto;
  /* Ensure content is scrollable if it overflows */
}

.footer {
  background-color: #b3c0d1;
  text-align: center;
  line-height: 40px;
  /* Adjust this value according to the actual footer height */
}
</style>
