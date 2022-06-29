import React, { useEffect, useState } from 'react'
import {Button, Collapse, Form, Input, message, Popconfirm, Space, Table, Transfer, Tree} from 'antd'
import useTable from '../../../hooks/useTable'
import { useRequest } from 'ahooks'
import axios from '../../../utils/axios'
import { useSelector } from 'react-redux'
import DraggableModal from '../../../components/DraggableModal'
import { useForm } from 'antd/es/form/Form'
import useUserList from '../../../hooks/useUserList'
import styled from 'styled-components';

const StyledPanel = styled(Collapse.Panel)`
  .ant-collapse-header {
    padding: 5px 16px!important;
  }
`

const TransferWrapper = (props) => {
  const {panelKey, panelHeader, targetKeys, onChange, ...rest} = props
  return <Collapse>
    <StyledPanel key={panelKey} header={panelHeader}>
      <Transfer targetKeys={targetKeys} onChange={onChange} {...rest} />
    </StyledPanel>
  </Collapse>
}

const TreeWrapper = (props) => {
  const {panelKey, panelHeader, checkedKeys, onChange, ...rest} = props
  return<Collapse>
    <StyledPanel key={panelKey} header={panelHeader}>
      <Tree.DirectoryTree checkedKeys={checkedKeys} onCheck={onChange} {...rest} />
    </StyledPanel>
  </Collapse>
}

const RoleEdit = (props) => {
  const { currentRow, setCurrentRow, refresh, type, cloud } = props
  const permissionsMap = useSelector((state) => state.user.permissionsMap)
  const [form] = useForm()
  const title = currentRow?.id ? '更新角色' : '新增角色'
  const close = () => {
    setCurrentRow(null)
  }

  useEffect(() => {
    if (currentRow) {
      form.setFieldsValue({
        ...currentRow,
        permissions: (currentRow.permissions || []).map((item) => item.id),
        userIds: currentRow.userIds || [],
      })
    } else {
      form.resetFields()
    }
  }, [currentRow, form])

  const [permissionList, setPermissionList] = useState([])
  const users = useUserList()
  const [users2, setUsers2] = useState([])

  const [pageTreeData, setPageTreeData] = useState([])

  useEffect(() => {
    if(cloud && type === 'DigitalSupplier') {
      axios.get('/bi-mobile-aliyun/api/admin/pagePermission/list', {
        params: {
          appCode: type
        }
      }).then(({data}) => {
        setPageTreeData(data)
      })
    }
  }, [cloud, type])

  useEffect(() => {
    if (cloud) {
      axios.get('/bi-mobile-aliyun/api/user/user/listAllNormal').then(({ data }) => {
        setUsers2(() => data.map((item) => ({
          ...item,
          idUser: item.id,
          nameCn: item.nickName,
          employeeNo: item.username
        })))
      })
    }
  }, [cloud])

  useEffect(() => {
    axios
      .get(cloud ? '/bi-mobile-aliyun/api/user/permission/findAll' : '/bi-mobile/api/user/permission/findAll', {
        params: cloud
          ? {
              appCode: type,
            }
          : {},
      })
      .then(({ data }) => {
        setPermissionList(
          data.map((item) => ({
            ...item,
            key: item.id,
            title: item.name,
          }))
        )
      })
  }, [cloud, type])

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      axios
        .post(
          cloud ? '/bi-mobile-aliyun/api/admin/role/saveOrUpdate' : '/bi-mobile/api/admin/role/saveOrUpdate',
          cloud
            ? {
                ...values,
                appCode: type,
                permissions: (values.permissions || []).map((item) => ({ id: item })),
              }
            : {
                ...values,
                permissions: (values.permissions || []).map((item) => ({ id: item })),
              }
        )
        .then(() => {
          message.success('保存成功')
          close()
          refresh?.()
        })
    })
  }

  return (
    <DraggableModal
      destroyOnClose
      width={960}
      title={title}
      visible={!!currentRow}
      onCancel={close}
      onOk={handleSubmit}
      okButtonProps={{
        disabled:
          !permissionsMap[
            cloud ? 'bi-mobile-aliyun.ApiRoleController.saveOrUpdate' : 'bi-mobile.ApiRoleController.saveOrUpdate'
          ],
      }}>
      <Form form={form} labelCol={{ flex: '80px' }} labelAlign={'right'}>
        <Form.Item label={'id'} name={'id'} hidden>
          <Input />
        </Form.Item>
        <Form.Item label={'角色名称'} name={'name'} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label={'角色描述'} name={'description'} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label={'接口权限'} name={'permissions'} valuePropName={'targetKeys'}>
          <TransferWrapper
            panelHeader={'接口权限'}
            showSearch
            dataSource={permissionList}
            listStyle={{ flex: 1, height: 300 }}
            pagination={{ pageSize: 20 }}
            render={(item) => item.title}
            titles={['未选', '已选']}
          />
        </Form.Item>
        {
          type === 'DigitalSupplier' &&
          <Form.Item label={'页面权限'} name={'pagePermissionIds'} valuePropName={'checkedKeys'}>
          <TreeWrapper panelHeader={'页面权限'} icon={null} checkable treeData={pageTreeData} fieldNames={{
            title: 'name', key: 'id'
          }} />
        </Form.Item>
        }
        <Form.Item label={'用户'} name={'userIds'} valuePropName={'targetKeys'}>
          <TransferWrapper
            panelHeader={'用户'}
            showSearch
            dataSource={(cloud ? users2 : users).map((item) => ({ ...item, key: item.idUser, title: `${item.nameCn}/${item.employeeNo}` }))}
            listStyle={{ flex: 1, height: 300 }}
            pagination={{ pageSize: 20 }}
            render={(item) => item.title}
            titles={['未选', '已选']}
          />
        </Form.Item>
      </Form>
    </DraggableModal>
  )
}

function RoleCfg(props) {
  const { cloud, type } = props
  const permissionsMap = useSelector((state) => state.user.permissionsMap)
  const { table, setTable } = useTable({
    rowKey: 'id',
    columns: [
      { dataIndex: 'id', title: 'ID', width: 120 },
      { dataIndex: 'name', title: '角色名称' },
      {
        dataIndex: 'permissions',
        title: '角色权限',
        render: (text) => {
          return !text || !text?.length ? '/' : text.length + '个'
        },
      },
      { dataIndex: 'description', title: '描述' },
      {
        dataIndex: 'action',
        title: '操作',
        width: 200,
        render: (text, row) => {
          return (
            <Space>
              {
                <Button size={'small'} type={'link'} onClick={editRow.bind(null, row)}>
                  编辑
                </Button>
              }
              {permissionsMap[
                cloud ? 'bi-mobile-aliyun.ApiRoleController.delete' : 'bi-mobile.ApiRoleController.delete'
              ] && (
                <Popconfirm title={'确定删除吗？'} onConfirm={deleteRow.bind(null, row)}>
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

  const [keyword, setKeyword] = useState(null)
  const { current: page, pageSize } = table.pagination
  const { run: getData, loading } = useRequest(
    () => {
      return axios
        .get(cloud ? '/bi-mobile-aliyun/api/admin/role/list' : '/bi-mobile/api/admin/role/list', {
          params: cloud
            ? {
                page,
                pageSize,
                keyword,
                appCode: type,
              }
            : {
                page,
                pageSize,
                keyword,
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
    { manual: true, debounceInterval: 200 }
  )

  const { run: _deleteRow, loading: loading2 } = useRequest(
    (id) => {
      return axios.get(cloud ? '/bi-mobile-aliyun/api/admin/role/delete' : '/bi-mobile/api/admin/role/delete', {
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

  useEffect(() => {
    getData()
  }, [page, pageSize, keyword, getData])

  const [currentRow, setCurrentRow] = useState(null)

  const editRow = (row) => {
    setCurrentRow(row)
  }

  const addRow = () => {
    setCurrentRow({})
  }

  return (
    <div className={'p-6'}>
      <div className={'flex justify-between mb-2.5'}>
        <Input
          onChange={(e) => setKeyword(e.target.value)}
          className={'w-60'}
          placeholder={'输入关键字查找'}
          allowClear
        />
        <div className={''}>
          {permissionsMap[
            cloud ? 'bi-mobile-aliyun.ApiRoleController.saveOrUpdate' : 'bi-mobile.ApiRoleController.saveOrUpdate'
          ] && (
            <Button type={'primary'} onClick={addRow}>
              新增
            </Button>
          )}
        </div>
      </div>

      <Table {...table} loading={loading || loading2} />

      <RoleEdit currentRow={currentRow} setCurrentRow={setCurrentRow} refresh={getData} type={type} cloud={cloud} />
    </div>
  )
}

export default RoleCfg
