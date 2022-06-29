import Axios from 'axios'
import { message } from 'antd'
import store from '../store/index'

const pending = []

const instance = Axios.create({
  baseURL: '/bi-dm',
  timeout: 60 * 1000,
  withCredentials: true,
  headers: {
    'X-Requested-With': 'XMLHttpRequest'
  }
})

instance.interceptors.request.use(config => {
  config.cancelToken = new Axios.CancelToken(c => {
    pending.push(c)
  })
  return config
}, error => {
  return Promise.reject(error)
})

instance.interceptors.response.use(response => {
  const data = response.data
  if(data instanceof Blob) {
    return Promise.resolve(response)
  }
  if (data?.success) {
    if(response.config.headers.fullResponse) {
      return response
    }
    return data
  } else {
    if (data?.code === 401) {
      store.dispatch({
        type: 'SET_TOKEN_TIMEOUT',
        isTokenTimeout: true
      })
      while (pending.length > 0) {
        pending.pop()('canceled')
      }
      // 跳转到登录页
      if(data?.data && process.env.REACT_APP_RELEASE_ENV !== 'dev') {
        window.location.replace(data.data)
      }
    }
    if (data?.['msg']) {
      message.error(<span dangerouslySetInnerHTML={{__html: data?.['msg']}} />)
    }
    return Promise.reject(data)
  }
})

export default instance

export {instance as $axios}
