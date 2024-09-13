<template>
  <el-button type="primary" round style="margin-right: 2px" @click="dialogFormVisible = true">
    <el-icon>
      <Upload />
    </el-icon>
    上传文件
  </el-button>
  <el-button type="primary" round style="margin-right: 60px" @click="downloadFile">
    <el-icon>
      <Download />
    </el-icon>
    下载文件
  </el-button>

  <el-dialog v-model="dialogFormVisible" title="上传文件" width="500">
    <el-form :model="form">
      <el-form-item :label-width="80" style="align-items: center">
        <template #label>
          <span>文件类型</span>
        </template>
        <template #default>
          <el-radio-group v-model="form.file_type" class="ml-4">
            <el-radio value="picture" size="large">图片</el-radio>
            <el-radio value="word" size="large">文档</el-radio>
            <el-radio value="video" size="large">视频</el-radio>
            <el-radio value="audio" size="large">音频</el-radio>
            <el-radio value="undefined" size="large">其它</el-radio>
          </el-radio-group>
        </template>
      </el-form-item>

      <el-form-item style="display: flex; align-items: center">
        <el-upload :file-list="fileList" :auto-upload="false" :http-request="submitUpload" :on-change="addTo_fileList"
          :on-remove="removeFrom_fileList" style="margin-top: 12px">
          <el-button type="primary">选择文件</el-button>

        </el-upload>
        <div style="flex: 1"></div>
        <el-button type="success" @click="submitUpload">上传</el-button>

      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script>
import { reactive, ref, onMounted, watch } from 'vue'
import { debounce } from 'lodash'
import { ElMessage } from 'element-plus';
import axios from 'axios';

export default {
  name: 'FolderData',
  emits: ['update-file-list'],
  props: {
    data: {
      type: Object,
      required: true
    },
    currentPath: {
      type: Array,
      required: true
    },
    selectedData: {
      type: Array,
      required: true
    },
    consumer: {
      required: true
    }
  },
  setup(props, { emit }) {
    const root = ref(props.data)
    const currentPath = ref(props.currentPath)
    const selectedData = ref(props.selectedData)
    const consumer = props.consumer
    let channel = null
    const dialogFormVisible = ref(false)
    const form = reactive({
      file_type: ''
    })

    const token = localStorage.getItem('token')
    const fileList = ref([]);
    //上传的附带参数
    const uploadParams = reactive({
      token: token,
      parent_folder_id: currentPath.value[currentPath.value.length - 1].id,
      file_type: form.file_type
    })
    const uploadData = ref({})    //后端返回的上传数据
    const uploadList = reactive([])    //进度列表

    // console.log("currentPath:", currentPath.value)
    // console.log("root:", root.value)

    const subscribeToChannel = () => {
      let channel = consumer.subscriptions.create(
        {
          channel: 'FileUploadChannel',
          // 添加您要传递的参数
          token: token
        },
        {
          received(response) {
            switch (response.type) {
              case 'processing':
                uploadData.value = response.data
                updateFileList(uploadData.value)
                break
              case 'finish':
                uploadData.value = response.data
                updateRootData(root.value, currentPath.value, uploadData.value)
                break
            }

          },
          connected() {
            console.log('WebSocket 连接成功')
          },
          disconnected() {
            console.log('WebSocket 断开连接')
          }
        }
      )

      return channel
    }

    onMounted(() => {
      channel = subscribeToChannel()
    })

    const addTo_fileList = (uploadFile) => {
      fileList.value.push(uploadFile)
    }

    const removeFrom_fileList = (removedFile) => {
      const index = fileList.value.indexOf(removedFile)
      if (index != -1) {
        fileList.value.splice(index, 1)
      }
    }

    // 文件分片
    const createChunks = async (fileList) => {
      let chunks = reactive([]); // 记录每一个文件的分片
      const chunkSize = 1024 * 1024 * 5; // 5MB
      // const chunkSize = 1024; // 1KB

      const processFile = (file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();

          reader.onload = (event) => {
            const base64_file = event.target.result.split(',')[1]; // 获取文件base64编码
            // console.log("event", event)
            const totalChunks = Math.ceil(base64_file.length / chunkSize);
            let tmpChunks = [];

            for (let i = 0; i < totalChunks; i++) {
              let chunk = null
              if ((i + 1) * chunkSize > base64_file.length) {
                chunk = base64_file.slice(i * chunkSize, base64_file.length);
              } else {
                chunk = base64_file.slice(i * chunkSize, (i + 1) * chunkSize);
              }

              if (chunk == null) break;
              let data = {
                uid: file.uid,
                name: file.name,
                totalChunks: totalChunks,
                totalSize: event.total,
                chunkIndex: i + 1,
                chunk: chunk
              };

              tmpChunks.push(data);
            }

            resolve(tmpChunks);
          };

          reader.readAsDataURL(file.raw); // 读取文件
        });
      };

      for (const file of fileList) {
        const fileChunks = await processFile(file); // 等待当前文件读取完成
        chunks.push(fileChunks);
      }

      return chunks;
    };


    // 实际执行上传
    const submitUpload = async () => {
      // console.log("fileList:", fileList.value)
      let chunks = await createChunks(fileList.value)
      // console.log("chunks:", chunks)
      while (chunks.length > 0) {
        chunks.forEach(file_chunks => {
          // console.log("file_chunks", file_chunks[0])
          const chunk = file_chunks.shift()
          channel.perform('receive', chunk)

          if (file_chunks.length == 0) {
            channel.perform('merge_chunks', { "last_chunk": chunk, "uploadParams": uploadParams })
          }
        })

        chunks = chunks.filter(file_chunks => file_chunks.length > 0) //清空已上传完毕的文件
      }

      dialogFormVisible.value = false
    }

    // 更新视图
    const updateRootData = (folders, currentPath, uploadedFile) => {
      console.log("currentPath:", currentPath)
      console.log("props.currentPath:", props.currentPath)
      console.log("folders:", folders)
      if (currentPath.length > 0) {
        folders.forEach(item => {
          console.log("item:", item)
          if (item.type == 'folder' && item.id == currentPath[0]?.id) {
            console.log("getFolder:", item)
            updateRootData(item.children, currentPath.slice(1), uploadedFile)
          }
        });
      } else {
        console.log("arrive:", folders)
        folders.push(uploadedFile)
      }

    }

    // 实时更新上传进度
    const updateFileList = debounce((file) => {
      const existingItem = uploadList.find((item) => item.name === file.name)

      if (existingItem) {
        if (file.percentage === '100%') {
          const index = uploadList.indexOf(existingItem)
          if (index > -1) {
            uploadList.splice(index, 1)
          }
        } else {
          existingItem.percentage = file.percentage
        }
      } else {
        uploadList.push(file)
      }

      emit('update-file-list', uploadList)
    }, 1000)

    // 下载文件
    const downloadFile = () => {
      axios.get('http://localhost:3000/api/v1/attachments/downloader', {
        params: {
          b2_keys: get_b2_keys()
        }
      }).then(response => {
        const code = response.data.code

        if (code == 1) {
          let presigned_urls = response.data.data
          presigned_urls.forEach(presigned_url => {
            window.open(presigned_url, '_blank');
          })

          ElMessage({
            message: '创建下载成功',
            type: 'success',
            plain: true,
          })
        } else if (code == -1) {
          ElMessage({
            message: '创建下载失败',
            type: 'error',
            plain: true,
          })
        }
      }).catch((error) => {
        ElMessage({
          message: '错误:' + error.response.data.error,
          type: 'error',
          plain: true,
        })
      })
    }

    // 获取选中的文件的b2_key
    const get_b2_keys = () => {
      // console.log("selectedData:",selectedData)
      let keys = []
      selectedData.value.forEach(item => {
        // console.log("item:",item)
        keys.push(item.b2_key)
      })

      return keys
    }

    // 第一个参数一定要使用 ()=>
    watch(() => props.currentPath, () => {
      currentPath.value = props.currentPath
      // console.log("upload:", props.currentPath)
    }, { deep: true })

    return {
      dialogFormVisible,
      form,
      fileList,
      addTo_fileList,
      removeFrom_fileList,
      submitUpload,
      downloadFile
    }
  }
}
</script>
