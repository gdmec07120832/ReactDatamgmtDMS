import React, {useContext, useEffect, useState} from 'react'
import {Spin} from 'antd'
import FetchDataList from './FetchDataList'
import {FieldsContext} from '../Main';
import {useRouteMatch} from 'react-router-dom';
import {useSelector} from 'react-redux';
import find from 'lodash/find'

function FetchMain() {
  const [activeKey, setActiveKey] = useState(null)
  const routesNameMapV2 = useSelector(state => state.routes.routesNameMapV2)
  const fields = useContext(FieldsContext)
  const match = useRouteMatch()
  const path = match.path
  const route = find(routesNameMapV2, {
    path: path
  })

  useEffect(() => {
    if(route) {
      const item = find(fields, {
        nodeName: route.meta.title
      })

      if(item) {
        setActiveKey(item.id)
      } else {
        setActiveKey('-1')
      }
    }

  }, [fields, route])



  return (
      <div className={'px-6 pt-6'}>
        {
          activeKey !== null ? <FetchDataList activeKey={activeKey}/> : <div className={'text-center py-6'}>
            <Spin spinning={true} tip={'请稍后'}/>
          </div>
        }
      </div>
  )
}

export default FetchMain;