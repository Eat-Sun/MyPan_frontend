<template>
  <el-divider />
  <el-breadcrumb separator="/" style="height: 10px">
    <el-breadcrumb-item v-for="(item, index) in binBreadcrumb" :key="index">
      <a @click="navigateTo(index)" class="breadcrumb-text no-click">{{ item.name }}</a>
    </el-breadcrumb-item>
  </el-breadcrumb>
  <el-empty v-if="currentData.length == 0" description="暂无文件" />
  <el-table
    v-else
    :data="currentData"
    @sortable="true"
    sort-method="updated_at"
    @cell-mouse-enter="addOperation"
    @cell-mouse-leave="removeOperation"
    @row-click="handleRowClick"
    ref="tableRef"
  >
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
          <el-icon style="margin-right: 15px"> <Document /> </el-icon>{{ scope.row.name }}
        </div>
        <div v-else-if="scope.row.type == 'video'">
          <el-icon style="margin-right: 15px"> <VideoCamera /> </el-icon>{{ scope.row.name }}
        </div>
        <div v-else-if="scope.row.type == 'audio'">
          <el-icon style="margin-right: 15px"> <Headset /> </el-icon>{{ scope.row.name }}
        </div>
        <div v-else>
          <el-icon style="margin-right: 15px"> <More /> </el-icon>{{ scope.row.name }}
        </div>
      </template>
    </el-table-column>
    <el-table-column prop="type" label="type"></el-table-column>
    <el-table-column>
      <template #default="{ row }">
        <div @click.stop>
          <el-button
            v-show="hoveredRow === row"
            type="danger"
            size="small"
            @click="deleteData(row)"
          >
            彻底删除
          </el-button>
          <el-button
            v-show="hoveredRow === row"
            type="primary"
            size="small"
            @click="restoreData(row)"
          >
            恢复
          </el-button>
        </div>
      </template>
    </el-table-column>
    <el-table-column align="right">
      <template #header>
        <div @click.stop>
          <el-button v-show="selection.length > 0" type="danger" @click="deleteData(selection)"
            >彻底删除</el-button
          >
          <el-button v-show="selection.length > 0" type="primary" @click="restoreData(selection)"
            >恢复</el-button
          >
        </div>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup>
import { apiClient, processRestoreData } from '@/utils'
import { computed, inject, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

const freeSpace = inject('freeSpace')

let originData = inject('originData')
let root = inject('breadcrumb')[0]
const tableRef = ref(null)
let hoveredRow = ref(null)

let binBreadcrumb = inject('binBreadcrumb')
let binParentFolder = inject('binParentFolder')
let currentData = computed(() => binParentFolder.value.children || [])

let selection = computed(() => tableRef.value?.getSelectionRows() || [])
let topSelection = computed(() =>
  currentData.value.filter((item) => selection.value.includes(item))
)

function handleRowClick(row) {
  if (row.type === 'folder' && row.name != 'root') {
    binBreadcrumb.push(row)
  }
  // console.log("currentFolder", currentFolder.value)
  // console.log("currentData", currentData.value)
}

function navigateTo(index) {
  binBreadcrumb.splice(0, binBreadcrumb.length, ...binBreadcrumb.slice(0, index + 1))
}

function addOperation(row) {
  // console.log('悬停在了', row)
  hoveredRow.value = row
}

function removeOperation() {
  hoveredRow.value = null
}

function init(data, action) {
  let bin_ids = []
  let folders = {
    ids: [],
    tops: [],
    subs: []
  }
  let attachments = {
    ids: [],
    tops: [],
    subs: []
  }
  // console.log("data", data)
  arrangeData(data, folders, attachments, bin_ids, root, action)

  return [folders, attachments, bin_ids]
}

function arrangeData(data, folders, attachments, bin_ids, root, action) {
  data.forEach((item) => {
    if (item.type == 'folder') {
      let folder = {
        id: item.mix_id,
        type: 'folder',
        name: item.name,
        numbering: item.numbering,
        children: []
      }
      if (topSelection.value.includes(item)) {
        folder.ancestry = root.numbering
        folders.tops.push(folder)
      } else {
        folder.ancestry = item.ancestry
        folders.subs.push(folder)
      }

      folders.ids.push(item.mix_id)
    } else {
      let byte_size = Number(item.byte_size)

      let attachment = {
        id: item.mix_id,
        type: item.type,
        name: item.name,
        b2_key: item.b2_key,
        byte_size: byte_size
      }
      if (topSelection.value.includes(item)) {
        attachment.folder_id = root.id
        attachments.tops.push(attachment)
      } else {
        attachment.folder_id = item.folder_id
        attachments.subs.push(attachment)
      }

      if (action === 'delete') {
        freeSpace.value = freeSpace.value + byte_size
      }
      attachments.ids.push(item.mix_id)
    }
    bin_ids.push(item.id)
  })

  binParentFolder.value.children = binParentFolder.value.children.filter(
    (item) => !data.includes(item)
  )
}
//彻底删除
function deleteData(data) {
  if (!Array.isArray(data)) {
    selection.value.forEach((item) => {
      tableRef.value.toggleRowSelection(item, false)
    })
    tableRef.value.toggleRowSelection(data, true)
  }

  let result = init(selection.value, 'delete')
  let free_space = freeSpace.value
  apiClient
    .post('/api/v1/recycle_bins/deleter', {
      token: localStorage.getItem('token'),
      free_space: free_space,
      folder_ids: result[0].ids,
      attachment_ids: result[1].ids,
      bin_ids: result[2]
    })
    .then((response) => {
      let code = response.data.code

      if (code == 1) {
        ElMessage({
          message: '删除成功',
          type: 'success',
          plain: true
        })
      }
    })
}
//恢复
function restoreData(data) {
  if (!Array.isArray(data)) {
    selection.value.forEach((item) => {
      tableRef.value.toggleRowSelection(item, false)
    })
    tableRef.value.toggleRowSelection(data, true)
  }

  let result = init(selection.value, 'restore')
  let folders = {
    ids: result[0].ids,
    top_ids: result[0].tops.map((item) => item.id),
    ancestry: root.numbering
  }
  let attachments = {
    ids: result[1].ids,
    top_ids: result[1].tops.map((item) => item.id),
    parent_id: root.id
  }
  // console.log("folders", folders)
  // console.log("attachments", attachments)
  apiClient
    .post('api/v1/recycle_bins/restore', {
      token: localStorage.getItem('token'),
      folders: folders,
      attachments: attachments,
      bin_ids: result[2]
    })
    .then((response) => {
      let code = response.data.code

      if (code == 1) {
        let needToAdd = processRestoreData(result[0], result[1])
        root.children.push(...needToAdd)
        needToAdd.forEach((item) => {
          if (item.type == 'folder') {
            originData.folders.push(item)
          } else {
            originData.attachments.push(item)
          }
        })
        ElMessage({
          message: '已恢复',
          type: 'success',
          plain: true
        })
      }
    })
}

watch(binBreadcrumb, () => {
  binParentFolder.value = binBreadcrumb[binBreadcrumb.length - 1]
})
</script>
