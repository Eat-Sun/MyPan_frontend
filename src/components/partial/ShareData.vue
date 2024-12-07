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
      <el-table-column type="selection" width="25" />
      <el-table-column prop="link" label="Link" sortable></el-table-column>
      <el-table-column prop="varify" label="Verify" sortable></el-table-column>
      <el-table-column align="right">
        <template #default="scope">
          <el-button size="small" type="primary" @click="viewShared(scope.row)">
            查看链接
          </el-button>
          <el-button size="small" type="danger" @click="concelShare(scope.row)">
            取消分享
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>

  <el-dialog title="链接详情" v-model="visibleMySharedFileTable" width="600px">
    <el-table :data="mySharedFile">
      <el-table-column prop="name" label="Name" sortable></el-table-column>
      <el-table-column prop="type" label="Type" sortable></el-table-column>
      <el-table-column prop="size" label="ByteSize" sortable></el-table-column>
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
    Data: {
      type: Object,
      required: true
    },
    selectedData: {
      type: Array,
      required: true
    },
    topSelectedData: {
      type: Array,
      required: true
    }
  },
  setup(props) {
    const root = ref(props.Data)
    // console.log("props.data", props.Data)

    const token = localStorage.getItem('token')

    const shareList = ref(props.selectedData)
    const top = ref(props.topSelectedData)
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

    // 创建共享
    const send = () => {
      // console.log("shareList:", shareList.value)
      // console.log("top:", top.value)
      apiClient.post('/api/v1/shares/new', {
        token: token,
        data: shareList.value,
        top: top.value,
        varify: setShare.varify
      })
        .then(response => {
          const code = response.data.code;

          if (code == 1) {
            let link = response.data.data.link
            let varify = response.data.data.varify

            visibleSetShare.value = false
            ElMessageBox.confirm(
              '链接：' + link + '\n提取码：' + varify,
              '分享成功',
              {
                confirmButtonText: 'OK',
                type: 'success',
              }
            )
          } else {
            const message = response.data.message

            ElMessage({
              message: '分享失败: ' + message,
              type: 'error',
              plain: true
            })
          }

        })
        .catch(error => {
          console.error('发生错误：', error)
        });
    }

    // 获取共享
    const getShareFrom = () => {
      apiClient.get('/api/v1/shares/getter', {
        params: {
          token: token,
          link: getForm.link,
          varify: getForm.varify
        }
      })
        .then(response => {
          const code = response.data.code;
          if (code == 1) {
            const newData = response.data.data
            processData(newData)
            // console.log("root.value", root.value)

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

    const processData = (data) => {
      let stack = []
      let folders = data[0]
      let attachments = data[1]

      stack.push(root.value)

      while (stack.length > 0) {
        let folder = stack.pop()

        let subFolders = folders.filter(item => item.ancestry == folder.numbering)
        let subAttachments = attachments.filter(item => item.folder_id == folder.id)
        folder.children.push(...subFolders)
        folder.children.push(...subAttachments)

        stack.push(...subFolders)
      }
    }

    const sharedFile = () => {
      apiClient.get('/api/v1/shares/shared', {
        params: {
          token: token
        }
      })
        .then(response => {
          const code = response.data.code;
          if (code == 1) {
            // console.log(response.data.data)
            visibleMySharedLinkTable.value = true
            myShareTable.value = response.data.data
          }
        })
    }

    // 取消分享
    const concelShare = (row) => {
      apiClient.post("/api/v1/shares/concel", {
        token: token,
        link: row.link
      }).then(response => {
        const code = response.data.code;
        const message = response.data.message

        if (code == 1) {
          // console.log("row", row)
          // console.log("myShareTable", myShareTable.value)
          let index = myShareTable.value.findIndex(item => item == row)
          myShareTable.value.splice(index, 1)

          ElMessage({
            message: message,
            type: 'success',
            plain: true,
          })
        } else if (code == -1) {
          ElMessage({
            message: message,
            type: 'error',
            plain: true,
          })
        } else {
          ElMessage({
            message: response.data.exception,
            type: 'error',
            plain: true,
          })
        }
      }).catch(error => {
        console.error('发生错误：', error)
      });
    }

    const viewShared = (row) => {
      mySharedFile.value = row.attachments
      visibleMySharedFileTable.value = true
    }

    const change_shareList = (selectedData) => {
      // console.log("1111111111111")

      shareList.value = selectedData
    }

    watch(() => props.selectedData, (newValue) => change_shareList(newValue), { deep: true })
    watch(() => props.topSelectedData, () => { top.value = props.topSelectedData }, { deep: true });

    return {
      shareSelectedTo,
      send,
      getShareFrom,
      sharedFile,
      concelShare,
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