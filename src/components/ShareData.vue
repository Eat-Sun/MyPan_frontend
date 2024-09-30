<template>
  <el-button-group>
    <el-button type="primary" plain @click="shareSelectedTo">
      <el-icon>
        <Connection />
      </el-icon>
      共享文件
    </el-button>
    <el-button type="primary" plain @click="visibleGetForm = true">
      <el-icon>
        <Download />
      </el-icon>
      获取文件
    </el-button>
    <el-button type="primary" plain @click="sharedFile">
      <el-icon>
        <View />
      </el-icon>
      查看分享
    </el-button>
  </el-button-group>

  <el-dialog v-model="visibleSetShare" width="600px">
    <el-form :modle="setShare">
      <el-form-item label="设置提取码" :label-width="100">
        <el-input v-model="setShare.varify" autocomplete="off" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visibleSetShare = false">取消</el-button>
        <el-button type="primary" @click="send">
          确认
        </el-button>
      </div>
    </template>
  </el-dialog>

  <el-dialog title="通过链接获取文件" v-model="visibleGetForm" width="600px">
    <el-form :model="getForm">
      <el-form-item label="链接" :label-width="100">
        <el-input v-model="getForm.link" autocomplete="off" />
      </el-form-item>
      <el-form-item label="提取码" :label-width="100">
        <el-input v-model="getForm.varify" autocomplete="off" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="getShareFrom">
          获取文件
        </el-button>
      </div>
    </template>
  </el-dialog>

  <el-dialog title="我的分享" v-model="visibleMySharedLinkTable" width="600px">
    <el-table :data="myShareTable">
      <el-table-column type="selection" width="55" />
      <el-table-column prop="link" label="Link" sortable></el-table-column>
      <el-table-column prop="varify" label="Verify" sortable></el-table-column>
      <el-table-column align="right">
        <template #default="scope">
          <el-button size="small" type="primary" @click="viewShared(scope.row)">
            查看链接
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>

  <el-dialog title="链接详情" v-model="visibleMySharedFileTable" width="600px">
    <el-table :data="mySharedFile">
      <el-table-column prop="file_name" label="Name" sortable></el-table-column>
      <el-table-column prop="file_type" label="Type" sortable></el-table-column>
      <el-table-column prop="byte_size" label="Size" sortable></el-table-column>
    </el-table>
  </el-dialog>

</template>

<script>
import { ref, reactive, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import apiClient from '@/axios';

export default {
  name: 'ShareData',
  props: {
    data: {
      type: Object,
      required: true
    },
    selectedData: {
      type: Array,
      required: true
    }
  },
  setup(props) {
    const root = ref(props.data)

    const shareList = ref(props.selectedData)
    const visibleGetForm = ref(false)
    const visibleSetShare = ref(false)
    const visibleMySharedLinkTable = ref(false)
    const visibleMySharedFileTable = ref(false)
    const setShare = reactive({
      varify: ''
    })
    const getForm = reactive({
      link: '',
      varify: ''
    })
    const myShareTable = ref({})
    const mySharedFile = ref({})

    const shareSelectedTo = () => {
      visibleSetShare.value = true
    }

    const send = () => {
      // console.log("shareList:", shareList.value)
      apiClient.post('/api/v1/shares/new', {
        token: localStorage.getItem('token'),
        data: shareList.value,
        varify: setShare.varify
      })
        .then(response => {
          const code = response.data.code;
          if (code == 1) {
            let link = response.data.link
            let varify = response.data.varify
            ElMessageBox.confirm(
              '链接：' + link + '\n提取码：' + varify,
              '分享成功',
              {
                confirmButtonText: 'OK',
                cancelButtonText: 'Cancel',
                type: 'success',
              }
            )
          } else {
            const message = response.data.message
            ElMessage({
              message: '分享失败: ' + message,
              type: 'error',
              plain: true,
            })
          }

        })
        .catch(error => {
          console.error('发生错误：', error)
        });
    }

    const getShareFrom = () => {
      apiClient.get('/api/v1/shares/getter', {
        params: {
          token: localStorage.getItem('token'),
          link: getForm.link,
          varify: getForm.varify
        }
      })
        .then(response => {
          const code = response.data.code;
          if (code == 1) {
            const newData = response.data.data
            root.value = newData

            ElMessage({
              message: '获取成功',
              type: 'success',
              plain: true,
            })
            visibleGetForm.value = false
          } else {
            const message = response.data.message
            ElMessage({
              message: '获取失败: ' + message,
              type: 'error',
              plain: true,
            })
          }
        })
        .catch(error => {
          console.error('发生错误：', error)
        });
    }

    const sharedFile = () => {
      apiClient.get('/api/v1/shares/shared', {
        params: {
          token: localStorage.getItem('token')
        }
      })
        .then(response => {
          const code = response.data.code;
          if (code == 1) {
            console.log(response.data.data)
            visibleMySharedLinkTable.value = true
            myShareTable.value = response.data.data
          }
        })
    }

    const viewShared = (row) => {
      mySharedFile.value = row.children
      visibleMySharedFileTable.value = true
    }

    const change_shareList = (selectedData) => {
      // console.log("1111111111111")
      shareList.value = selectedData
    }

    watch(() => props.selectedData, (newValue) => change_shareList(newValue), { deep: true });

    return {
      shareSelectedTo,
      send,
      getShareFrom,
      sharedFile,
      visibleGetForm,
      visibleSetShare,
      visibleMySharedLinkTable,
      visibleMySharedFileTable,
      setShare,
      getForm,
      myShareTable,
      mySharedFile,
      viewShared
    }
  }
}
</script>