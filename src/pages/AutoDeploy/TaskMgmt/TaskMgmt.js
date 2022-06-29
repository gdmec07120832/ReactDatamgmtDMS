import React, { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Button, Form, Input, message, Popconfirm, Select, Space, Table } from 'antd'
import useTable from '../../../hooks/useTable'
import { useRequest } from 'ahooks'
import axios from '../../../utils/axios'
import OverflowTooltip from '../../../components/OverflowTooltip'
import { useHistory, useLocation } from 'react-router-dom'
import DraggableModal from '../../../components/DraggableModal'
import { useForm } from 'antd/es/form/Form'
import store from 'store2'

const TASK_STATUS = {
  Created: '新建',
  Reject: '驳回',
  Cancel: '撤回',
  PendingTrial: '待审',
  ToBeReleased: '待部署',
  Releasing: '正在部署',
  ReleasedSuccess: '部署成功',
  ReleasedError: '部署失败',
}

const TASK_TYPE = {
  FileDeploy: '文件部署',
  BIPermission: 'BI权限',
  DataSynchronism: '数据同步',
  DataRequirement: '数据集成',
}

const CancelPrompt = (props) => {
  const { visible, setVisible, currentCancelRecord, onSubmitted } = props
  const [form] = useForm()
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (visible) {
      form.resetFields()
    }
  }, [visible, form])

  const handleOk = () => {
    form.validateFields().then((values) => {
      setLoading(true)
      axios
        .get('/bi-auto-deploy/api/admin/task/submitToAuditOrCancel', {
          params: {
            taskId: currentCancelRecord?.id,
            taskStatus: 'Cancel',
            reason: values.reason,
          },
        })
        .then(() => {
          message.success('撤回成功')
          setVisible(false)
          onSubmitted()
        })
        .finally(() => {
          setLoading(false)
        })
    })
  }

  return (
    <DraggableModal
      title={'撤回'}
      visible={visible}
      onOk={handleOk}
      okButtonProps={{ loading }}
      onCancel={() => setVisible(false)}>
      <Form form={form}>
        <Form.Item label={'撤回理由'} name={'reason'} rules={[{ required: true }]}>
          <Input maxLength={50} />
        </Form.Item>
      </Form>
    </DraggableModal>
  )
}

function TaskMgmt() {
  const permissionsMap = useSelector((state) => state.user.permissionsMap)
  const history = useHistory()
  const location = useLocation()
  const storage = store.session.get(`${location.pathname}-query`)

  const { page: _page, pageSize: _pageSize, ...restStorage } = storage || {}

  const { table, setTable } = useTable({
    rowKey: 'id',
    pagination: {
      current: _page || 1,
      pageSize: _pageSize || 10,
    },
    scroll: { x: 1500 },
    columns: [
      { title: '主键', dataIndex: 'id', fixed: true, width: 100 },
      {
        title: '任务名称',
        dataIndex: 'taskName',
        fixed: true,
      },
      { title: '描述', dataIndex: 'description', width: 100 },
      {
        title: '创建人',
        dataIndex: 'creator',
        width: 100,
        render: (_, record) => {
          return record?.['creator']?.['nameCn']
        },
      },
      {
        title: '任务类型',
        dataIndex: 'taskType',
        width: 100,
        render: (text) => {
          return <OverflowTooltip>{TASK_TYPE[text]}</OverflowTooltip>
        },
      },
      { title: '更新时间', dataIndex: 'updateDate', width: 160 },
      {
        title: '自动部署',
        dataIndex: 'autoDeploy',
        width: 100,
        render: (text) => {
          return text ? '是' : '否'
        },
      },
      {
        title: '任务状态',
        dataIndex: 'status',
        width: 100,
        render: (text) => {
          return <OverflowTooltip>{TASK_STATUS[text]}</OverflowTooltip>
        },
      },
      {
        title: '处理状态',
        dataIndex: 'processState',
        width: 100,
        render(text) {
          return { UNDISPOSED: '未处理', IN_HAND: '处理中', COMPLETE: '已完成' }[text]
        },
      },
      {
        title: '操作',
        dataIndex: 'actions',
        width: 180,
        fixed: 'right',
        render: (_, record) => {
          const { status, dwModelAuditBillId } = record
          return (
            <Space>
              {['PendingTrial', 'ToBeReleased'].includes(status) &&
                permissionsMap['bi-auto-deploy.TaskController.submitToAuditOrCancel'] && (
                  <Button size={'small'} type={'link'} onClick={() => cancelTask(record)}>
                    撤回
                  </Button>
                )}
              {(['Created', 'Cancel'].includes(status) || (status === 'Reject' && !dwModelAuditBillId)) &&
                permissionsMap['bi-auto-deploy.TaskController.submitToAuditOrCancel'] && (
                  <Popconfirm title={'确定提交审核吗？'} onConfirm={() => updateRecordStatus(record, 'PendingTrial')}>
                    <Button size={'small'} type={'link'}>
                      提审
                    </Button>
                  </Popconfirm>
                )}
              {(['Created', 'Cancel'].includes(status) || (status === 'Reject' && !dwModelAuditBillId)) &&
                permissionsMap['bi-auto-deploy.TaskController.saveOrUpdate'] && (
                  <Button size={'small'} type={'link'} onClick={() => editRecord(record)}>
                    编辑
                  </Button>
                )}
              {(['PendingTrial', 'ToBeReleased', 'ReleasedSuccess', 'ReleasedError'].includes(status) ||
                (status === 'Reject' && dwModelAuditBillId)) && (
                <Button size={'small'} type={'link'} onClick={() => checkRecord(record)}>
                  查看
                </Button>
              )}
              {['Created', 'Reject', 'Cancel'].includes(status) &&
                permissionsMap['bi-auto-deploy.TaskController.delete'] && (
                  <Popconfirm title={'确定删除吗?'} onConfirm={() => handleDelete(record)}>
                    <Button size={'small'} type={'link'} danger>
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

  const [query, _setQuery] = useState({
    name: '',
    taskStatus: undefined,
    taskType: undefined,
    ...restStorage,
  })
  const { current: page, pageSize } = table.pagination
  const { run: fetchList, loading } = useRequest(
    () => {
      return axios
        .get('/bi-auto-deploy/api/admin/listTaskForCreator/list', {
          params: {
            page,
            pageSize,
            ...query,
          },
        })
        .then(({ data: { list, totalRows } }) => {
          setTable((prevState) => ({
            ...prevState,
            dataSource: list,
            pagination: { ...prevState.pagination, total: totalRows },
          }))
        })
    },
    { manual: true, debounceInterval: 200 }
  )
  const setQuery = useCallback(
    (args) => {
      setTable((prevState) => ({
        ...prevState,
        pagination: { ...prevState.pagination, current: 1 },
      }))
      _setQuery(args)
    },
    [setTable]
  )

  useEffect(() => {
    fetchList()
    store.session.set(`${location.pathname}-query`, { ...query, page, pageSize })
  }, [page, pageSize, query, fetchList, location.pathname])

  const handleDelete = (record) => {
    axios
      .get('/bi-auto-deploy/api/admin/task/delete', {
        params: { taskId: record.id },
      })
      .then(() => {
        message.success('删除成功')
        fetchList()
      })
  }

  const updateRecordStatus = (record, status) => {
    let url
    let msg = ''
    switch (status) {
      case 'PendingTrial':
        url = '/bi-auto-deploy/api/admin/task/submitToAuditOrCancel'
        msg = '提交审核'
        break
      default:
        url = ''
    }

    axios
      .get(url, {
        params: {
          taskId: record.id,
          taskStatus: status,
        },
      })
      .then(() => {
        message.success(msg + '成功')
        fetchList()
      })
  }

  const editRecord = (record) => {
    history.push(`/autoDeploy/taskMgmt/${record.id}`)
  }

  const checkRecord = (record) => {
    history.push(`/autoDeploy/taskMgmt/${record.id}/readonly`)
  }

  const createRecord = () => {
    history.push('/autoDeploy/taskMgmt/create')
  }

  const [cancelPromptVisible, setCancelPromptVisible] = useState(false)
  const [currentCancelRecord, setCurrentCancelRecord] = useState(null)

  const cancelTask = (record) => {
    setCurrentCancelRecord(record)
    setCancelPromptVisible(true)
  }

  const refreshPage = () => {
    fetchList()
  }

  return (
    <div className={'p-6'}>
      <div className={'flex space-x-6 mb-2.5'}>
        <div className={'flex-1 grid grid-cols-4 gap-x-6'}>
          <div className="flex space-x-2.5">
            <span className={'flex-none'}>关键字</span>
            <Input
              allowClear
              placeholder={'关键字'}
              value={query.name}
              onChange={(e) => setQuery((prevState) => ({ ...prevState, name: e.target.value }))}
            />
          </div>
          <div className="flex space-x-2.5">
            <span className="flex-none">任务类型</span>
            <Select
              style={{ flex: 1 }}
              value={query.taskType}
              placeholder={'任务类型'}
              onChange={(v) => setQuery((prevState) => ({ ...prevState, taskType: v }))}
              allowClear>
              {Object.keys(TASK_TYPE).map((key) => {
                return (
                  <Select.Option value={key} key={key}>
                    {TASK_TYPE[key]}
                  </Select.Option>
                )
              })}
            </Select>
          </div>
          <div className="flex space-x-2.5">
            <span className={'flex-none'}>任务状态</span>
            <Select
              placeholder={'任务状态'}
              style={{ flex: 1 }}
              value={query.taskStatus}
              onChange={(v) => setQuery((prevState) => ({ ...prevState, taskStatus: v }))}
              allowClear>
              {Object.keys(TASK_STATUS).map((key) => {
                return (
                  <Select.Option value={key} key={key}>
                    {TASK_STATUS[key]}
                  </Select.Option>
                )
              })}
            </Select>
          </div>
        </div>

        <div className={'space-x-2'}>
          <Button onClick={refreshPage}>刷新</Button>
          {permissionsMap['bi-auto-deploy.TaskController.saveOrUpdate'] && (
            <Button type={'primary'} onClick={createRecord}>
              新增
            </Button>
          )}
        </div>
      </div>

      <Table {...table} loading={loading} />

      <CancelPrompt
        visible={cancelPromptVisible}
        setVisible={setCancelPromptVisible}
        onSubmitted={fetchList}
        currentCancelRecord={currentCancelRecord}
      />
    </div>
  )
}

export { TASK_TYPE, TASK_STATUS }

export default TaskMgmt
