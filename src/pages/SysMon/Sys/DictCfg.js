import React, { useEffect, useState } from 'react'
import { connect, useSelector } from 'react-redux'
import { Button, Form, Input, InputNumber, message, Popconfirm, Popover, Space, Table } from 'antd'
import useTable from '../../../hooks/useTable'
import { useRequest } from 'ahooks'
import axios from '../../../utils/axios'
import DraggableModal from '../../../components/DraggableModal'
import { useForm } from 'antd/es/form/Form'

const PopoverContent = (props) => {
  const { visible, setVisible, initialValues, refresh } = props
  const [form] = useForm()
  useEffect(() => {
    if (visible) {
      form.setFieldsValue(initialValues)
    } else {
      form.resetFields()
    }
  }, [visible, initialValues, form])

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      axios
        .post('/bi-sys/api/admin/sysConstant/saveOrUpdateDict', {
          ...values,
        })
        .then(() => {
          message.success('编辑成功')
          setTimeout(() => {
            setVisible(false)
            refresh?.()
          }, 50)
        })
    })
  }

  return (
    <div>
      <Form form={form} initialValues={{ seq: 1 }} labelCol={{ span: 6 }}>
        <Form.Item label={'constantType'} name={'constantType'} hidden>
          <Input />
        </Form.Item>
        <Form.Item label={'ID'} name={'id'} hidden>
          <Input />
        </Form.Item>
        <Form.Item label={'Key'} name={'key'} rules={[{ required: true }]}>
          <Input maxLength={50} />
        </Form.Item>
        <Form.Item label={'Value'} name={'value'} rules={[{ required: true }]}>
          <Input maxLength={50} />
        </Form.Item>
        <Form.Item label={'备注'} name={'description'}>
          <Input maxLength={100} />
        </Form.Item>
        <Form.Item label={'顺序'} name={'seq'}>
          <InputNumber />
        </Form.Item>
      </Form>

      <Space className={'flex'}>
        <Button onClick={() => setVisible(false)}>取消</Button>
        <Button type={'primary'} onClick={handleSubmit}>
          确定
        </Button>
      </Space>
    </div>
  )
}

const EditModal = (props) => {
  const permissionsMap = useSelector((state) => state.user.permissionsMap)
  const { currentRow, setCurrentRow, refresh } = props
  const [form] = useForm()
  useEffect(() => {
    if (currentRow) {
      form.setFieldsValue(currentRow)
    } else {
      form.resetFields()
    }
  }, [currentRow, form])

  const { table, setTable } = useTable({
    pagination: {
      size: 'default',
      hideOnSinglePage: true,
    },
    columns: [
      { dataIndex: 'seq', title: '顺序', width: 50 },
      { dataIndex: 'key', title: 'Key' },
      { dataIndex: 'value', title: 'Value' },
      {
        dataIndex: 'action',
        title: '操作',
        width: 120,
        render(text, row) {
          return (
            <Space>
              {permissionsMap['bi-sys.SysConstantController.saveOrUpdateDict'] && (
                <Popover
                  visible={row.__visible__}
                  trigger={'click'}
                  onVisibleChange={(v) => setRowPopoverVisible(row, v)}
                  content={
                    <PopoverContent
                      initialValues={row}
                      refresh={getDictData}
                      visible={row.__visible__}
                      setVisible={(state) => {
                        setRowPopoverVisible(row, state)
                      }}
                    />
                  }>
                  <Button type={'link'} size={'small'} onClick={setRowPopoverVisible.bind(null, row, true)}>
                    编辑
                  </Button>
                </Popover>
              )}
              {
                permissionsMap['bi-sys.SysConstantController.deleteDict'] &&
                <Popconfirm title={'确定删除吗？'} onConfirm={deleteRow.bind(null, row)}>
                  <Button type={'link'} size={'small'} danger>
                    删除
                  </Button>
                </Popconfirm>
              }
            </Space>
          )
        },
      },
    ],
  })

  const deleteRow = (row) => {
    axios
      .get('/bi-sys/api/admin/sysConstant/deleteDict', {
        params: { id: row.id },
      })
      .then(() => {
        message.success('删除成功')
        getDictData()
      })
  }

  const setRowPopoverVisible = (row, visible) => {
    setTable((prevState) => {
      const index = prevState.dataSource.findIndex((item) => item.id === row.id)
      if (index > -1) {
        return {
          ...prevState,
          dataSource: [
            ...prevState.dataSource.slice(0, index),
            {
              ...prevState.dataSource[index],
              __visible__: visible,
            },
            ...prevState.dataSource.slice(index + 1),
          ],
        }
      }
    })
  }

  const [keyword, setKeyword] = useState('')
  const { current: page, pageSize } = table.pagination
  const { run: getDictData } = useRequest(
    () => {
      return axios
        .get('/bi-sys/api/user/sysConstant/listDict', {
          params: {
            page,
            pageSize,
            keyword,
            constantType: currentRow?.key,
          },
        })
        .then(({ data: { list, totalRows: total } }) => {
          setTable((prevState) => ({
            ...prevState,
            dataSource: list.map((item) => ({ ...item, __visible__: false })),
            pagination: { ...prevState.pagination, total },
          }))
        })
    },
    { manual: true, debounceInterval: 200 }
  )

  useEffect(() => {
    if (currentRow?.id) {
      getDictData()
    }
  }, [currentRow, page, pageSize, keyword, getDictData])

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      axios
        .post('/bi-sys/api/admin/sysConstant/saveOrUpdateType', {
          ...values,
          value: values.key,
        })
        .then(() => {
          message.success('操作成功')
          setCurrentRow(null)
          refresh?.()
        })
    })
  }

  const title =  permissionsMap['bi-sys.SysConstantController.saveOrUpdateDict'] ? currentRow?.id ? '编辑' : '新增' : '查看'
  const [addVisible, setAddVisible] = useState(false)
  return (
    <DraggableModal
      width={750}
      title={title}
      destroyOnClose
      visible={!!currentRow}
      footer={[
        <Button key={'close'} onClick={() => setCurrentRow(null)}>
          关闭
        </Button>,
        <Button
          key={'save'}
          onClick={handleSubmit}
          type={'primary'}
          disabled={!permissionsMap['bi-sys.SysConstantController.saveOrUpdateType']}>
          保存
        </Button>,
      ]}
      onOk={handleSubmit}
      onCancel={() => setCurrentRow(null)}>
      <>
        <Form form={form}>
          <div className={'grid grid-cols-2 gap-x-6'}>
            <Form.Item label={'id'} name={'id'} hidden>
              <Input />
            </Form.Item>
            <Form.Item label={'字典名称'} name={'key'} rules={[{ required: true, message: '此项必填' }]}>
              <Input maxLength={50} disabled={currentRow?.id} placeholder={'字典名称'} />
            </Form.Item>
            <Form.Item label={'描述'} name={'description'}>
              <Input maxLength={50} placeholder={'描述'} />
            </Form.Item>
          </div>
        </Form>

        {currentRow?.id && (
          <>
            <div className={'flex justify-start mb-2'}>
              <div className={'flex-1'}>
                <Input
                  onChange={(e) => setKeyword(e.target.value)}
                  className={'w-60'}
                  placeholder={'输入关键字查找'}
                  allowClear
                />
              </div>
              {permissionsMap['bi-sys.SysConstantController.saveOrUpdateDict'] && (
                <Popover
                  trigger="click"
                  visible={addVisible}
                  onVisibleChange={(v) => setAddVisible(v)}
                  content={
                    <PopoverContent
                      visible={addVisible}
                      setVisible={setAddVisible}
                      refresh={getDictData}
                      initialValues={{ constantType: currentRow?.key }}
                    />
                  }>
                  <Button>新增</Button>
                </Popover>
              )}
            </div>

            <Table {...table} />
          </>
        )}
      </>
    </DraggableModal>
  )
}

function DictCfg(props) {
  const { permissionsMap } = props
  const { table, setTable } = useTable({
    columns: [
      { dataIndex: 'id', title: 'ID', width: 100 },
      { dataIndex: 'key', title: '字典名称' },
      { dataIndex: 'description', title: '描述' },
      {
        dataIndex: 'action',
        title: '操作',
        width: 150,
        render(text, row) {
          return (
            <Space>
              <Button type={'link'} size={'small'} onClick={editRow.bind(null, row)}>
                {
                  permissionsMap['bi-sys.SysConstantController.saveOrUpdateDict'] ? '编辑' : '查看'
                }
              </Button>
              {permissionsMap['bi-sys.SysConstantController.deleteType'] && (
                <Popconfirm title={'确定删除吗'} placement={'topLeft'} onConfirm={deleteRow.bind(null, row)}>
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

  const { run: _deleteRow, loading: loading2 } = useRequest(
    (id) => {
      return axios.get('/bi-sys/api/admin/sysConstant/deleteType', {
        params: { id },
      })
    },
    { manual: true }
  )

  const deleteRow = (row) => {
    _deleteRow(row.id).then(() => {
      message.success('删除成功')
      getData()
    })
  }

  const [currentRow, setCurrentRow] = useState(null)

  const editRow = (row) => {
    setCurrentRow(row)
  }

  const [keyword, setKeyword] = useState('')

  const { current: page, pageSize } = table.pagination
  const { run: getData, loading } = useRequest(
    () => {
      return axios
        .get('/bi-sys/api/admin/sysConstant/listType', {
          params: { page, pageSize, keyword },
        })
        .then(({ data: { list, totalRows: total } }) => {
          setTable((prevState) => ({
            ...prevState,
            dataSource: list,
            pagination: { ...prevState.pagination, total },
          }))
        })
    },
    { manual: true, debounceInterval: 200 }
  )

  useEffect(() => {
    getData()
  }, [page, pageSize, getData, keyword])

  const addRow = () => {
    setCurrentRow({})
  }

  return (
    <div className={'p-6'}>
      <div className="flex mb-2">
        <div className={'flex-1'}>
          <Input
            onChange={(e) => {
              setKeyword(e.target.value)
              setTable(prevState => ({
                    ...prevState,
                    pagination: {...prevState.pagination, current: 1}
                  }))
            }}
            className={'w-60'}
            placeholder={'输入关键字'}
            allowClear
          />
        </div>
        <div>
          <Button type={'primary'} onClick={addRow}>
            新增
          </Button>
        </div>
      </div>

      <Table {...table} loading={loading || loading2} />

      <EditModal currentRow={currentRow} setCurrentRow={setCurrentRow} refresh={getData} />
    </div>
  )
}

export default connect((state) => {
  return {
    permissionsMap: state.user?.userInfo?.permissionsMap,
  }
})(DictCfg)
