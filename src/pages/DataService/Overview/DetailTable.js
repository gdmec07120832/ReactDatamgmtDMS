import React, {useCallback, useEffect, useState} from 'react'
import useTable from '../../../hooks/useTable'
import { useRequest } from 'ahooks'
import moment from 'moment'
import { DatePicker, Input, Table, TreeSelect } from 'antd'
import ExSelect from '../../../components/Select'
import axios from '../../../utils/axios'
import mapValuesDeep from 'deepdash/es/mapValuesDeep'
import styled from 'styled-components'
import fetchSql from '../../../utils/fetchSql'
import isObject from 'lodash/isObject'

const InfoTag = styled.span`
  border-radius: 4px;
  font-size: 12px;
  padding: 0 6px;
  color: #fff;
  margin-right: 4px;
  line-height: 16px;
  background: #327bf850;
`

const TYPES = new Map([
  ['PcTerminal', '数据灯塔'],
  ['MobileTerminal', '移动灯塔'],
  ['LargeScreenTerminal', '数据大屏'],
  ['DataMessage', '数讯传送'],
  ['DigitalSupplier', '数字供应商'],
  ['Dashboard4BOSS', 'BOSS看板'],
  ['ExternalInterface', '业务系统'],
])

const columns = [
  { title: '访问接口', dataIndex: 'fullPath' },
  { title: '访问时间', dataIndex: 'operaDateTime', width: 180 },
  { title: '访问用户', dataIndex: 'userName', width: 160 },
  { title: '访问IP', dataIndex: 'ip', width: 200 },
  { title: '访问耗时（ms）', dataIndex: 'burningTime', width: 140 },
]
function DetailTable(props) {
  const { defaultApi } = props
  const { table, setTable } = useTable({
    rowKey: 'id',
    columns,
  })

  const [statisticRange, setStatisticRange] = useState(moment())
  const [treeOptions, setTreeOptions] = useState([])
  const [menuConfig, setMenuConfig] = useState(undefined)
  const [typeValue, setTypeValue] = useState(undefined)
  const handleTypeChange = (v) => {
    setTable((prevState) => ({
      ...prevState,
      pagination: { ...prevState.pagination, current: 1 },
    }))
    setMenuConfig(undefined)
    setTypeValue(v)
  }

  const handleMenuChange = useCallback((v) => {
    setTable((prevState) => ({
      ...prevState,
      columns: isObject(v?.label) ? columns.slice(1) : columns,
      dataSource: [],
      pagination: { ...prevState.pagination, current: 1, total: 0 },
    }))
    setMenuConfig(v)
  }, [setTable])

  useEffect(() => {
    if(defaultApi) {
      setTypeValue(defaultApi?.interfaceType)
      handleMenuChange({
        value: defaultApi.ID,
        label: <span>{defaultApi.cnName}</span>
      })
    }
  }, [defaultApi, handleMenuChange])

  const { run: getTree } = useRequest(
    (type) => {
      return axios
        .get('/bi-mobile/api/admin/dataInterfaceConfig/list', {
          params: {
            interfaceType: type,
          },
        })
        .then(({ data }) => {
          mapValuesDeep(
            data,
            (value) => {
              value.title = !value.children.length ? (
                <span>
                  <InfoTag>接口</InfoTag>
                  {value.cnName}
                </span>
              ) : (
                value.cnName
              )
            },
            { childrenPath: 'children' }
          )
          setTreeOptions(data)
        })
    },
    { manual: true, debounceInterval: 200 }
  )

  const { current: page, pageSize } = table.pagination
  const { run: getList, loading } = useRequest(
    () => {
      return fetchSql('ALL_US_API', 'getInterfaceDetails', {
        interfaceType: menuConfig?.value ? undefined : typeValue,
        page,
        pageSize,
        configId: menuConfig?.value,
        startDate: statisticRange ? statisticRange.format('YYYY-MM-DD') : '',
        endDate: statisticRange ? statisticRange.format('YYYY-MM-DD') : '',
      }).then(({ data: { list, totalRows: total } }) => {
        setTable((prevState) => ({
          ...prevState,
          dataSource: list.map((item) => ({
            ...item,
            id: Math.random(),
          })),
          pagination: { ...prevState.pagination, total },
        }))
      })
    },
    { manual: true }
  )

  useEffect(() => {
    if (typeValue) {
      getTree(typeValue)
    }
  }, [getTree, typeValue])

  useEffect(() => {
    if (typeValue) {
      getList()
    }
  }, [menuConfig, getList, page, pageSize, typeValue, statisticRange])

  return (
    <div className="bg-white mt-4">
      <div className={'common-section-head'}>
        <div className={'flex justify-between'}>
          <span>API调用详情</span>
          <div>
            <DatePicker
              allowClear={false}
              value={statisticRange}
              onChange={(v) => {
                setTable((prevState) => ({ ...prevState, pagination: { ...prevState.pagination, current: 1 } }))
                setStatisticRange(v)
              }}
              picker={'day'}
              disabledDate={(currentDate) => {
                return currentDate.valueOf() > moment().valueOf()
              }}
            />
          </div>
        </div>
      </div>

      <div className={'px-12 py-5'}>
        <div className={'flex justify-end'}>
          <div>
            <Input.Group compact>
              <ExSelect
                value={typeValue}
                onChange={(v) => handleTypeChange(v)}
                options={Array.from(TYPES).map((values) => ({
                  value: values[0],
                  label: values[1],
                }))}
                className={'w-28'}
              />
              <TreeSelect
                value={menuConfig}
                allowClear
                labelInValue
                onChange={handleMenuChange}
                showSearch
                treeNodeFilterProp={'cnName'}
                treeData={treeOptions}
                className={'w-96'}
                fieldNames={{ label: 'title', value: 'id' }}
              />
            </Input.Group>
          </div>
        </div>

        <Table {...table} loading={loading} className={'mt-3'} />
      </div>
    </div>
  )
}

export default DetailTable
