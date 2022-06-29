import React, { useEffect, useState } from 'react'
import FieldItem from '../../../components/FieldItem'
import { Button, Input, message, Space, Switch, Table } from 'antd'
import useTable from '../../../hooks/useTable'
import axios from '../../../utils/axios'
import Select from '../../../components/Select'
import { useRequest } from 'ahooks'
import moment from 'moment'
import { CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons'
import UpdateTable from './UpdateTable'
import UpdateColumns from './UpdateColumns'
import styled from 'styled-components'
import StyledDateRangePicker from '../../../components/StyledDateRangePicker'
import {CopyToClipboard} from 'react-copy-to-clipboard';
import {createPortal} from 'react-dom';

const ExpandWrapper = styled.div`
  position: ${props => props.isFull ? 'fixed' : 'static'};
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: ${props => props.isFull ? '0' : '-16px -8px -16px -16px'};
  z-index: 999;
  padding-left: 24px;
  padding-bottom: 8px;
  background: #fff;

  .ant-table-small .ant-table-thead > tr > th {
    background: inherit;
  }

  .ant-table-tbody > tr > td {
    border-bottom: none;
  }

  .ant-table-thead > tr > th {
    border-bottom: none;
  }

  .ant-table-thead .ant-table-cell {
    font-weight: normal !important;
    color: rgba(0, 0, 0, 1);
    padding: ${props => props.isFull ? '2px 8px!important' : ''}
  }

  .ant-table-body .ant-table-cell {
    font-size: 13px;
    color: rgba(0, 0, 0, 0.5);
    padding: ${props => props.isFull ? '2px 8px!important' : ''}
  }
`

const ExpandTable = (props) => {
  const { tableDetails = [], __loading__ } = props
  const [isFull, setIsFull] = useState(false)
  const [text, setText] = useState('')
  const { table, setTable } = useTable({
    rowKey: 'columnName',
    pagination: false,
    rowSelection: {
      selectedRowKeys: [],
      onChange(selectedRowKeys, selectedRows) {
        const text = selectedRows.map(row => {
          return `${row.columnName},${row.columnComments ? '    --' + row.columnComments : ''}`
        }).join('\n')
        setText(text)
        setTable(prevState => ({
          ...prevState,
          rowSelection: {...prevState.rowSelection, selectedRowKeys}
        }))
      },
    },
    scroll: { y: 250 },
    columns: [
      { dataIndex: 'columnName', title: '字段名称' },
      { dataIndex: 'columnComments', title: '字段注释' },
      { dataIndex: 'dataType', title: '字段类型' },
    ],
  })
  useEffect(() => {
    setTable((prevState) => {
      if (JSON.stringify(prevState.dataSource) === JSON.stringify(tableDetails)) {
        return prevState
      } else {
        return {
          ...prevState,
          dataSource: tableDetails,
        }
      }
    })
  }, [tableDetails, setTable])

  const copySelected = () => {
    message.success('已复制')
  }


  const toggle = () => {
    setIsFull(prevState => {
      setTable(_prev => ({
        ..._prev,
        scroll: {y: !prevState ? 'calc(100vh - 80px)' : 250}
      }))
      return !prevState
    })

  }

  const Comp = (
    <ExpandWrapper isFull={isFull}>
      <div className={'ml-9 pt-2 space-x-2'}>
        {
          !!table.rowSelection.selectedRowKeys.length &&
            <CopyToClipboard text={text} onCopy={copySelected}>
              <Button size={'small'}>复制选中字段</Button>
            </CopyToClipboard>

        }
        <Button size={'small'} onClick={toggle}>{isFull ? '退出全屏': '全屏查看'}</Button>
      </div>
      <Table {...table} loading={__loading__} />
    </ExpandWrapper>
  )
  return isFull ? createPortal(Comp, document.body) : Comp
}

const getOptionList = (field) => {
  return axios
    .get('/bi-metadata/api/user/dataWarehouseModel/getFactDmsTavleViveDColValue', {
      params: {
        columnName: field,
        keyword: '',
      },
    })
    .then(({ data }) => {
      return Promise.resolve(data)
    })
}

// 获取表的字段详情
const getTableDetail = (owner, tableName) => {
  return axios
    .get('/bi-metadata/api/user/dataWarehouseModel/getColumnsByOwnerAndTableName', {
      params: {
        owner,
        tableName,
      },
    })
    .then(({ data }) => {
      return Promise.resolve(data)
    })
}

const FLAG_OPTIONS = [
  { label: '是', value: '是' },
  { label: '否', value: '否' },
]

const initialSelection = {
  TABLE_NAME: [],
  TABLESPACE_NAME: [],
  OWNER: [],
}

const selectionKeys = Object.keys(initialSelection)

function DatabaseModelDesign() {
  const { table, setTable } = useTable({
    rowKey: (record) => {
      return record.owner + record.tableName
    },
    scroll: { x: 1400 },
    expandable: {
      expandedRowClassName: () => {
        return 'expand-row-class'
      },
      expandedRowKeys: [],
      expandedRowRender: (record, index, indent, expanded) => (expanded ? <ExpandTable {...record} /> : null),
      expandIcon: ({ expanded, onExpand, record }) => {
        return expanded ? (
          <CaretDownOutlined className={'cursor-pointer text-gray-500 block'} onClick={(e) => onExpand(record, e)} />
        ) : (
          <CaretRightOutlined className={'cursor-pointer text-gray-500 block'} onClick={(e) => onExpand(record, e)} />
        )
      },
      onExpand: (expanded, record) => {
        /** @member tableDetails */
        setTable((prevState) => {
          return {
            ...prevState,
            expandable: {
              ...prevState.expandable,
              expandedRowKeys: expanded ? [record.owner + record.tableName] : [],
            },
          }
        })
        if (expanded && !record.tableDetails) {
          // fetch detail
          const { owner, tableName } = record
          setTable((prevState) => {
            const index = prevState.dataSource.findIndex(
              (item) => item.owner === record.owner && item.tableName === record.tableName
            )
            if (index > -1) {
              return {
                ...prevState,
                dataSource: [
                  ...prevState.dataSource.slice(0, index),
                  {
                    ...record,
                    __loading__: true,
                  },
                  ...prevState.dataSource.slice(index + 1),
                ],
              }
            } else {
              return prevState
            }
          })
          getTableDetail(owner, tableName).then((data) => {
            setTable((prevState) => {
              const index = prevState.dataSource.findIndex(
                (item) => item.owner === record.owner && item.tableName === record.tableName
              )
              if (index > -1) {
                return {
                  ...prevState,
                  dataSource: [
                    ...prevState.dataSource.slice(0, index),
                    {
                      ...record,
                      __loading__: false,
                      tableDetails: data,
                    },
                    ...prevState.dataSource.slice(index + 1),
                  ],
                }
              } else {
                return prevState
              }
            })
          })
        }
      },
    },
    columns: [
      { dataIndex: 'tablespaceName', title: '表空间', width: 150 },
      { dataIndex: 'owner', title: '用户名', width: 120 },
      { dataIndex: 'tableName', title: '表名' },
      { dataIndex: 'tabComments', title: '表注释', width: 150 },
      { dataIndex: 'tableVolumeM', title: '数据体积(M)', width: 100 },
      { dataIndex: 'loadTime', title: '数据更新日期', width: 160 },
      {
        dataIndex: 'showFlag',
        title: '是否显示',
        width: 80,
        render: (text, row) => {
          return (
            <Switch
              defaultChecked={text === '是'}
              onChange={(v) => handleChangeFlag('showFlag', row, v)}
              checkedChildren="是"
              unCheckedChildren="否"
            />
          )
        },
      },
      {
        dataIndex: 'checkDataLoadFlag',
        title: '监控数据更新频率',
        width: 140,
        render: (text, row) => {
          return (
            <Switch
              defaultChecked={text === '是'}
              onChange={(v) => handleChangeFlag('checkDataLoadFlag', row, v)}
              checkedChildren="是"
              unCheckedChildren="否"
            />
          )
        },
      },
      {
        dataIndex: 'actions',
        title: '操作',
        width: 140,
        fixed: 'right',
        render: (text, row) => {
          const { auditing } = row
          return auditing ? (
            '审核中...'
          ) : (
            <Space>
              <Button onClick={() => updateTable(row)} size={'small'} type={'link'}>
                更新表
              </Button>
              <Button onClick={() => updateColumns(row)} size={'small'} type={'link'}>
                更新字段
              </Button>
            </Space>
          )
        },
      },
    ],
  })
  const [currentUpdateTableRow, setCurrentUpdateTableRow] = useState(null)
  const updateTable = (row) => {
    setCurrentUpdateTableRow(row)
  }

  const [currentUpdateColumnsRow, setCurrentUpdateColumnsRow] = useState(null)
  const updateColumns = (row) => {
    setCurrentUpdateColumnsRow(row)
  }

  const handleChangeFlag = (type, row, flag) => {
    let url
    if (type === 'showFlag') {
      url = '/bi-metadata/api/user/dataWarehouseModel/updateShowFlagByOwnerAndTableName'
    } else {
      url = '/bi-metadata/api/user/dataWarehouseModel/updateCheckDataLoadFlagByOwnerAndTableName'
    }
    axios
      .get(url, {
        params: {
          [type]: flag ? '是' : '否',
          owner: row.owner,
          tableName: row.tableName,
        },
      })
      .then(() => {
        getList()
      })
  }

  const [selection, setSelection] = useState(initialSelection)
  // 获取查询条件中的select option
  useEffect(() => {
    selectionKeys.forEach((key) => {
      getOptionList(key).then((data) =>
        setSelection((prevState) => ({
          ...prevState,
          [key]: (data || []).map((item) => ({
            label: item,
            value: item,
          })),
        }))
      )
    })
  }, [])

  const [query, setQuery] = useState({
    dateRange: [],
    checkDataLoadFlag: undefined,
    owner: undefined,
    showFlag: undefined,
    tabComments: undefined,
    tableName: undefined,
    tableVolumeM: undefined,
    tablespaceName: undefined,
  })

  // 获取列表
  const { current: page, pageSize } = table.pagination
  const { dateRange, ...restQuery } = query
  const { run: getList, loading } = useRequest(
    () => {
      return axios
        .get('/bi-metadata/api/admin/dataWarehouseModel/listTableModel', {
          params: {
            page,
            pageSize,
            ...restQuery,
            startLoadTime: dateRange?.[0] ? moment(dateRange?.[0]).format('YYYY-MM-DD HH:mm:ss') : undefined,
            endLoadTime: dateRange?.[1] ? moment(dateRange?.[1]).format('YYYY-MM-DD HH:mm:ss') : undefined,
          },
        })
        .then(({ data: { list, totalRows: total } }) => {
          setTable((prevState) => ({
            ...prevState,
            expandable: {
              ...prevState.expandable,
              expandedRowKeys: [],
            },
            dataSource: list,
            pagination: { ...prevState.pagination, total },
          }))
        })
    },
    { manual: true, debounceInterval: 200 }
  )

  useEffect(() => {
    getList()
  }, [page, pageSize, getList, query])

  return (
    <div className={'px-6 py-6'}>
      <div className={'flex-1 grid grid-cols-4 gap-x-6 gap-y-4 mb-3'}>
        <FieldItem label={'表空间'} labelWidth={90} labelAlign={'left'}>
          <Select
              placeholder={'表空间'}
              value={query.tablespaceName}
              onChange={(v) => setQuery((prevState) => ({ ...prevState, tablespaceName: v }))}
              options={selection.TABLESPACE_NAME}
              allowClear
          />
        </FieldItem>
        <FieldItem label={'用户名'} labelWidth={90} labelAlign={'left'}>
          <Select
              placeholder={'用户名'}
              value={query.owner}
              onChange={(v) => setQuery((prevState) => ({ ...prevState, owner: v }))}
              options={selection.OWNER}
              allowClear
          />
        </FieldItem>
        <FieldItem label={'表名'} labelWidth={90} labelAlign={'left'}>
          <Select
              placeholder={'表名'}
              value={query.tableName}
              onChange={(v) => setQuery((prevState) => ({ ...prevState, tableName: v }))}
              options={selection.TABLE_NAME}
              allowClear
          />
        </FieldItem>
        <FieldItem label={'是否显示'} labelWidth={90} labelAlign={'left'}>
          <Select
              placeholder={'是否显示'}
              value={query.showFlag}
              onChange={(v) => setQuery((prevState) => ({ ...prevState, showFlag: v }))}
              options={FLAG_OPTIONS}
              showSearch={false}
              allowClear
          />
        </FieldItem>
        <FieldItem label={'监控数据更新'} labelWidth={90} labelAlign={'left'}>
          <Select
              placeholder={'监控数据更新频率'}
              value={query.checkDataLoadFlag}
              onChange={(v) => setQuery((prevState) => ({ ...prevState, checkDataLoadFlag: v }))}
              options={FLAG_OPTIONS}
              showSearch={false}
              allowClear
          />
        </FieldItem>
        <FieldItem label={'表注释'} labelWidth={90} labelAlign={'left'}>
          <Input
              placeholder={'表注释'}
              value={query.tabComments}
              allowClear
              onChange={(e) => setQuery((prevState) => ({ ...prevState, tabComments: e.target.value }))}
              className={'flex-1'}
          />
        </FieldItem>
        <FieldItem label={'更新日期'} labelWidth={90} labelAlign={'left'}>
          <StyledDateRangePicker
              value={query.dateRange}
              showTime
              onChange={(v) => setQuery((prevState) => ({ ...prevState, dateRange: v }))}
              className={'flex-1'}
          />
        </FieldItem>
        <FieldItem label={'数据体积'} labelWidth={90} labelAlign={'left'}>
          <Input.Group compact>
            <Input defaultValue={'>='} readOnly style={{ width: 50 }} />
            <Input
                placeholder={'数据体积'}
                allowClear
                value={query.tableVolumeM}
                onChange={(e) => setQuery((prevState) => ({ ...prevState, tableVolumeM: e.target.value }))}
                style={{ width: 'calc(100% - 50px)' }}
            />
          </Input.Group>
        </FieldItem>
      </div>

      <div className={'mt-2'}>
        <Table {...table} loading={loading} />
      </div>
      <UpdateTable current={currentUpdateTableRow} setCurrent={setCurrentUpdateTableRow} refreshPage={getList} />
      <UpdateColumns current={currentUpdateColumnsRow} setCurrent={setCurrentUpdateColumnsRow} refreshPage={getList} />
    </div>
  )
}

export default DatabaseModelDesign
