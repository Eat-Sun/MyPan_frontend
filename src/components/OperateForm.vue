<template>
  <el-button-group style="margin-right: 10px">
    <el-button v-show="showOperationButton" type="primary" plain @click="deleteSelected">
      <el-icon>
        <Delete />
      </el-icon>
      删除文件
    </el-button>
    <el-button
      v-show="showOperationButton"
      type="primary"
      plain
      @click="visibleMoveFileTable = true"
    >
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
    <el-table :data="currentData" @row-click="handleRowClick">
      <el-table-column>
        <template v-slot="scope">
          <div>
            <el-icon style="margin-right: 15px"><Folder /></el-icon> {{ scope.row.name }}
          </div>
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
import { reactive, ref, watch } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus';

export default {
  name: "OperateForm",
  emits:['deleteFrom_dataInFolderData'],
  props: {
    currentPath: {
      type: Array,
      required: true
    },
    data: {
      type: Array,
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
  setup(props, { emit }) {
    const data = reactive(props.data) //原始数据
    const currentPath = ref(props.currentPath) //欲操作文件所在的文件夹路径
    const breadcrumb = ref([{ id: data[0].id, name: 'root', data: data[0].children }]) //移动文件时的目标文件夹路径
    const currentData = ref(breadcrumb.value[breadcrumb.value.length - 1].data)
    const showOperationButton = ref(false)
    const visibleMoveFileTable = ref(false)

    const navigateTo = (index) => {
      breadcrumb.value = breadcrumb.value.slice(0, index + 1)
      currentData.value = breadcrumb.value[index].data
      console.log("breadcrumb.value:",breadcrumb.value)
    }

    const handleRowClick = (row) => {
      if (row.name != 'root') {
        breadcrumb.value.push({ id: row.id ,name: row.name, data: row.children })
      }
      currentData.value = row.children
    }

    const changeOperationButton = () => {
      // console.log("22222222222222222")
      if (props.selectedData.length != 0) {
        showOperationButton.value = true
      } else {
        showOperationButton.value = false
      }
    }

    const deleteSelected = () => {
      // emit('deleteFrom_dataInFolderData')
      axios.post('http://localhost:3000/api/v1/attachments/deleter', {
        token: localStorage.getItem('token'),
        data: props.selectedData
      }).then(response => {
        const code = response.data.code;
        console.log("code:", code)
        if(code == 1){
          emit('deleteFrom_dataInFolderData')

          ElMessage({
            message: '删除成功',
            type: 'success',
            plain: true,
          })
        }else if(code == -1){
          ElMessage({
            message: '删除失败',
            type: 'error',
            plain: true,
          })
        }
      }).catch(error => {
        console.error('发生错误：',error)
      });
    }

    // 移动文件
    const moveSelected = () => {
      let files = props.selectedData.map(file => {
        return { id: file.id, type: file.type };
      });
      let targetMenuId = breadcrumb.value[breadcrumb.value.length - 1].id;

      axios.post('http://localhost:3000/api/v1/attachments/mover', {
        token: localStorage.getItem('token'),
        data: {
          filelist: files,
          target_folder_id: targetMenuId
        }
      }).then(response => {
        const code = response.data.code;
        if(code == 1){
          updateRootData(data, currentPath.value, breadcrumb.value, props.selectedData)
          // console.log("data:",data)
          // console.log("props.data:",props.data)
          ElMessage({
            message: '移动成功',
            type: 'success',
            plain: true,
          })
        }else{
          ElMessage({
            message: '移动失败',
            type: 'error',
            plain: true,
          })
        }
      })
      .catch(error => {
        console.error('发生错误：',error)
      });
      visibleMoveFileTable.value = false
    }

    //文件移动
    const updateRootData = (data, currentPath, breadcrumb, selectedData) => {
      // console.log("data:",data)
      // console.log("currentPath:",currentPath)
      // console.log("breadcrumb:",breadcrumb)
      // console.log("selectedData:",selectedData)
      //在原始数据中寻找删除文件的路径
      if(currentPath.length > 0){
        data.forEach(item => {
          if(item.type == 'folder' && item.id == currentPath[0]?.id){
            updateRootData(item.children, currentPath.slice(1), breadcrumb, selectedData)
          }
        })
      }else{
        //找到了删除文件的路径
        for (let i = data.length - 1; i >= 0; i--) {
          if (selectedData.includes(data[i])) {
            data.splice(i, 1);
          }
        }
      }
      //在原始数据中寻找添加文件的路径
      if(breadcrumb.length > 0){
        data.forEach(item => {
          if(item.type == 'folder' && item.id == breadcrumb[0]?.id){
            updateRootData(item.children, currentPath, breadcrumb.slice(1), selectedData)
          }
        });
      }else{
        //找到了添加文件的路径
        data.push(...selectedData)
      }
    }

    watch(() => props.selectedData, changeOperationButton, { deep: true });
    watch(() => props.currentPath, () => { currentPath.value = props.currentPath })

    return {
      breadcrumb,
      navigateTo,
      currentData,
      handleRowClick,
      deleteSelected,
      showOperationButton,
      visibleMoveFileTable,
      moveSelected
    }
  }
}
</script>
