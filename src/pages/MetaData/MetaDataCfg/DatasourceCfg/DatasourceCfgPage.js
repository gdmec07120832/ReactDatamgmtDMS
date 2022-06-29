import React, { useCallback, useEffect, useState } from 'react'
import useTable from '../../../../hooks/useTable'
import { Button, Form, Input, InputNumber, message, Popconfirm, Space, Table, Tag } from 'antd'
import axios from '../../../../utils/axios'
import DraggableModal from '../../../../components/DraggableModal'
import { useForm } from 'antd/es/form/Form'
import { connect } from 'react-redux'

function DataSourceCfg(props) {
  const { permissionsMap } = props
  const [query, setQuery] = useState({
    keyword: '',
  })

  const [search, setSearch] = useState({
    keyword: '',
  })

  const { table, setTable } = useTable({
    rowKey: 'id',
    columns: [
      { dataIndex: 'sourceName', title: '名称' },
      {
        dataIndex: 'sortValue',
        title: '排序',
        render(text, record) {
          return (
            <InputNumber
              defaultValue={text}
              onBlur={(e) => Number(e.target.value) !== text && updateRowOrder(record, e.target.value)}
              onPressEnter={(e) => Number(e.target.value) !== text && updateRowOrder(record, e.target.value)}
            />
          )
        },
      },
      {
        dataIndex: 'status',
        title: '状态',
        render(text) {
          return <Tag color={{ 0: 'error', 1: 'success' }[text]}>{{ 0: '禁用', 1: '启用' }[text]}</Tag>
        },
      },
      {
        dataIndex: 'action',
        title: '操作',
        render(text, record) {
          const hasTogglePerm = permissionsMap['bi-metadata.DataSourceController.startOrStop']
          return (
            <Space>
              {record.status === 0 && hasTogglePerm ? (
                <Button type={'link'} size={'small'} onClick={() => handleToggle(record)}>
                  启用
                </Button>
              ) : null}
              {record.status === 1 && hasTogglePerm ? (
                <Button type={'link'} size={'small'} onClick={() => handleToggle(record)}>
                  禁用
                </Button>
              ) : null}
              {permissionsMap['bi-metadata.DataSourceController.saveOrUpdate'] && (
                <Button size={'small'} type={'link'} onClick={() => updateRow(record)}>
                  编辑
                </Button>
              )}
              {permissionsMap['bi-metadata.DataSourceController.delById'] && (
                <Popconfirm title={'确定删除吗？'} placement={'topLeft'} onConfirm={() => deleteRow(record)}>
                  <Button size={'small'} type={'link'} danger>
                    删除
                  </Button>
                </Popconfirm>
              )}
            </Space>
          )
        },
        fixed: 'right',
        width: 150,
        align: 'center',
      },
    ],
  })

  const [_key, _setKey] = useState(1)

  const [modalVisible, setModalVisible] = useState(false)
  const [modalForm, setModalForm] = useState(null)
  const updateRowOrder = (record, order) => {
    axios
      .post('/bi-metadata/api/user/kpiNode/updateDataSourceSortValue', [
        {
          id: record.id,
          sortValue: order,
        },
      ])
      .then(() => {
        _setKey((prevState) => prevState + 1)
      })
  }
  useEffect(() => {
    setSearch(() => ({ ...query }))
    setTable((prevState) => ({ ...prevState, pagination: { ...prevState.pagination, current: 1 } }))
  }, [query, setTable])
  const { keyword } = search
  const { pageSize, current } = table.pagination
  const getList = useCallback(() => {
    setTable((prevState) => ({ ...prevState, loading: true }))
    axios
      .get('/bi-metadata/api/admin/dataSource/list', {
        params: {
          keyword,
          pageSize,
          page: current,
        },
      })
      .then(({ data: { list, totalRows } }) => {
        setTable((prevState) => ({
          ...prevState,
          dataSource: list,
          pagination: {
            ...prevState.pagination,
            total: totalRows,
          },
          loading: false,
        }))
      })
      .catch(() => {
        setTable((prevState) => ({ ...prevState, loading: false }))
      })
    console.log(_key)
  }, [keyword, setTable, pageSize, current, _key])
  const handleToggle = (record) => {
    axios
      .get('/bi-metadata/api/admin/dataSource/startOrStop', {
        params: { id: record.id },
      })
      .then(() => {
        message.success('操作成功')
        _setKey((prevState) => prevState + 1)
      })
  }
  useEffect(getList, [getList])
  const addNew = () => {
    setModalForm(null)
    setModalVisible(true)
  }

  const updateRow = (record) => {
    setModalForm(record)
    setModalVisible(true)
  }
  const deleteRow = (record) => {
    axios
      .get('/bi-metadata/api/admin/dataSource/delById', {
        params: { id: record.id },
      })
      .then(() => {
        message.success('删除成功')
        _setKey((prevState) => prevState + 1)
      })
  }
  const RecordModal = (props) => {
    const { visible, setVisible, modalForm } = props
    const [form] = useForm()
    useEffect(() => {
      if (modalForm) {
        form.setFieldsValue(modalForm)
      }
    }, [modalForm, form])
    const submitForm = () => {
      form.validateFields().then((formData) => {
        axios
          .post('/bi-metadata/api/admin/dataSource/saveOrUpdate', {
            status: modalForm?.status || 1,
            ...(modalForm || {}),
            ...formData,
          })
          .then(() => {
            message.success('操作成功')
            setVisible(false)
            _setKey((prevState) => prevState + 1)
          })
      })
    }
    return (
      <DraggableModal
        title={modalForm ? '修改数据来源' : '新增数据来源'}
        visible={visible}
        onCancel={() => setVisible(false)}
        onOk={submitForm}>
        <Form form={form}>
          <Form.Item label={'数据来源'} name="sourceName" rules={[{ required: true, message: '此项必填' }]}>
            <Input placeholder={'数据来源'} maxLength={20} />
          </Form.Item>
        </Form>
      </DraggableModal>
    )
  }

  return (
    <div className={'px-6 py-6'}>
      <div className={'flex justify-between mb-2.5'}>
        <Input
          placeholder={'输入关键字搜索'}
          value={query.keyword}
          allowClear
          style={{ width: 200 }}
          onChange={(e) => {
            setQuery((prevState) => ({ ...prevState, keyword: e.target.value }))
          }}
        />
        <div>
          {permissionsMap['bi-metadata.DataSourceController.saveOrUpdate'] && (
            <Button type={'primary'} onClick={addNew}>
              新增
            </Button>
          )}
        </div>
      </div>
      <Table {...table} />
      <RecordModal visible={modalVisible} setVisible={setModalVisible} modalForm={modalForm} />
    </div>
  )
}

export default connect((state) => {
  return {
    permissionsMap: state.user.userInfo.permissionsMap,
  }
})(DataSourceCfg)
