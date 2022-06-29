import React, { useEffect, useState } from 'react'
import ExTable from '../../../components/ExTable/ExTable'
import { Tag } from 'antd'
import { useRequest } from 'ahooks'
import axios from '../../../utils/axios'
import { useHistory } from 'react-router-dom'

function ApplyList(props) {
  const { keyword } = props
  const [table, setTable] = useState({
    rowKey: 'auId',
    scroll: {x: 1200,},
    pagination: {
      total: 0,
      pageSize: 10,
      current: 1,
    },
    columns: [
      {
        dataIndex: 'taskName',
        title: '任务名称',
        width: '22%',
        render(text, record) {
          const { status } = record
          return status === 'Pass' ? (
            <span className={'text-blue-500 cursor-pointer'} onClick={() => jumpToFetch(record)}>
              {text}
            </span>
          ) : (
            <span>{text}</span>
          )
        },
      },
      { dataIndex: 'dataFieldName', title: '数据域', width: 100 },
      { dataIndex: 'businessProcessName', title: '业务过程', width: 100 },
      {
        dataIndex: 'secrecyLevel',
        title: '隐私等级',
        width: 100,
        render(text, record) {
          const { secrecyLevelName } = record
          return secrecyLevelName
        },
      },
      {
        dataIndex: 'applyType',
        title: '申请类型',
        width: 120,
        render(value) {
          const text = {
            CREATION: '新建申请',
            MODIFICATION: '更新申请',
            PERMISSION: '权限申请',
          }[value]

          return <span>{text}</span>
        },
      },
      {
        dataIndex: 'status',
        title: '状态',
        width: 120,
        render: (text, record) => {
          const { statusName } = record
          return <Tag color={{ Reject: 'error', Pass: 'success', PendingAudit: 'processing' }[text]}>{statusName}</Tag>
        },
      },
      { dataIndex: 'creatorName', title: '申请人', width: 100 },
      { dataIndex: 'createDate', title: '创建时间', width: 160 },
      { dataIndex: 'auditDate', title: '生效时间', width: 160 },
    ],
    dataSource: [],
  })

  const history = useHistory()
  const jumpToFetch = (record) => {
    history.push(`/fetchData/fetchBy/${record.templateId}`)
  }

  const { current, pageSize } = table.pagination
  const { run: getList, loading } = useRequest(
    () => {
      return axios
        .get('/bi-data-fetch/api/admin/biDfSqlTempAudit/list', {
          params: {
            page: current,
            pageSize,
            keyword,
          },
        })
        .then(({ data: { list, totalRows } }) => {
          setTable((prevState) => ({
            ...prevState,
            dataSource: list,
            pagination: { ...prevState.pagination, total: totalRows },
          }))
        })
    },
    { manual: true, debounceInterval: 200 }
  )

  useEffect(() => {
    getList()
  }, [current, pageSize, keyword, getList])

  useEffect(() => {
    setTable((prevState) => ({
      ...prevState,
      pagination: { ...prevState.pagination, current: 1 },
    }))
  }, [keyword])

  return <ExTable {...table} setTable={setTable} loading={loading} />
}

export default ApplyList
