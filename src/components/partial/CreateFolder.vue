<template>
  <el-button type="primary" plain @click="addFolder">
    <el-icon>
      <FolderAdd />
    </el-icon>
    新建文件夹
  </el-button>
</template>

<script setup>
import { inject } from 'vue';

const parent_folder = inject('parentFolder')
const originData = inject('originData')

// 添加文件夹
const addFolder = () => {
  let newFolder = {
    id: '',
    type: 'folder',
    name: '',
    numbering: '',
    ancestry: '',
    children: [],
    editing: true
  }
  parent_folder.value.children.push(newFolder)
  originData.folders.push(newFolder)
  // console.log("newFolder", newFolder)
  // console.log("parent_folder:", parent_folder.value)
}
</script>
