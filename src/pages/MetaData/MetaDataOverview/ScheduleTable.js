import React, {useEffect, useState} from 'react'
import { Button, Input, Popconfirm, Table, Tag, Tooltip } from 'antd'
import useTable from '../../../hooks/useTable'
import ExSelect from '../../../components/Select'
import { useHistory } from 'react-router-dom'
import RenderProgress, { ColorExplain } from '../../SchedulingCenter/Index/RenderProgress'
import { InfoCircleOutlined } from '@ant-design/icons'
import CollapseButtons from '../../../components/CollapseButtons'
import {useRequest} from 'ahooks';
import axios from '../../../utils/axios';
import ExecModal from '../../SchedulingCenter/components/ExecModal';

function ScheduleTable(props) {
  const {getStatistic} = props
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
          return (
            <span>
              进度
              <Tooltip
                title={<ColorExplain />}
                overlayStyle={{ maxWidth: 'initial' }}
                overlayInnerStyle={{ padding: 12 }}
                color={'#fff'}>
                <InfoCircleOutlined className={'ml-1'} />
              </Tooltip>
            </span>
          )
        },
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

  const [hierarchyList, setHierarchyList] = useState([])
  useRequest(() => {
    return axios.get('/bi-task-scheduling-system/api/user/common/listLevelsForComboBox', {}).then(({ data }) => {
      setHierarchyList(data)
    })
  })

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
  useEffect(() => {
    getList1()
  }, [superior, page1, pageSize1, getList1])

  const checkGroupDetail = (row) => {
    history.push('/schedulingCenter/jobMgmt', {
      superior: row.id
    })
  }
  const [currentRow, setCurrentRow] = useState(null)
  const execRow = (row) => {
    setCurrentRow(row)
  }

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
      }
    })
  }

  const handleSearch = () => {
    getList1()
  }

  return (
    <div className={'mt-2.5'}>
      <div className={'flex justify-between mb-2.5'}>
        <div>
          <ExSelect
            value={superior}
            onChange={(v) => setSuperior(v)}
            options={hierarchyList.map((item) => ({ label: item.hierarchy, value: item.id }))}
            className={'w-60'}
            allowClear
            placeholder={'选择过滤条件'}
          />
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
      <Table {...table1} loading={loading1}/>
      <ExecModal currentRow={currentRow} setCurrentRow={setCurrentRow} />
    </div>
  )
}

export default ScheduleTable
