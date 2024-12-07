<template>
  <el-aside class="aside" style="width: 200px; overflow-x: hidden; padding-right: 0px;">
    <el-col :span="12" style="width: 200px">
      <el-menu style="width: 200px" default-active="1-1" class="el-menu-vertical-demo" @select="selectedSubMenu">
        <el-sub-menu index="1">
          <template #title>
            <el-icon>
              <Document />
            </el-icon>
            <span>我的文件</span>
          </template>
          <el-menu-item index="1-1">
            <el-icon>
              <Files />
            </el-icon>全部文件
          </el-menu-item>
          <el-menu-item index="1-2">
            <el-icon>
              <Picture />
            </el-icon>图片
          </el-menu-item>
          <el-menu-item index="1-3">
            <el-icon>
              <Document />
            </el-icon>文档
          </el-menu-item>
          <el-menu-item index="1-4">
            <el-icon>
              <VideoCamera />
            </el-icon>视频
          </el-menu-item>
          <el-menu-item index="1-5">
            <el-icon>
              <Headset />
            </el-icon>音频
          </el-menu-item>
          <el-menu-item index="1-6">
            <el-icon>
              <Headset />
            </el-icon>其它
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
  <el-divider direction="vertical" style="height: 100%;padding-left: 0;"></el-divider>
</template>

<script>
import apiClient from '@/axios'
import { ElMessage } from 'element-plus'
import { inject, reactive, toRef } from 'vue'

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
    let classifyData = inject('classifyData')
    let recycledData = inject('recycledData')

    let pictures = reactive([])
    let words = reactive([])
    let videos = reactive([])
    let audios = reactive([])
    let others = reactive([])
    // recycledData.value = reactive([
    //   {
    //     id: 1,
    //     mix_id: 111,
    //     type: 'folder',
    //     name: 'Folder1_1_sub1',
    //     b2_key: null
    //   },
    //   {
    //     id: 2,
    //     mix_id: 112,
    //     type: 'folder',
    //     name: 'Folder1_1_sub2',
    //     b2_key: null
    //   },
    //   {
    //     id: 3,
    //     mix_id: 1111,
    //     type: 'undefined',
    //     name: 'att111_1',
    //     b2_key: 'vW34xY'
    //   },
    //   {
    //     id: 4,
    //     mix_id: 1112,
    //     type: 'word',
    //     name: 'att111_2',
    //     b2_key: 'zA56bC'
    //   },
    //   {
    //     id: 5,
    //     mix_id: 1121,
    //     type: 'undefined',
    //     name: 'att112_1',
    //     b2_key: 'Ag3Wg1'
    //   },
    //   {
    //     id: 6,
    //     mix_id: 1122,
    //     type: 'word',
    //     name: 'att112_2',
    //     b2_key: 'zB56dE'
    //   }
    // ])

    // 处理选择的子菜单
    const selectedSubMenu = async (index) => {
      switch (index) {
        case '1-1': {
          emit('viewControl', 'living')
          break
        }
        case '1-2': {
          if (pictures.length == 0) {
            pictures = getData('picture')
          }
          classifyData.value = pictures
          emit('viewControl', 'classify')

          break
        }
        case '1-3': {
          if (words.length == 0) {
            words = getData('word')
          }
          classifyData.value = words
          emit('viewControl', 'classify')

          break
        }
        case '1-4': {
          if (videos.length == 0) {
            videos = getData('video')
          }
          classifyData.value = videos
          emit('viewControl', 'classify')

          break
        }
        case '1-5': {
          if (audios.length == 0) {
            audios = getData('audio')
          }
          classifyData.value = audios
          emit('viewControl', 'classify')

          break
        }
        case '1-6': {
          if (others.length == 0) {
            others = getData('undefined')
          }
          classifyData.value = others
          emit('viewControl', 'classify')

          break
        }
        case '2': {

          if (recycledData.value.length === 0) {
            // 异步获取回收数据
            await getRecycledData()
          }
          console.log('recycledData', recycledData.value)
          emit('viewControl', 'recycled')
          break
        }
      }

      console.log('classifyData', classifyData.value)
    }

    // 获取回收数据
    const getRecycledData = async () => {
      try {
        const response = await apiClient.get('/api/v1/recycle_bins/getter', {
          params: {
            token: localStorage.getItem('token')
          }
        })

        let code = response.data.code

        if (code === 1) {
          const processed = processData(response.data.data)
          // 更新响应式数据
          recycledData.value.splice(0, recycledData.value.length, ...processed) // 确保更新是响应式的
        } else {
          ElMessage({
            message: '获取回收文件列表失败',
            type: 'error',
            plain: true
          })
        }
      } catch (error) {
        ElMessage({
          message: '请求失败，请稍后重试',
          type: 'error',
          plain: true
        })
        console.error(error)
      }
    }

    // 处理回收数据排序
    const processData = (data) => {
      if (data.length < 2) {
        // console.log("Data is too short, returning as is");
        return data
      }
      return data.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    }

    // 分类
    const getData = (type) => {
      return data.value[1].filter(item => item.type == type)
    }

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
