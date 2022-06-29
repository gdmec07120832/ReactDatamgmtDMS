import React, { useEffect, useRef, useState } from 'react'
import DraggableModal from '../../../components/DraggableModal'
import useTable from '../../../hooks/useTable'
import { Alert, Button, Input, message, Table } from 'antd'
import axios from '../../../utils/axios'
import ExSelect from '../../../components/Select'
import { MinusCircleOutlined } from '@ant-design/icons'
import xor from 'lodash/xor'
import ReactDOM from 'react-dom'

const dataType = [
  'NUMBER',
  'DATE',
  'TIMESTAMP(6)',
  'VARCHAR2(2)',
  'VARCHAR2(64)',
  'VARCHAR2(128)',
  'VARCHAR2(256)',
  'VARCHAR2(512)',
  'VARCHAR2(1024)',
  'VARCHAR2(4000)',
]

function UpdateColumns(props) {
  const tableRef = useRef(null)
  const { current, setCurrent, refreshPage } = props
  const [uniqKeys, setUniqKeys] = useState([])
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitDisabled, setSubmitDisabled] = useState(true)
  const close = () => {
    setCurrent(null)
  }

  const { table, setTable } = useTable({
    rowKey: '__key__',
    pagination: false,
    scroll: { y: 320 },
    columns: [
      {
        dataIndex: 'index',
        title: '序号',
        width: 50,
        render: (text, record, index) => {
          return index + 1
        },
      },
      {
        dataIndex: 'columnName',
        shouldCellUpdate: (record, prevRecord) => {
          return record.columnName !== prevRecord.columnName
        },
        title: '字段名',
      },
      {
        dataIndex: 'columnComments',
        shouldCellUpdate: (record, prevRecord) => {
          /**@property {string} columnComments */
          return record.columnComments !== prevRecord.columnComments
        },
        title: '注释',
      },
      {
        dataIndex: 'dataType',
        shouldCellUpdate: (record, prevRecord) => {
          return record.dataType !== prevRecord.dataType
        },
        title: '字段类型',
      },
      {
        dataIndex: 'newColumnName',
        shouldCellUpdate: (record, prevRecord) => {
          return record.newColumnName !== prevRecord.newColumnName
        },
        title: (
          <span>
            新字段名 <i className={'text-red-500 not-italic'}>*</i>
          </span>
        ),
        render: (text, row) => {
          return <Input defaultValue={text} onChange={(e) => handleFieldChange(e.target.value, row, 'newColumnName')} />
        },
      },
      {
        dataIndex: 'newColumnComments',
        title: <span>新注释</span>,
        shouldCellUpdate: (record, prevRecord) => {
          return record.newColumnComments !== prevRecord.newColumnComments
        },
        render: (text, row) => {
          return (
            <Input defaultValue={text} onChange={(e) => handleFieldChange(e.target.value, row, 'newColumnComments')} />
          )
        },
      },
      {
        dataIndex: 'newDataType',
        title: (
          <span>
            新字段类型 <i className={'text-red-500 not-italic'}>*</i>
          </span>
        ),
        shouldCellUpdate: (record, prevRecord) => {
          return record.newDataType !== prevRecord.newDataType
        },
        width: 180,
        render: (text, row) => {
          return (
            <ExSelect
              defaultValue={text}
              onChange={(v) => handleFieldChange(v, row, 'newDataType')}
              className={'w-full'}
              options={dataType.map((item) => ({ label: item, value: item }))}
            />
          )
        },
      },
      {
        dataIndex: 'actions',
        title: '操作',
        width: 60,
        render: (text, row) => {
          return (
            <MinusCircleOutlined className={'text-lg cursor-pointer text-red-500'} onClick={() => deleteRow(row)} />
          )
        },
      },
    ],
  })

  const deleteRow = (row) => {
    setTable((prevState) => {
      const index = prevState.dataSource.findIndex((item) => item.__key__ === row.__key__)
      if (index > -1) {
        return {
          ...prevState,
          dataSource: [...prevState.dataSource.slice(0, index), ...prevState.dataSource.slice(index + 1)],
        }
      }
      return prevState
    })
  }

  const addRow = () => {
    setTable((prevState) => {
      return {
        ...prevState,
        dataSource: [...prevState.dataSource, { __key__: Math.random().toString(32).slice(-8) }],
      }
    })
    if (tableRef.current) {
      setTimeout(() => {
        ReactDOM.findDOMNode(tableRef.current)
          ?.querySelector('.ant-table-body')
          ?.scroll({
            top: (table.dataSource.length + 1) * 50,
            behavior: 'smooth',
          })
      }, 200)
    }
  }

  const handleFieldChange = (v, row, prop) => {
    setTable((prevState) => {
      const index = prevState.dataSource.findIndex((item) => item.__key__ === row.__key__)
      if (index > -1) {
        return {
          ...prevState,
          dataSource: [
            ...prevState.dataSource.slice(0, index),
            {
              ...prevState.dataSource[index],
              [prop]: v,
            },
            ...prevState.dataSource.slice(index + 1),
          ],
        }
      }
      return prevState
    })
  }

  useEffect(() => {
    if (current) {
      axios
        .get('/bi-metadata/api/user/dataWarehouseModel/getColumnsByOwnerAndTableName', {
          params: {
            owner: current.owner,
            tableName: current.tableName,
          },
        })
        .then(({ data }) => {
          const dataSource = data.map((item) => {
            return {
              __key__: Math.random().toString(32).slice(-8),
              ...item,
              newDataType: item.dataType,
              newColumnComments: item.columnComments,
              newColumnName: item.columnName,
            }
          })

          setUniqKeys(dataSource.map((row) => row.__key__))

          setTimeout(() => {
            setTable((prevState) => ({
              ...prevState,
              dataSource,
            }))
          }, 200)
        })
    } else {
      setTable((prevState) => ({
        ...prevState,
        dataSource: [],
      }))
    }
  }, [current, setTable])

  const handleSubmit = () => {
    const hasEmptyFieldIndex = table.dataSource.findIndex((row) => {
      return !row.newColumnName || !row.newDataType
    })

    if (hasEmptyFieldIndex > -1) {
      message.destroy()
      message.error(`请检查【第${hasEmptyFieldIndex + 1}行】的必填字段`)
      return
    }

    setSubmitLoading(true)
    axios
      .post('/bi-metadata/api/user/dataWarehouseModel/updateColumnsInfo', {
        owner: current?.owner,
        tableName: current?.tableName,
        columns: table.dataSource.map((row) => {
          let { __key__, newColumnName, columnName, dataType, newDataType, ...rest } = row
          if (!columnName) {
            columnName = newColumnName
          }
          if (!dataType) {
            dataType = newDataType
          }
          return {
            ...rest,
            columnName,
            newColumnName,
            dataType,
            newDataType,
            owner: current?.owner,
            tableName: current?.tableName,
          }
        }),
      })
      .then(() => {
        message.success('提交成功')
        refreshPage()
        setTimeout(() => {
          setCurrent(null)
        }, 10)
      })
      .finally(() => {
        setSubmitLoading(false)
      })
  }

  useEffect(() => {
    const isChanged = table.dataSource.some(
      (item) =>
        item.columnName !== item.newColumnName ||
        item.columnComments !== item.newColumnComments ||
        item.dataType !== item.newDataType
    )
    const diff = xor(
      uniqKeys,
      table.dataSource.map((row) => row.__key__)
    )
    const rowLengthChanged = !!diff.length

    setSubmitDisabled(!isChanged && !rowLengthChanged)
  }, [table.dataSource, uniqKeys])

  return (
    <DraggableModal
      destroyOnClose={true}
      footer={[
        <Button onClick={close} key={'close'}>
          关闭
        </Button>,
        <Button
          disabled={submitDisabled}
          loading={submitLoading}
          onClick={handleSubmit}
          key={'submit'}
          type={'primary'}>
          提交
        </Button>,
      ]}
      width={1020}
      visible={current}
      onCancel={close}
      title={'更新字段'}>
      <Alert
        message="提交修改后，将自动生成自动部署申请单，请联系相关审核人员进行审核。"
        type="info"
        showIcon
        className={'mb-2'}
      />
      <div className={'flex justify-end mb-2'}>
        <Button onClick={addRow}>添加字段</Button>
      </div>
      <Table {...table} ref={tableRef} />
    </DraggableModal>
  )
}

export default UpdateColumns
