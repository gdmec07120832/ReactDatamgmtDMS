import React, { useEffect, useState } from 'react'
import axios from '../../../../utils/axios'
import { Empty, Tabs } from 'antd'

function ServerMo() {
  const [tabList, setTabList] = useState([])
  const [activeKey, setActiveKey] = useState(null)
  useEffect(() => {
    axios.get('/bi-sys/api/admin/systemMonitor/getServerMonitorList').then(({ data }) => {
      setTabList(data)
      setActiveKey(data[0]?.key)
    })
  }, [])

  return (
    <div className={'px-2'}>
      {!!tabList.length ? (
        <Tabs activeKey={activeKey} onTabClick={(key) => setActiveKey(key)}>
          {tabList.map((item) => {
            return (
              <Tabs.TabPane tab={item.description || item.key} key={item.key}>
                <div style={{ height: 'calc(100vh - 200px)' }}>
                  <iframe
                    title={item.description}
                    src={item.value}
                    frameBorder={0}
                    width={'100%'}
                    height={'99%'}
                    key={item.key}
                  />
                </div>
              </Tabs.TabPane>
            )
          })}
        </Tabs>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </div>
  )
}

export default ServerMo
