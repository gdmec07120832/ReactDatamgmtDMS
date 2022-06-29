import React, { forwardRef, useEffect, useRef, useState } from 'react'
import { connect } from 'react-redux'
import { useRequest } from 'ahooks'
import { Button, Col, Form, Input, InputNumber, message, Popconfirm, Row, Space, Table } from 'antd'
import useTable from '../../../hooks/useTable'
import DraggableModal from '../../../components/DraggableModal'
import axios from '../../../utils/axios'

const EditModal = forwardRef((props, ref) => {
  return (
    <>
      <Form ref={ref} labelCol={{ span: 6 }}>
        <Form.Item label={'ID'} name={'id'} hidden>
          <Input />
        </Form.Item>
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item label={'名称'} name={'name'} rules={[{ required: true }]}>
              <Input maxLength={30} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={'主机'} name={'host'} rules={[{ required: true }]}>
              <Input maxLength={30} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={'端口'} name={'port'} rules={[{ required: true }]}>
              <Input maxLength={10} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={'登录用户'} name={'userName'} rules={[{ required: true }]}>
              <Input maxLength={30} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={'登录密码'} name={'password'} rules={[{ required: true }]}>
              <Input type={'password'} maxLength={100} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={'排序'} name={'orderValue'}>
              <InputNumber style={{ width: '100%' }} max={9999} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={'描述'} name={'description'}>
              <Input maxLength={30} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </>
  )
})

function SyncTarget(props) {
  const { table, setTable } = useTable({
    rowKey: 'id',
    dataSource: [],
    columns: [
      { title: 'ID', dataIndex: 'id', width: 80 },
      { title: '名称', dataIndex: 'name' },
      { title: '主机', dataIndex: 'host' },
      { title: '端口', dataIndex: 'port' },
      { title: '登录用户', dataIndex: 'userName' },
      {
        title: '排序',
        dataIndex: 'orderValue',
        render: (text, row) => {
          return props.permissionsMap['bi-data-reporting.MisSyncTargetController.saveOrUpdate'] ? (
            <InputNumber
              defaultValue={row.orderValue}
              onBlur={(e) => e.target.value !== row.orderValue && updateRowOrder(row, e.target.value)}
              onPressEnter={(e) => e.target.value !== row.orderValue && updateRowOrder(row, e.target.value)}
            />
          ) : (
            text
          )
        },
      },
      { title: '描述', dataIndex: 'description' },
      {
        title: '操作',
        dataIndex: 'action',
        width: 150,
        align: 'center',
        render: (_, row) => {
          return (
            <Space>
              {props.permissionsMap['bi-data-reporting.MisSyncTargetController.saveOrUpdate'] && (
                <Button type={'link'} size={'small'} onClick={() => editRow(row)}>
                  编辑
                </Button>
              )}
              {props.permissionsMap['bi-data-reporting.MisSyncTargetController.remove'] && (
                <Popconfirm title={'确定删除吗？'} onConfirm={() => deleteRow(row)}>
                  <Button type={'link'} size={'small'} danger>
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

  const formRef = useRef()
  const [visible, setVisible] = useState(false)
  const createNew = () => {
    setVisible(true)
    setTimeout(() => {
      formRef.current?.resetFields()
    }, 20)
  }

  const deleteRow = (row) => {
    axios
      .get('/bi-data-reporting/api/admin/mis/misSyncTarget/remove', {
        params: { ids: row.id },
      })
      .then(() => {
        message.success('删除成功')
        run()
      })
  }

  const editRow = (row) => {
    setVisible(true)
    setTimeout(() => {
      formRef.current?.setFieldsValue({ ...row })
    }, 20)
  }
  const [keyword, setKeyword] = useState('')
  const { current, pageSize } = table.pagination
  const { run, loading } = useRequest(
    () => {
      return axios
        .get('/bi-data-reporting/api/admin/mis/misSyncTarget/list', {
          params: {
            page: current,
            pageSize,
            keyword,
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
    {
      manual: true,
      debounceInterval: 200,
    }
  )

  const [saveLoading, setSaveLoading] = useState(false)
  const saveOrUpdate = () => {
    formRef.current?.validateFields().then((values) => {
      setSaveLoading(true)
      axios
        .post('/bi-data-reporting/api/admin/mis/misSyncTarget/saveOrUpdate', null, {
          params: { ...values },
        })
        .then(() => {
          formRef.current?.resetFields()
          message.success('编辑成功')
          setVisible(false)
          run()
        })
        .finally(() => {
          setSaveLoading(false)
        })
    })
  }

  const updateRowOrder = (row, order) => {
    axios
      .get('/bi-data-reporting/api/user/mis/misSyncTarget/updateOrderValue', {
        params: { id: row.id, orderValue: order },
      })
      .then(() => {
        run()
      })
  }

  useEffect(() => {
    run()
  }, [current, pageSize, keyword, run])

  return (
    <div className={'px-6 py-6'}>
      <div className="flex mb-2.5 space-x-6">
        <div className={'flex-1 grid grid-cols-4'}>
          <div className={'flex'}>
            <span className={'flex-none mr-2.5'}>关键字</span>
            <Input
              placeholder="关键字"
              onChange={(e) => {
                setKeyword(e.currentTarget.value)
                setTable(prevState => ({...prevState, pagination: {...prevState.pagination, current: 1}}))
              }}
              className={'flex-1'}
              allowClear
            />
          </div>
        </div>
        {props.permissionsMap['bi-data-reporting.MisSyncTargetController.saveOrUpdate'] && (
          <Button type="primary" onClick={createNew}>
            新增
          </Button>
        )}
      </div>
      <Table {...table} loading={loading} />

      <DraggableModal
        title={'新增'}
        width={700}
        visible={visible}
        okButtonProps={{ loading: saveLoading }}
        onOk={saveOrUpdate}
        onCancel={() => setVisible(false)}>
        <EditModal ref={formRef} />
      </DraggableModal>
    </div>
  )
}

export default connect((state) => {
  return {
    permissionsMap: state.user?.userInfo?.permissionsMap,
  }
})(SyncTarget)
