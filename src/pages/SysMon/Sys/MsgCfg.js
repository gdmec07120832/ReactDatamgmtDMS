import React, {useCallback, useEffect, useRef, useState} from 'react'
import { connect } from 'react-redux'
import { Table, Button, Form, Select, Popconfirm, message, Input, Space } from 'antd'
import axios from '../../../utils/axios'
import DraggableModal from '../../../components/DraggableModal'
import useSWR from 'swr'
import OverflowTooltip from '../../../components/OverflowTooltip'

function MsgCfgModal(props) {
  const { visible, setVisible, record, onSuccess } = props
  const formRef = useRef(null)
  const handleSubmit = () => {
    formRef.current.validateFields().then((form) => {
      axios
        .post('/bi-sys/api/admin/noticeToObj/insertOrUpdate', {
          ...record,
          ...form,
        })
        .then(() => {
          message.success('保存成功')
          setVisible(false)
          onSuccess()
        })
    })
  }
  return (
    <DraggableModal
      visible={visible}
      title={record?.id ? '更新' : '新增'}
      destroyOnClose
      onOk={() => {
        handleSubmit()
      }}
      onCancel={() => setVisible(false)}>
      <Form ref={formRef} initialValues={record} wrapperCol={{ span: 20 }} labelCol={{ span: 4 }}>
        <Form.Item label="类型" name="messageType" rules={[{ required: true }]}>
          <Select>
            <Select.Option value={1}>钉钉群</Select.Option>
            <Select.Option value={3}>钉钉群机器人</Select.Option>
            <Select.Option value={2}>其他</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="名称" name="chartName" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="id" name="chartId" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
      </Form>
    </DraggableModal>
  )
}

const fetcher = ({ url, args }) =>
  axios
    .get(url, {
      params: args,
    })
    .then(({ data }) => data)

function MsgCfg(props) {
  const [table, setTable] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
      size: 'default',
      showTotal: (total) => `共${total}条记录`,
    },
    dataSource: [],
    columns: [
      {
        dataIndex: 'messageType',
        title: '类型',
        width: 150,
        render(text) {
          return <span>{{ 1: '钉钉群', 2: '其他', 3: '钉钉群机器人' }[text]}</span>
        },
      },
      { dataIndex: 'chartName', title: '名称' },
      {
        dataIndex: 'chartId',
        title: 'id',
        render(text) {
          return <OverflowTooltip>{text}</OverflowTooltip>
        },
      },
      {
        dataIndex: 'action',
        title: '操作',
        render(text, record) {
          return (
            <Space>
              {props.permissionsMap['bi-sys.NoticeToObjController.insertOrUpdate'] && (
                <Button
                  type={'link'}
                  size={'small'}
                  onClick={() => {
                    setVisible(true)
                    setCurrentRecord(record)
                  }}>
                  编辑
                </Button>
              )}
              {props.permissionsMap['bi-sys.NoticeToObjController.delete'] && (
                <Popconfirm title={'确定删除吗？'} placement={'topLeft'} onConfirm={() => deleteRow(record)}>
                  <Button type={'link'} size={'small'} danger>
                    删除
                  </Button>
                </Popconfirm>
              )}
            </Space>
          )
        },
        align: 'center',
        width: 120,
      },
    ],
  })
  const [query, _setQuery] = useState({
    keyword: '',
    messageType: undefined,
  })

  const setQuery = useCallback(
      (params) => {
        setTable((prevState) => ({
          ...prevState,
          pagination: { ...prevState.pagination, current: 1 },
        }))
        _setQuery(params)
      },
      [_setQuery]
  )

  const deleteRow = (row) => {
    axios
      .get('/bi-sys/api/admin/noticeToObj/deleteById', {
        params: {
          id: row.id,
        },
      })
      .then(() => {
        message.success('删除成功')
        refresh()
      })
  }

  const [currentRecord, setCurrentRecord] = useState({})
  const { current, pageSize } = table.pagination

  const { data: tableResult, mutate } = useSWR(
    {
      url: '/bi-sys/api/admin/noticeToObj/list',
      args: {
        page: current,
        pageSize,
        ...query,
      },
    },
    fetcher
  )
  useEffect(() => {
    if (tableResult) {
      const { list, totalRows } = tableResult
      setTable((prevState) => ({
        ...prevState,
        dataSource: list,
        pagination: { ...prevState.pagination, total: totalRows },
      }))
    }
  }, [tableResult])

  const handleTableChange = ({ current, pageSize }) => {
    setTable((prevState) => ({ ...prevState, pagination: { ...prevState.pagination, current, pageSize } }))
  }

  const [visible, setVisible] = useState(false)

  const refresh = () => {
    mutate()
  }

  return (
    <div className={'px-6 py-6'}>
      <div className="flex mb-2.5 space-x-4">
        <div className={'grid grid-cols-4 gap-x-6 flex-1'}>
          <div className="flex">
            <span className={'flex-none mr-2.5'}>名称</span>
            <Input
              className={'flex-1'}
              placeholder="名称"
              value={query.keyword}
              allowClear
              onChange={(e) => setQuery((prevState) => ({ ...prevState, keyword: e.target.value }))}
            />
          </div>
          <div className="flex">
            <span className={'flex-none mr-2.5'}>消息类型</span>
            <Select
              className={'flex-1'}
              value={query.messageType}
              onChange={(value) => setQuery((prevState) => ({ ...prevState, messageType: value }))}
              allowClear
              placeholder="消息类型"
              style={{ width: '100%' }}>
              <Select.Option value={1}>钉钉群</Select.Option>
              <Select.Option value={3}>钉钉群机器人</Select.Option>
              <Select.Option value={2}>其他</Select.Option>
            </Select>
          </div>
        </div>
        {props.permissionsMap['bi-sys.NoticeToObjController.insertOrUpdate'] && (
          <Button
            type={'primary'}
            size={'default'}
            onClick={() => {
              setVisible(true)
              setCurrentRecord({})
            }}>
            新增
          </Button>
        )}
      </div>
      <MsgCfgModal visible={visible} setVisible={setVisible} record={currentRecord} onSuccess={refresh} />
      <Table {...table} tableLayout={'fixed'} rowKey="id" size="small" onChange={handleTableChange} />
    </div>
  )
}

export default connect((state) => {
  return {
    permissionsMap: state.user.userInfo?.permissionsMap,
  }
})(MsgCfg)
