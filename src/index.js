import React from 'react'
import ReactDOM from 'react-dom'
import { ConfigProvider } from 'antd'
import { Provider } from 'react-redux'
import './utils/initEcharts'
import store from './store'
import App from './App'
import 'moment/locale/zh-cn'
import zhCN from 'antd/lib/locale/zh_CN'
import 'overlayscrollbars/css/OverlayScrollbars.css'
import Cookies from 'js-cookie';

if(process.env.REACT_APP_RELEASE_ENV === 'dev') {
  const token = process.env.REACT_APP_token
  Cookies.set('token', token)
  Cookies.set('lsmyToken', token)
  Cookies.set('BI_TOKEN', token)
  Cookies.set('LOGIN_WAY', 'SSO')
}

ReactDOM.render(
  <>
    <Provider store={store}>
      <ConfigProvider
        locale={zhCN}
        getPopupContainer={(node) => {
          if (node) {
            return document.getElementById('layoutInner') || node.parentNode
          } else {
            return document.body
          }
        }}>
        <App />
      </ConfigProvider>
    </Provider>
  </>,
  document.getElementById('root')
)
