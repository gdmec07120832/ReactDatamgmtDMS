import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button, DatePicker, Input, Popconfirm, Select, Space, Table } from 'antd'
import { Tooltip } from '@material-ui/core'
import { TASK_STATUS, TASK_TYPE } from '../TaskMgmt/TaskMgmt'
import useUserList from '../../../hooks/useUserList'
import useTable from '../../../hooks/useTable'
import { useRequest } from 'ahooks'
import axios from '../../../utils/axios'
import OverflowTooltip from '../../../components/OverflowTooltip'
import { downloadBlob } from '../../../utils/helpers'
import { useHistory, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import store from 'store2'
import moment from 'moment'
import ExSelect from '../../../components/Select'

function TaskDeploy() {
  const location = useLocation()
  const storage = store.session.get(`${location.pathname}-query`)
  const { page: _page, pageSize: _pageSize, ...restStorage } = storage || {}
  const permissionsMap = useSelector((state) => state.user.permissionsMap)
  const userList = useUserList()
  const history = useHistory()
  const [query, _setQuery] = useState({
    keyword: '',
    taskType: undefined,
    taskStatus: undefined,
    creatorIds: undefined,
    deployFileType: undefined,
    fileDeployUpdateType: undefined,
    ...restStorage,
    date: restStorage.date ? moment(restStorage.date) : null,
  })

  const { table, setTable } = useTable({
    pagination: {
      pageSize: _pageSize || 10,
      current: _page || 1,
    },
    rowKey: 'id',
    scroll: { x: 1600 },
    columns: [
      { title: '主键', dataIndex: 'id', fixed: true, width: 100 },
      { title: '任务名称', dataIndex: 'taskName', fixed: true },
      { title: '描述', dataIndex: 'description', width: 100 },
      {
        title: '创建人',
        dataIndex: 'creator',
        width: 100,
        render: (_, record) => {
          return <OverflowTooltip>{record['creator']?.nameCn}</OverflowTooltip>
        },
      },
      {
        title: '最后审核人',
        dataIndex: 'lastAuthor',
        width: 100,
      },
      {
        title: '最后审核状态',
        dataIndex: 'lastAuthResult',
        width: 100,
      },
      {
        title: '任务类型',
        dataIndex: 'taskType',
        width: 100,
        render: (text) => {
          return <OverflowTooltip>{TASK_TYPE[text]}</OverflowTooltip>
        },
      },
      { title: '更新时间', dataIndex: 'updateDate', width: 160 },
      {
        title: '自动部署',
        dataIndex: 'autoDeploy',
        width: 100,
        render: (text) => {
          return text ? '是' : '否'
        },
      },
      {
        title: '任务状态',
        width: 100,
        dataIndex: 'status',
        render: (text) => {
          return <OverflowTooltip>{TASK_STATUS[text]}</OverflowTooltip>
        },
      },
      {
        title: '处理状态',
        dataIndex: 'processStateName',
        width: 100,
        render(text) {
          return { UNDISPOSED: '未处理', IN_HAND: '处理中', COMPLETE: '已完成' }[text]
        },
      },
      {
        title: '操作',
        dataIndex: 'actions',
        fixed: 'right',
        width: 120,
        render: (_, record) => {
          const { status } = record
          return (
            <Space>
              {['ToBeReleased'].includes(status) && permissionsMap['bi-auto-deploy.ReleaseTaskController.releaseTask'] && (
                <Popconfirm title={'确定部署吗？'} onConfirm={() => deployRow(record)}>
                  <Button size={'small'} type={'link'}>
                    部署
                  </Button>
                </Popconfirm>
              )}
              <Button type={'link'} size={'small'} onClick={() => checkRecord(record)}>
                查看
              </Button>
            </Space>
          )
        },
      },
    ],
  })

  const setQuery = useCallback(
    (args) => {
      setTable((prevState) => ({
        ...prevState,
        pagination: { ...prevState.pagination, current: 1 },
      }))
      _setQuery(args)
    },
    [setTable]
  )

  const deployRow = (record) => {
    axios
      .get('/bi-auto-deploy/api/admin/task/releaseTask', {
        params: {
          taskId: record.id,
        },
      })
      .then(() => {
        fetchList()
      })
  }

  const pollingTimer = useRef({})

  const refreshRecordStatus = (releasingRecord) => {
    const ids = releasingRecord.map((_) => _.id)
    ids.forEach((id) => {
      axios
        .get(`/bi-auto-deploy/api/user/task/selectById`, {
          params: { id },
        })
        .then(({ data }) => {
          setTable((prevState) => {
            const index = prevState.dataSource.findIndex((item) => item.id === id)
            if (id > -1) {
              return {
                ...prevState,
                dataSource: [
                  ...prevState.dataSource.slice(0, index),
                  {
                    ...prevState.dataSource[index],
                    ...data,
                  },
                  ...prevState.dataSource.slice(index + 1),
                ],
              }
            }
            return prevState
          })
          if (data.status === 'Releasing') {
            pollingTimer.current[id] = setTimeout(() => {
              refreshRecordStatus([{ id }])
            }, 2000)
          }
        })
    })
  }

  const { current: page, pageSize } = table.pagination
  const checkRecord = (record) => {
    history.push(`/autoDeploy/taskDeploy/${record.id}/readonly`)
  }

  const { run: fetchList, loading } = useRequest(
    () => {
      return axios
        .get('/bi-auto-deploy/api/admin/taskForReleased/list', {
          params: {
            ...query,
            date: query.date ? query.date.format('YYYY-MM-01') : '',
            name: query.keyword,
            page,
            pageSize,
          },
        })
        .then(({ data: { list, totalRows: total } }) => {
          const releasing = list.filter((item) => {
            return item.status === 'Releasing'
          })

          if (releasing) {
            setTimeout(() => {
              refreshRecordStatus(releasing)
            })
          }

          setTable((prevState) => ({
            ...prevState,
            dataSource: list,
            pagination: { ...prevState.pagination, total },
          }))
        })
    },
    { manual: true, debounceInterval: 200 }
  )

  useEffect(() => {
    fetchList()
    store.session(`${location.pathname}-query`, {
      ...query,
      page,
      pageSize,
    })
    return function () {
      Object.keys(pollingTimer.current).forEach((timerKey) => {
        // eslint-disable-next-line
        clearTimeout(pollingTimer.current[timerKey])
      })
    }
  }, [page, pageSize, query, fetchList, location.pathname])

  const [exportLoading, setExportLoading] = useState(false)
  const exportRecords = () => {
    setExportLoading(true)
    axios
      .get('/bi-auto-deploy/api/user/taskForReleased/downloadList', {
        params: {
          page: 1,
          pageSize: 10,
          ...query,
          date: query.date ? query.date.format('YYYY-MM-01') : '',
          name: query.keyword,
        },
        timeout: 10 * 60 * 1000, // 10分钟
        responseType: 'blob',
      })
      .then(({ data, headers }) => {
        setExportLoading(false)
        const filename = headers['content-disposition'].match(/filename=(.*)/)[1]
        downloadBlob(data, decodeURIComponent(filename))
      })
      .catch(() => {
        setExportLoading(false)
      })
  }

  const [fileTypes, setFileTypes] = useState([])
  useRequest(() => {
    return axios.get('/bi-auto-deploy/api/user/taskForReleased/queryAllFileType').then(({ data }) => {
      setFileTypes(data)
    })
  })

  return (
    <div className={'p-6'}>
      <div className={'flex items-start mb-2.5 space-x-6'}>
        <div className={'flex-1 grid grid-cols-4 gap-x-6 gap-y-2'}>
          <div className={'flex space-x-2.5'}>
            <span className={'flex-none'}>关键字</span>
            <Input
              className={'flex-1'}
              value={query.keyword}
              allowClear
              placeholder={'关键字'}
              onChange={(e) => setQuery((prevState) => ({ ...prevState, keyword: e.target.value }))}
            />
          </div>
          <div className="flex space-x-2.5">
            <span className={'flex-none'}>任务类型</span>
            <Select
              className={'flex-1'}
              value={query.taskType}
              allowClear
              placeholder={'任务类型'}
              onChange={(v) => setQuery((prevState) => ({ ...prevState, taskType: v }))}>
              {Object.keys(TASK_TYPE).map((key) => {
                return (
                  <Select.Option value={key} key={key}>
                    {TASK_TYPE[key]}
                  </Select.Option>
                )
              })}
            </Select>
          </div>
          <div className="flex space-x-2.5">
            <span className={'flex-none'}>任务状态</span>
            <Select
              className={'flex-1'}
              value={query.taskStatus}
              allowClear
              placeholder={'任务状态'}
              onChange={(v) => setQuery((prevState) => ({ ...prevState, taskStatus: v }))}>
              <Select.Option value={'ToBeReleased'}>待部署</Select.Option>
              <Select.Option value={'ReleasedSuccess'}>部署成功</Select.Option>
            </Select>
          </div>
          <div className="flex space-x-2.5">
            <span className={'flex-none'}>更新年月</span>
            <DatePicker
              value={query.date}
              placeholder={'更新年月'}
              onChange={(date) => setQuery((prevState) => ({ ...prevState, date: date }))}
              allowClear
              className={'flex-1'}
              picker="month"
            />
          </div>
          <div className="flex space-x-2.5">
            <span className={'flex-none'}>创建人</span>
            <ExSelect
              options={userList.map((u) => ({ value: u.idUser, label: u.nameCn }))}
              placeholder={'创建人'}
              className={'flex-1'}
              value={query.creatorIds}
              onChange={(v) => setQuery((prevState) => ({ ...prevState, creatorIds: v }))}
              allowClear
            />
          </div>
          {query.taskType === 'FileDeploy' && (
            <>
              <div className="flex space-x-2.5">
                <span className={'flex-none'}>文件类型</span>
                <ExSelect
                  placeholder={'文件类型'}
                  className={'flex-1'}
                  value={query.deployFileType}
                  allowClear
                  options={fileTypes.map((t) => ({ value: t }))}
                  onChange={(v) => setQuery((prevState) => ({ ...prevState, deployFileType: v }))}
                />
              </div>
              <div className={'flex space-x-2.5'}>
                <span className={'flex-none'}>更新类型</span>
                <Select
                  placeholder={'文件更新类型'}
                  className={'flex-auto'}
                  value={query.fileDeployUpdateType}
                  allowClear
                  onChange={(v) => setQuery((prevState) => ({ ...prevState, fileDeployUpdateType: v }))}>
                  <Select.Option value={'Update'}>更新</Select.Option>
                  <Select.Option value={'Delete'}>删除</Select.Option>
                  <Select.Option value={'Create'}>新建</Select.Option>
                </Select>
              </div>
            </>
          )}
        </div>
        <Tooltip title={'按当前筛选条件导出数据'} placement={'top'}>
          <Button type={'primary'} onClick={exportRecords} loading={exportLoading}>
            条件下载
          </Button>
        </Tooltip>
      </div>

      <Table {...table} loading={loading} />
    </div>
  )
}

export default TaskDeploy
