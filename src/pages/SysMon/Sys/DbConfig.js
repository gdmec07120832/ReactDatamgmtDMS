import React, { useEffect, useRef, useState } from 'react'
import { connect } from 'react-redux'
import { Button, Col, Form, Input, message, Popconfirm, Row, Space, Switch, Table, Tag } from 'antd'
import axios from '../../../utils/axios'
import cloneDeep from 'lodash/cloneDeep'
import OverflowTooltip from '../../../components/OverflowTooltip'
import DraggableModal from '../../../components/DraggableModal'
import { useForm } from 'antd/es/form/Form'
import { useRequest, useUpdate } from 'ahooks'
import useConstant from '../../../hooks/useConstant'
import ExSelect from '../../../components/Select'

function DbModal(props) {
  const { visible, setVisible, initialValues, getList, dbType } = props
  const [loading, setLoading] = useState(false)
  const forceUpdate = useUpdate()
  const [form] = useForm()
  useEffect(() => {
    if (visible) {
      form.setFieldsValue({ ...initialValues, dbType: initialValues.dbType ? String(initialValues.dbType) : undefined })
      forceUpdate()
    } else {
      form.resetFields()
    }
  }, [initialValues, form, visible, forceUpdate])
  const handleSubmit = () => {
    form.validateFields().then((formData) => {
      setLoading(true)
      axios
        .post('/bi-sys/api/admin/datasourceConfig/saveOrUpdate', {
          ...initialValues,
          ...formData,
        })
        .then(() => {
          message.success('保存成功')
          setLoading(false)
          setVisible(false)
          getList()
        })
        .catch(() => {
          setLoading(false)
        })
    })
  }

  return (
    <DraggableModal
      title={'数据库配置'}
      visible={visible}
      width={800}
      okButtonProps={{ loading: loading }}
      onOk={() => handleSubmit()}
      onCancel={() => setVisible(false)}>
      <Form form={form} labelCol={{ flex: '0 0 100px' }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="名称" name="dbCnName" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            {!form.getFieldValue('apiLink') && (
              <Form.Item label="数据源" name="sourceName" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            )}
          </Col>
          <Col span={12}>
            <Form.Item label="数据库类型" name="dbType">
              <ExSelect options={dbType} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="描述" name="description">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Host" name="host">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Port" name="port">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="用户名" name="username">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="密码" name="password">
              <Input type="password" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={'Api链接'} name={'apiLink'} valuePropName={'checked'}>
              <Switch onChange={forceUpdate} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={'ApiKey'} name={'apiKey'}>
              <Input placeholder={'access token管理中心的api-key'}/>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </DraggableModal>
  )
}

function DbConfig(props) {
  const [query, setQuery] = useState({
    dbType: undefined,
    keyword: '',
  })

  const dbTypeRef = useRef([])
  const dbType = useConstant('data_source_type')
  dbTypeRef.current = dbType

  const [visible, setVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState({})
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
      { dataIndex: 'dbCnName', title: '名称' },
      { dataIndex: 'sourceName', title: '数据源', width: 120 },
      {
        dataIndex: 'dbType',
        title: '数据库类型',
        render(text) {
          return dbTypeRef.current.find((item) => item.value === String(text))?.key
        },
      },
      {
        dataIndex: 'host',
        title: 'Host',
        render(text) {
          return <OverflowTooltip>{text}</OverflowTooltip>
        },
      },
      { dataIndex: 'port', title: 'Port' },
      { dataIndex: 'username', title: '用户名' },
      {
        dataIndex: 'description',
        title: '描述',
        render(text) {
          return <OverflowTooltip>{text}</OverflowTooltip>
        },
      },
      {
        dataIndex: 'status',
        title: '状态',
        render(text) {
          return <Tag color={{ 1: 'success', 0: 'error' }[text]}>{{ 1: '启用', 0: '禁用' }[text]}</Tag>
        },
      },
      {
        dataIndex: 'action',
        title: '操作',
        width: 150,
        render(text, record) {
          const { status } = record
          return (
            <Space>
              {status !== 1 && props.permissionsMap['bi-sys.DatasourceConfigController.start'] && (
                <Popconfirm title={'确定启用吗？'} onConfirm={toggleStatus.bind(null, record, 'start')}>
                  <Button size={'small'} type={'link'}>
                    启用
                  </Button>
                </Popconfirm>
              )}
              {status === 1 && props.permissionsMap['bi-sys.DatasourceConfigController.pause'] && (
                <Popconfirm title={'确定禁用吗？'} onConfirm={toggleStatus.bind(null, record, 'pause')}>
                  <Button size={'small'} type={'link'} danger>
                    禁用
                  </Button>
                </Popconfirm>
              )}
              {props.permissionsMap['bi-sys.DatasourceConfigController.saveOrUpdate'] && (
                <Button
                  size={'small'}
                  type={'link'}
                  onClick={() => {
                    setVisible(true)
                    setCurrentRecord(record)
                  }}>
                  编辑
                </Button>
              )}
            </Space>
          )
        },
      },
    ],
  })
  const { current, pageSize } = table.pagination
  const { run: getList, loading } = useRequest(
    () => {
      return axios
        .get('/bi-sys/api/admin/datasourceConfig/queryPage', {
          params: {
            pageSize,
            currentPage: current,
            ...query,
          },
        })
        .then(({ data: { list, totalRows } }) => {
          setTable((prevState) => {
            const newTable = cloneDeep(prevState)
            newTable.pagination.total = totalRows
            newTable.dataSource = list
            return newTable
          })
        })
    },
    { manual: true, debounceInterval: 200 }
  )

  const toggleStatus = (record, act) => {
    const url = `/bi-sys/api/admin/datasourceConfig/${act}`
    axios
      .get(url, {
        params: {
          id: record.id,
        },
      })
      .then(() => {
        message.success('操作成功')
        getList()
      })
  }

  useEffect(() => {
    setTable((prevState) => ({
      ...prevState,
      pagination: { ...prevState.pagination, current: 1 },
    }))
  }, [query])

  useEffect(getList, [current, pageSize, getList, query])
  const handleTableChange = ({ current, pageSize }) => {
    setTable((prevState) => ({ ...prevState, pagination: { ...prevState.pagination, current, pageSize } }))
  }
  return (
    <div className={'px-6 py-6'}>
      <div className="flex mb-2.5 space-x-4">
        <div className={'flex-1 grid grid-cols-4 gap-x-6'}>
          <div className={'flex'}>
            <span className={'flex-none mr-2.5'}>关键字</span>
            <Input
              value={query.keyword}
              onChange={(e) => {
                setQuery((prevState) => ({ ...prevState, keyword: e.target.value }))
              }}
              placeholder="名称、描述、Host..."
              allowClear
            />
          </div>
          <div className={'flex'}>
            <span className={'flex-none mr-2.5'}>数据库类型</span>
            <ExSelect
              options={dbType.map((item) => ({ label: item.key, value: item.value }))}
              placeholder="数据库类型"
              allowClear
              style={{ width: '100%' }}
              value={query.dbType}
              onChange={(value) => {
                setQuery((prevState) => ({ ...prevState, dbType: value }))
              }}
            />
          </div>
        </div>
        <div className={'flex-none'}>
          {props.permissionsMap['bi-sys.DatasourceConfigController.saveOrUpdate'] && (
            <Button
              type={'primary'}
              size={'default'}
              onClick={() => {
                setVisible(true)
                setCurrentRecord({ status: 1 })
              }}>
              新增
            </Button>
          )}
        </div>
      </div>
      <Table {...table} loading={loading} tableLayout={'fixed'} rowKey="id" size="small" onChange={handleTableChange} />
      <DbModal
        visible={visible}
        setVisible={setVisible}
        dbType={dbType}
        initialValues={currentRecord}
        getList={getList}
      />
    </div>
  )
}

export default connect((state) => {
  return {
    permissionsMap: state.user.userInfo?.permissionsMap,
  }
})(DbConfig)
