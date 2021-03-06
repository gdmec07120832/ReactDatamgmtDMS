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
      { dataIndex: 'columnName', title: '????????????' },
      { dataIndex: 'columnComments', title: '????????????' },
      { dataIndex: 'dataType', title: '????????????' },
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
    message.success('?????????')
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
              <Button size={'small'}>??????????????????</Button>
            </CopyToClipboard>

        }
        <Button size={'small'} onClick={toggle}>{isFull ? '????????????': '????????????'}</Button>
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

// ????????????????????????
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
  { label: '???', value: '???' },
  { label: '???', value: '???' },
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
      { dataIndex: 'tablespaceName', title: '?????????', width: 150 },
      { dataIndex: 'owner', title: '?????????', width: 120 },
      { dataIndex: 'tableName', title: '??????' },
      { dataIndex: 'tabComments', title: '?????????', width: 150 },
      { dataIndex: 'tableVolumeM', title: '????????????(M)', width: 100 },
      { dataIndex: 'loadTime', title: '??????????????????', width: 160 },
      {
        dataIndex: 'showFlag',
        title: '????????????',
        width: 80,
        render: (text, row) => {
          return (
            <Switch
              defaultChecked={text === '???'}
              onChange={(v) => handleChangeFlag('showFlag', row, v)}
              checkedChildren="???"
              unCheckedChildren="???"
            />
          )
        },
      },
      {
        dataIndex: 'checkDataLoadFlag',
        title: '????????????????????????',
        width: 140,
        render: (text, row) => {
          return (
            <Switch
              defaultChecked={text === '???'}
              onChange={(v) => handleChangeFlag('checkDataLoadFlag', row, v)}
              checkedChildren="???"
              unCheckedChildren="???"
            />
          )
        },
      },
      {
        dataIndex: 'actions',
        title: '??????',
        width: 140,
        fixed: 'right',
        render: (text, row) => {
          const { auditing } = row
          return auditing ? (
            '?????????...'
          ) : (
            <Space>
              <Button onClick={() => updateTable(row)} size={'small'} type={'link'}>
                ?????????
              </Button>
              <Button onClick={() => updateColumns(row)} size={'small'} type={'link'}>
                ????????????
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
          [type]: flag ? '???' : '???',
          owner: row.owner,
          tableName: row.tableName,
        },
      })
      .then(() => {
        getList()
      })
  }

  const [selection, setSelection] = useState(initialSelection)
  // ????????????????????????select option
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

  // ????????????
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
        <FieldItem label={'?????????'} labelWidth={90} labelAlign={'left'}>
          <Select
              placeholder={'?????????'}
              value={query.tablespaceName}
              onChange={(v) => setQuery((prevState) => ({ ...prevState, tablespaceName: v }))}
              options={selection.TABLESPACE_NAME}
              allowClear
          />
        </FieldItem>
        <FieldItem label={'?????????'} labelWidth={90} labelAlign={'left'}>
          <Select
              placeholder={'?????????'}
              value={query.owner}
              onChange={(v) => setQuery((prevState) => ({ ...prevState, owner: v }))}
              options={selection.OWNER}
              allowClear
          />
        </FieldItem>
        <FieldItem label={'??????'} labelWidth={90} labelAlign={'left'}>
          <Select
              placeholder={'??????'}
              value={query.tableName}
              onChange={(v) => setQuery((prevState) => ({ ...prevState, tableName: v }))}
              options={selection.TABLE_NAME}
              allowClear
          />
        </FieldItem>
        <FieldItem label={'????????????'} labelWidth={90} labelAlign={'left'}>
          <Select
              placeholder={'????????????'}
              value={query.showFlag}
              onChange={(v) => setQuery((prevState) => ({ ...prevState, showFlag: v }))}
              options={FLAG_OPTIONS}
              showSearch={false}
              allowClear
          />
        </FieldItem>
        <FieldItem label={'??????????????????'} labelWidth={90} labelAlign={'left'}>
          <Select
              placeholder={'????????????????????????'}
              value={query.checkDataLoadFlag}
              onChange={(v) => setQuery((prevState) => ({ ...prevState, checkDataLoadFlag: v }))}
              options={FLAG_OPTIONS}
              showSearch={false}
              allowClear
          />
        </FieldItem>
        <FieldItem label={'?????????'} labelWidth={90} labelAlign={'left'}>
          <Input
              placeholder={'?????????'}
              value={query.tabComments}
              allowClear
              onChange={(e) => setQuery((prevState) => ({ ...prevState, tabComments: e.target.value }))}
              className={'flex-1'}
          />
        </FieldItem>
        <FieldItem label={'????????????'} labelWidth={90} labelAlign={'left'}>
          <StyledDateRangePicker
              value={query.dateRange}
              showTime
              onChange={(v) => setQuery((prevState) => ({ ...prevState, dateRange: v }))}
              className={'flex-1'}
          />
        </FieldItem>
        <FieldItem label={'????????????'} labelWidth={90} labelAlign={'left'}>
          <Input.Group compact>
            <Input defaultValue={'>='} readOnly style={{ width: 50 }} />
            <Input
                placeholder={'????????????'}
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
