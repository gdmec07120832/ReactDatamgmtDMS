import React, { useEffect, useRef, useState } from 'react'
import { Button, Table, Form, Input, Popconfirm, message, InputNumber, Space } from 'antd'
import { connect } from 'react-redux'
import DraggableModal from '../../components/DraggableModal'
import axios from '../../utils/axios'
import OverflowTooltip from '../../components/OverflowTooltip'
import { useRequest } from 'ahooks'

function RuleTempConfig(props) {
  const [formInitialValues, setFormInitialValues] = useState({})
  const [table, setTable] = useState({
    loading: false,
    pagination: {
      total: 0,
      current: 1,
      pageSize: 10,
      size: 'default',
      showTotal: (total) => `共${total}条记录`,
    },
    data: [],
    columns: [
      { dataIndex: 'seq', title: '序号', width: 80 },
      { dataIndex: 'tempName', title: '规则模版', align: 'center' },
      {
        dataIndex: 'description',
        title: '详细描述',
        render: (text) => {
          return <OverflowTooltip>{text}</OverflowTooltip>
        },
        align: 'center',
      },
      {
        dataIndex: 'action',
        title: '操作',
        align: 'center',
        width: 150,
        render: (text, record) => {
          return (
            <Space>
              {props.permissionsMap['bi-data-quality.RuleTemplateController.saveOrUpdate'] ? (
                <Button
                  size={'small'}
                  type="link"
                  onClick={() => {
                    setFormInitialValues(() => record)
                    setVisible(true)
                  }}>
                  编辑
                </Button>
              ) : null}
              {props.permissionsMap['bi-data-quality.RuleTemplateController.delInfo'] ? (
                <Popconfirm title="确定删除吗？" onConfirm={() => deleteTempRow(record)}>
                  <Button type="text" size="small" danger>
                    删除
                  </Button>
                </Popconfirm>
              ) : null}
              {!props.permissionsMap['bi-data-quality.RuleTemplateController.saveOrUpdate'] &&
                !props.permissionsMap['bi-data-quality.RuleTemplateController.delInfo'] &&
                '/'}
            </Space>
          )
        },
      },
    ],
  })
  const deleteTempRow = (record) => {
    axios
      .get('/bi-data-quality/api/admin/ruleTemplate/delInfo', {
        params: {
          id: record.id,
        },
      })
      .then(() => {
        message.success('删除成功')
        getList()
      })
  }
  const [searchKeyword, setSearchKeyword] = useState('')
  const { current, pageSize } = table.pagination
  const { run: getList, loading } = useRequest(
    () => {
      return axios
        .get('/bi-data-quality/api/admin/ruleTemplate/queryPage', {
          params: {
            page: current,
            pageSize,
            keyword: searchKeyword,
          },
        })
        .then(({ data: { list, totalRows } }) => {
          setTable((prevState) => ({
            ...prevState,
            data: list,
            pagination: {
              ...prevState.pagination,
              total: totalRows,
              current: Math.max(Math.min(current, Math.ceil(totalRows / pageSize)), 1),
            },
          }))
        })
    },
    { manual: true, debounceInterval: 200 }
  )

  useEffect(getList, [getList, current, pageSize, searchKeyword])

  const [visible, setVisible] = useState(false)
  const formRef = useRef(null)
  const handleSubmit = () => {
    formRef.current.validateFields().then((form) => {
      const { tempName, description, seq, tempCode } = form
      axios
        .post('/bi-data-quality/api/admin/ruleTemplate/saveOrUpdate', {
          ...formInitialValues,
          tempName,
          tempCode,
          description,
          seq,
        })
        .then(() => {
          message.success('保存成功')
          setVisible(false)
          getList()
        })
    })
  }

  const handleTableChange = ({ current, pageSize }) => {
    setTable((prevState) => ({ ...prevState, pagination: { ...prevState.pagination, current, pageSize } }))
  }
  return (
    <div className={'px-6 py-6'}>
      <div className="flex justify-between mb-2.5">
        <Input
          value={searchKeyword}
          allowClear
          onChange={(e) => {
            setSearchKeyword(e.target.value)
            setTable((prevState) => ({ ...prevState, pagination: { ...prevState.pagination, current: 1 } }))
          }}
          style={{ width: 200 }}
          placeholder={'输入关键字搜索'}
        />
        <div>
          {props.permissionsMap['bi-data-quality.RuleTemplateController.saveOrUpdate'] ? (
            <Button
              type="primary"
              onClick={() => {
                setFormInitialValues(() => ({}))
                setVisible(true)
              }}>
              新增
            </Button>
          ) : null}
        </div>
      </div>
      <Table
        tableLayout={'fixed'}
        loading={loading}
        rowKey="id"
        columns={table.columns}
        dataSource={table.data}
        onChange={handleTableChange}
        pagination={table.pagination}
        size="small"
      />
      <DraggableModal
        title="规则配置模版"
        destroyOnClose
        visible={visible}
        onOk={handleSubmit}
        onCancel={() => setVisible(false)}>
        <Form ref={formRef} initialValues={formInitialValues} labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
          <Form.Item name="tempName" label="规则模版名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="规则模版描述" rules={[{ required: true }]}>
            <Input.TextArea autoSize={{ minRows: 3, maxRows: 5 }} />
          </Form.Item>
          <Form.Item name="tempCode" label="CODE" rules={[{ required: false }]}>
            <Input maxLength={20} />
          </Form.Item>
          <Form.Item
            name="seq"
            label="序号"
            rules={[{ required: true }, { type: 'number', min: 1, message: '请输入大于等于1的数字' }]}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
        </Form>
      </DraggableModal>
    </div>
  )
}

export default connect((state) => {
  return {
    permissionsMap: state.user?.userInfo?.permissionsMap || {},
  }
})(RuleTempConfig)
