import React, { useState} from 'react'
import { Input, Tabs} from 'antd'
import styled from 'styled-components'
import {SearchOutlined} from '@ant-design/icons';
import TheList from './components/TheList';

const StyledInput = styled(Input)`
  width: 600px;
  border-radius: 20px;
`

function FetchDataList(props) {
  const {activeKey: dataFieldId} = props
  const [keyword, setKeyword] = useState()
  const [currentTab, setCurrentTab] = useState('hasAuth')
  return (
      <div className={''}>
        <div className={'text-center'}>
          <StyledInput prefix={<SearchOutlined style={{color: '#ccc', fontSize: 20}}/>}
                       value={keyword}
                       onChange={(e) => {
                         setKeyword(e.target.value)
                       }}
                       size={'large'}
                       placeholder={'输入关键字查询'}
                       allowClear
          />
        </div>
        <Tabs activeKey={currentTab} onChange={(k) => setCurrentTab(k)}>
          <Tabs.TabPane tab="已拥有" key="hasAuth">
            <TheList viewType={'hasAuth'} currentTab={currentTab} dataFieldId={dataFieldId} keyword={keyword}/>
          </Tabs.TabPane>
          <Tabs.TabPane tab="全部" key="all">
            <TheList viewType={'all'} currentTab={currentTab} dataFieldId={dataFieldId} keyword={keyword}/>
          </Tabs.TabPane>
        </Tabs>
      </div>
  )
}

export default FetchDataList
