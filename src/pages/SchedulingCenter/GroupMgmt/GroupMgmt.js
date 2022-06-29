import React, { useEffect, useState } from 'react'
import { Button, Empty, Input, message, Popconfirm, Table, Tag } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import useTable from '../../../hooks/useTable'
import ExSelect from '../../../components/Select'
import { useRequest } from 'ahooks'
import axios from '../../../utils/axios'
import CollapseButtons from '../../../components/CollapseButtons'
import ExecModal from '../components/ExecModal'
import EditModal from './EditModal'
import useLevel1List from '../hooks/useLevel1List'
import { useHistory } from 'react-router-dom'
import DepTreeModal from '../components/DepTreeModal'
import { useSelector } from 'react-redux'

function GroupMgmt() {
  const permissionsMap = useSelector((state) => state.user.permissionsMap)
  const history = useHistory()
  const { table, setTable } = useTable({
    rowKey: 'id',
    columns: [
      { dataIndex: 'id', title: 'ID', width: 80 },
      { dataIndex: 'hierarchy', title: '层级' },
      { dataIndex: 'groupName', title: '分组名称' },
      {
        dataIndex: 'superiorTri',
        title: '依赖触发',
        render(text) {
          return text ? '是' : '否'
        },
      },
      { dataIndex: 'cron', title: 'CRON' },
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
        dataIndex: 'actions',
        title: '操作',
        width: 300,
        render(text, row) {
          const { status } = row
          return (
            <CollapseButtons max={6}>
              {status === 1 && permissionsMap['bi-task-scheduling-system.GroupController.pauseGroup'] && (
                <Popconfirm title={'确定禁用吗？'} onConfirm={doRowActions.bind(null, row, 'pause')}>
                  <Button type={'link'} size={'small'}>
                    禁用
                  </Button>
                </Popconfirm>
              )}
              {status !== 1 && permissionsMap['bi-task-scheduling-system.GroupController.startGroup'] && (
                <Popconfirm title={'确定启用吗？'} onConfirm={doRowActions.bind(null, row, 'start')}>
                  <Button type={'link'} size={'small'}>
                    启用
                  </Button>
                </Popconfirm>
              )}

              {permissionsMap['bi-task-scheduling-system.GroupController.executeGroup'] && (
                <Button type={'link'} size={'small'} onClick={handleExecRow.bind(null, row)}>
                  执行
                </Button>
              )}
              {permissionsMap['bi-task-scheduling-system.GroupController.deleteGroup'] && (
                <Popconfirm title={'确定删除吗？'} onConfirm={deleteRow.bind(null, row)}>
                  <Button type={'link'} size={'small'} danger>
                    删除
                  </Button>
                </Popconfirm>
              )}
              {permissionsMap['bi-task-scheduling-system.GroupController.insertOrUpdate'] && (
                <Button type={'link'} size={'small'} onClick={handleEdit.bind(null, row)}>
                  编辑
                </Button>
              )}
              <Button type={'link'} size={'small'} onClick={checkDeps.bind(null, row)}>
                依赖
              </Button>
              {permissionsMap['bi-task-scheduling-system.JobController'] && (
                <Button type={'link'} size={'small'} onClick={checkGroupDetail.bind(null, row)}>
                  详情
                </Button>
              )}
            </CollapseButtons>
          )
        },
      },
    ],
  })
  const [query, setQuery] = useState({
    status: undefined,
    keyWord: null,
    supParentId: undefined,
    superior: undefined,
  })
  const [editRow, setEditRow] = useState(null)

  const handleAddNew = () => {
    setEditRow({})
  }

  const { current: page, pageSize } = table.pagination
  const { run: getList, loading } = useRequest(
    () => {
      return axios
        .get('/bi-task-scheduling-system/api/user/group/queryGroup', {
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

  const handleSupParentChange = (v) => {
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
    setQuery((prevState) => ({ ...prevState, supParentId: v, superior: undefined }))
  }

  useEffect(() => {
    getList()
  }, [page, pageSize, getList, query])

  const doRowActions = (row, act) => {
    axios
      .get(`/bi-task-scheduling-system/api/admin/group/${act}`, {
        params: { id: row.id },
      })
      .then(() => {
        message.success(act === 'start' ? '启用成功' : '禁用成功')
        getList()
      })
  }
  const deleteRow = (row) => {
    axios
      .get('/bi-task-scheduling-system/api/admin/group/delete', {
        params: {
          id: row.id,
        },
      })
      .then(() => {
        message.success('删除成功')
        getList()
      })
  }

  const [depsRow, setDepsRow] = useState(null)
  const checkDeps = (row) => {
    setDepsRow(row)
  }

  const handleEdit = (row) => {
    setEditRow(row)
  }

  const [execRow, setExecRow] = useState(null)
  const handleExecRow = (row) => {
    setExecRow(row)
  }

  const checkGroupDetail = (row) => {
    history.push('/schedulingCenter/jobMgmt', {
      superior: row.id,
    })
  }

  return (
    <div className={'p-6'}>
      <div className={'flex mb-3'}>
        <div className={'flex-1 grid grid-cols-4 gap-x-6'}>
          <div className="flex space-x-2.5">
            <span className="flex-none">层级一</span>
            <ExSelect
              value={query.supParentId}
              onChange={(v) => {
                handleSupParentChange(v)
              }}
              options={level1List}
              placeholder={'层级一'}
              allowClear
            />
          </div>
          <div className="flex space-x-2.5">
            <span className="flex-none">层级二</span>
            <ExSelect
              notFoundContent={
                query.supParentId ? undefined : (
                  <Empty description={'请先选择层级一'} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )
              }
              value={query.superior}
              options={level2List}
              onChange={(v) => setQuery((prevState) => ({ ...prevState, superior: v }))}
              placeholder={'层级二'}
              allowClear
            />
          </div>
          <div className="flex space-x-2.5">
            <span className="flex-none">状态</span>
            <ExSelect
              showSearch={false}
              value={query.status}
              onChange={(v) => setQuery((prevState) => ({ ...prevState, status: v }))}
              options={[
                { label: '启用', value: '1' },
                { label: '禁用', value: '0' },
              ]}
              allowClear
              placeholder={'状态'}
            />
          </div>
          <div className="flex space-x-2.5">
            <span className="flex-none">关键字</span>
            <Input
              value={query.keyWord}
              onChange={(e) => setQuery((prevState) => ({ ...prevState, keyWord: e.target.value }))}
              allowClear
              placeholder={'关键字'}
            />
          </div>
        </div>

        <div className={'ml-4 space-x-2'}>
          <Button onClick={getList}>刷新</Button>
          {permissionsMap['bi-task-scheduling-system.GroupController.insertOrUpdate'] && (
            <Button type={'primary'} icon={<PlusOutlined />} onClick={handleAddNew}>
              新建分组
            </Button>
          )}
        </div>
      </div>

      <Table {...table} loading={loading} />

      <EditModal editRow={editRow} setEditRow={setEditRow} onSuccess={getList} />
      <ExecModal currentRow={execRow} setCurrentRow={setExecRow} />
      <DepTreeModal data={depsRow} setData={setDepsRow} type={'group'} />
    </div>
  )
}

export default GroupMgmt
