<template>
  <el-header class="header">
    <h1 class="header-title">MyPan</h1>
    <el-menu
      mode="horizontal"
      background-color="#FFFFFF"
      style="display: flex; align-items: center"
    >
      <el-button type="primary" plain @click="uploadListVisible = true">上传列表</el-button>
      <el-sub-menu index="1" trigger="hover">
        <template #title><el-avatar> user </el-avatar></template>
        <el-menu-item>
          <div style="display: flex; justify-content: space-between; width: 100%">
            <span>剩余空间：</span>
            <span>{{ (props.free_space / 1048576).toFixed(1) + 'MB' }}</span>
          </div>
        </el-menu-item>
      </el-sub-menu>
    </el-menu>
  </el-header>
  <el-drawer v-model="uploadListVisible" title="上传列表" direction="rtl" size="50%">
    <el-table :data="uploadList">
      <el-table-column property="name" label="文件名" width="150" />
      <el-table-column property="byte_size" label="大小">
        <template v-slot="scope">
          <div v-if="scope.row.type != 'folder'">
            <div v-if="scope.row.byte_size < 1024">{{ scope.row.byte_size + 'Byte' }}</div>
            <div v-else-if="scope.row.byte_size > 1024 && scope.row.byte_size < 1048576">
              {{ (scope.row.byte_size / 1024).toFixed(2) + 'KB' }}
            </div>
            <div v-else-if="scope.row.byte_size > 1048576 && scope.row.byte_size < 1073741824">
              {{ (scope.row.byte_size / 1048576.0).toFixed(2) + 'MB' }}
            </div>
            <div v-else>{{ (scope.row.byte_size / 1073741824.0).toFixed(2) + 'GB' }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column property="percentage" label="上传进度">
        <template #default="scope">
          <el-progress :text-inside="true" :stroke-width="26" :percentage="scope.row.percentage" />
        </template>
      </el-table-column>
    </el-table>
  </el-drawer>
</template>

<script setup>
import { ref, toRef } from 'vue'

const props = defineProps({
  list: {
    type: Array,
    required: false
  },
  free_space: {
    required: true
  }
})
const uploadList = toRef(props, 'list')
const uploadListVisible = ref(false)
</script>

<style>
.el-menu {
  width: 300px;
  justify-content: flex-end;
  flex-grow: 1;
}

.header {
  display: flex;
  justify-content: space-between;
  /* 标题和右侧内容两边对齐 */
  align-items: center;
  /* 垂直居中 */
  padding: 0 20px;
  background-color: #ffffff;
  /* 可选，设置背景颜色 */
}

.header-title {
  margin: 0;
  font-size: 20px;
  font-weight: bold;
}

.el-header {
  flex: none;
}
</style>
