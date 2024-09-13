<template>

  <el-button type="primary" plain @click="updata_dataInFolderData">
    <el-icon>
      <FolderAdd />
    </el-icon>
    新建文件夹
  </el-button>

</template>

<script>

import { toRefs, ref, reactive, onMounted } from 'vue';
export default {
  emits: ['updata_dataInFolderData'],
  props:{
    data:{
      type: Object,
      required: true
    },
    parent_folder: {
      type: Object,
      required: true
    }
  },
  setup(props, { emit }) {
    // console.log("开始加载CreateFolder")
    onMounted(() => {
      // console.log("CreateFolder加载完成")
    })
    const data = ref(props.data)
    const { parent_folder } = toRefs(props);
    const newFolder = reactive({
      id: '',
      type: 'folder',
      name: '',
      editing: true,
      children: []
    })
    
    // 添加文件夹
    const addFolder = (target) => {
      // console.log("target:",target)
      // console.log("props.parent_folder:",props.parent_folder)
      // console.log("parent_folder:",parent_folder.value.id)
      
      // console.log(folderMenu.value[0])
      for (let i = 0; i < target.length; i++) {
        const item = target[i];
        // console.log("item:",item)
        if (item.id == parent_folder.value.id) {
          item.children.push(newFolder);
          // console.log("添加成功");
          break;  // 找到目标并添加成功后，退出循环
        } else {
          if (item.children.length > 0) {
            addFolder(item.children);
          }
        }
      }
    }

    const updata_dataInFolderData = () => {
      // console.log("data:", data.value)
      addFolder(data.value)
      // createFolder(folder)
      // console.log("folderMenu:", data.value)
      emit('updata_dataInFolderData', data.value)
    }

    // provide('update_FolderMenu', update_FolderMenu);

    return {
      updata_dataInFolderData
    }
  }
}
</script>
