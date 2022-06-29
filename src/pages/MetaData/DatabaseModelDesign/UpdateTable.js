import React, { useEffect, useState } from 'react'
import DraggableModal from '../../../components/DraggableModal'
import {Alert, Button, Input, message, Table} from 'antd'
import useTable from '../../../hooks/useTable'
import axios from '../../../utils/axios';

function UpdateTable(props) {
  const { current, setCurrent, refreshPage } = props
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitDisabled, setSubmitDisabled] = useState(true)
  const { table, setTable } = useTable({
    rowKey: 'updateType',
    pagination: false,
    columns: [
      { dataIndex: 'updateType', title: '修改类型', width: 120 },
      { dataIndex: 'oldValue', title: '原值' },
      {
        dataIndex: 'newValue',
        title: '新值',
        render: (text, row) => {
          return <Input value={text} onChange={(e) => handleInputChange(e.target.value, row)} />
        },
      },
    ],
    dataSource: [
      { updateType: '表名', _type: 'tableName', oldValue: '', newValue: '' },
      { updateType: '表注释', _type: 'tabComments', oldValue: '', newValue: '' },
    ],
  })

  useEffect(() => {
    setTable((prevState) => {
      return {
        ...prevState,
        dataSource: [
          { ...prevState.dataSource[0], oldValue: current?.tableName, newValue: current?.tableName },
          { ...prevState.dataSource[1], oldValue: current?.tabComments, newValue: current?.tabComments },
        ],
      }
    })
  }, [current, setTable])

  useEffect(() => {
    const isChanged = table.dataSource.some(item => item.oldValue !== item.newValue)
    setSubmitDisabled(!isChanged)
  }, [table.dataSource])

  const close = () => {
    setCurrent(null)
  }

  const handleInputChange = (v, row) => {
    setTable((prevState) => {
      const index = prevState.dataSource.findIndex((item) => item.updateType === row.updateType)
      if (index > -1) {
        return {
          ...prevState,
          dataSource: [
            ...prevState.dataSource.slice(0, index),
            {
              ...prevState.dataSource[index],
              newValue: v,
            },
            ...prevState.dataSource.slice(index + 1),
          ],
        }
      }
      return prevState
    })
  }

  const handleSubmit = () => {
    setSubmitLoading(true)
    axios.post('/bi-metadata/api/user/dataWarehouseModel/updateTableInfo', {
      owner: current?.owner,
      tableName: current.tableName,
      tableComment: current.tabComments,
      newTableName: table.dataSource[0].newValue,
      newTableComment: table.dataSource[1].newValue
    }).then(() => {
      message.success('提交成功')
      refreshPage()
      setTimeout(() => {
        setCurrent(null)
      }, 10)
    }).finally(() => {
      setSubmitLoading(false)
    })
  }

  return (
    <DraggableModal
      title={'更新表'}
      width={960}
      destroyOnClose
      footer={[
        <Button onClick={close} key={'close'}>
          关闭
        </Button>,
        <Button disabled={submitDisabled} loading={submitLoading} onClick={handleSubmit} key={'submit'} type={'primary'}>
          提交
        </Button>,
      ]}
      visible={current}
      onCancel={close}>
      <Alert
        message="提交修改后，将自动生成自动部署申请单，请联系相关审核人员进行审核。"
        type="info"
        showIcon
        className={'mb-2'}
      />
      <Table {...table} />
    </DraggableModal>
  )
}

export default UpdateTable
