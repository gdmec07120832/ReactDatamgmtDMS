import React, { useState } from 'react'
import ExTable from '../../../components/ExTable/ExTable'
import {Button, Popconfirm, Steps} from 'antd'
import ChevronRight from '@material-ui/icons/ChevronRight'
import classNames from 'classnames'
import {CheckCircleFilled} from '@ant-design/icons';

function ApprovalList() {
  const [table, setTable] = useState({
    rowKey: 'id',
    expandable: {
      expandedRowRender: (record) => {
       return <div className={'w-4/5 mx-auto mt-4'}>
         <Steps progressDot current={1}>
           <Steps.Step title="创建单据" description={
             <div>
               <div>张三 <CheckCircleFilled style={{color: '#52c41a'}} /></div>
               <div>2022-01-12 12:22:12</div>
             </div>
           } />
           <Steps.Step title="部门初审" description="" />
           <Steps.Step title="数据部门审核" description="" />
           <Steps.Step title="完成" description="" />
         </Steps>
       </div>
      },
      expandIcon: ({ expanded, onExpand, record }) => {
        return (
          <ChevronRight
            onClick={(e) => onExpand(record, e)}
            style={{ lineHeight: 1 }}
            className={classNames({ 'rotate-90': expanded }, 'transform cursor-pointer align-bottom text-gray-500')}
          />
        )
      },
    },
    columns: [
      { dataIndex: 'name', title: '任务名称' },
      { dataIndex: 'name', title: '申请人' },
      { dataIndex: 'name', title: '数据域' },
      { dataIndex: 'name', title: '业务过程' },
      { dataIndex: 'name', title: '类型' },
      { dataIndex: 'name', title: '状态' },
      { dataIndex: 'name', title: '创建时间', width: 160 },
      { dataIndex: 'name', title: '生效时间', width: 160 },
      {
        dataIndex: 'name',
        title: '操作',
        width: 120,
        render() {
          return (
            <div className={'space-x-2.5'}>
              <Button size={'small'} type={'link'}>
                通过
              </Button>
              <Popconfirm title={'确定驳回吗？'}>
                <Button size={'small'} type={'link'} danger>
                  驳回
                </Button>
              </Popconfirm>
            </div>
          )
        },
      },
    ],
    dataSource: [{ name: '44', id: 1 }],
  })

  return <ExTable {...table} setTable={setTable} />
}

export default ApprovalList;