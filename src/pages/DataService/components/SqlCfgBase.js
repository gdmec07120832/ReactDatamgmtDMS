import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Button, Input, message, Popconfirm, Space, Table } from 'antd'
import useTable from '../../../hooks/useTable'
import { useRequest } from 'ahooks'
import axios from '../../../utils/axios'
import { CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons'
import styled from 'styled-components'
import filterDeep from 'deepdash/es/filterDeep'
import cloneDeep from 'lodash/cloneDeep'
import { uniq } from 'lodash/array'
import EditSqlCfgModal from './EditSqlCfgModal'

const ExpandWrap = styled.div.attrs({
  className: 'ant-table-row-expand-icon text-gray-400',
})`
  &:before,
  &:after {
    display: none;
  }

  border: none;
  background: transparent;
`

function SqlCfgBase(props) {
  const { type, cloud } = props
  const permissionsMap = useSelector((state) => state.user.permissionsMap)
  const [allData, setAllData] = useState([])
  const valueRef = useRef('')
  const { table, setTable } = useTable({
    rowKey: 'id',
    pagination: false,
    expandable: {
      expandRowByClick: true,
      expandedRowKeys: [],
      onExpandedRowsChange: (expandedRows) => {
        setTable((prevState) => ({
          ...prevState,
          expandable: {
            ...prevState.expandable,
            expandedRowKeys: expandedRows,
          },
        }))
      },
      expandIcon: ({ record, expanded }) => {
        if (!record.children.length) {
          return <ExpandWrap />
        } else {
          return <ExpandWrap>{expanded ? <CaretDownOutlined /> : <CaretRightOutlined />}</ExpandWrap>
        }
      },
    },
    columns: [
      {
        title: '中文名称',
        dataIndex: 'cnName',
        width: 280,
      },
      {
        title: '前缀',
        dataIndex: 'prefix',
        width: 120,
        shouldCellUpdate: (prevRecord, nextRecord) => {
          return prevRecord.prefix !== nextRecord.prefix
        },
      },
      {
        title: '接口名称',
        dataIndex: 'interfaceName',
        width: 180,
        shouldCellUpdate: (prevRecord, nextRecord) => {
          return prevRecord.interfaceName !== nextRecord.interfaceName
        },
      },
      {
        title: 'SQL语句',
        dataIndex: 'sqlStr',
        width: 150,
        render(text, record) {
          return (
            <div
              onClick={(e) => {
                e.stopPropagation()
                editRow(record)
              }}
              className={'w-full whitespace-nowrap overflow-ellipsis overflow-hidden'}>
              {text}
            </div>
          )
        },
        shouldCellUpdate: (prevRecord, nextRecord) => {
          return prevRecord.sqlStr !== nextRecord.sqlStr
        },
      },
      {
        title: '描述',
        dataIndex: 'description',
        width: 150,
        shouldCellUpdate: (prevRecord, nextRecord) => {
          return prevRecord.description !== nextRecord.description
        },
      },
      {
        title: '操作',
        dataIndex: 'action',
        width: 150,
        shouldCellUpdate: (prevRecord, nextRecord) => {
          return JSON.stringify(prevRecord) !== JSON.stringify(nextRecord)
        },
        fixed: 'right',
        render(text, record) {
          return (
            <Space>
              <Button
                type={'link'}
                size={'small'}
                onClick={(e) => {
                  e.stopPropagation()
                  editRow(record)
                }}>
                编辑
              </Button>
              <Button
                type={'link'}
                size={'small'}
                onClick={(e) => {
                  e.stopPropagation()
                  copyRow(record)
                }}>
                复制
              </Button>
              {!record.children.length &&
                permissionsMap[
                  cloud
                    ? 'bi-mobile-aliyun.DataInterfaceConfigController.delete'
                    : 'bi-mobile.DataInterfaceConfigController.delete'
                ] && (
                  <Popconfirm
                    title={'确定删除吗？'}
                    onCancel={(e) => e.stopPropagation()}
                    onConfirm={(e) => {
                      e.stopPropagation()
                      deleteRow(record)
                    }}>
                    <Button type={'link'} size={'small'} danger>
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

  const { run: getData, loading } = useRequest(
    () => {
      return axios
        .get(
          cloud
            ? '/bi-mobile-aliyun/api/admin/dataInterfaceConfig/list'
            : '/bi-mobile/api/admin/dataInterfaceConfig/list',
          {
            params: cloud
              ? {
                  appCode: type,
                }
              : {
                  interfaceType: type,
                },
          }
        )
        .then(({ data }) => {
          setAllData(data)
          handleSearch(data)
        })
    },
    { manual: true }
  )
  useEffect(() => {
    getData()
  }, [getData])

  const handleSearch = (data) => {
    if (!valueRef.current) {
      setTable((prevState) => {
        return {
          ...prevState,
          dataSource: data || allData,
        }
      })
      return
    }
    const rowKeys = []
    const ret = filterDeep(
      data || allData,
      (child, i, parent, context) => {
        const valid = [child.cnName, child.prefix, child.interfaceName].some((word) => {
          return (word || '').toLowerCase().indexOf((valueRef.current || '').toLowerCase()) > -1
        })
        if (valid) {
          const keys = context.parents
            .slice(1)
            .map((item) => {
              return item?.value?.id
            })
            .filter(Boolean)
          rowKeys.push.apply(rowKeys, keys)
        }
        return valid
      },
      { childrenPath: ['children'], cloneDeep: cloneDeep, onTrue: { skipChildren: true } }
    )

    setTable((prevState) => ({
      ...prevState,
      expandable: {
        ...prevState.expandable,
        expandedRowKeys: uniq(rowKeys),
      },
      dataSource: ret,
    }))
  }

  const [currentRow, setCurrentRow] = useState(null)

  const addRow = () => {
    setCurrentRow({})
  }
  const editRow = (row) => {
    setCurrentRow(row)
  }

  const copyRow = (row) => {
    const { id, ...restRow } = row
    setCurrentRow({
      ...restRow,
      __id: id,
      __isCopy: true
    })
  }

  const { run: _deleteRow, loading: loading2 } = useRequest(
    (id) => {
      return axios.get(
        cloud
          ? '/bi-mobile-aliyun/api/admin/dataInterfaceConfig/delete'
          : '/bi-mobile/api/admin/dataInterfaceConfig/delete',
        {
          params: { id },
        }
      )
    },
    { manual: true }
  )
  const deleteRow = (row) => {
    _deleteRow(row.id).then(() => {
      message.success('删除成功')
      getData()
    })
  }

  return (
    <div className={'p-6'}>
      <div className={'flex mb-2'}>
        <div className={'flex-1'}>
          <Input
            className={'w-60'}
            onChange={(e) => (valueRef.current = e.target.value)}
            onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={'中文名称、前缀、接口名称'}
            allowClear
          />
          <Button className={'ml2'} onClick={() => handleSearch()}>
            查找
          </Button>
        </div>
        <div>
          {permissionsMap[
            cloud
              ? 'bi-mobile-aliyun.DatasourceConfigController.saveOrUpdate'
              : 'bi-mobile.DataInterfaceConfigController.saveOrUpdate'
          ] && (
            <Button type={'primary'} onClick={addRow}>
              新增
            </Button>
          )}
        </div>
      </div>

      <Table {...table} loading={loading || loading2} />

      <EditSqlCfgModal
        currentRow={currentRow}
        setCurrentRow={setCurrentRow}
        type={type}
        cloud={cloud}
        refresh={getData}
      />
    </div>
  )
}

export default SqlCfgBase
