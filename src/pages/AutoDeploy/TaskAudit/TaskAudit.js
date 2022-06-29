import React, { useCallback, useEffect, useState } from 'react'
import { Button, Form, Input, message, Select, Space, Switch, Table } from 'antd'
import useTable from '../../../hooks/useTable'
import { useRequest } from 'ahooks'
import axios from '../../../utils/axios'
import OverflowTooltip from '../../../components/OverflowTooltip'
import { TASK_TYPE, TASK_STATUS } from '../TaskMgmt/TaskMgmt'
import DraggableModal from '../../../components/DraggableModal'
import { useForm } from 'antd/es/form/Form'
import { useHistory, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import store from 'store2'

const RejectOrPassModal = (props) => {
  const { visible, setVisible, currentTask, auditResult, onSubmitted } = props
  const [form] = useForm()

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        reason: '',
        autoDeploy: currentTask?.autoDeploy,
      })
    }
  }, [visible, currentTask?.autoDeploy, form])

  const handleOk = () => {
    form.validateFields().then((values) => {
      setLoading(true)
      axios
        .get('/bi-auto-deploy/api/admin/task/updateStatus', {
          params: {
            taskId: currentTask?.id,
            reason: values.reason,
            autoDeploy: values.autoDeploy,
            taskStatus: auditResult,
          },
        })
        .then(() => {
          message.success('操作成功')
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
      title={auditResult === 'Reject' ? '审核不通过' : '审核通过'}
      visible={visible}
      onOk={handleOk}
      okButtonProps={{ loading }}
      onCancel={() => setVisible(false)}>
      <Form form={form}>
        {auditResult === 'Reject' && (
          <Form.Item label={'不通过理由'} name={'reason'} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        )}
        {auditResult === 'ToBeReleased' && (
          <Form.Item label={'是否自动部署'} name={'autoDeploy'} valuePropName={'checked'} rules={[{ required: true }]}>
            <Switch />
          </Form.Item>
        )}
      </Form>
    </DraggableModal>
  )
}

function TaskAudit() {
  const permissionsMap = useSelector((state) => state.user.permissionsMap)
  const history = useHistory()
  const location = useLocation()
  const storage = store.session.get(`${location.pathname}-query`)
  const { page: _page, pageSize: _pageSize, ...restStorage } = storage || {}
  const [query, _setQuery] = useState({
    keyword: '',
    taskType: undefined,
    ...restStorage,
  })
  const { table, setTable } = useTable({
    rowKey: 'id',
    pagination: {
      current: _page || 1,
      pageSize: _pageSize || 10,
    },
    scroll: { x: 1500 },
    columns: [
      { title: '主键', dataIndex: 'id', width: 100, fixed: true },
      {
        title: '任务名称',
        dataIndex: 'taskName',
        fixed: true,
      },
      { title: '描述', dataIndex: 'description', width: 100, },
      {
        title: '创建人',
        dataIndex: 'creator',
        render: (text, record) => {
          return <OverflowTooltip>{record?.creator?.nameCn}</OverflowTooltip>
        },
        width: 100,
      },
      {
        title: '任务类型',
        dataIndex: 'taskType',
        render: (text) => {
          return <OverflowTooltip>{TASK_TYPE[text]}</OverflowTooltip>
        },
        width: 100,
      },
      {
        title: '更新时间',
        dataIndex: 'updateDate',
        width: 160,
      },
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
        dataIndex: 'processStateName',
        width: 100,
        render(text) {
          return { UNDISPOSED: '未处理', IN_HAND: '处理中', COMPLETE: '已完成' }[text]
        },
      },
      {
        title: '操作',
        dataIndex: 'actions',
        fixed: 'right',
        width: 160,
        render: (_, record) => {
          return (
            <Space>
              {permissionsMap['bi-auto-deploy.AuditTaskController.updateStatus'] && (
                <Button type={'link'} size={'small'} onClick={() => passTask(record)}>
                  通过
                </Button>
              )}
              {permissionsMap['bi-auto-deploy.AuditTaskController.updateStatus'] && (
                <Button type={'link'} size={'small'} onClick={() => rejectTask(record)} danger>
                  不通过
                </Button>
              )}
              <Button type={'link'} size={'small'} onClick={() => checkTask(record)}>
                查看
              </Button>
            </Space>
          )
        },
      },
    ],
  })

  const { current: page, pageSize } = table.pagination
  const { keyword, taskType } = query
  const { run: fetchList, loading } = useRequest(
    () => {
      return axios
        .get('/bi-auto-deploy/api/admin/taskForAudit/list', {
          params: {
            page,
            pageSize,
            name: keyword,
            taskType,
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
    {
      manual: true,
      debounceInterval: 200,
    }
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
  }, [page, pageSize, query, setTable, fetchList, location.pathname])

  const [currentTask, setCurrentTask] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [auditResult, setAuditResult] = useState('Reject')

  const rejectTask = (record) => {
    setAuditResult('Reject')
    setCurrentTask(record)
    setModalVisible(true)
  }

  const passTask = (record) => {
    setAuditResult('ToBeReleased')
    setCurrentTask(record)
    setModalVisible(true)
  }

  const checkTask = (record) => {
    history.push(`/autoDeploy/taskAudit/${record.id}/readonly`)
  }

  return (
    <div className={'p-6'}>
      <div className="grid grid-cols-4 gap-x-6 mb-2.5">
        <div className={'flex space-x-2.5'}>
          <span className={'flex-none'}>关键字</span>
          <Input
            value={query.keyword}
            className={'flex-1'}
            placeholder={'关键字'}
            allowClear
            onChange={(e) => setQuery((prevState) => ({ ...prevState, keyword: e.target.value }))}
          />
        </div>
        <div className={'flex space-x-2.5'}>
          <span className={'flex-none'}>任务类型</span>
          <Select
            className={'flex-1'}
            allowClear
            placeholder={'任务类型'}
            value={query.taskType}
            onChange={(v) => setQuery((prevState) => ({ ...prevState, taskType: v }))}>
            {Object.keys(TASK_TYPE).map((key) => (
              <Select.Option value={key} key={key}>
                {TASK_TYPE[key]}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>
      <Table {...table} loading={loading} />

      <RejectOrPassModal
        visible={modalVisible}
        setVisible={setModalVisible}
        auditResult={auditResult}
        currentTask={currentTask}
        onSubmitted={fetchList}
      />
    </div>
  )
}

export default TaskAudit
