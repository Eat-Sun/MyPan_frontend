import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'http://39.105.108.111:3000', // 指定端口号
  timeout: 10000 // 可选: 设置请求超时
})

export default apiClient
