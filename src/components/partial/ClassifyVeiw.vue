<template>
  <el-table :data="classifyData" @selection-change="selection" @select="setSelection" @select-all="setSelection">
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
          <el-icon style="margin-right: 15px">
            <Document />
          </el-icon>{{ scope.row.name }}
        </div>
        <div v-else-if="scope.row.type == 'video'">
          <el-icon style="margin-right: 15px">
            <VideoCamera />
          </el-icon>{{ scope.row.name }}
        </div>
        <div v-else-if="scope.row.type == 'audio'">
          <el-icon style="margin-right: 15px">
            <Headset />
          </el-icon>{{ scope.row.name }}
        </div>
        <div v-else>
          <el-icon style="margin-right: 15px">
            <More />
          </el-icon>{{ scope.row.name }}
        </div>
      </template>
    </el-table-column>
    <el-table-column prop="type" label="Type"></el-table-column>
    <el-table-column prop="size" label="Size"></el-table-column>
  </el-table>
</template>

<script setup>
import { inject, toRef } from 'vue';

const props = defineProps({
  selectedData: {
    type: Array,
    required: true
  }
})
const emit = defineEmits(['selected']);

let selection = toRef(props, 'selectedData')
let classifyData = inject('classifyData')

function setSelection(selected) {
  emit('selected', selected)
  // console.log('selection', selection)
}
</script>