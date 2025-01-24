import axios from 'axios'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // 指定端口号
  timeout: 10000 // 可选: 设置请求超时
})

function processData(data) {
  // console.log(data)
  let stack = []
  let folders = JSON.parse(JSON.stringify(data.folders))
  let attachments = JSON.parse(JSON.stringify(data.attachments))
  let root = folders.find((item) => item.ancestry == null)

  stack.push(root)

  while (stack.length > 0) {
    let folder = stack.pop()

    let subFolders = folders.filter((item) => item.ancestry == folder.numbering)
    let subAttachments = attachments.filter((item) => item.folder_id == folder.id)
    // console.log("subFolders", subFolders)
    if (subFolders && subFolders.length > 0) {
      folder.children.push(...subFolders)
      stack.push(...subFolders)
    }
    if (subAttachments && subAttachments.length > 0) {
      folder.children.push(...subAttachments)
    }
  }

  return root
}

let gettedRecycled = ref(false)
const getRecycledData = async () => {
  if (gettedRecycled.value) {
    return null
  } else {
    try {
      const response = await apiClient.get('/api/v1/recycle_bins/getter', {
        params: {
          token: localStorage.getItem('token')
        }
      })

      let code = response.data.code
      if (code == 1) {
        return response.data.data
      } else {
        ElMessage({
          message: '获取回收文件列表失败',
          type: 'error',
          plain: true
        })
      }
    } catch (error) {
      ElMessage({
        message: '请求失败，请稍后重试',
        type: 'error',
        plain: true
      })
      console.error(error)
    }

    gettedRecycled.value = true
  }
}

function processBinData(data) {
  console.log('1111111111111111', data)
  let stack = [] // 栈，用于深度优先遍历
  let result = [] // 最终结果
  let folders = data.folders // 文件夹数组
  let attachments = data.attachments // 附件数组

  // 构建文件夹索引表和附件索引表
  let folderMap = new Map()
  let attachmentMap = new Map()

  folders.forEach((folder) => {
    folderMap.set(folder.ancestry, (folderMap.get(folder.ancestry) || []).concat(folder))
  })

  attachments.forEach((attachment) => {
    if (!attachmentMap.has(attachment.folder_id)) {
      attachmentMap.set(attachment.folder_id, [])
    }
    attachmentMap.get(attachment.folder_id).push(attachment) // 附件按照 folder_id 分组
  })
  // console.log('Array.from(attachmentMap.values())', Array.from(attachmentMap.values()))
  // 筛选顶层文件夹并加入栈
  folders.forEach((folder) => {
    if (folder.is_top) {
      result.push(folder)
      stack.push(folder)
    }
  })

  // 遍历栈，构建嵌套结构
  while (stack.length > 0) {
    let folder = stack.pop()

    // 获取子文件夹
    let subFolders = folderMap.get(folder.numbering) || []
    subFolders.forEach((subFolder) => {
      folder.children.push(subFolder) // 添加子文件夹
      stack.push(subFolder) // 子文件夹入栈
    })

    // 获取附件
    let subAttachments = attachmentMap.get(folder.mix_id) || []
    folder.children.push(...subAttachments) // 添加附件
    attachmentMap.delete(folder.mix_id)
  }

  let top_attachments = Array.from(attachmentMap.values())
  top_attachments.forEach((item) => {
    result.push(...item)
  })

  return result
}

function processAddBinData(data, response) {
  console.log('data', data)
  console.log('response', response)
  // let stack = [...data]
  let result = []

  while (data.length > 0) {
    let item = data.pop()
    let target

    if (item.type == 'folder') {
      // result.folders.push(item)
      target = response.find((folder) => folder.mix_id == item.id && folder.type == 'folder')

      if (item.children.length > 0) {
        data.push(...item.children)
      }
    } else {
      // result.attachments.push(item)
      target = response.find((folder) => folder.mix_id == item.id && folder.type != 'folder')
    }

    if (typeof target != 'undefined') {
      item.id = target.id
      item.mix_id = target.mix_id
      item.is_top = target.is_top
    }
    if (item.is_top) {
      result.push(item)
    }
    // console.log('item', item)
  }
  console.log('result', result)
  return result
}

function processRestoreData(folders, attachments) {
  let stack = []
  let result = []
  let top_folders = folders.tops
  let sub_folders = folders.subs
  let top_attachments = attachments.tops
  let sub_attachments = attachments.subs
  let subFoldersMap = new Map()
  let subAttachmentsMap = new Map()

  sub_folders.forEach((item) => {
    subFoldersMap.set(item.ancestry, (subFoldersMap.get(item.ancestry) || []).concat(item))
  })
  sub_attachments.forEach((item) => {
    subAttachmentsMap.set(
      item.folder_id,
      (subAttachmentsMap.get(item.folder_id) || []).concat(item)
    )
  })
  // console.log('subFoldersMap', ...subFoldersMap)
  // console.log('subFoldersMap', ...subFoldersMap)
  stack.push(...top_folders)
  result.push(...top_folders)
  while (stack.length > 0) {
    let folder = stack.pop()
    let sub_folders = subFoldersMap.get(folder.numbering)
    let sub_attachments = subAttachmentsMap.get(folder.id)

    if (Array.isArray(sub_folders)) {
      folder.children.push(...sub_folders)
      stack.push(...sub_folders)
    }
    if (Array.isArray(sub_attachments)) {
      folder.children.push(...sub_attachments)
    }
  }
  result.push(...top_attachments)

  return result
}

export {
  apiClient,
  gettedRecycled,
  getRecycledData,
  processData,
  processBinData,
  processAddBinData,
  processRestoreData
}
