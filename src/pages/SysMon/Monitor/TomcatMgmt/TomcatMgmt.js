import React, { useCallback, useEffect, useState } from 'react'
import { Button, Input, message, Popconfirm, Space, Tag } from 'antd'
import ExTable from '../../../../components/ExTable/ExTable'
import { useRequest } from 'ahooks'
import axios from '../../../../utils/axios'
import { useHistory, useLocation } from 'react-router-dom'
import store from 'store2'
import EditModal from './EditModal'
import CloseServeModal from './CloseServeModal'
import { useSelector } from 'react-redux'

function TomcatMgmt() {
  const permissionsMap = useSelector((state) => state.user.permissionsMap)
  const history = useHistory()
  const location = useLocation()
  const storage = store.session.get(`${location.pathname}-query`)

  const [table, setTable] = useState({
    pagination: { current: storage?.page || 1, pageSize: storage?.pageSize || 10 },
    scroll: {x: 1300},
    columns: [
      { dataIndex: 'name', title: '名称' },
      { dataIndex: 'ipAddress', title: 'IP' },
      { dataIndex: 'apiPort', title: 'API端口', width: 80 },
      { dataIndex: 'linuxPath', title: '路径' },
      {
        dataIndex: 'status',
        title: '状态',
        width: 80,
        render(text) {
          return <Tag color={{ 1: 'error', 0: 'success' }[text]}>{{ 1: '已关闭', 0: '运行中' }[text] || '未知'}</Tag>
        },
      },
      {dataIndex: 'createBy', title: '创建人', width: 80},
      {dataIndex: 'createTime', title: '创建时间'},
      {dataIndex: 'updateBy', title: '更新人', width: 80},
      {dataIndex: 'updateTime', title: '更新时间'},
      {
        dataIndex: 'actions',
        title: '操作',
        width: 200,
        fixed: 'right',
        render(text, record) {
          const { status } = record
          return (
            <Space>
              {permissionsMap['bi-sys.LinuxTomcatController.changeStatus'] && status === '1' && (
                <Popconfirm title={'确定启动吗？'} onConfirm={() => setRowStatus(record, '0')}>
                  <Button size={'small'} type={'link'}>
                    启动
                  </Button>
                </Popconfirm>
              )}
              {permissionsMap['bi-sys.LinuxTomcatController.changeStatus'] && status === '0' && (
                <Button size={'small'} type={'link'} danger onClick={() => handleCloseServe(record)}>
                  关闭
                </Button>
              )}

              {permissionsMap['bi-sys.LinuxTomcatController.editSave'] && (
                <Button size={'small'} type={'link'} onClick={() => editRow(record)}>
                  编辑
                </Button>
              )}

              {permissionsMap['bi-sys.LinuxTomcatLogController.pageList'] && (
                <Button size={'small'} type={'link'} onClick={() => checkLog(record)}>
                  日志
                </Button>
              )}

              {permissionsMap['bi-sys.LinuxTomcatController.remove'] && (
                <Popconfirm title={'确定删除吗？'} placement={'topRight'} onConfirm={() => deleteRow(record)}>
                  <Button size={'small'} type={'link'} danger>
                    删除
                  </Button>
                </Popconfirm>
              )}
            </Space>
          )
        },
      },
    ],
  })

  const [query, _setQuery] = useState({
    name: storage?.name || '',
  })

  const setQuery = useCallback((args) => {
    setTable((prevState) => ({
      ...prevState,
      pagination: { ...prevState.pagination, current: 1 },
    }))
    _setQuery(args)
  }, [])

  const { current: page, pageSize } = table.pagination
  const { name } = query

  const checkLog = (record) => {
    history.push(`/mon/monitor/tomcat/logs`, {
      id: record.id,
    })
  }

  const { run: getList, loading } = useRequest(
    () => {
      return axios
        .get('/bi-sys/api/admin/tomcat/list', {
          params: {
            name,
            currentPage: page,
            pageSize,
          },
        })
        .then(({ data: { list, totalRows: total } }) => {
          setTable((prevState) => ({
            ...prevState,
            dataSource: list,
            pagination: { ...prevState.pagination, total },
          }))
        })
    },
    { manual: true, debounceInterval: 200 }
  )

  const [currentEditRow, setCurrentEditRow] = useState(null)

  const editRow = (row) => {
    setCurrentEditRow(row)
  }

  const createNew = () => {
    setCurrentEditRow({})
  }

  const deleteRow = (record) => {
    axios
      .post('/bi-sys/api/admin/tomcat/remove', null, {
        params: { ids: record.id },
      })
      .then(() => {
        message.success('删除成功')
        getList()
      })
  }

  const setRowStatus = (record, status) => {
    axios
      .post('/bi-sys/api/admin/tomcat/changeStatus', null, {
        params: {
          id: record.id,
          status,
        },
      })
      .then(() => {
        message.success('操作成功')
        getList()
      })
  }

  const [closeRecord, setCloseRecord] = useState(null)
  const handleCloseServe = (record) => {
    setCloseRecord(record)
  }

  useEffect(() => {
    store.session.set(`${location.pathname}-query`, {
      page,
      pageSize,
      ...query,
    })
    getList()
  }, [page, pageSize, getList, query, location.pathname])

  return (
    <div className={'p-6'}>
      <div className={'flex mb-2.5 space-x-4'}>
        <div className={'flex-1 grid grid-cols-4 gap-x-6'}>
          <div className="flex space-x-2.5">
            <span className="flex-none">名称</span>
            <Input
              value={query.name}
              onChange={(e) => setQuery((prevState) => ({ ...prevState, name: e.target.value }))}
              placeholder={'名称'}
              allowClear
            />
          </div>
        </div>
        <div className={'space-x-4'}>
          <Button onClick={getList}>刷新</Button>
          <Button type={'primary'} onClick={createNew}>
            新增
          </Button>
        </div>
      </div>
      <ExTable {...table} loading={loading} setTable={setTable} />

      <EditModal current={currentEditRow} setCurrent={setCurrentEditRow} onSubmit={getList} />
      <CloseServeModal current={closeRecord} setCurrent={setCloseRecord} onSubmit={getList} />
    </div>
  )
}

export default TomcatMgmt
