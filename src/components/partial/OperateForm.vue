<template>
  <el-button-group style="margin-right: 10px">
    <el-button v-show="showOperationButton" type="primary" plain @click="deleteSelected">
      <el-icon>
        <Delete />
      </el-icon>
      删除文件
    </el-button>
    <el-button v-show="showOperationButton" type="primary" plain @click="visibleMoveFileTable = true">
      <el-icon>
        <Delete />
      </el-icon>
      移动文件
    </el-button>
  </el-button-group>

  <el-dialog title="文件移动" v-model="visibleMoveFileTable" width="600px">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item v-for="(item, index) in breadcrumb" :key="index">
        <a @click="navigateTo(index)" class="breadcrumb-text no-click">{{ item.name }}</a>
      </el-breadcrumb-item>
    </el-breadcrumb>
    <el-table :data="getFolder" @row-click="handleRowClick">
      <el-table-column label="Name" sortable>
        <template #default="scope">
          <el-icon style="margin-right: 15px">
            <Folder />
          </el-icon>
          {{ scope.row.name }}
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="visibleMoveFileTable = false">取消</el-button>
        <el-button type="primary" @click="moveSelected">移动到此文件夹</el-button>
      </span>
    </template>
  </el-dialog>
</template>
<script>
import { computed, inject, ref, watch, toRef } from 'vue'
import { ElMessage } from 'element-plus'
import apiClient from '@/axios'

export default {
  name: 'OperateForm',
  props: {
    parent_folder: {
      type: Object,
      required: true
    },
    selectedData: {
      type: Array,
      required: true
    },
    topSelectedData: {
      type: Array,
      require: true
    },
    free_space: {
      required: true
    },
    recycledData: {
      type: Array
    }
  },
  setup(props) {
    const data = inject('formData') //原始数据
    const free_space = ref(props.free_space) //剩余空间
    const parent_folder = ref(props.parent_folder) //欲操作文件原文件夹
    const topSelectedData = toRef(props, 'topSelectedData')
    const recycledData = toRef(props, 'recycledData')
    const breadcrumb = ref([{ id: data.value.id, name: 'root', data: data.value.children }]) //移动文件时的目标文件夹路径
    const showOperationButton = ref(false)
    const visibleMoveFileTable = ref(false)

    const navigateTo = (index) => {
      breadcrumb.value = breadcrumb.value.slice(0, index + 1)
      // console.log("breadcrumb.value:", breadcrumb.value)
    }

    const getFolder = computed(() => {
      return breadcrumb.value[breadcrumb.value.length - 1].data.filter(item =>
        item.type === 'folder' && item.id != topSelectedData.value.id
      )
    })

    const handleRowClick = (row) => {
      // console.log("now", row)
      if (row.name != 'root') {
        breadcrumb.value.push({ id: row.id, name: row.name, data: row.children })
      }
    }

    const changeOperationButton = () => {
      // console.log("22222222222222222")
      if (props.selectedData.length != 0) {
        showOperationButton.value = true
      } else {
        showOperationButton.value = false
      }
    }

    // 删除文件
    const deleteSelected = () => {
      let mixed = []
      let folder_ids = []
      let attachment_ids = []

      props.selectedData.forEach((item) => {
        let new_item = {
          mix_id: item.id,
          name: item.name,
          type: item.type
        }
        if ('b2_key' in item) {
          attachment_ids.push(item.id)
          new_item.b2_key = item.b2_key
          new_item.byte_size = item.size
        } else {
          folder_ids.push(item.id)
          new_item.numbering = item.numbering
        }
        mixed.push(new_item)

        free_space.value -= item.size
      })
      // console.log('mixed', mixed)
      // console.log('folder_ids', folder_ids)
      // console.log('attachment_ids', attachment_ids)
      apiClient
        .post('/api/v1/recycle_bins/recycle', {
          token: localStorage.getItem('token'),
          mixed: mixed,
          folder_ids: folder_ids,
          attachment_ids: attachment_ids
        })
        .then((response) => {
          const code = response.data.code
          // console.log("code:", code)
          if (code == 1) {
            updateView()

            ElMessage({
              message: '删除成功',
              type: 'success',
              plain: true
            })
          } else if (code == -1) {
            ElMessage({
              message: '删除失败',
              type: 'error',
              plain: true
            })
          }
        })
        .catch((error) => {
          console.error('发生错误：', error)
        })
    }

    // 移动文件
    const moveSelected = () => {
      let targetMenuId = breadcrumb.value[breadcrumb.value.length - 1].id

      apiClient
        .post('/api/v1/user_data/mover', {
          token: localStorage.getItem('token'),
          data: {
            filelist: props.selectedData,
            target_folder_id: targetMenuId
          }
        })
        .then((response) => {
          const code = response.data.value.code
          if (code == 1) {
            updateRootData()

            ElMessage({
              message: '移动成功',
              type: 'success',
              plain: true
            })
          } else {
            ElMessage({
              message: '移动失败' + response.data.value.exception || '',
              type: 'error',
              plain: true
            })
          }
        })
        .catch((error) => {
          console.error('发生错误：', error)
        })
      visibleMoveFileTable.value = false
    }

    //从原文件夹移除文件并添加至回收站
    const updateView = () => {
      // console.log('parent_folder', parent_folder.value)
      for (let i = parent_folder.value.data.length - 1; i >= 0; i--) {
        if (props.selectedData.includes(parent_folder.value.data[i])) {
          parent_folder.value.data.splice(i, 1)
        }
      }
      recycledData.value.push(...topSelectedData.value)
    }

    //更新视图
    const updateRootData = () => {
      // console.log(origin_folder.value)
      const target_folder = ref(breadcrumb.value[breadcrumb.value.length - 1])
      let need_to_add = props.selectedData.filter((item) =>
        parent_folder.value.children.includes(item)
      )

      target_folder.value.data.value.push(...need_to_add)
      updateView()
    }

    watch(() => props.selectedData, changeOperationButton, { deep: true })
    watch(
      () => props.parent_folder,
      () => {
        parent_folder.value = props.parent_folder
      }
    )
    return {
      breadcrumb,
      navigateTo,
      getFolder,
      handleRowClick,
      deleteSelected,
      showOperationButton,
      visibleMoveFileTable,
      moveSelected
    }
  }
}
</script>
