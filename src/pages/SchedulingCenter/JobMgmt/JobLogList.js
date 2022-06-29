import React, { useEffect, useState } from 'react'
import {useHistory, useRouteMatch} from 'react-router-dom'
import {Button, DatePicker, Table, Tag} from 'antd'
import useTable from '../../../hooks/useTable'
import { useRequest } from 'ahooks'
import axios from '../../../utils/axios'
import LogDetailModal from './LogDetailModal'
import {RollbackOutlined} from '@ant-design/icons';

function JobLogList() {
  const routeMatch = useRouteMatch()
  const { id } = routeMatch.params
  // const location = useLocation()
  const history = useHistory()
  // const dispatch = useDispatch()
  //
  // useEffect(() => {
  //   const payload = location.state?.payload
  //   if (!payload?.id) {
  //     history.push('/schedulingCenter/jobMgmt')
  //     return
  //   }
  //   dispatch('set_breadcrumb_params', payload)
  // }, [location, dispatch, history])

  const { table, setTable } = useTable({
    rowKey: 'id',
    columns: [
      { dataIndex: 'id', title: 'ID', width: 100 },
      { dataIndex: 'executeDate', title: '执行时间', width: 155 },
      { dataIndex: 'startDate', title: '开始时间', width: 155 },
      { dataIndex: 'endDate', title: '结束时间', width: 155 },
      { dataIndex: 'groupName', title: '分组名称' },
      { dataIndex: 'jobName', title: '作业名称', width: 260 },
      { dataIndex: 'host', title: '执行主机' },
      {
        dataIndex: 'status',
        title: '状态',
        render(text) {
          return <Tag color={{'-1': 'error', 0: 'warning', 1: 'success'}[text]}>{{ '-1': '失败', 0: '运行中', 1: '成功' }[text]}</Tag>
        },
      },
      {
        dataIndex: 'repeatStatus',
        title: '重跑状态',
        render(text) {
          return { '-1': '不需要重跑', 0: '重跑中', 1: '重跑完成' }[text]
        },
      },
      {
        dataIndex: 'isOverTime',
        title: '是否超时',
        render(text) {
          return text ? '是' : '否'
        },
      },
      {
        dataIndex: 'actions',
        title: '操作',
        width: 100,
        render(text, row) {
          return (
            <Button type={'link'} size={'small'} onClick={checkDetail.bind(null, row)}>
              详情
            </Button>
          )
        },
      },
    ],
  })

  const [query, setQuery] = useState({
    startDate: null,
    endDate: null,
  })
  const { current: page, pageSize } = table.pagination
  const { run: getList, loading } = useRequest(
    () => {
      return axios
        .get('/bi-task-scheduling-system/api/user/jobLog/queryJobLog', {
          params: {
            jobId: id,
            page,
            rows: pageSize,
            startDate: query.startDate ? query.startDate.format('YYYY-MM-DD HH:mm:ss') : null,
            endDate: query.endDate ? query.endDate.format('YYYY-MM-DD HH:mm:ss') : null,
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
    { manual: true, debounceInterval: 300 }
  )

  useEffect(() => {
    getList()
  }, [page, pageSize, getList, query])

  const [currentRow, setCurrentRow] = useState(null)
  const checkDetail = (row) => {
    setCurrentRow(row)
  }

  const goBack = () => {
    history.push('/schedulingCenter/jobMgmt')
  }

  return (
    <div className={'p-6'}>
      <div className={'mb-3 flex justify-between'}>
        <div className={'grid grid-cols-4 gap-x-6'}>
          <div className={'flex'}>
            <span>开始时间：</span>
            <DatePicker
              placeholder={'开始时间'}
              value={query.startDate}
              onChange={(v) => setQuery((prevState) => ({ ...prevState, startDate: v }))}
              className={'flex-1'}
              showTime
            />
          </div>
          <div className={'flex'}>
            <span>结束时间：</span>
            <DatePicker
              placeholder={'结束时间'}
              value={query.endDate}
              onChange={(v) => setQuery((prevState) => ({ ...prevState, endDate: v }))}
              className={'flex-1'}
              showTime
            />
          </div>
        </div>
        <div>
          <Button icon={<RollbackOutlined />} onClick={goBack}>
            返回
          </Button>
        </div>
      </div>
      <Table {...table} loading={loading} />

      <LogDetailModal currentRow={currentRow} setCurrentRow={setCurrentRow} />
    </div>
  )
}

export default JobLogList
