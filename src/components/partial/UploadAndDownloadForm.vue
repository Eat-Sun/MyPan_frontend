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
        <el-upload
          v-model:file-list="fileList"
          :auto-upload="false"
          :http-request="submitUpload"
          :on-change="addTo_fileList"
          :on-remove="removeFrom_fileList"
          style="margin-top: 12px"
        >
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
import { ElMessage } from 'element-plus'
import apiClient from '@/axios'

export default {
  name: 'UploadAndDownloadForm',
  props: {
    uploadList: {
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
    },
    consumer: {
      required: true
    },
    free_space: {
      required: true
    }
  },
  setup(props) {
    const parent_folder = ref(props.parent_folder)
    const selectedData = ref(props.selectedData)
    const uploadList = ref(props.uploadList) //进度列表
    const consumer = props.consumer
    const freeSpace = ref(props.free_space)
    console.log('parent_folder', parent_folder.value)
    let channel = null
    const dialogFormVisible = ref(false)
    const form = reactive({
      file_type: ''
    })
    const token = localStorage.getItem('token')
    const fileList = ref([])

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
                updateFileList(response.data)
                break
              case 'finish':
                updateView(response.data)
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
      // console.log("uploadFile", uploadFile)
      let temp = freeSpace.value - uploadFile.size

      if (temp > 0) {
        fileList.value.push(uploadFile)
        freeSpace.value = temp
        // console.log("freeSpace", freeSpace.value)
      } else {
        ElMessage({
          message: '剩余空间不足',
          type: 'error',
          plain: true
        })

        const index = fileList.value.indexOf(uploadFile)
        fileList.value.splice(index, 1)
      }
    }

    const removeFrom_fileList = (removedFile) => {
      const index = fileList.value.indexOf(removedFile)
      if (index != -1) {
        fileList.value.splice(index, 1)
        freeSpace.value += removedFile.size
        // console.log("freeSpace", freeSpace.value)
      }
    }

    // 文件分片
    const createChunks = async (fileList) => {
      let chunks = reactive([]) // 记录每一个文件的分片
      const chunkSize = 1024 * 1024 * 5 // 5MB
      // const chunkSize = 1024; // 1KB

      const processFile = (file) => {
        return new Promise((resolve) => {
          const reader = new FileReader()

          reader.onload = (event) => {
            const base64_file = event.target.result.split(',')[1] // 获取文件base64编码
            // console.log("event", event)
            const totalChunks = Math.ceil(base64_file.length / chunkSize)
            let tmpChunks = []

            for (let i = 0; i < totalChunks; i++) {
              let chunk = null
              if ((i + 1) * chunkSize > base64_file.length) {
                chunk = base64_file.slice(i * chunkSize, base64_file.length)
              } else {
                chunk = base64_file.slice(i * chunkSize, (i + 1) * chunkSize)
              }

              if (chunk == null) break
              let data = {
                uid: file.uid,
                name: file.name,
                totalChunks: totalChunks,
                totalSize: event.total,
                chunkIndex: i + 1,
                chunk: chunk
              }

              tmpChunks.push(data)
            }

            resolve(tmpChunks)
          }

          reader.readAsDataURL(file.raw) // 读取文件
        })
      }

      for (const file of fileList) {
        const fileChunks = await processFile(file) // 等待当前文件读取完成
        chunks.push(fileChunks)
      }

      return chunks
    }

    // 实际执行上传
    const submitUpload = async () => {
      // console.log("fileList:", fileList.value)

      let uploadParams = reactive({
        token: token,
        parent_folder_id: parent_folder.value.id,
        file_type: form.file_type
      })
      console.log('uploadParams', uploadParams)
      let chunks = await createChunks(fileList.value)
      // console.log("chunks:", chunks)
      while (chunks.length > 0) {
        chunks.forEach((file_chunks) => {
          // console.log("file_chunks", file_chunks[0])
          const chunk = file_chunks.shift()
          channel.perform('receive', chunk)

          if (file_chunks.length == 0) {
            channel.perform('merge_chunks', { last_chunk: chunk, uploadParams: uploadParams })
          }
        })

        chunks = chunks.filter((file_chunks) => file_chunks.length > 0) //清空已上传完毕的文件
      }

      dialogFormVisible.value = false
    }

    // 实时更新上传进度
    const updateFileList = debounce((file) => {
      // console.log("uploadList", uploadList.value)
      let ifExisted = uploadList.value.find((item) => item.b2_key === file.b2_key)

      if (ifExisted) {
        let index = uploadList.value.indexOf(ifExisted)

        if (index > -1) {
          if (file.percentage === '100.0%') {
            uploadList.value.splice(index, 1)
          } else {
            uploadList.value[index].percentage = file.percentage
          }
        }
      } else {
        uploadList.value.push(file)
      }
    }, 1000)

    //更新视图
    const updateView = (file) => {
      if (parent_folder.value.data.includes(file)) {
        return
      } else {
        parent_folder.value.data.push(file)
      }
    }

    // 下载文件
    const downloadFile = () => {
      apiClient
        .get('/api/v1/attachments/downloader', {
          params: {
            b2_keys: get_b2_keys()
          }
        })
        .then((response) => {
          const code = response.data.code

          if (code == 1) {
            let presigned_urls = response.data.data
            presigned_urls.forEach((presigned_url) => {
              window.open(presigned_url, '_blank')
            })

            ElMessage({
              message: '创建下载成功',
              type: 'success',
              plain: true
            })
          } else if (code == -1) {
            ElMessage({
              message: '创建下载失败',
              type: 'error',
              plain: true
            })
          }
        })
        .catch((error) => {
          ElMessage({
            message: '错误:' + error.response.data.error,
            type: 'error',
            plain: true
          })
        })
    }

    // 获取选中的文件的b2_key
    const get_b2_keys = () => {
      // console.log('selectedData:', selectedData)
      let key_and_names = []
      selectedData.value.forEach((item) => {
        // console.log("item:",item)
        key_and_names.push({ key: item.b2_key, name: item.name })
      })

      return keys
    }

    // 第一个参数一定要使用 ()=>
    watch(
      () => props.parent_folder,
      () => (parent_folder.value = props.parent_folder),
      { deep: true }
    )

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
