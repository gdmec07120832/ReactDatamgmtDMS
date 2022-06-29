import React, { useEffect, useState } from 'react'
import DraggableModal from '../../../components/DraggableModal'
import { Button, Input, Select, Table, Tag } from 'antd'
import StyledDateRangePicker from '../../../components/StyledDateRangePicker'
import useTable from '../../../hooks/useTable'
import { useRequest } from 'ahooks'
import axios from '../../../utils/axios'

function LogTableModal(props) {
  const { record, setRecord } = props
  const close = () => {
    setRecord(null)
    setTable(prevState => ({
      ...prevState,
      dataSource: [],
      pagination: {...prevState.pagination, total: 0}
    }))
  }
  const [query, setQuery] = useState({
    result: undefined,
    keyword: undefined,
    timeRange: [],
  })

  const { table, setTable } = useTable({
    scroll: { y: 400 },
    columns: [
      {
        dataIndex: 'status',
        title: '执行结果',
        render(text) {
          return text === 1 ? (
            <Tag color={'success'}>成功</Tag>
          ) : text === -1 ? (
            <Tag color={'error'}>失败</Tag>
          ) : text === null ? (
            <Tag color={'warning'}>暂无</Tag>
          ) : (
            <Tag color={'processing'}>进行中</Tag>
          )
        },
        align: 'center',
        width: 75,
      },
      {
        dataIndex: 'result',
        title: '校验结果',
        render(text) {
          return text === 1 ? <Tag color={'success'}>成功</Tag> : text === -1 ? <Tag color={'error'}>失败</Tag> : ''
        },
        align: 'center',
        width: 75,
      },
      { dataIndex: 'tempName', title: '规则模版', align: 'center', width: 120 },
      { dataIndex: 'ruleName', title: '规则名称', align: 'center', width: 180 },
      { dataIndex: 'sqlStr', title: '执行脚本', align: 'center' },
      { dataIndex: 'errorMsg', title: '日志', align: 'center' },
      { dataIndex: 'startTime', title: '执行时间', align: 'center', width: 180 },
      { dataIndex: 'burningTime', title: '耗时(ms)', align: 'center', width: 80 },
      { dataIndex: 'weights', title: '权重', width: 80, align: 'center' },
    ],
  })

  const { schemeId, ruleId } = record || {}
  const { current: page, pageSize } = table.pagination
  const { timeRange, keyword, result } = query
  const [_startTime, _endTime] = timeRange || []
  const startTime = _startTime ? _startTime.format('YYYY-MM-DD HH:mm:ss') : undefined
  const endTime = _endTime ? _endTime.format('YYYY-MM-DD HH:mm:ss') : undefined
  const { run: getList, loading } = useRequest(
    () => {
      return axios
        .get('/bi-data-quality/api/user/ruleLog/selectRuleLogBySchemeId', {
          params: {
            schemeId,
            ruleId,
            page,
            pageSize,
            keyword,
            result,
            startTime,
            endTime,
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

  useEffect(() => {
    if (record) {
      getList()
    }
  }, [getList, record, page, pageSize, query])

  return (
    <DraggableModal width={'70vw'} title={'日志记录'} destroyOnClose visible={!!record} footer={null} onCancel={close}>
      <div>
        <div className={'flex mb-3'}>
          <div className={'flex-1 grid grid-cols-3 gap-x-4'}>
            <div className={'flex'}>
              <span>校验结果：</span>
              <Select
                className={'flex-1'}
                value={query.result}
                onChange={(value) => setQuery((prevState) => ({ ...prevState, result: value }))}
                placeholder="校验结果"
                allowClear>
                <Select.Option value={1}>
                  <Tag color={'success'}>成功</Tag>
                </Select.Option>
                <Select.Option value={-1}>
                  <Tag color={'error'}>失败</Tag>
                </Select.Option>
              </Select>
            </div>
            <div className={'flex'}>
              <span>关键字：</span>
              <Input
                className={'flex-1'}
                value={query.keyword}
                allowClear
                onChange={(e) => setQuery((prevState) => ({ ...prevState, keyword: e.target.value }))}
                placeholder={'规则名称、执行脚本'}
              />
            </div>
            <div className={'flex'}>
              <span>执行时间：</span>
              <StyledDateRangePicker
                allowEmpty={[true, true]}
                className={'flex-1'}
                value={query.timeRange}
                onChange={(value) =>
                  setQuery((prevState) => ({
                    ...prevState,
                    timeRange: value,
                  }))
                }
                showTime
              />
            </div>
          </div>
          <div className={'ml-4'}>
            <Button type={'primary'} onClick={getList}>刷新</Button>
          </div>
        </div>

        <Table {...table} loading={loading} />
      </div>
    </DraggableModal>
  )
}

export default LogTableModal
