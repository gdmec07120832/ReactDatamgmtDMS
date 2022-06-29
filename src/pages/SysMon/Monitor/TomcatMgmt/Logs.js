import React, { useCallback, useEffect, useState } from 'react'
import { Button, Input } from 'antd'
import StyledDateRangePicker from '../../../../components/StyledDateRangePicker'
import { useHistory, useLocation } from 'react-router-dom'
import ExTable from '../../../../components/ExTable/ExTable'
import { useRequest } from 'ahooks'
import axios from '../../../../utils/axios'

function Logs() {
  const location = useLocation()
  const history = useHistory()
  const id = location?.state?.id
  const [table, setTable] = useState({
    pagination: {current: 1, pageSize: 10},
    rowKey: 'operId',
    columns: [
      { dataIndex: 'operId', title: '日志编号' },
      { dataIndex: 'operName', title: '操作人员' },
      { dataIndex: 'operIp', title: '主机' },
      { dataIndex: 'operTime', title: '操作时间' },
      {
        dataIndex: 'operType',
        title: '操作类型',
        render(text) {
          return { 1: '关闭', 0: '启动' }[text]
        },
      },
      { dataIndex: 'stopCause', title: '关闭原因' },
      { dataIndex: 'errorMsg', title: '异常信息' },
    ],
  })
  const [query, _setQuery] = useState({
    operName: '',
    tomcatId: id,
    date: null,
  })

  const setQuery = useCallback((args) => {
    setTable((prevState) => ({ ...prevState, pagination: { ...prevState.pagination, current: 1 } }))
    _setQuery(args)
  }, [])

  const goBack = () => {
    history.push('/mon/monitor/tomcat', location.state)
  }

  const {current: page, pageSize} = table.pagination
  const { run: getList } = useRequest(
    () => {
      return axios
        .get('/bi-sys/api/admin/tomcatLog/pageList', {
          params: {
            operName: query.operName,
            tomcatId: query.tomcatId,
            currentPage: page,
            pageSize,
            beginTime: query.date?.[0] ? query.date[0].format('YYYY-MM-DD') : '',
            endTime: query.date?.[1] ? query.date[1].format('YYYY-MM-DD') : '',
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
    { manual: true }
  )

  useEffect(() => {
    getList()
  }, [getList, query, page, pageSize])

  return (
    <div className={'p-6'}>
      <div className={'flex space-x-4 mb-2.5'}>
        <div className={'flex-1 grid grid-cols-4 gap-x-4'}>
          <div className={'flex space-x-2.5'}>
            <span className={'flex-none'}>ID</span>
            <Input
              placeholder={'Tomcat ID'}
              value={query.tomcatId}
              allowClear
              onChange={(e) => setQuery((prevState) => ({ ...prevState, tomcatId: e.target.value }))}
            />
          </div>
          <div className={'flex space-x-2.5'}>
            <span className={'flex-none'}>操作人员</span>
            <Input
              value={query.operName}
              allowClear
              onChange={(e) => setQuery((prevState) => ({ ...prevState, operName: e.target.value }))}
              placeholder={'操作人员名称'}
            />
          </div>
          <div className={'flex space-x-2.5'}>
            <span className={'flex-none'}>操作时间</span>
            <StyledDateRangePicker
              value={query.date}
              onChange={(v) => setQuery((prevState) => ({ ...prevState, date: v }))}
              className={'flex-1'}
            />
          </div>
        </div>
        <Button onClick={goBack}>返回</Button>
      </div>
      <ExTable {...table} setTable={setTable} />
    </div>
  )
}

export default Logs
