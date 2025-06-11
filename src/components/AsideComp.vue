<template>
  <el-aside class="aside" style="width: 200px; overflow-x: hidden; padding-right: 0px">
    <el-col :span="12" style="width: 200px">
      <el-menu
        style="width: 200px"
        default-active="1-1"
        class="el-menu-vertical-demo"
        @select="selectedSubMenu"
      >
        <el-sub-menu index="1">
          <template #title>
            <el-icon>
              <Document />
            </el-icon>
            <span>我的文件</span>
          </template>
          <el-menu-item index="1-1">
            <el-icon> <Files /> </el-icon>全部文件
          </el-menu-item>
          <el-menu-item index="1-2">
            <el-icon> <Picture /> </el-icon>图片
          </el-menu-item>
          <el-menu-item index="1-3">
            <el-icon> <Document /> </el-icon>文档
          </el-menu-item>
          <el-menu-item index="1-4">
            <el-icon> <VideoCamera /> </el-icon>视频
          </el-menu-item>
          <el-menu-item index="1-5">
            <el-icon> <Headset /> </el-icon>音频
          </el-menu-item>
          <el-menu-item index="1-6">
            <el-icon> <More /> </el-icon>其它
          </el-menu-item>
        </el-sub-menu>
        <el-menu-item index="2">
          <el-icon>
            <Delete />
          </el-icon>
          <span>回收站</span>
        </el-menu-item>
      </el-menu>
    </el-col>
  </el-aside>
  <el-divider direction="vertical" style="height: 100%; padding-left: 0"></el-divider>
</template>

<script>
import { useDataStore } from '@/stores/data'
import { inject, ref, toRef, watch } from 'vue'

export default {
  props: {
    data: {
      type: JSON,
      required: true
    }
  },
  emits: ['viewControl'],
  setup(props, { emit }) {
    let data = toRef(props, 'data')
    let type = ref('')
    let dataStore = useDataStore()
    let classifyData = inject('classifyData')
    let recycledData = dataStore.getRecycledData()
    // recycledData.value = [
    //   [
    //     {
    //       "id": 1,
    //       "mix_id": 11,
    //       "type": "folder",
    //       "name": "Folder1_1",
    //       "numbering": "1_brni",
    //       "ancestry": "1_niqw",
    //       "is_top": true,
    //       "children": []
    //     },
    //     {
    //       "id": 2,
    //       "mix_id": 111,
    //       "type": "folder",
    //       "name": "Folder1_1_sub1",
    //       "numbering": "1_yptc",
    //       "ancestry": "1_brni",
    //       "is_top": false,
    //       "children": []
    //     },
    //     {
    //       "id": 3,
    //       "mix_id": 112,
    //       "type": "folder",
    //       "name": "Folder1_1_sub2",
    //       "numbering": "1_rwvh",
    //       "ancestry": "1_brni",
    //       "is_top": false,
    //       "children": []
    //     },
    //     {
    //       "id": 4,
    //       "mix_id": 13,
    //       "type": "folder",
    //       "name": "Recycled1_3",
    //       "numbering": "1_hgux",
    //       "ancestry": "1_niqw",
    //       "is_top": true,
    //       "children": []
    //     },
    //     {
    //       "id": 5,
    //       "mix_id": 131,
    //       "type": "folder",
    //       "name": "Recycled1_3_1",
    //       "numbering": "1_tmaq",
    //       "ancestry": "1_hgux",
    //       "is_top": false,
    //       "children": []
    //     }
    //   ],
    //   [
    //     {
    //       "id": 14,
    //       "mix_id": 11,
    //       "folder_id": 1,
    //       "type": "picture",
    //       "name": "att1_1",
    //       "b2_key": "wvWE20",
    //       "size": "186154",
    //       "is_top": true
    //     },
    //     {
    //       "id": 9,
    //       "mix_id": 112,
    //       "folder_id": 11,
    //       "type": "picture",
    //       "name": "att11_2",
    //       "b2_key": "jK78lM",
    //       "size": "307200",
    //       "is_top": false
    //     },
    //     {
    //       "id": 10,
    //       "mix_id": 1111,
    //       "folder_id": 111,
    //       "type": "undefined",
    //       "name": "att111_1",
    //       "b2_key": "vW34xY",
    //       "size": "256000",
    //       "is_top": false
    //     },
    //     {
    //       "id": 11,
    //       "mix_id": 1112,
    //       "folder_id": 111,
    //       "type": "word",
    //       "name": "att111_2",
    //       "b2_key": "zA56bC",
    //       "size": "768000",
    //       "is_top": false
    //     },
    //     {
    //       "id": 12,
    //       "mix_id": 1121,
    //       "folder_id": 112,
    //       "type": "undefined",
    //       "name": "att112_1",
    //       "b2_key": "Ag3Wg1",
    //       "size": "189641",
    //       "is_top": false
    //     },
    //     {
    //       "id": 13,
    //       "mix_id": 1122,
    //       "folder_id": 112,
    //       "type": "word",
    //       "name": "att112_2",
    //       "b2_key": "zB56dE",
    //       "size": "168198",
    //       "is_top": false
    //     }
    //   ]
    // ]

    // 处理选择的子菜单
    const selectedSubMenu = async (index) => {
      switch (index) {
        case '1-1': {
          emit('viewControl', 'living')
          break
        }
        case '1-2': {
          type.value = 'picture'
          // classifyData.value = pictures.value
          emit('viewControl', 'classify')

          break
        }
        case '1-3': {
          type.value = 'word'
          // classifyData.value = words.value
          emit('viewControl', 'classify')

          break
        }
        case '1-4': {
          type.value = 'video'
          // classifyData.value = videos.value
          emit('viewControl', 'classify')

          break
        }
        case '1-5': {
          type.value = 'audio'
          // classifyData.value = audios.value
          emit('viewControl', 'classify')

          break
        }
        case '1-6': {
          type.value = 'undefined'
          // classifyData.value = others.value
          emit('viewControl', 'classify')

          break
        }
        case '2': {
          emit('viewControl', 'recycled')
          break
        }
      }
    }

    // 分类
    const getData = (type) => {
      return data.value.attachments.filter((item) => item.type == type)
    }

    watch(
      [type, data],
      () => {
        classifyData.value = getData(type.value)
        console.log('监听触发')
      },
      { deep: true }
    )

    return {
      recycledData,
      selectedSubMenu
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

.aside {
  background-color: #ffffff;
  text-align: center;
  line-height: 300px;
  display: flex;
}
</style>
