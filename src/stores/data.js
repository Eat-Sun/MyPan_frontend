import { apiClient, processBinData } from '@/utils'
import { ElMessage } from 'element-plus'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDataStore = defineStore('data', () => {
  const gettedRecycled = ref(false)
  let recycledData = null

  async function getRecycledData() {
    if (gettedRecycled.value) {
      return recycledData
    } else {
      try {
        let response = await apiClient.get('/api/v1/recycle_bins/getter', {
          params: {
            token: localStorage.getItem('token')
          }
        })

        let code = response.data.code
        if (code == 1) {
          let data = response.data.data
          recycledData = processBinData(data)
          console.log('recycledData', recycledData)

          gettedRecycled.value = true
          return recycledData
        } else {
          ElMessage({
            message: '获取回收文件列表失败',
            type: 'error',
            plain: true
          })
        }
      } catch (error) {
        ElMessage({
          message: '请求失败，请稍后重试: ' + error,
          type: 'error',
          plain: true
        })
      }
    }
  }

  function resetStore() {
    gettedRecycled.value = false
    recycledData = null
  }

  return {
    gettedRecycled,
    recycledData,
    getRecycledData,
    resetStore
  }
})
