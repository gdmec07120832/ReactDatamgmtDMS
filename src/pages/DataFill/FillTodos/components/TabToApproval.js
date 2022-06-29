import React, { useContext, useEffect, useState } from 'react'
import TableQuery from '../../../../components/TableQuery'
import { Button, Input, Table } from 'antd'
import useTable from '../../../../hooks/useTable'

import useUserList from '../../../../hooks/useUserList'
import Select from '../../../../components/Select'
import { useRequest } from 'ahooks'
import axios from '../../../../utils/axios'
import { tranFrequency } from './utils'
import OverflowTooltip from '../../../../components/OverflowTooltip'
import { useHistory } from 'react-router-dom'
import { CateContext } from '../TodoIndex'
import ExSelect from '../../../../components/Select'

const initialQuery = {
  dataFieldId: undefined,
  oneTier: undefined,
  twoTier: undefined,
  excelName: '',
  categoryId: undefined,
  submitorId: undefined,
}

function TabToApproval() {
  const context = useContext(CateContext)
  const { dataFields, level1List, level2List } = context
  const { table, setTable } = useTable({
    rowKey: 'id',
    scroll: {x: 1400},
    dataSource: [],
    columns: [
      {
        dataIndex: 'fileName',
        title: '文件名称',
        render(text, row) {
          return (
            <div>
              <div className={'break-all line-clamp-3'} title={text}>
                {text}
              </div>
              <OverflowTooltip title={row.excelName}>
                <div className={'py-1'} style={{ color: 'rgba(0, 0, 0, .45)', fontSize: 12 }}>
                  模板：{row.excelName}
                </div>
              </OverflowTooltip>
            </div>
          )
        },
      },
      {
        dataIndex: 'updateFrequency',
        title: '更新频次',
        width: 150,
        render(text, row) {
          const { importFrequency, frequencyType, cutTime, daysOfMonth, daysOfWeek, monthOfYear } = row
          return tranFrequency(importFrequency, frequencyType, { cutTime, daysOfMonth, daysOfWeek, monthOfYear })
        },
      },
      { dataIndex: 'categoryName', title: '第二层分类', width: 120 },
      { dataIndex: 'oneTierName', title: '第一层分类', width: 100 },
      { dataIndex: 'dataFieldName', title: '数据域', width: 100 },
      {
        dataIndex: 'excelAudit',
        title: '是否需要审批',
        width: 120,
        render(text) {
          return text ? '是' : '否'
        },
      },
      { dataIndex: 'submitorName', title: '提交人', width: 120 },
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
        render() {
          return (
            <Button type={'link'} size={'small'} onClick={jumpToApprovalPage}>
              去审批
            </Button>
          )
        },
      },
    ],
  })
  const history = useHistory()
  const userList = useUserList()
  const [query, setQuery] = useState(initialQuery)

  const { current: page, pageSize } = table.pagination
  const { run: getList, loading } = useRequest(
    () => {
      return axios
        .get('/bi-data-reporting/api/user/workbench/queryPendingInfo', {
          params: {
            page,
            pageSize,
            ...query,
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
    {
      manual: true,
      debounceInterval: 100,
    }
  )

  const jumpToApprovalPage = () => {
    history.push('/dataFill/fill/fillAudit', {
      query: {
        status: 0,
      },
    })
  }

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
            placeholder={'模板名/数据库表名'}
          />
        </div>
        <div className={'flex justify-start'}>
          <div className={'flex-none w-21'}>提交人</div>
          <Select
            value={query.submitorId}
            onChange={(v) => setQuery((prev) => ({ ...prev, submitorId: v }))}
            allowClear
            placeholder={'提交人'}
            options={userList.map((u) => ({ value: u.idUser, label: u.nameCn }))}
          />
        </div>
      </TableQuery>

      <Table className={'mt-3'} {...table} loading={loading} />
    </>
  )
}

export default TabToApproval
