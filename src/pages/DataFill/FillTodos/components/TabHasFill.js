import React, { useContext, useEffect, useState } from 'react'
import TableQuery from '../../../../components/TableQuery'
import { Button, Input, Table } from 'antd'
import useTable from '../../../../hooks/useTable'
import useUserList from '../../../../hooks/useUserList'
import { CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons'
import Select from '../../../../components/Select'
import { useRequest } from 'ahooks'
import axios from '../../../../utils/axios'
import OverflowTooltip from '../../../../components/OverflowTooltip'
import { FILL_IN_STATE, tranFrequency, useExpandTableStyle } from './utils'
import { useHistory } from 'react-router-dom'
import ViewFileDataModal from './ViewFileDataModal'
import ExSelect from '../../../../components/Select'
import { CateContext } from '../TodoIndex'

const ExpandTable = (props) => {
  const classes = useExpandTableStyle()
  const { importRecords } = props
  const [current, setCurrent] = useState(null)
  const { table } = useTable({
    rowKey: 'id',
    pagination: {
      hideOnSinglePage: true,
      pageSize: 8,
      pageSizeOptions: [8],
      size: 'default',
    },
    dataSource: importRecords,
    columns: [
      {
        dataIndex: 'fileName',
        title: '文件名',
        render: (text, record) => {
          return (
            <div className={'break-all'} title={text}>
              <a href={axios.defaults.baseURL + record['filePath']} download={text}>
                {text}
              </a>
            </div>
          )
        },
      },
      {
        dataIndex: 'recordState',
        title: '填报状态',
        render(text) {
          return FILL_IN_STATE[text]
        },
      },
      { dataIndex: 'submitorName', title: '提交人' },
      { dataIndex: 'submitDate', title: '提交日期' },
      { dataIndex: 'auditDate', title: '审批日期' },
      {
        dataIndex: 'actions',
        title: '操作',
        width: 120,
        render: (text, row) => {
          return (
            <Button type={'link'} size={'small'} onClick={() => handleCheck(row)}>
              查看数据
            </Button>
          )
        },
      },
    ],
  })

  const handleCheck = (row) => {
    setCurrent(row)
  }

  return (
    <div className={'pt-5 pb-2 pr-8 shadow-2xl shadow-inner'} style={{ margin: -8 }}>
      <Table {...table} className={classes.expandInnerTable} />
      <ViewFileDataModal current={current} setCurrent={setCurrent} />
    </div>
  )
}

const initialQuery = {
  dataFieldId: undefined,
  oneTier: undefined,
  twoTier: undefined,
  excelName: '',
  categoryId: undefined,
  submitorId: undefined,
  workbenchState: undefined,
}

function TabHasFill() {
  const context = useContext(CateContext)
  const { dataFields, level1List, level2List } = context
  const history = useHistory()
  const { table, setTable } = useTable({
    rowKey: 'id',
    scroll: {x: 1400},
    rowClassName: (record) => {
      return record.__expanded__ ? 'custom-table-expanded-row' : ''
    },
    expandable: {
      expandedRowKeys: [],
      expandedRowRender: (record) => <ExpandTable {...record} />,
      expandIcon: ({ expanded, onExpand, record }) => {
        return expanded ? (
          <CaretDownOutlined className={'cursor-pointer text-gray-400 block'} onClick={(e) => onExpand(record, e)} />
        ) : (
          <CaretRightOutlined className={'cursor-pointer text-gray-400 block'} onClick={(e) => onExpand(record, e)} />
        )
      },
      expandRowByClick: true,
      onExpand: (expanded, record) => {
        setTable((prevState) => {
          const prevRow = prevState.dataSource.find((item) => item.id === prevState.expandable.expandedRowKeys[0])
          if (prevRow) {
            prevRow.__expanded__ = false
          }
          record.__expanded__ = expanded
          return {
            ...prevState,
            expandable: {
              ...prevState.expandable,
              expandedRowKeys: expanded ? [record.id] : [],
            },
          }
        })
      },
    },
    columns: [
      {
        dataIndex: 'excelName',
        title: '模板名称',
        render(text) {
          return (
            <OverflowTooltip title={text}>
              <div className={'py-1'}>{text}</div>
            </OverflowTooltip>
          )
        },
      },
      {dataIndex: 'tableName', title: '数据库表', render(text) {
          return <div className={'break-all'}>{text}</div>;
        }},
      {
        dataIndex: 'updateFrequency',
        title: '更新频次',
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
        fixed: 'right',
        width: 120,
        render(text, row) {
          return (
            <Button type={'link'} size={'small'} onClick={(e) => checkAllData(e, row)}>
              查看全部数据
            </Button>
          )
        },
      },
    ],
  })

  const checkAllData = (e, row) => {
    e.stopPropagation()
    history.push(`/dataFill/fill/templateRecord/allData/${row.id}`)
  }

  const userList = useUserList()

  const [query, setQuery] = useState(initialQuery)
  const { current: page, pageSize } = table.pagination
  const { run: getList, loading } = useRequest(
    () => {
      return axios
        .get('/bi-data-reporting/api/user/workbench/filedInInfo', {
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
            onChange={(e) => setQuery((prevState) => ({ ...prevState, excelName: e.target.value }))}
            className={'flex-1'}
            allowClear
            placeholder={'模板名/数据库表名'}
          />
        </div>
        <div className={'flex justify-start'}>
          <div className={'flex-none w-21'}>提交人</div>
          <Select
            value={query.submitorId}
            onChange={(v) => setQuery((prevState) => ({ ...prevState, submitorId: v }))}
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

export default TabHasFill
