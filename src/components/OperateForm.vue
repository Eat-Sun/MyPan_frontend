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
          </el-icon> {{ scope.row.name }}
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
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus';
import apiClient from '@/axios';

export default {
  name: "OperateForm",
  props: {
    data: {
      type: Object,
      required: true
    },
    parent_folder: {
      type: Object,
      required: true
    },
    selectedData: {
      type: Array,
      required: true
    }
  },
  setup(props) {
    const data = reactive(props.data) //原始数据
    const parent_folder = ref(props.parent_folder) //欲操作文件原文件夹
    const breadcrumb = ref([{ id: data.id, name: 'root', data: data.children }]) //移动文件时的目标文件夹路径
    const showOperationButton = ref(false)
    const visibleMoveFileTable = ref(false)

    const navigateTo = (index) => {
      breadcrumb.value = breadcrumb.value.slice(0, index + 1)
      // console.log("breadcrumb.value:", breadcrumb.value)
    }

    const getFolder = computed(() => {
      return breadcrumb.value[breadcrumb.value.length - 1].data.filter(item => item.type === 'folder')
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
      apiClient.post('/api/v1/attachments/deleter', {
        token: localStorage.getItem('token'),
        data: props.selectedData
      }).then(response => {
        const code = response.data.code;
        // console.log("code:", code)
        if (code == 1) {
          removeFrom_OriginFolder()

          ElMessage({
            message: '删除成功',
            type: 'success',
            plain: true,
          })
        } else if (code == -1) {
          ElMessage({
            message: '删除失败',
            type: 'error',
            plain: true,
          })
        }
      }).catch(error => {
        console.error('发生错误：', error)
      });
    }

    // 移动文件
    const moveSelected = () => {
      let targetMenuId = breadcrumb.value[breadcrumb.value.length - 1].id;

      apiClient.post('/api/v1/user_data/mover', {
        token: localStorage.getItem('token'),
        data: {
          filelist: props.selectedData,
          target_folder_id: targetMenuId
        }
      }).then(response => {
        const code = response.data.code;
        if (code == 1) {
          updateRootData()

          ElMessage({
            message: '移动成功',
            type: 'success',
            plain: true,
          })
        } else {
          ElMessage({
            message: '移动失败' + response.data.exception || '',
            type: 'error',
            plain: true,
          })
        }
      })
        .catch(error => {
          console.error('发生错误：', error)
        });
      visibleMoveFileTable.value = false
    }

    //从原文件夹移除文件
    const removeFrom_OriginFolder = () => {
      console.log("parent_folder", parent_folder.value)
      for (let i = parent_folder.value.data.length - 1; i >= 0; i--) {
        if (props.selectedData.includes(parent_folder.value.data[i])) {
          parent_folder.value.data.splice(i, 1);
        }
      }
    }

    //更新视图
    const updateRootData = () => {
      // console.log(origin_folder.value)
      const target_folder = ref(breadcrumb.value[breadcrumb.value.length - 1])
      let need_to_add = props.selectedData.filter(item => parent_folder.value.children.includes(item))

      target_folder.value.data.push(...need_to_add)
      removeFrom_OriginFolder()
    }

    watch(() => props.selectedData, changeOperationButton, { deep: true });
    watch(() => props.parent_folder, () => { parent_folder.value = props.parent_folder })
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
