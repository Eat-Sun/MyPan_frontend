<template>
  <el-aside width="200px" class="aside">
    <el-col :span="12">
      <el-menu
        default-active="1-1"
        class="el-menu-vertical-demo"
        @select="selectedSubMenu"
        style="border-right: 10px solid #000"
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
</template>

<script>
import apiClient from '@/axios'
import { ElMessage } from 'element-plus'
import { reactive, onBeforeMount } from 'vue'

export default {
  emits: ['viewControl'],
  setup(props, { emit }) {
    let recycledData = reactive([]) // 响应式数据
    // let recycledData = reactive([
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
          emit('viewControl', { type: 'living', data: null })
          break
        }
        case '1-2':
        case '1-3':
        case '1-4':
        case '1-5': {
          console.log('rw:', index)
          break
        }
        case '2': {
          if (recycledData.length === 0) {
            // 异步获取回收数据
            await getRecycledData()
          }
          console.log('recycledData', recycledData)
          emit('viewControl', { type: 'recycled', data: recycledData })
          break
        }
      }
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
          recycledData.splice(0, recycledData.length, ...processed) // 确保更新是响应式的
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
