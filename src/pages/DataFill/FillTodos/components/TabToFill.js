import React, { useContext, useEffect, useState } from 'react'
import TableQuery from '../../../../components/TableQuery'
import { Button, DatePicker, Input, Table } from 'antd'
import useTable from '../../../../hooks/useTable'
import useUserList from '../../../../hooks/useUserList'
import Select from '../../../../components/Select'
import { useRequest } from 'ahooks'
import axios from '../../../../utils/axios'
import { FILL_IN_STATE, tranFrequency } from './utils'
import OverflowTooltip from '../../../../components/OverflowTooltip'
import { useHistory } from 'react-router-dom'
import { CateContext } from '../TodoIndex'
import ExSelect from '../../../../components/Select'
import moment from 'moment'

const initialQuery = {
  dataFieldId: undefined,
  oneTier: undefined,
  twoTier: undefined,
  excelName: '',
  categoryId: undefined,
  submitorId: undefined,
  workbenchState: undefined,
  timeRange: [],
}
function TabToFill() {
  const context = useContext(CateContext)
  const { dataFields, level1List, level2List } = context
  const history = useHistory()
  const { table, setTable } = useTable({
    rowKey: 'id',
    scroll: {x: 1600},
    dataSource: [],
    columns: [
      {
        dataIndex: 'excelName',
        title: '模板名称',
        render(text) {
          return (
            <div className={'break-all'}>
             {text}
            </div>
          )
        },
      },
      {dataIndex: 'tableName', title: '数据库表', render(text) {
          return <div className={'break-all'}>{text}</div>;
        }},
      {
        dataIndex: 'betweenDaysNumber',
        title: '截止时间',
        width: 100,
        render(text, row) {
          const { importFrequency, betweenDaysNumber } = row
          return importFrequency === 'AnyTime' ? (
            '/'
          ) : (
            <span
              className={'font-bold'}
              style={{ color: betweenDaysNumber <= 0 ? '#f93920' : betweenDaysNumber <= 1 ? '#fc8800' : '' }}>
              {betweenDaysNumber < 0 ? `超过${Math.abs(betweenDaysNumber)}天` : `剩余${betweenDaysNumber}天`}
            </span>
          )
        },
      },
      { dataIndex: 'categoryName', title: '第二层分类', width: 120 },
      { dataIndex: 'oneTierName', title: '第一层分类', width: 100 },
      { dataIndex: 'dataFieldName', title: '数据域', width: 100 },
      {
        dataIndex: 'updateFrequency',
        title: '更新频次',
        width: 150,
        render(text, row) {
          const { importFrequency, frequencyType, cutTime, daysOfMonth, daysOfWeek, monthOfYear } = row
          return tranFrequency(importFrequency, frequencyType, { cutTime, daysOfMonth, daysOfWeek, monthOfYear })
        },
      },
      {
        dataIndex: 'excelAudit',
        title: '是否需要审批',
        render(text) {
          return text ? '是' : '否'
        },
        width: 120,
      },
      {
        dataIndex: 'workbenchState',
        title: '填报状态',
        width: 80,
        render(text) {
          return FILL_IN_STATE[text]
        },
      },
      { dataIndex: 'submitorName', title: '提交人', width: 80 },
      { dataIndex: 'updateTime', title: '最后更新时间', width: 160, },
      {
        dataIndex: 'endDate',
        title: '下次填报时间',
        width: 160,
        render(text, row) {
          return <OverflowTooltip>{text ? text + ' ' + row.cutTime : '/'}</OverflowTooltip>
        },
      },
      {
        dataIndex: 'actions',
        title: '操作',
        width: 80,
        fixed: 'right',
        render(text, row) {
          return (
            <>
              <Button type={'link'} size={'mini'} onClick={() => jumpToFillPage(row)}>
                去填报
              </Button>
            </>
          )
        },
      },
    ],
  })

  const jumpToFillPage = (row) => {
    history.push(`/dataFill/todo/templateRecord/record/${row.id}`)
  }

  const userList = useUserList()

  const [query, setQuery] = useState(initialQuery)
  const { current: page, pageSize } = table.pagination
  const { run: getList, loading } = useRequest(
    () => {
      const { timeRange, ...restQuery } = query
      const [start, end] = timeRange || []
      const tempStartTime = start ? start.format('YYYY-MM-DD HH:mm:ss') : null
      const tempEndTime = end ? end.format('YYYY-MM-DD HH:mm:ss') : null
      return axios
        .get('/bi-data-reporting/api/user/workbench/workbenchToBeReportedInfo', {
          params: {
            page,
            pageSize,
            tempStartTime,
            tempEndTime,
            ...restQuery,
          },
        })
        .then(({ data: { list, totalRows: total } }) => {
          setTable((prev) => ({
            ...prev,
            dataSource: list,
            pagination: { ...prev.pagination, total },
          }))
        })
    },
    { manual: true, debounceInterval: 100 }
  )

  useEffect(() => {
    getList()
  }, [page, pageSize, getList])

  const handleSearch = () => {
    setTable((prevState) => ({
      ...prevState,
      pagination: { ...prevState.pagination, current: 1 },
    }))
    getList()
  }

  return (
    <>
      <TableQuery onSearch={handleSearch} onReset={() => setQuery(initialQuery)}>
        <div className={'flex justify-start'}>
          <div className={'flex-none w-21'}>数据域</div>
          <ExSelect
            value={query.dataFieldId}
            onChange={(v) => setQuery((prevState) => ({ ...prevState, dataFieldId: v }))}
            className={'flex-1'}
            options={dataFields}
            placeholder={'数据域'}
            allowClear
          />
        </div>
        <div className={'flex justify-start'}>
          <div className={'flex-none w-21'}>第一层分类</div>
          <ExSelect
            value={query.oneTier}
            onChange={(v) => setQuery((prevState) => ({ ...prevState, oneTier: v }))}
            className={'flex-1'}
            options={level1List.map(item => ({label: item.label, value: item.value}))}
            placeholder={'第一层分类'}
            allowClear
          />
        </div>
        <div className={'flex justify-start'}>
          <div className={'flex-none w-21'}>第二层分类</div>
          <ExSelect
            value={query.twoTier}
            onChange={(v) => setQuery((prevState) => ({ ...prevState, twoTier: v }))}
            className={'flex-1'}
            options={Array.from(new Set(level2List.map((item) => item.name))).map((item) => ({
              label: item,
              value: item,
            }))}
            placeholder={'第二层分类'}
            allowClear
          />
        </div>
        <div className={'flex justify-start'}>
          <div className={'flex-none w-21'}>填报关键字</div>
          <Input
            value={query.excelName}
            onChange={(e) => setQuery((prev) => ({ ...prev, excelName: e.target.value }))}
            className={'flex-1'}
            allowClear
            placeholder={'模板名/数据库表名称'}
          />
        </div>
        <div className={'flex justify-start'}>
          <div className={'flex-none w-21'}>提交人</div>
          <Select
            value={query.submitorId}
            onChange={(v) => setQuery((prev) => ({ ...prev, submitorId: v }))}
            allowClear
            options={userList.map((u) => ({ value: u.idUser, label: u.nameCn }))}
            placeholder={'提交人'}
          />
        </div>
        <div className={'flex justify-start'}>
          <div className={'flex-none w-21'}>填报状态</div>
          <Select
            value={query.workbenchState}
            onChange={(v) => setQuery((prev) => ({ ...prev, workbenchState: v }))}
            options={['FillInTheImport', 'FillInReject'].map((key) => {
              return {
                label: FILL_IN_STATE[key],
                value: key,
              }
            })}
            allowClear
            placeholder={'填报状态'}
          />
        </div>
        <div className={'flex justify-start'}>
          <div className={'flex-none w-21'}>下次填报</div>
          <DatePicker.RangePicker
            value={query.timeRange}
            onChange={(v) => setQuery((prevState) => ({ ...prevState, timeRange: v }))}
            className={'flex-1'}
            showTime={{
              hideDisabledOptions: true,
              defaultValue: [moment('00:00:00', 'HH:mm:ss'), moment('11:59:59', 'HH:mm:ss')],
            }}
          />
        </div>
      </TableQuery>

      <Table className={'mt-3'} {...table} loading={loading} />
    </>
  )
}

export default TabToFill
