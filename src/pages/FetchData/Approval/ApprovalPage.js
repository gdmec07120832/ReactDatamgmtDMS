import React, {useState} from 'react'
import {Input} from 'antd';
import ApplyList from './ApplyList';
import {QuestionCircleOutlined} from '@ant-design/icons';


function ApprovalPage() {
  const [keyword, setKeyword] = useState('')
  return (
    <div className={'p-6 pt-0'}>
      <div className={'flex justify-between py-2.5'}>
        <div className={'text-yellow-500'}> <QuestionCircleOutlined /> 权限审批前往钉钉中的OA审批中进行审批</div>
        <div>
          <Input onChange={e => setKeyword(e.target.value)} allowClear placeholder={'输入关键字查询'} className={'w-96'} />
        </div>
      </div>

      <div className={'border-0 border-b border-solid border-gray-100'} />

      <div className={'mt-2.5'}>
        <ApplyList keyword={keyword} />
      </div>
    </div>
  )
}

export default ApprovalPage
