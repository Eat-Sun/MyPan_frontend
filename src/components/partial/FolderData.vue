<template>
  <el-divider />
  <div>
    <el-breadcrumb separator="/" style="height: 10px">
      <el-breadcrumb-item v-for="(item, index) in breadcrumb" :key="index">
        <a @click="navigateTo(index)" class="breadcrumb-text no-click">{{ item.name }}</a>
      </el-breadcrumb-item>
    </el-breadcrumb>

    <el-empty v-if="currentData.length == 0" description="暂无文件" />
    <el-table v-else :data="currentData" @row-click="handleRowClick" @selection-change="selection">
      <el-table-column type="selection" width="55" />
      <el-table-column prop="name" label="Name" sortable>
        <template v-slot="scope">
          <div v-if="scope.row.type == 'folder'">
            <el-icon style="margin-right: 15px">
              <Folder />
            </el-icon>
            {{ scope.row.name }}
          </div>
          <div v-else-if="scope.row.type == 'picture'">
            <el-icon style="margin-right: 15px">
              <Picture />
            </el-icon>
            {{ scope.row.name }}
          </div>
          <div v-else-if="scope.row.type == 'word'">
            <el-icon style="margin-right: 15px">
              <Document />
            </el-icon>{{ scope.row.name }}
          </div>
          <div v-else-if="scope.row.type == 'video'">
            <el-icon style="margin-right: 15px">
              <VideoCamera />
            </el-icon>{{ scope.row.name }}
          </div>
          <div v-else-if="scope.row.type == 'audio'">
            <el-icon style="margin-right: 15px">
              <Headset />
            </el-icon>{{ scope.row.name }}
          </div>
          <div v-else>
            <el-icon style="margin-right: 15px">
              <More />
            </el-icon>{{ scope.row.name }}
          </div>
          <div v-if="'editing' in scope.row && scope.row.editing" @click.stop>
            <el-input v-model="scope.row.name" style="width: 120px; margin-right: 15px" placeholder="文件夹名称" clearable />
            <el-button type="danger" circle @click="currentData.splice(scope.$index, 1)">
              <el-icon>
                <Delete />
              </el-icon>
            </el-button>
            <el-button type="primary" circle @click="createFolder(scope.row)">
              <el-icon><Select /></el-icon>
            </el-button>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="type" label="Type" sortable></el-table-column>
      <el-table-column prop="size" label="Size" sortable>
        <template v-slot="scope">
          <div v-if="scope.row.type != 'folder'">
            <div v-if="scope.row.size < 1024">{{ scope.row.size + 'Byte' }}</div>
            <div v-else-if="scope.row.size > 1024 && scope.row.size < 1048576">
              {{ (scope.row.size / 1024).toFixed(2) + 'KB' }}
            </div>
            <div v-else-if="scope.row.size > 1048576 && scope.row.size < 1073741824">
              {{ (scope.row.size / 1048576.0).toFixed(2) + 'MB' }}
            </div>
            <div v-else>{{ (scope.row.size / 1073741824.0).toFixed(2) + 'GB' }}</div>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { computed, inject, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import apiClient from '@/axios'

export default {
  name: 'FolderData',
  emits: ['selected', 'topSelection', 'parentFolder'],
  setup(props, { emit }) {
    let data = inject('formData')
    console.log('data', data.value)
    const breadcrumb = ref([{ id: data.value.id, numbering: data.value.numbering, name: 'root', data: data.value.children }])
    const currentFolder = computed(() => breadcrumb.value[breadcrumb.value.length - 1])
    const currentData = computed(() => currentFolder.value.data)

    const navigateTo = (index) => {
      breadcrumb.value = breadcrumb.value.slice(0, index + 1)
      // console.log('breadcrumb', breadcrumb.value)
      // console.log('currentFolder', currentFolder.value)
      // console.log('currentData', currentData.value)
    }

    const handleRowClick = (row) => {
      if (row.type === 'folder' && row.name != 'root') {
        breadcrumb.value.push({ id: row.id, numbering: row.numbering, name: row.name, data: row.children })
      }
      // console.log('breadcrumb', breadcrumb.value)
      // console.log('currentFolder', currentFolder.value)
      // console.log('currentData', currentData.value)
    }

    const createFolder = (folder) => {
      delete folder.editing
      // console.log('currentData', currentData.value)
      apiClient
        .post('/api/v1/folders/newFolder', {
          token: localStorage.getItem('token'),
          new_folder: folder.name,
          parent_folder_numbering: currentFolder.value.numbering
        })
        .then((response) => {
          const code = response.data.code
          if (code == 1) {
            Object.assign(folder, response.data.data)

            ElMessage({
              message: '创建成功',
              type: 'success',
              plain: true
            })
          } else {
            ElMessage({
              message: '创建失败',
              type: 'error',
              plain: true
            })
          }
        })
        .catch((error) => {
          console.error('发生错误：', error)
        })
    }

    const selection = (selected) => {
      // console.log("selected:", selected)
      emit('selected', selected)
      emit(
        'topSelection',
        currentData.value.filter((item) => selected.includes(item))
      )
    }

    watch(
      () => breadcrumb.value,
      () => {
        emit('parentFolder', currentFolder.value)
      },
      { deep: true }
    )

    return {
      breadcrumb,
      currentData,
      handleRowClick,
      navigateTo,
      selection,
      createFolder
    }
  }
}
</script>

<style>
/* Use Element UI classes to style breadcrumb text */
.breadcrumb-text {
  font-size: 16px;
  color: #333;
  /* Add other styles as needed */
}

.no-click {
  cursor: default;
  color: #999;
}
</style>
