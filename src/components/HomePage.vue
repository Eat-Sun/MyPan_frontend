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
            <UploadAndDownloadForm :data="dataInFolderData" :currentPath="currentPath" :selectedData="selectedData"
              :consumer="consumer" @update-file-list="updateFileList"></UploadAndDownloadForm>
            <CreateFolder v-if="parentLoaded" :data="dataInFolderData" :parent_folder="currentFolder"
              @updata_dataInFolderData="updata_dataInFolderData"></CreateFolder>
            <OperateForm :currentPath="currentPath" :parent_folder="currentFolder" :data="dataInFolderData"
              :selectedData="selectedData" @deleteFrom_dataInFolderData="deleteFrom_dataInFolderData"
              v-if="parentLoaded">
            </OperateForm>
            <ShareData :data="dataInFolderData" :currentPath="currentPath" :selectedData="selectedData"
              v-if="parentLoaded">
            </ShareData>
          </div>

          <FolderData :data="dataInFolderData" v-if="parentLoaded" @selection="setSelectedData"
            @currentFolder="setcurrentFolder" @currentPath="setCurrentPath"></FolderData>
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

export default {
  beforeRouteLeave(to, from, next) {
    console.log("触发：", this.dataInFolderData)
    const url = 'http://localhost:3000/api/v1/sessions/quit';

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
    const parentLoaded = ref(false)
    const dataLoaded = ref(false)
    const selectedData = ref([])

    const folderMenu = ref()
    const currentFolder = ref()
    let currentPath = ref([])

    onBeforeMount(() => {
      dataInFolderData.value = JSON.parse(route.query.folder_data);
      folderMenu.value = setFolderMenu(dataInFolderData.value)
      currentPath.value.push({ id: dataInFolderData.value[0].id, name: dataInFolderData.value[0].name, data: dataInFolderData.value[0].children })
      currentFolder.value = currentPath.value[currentPath.value.length - 1]
      // console.log("dataInFolderData.value:", dataInFolderData.value)
      // console.log("folderMenu.value:", folderMenu.value)
      // console.log("currentPath.value:", currentPath.value)
      // console.log("currentFolder.value:", currentFolder.value)
      window.addEventListener('beforeunload', () => {
        const url = 'http://localhost:3000/api/v1/sessions/quit';

        const formData = new FormData();
        formData.append('token', localStorage.getItem('token'));
        formData.append('folder_data', JSON.stringify(dataInFolderData.value));

        navigator.sendBeacon(url, formData);
      });

      parentLoaded.value = true
    })

    const handleSelect = (index) => {
      console.log('点击了菜单项 ' + index)
    }

    const handleOpen = (key, keyPath) => {
      console.log('点击了侧栏' + key, keyPath)
    }

    const handleClose = (key, keyPath) => {
      console.log(key, keyPath)
    }

    // 更新dataInFolderData
    const updata_dataInFolderData = (now) => {
      dataInFolderData.value = now
      folderMenu.value = setFolderMenu(dataInFolderData.value)
    }

    const setSelectedData = (selected) => {
      selectedData.value = selected
      console.log('selectedData.value:', selectedData.value)
    }

    const setFolderMenu = (jsonArray) => {
      let folderList = {
        id: '',
        name: '',
        children: []
      }

      jsonArray.forEach((item) => {
        if (item.type === 'folder') {
          folderList.id = item.id
          folderList.name = item.name
          if (item.children && item.children.length > 0) {
            let result = setFolderMenu(item.children)
            if (result != null) {
              folderList.children.push(result)
            }
          }
        } else {
          return null
        }
      })

      if (folderList.id != '') {
        return folderList
      } else {
        return null
      }
    }

    const setcurrentFolder = (now) => {
      currentFolder.value = now
      dataLoaded.value = true
      console.log("currentFolder.value:", currentFolder.value)
    }

    const setCurrentPath = (path) => {
      currentPath.value = path.value
      console.log("currentPath:", currentPath.value)
    }

    const updateFileList = (files) => {
      uploadList.value = files
    }

    const deleteFrom_dataInFolderData = () => {
      console.log('dataInFolderData:', dataInFolderData.value)
      operateDelete(dataInFolderData.value)
    }

    const update_FolderMenu = (now) => {
      folderMenu.value = now
      console.log("now:", now)
    }

    const operateDelete = (data) => {
      // console.log('selectedData:', selectedData.value)
      // console.log('data:', data)
      if (selectedData.value.length > 0) {
        // 逆序遍历，以避免在修改数组时导致的索引问题
        for (let i = data.length - 1; i >= 0; i--) {
          const item = data[i]
          let indexInSelectedData = selectedData.value.findIndex(
            (selectedItem) => selectedItem === item
          )

          if (indexInSelectedData !== -1) {
            data.splice(i, 1) // 从 data 中移除
            selectedData.value.splice(indexInSelectedData, 1) // 从 selectedData 中移除
            console.log('Item removed:', item)
          }

          if (item.children) {
            console.log('Processing children of item:', item)
            operateDelete(item.children) // 递归处理子元素
          }
        }
      }
    }

    return {
      activeIndex,
      uploadListVisible,
      uploadList,
      updateFileList,
      handleSelect,
      handleOpen,
      handleClose,
      dataInFolderData,
      setSelectedData,
      selectedData,
      setFolderMenu,
      setcurrentFolder,
      setCurrentPath,
      folderMenu,
      currentFolder,
      currentPath,
      parentLoaded,
      dataLoaded,
      updata_dataInFolderData,
      deleteFrom_dataInFolderData,
      update_FolderMenu,
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
