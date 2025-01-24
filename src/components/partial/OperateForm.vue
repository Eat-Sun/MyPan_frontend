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
import { apiClient, processAddBinData } from '@/utils'
// import { useDataStore } from '@/stores/data';

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
      type: Object
    }
  },
  setup(props) {
    const originData = inject('originData') //原始数据
    const free_space = toRef(props, 'free_space') //剩余空间
    const parent_folder = toRef(props, 'parent_folder') //欲操作文件原文件夹
    const topSelectedData = toRef(props, 'topSelectedData')
    const binRoot = inject('binBreadcrumb')[0]
    console.log("222222222", inject('binBreadcrumb'))
    // const dataStore = useDataStore()
    // const recycledData = toRef(props, 'recycledData')
    // const recycledData = dataStore.getRecycledData()

    const moveBreadcrumb = inject('moveBreadcrumb') //移动文件时的目标文件夹路径
    const showOperationButton = ref(false)
    const visibleMoveFileTable = ref(false)

    const navigateTo = (index) => {
      moveBreadcrumb.splice(0, moveBreadcrumb.length, ...moveBreadcrumb.slice(0, index + 1));
      // console.log("breadcrumb.value:", breadcrumb.value)
    }

    const getFolder = computed(() => {
      return moveBreadcrumb[moveBreadcrumb.length - 1].children.filter(item =>
        item.type === 'folder' && !topSelectedData.value.includes(item)
      )
    })

    const handleRowClick = (row) => {
      // console.log("now", row)
      if (row.name != 'root') {
        moveBreadcrumb.push(row)
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
      // console.log("selectedData", props.selectedData)
      let folder_ids = []
      let attachment_ids = []
      let opt = []

      props.selectedData.forEach((item) => {
        if (item.type == 'folder') {
          folder_ids.push(item.id)
        } else {
          attachment_ids.push(item.id)
        }

        if (topSelectedData.value.includes(item)) {
          opt.push({
            mix_id: item.id,
            type: item.type,
            is_top: true
          })
        } else {
          opt.push({
            mix_id: item.id,
            type: item.type,
            is_top: false
          })
        }

        free_space.value -= item.size
      })
      // console.log('folder_ids', folder_ids)
      // console.log('attachment_ids', attachment_ids)
      // console.log('opt', opt)
      apiClient
        .post('/api/v1/recycle_bins/recycle', {
          token: localStorage.getItem('token'),
          folder_ids: folder_ids,
          attachment_ids: attachment_ids,
          opt: opt
        })
        .then((response) => {
          const code = response.data.code
          // 
          if (code == 1) {
            let result = response.data.data
            // console.log("result", result)
            updateViewAfterDelete(result)
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
      let targetFolderNumbering = moveBreadcrumb[moveBreadcrumb.length - 1].numbering
      let folder_ids = []
      let attachment_ids = []
      topSelectedData.value.forEach(item => {
        if (item.type == 'folder') {
          folder_ids.push(item.id)
        } else {
          attachment_ids.push(item.id)
        }
      })
      // console.log(targetFolderNumbering)
      // console.log(folder_ids)
      // console.log(attachment_ids)
      apiClient
        .post('/api/v1/user_data/mover', {
          token: localStorage.getItem('token'),
          target_folder_numbering: targetFolderNumbering,
          folder_ids: folder_ids,
          attachment_ids: attachment_ids
        })
        .then((response) => {
          const code = response.data.code
          if (code == 1) {
            updateViewAfterMove()

            ElMessage({
              message: '移动成功',
              type: 'success',
              plain: true
            })
          } else {
            ElMessage({
              message: '移动失败' + response.data.exception || '',
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
    const updateViewAfterDelete = async (response) => {
      console.log('parent_folder.value', parent_folder.value)
      parent_folder.value.children = parent_folder.value.children.filter(item => !props.selectedData.includes(item))
      originData.attachments = originData.attachments.filter(item => !props.selectedData.includes(item))
      originData.folders = originData.folders.filter(item => !props.selectedData.includes(item))
      console.log('originData', originData)
      console.log('parent_folder.value', parent_folder.value)
      let need_to_add = processAddBinData(JSON.parse(JSON.stringify(topSelectedData.value)), response)
      // console.log('need_to_add', need_to_add)
      binRoot.children.push(...need_to_add)
      // recycledData.value.folders.push(...need_to_add.folders)
      // recycledData.value.attachments.push(...need_to_add.attachments)

      // console.log('recycledData', recycledData.value)
    }

    //从原文件夹移除文件并添加至新文件夹
    const updateViewAfterMove = () => {
      console.log("topSelectedData.value", topSelectedData.value)
      console.log("parent_folder.value", parent_folder.value)
      parent_folder.value.children = parent_folder.value.children.filter(item => !topSelectedData.value.includes(item))

      let target_folder = moveBreadcrumb[moveBreadcrumb.length - 1]
      console.log("target_folder", target_folder)
      target_folder.children.push(...topSelectedData.value)
    }

    watch(() => props.selectedData, changeOperationButton, { deep: true })
    watch(
      () => parent_folder,
      () => {
        console.log("parent_folder", parent_folder.value)
        // parent_folder.value = props.parent_folder
      },
      { deep: true }
    )
    // watch(() => originData.folders, () => {
    //   formData = processData(originData)
    // }, { deep: true })
    return {
      breadcrumb: moveBreadcrumb,
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
