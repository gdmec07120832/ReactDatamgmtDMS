import React, { useEffect, useState } from 'react'
import { Button, Form, Input, InputNumber, message, Popconfirm, Space, Table } from 'antd'
import useTable from '../../../../hooks/useTable'
import { useRequest } from 'ahooks'
import axios from '../../../../utils/axios'
import DraggableModal from '../../../../components/DraggableModal'
import { useForm } from 'antd/es/form/Form'
import ExSelect from '../../../../components/Select'
import useRoleList from '../../../../hooks/useRoleList'

const EditModal = (props) => {
  const { visible, setVisible, editItem, getList, roleList } = props
  const [form] = useForm()
  useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        ...editItem,
        roleIds: editItem?.roleIds ? editItem?.roleIds : [],
        _nodeName: editItem?.nodeName,
      })
    } else {
      form.resetFields()
    }
  }, [visible, editItem, form])
  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const data = {
        ...(editItem || {}),
        ...values,
        nodeName: values._nodeName,
        nodeType: 0,
      }
      delete data._nodeName
      axios.post('/bi-metadata/api/admin/kpiNode/insertOrUpdate', data).then(() => {
        message.success('保存成功')
        setVisible(false)
        getList()
      })
    })
  }

  return (
    <DraggableModal
      visible={visible}
      onCancel={() => setVisible(false)}
      title={editItem ? '编辑' : '新增'}
      onOk={handleSubmit}>
      <Form form={form} labelCol={{ span: 4 }}>
        <Form.Item label={'业务领域'} name={'_nodeName'} rules={[{ required: true }]}>
          <Input maxLength={20} />
        </Form.Item>
        <Form.Item label={'角色'} name={'roleIds'}>
          <ExSelect
            mode={'multiple'}
            options={roleList.map((item) => ({ label: item.roleName, value: item.idRole }))}
          />
        </Form.Item>
        <Form.Item label={'数域描述'} name={'kpiDcrp'}>
          <Input.TextArea />
        </Form.Item>
      </Form>
    </DraggableModal>
  )
}

function BzFieldCfg() {
  const [keyword, setKeyword] = useState('')
  const { table, setTable } = useTable({
    rowKey: 'uuid',
    pagination: false,
    columns: [
      { dataIndex: 'nodeName', title: '业务领域' },
      {
        dataIndex: 'sortValue',
        title: '排序',
        render: (text, row) => {
          return (
            <InputNumber
              defaultValue={text}
              onBlur={(e) => Number(e.target.value) !== text && updateRowOrder(row, e.target.value)}
              onPressEnter={(e) => Number(e.currentTarget.value) !== text && updateRowOrder(row, e.currentTarget.value)}
            />
          )
        },
      },
      {
        dataIndex: 'actions',
        title: '操作',
        align: 'center',
        width: 150,
        render: (text, row) => {
          return (
            <Space>
              {
                <Button size={'small'} type={'link'} onClick={() => editRow(row)}>
                  编辑
                </Button>
              }
              {
                <Popconfirm title={'确定删除吗？'} onConfirm={() => deleteRow(row)}>
                  <Button size={'small'} type={'link'} danger>
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

  const updateRowOrder = (row, order) => {
    axios.post('/bi-metadata/api/user/kpiNode/updateKpiNodeSortValue', [{ id: row.id, sortValue: order }]).then(() => {
      getList()
    })
  }

  const { run: getList, loading } = useRequest(
    () => {
      return axios
        .get('/bi-metadata/api/user/kpiNode/queryLevelInfo', {
          params: {
            contains: true,
            level: 1,
          },
        })
        .then(({ data }) => {
          setTable((prev) => ({
            ...prev,
            dataSource: data.filter((item) => {
              return keyword ? item.nodeName.toLowerCase().includes(keyword.toLowerCase()) : true
            }),
          }))
        })
    },
    {
      manual: true,
      debounceInterval: 200,
    }
  )

  useEffect(() => {
    getList()
  }, [getList, keyword])

  const [curEditItem, setCurEditItem] = useState(null)
  const [editVisible, setEditVisible] = useState(false)

  const addFieldItem = () => {
    setCurEditItem(null)
    setEditVisible(true)
  }

  const editRow = (row) => {
    setCurEditItem(row)
    setEditVisible(true)
  }

  const deleteRow = (row) => {
    axios
      .get('/bi-metadata/api/user/kpiNode/delByUUID', {
        params: {
          kpiNodeId: row.uuid,
        },
      })
      .then(() => {
        message.success('删除成功')
        getList()
      })
  }
  const roleList = useRoleList()

  return (
    <div className={'px-6 py-6'}>
      <div className={'flex justify-between mb-2.5'}>
        <div className={'grid grid-cols-4'}>
          <div>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={'输入关键字搜索'}
              allowClear
              style={{ width: 200 }}
            />
          </div>
        </div>

        <div className={'ml-2'}>
          <Button type={'primary'} onClick={addFieldItem}>
            新增
          </Button>
        </div>
      </div>

      <Table {...table} loading={loading} />
      <EditModal
        visible={editVisible}
        setVisible={setEditVisible}
        editItem={curEditItem}
        roleList={roleList}
        getList={getList}
      />
    </div>
  )
}

export default BzFieldCfg
