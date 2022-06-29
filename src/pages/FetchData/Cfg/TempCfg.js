import React, { useEffect, useState } from 'react'
import { Button, Input, message, Popconfirm } from 'antd'
import { PlusCircleOutlined } from '@ant-design/icons'
import ExTable from '../../../components/ExTable/ExTable'
import { useHistory } from 'react-router-dom'
import { useRequest } from 'ahooks'
import axios from '../../../utils/axios'

function TempCfg() {
  const [table, setTable] = useState({
    pagination: { current: 1, pageSize: 10, total: 0 },
    rowKey: 'id',
    columns: [
      { dataIndex: 'id', title: 'ID', width: 80 },
      { dataIndex: 'dataFieldName', title: '数据域' },
      { dataIndex: 'businessProcessName', title: '业务过程' },
      { dataIndex: 'templateName', title: '模板名称' },
      { dataIndex: 'creatorName', title: '创建人' },
      { dataIndex: 'businessManagerName', title: '业务负责人' },
      { dataIndex: 'createDate', title: '创建时间' },
      {
        dataIndex: 'status',
        title: '状态',
        render(text, record) {
          const { statusName } = record
          return statusName
        },
      },
      {
        dataIndex: 'g',
        title: '操作',
        width: 120,
        render(text, record) {
          const { status } = record
          return (
            <div className={'space-x-2.5'}>
              <Button type={'link'} size={'small'} onClick={() => editRow(record)}>
                编辑
              </Button>
              {status !== 'WAITING_APPROVED' && (
                <Popconfirm title={'确认删除吗？'} placement={'topLeft'} onConfirm={() => deleteRow(record)}>
                  <Button type={'link'} size={'small'} danger>
                    删除
                  </Button>
                </Popconfirm>
              )}
            </div>
          )
        },
      },
    ],
    dataSource: [],
  })

  const [keyword, setKeyword] = useState()
  const { current: page, pageSize } = table.pagination
  const { run: getList, loading } = useRequest(
    () => {
      return axios
        .get('/bi-data-fetch/api/admin/biDfSqlTemplate/list', {
          params: {
            keyword,
            page,
            pageSize,
          },
        })
        .then(({ data: { list, totalRows } }) => {
          setTable((prevState) => ({
            ...prevState,
            dataSource: list,
            pagination: {
              ...prevState.pagination,
              total: totalRows,
              current: Math.max(Math.min(page, Math.ceil(totalRows / pageSize)), 1),
            },
          }))
        })
    },
    {
      manual: true,
      debounceInterval: 200,
    }
  )

  useEffect(() => {
    getList()
  }, [getList, keyword, page, pageSize])

  const history = useHistory()
  const deleteRow = (record) => {
    axios
      .get('/bi-data-fetch/api/admin/biDfSqlTemplate/delById', {
        params: {
          id: record.id,
        },
      })
      .then(() => {
        message.success('删除成功')
        getList()
      })
  }
  const addNew = () => {
    history.push('/fetchData/cfg/temp-cfg/create')
  }
  const editRow = (row) => {
    history.push(`/fetchData/cfg/temp-cfg/edit/${row.id}`)
  }

  return (
    <div className={'p-6'}>
      <div className={'flex justify-between mb-2.5 space-x-2.5'}>
        <div className={'flex-1 grid grid-cols-4 gap-x-4'}>
          <div className={'flex'}>
            <span className={'flex-none'}>模板名称：</span>
            <Input
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value)
                setTable((prevState) => ({ ...prevState, pagination: { ...prevState.pagination, current: 1 } }))
              }}
              className={'flex-1'}
              placeholder={'输入关键字搜索'}
              allowClear
            />
          </div>
        </div>
        <div>
          <Button type={'primary'} icon={<PlusCircleOutlined />} onClick={addNew}>
            新增模板
          </Button>
        </div>
      </div>
      <ExTable {...table} setTable={setTable} loading={loading} />
    </div>
  )
}

export default TempCfg