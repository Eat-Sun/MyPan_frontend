<template>
  <el-divider />
  <el-empty v-if="currentData.length == 0" description="暂无文件" />
  <el-table
    v-else
    :data="currentData"
    @sortable="true"
    sort-method="updated_at"
    @cell-mouse-enter="addOperation"
    @select="setSelection"
    @select-all="setSelection"
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
        <el-button v-show="hoveredRow === row" type="danger" size="small" @click="deleteData(row)">
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
      </template>
    </el-table-column>
    <el-table-column align="right">
      <template #header>
        <el-button v-show="selection.length > 0" type="danger" @click="deleteData(selection)"
          >彻底删除</el-button
        >
        <el-button v-show="selection.length > 0" type="primary" @click="restoreData(selection)"
          >恢复</el-button
        >
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup>
import apiClient from '@/axios'
import { inject, ref } from 'vue'
import { ElMessage } from 'element-plus'

let currentData = inject('recycledData')
let livingData = inject('livingData')
let selection = ref([])
let hoveredRow = ref(null)

function addOperation(row) {
  // console.log('悬停在了', row)
  hoveredRow.value = row
}

function setSelection(selected) {
  console.log('selected', selected)
  selection.value = selected
}

function arrangeData(data) {
  let folders = []
  let attachments = []
  let folder_ids = []
  let attachment_ids = []
  let bin_ids = []
  let root = livingData
  console.log('data', data)

  if (Array.isArray(data)) {
    currentData.value = currentData.value.filter((item) => !data.includes(item)) //从回收站中删除
    data.forEach((item) => {
      let newItem

      if (item.type == 'folder') {
        newItem = {
          id: item.mix_id,
          type: 'folder',
          name: item.name,
          numbering: item.nmbering,
          ancestry: root.value.numbering
        }
        folders.push(newItem)
        folder_ids.push(item.mix_id)
      } else {
        newItem = {
          id: item.mix_id,
          folder_id: root.id,
          type: item.type,
          name: item.name,
          b2_key: item.b2_key,
          size: item.size
        }
        attachments.push(newItem)
        attachment_ids.push(item.mix_id)
      }

      bin_ids.push(item.id)
    })
  } else {
    let index = currentData.value.indexOf(data)
    currentData.value.splice(index, 1) //从回收站中删除

    if (data.type == 'folder') {
      folders.push(data)
      folder_ids.push(data.mix_id)
      bin_ids.push(data.id)
    } else {
      attachments.push(data)
      attachment_ids.push(data.mix_id)
      bin_ids.push(data.id)
    }
  }

  return [folders, folder_ids, attachments, attachment_ids, bin_ids]
}

function deleteData(data) {
  let result = arrangeData(data)
  // console.log('result', result)
  apiClient
    .post('/api/v1/recycle_bins/deleter', {
      folder_ids: result[1],
      attachment_ids: result[3],
      bin_ids: result[4]
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

function restoreData(data) {
  let result = arrangeData(data)

  apiClient
    .post('api/v1/recycle_bins/restore', {
      folder_ids: result[1],
      attachment_ids: result[3],
      bin_ids: result[4]
    })
    .then((response) => {
      let code = response.data.code

      if (code == 1) {
        livingData.value.children.push(...result[0], ...result[2])

        ElMessage({
          message: '已恢复',
          type: 'success',
          plain: true
        })
      } else {
      }
    })
}
</script>
