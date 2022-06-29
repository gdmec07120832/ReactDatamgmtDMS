import { BrowserRouter as Router } from 'react-router-dom'
import RenderRoutes from './components/RenderRoutes'
import AuthCheckWrapper from './components/AuthCheckWrapper'
import { LastLocationProvider } from 'react-router-last-location'
import 'antd/dist/antd.less'
import './common.scss'
import './index.css'
import './App.scss'
import routes, {routesNameMapV2} from './routes';
import { message, Modal } from 'antd'
import {useDispatch} from 'react-redux';

message.config({
  maxCount: 1,
  duration: 2
})

const getConfirmation = (msg, cb) => {
  Modal.confirm({
    title: '确认',
    content: msg,
    okText: '确认',
    cancelText: '取消',
    onOk() {
      cb(true)
    },
    onCancel() {
      cb(false)
    }
  })
}


function App () {
  const dispatch = useDispatch()
  dispatch({
    type: 'update_routes',
    routes,
    routesNameMapV2,
  })
  return (
    <div className="App">
      <Router getUserConfirmation={getConfirmation}>
        <LastLocationProvider>
          <AuthCheckWrapper>
            <RenderRoutes/>
          </AuthCheckWrapper>
        </LastLocationProvider>
      </Router>
    </div>
  )
}

export default App
