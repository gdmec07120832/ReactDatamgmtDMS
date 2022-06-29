import React, { useEffect, useState } from 'react'
import { Button, Form, Input, Popconfirm, Switch, Tag } from 'antd'
import ExTable from '../../../components/ExTable/ExTable'
import { useRequest } from 'ahooks'
import axios from '../../../utils/axios'
import DraggableModal from '../../../components/DraggableModal'
import ExSelect from '../../../components/Select'
import { useForm } from 'antd/es/form/Form'
import { useSelector } from 'react-redux'

const EditModal = (props) => {
  const { visible, setVisible, record, type, onSuccess } = props
  const title = record?.id ? '编辑' : '新增'
  const [form] = useForm()
  const close = () => {
    setVisible(false)
    form.resetFields()
  }

  useEffect(() => {
    record && visible && form.setFieldsValue(record)
  }, [visible, record, form])

  const setDefaultPort = (v) => {
    form.setFieldsValue({
      port: { MySQL: '3306', Oracle: '1521', PostgreSQL: '5432' }[v],
    })
  }

  const { run: save, loading } = useRequest(
    (values) => {
      return axios.post('/bi-mobile-aliyun/api/admin/datasourceConfig/saveOrUpdate', {
        ...values,
        appCode: type,
      })
    },
    { manual: true }
  )

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      save(values).then(() => {
        onSuccess?.()
        close()
      })
    })
  }

  return (
    <DraggableModal visible={visible} title={title} onCancel={close} onOk={handleSubmit} okButtonProps={{ loading }}>
      <Form form={form} labelCol={{ flex: '0 0 92px' }}>
        <Form.Item hidden name={'id'} label={'id'}>
          <Input />
        </Form.Item>
        <Form.Item label={'中文名'} name={'dbCnName'} rules={[{ required: true, message: '此项必填' }]}>
          <Input maxLength={30} />
        </Form.Item>
        <Form.Item label={'数据库类型'} name={'databaseType'} rules={[{ required: true, message: '此项必填' }]}>
          <ExSelect
            options={['Oracle', 'MySQL', 'PostgreSQL'].map((item) => ({ label: item, value: item }))}
            onChange={(v) => setDefaultPort(v)}
          />
        </Form.Item>
        <Form.Item label={'Host'} name={'host'} rules={[{ required: true, message: '此项必填' }]}>
          <Input maxLength={200} />
        </Form.Item>
        <Form.Item label={'Port'} name={'port'} rules={[{ required: true, message: '此项必填' }]}>
          <Input maxLength={10} />
        </Form.Item>
        <Form.Item label={'库名'} name={'databaseName'} rules={[{ required: true, message: '此项必填' }]}>
          <Input maxLength={50} />
        </Form.Item>
        <Form.Item label={'登录名'} name={'username'} rules={[{ required: true, message: '此项必填' }]}>
          <Input maxLength={50} />
        </Form.Item>
        <Form.Item label={'密码'} name={'password'} rules={[{ required: true, message: '此项必填' }]}>
          <Input type={'password'} />
        </Form.Item>
        <Form.Item label={'设为默认'} valuePropName={'checked'} name={'default'}>
          <Switch />
        </Form.Item>
        <Form.Item label={'备注'} name={'description'}>
          <Input.TextArea maxLength={50} />
        </Form.Item>
      </Form>
    </DraggableModal>
  )
}

function CloudDatasourceBase(props) {
  const permissionsMap = useSelector((state) => state.user.permissionsMap)
  const { type } = props
  const [table, setTable] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
    columns: [
      { title: 'ID', dataIndex: 'id', width: 60 },
      { title: '库名', dataIndex: 'databaseName' },
      { title: '中文名称', dataIndex: 'dbCnName' },
      { title: 'Host', dataIndex: 'host' },
      { title: 'Port', dataIndex: 'port' },
      {
        title: '是否默认',
        dataIndex: 'default',
        render(text) {
          return text && <Tag color={'success'}>默认</Tag>
        },
      },
      {
        title: '状态',
        dataIndex: 'status',
        render(text) {
          return (
            <Tag color={{ Normal: 'success', Frozen: 'error' }[text]}>{{ Normal: '正常', Frozen: '禁用' }[text]}</Tag>
          )
        },
      },
      {
        title: '操作',
        dataIndex: 'action',
        width: 120,
        render(text, record) {
          const { status } = record
          return (
            <div className={'space-x-2.5'}>
              {permissionsMap['bi-mobile-aliyun.DatasourceConfigController.saveOrUpdate'] && (
                <Button type={'link'} size={'small'} onClick={() => editRecord(record)}>
                  编辑
                </Button>
              )}
              {status === 'Normal' && permissionsMap['bi-mobile-aliyun.DatasourceConfigController.startOrPause'] && (
                <Popconfirm title={'确定禁用吗？'} onConfirm={() => toggleStatus(record, 'Frozen')}>
                  <Button type={'link'} danger size={'small'}>
                    禁用
                  </Button>
                </Popconfirm>
              )}
              {status === 'Frozen' && permissionsMap['bi-mobile-aliyun.DatasourceConfigController.startOrPause'] && (
                <Popconfirm title={'确定启用吗？'} onConfirm={() => toggleStatus(record, 'Normal')}>
                  <Button type={'link'} size={'small'}>
                    启用
                  </Button>
                </Popconfirm>
              )}
            </div>
          )
        },
      },
    ],
  })

  const [keyword, setKeyword] = useState('')
  const { run: getData, loading } = useRequest(
    () => {
      return axios
        .get('/bi-mobile-aliyun/api/admin/datasourceConfig/queryPage', {
          params: {
            appCode: type,
            keyword,
            page: table.pagination.current,
            pageSize: table.pagination.pageSize,
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

  useEffect(() => {
    getData()
  }, [getData, keyword])

  const [currentEditRecord, setCurrentEditRecord] = useState(null)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const addNew = () => {
    setCurrentEditRecord(null)
    setEditModalVisible(true)
  }

  const editRecord = (record) => {
    setCurrentEditRecord(record)
    setEditModalVisible(true)
  }

  const { run: toggleStatusAction, loading: loading2 } = useRequest((params) => {
    return axios.get('/bi-mobile-aliyun/api/admin/datasourceConfig/startOrPause', {
      params,
    })
  }, {manual: true})
  const toggleStatus = (record, status) => {
    toggleStatusAction({
      id: record.id,
      status,
    }).then(() => {
      getData()
    })
  }

  return (
    <div className={'p-6'}>
      <div className={'mb-2.5 flex justify-between'}>
        <Input
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value)
            setTable((prevState) => ({
              ...prevState,
              pagination: { ...prevState.pagination, current: 1 },
            }))
          }}
          className={'w-96'}
          allowClear
          placeholder={'输入关键字查询'}
        />
        {permissionsMap['bi-mobile-aliyun.DatasourceConfigController.saveOrUpdate'] && (
          <Button type={'primary'} onClick={addNew}>
            新增
          </Button>
        )}
      </div>
      <ExTable {...table} setTable={setTable} loading={loading || loading2} />
      <EditModal
        record={currentEditRecord}
        onSuccess={getData}
        visible={editModalVisible}
        setVisible={setEditModalVisible}
        type={type}
      />
    </div>
  )
}

export default CloudDatasourceBase
