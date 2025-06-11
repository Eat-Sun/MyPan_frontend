<template>
  <el-empty v-if="classifyData.length == 0" description="暂无文件" />
  <el-table
    v-else
    ref="tableRef"
    :data="classifyData"
    @selection-change="setSelection"
    @select-all="setSelection"
  >
    <el-table-column type="selection" width="55" />
    <el-table-column prop="name" label="Name">
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
    <el-table-column prop="type" label="Type"></el-table-column>
    <el-table-column prop="byte_size" label="Size">
      <template v-slot="scope">
        <div v-if="scope.row.type != 'folder'">
          <div v-if="scope.row.byte_size < 1024">{{ scope.row.byte_size + 'Byte' }}</div>
          <div v-else-if="scope.row.byte_size > 1024 && scope.row.byte_size < 1048576">
            {{ (scope.row.byte_size / 1024.0).toFixed(2) + 'KB' }}
          </div>
          <div v-else-if="scope.row.byte_size > 1048576 && scope.row.byte_size < 1073741824">
            {{ (scope.row.byte_size / 1048576.0).toFixed(2) + 'MB' }}
          </div>
          <div v-else>{{ (scope.row.byte_size / 1073741824.0).toFixed(2) + 'GB' }}</div>
        </div>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup>
import { inject, ref } from 'vue'

const emit = defineEmits(['selected', 'topSelection'])
const tableRef = ref()

let classifyData = inject('classifyData')

function setSelection() {
  emit('selected', tableRef.value.getSelectionRows())
  emit('topSelection', tableRef.value.getSelectionRows())
  // console.log('selection', tableRef.value.getSelectionRows())
}
</script>
