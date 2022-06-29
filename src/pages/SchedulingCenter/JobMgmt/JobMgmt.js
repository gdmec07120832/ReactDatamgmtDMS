import React, { useCallback, useEffect, useState } from 'react'
import { Button, Empty, Input, message, Popconfirm, Table, Tag } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import useTable from '../../../hooks/useTable'
import CollapseButtons from '../../../components/CollapseButtons'
import ExSelect from '../../../components/Select'
import { useRequest } from 'ahooks'
import axios from '../../../utils/axios'
import useLevel1List from '../hooks/useLevel1List'
import { useHistory, useLocation } from 'react-router-dom'
import EditModal from './EditModal'
import ExecModal from '../components/ExecModal'
import DepTreeModal from '../components/DepTreeModal'
import { useSelector } from 'react-redux'
import OverflowTooltip from '../../../components/OverflowTooltip'

const JOB_STATUS = {
  2: '依赖等待',
  1: '成功',
  0: '执行中',
  '-1': '失败',
  '-2': '超时',
  '-3': '打断中',
}

function JobMgmt() {
  const permissionsMap = useSelector((state) => state.user.permissionsMap)
  const location = useLocation()
  const history = useHistory()
  const [userList, setUserList] = useState([])
  useRequest(() => {
    return axios.get('/bi-task-scheduling-system/api/user/job/queryJobDirector').then(({ data }) => {
      setUserList(data)
    })
  })
  const { table, setTable } = useTable({
    scroll: { x: 1200 },
    pagination: {
      total: 0,
      pageSize: 10,
      current: 1,
      showSizeChanger: true,
      pageSizeOptions: [10, 15, 30, 45],
      size: 'default',
      showTotal: (total) => `共${total}条记录`,
    },
    rowKey: 'id',
    columns: [
      {
        dataIndex: 'id',
        title: 'ID',
        width: 60,
        shouldCellUpdate(rec, prevRec) {
          return rec.id !== prevRec.id
        },
      },
      {
        dataIndex: 'groupName',
        title: '分组名称',
        width: 100,
        render(text, row) {
          return (
            <div className={'cursor-pointer hover:text-blue-500'} onClick={searchByGroup.bind(null, row)}>
              <OverflowTooltip>{text}</OverflowTooltip>
            </div>
          )
        },
      },
      {
        dataIndex: 'groupStatus',
        title: '分组状态',
        width: 70,
        shouldCellUpdate(rec, prevRec) {
          return rec.groupStatus !== prevRec.groupStatus
        },
        render(text) {
          return <Tag color={text === 1 ? 'success' : 'error'}>{text === 1 ? '启用' : '禁用'}</Tag>
        },
      },
      {
        dataIndex: 'jobName',
        title: '作业名称',
        width: 300,
        shouldCellUpdate(rec, prevRec) {
          return rec.jobName !== prevRec.jobName
        },
      },
      {
        dataIndex: 'seq',
        title: '顺序',
        width: 50,
        shouldCellUpdate(rec, prevRec) {
          return rec.seq !== prevRec.seq
        },
      },
      {
        dataIndex: 'description',
        title: '描述',
        width: 140,
        shouldCellUpdate(rec, prevRec) {
          return rec.description !== prevRec.description
        },
      },
      {
        dataIndex: 'directorName',
        title: '负责人',
        width: 60,
        shouldCellUpdate(rec, prevRec) {
          return rec.directorName !== prevRec.directorName
        },
      },
      {
        dataIndex: 'superiorTri',
        title: '依赖触发',
        width: 70,
        shouldCellUpdate(rec, prevRec) {
          return rec.superiorTri !== prevRec.superiorTri
        },
        render(text) {
          return text ? '是' : '否'
        },
      },
      {
        dataIndex: 'status',
        title: '状态',
        width: 60,
        shouldCellUpdate(rec, prevRec) {
          return rec.status !== prevRec.status
        },
        render(text) {
          return <Tag color={text === 1 ? 'success' : 'error'}>{text === 1 ? '启用' : '禁用'}</Tag>
        },
      },
      {
        dataIndex: 'lastExecuteStatue',
        title: '最新执行结果',
        width: 100,
        render(text, row) {
          const colors = { 1: '#28a745', 0: '#007bff', '-1': '#dc3545', '-2': '#ffc107', '-3': '#007bff' }
          const { waitStatus, lastExecuteIsOverTime } = row
          return waitStatus === 0 ? (
            <span style={{ color: '#17a2b8' }}>依赖等待</span>
          ) : (
            <>
              <span style={{ color: colors[text] || '' }}>{JOB_STATUS[text] || '无'}</span>
              {!!lastExecuteIsOverTime && <span style={{ color: '#ffc107' }}>（超时）</span>}
            </>
          )
        },
      },
      {
        dataIndex: 'logExecuteDate',
        title: '最后执行时间',
        width: 155,
        shouldCellUpdate(rec, prevRec) {
          return rec.logExecuteDate !== prevRec.logExecuteDate
        },
      },
      {
        dataIndex: 'lastExecuteHost',
        title: '最后执行主机',
        width: 140,
        shouldCellUpdate(rec, prevRec) {
          return rec.lastExecuteHost !== prevRec.lastExecuteHost
        },
      },
      {
        dataIndex: 'actions',
        title: '操作',
        fixed: 'right',
        width: 280,
        render: (text, row) => {
          const { status, lastExecuteStatue } = row
          return (
            <CollapseButtons max={6}>
              {status === 1 && permissionsMap['bi-task-scheduling-system.JobController.pauseJob'] && (
                <Popconfirm title={'确定禁用吗？'} onConfirm={doActionsRow.bind(null, row, 'pause')}>
                  <Button type={'link'} size={'small'}>
                    禁用
                  </Button>
                </Popconfirm>
              )}
              {status !== 1 && permissionsMap['bi-task-scheduling-system.JobController.startJob'] && (
                <Popconfirm title={'确定启用吗？'} onConfirm={doActionsRow.bind(null, row, 'start')}>
                  <Button type={'link'} size={'small'}>
                    启用
                  </Button>
                </Popconfirm>
              )}
              {![0, -3].includes(lastExecuteStatue) &&
                permissionsMap['bi-task-scheduling-system.JobController.executeJob'] && (
                  <Button type={'link'} size={'small'} onClick={handleExecRow.bind(null, row)}>
                    执行
                  </Button>
                )}
              {lastExecuteStatue === 0 && permissionsMap['bi-task-scheduling-system.JobController.interruptJob'] && (
                <Popconfirm title={'确定中断吗？'} onConfirm={interruptJob.bind(null, row)}>
                  <Button type={'link'} size={'small'}>
                    中断
                  </Button>
                </Popconfirm>
              )}
              {permissionsMap['bi-task-scheduling-system.JobController.insertOrUpdate'] && (
                <Button type={'link'} size={'small'} onClick={handleEditRow.bind(null, row)}>
                  编辑
                </Button>
              )}
              <Button type={'link'} size={'small'} onClick={checkDeps.bind(null, row)}>
                依赖
              </Button>
              {
                <Button type={'link'} size={'small'} onClick={checkJobDetail.bind(null, row)}>
                  日志
                </Button>
              }
              {permissionsMap['bi-task-scheduling-system.JobController.delete'] && (
                <Popconfirm
                  title={'确定删除吗？'}
                  placement={'topLeft'}
                  onCancel={(e) => e.stopPropagation()}
                  onConfirm={handleDeleteRow.bind(null, row)}>
                  <Button type={'link'} size={'small'} danger onClick={(e) => e.stopPropagation()}>
                    删除
                  </Button>
                </Popconfirm>
              )}
            </CollapseButtons>
          )
        },
      },
    ],
  })

  const _query = sessionStorage.getItem(location.pathname)
  const [query, setQuery] = useState(_query ? JSON.parse(_query) : {})

  const { current: page, pageSize } = table.pagination
  const { run: getList, loading } = useRequest(
    () => {
      return axios
        .get('/bi-task-scheduling-system/api/user/job/queryJob', {
          params: {
            page,
            rows: pageSize,
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
    { manual: true, debounceInterval: 300 }
  )

  useEffect(() => {
    getList()
  }, [getList, page, pageSize, query])

  const searchByGroup = (row) => {
    setTable((prevState) => ({
      ...prevState,
      pagination: { ...prevState.pagination, current: 1 },
    }))
    setQuery((prevState) => ({ ...prevState, superior: row.groupId }))
  }

  const [editRow, setEditRow] = useState(null)

  const handleAddNew = () => {
    setEditRow({})
  }

  const handleEditRow = (row) => {
    setEditRow(row)
  }

  const handleDeleteRow = (row) => {
    axios
      .get('/bi-task-scheduling-system/api/admin/job/delete', {
        params: {
          id: row.id,
        },
      })
      .then(() => {
        message.success('删除成功')
        getList()
      })
  }

  const checkJobDetail = (row) => {
    history.push(`/schedulingCenter/jobMgmt/jobDetail/${row.id}`)
  }

  const [depData, setDepData] = useState(null)
  const checkDeps = (row) => {
    setDepData(row)
  }

  const level1List = useLevel1List()
  const [level2List, setLevel2List] = useState([])

  const { run: getLevel2List } = useRequest((params) => {
    if (!params?.superior) {
      return Promise.resolve({ data: [] })
    }
    return axios.get('/bi-task-scheduling-system/api/user/common/listSubLevelsForComboBox', {
      params,
    })
  })

  const handleSupParentChange = useCallback(
    (v) => {
      getLevel2List({
        superior: v,
      }).then(({ data }) => {
        setLevel2List(
          data.map((item) => {
            return {
              label: item.hierarchy,
              value: item.id,
            }
          })
        )
      })
    },
    [setLevel2List, getLevel2List]
  )

  useEffect(() => {
    handleSupParentChange(query.supLevelParentId)
  }, [query.supLevelParentId, handleSupParentChange])

  const [groupList, setGroupList] = useState([])
  const { run: getGroupList } = useRequest(
    (params) => {
      return axios.get('/bi-task-scheduling-system/api/user/group/listGroupsForComboBox', {
        params,
      })
    },
    { manual: true }
  )

  const handleLevel2Change = useCallback(() => {
    getGroupList({
      levelId: query.supLevelId,
      levelParentId: query.supLevelParentId,
    }).then(({ data }) => {
      setGroupList(
        data.map((item) => {
          return {
            label: item.groupName,
            value: item.id,
          }
        })
      )
    })
  }, [getGroupList, query.supLevelParentId, query.supLevelId])

  useEffect(() => {
    handleLevel2Change()
  }, [handleLevel2Change])

  useEffect(() => {
    if (location.state) {
      setQuery(() => ({ ...location.state }))
    }
  }, [location])

  useEffect(() => {
    sessionStorage.setItem(location.pathname, JSON.stringify(query))
  }, [query, location.pathname])

  const doActionsRow = (row, act) => {
    axios
      .get(`/bi-task-scheduling-system/api/admin/job/${act}`, {
        params: { id: row.id },
      })
      .then(() => {
        message.success(act === 'start' ? '启用成功' : '禁用成功')
        getList()
      })
  }

  const [execRow, setExecRow] = useState(null)
  const handleExecRow = (row) => {
    setExecRow(row)
  }

  const interruptJob = (row) => {
    axios
      .get(`/bi-task-scheduling-system/api/admin/job/interrupt`, {
        params: { id: row.id },
      })
      .then(({ msg, success }) => {
        if (success) {
          message.success('操作成功：' + msg)
        } else {
          message.error('操作失败：' + msg)
        }
      })
  }

  return (
    <div className={'p-6'}>
      <div className={'flex items-start mb-2.5'}>
        <div className={'flex-1 grid grid-cols-4 gap-y-2 gap-x-6'}>
          <div className={'flex space-x-2.5'}>
            <span className={'whitespace-nowrap'} style={{ flexBasis: 57 }}>
              关键字
            </span>
            <Input
              value={query.keyWord}
              onChange={(e) => setQuery((prevState) => ({ ...prevState, keyWord: e.target.value }))}
              className={'flex-1'}
              allowClear
              placeholder={'关键字'}
            />
          </div>
          <div className={'flex space-x-2.5'}>
            <span className={'whitespace-nowrap'} style={{ flexBasis: 57 }}>
              层级一
            </span>
            <ExSelect
              value={query.supLevelParentId}
              onChange={(v) =>
                setQuery((prevState) => ({
                  ...prevState,
                  supLevelParentId: v,
                  supLevelId: undefined,
                  superior: undefined,
                }))
              }
              options={level1List}
              placeholder={'层级一'}
              allowClear
            />
          </div>
          <div className={'flex space-x-2.5'}>
            <span>层级二</span>
            <ExSelect
              options={level2List}
              value={query.supLevelId}
              onChange={(v) => setQuery((prevState) => ({ ...prevState, supLevelId: v, superior: undefined }))}
              notFoundContent={
                query.supLevelParentId ? undefined : (
                  <Empty description={'请先选择层级一'} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )
              }
              placeholder={'层级二'}
              allowClear
            />
          </div>
          <div className={'flex space-x-2.5'}>
            <span>分组</span>
            <ExSelect
              options={groupList}
              value={query.superior}
              onChange={(v) => setQuery((prevState) => ({ ...prevState, superior: v }))}
              placeholder={'分组'}
              allowClear
            />
          </div>
          <div className={'flex space-x-2.5'}>
            <span>执行结果</span>
            <ExSelect
              value={query.lastLogStatus}
              onChange={(v) => setQuery((prevState) => ({ ...prevState, lastLogStatus: v }))}
              options={[1, '-1', 0, '-3', 2].map((key) => ({ label: JOB_STATUS[key], value: key }))}
              allowClear
              placeholder={'执行结果'}
            />
          </div>
          <div className={'flex space-x-2.5'}>
            <span>是否超时</span>
            <ExSelect
              value={query.lastLogIsOverTime}
              onChange={(v) => setQuery((prevState) => ({ ...prevState, lastLogIsOverTime: v }))}
              options={[
                { label: '超时', value: 'true' },
                { label: '不超时', value: 'false' },
              ]}
              allowClear
              placeholder={'是否超时'}
            />
          </div>
          <div className={'flex space-x-2.5'}>
            <span>负责人</span>
            <ExSelect
              value={query.searchDirectorId}
              onChange={(v) => setQuery((prevState) => ({ ...prevState, searchDirectorId: v }))}
              options={userList.map((item) => ({ label: item.nameCn, value: item.idUser }))}
              allowClear
              placeholder={'负责人'}
            />
          </div>
          <div className={'flex space-x-2.5'}>
            <span>状态</span>
            <ExSelect
              options={[
                { label: '启用', value: 1 },
                { label: '禁用', value: 0 },
              ]}
              value={query.status}
              onChange={(v) => setQuery((prevState) => ({ ...prevState, status: v }))}
              allowClear
              placeholder={'状态'}
            />
          </div>
          <div className={'flex space-x-2.5'}>
            <span>分组状态</span>
            <ExSelect
              options={[
                { label: '启用', value: 1 },
                { label: '禁用', value: 0 },
              ]}
              value={query.groupStatus}
              onChange={(v) => setQuery((prevState) => ({ ...prevState, groupStatus: v }))}
              allowClear
              placeholder={'状态'}
            />
          </div>
        </div>
        <div className={'ml-4 space-x-2'}>
          <Button onClick={getList}>刷新</Button>
          {permissionsMap['bi-task-scheduling-system.JobController.insertOrUpdate'] && (
            <Button type={'primary'} icon={<PlusOutlined />} onClick={handleAddNew}>
              新建作业
            </Button>
          )}
        </div>
      </div>

      <Table {...table} loading={loading} />
      <EditModal editRow={editRow} setEditRow={setEditRow} onSuccess={getList} />
      <ExecModal currentRow={execRow} setCurrentRow={setExecRow} onSuccess={getList} />

      <DepTreeModal data={depData} setData={setDepData} type={'job'} />
    </div>
  )
}

export default JobMgmt
