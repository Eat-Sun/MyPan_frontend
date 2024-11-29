<template>
  <el-header class="header">
    <h1 class="header-title">MyPan</h1>
    <el-menu mode="horizontal" background-color="#FFFFFF">
      <el-menu-item @click="uploadListVisible = true">上传列表</el-menu-item>
      <el-sub-menu index="1" trigger="hover">
        <template #title><el-avatar> user </el-avatar></template>
        <el-menu-item>
          <div style="display: flex; justify-content: space-between; width: 100%;">
            <span>剩余空间：</span>
            <span>{{ (freeSpace / 1048576).toFixed(1) + "MB" }}</span>
          </div>
        </el-menu-item>
      </el-sub-menu>
    </el-menu>
  </el-header>
  <el-drawer v-model="uploadListVisible" title="上传列表" direction="rtl" size="50%">
    <el-table :data="uploadList">
      <el-table-column property="name" label="文件名" width="150" />
      <el-table-column property="size" label="大小" />
      <el-table-column property="percentage" label="上传进度" />
    </el-table>
  </el-drawer>
</template>

<script>
import { ref } from 'vue'

export default {
  props: {
    list: {
      type: Array,
      required: false
    },
    free_space: {
      required: true
    }
  },
  setup(props) {
    const uploadList = ref(props.list)
    const freeSpace = ref(props.free_space)
    const currentFolder = ref()

    const uploadListVisible = ref(false)

    return {
      uploadList,
      freeSpace,
      currentFolder,
      uploadListVisible
    }
  }
}
</script>

<style>
.el-menu {
  width: 300px;
  justify-content: flex-end;
  flex-grow: 1;
}

.header {
  display: flex;
  align-items: center;
  /* 确保所有子元素在垂直方向上居中对齐 */
  justify-content: flex-end;
  background-color: #ffffff;
  line-height: 60px;
  /* Adjust this value according to the actual header height */
}

.el-header {
  flex: none;
}
</style>