import React, { useEffect, useState } from 'react'
import { Badge, Tabs } from 'antd'
import { useHistory, useLocation } from 'react-router-dom'
import qs from 'qs'
import TabAll from './components/TabAll'
import TabToFill from './components/TabToFill'
import TabHasFill from './components/TabHasFill'
import TabToApproval from './components/TabToApproval'
import TabHasApproval from './components/TabHasApproval'
import useTableStyle from './components/useTableStyle'
import axios from '../../../utils/axios'
import {fetchDataFields, fetchLevelInfo} from '../helpers';

export const CateContext = React.createContext({
  dataFields: [],
  level1List: [],
  level2List: []
})
function TodoIndex() {
  const classes = useTableStyle()
  const history = useHistory()
  const location = useLocation()
  let defaultTab = qs.parse(location.search, { ignoreQueryPrefix: true })?.tab
  if (!defaultTab) {
    const tab = sessionStorage.getItem('dataFill_todo_tab')
    if (tab) {
      defaultTab = tab
    }
  }
  const tabChange = (tab) => {
    history.push(location.pathname + `?tab=${tab}`)
    sessionStorage.setItem('dataFill_todo_tab', tab)
  }

  const [counts, setCounts] = useState({
    reportWarningCount: 0,
    notApprovedWarningCount: 0,
  })

  useEffect(() => {
    axios.get('/bi-data-reporting/api/user/workbench/getWarningNumber').then(({ data }) => {
      const { reportWarningCount, notApprovedWarningCount } = data
      setCounts({
        reportWarningCount,
        notApprovedWarningCount,
      })
    })
  }, [])

  const [dataFields, setDataFields] = useState([])
  const [level1List, setLevel1List] = useState([])
  const [level2List, setLevel2List] = useState([])

  useEffect(() => {
    const _fetch = async () => {
      const fields = await fetchDataFields()
      const list1 = await fetchLevelInfo(1)
      const list2 = await fetchLevelInfo(2)
      setDataFields(fields.map(item => ({label: item.nodeName, value: item.id})))
      setLevel1List(list1.map(item => ({...item, label: item.name, value: item.id})))
      setLevel2List(list2.map(item => ({...item, label: item.name, value: item.id})))
    }
    _fetch()
  }, [])


  return (
      <CateContext.Provider value={{dataFields, level1List, level2List}}>
        <div className={classes.root}>
          <Tabs defaultActiveKey={defaultTab} onChange={tabChange} destroyInactiveTabPane tabBarGutter={30}>
            <Tabs.TabPane tab={'全部'} key={'all'}>
              <TabAll />
            </Tabs.TabPane>
            <Tabs.TabPane
              tab={
                <Badge count={counts.reportWarningCount} size={'small'} offset={[8, 0]}>
                  待填报
                </Badge>
              }
              key={'pendingFill'}>
              <TabToFill />
            </Tabs.TabPane>
            <Tabs.TabPane tab={'已填报'} key={'hasFill'}>
              <TabHasFill />
            </Tabs.TabPane>
            <Tabs.TabPane
              tab={
                <Badge count={counts.notApprovedWarningCount} size={'small'} offset={[8, 0]}>
                  待审批
                </Badge>
              }
              key={'pendingApproval'}>
              <TabToApproval />
            </Tabs.TabPane>
            <Tabs.TabPane tab={'已审批'} key={'hasApproval'}>
              <TabHasApproval />
            </Tabs.TabPane>
          </Tabs>
        </div>
      </CateContext.Provider>
  )
}

export default TodoIndex
