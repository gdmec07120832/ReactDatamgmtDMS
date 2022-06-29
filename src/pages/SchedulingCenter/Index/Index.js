import React, { useEffect, useRef, useState } from 'react'
import numeral from 'numeral'
import {Button, Input, Popconfirm, Radio, Table, Tag, Tooltip} from 'antd'
import useTable from '../../../hooks/useTable'
import { useRequest } from 'ahooks'
import axios from '../../../utils/axios'
import ExSelect from '../../../components/Select'
import CollapseButtons from '../../../components/CollapseButtons'
import ExecModal from '../components/ExecModal'
import RenderProgress, {ColorExplain} from './RenderProgress'
import {InfoCircleOutlined} from '@ant-design/icons';
import {useHistory} from 'react-router-dom';
import OverflowTooltip from '../../../components/OverflowTooltip';
import {OVERVIEW_STATUS_LIST, ICON_MAP, STATUS} from './constants'
import {useStatisticCounts} from './hooks';


function Index() {
  const history = useHistory()
  const { table: table1, setTable: setTable1 } = useTable({
    rowKey: 'id',
    columns: [
      { dataIndex: 'id', title: 'ID', width: 120 },
      { dataIndex: 'hierarchy', title: '层级' },
      { dataIndex: 'groupName', title: '分组名称' },
      {
        dataIndex: 'superiorTri',
        title: '依赖触发',
        render(text) {
          return text ? '是' : '否'
        },
      },
      {
        dataIndex: 'status',
        title: '状态',
        render(text) {
          return <Tag color={text === 1 ? 'success' : 'error'}>{text === 1 ? '启用' : '禁用'}</Tag>
        },
      },
      {
        dataIndex: 'nextExecuteDate',
        title: '下次执行时间',
        render(text, row) {
          return row.status === 1 ? text : ''
        },
      },
      {
        dataIndex: 'p',
        title: () => {
          return <span>
            进度
            <Tooltip title={<ColorExplain />} overlayStyle={{maxWidth: 'initial'}} overlayInnerStyle={{padding: 12}} color={'#fff'}>
              <InfoCircleOutlined className={'ml-1'} />
            </Tooltip>
          </span>
        } ,
        render(text, row) {
          return <RenderProgress progress={row.__progress} />
        },
      },
      {
        dataIndex: 'actions',
        title: '操作',
        width: 160,
        render(text, row) {
          const { status } = row
          return (
            <CollapseButtons>
              {status === 1 && (
                <Popconfirm
                  title={'确定禁用吗？'}
                  onConfirm={doRowActions.bind(null, { row, act: 'stop', type: 'group' })}>
                  <Button size={'small'} type={'link'}>
                    禁用
                  </Button>
                </Popconfirm>
              )}
              {status !== 1 && (
                <Popconfirm
                  title={'确定启用吗？'}
                  onConfirm={doRowActions.bind(null, { row, act: 'start', type: 'group' })}>
                  <Button size={'small'} type={'link'}>
                    启用
                  </Button>
                </Popconfirm>
              )}

              <Button size={'small'} type={'link'} onClick={execRow.bind(null, row)}>
                执行
              </Button>
              <Button size={'small'} type={'link'} onClick={checkGroupDetail.bind(null, row)}>
                详情
              </Button>
            </CollapseButtons>
          )
        },
      },
    ],
  })

  const { table: table2, setTable: setTable2 } = useTable({
    rowKey: 'id',
    columns: [
      { dataIndex: 'id', title: 'ID', width: 120 },
      { dataIndex: 'groupName', title: '分组名称' },
      { dataIndex: 'jobName', title: '作业名' },
      {
        dataIndex: 'superiorTri',
        title: '依赖触发',
        render(text) {
          return text ? '是' : '否'
        },
      },
      {
        dataIndex: 'status',
        title: '状态',
        render(text) {
          return <Tag color={text === 1 ? 'success' : 'error'}>{text === 1 ? '启用' : '禁用'}</Tag>
        },
      },
      {
        dataIndex: 'nextExecuteDate',
        title: '下次执行时间',
        render(text, row) {
          return row.status === 1 ?  <OverflowTooltip>{text}</OverflowTooltip> : ''
        },
      },
      {
        dataIndex: 'actions',
        title: '操作',
        width: 160,
        render(text, row) {
          const { status } = row
          return (
            <CollapseButtons>
              {status === 1 && (
                <Popconfirm
                  title={'确定禁用吗？'}
                  onConfirm={doRowActions.bind(null, { row, type: 'job', act: 'stop' })}>
                  <Button size={'small'} type={'link'}>
                    禁用
                  </Button>
                </Popconfirm>
              )}
              {status !== 1 && (
                <Popconfirm
                  title={'确定启用吗？'}
                  onConfirm={doRowActions.bind(null, { row, type: 'job', act: 'start' })}>
                  <Button size={'small'} type={'link'}>
                    启用
                  </Button>
                </Popconfirm>
              )}

              <Button size={'small'} type={'link'} onClick={execRow.bind(null, row)}>
                执行
              </Button>
              <Button size={'small'} type={'link'} onClick={checkJobDetail.bind(null, row)}>
                详情
              </Button>
            </CollapseButtons>
          )
        },
      },
    ],
  })

  const checkGroupDetail = (row) => {
    history.push('/schedulingCenter/jobMgmt', {
      superior: row.id
    })
  }

  const checkJobDetail = (row) => {
    history.push(`/schedulingCenter/jobMgmt/jobDetail/${row.id}`)
  }

  const {statisticCounts, getStatistic}  = useStatisticCounts()

  const hasToggled = useRef(false)
  const [viewType, setViewType] = useState(1)

  const [hierarchyList, setHierarchyList] = useState([])
  useRequest(() => {
    return axios.get('/bi-task-scheduling-system/api/user/common/listLevelsForComboBox', {}).then(({ data }) => {
      setHierarchyList(data)
    })
  })

  const showProgressById = (id) => {
    axios
      .get('/bi-task-scheduling-system/api/user/group/selectProgressById', {
        params: { id },
      })
      .then(({ data }) => {
        setTable1((prevState) => {
          const index = prevState.dataSource.findIndex((item) => item.id === id)
          if (index > -1) {
            return {
              ...prevState,
              dataSource: [
                ...prevState.dataSource.slice(0, index),
                { ...prevState.dataSource[index], __progress: data },
                ...prevState.dataSource.slice(index + 1),
              ],
            }
          } else {
            return prevState
          }
        })
      })
  }

  const [keyWord, setKeyWord] = useState('')
  const [superior, setSuperior] = useState(undefined)
  const { current: page1, pageSize: pageSize1 } = table1.pagination
  const { run: getList1, loading: loading1 } = useRequest(
    () => {
      return axios
        .get('/bi-task-scheduling-system/api/user/group/queryGroup', {
          params: {
            superior,
            keyWord,
            page: page1,
            rows: pageSize1,
          },
        })
        .then(({ data: { list, totalRows: total } }) => {
          setTable1((prevState) => ({
            ...prevState,
            dataSource: list,
            pagination: { ...prevState.pagination, total },
          }))

          list.forEach((item) => {
            showProgressById(item.id)
          })
        })
    },
    { manual: true, debounceInterval: 300 }
  )

  const [superior2, setSuperior2] = useState(undefined)
  const { current: page2, pageSize: pageSize2 } = table2.pagination
  const { run: getList2, loading: loading2 } = useRequest(
    () => {
      return axios
        .get('/bi-task-scheduling-system/api/user/job/queryJob', {
          params: {
            keyWord,
            superior: superior2,
            page: page2,
            rows: pageSize2,
          },
        })
        .then(({ data: { list, totalRows: total } }) => {
          setTable2((prevState) => ({
            ...prevState,
            dataSource: list,
            pagination: { ...prevState.pagination, total },
          }))
        })
    },
    { manual: true, debounceInterval: 300 }
  )

  const doRowActions = ({ row, type, act }) => {
    let p
    switch (act) {
      case 'stop':
        p = axios.get(`/bi-task-scheduling-system/api/admin/${type}/pause`, { params: { id: row.id } })
        break
      case 'start':
        p = axios.get(`/bi-task-scheduling-system/api/admin/${type}/start`, { params: { id: row.id } })
        break
      default:
        p = Promise.resolve()
    }
    p.then(() => {
      getStatistic()
      if (type === 'group') {
        getList1()
      } else {
        getList2()
      }
    })
  }

  const handleSearch = () => {
    if (viewType === 1) {
      getList1()
    } else {
      getList2()
    }
  }

  const [currentRow, setCurrentRow] = useState(null)

  const execRow = (row) => {
    setCurrentRow(row)
  }

  useEffect(() => {
    getList1()
  }, [getList1, page1, pageSize1, superior])

  const [hierarchyList2, setHierarchyList2] = useState([])
  const { run: getHierarchyList2 } = useRequest(
    () => {
      return axios
        .get('/bi-task-scheduling-system/api/user/group/listGroupsForComboBoxIncludeLevel')
        .then(({ data }) => {
          setHierarchyList2(data)
        })
    },
    { manual: true }
  )

  useEffect(() => {
    if (viewType === 2 && !hasToggled.current) {
      getList2()
      getHierarchyList2()
      hasToggled.current = true
    }
  }, [viewType, getList2, getHierarchyList2])

  useEffect(() => {
    if (hasToggled.current) {
      getList2()
    }
  }, [getList2, page2, pageSize2, superior2])

  return (
    <div style={{ background: '#f0f2f5' }}>
      <div className={'grid grid-cols-7 gap-x-4 p-6 bg-white'}>
        {OVERVIEW_STATUS_LIST.map((key) => {
          return (
            <div key={key} className={'flex justify-start items-start px-4 py-2.5 relative'} style={{ background: '#f7f8f9' }}>
              <div className={'flex-none absolute'}>
                <img
                  width={20}
                  style={{ height: 20, WebkitUserDrag: 'none' }}
                  className={'object-contain'}
                  src={ICON_MAP[key]}
                  alt="icon"
                />
              </div>
              <div className={'text-center flex-1'}>
                <div style={{ color: '#848484' }}>{STATUS[key]}</div>
                <div
                  className={'text-2xl pt-2'}
                  style={{
                    color: { TODAY_FAILED: '#0CBE0F', TODAY_SUCCESS: '#FF382C', TODAY_OVERTIME: '#EBA418' }[key],
                  }}>
                  {numeral(statisticCounts[key] || 0).format('0,0')}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className={'p-6 mt-4 bg-white'}>
        <div className={'flex justify-between mb-2.5'}>
          <div>
            <Radio.Group
              value={viewType}
              onChange={(e) => setViewType(e.target.value)}
              buttonStyle="solid"
              optionType="button"
              options={[
                { value: 1, label: '分组' },
                { value: 2, label: '作业' },
              ]}
            />
            {viewType === 1 && (
              <ExSelect
                value={superior}
                onChange={(v) => setSuperior(v)}
                options={hierarchyList.map((item) => ({ label: item.hierarchy, value: item.id }))}
                className={'ml-2 w-60'}
                allowClear
                placeholder={'选择过滤条件'}
              />
            )}

            {viewType === 2 && (
              <ExSelect
                value={superior2}
                onChange={(v) => setSuperior2(v)}
                options={hierarchyList2.map((item) => ({ label: item.groupName, value: item.id }))}
                className={'ml-2 w-60'}
                allowClear
                placeholder={'选择过滤条件'}
              />
            )}
          </div>
          <div className={'flex'}>
            <Input
              value={keyWord}
              onChange={(e) => setKeyWord(e.target.value)}
              placeholder={'输入关键字查询'}
              allowClear
            />
            <Button className={'ml-2'} onClick={handleSearch}>
              查询
            </Button>
          </div>
        </div>
        {viewType === 1 && <Table {...table1} loading={loading1} />}
        {viewType === 2 && <Table {...table2} loading={loading2} />}
      </div>

      <ExecModal currentRow={currentRow} setCurrentRow={setCurrentRow} />
    </div>
  )
}

export default Index
