<template>
  <el-divider />
  <div>
    <el-breadcrumb separator="/">
      <el-breadcrumb-item v-for="(item, index) in breadcrumb" :key="index">
        <a @click="navigateTo(index)" class="breadcrumb-text no-click">{{ item.name }}</a>
      </el-breadcrumb-item>
    </el-breadcrumb>

    <el-table :data="currentData" @row-click="handleRowClick" @selection-change="selection">
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
import { onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import apiClient from '@/axios';

export default {
  name: 'FolderData',
  emits: ['selection', 'currentFolder'],
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  setup(props, { emit }) {
    const breadcrumb = ref([{ id: props.data[0].id, name: 'root', data: props.data[0].children }])
    const currentData = ref(breadcrumb.value[breadcrumb.value.length - 1].data)

    onMounted(() => {
      emit('currentFolder', breadcrumb.value[breadcrumb.value.length - 1])
    })

    const navigateTo = (index) => {
      breadcrumb.value = breadcrumb.value.slice(0, index + 1)
      currentData.value = breadcrumb.value[index].data
    }

    const handleRowClick = (row) => {
      if (row.type === 'folder') {
        if (row.name != 'root') {
          breadcrumb.value.push({ id: row.id, name: row.name, data: row.children })
          currentData.value = row.children
        }
      }
    }

    const createFolder = (folder) => {
      delete folder.editing

      apiClient
        .post('/api/v1/folders/newFolder', {
          token: localStorage.getItem('token'),
          new_folder: folder.name,
          parent_folder_id: breadcrumb.value[breadcrumb.value.length - 1].id
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

    const selection = (selection) => {
      emit('selection', currentData.value.filter(item => selection.includes(item)))
    }

    watch(
      () => breadcrumb.value,
      () => {
        emit('currentFolder', breadcrumb.value[breadcrumb.value.length - 1])
        // console.log('test:', breadcrumb.value[breadcrumb.value.length - 1])
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
