<template>
  <el-button type="primary" plain @click="addFolder">
    <el-icon>
      <FolderAdd />
    </el-icon>
    新建文件夹
  </el-button>
</template>

<script>
import { ref, watch } from 'vue';
export default {
  props: {
    parent_folder: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const parent_folder = ref(props.parent_folder);

    // 添加文件夹
    const addFolder = () => {
      parent_folder.value.data.push({
        id: '',
        type: 'folder',
        name: '',
        numbering: '',
        ancestry: '',
        children: [],
        editing: true
      })
      // console.log("newFolder", newFolder)
      // console.log("parent_folder:", parent_folder.value)
    }

    watch(() => props.parent_folder, () => { parent_folder.value = props.parent_folder })

    return {
      addFolder
    }
  }
}
</script>
