import React, { useEffect, useRef, useState } from 'react'
import { connect } from 'react-redux'
import { Table, Button, Input, Space, message, Popconfirm } from 'antd'
import useTable from '../../../hooks/useTable'
import { useHistory, useLocation } from 'react-router-dom'
import axios from '../../../utils/axios'
import { useRequest } from 'ahooks'
import OverflowTooltip from '../../../components/OverflowTooltip'
import { useLastLocation } from 'react-router-last-location'
import { tranFrequency } from '../FillTodos/components/utils'
import ExSelect from '../../../components/Select'
import { fetchDataFields, fetchLevelInfo } from '../helpers'

function DataFillTemplateIndex(props) {
  const { permissionsMap } = props
  const { table, setTable } = useTable({
    rowKey: 'id',
    tableLayout: 'fixed',
    scroll: { x: 1600 },
    dataSource: [],
    columns: [
      {
        title: '模板名称',
        dataIndex: 'excelName',
        render(text) {
          return <div className={'break-all'}>{text || '--'}</div>
        },
        width: 120,
      },
      {
        title: '数据库表名',
        dataIndex: 'tableName',
        render(text) {
          return <div className={'break-all'}>{text}</div>
        },
        width: 120,
      },
      { title: '第二层分类', dataIndex: 'twoTierName', render: (text, record) => {
        return <OverflowTooltip>{record.category?.name}</OverflowTooltip>
        }, width: 100 },
      { title: '第一层分类', dataIndex: 'oneTierName', width: 100 },
      { title: '数据域', dataIndex: 'dataFieldName', width: 100 },
      {
        title: '更新频率',
        dataIndex: 'importFrequency',
        width: 120,
        render(text, row) {
          const { importFrequency, frequencyType, cutTime, daysOfMonth, daysOfWeek, monthOfYear } = row
          return tranFrequency(importFrequency, frequencyType, { cutTime, daysOfMonth, daysOfWeek, monthOfYear })
        },
      },
      { title: '创建人', dataIndex: 'createrName', align: 'center', width: 100 },
      {
        title: '创建时间',
        dataIndex: 'createTime',
        render(text) {
          return <OverflowTooltip>{text}</OverflowTooltip>
        },
        align: 'center',
        width: 120,
      },
      {
        title: '更新人',
        dataIndex: 'modifierName',
        render(text) {
          return <OverflowTooltip>{text}</OverflowTooltip>
        },
        align: 'center',
        width: 100,
      },
      {
        title: '更新时间',
        dataIndex: 'updateTime',
        render(text) {
          return <OverflowTooltip>{text}</OverflowTooltip>
        },
        align: 'center',
        width: 120,
      },
      {
        title: '操作',
        dataIndex: 'action',
        width: 120,
        fixed: 'right',
        render(text, row) {
          return (
            <Space>
              {
                <>
                  <Button type={'link'} size={'small'} onClick={() => handleActions(row, 2)}>
                    查看配置
                  </Button>
                  {permissionsMap['bi-data-reporting.ExcelTemplateController.remove'] && (
                    <Popconfirm
                      placement={'topRight'}
                      title={`确定删除【${row.id}】【${row.excelName}】吗？`}
                      onConfirm={() => handleActions(row, 99)}>
                      <Button type={'link'} size={'small'} danger>
                        删除
                      </Button>
                    </Popconfirm>
                  )}
                </>
              }
            </Space>
          )
        },
      },
    ],
  })

  const [query, setQuery] = useState({
    excelName: '',
    tableName: '',
    dataFieldId: undefined,
    oneTier: undefined,
    twoTier: undefined,
  })

  let isAutoFill = useRef(true)

  useEffect(() => {
    if (!isAutoFill.current) {
      setTable((prevState) => ({ ...prevState, pagination: { ...prevState.pagination, current: 1 } }))
    }
  }, [setTable, query])

  const location = useLocation()
  const lastLocation = useLastLocation()
  useEffect(() => {
    let cachedQuery = window.sessionStorage.getItem(location.pathname)
    cachedQuery = cachedQuery ? JSON.parse(cachedQuery) : {}
    if (!(lastLocation && lastLocation.pathname && lastLocation.pathname.startsWith(location.pathname))) {
      cachedQuery = {}
    }

    const {
      /**@member {string} */
      excelName,
      /**@member {string} */
      tableName,
      /**@member {any} */
      dataFieldId,
      oneTier,
      twoTier,
    } = cachedQuery
    setQuery((prevState) => ({
      ...prevState,
      excelName,
      tableName,
      dataFieldId,
      oneTier,
      twoTier,
    }))
    setTimeout(() => {
      isAutoFill.current = false
    }, 20)

    const {
      /**@member {number}  */
      page,
      /**@member {number}  */
      pageSize,
    } = cachedQuery
    if (page && pageSize) {
      setTable((prevState) => ({
        ...prevState,
        pagination: { ...prevState.pagination, current: page, pageSize },
      }))
    }
    // eslint-disable-next-line
  }, [])

  const history = useHistory()
  const createTemplate = () => {
    history.push('/dataFill/cfg/templateList/editTemplate/create')
  }
  const handleActions = (row, type) => {
    switch (type) {
      case 1:
        history.push(`/dataFill/cfg/templateList/record/${row.id}`)
        break
      case 2:
        history.push(`/dataFill/cfg/templateList/editTemplate/${row.id}`)
        break
      case 99:
        axios
          .get('/bi-data-reporting/api/admin/excel/excelTemplate/remove', {
            params: {
              ids: row.id,
            },
          })
          .then(() => {
            message.success('删除成功')
            run()
          })
        break
      case 100:
        history.push(`/dataFill/fill/dataAudit/${row.id}`)
        break
      default:
      //
    }
  }

  const [dataFields, setDataFields] = useState([])
  const [level1List, setLevel1List] = useState([])
  const [level2List, setLevel2List] = useState([])

  useEffect(() => {
    const _fetch = async () => {
      const data1 = await fetchLevelInfo(1)
      setLevel1List(
        data1.map((item) => ({
          label: item.name,
          value: item.id,
        }))
      )
      const data2 = await fetchLevelInfo(2)
      setLevel2List(
        data2.map((item) => ({
          ...item,
          label: item.name,
          value: item.id,
        }))
      )
    }

    _fetch()
  }, [])

  useEffect( () => {
    const _fetch = async () => {
      const data = await fetchDataFields()
      setDataFields(
          data.map((item) => {
            return {
              ...item,
              label: item.nodeName,
              value: String(item.id),
            }
          })
      )
    }

    _fetch()

  }, [])

  const { current, pageSize } = table.pagination
  const { run, loading } = useRequest(
    () => {
      let url = '/bi-data-reporting/api/admin/excel/excelTemplate/list'
      return axios
        .get(url, {
          params: {
            page: current,
            pageSize,
            ...query,
          },
        })
        .then(({ data: { list, totalRows } }) => {
          window.sessionStorage.setItem(
            location.pathname,
            JSON.stringify({
              ...query,
              pageSize,
              page: current,
            })
          )
          setTable((prevState) => ({
            ...prevState,
            dataSource: list,
            pagination: { ...prevState.pagination, total: totalRows },
          }))
        })
    },
    {
      manual: true,
      debounceInterval: 200,
    }
  )

  useEffect(() => {
    run()
  }, [run, current, pageSize, query])

  return (
    <div className={'px-6 py-6'}>
      <div className={'flex justify-start items-start mb-2.5'}>
        <div className={'flex-1'}>
          <div className={'grid grid-cols-4 gap-x-6 gap-y-2'}>
            <div className={'flex'}>
              <span className={'flex-none mr-2 w-20'}>数据域</span>
              <ExSelect
                value={query.dataFieldId}
                onChange={(v) =>
                  setQuery((prevState) => ({
                    ...prevState,
                    dataFieldId: v,
                  }))
                }
                allowClear
                className={'flex-1'}
                options={dataFields}
                placeholder={'数据域'}
              />
            </div>
            <div className={'flex'}>
              <span className={'flex-none mr-2 w-20'}>第一层分类</span>
              <ExSelect
                value={query.oneTier}
                onChange={v => setQuery(prevState => ({...prevState, oneTier: v}))}
                allowClear
                className={'flex-1'}
                options={level1List}
                placeholder={'第一层分类'}
              />
            </div>
            <div className={'flex'}>
              <span className={'flex-none mr-2 w-20'}>第二层分类</span>
              <ExSelect
                value={query.twoTier}
                onChange={v => setQuery(prevState => ({...prevState, twoTier: v}))}
                allowClear
                className={'flex-1'}
                options={Array.from(new Set(level2List.map(item => item.name))).map(item => ({label: item, value: item}))}
                placeholder={'第二层分类'}
              />
            </div>
            <div className={'flex'}>
              <span className={'flex-none mr-2 w-20'}>模板名称</span>
              <Input
                className={'flex-1'}
                value={query.excelName}
                onChange={(e) =>
                  setQuery((prevState) => ({
                    ...prevState,
                    excelName: e.target.value,
                  }))
                }
                placeholder={'模板名称'}
                allowClear
              />
            </div>
            <div className={'flex'}>
              <span className={'flex-none mr-2 w-20'}>数据库表名</span>
              <Input
                className={'flex-1'}
                value={query.tableName}
                onChange={(e) =>
                  setQuery((prevState) => ({
                    ...prevState,
                    tableName: e.target.value,
                  }))
                }
                placeholder={'数据库表名'}
                allowClear
              />
            </div>
          </div>
        </div>
        {permissionsMap['bi-data-reporting.ExcelTemplateController.saveOrUpdate'] && (
          <Button type={'primary'} className={'ml-4'} onClick={createTemplate}>
            新增
          </Button>
        )}
      </div>
      <Table {...table} loading={loading} />
    </div>
  )
}

export default connect((state) => {
  return {
    permissionsMap: state.user.userInfo?.permissionsMap,
  }
})(DataFillTemplateIndex)
