import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { connect } from 'react-redux'
import {
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Transfer,
  Tree
} from 'antd'
import DraggableModal from '../../../components/DraggableModal'
import axios from '../../../utils/axios'
import cloneDeep from 'lodash/cloneDeep'
import filterDeep from 'deepdash/es/filterDeep'
import debounce from 'lodash/debounce'
import mapDeep from 'deepdash/es/mapDeep'
import CollapseButtons from '../../../components/CollapseButtons';

const parseChildren = (data, titleProp = 'permissionName', keyProp = 'idPermission') => {
  for (let item of data) {
    item.title = item[titleProp]
    item.key = item[keyProp]
    if (item.children) {
      if (item.children.length === 0) {
        item.children = null
      } else {
        parseChildren(item.children, titleProp, keyProp)
      }
    }
  }
}

function UserRole({ setPermissionTree, permissionTree, permissionsMap }) {
  const updateUserStatusRow = (row) => {
    axios
      .post('/bi-sys/api/admin/biSysUser/updateStatus', null, {
        params: {
          idUser: row['idUser'],
          status: [1, 0][row.status],
        },
      })
      .then(() => {
        message.success('修改成功')
        getUserList()
      })
  }

  const updateRow = (row) => {
    const { userPw, ...rest } = row
    setModalForm((prevState) => ({ ...prevState, ...rest, isAdmin: !!row.isAdmin }))
    setModalTitle('修改用户信息')
    setModalVisible(true)
  }

  const [currentUserRoleRecord, setCurrentUserRoleRecord] = useState({})
  const cfgUserRole = (row) => {
    setCfgUserRoleVisible(true)
    setCurrentUserRoleRecord(row)
  }

  const deleteRoleRow = (row) => {
    const { idRole } = row
    axios
      .get('/bi-sys/api/admin/biSysRole/delRoleById', {
        params: { idRole },
      })
      .then(() => {
        getRoleList()
      })
  }

  const [searchKeyword, setKeyword] = useState('')
  const [searchRoleKeyword, setRoleKeyword] = useState('')
  const [table, setTable] = useState({
    pagination: {
      size: 'default',
      total: 0,
      current: 1,
      pageSize: 10,
      showTotal: (total) => `共${total}条记录`,
    },
    scroll: {x: 900},
    data: [],
    columns: [
      { dataIndex: 'nameCn', title: '名称', align: 'center', width: 140 },
      { dataIndex: 'userName', title: '账号', align: 'center', width: 140 },
      { dataIndex: 'phone', title: '手机号', align: 'center', width: 120 },
      {
        dataIndex: 'isAdmin',
        title: '是否管理员',
        align: 'center',
        render(text) {
          return <span>{text ? '是' : '否'}</span>
        },
        width: 120,
      },
      {dataIndex: 'orderValue', title: '排序', align: 'center', width: 100, render(text, row) {
          return permissionsMap['bi-sys.BISysUserController.saveOrUpdate'] ? <InputNumber size={'small'} defaultValue={text} onBlur={(e) => {
            handleChangeUserOrder(row, e.currentTarget.value)
          }} /> : text
        }},
      {
        dataIndex: 'status',
        title: '账号状态',
        render(text) {
          return <Tag color={{ 0: 'error', 1: 'success' }[text]}>{{ 0: '冻结', 1: '启用' }[text]}</Tag>
        },
        align: 'center',
        width: 100,
      },
      {
        dataIndex: 'action',
        title: '操作',
        render(text, record) {
          return (
            <CollapseButtons>
              {permissionsMap['bi-sys.BISysUserController.saveOrUpdate'] && (
                <Button type="link" size="small" onClick={() => updateRow(record)}>
                  修改
                </Button>
              )}
              {permissionsMap['bi-sys.BISysUserController.saveOrUpdate'] && (
                <Button type="link" size="small" onClick={() => cfgUserRole(record)}>
                  配置角色
                </Button>
              )}
              {permissionsMap['bi-sys.BISysUserController.updateStatus'] && [1, 0].includes(record.status) && (
                <Popconfirm
                  title={`确定${record.status === 1 ? '冻结' : '启用'}吗？`}
                  onConfirm={() => updateUserStatusRow(record)}>
                  <Button type="link" size="small" onClick={e => e.stopPropagation()} danger={record.status === 1}>
                    {record.status === 1 ? '冻结账号' : record.status === 0 ? '启用账号' : null}
                  </Button>
                </Popconfirm>
              )}
              {
                permissionsMap['bi-sys.BISysUserController.syncUserToDlink'] &&
                <Button type={'link'} size={'small'} onClick={() => syncToDlink(record)}>
                  同步至DLINK
                </Button>
              }
            </CollapseButtons>
          )
        },
        width: 200,
        align: 'center',
      },
    ],
  })

  const syncToDlink = (record) => {
    axios.get('/bi-sys/api/admin/biSysUser/syncUserToDlink', {
      params: {
        id: record.idUser
      }
    }).then(() => {
      message.success('同步成功')
    })
  }

  const [cfgUserRoleVisible, setCfgUserRoleVisible] = useState(false)
  const CfgUserRoleModal = function (props) {
    const { visible } = props
    const { idUser, nameCn } = props.record
    const [dataSource, setDataSource] = useState([])
    const [targetKeys, setTargetKeys] = useState([])
    useEffect(() => {
      if (visible && idUser) {
        axios
          .get('/bi-sys/api/admin/biSysUser/roleList', {
            params: {
              pageSize: 9999,
              currentPage: 1,
            },
          })
          .then(({ data: { list } }) => {
            setDataSource(
              list.map((item) => {
                return { ...item, title: item.roleName, key: item.idRole }
              })
            )
          })
        axios
          .get('/bi-sys/api/user/biSysRoleUser/queryRoleUser', {
            params: {
              idUser,
            },
          })
          .then(({ data }) => {
            setTargetKeys(data.map((item) => item.idRole))
          })
      }
    }, [visible, idUser])
    const handleChange = (targetKeys) => {
      setTargetKeys(targetKeys)
    }
    const handleUpdate = () => {
      axios
        .post('/bi-sys/api/user/biSysRoleUser/updateRoleUser', null, {
          params: {
            idUser,
            roles: targetKeys.join(','),
          },
        })
        .then(() => {
          message.success('角色更新成功')
          setCfgUserRoleVisible(false)
        })
    }
    return (
      <DraggableModal
        visible={visible}
        title={`用户角色配置（账号：${nameCn}）`}
        onOk={handleUpdate}
        onCancel={() => setCfgUserRoleVisible(false)}>
        <Transfer
          dataSource={dataSource}
          showSearch
          render={(item) => item.title}
          targetKeys={targetKeys}
          listStyle={{ width: 220, height: 300 }}
          onChange={handleChange}
          titles={['未选', '已选']}
        />
      </DraggableModal>
    )
  }
  const handleRoleUpdate = (row) => {
    setRoleModalVisible(true)
    setRoleFormInitialValues((prevState) => ({ ...prevState, ...row }))
  }
  const [currentCfgPermRecord, setCurrentCfgPermRecord] = useState({})
  const handleRolePermission = (record) => {
    setCfgRolePermissionVisible(true)
    setCurrentCfgPermRecord(record)
  }

  const [roleTable, setRoleTable] = useState({
    pagination: {
      size: 'default',
      total: 0,
      current: 1,
      pageSize: 10,
      showTotal: (total) => `共${total}条记录`,
    },
    data: [],
    columns: [
      { dataIndex: 'idRole', title: '角色ID', align: 'center', width: 100 },
      // { dataIndex: 'roleCode', title: '角色CODE', align: 'center' },
      { dataIndex: 'roleName', title: '角色名', align: 'center' },
      { dataIndex: 'intro', title: '备注', align: 'center' },
      {
        dataIndex: 'action',
        title: '操作',
        render(text, record) {
          return (
            <Space>
              {permissionsMap['bi-sys.BiSysRoleController.saveOrUpdateRole'] && (
                <Button type="link" size={'small'} onClick={() => handleRoleUpdate(record)}>
                  修改
                </Button>
              )}
              {permissionsMap['bi-sys.BiSysRoleController.updateRoleUser'] && (
                <Button type="link" size={'small'} onClick={() => handleRolePermission(record)}>
                  权限
                </Button>
              )}
              {permissionsMap['bi-sys.BiSysRoleController.delRoleById'] && (
                <Popconfirm title="确定删除吗？" placement={'topLeft'} onConfirm={() => deleteRoleRow(record)}>
                  <Button type="link" size="small" danger>
                    删除
                  </Button>
                </Popconfirm>
              )}
            </Space>
          )
        },
        align: 'center',
        width: 180,
      },
    ],
  })

  const [permissionData, setPermissionData] = useState([])
  const [permissionTable, setPermissionTable] = useState({
    data: [],
    columns: [
      { dataIndex: 'idPermission', title: '权限ID', align: 'left', width: '10%' },
      { dataIndex: 'systemCode', title: '所属系统CODE', align: 'center' },
      { dataIndex: 'permissionName', title: '权限名称', align: 'center' },
      { dataIndex: 'expression', title: '权限表达式', align: 'center' },
    ],
  })

  const { current, pageSize } = table.pagination
  const getUserList = useCallback(() => {
    axios
      .get('/bi-sys/api/admin/biSysUser/userList', {
        params: {
          currentPage: current,
          pageSize: pageSize,
          nameCn: searchKeyword,
        },
      })
      .then(({ data }) => {
        const { list, totalRows } = data
        setTable((prevState) => {
          return { ...prevState, data: list, pagination: { ...prevState.pagination, total: totalRows } }
        })
      })
  }, [current, pageSize, searchKeyword])

  const handleChangeUserOrder = (u, v) => {
    axios.get('/bi-sys/api/user/biSysUser/updateByIdOrderValue', {
      params: {
        idUser: u.idUser,
        orderValue: v
      }
    }).then(() => {
      getUserList()
    })
  }

  const { current: roleCurrentPage, pageSize: rolePageSize } = roleTable.pagination
  const getRoleList = useCallback(() => {
    axios
      .get('/bi-sys/api/admin/biSysUser/roleList', {
        params: { roleName: searchRoleKeyword, currentPage: roleCurrentPage, pageSize: rolePageSize },
      })
      .then(({ data }) => {
        const { list, totalRows } = data
        setRoleTable((prevState) => {
          return { ...prevState, data: list, pagination: { ...prevState.pagination, total: totalRows } }
        })
      })
  }, [searchRoleKeyword, rolePageSize, roleCurrentPage])

  const getPermissionList = useCallback(() => {
    axios.get('/bi-sys/api/user/biSysPermission/list').then(({ data }) => {
      parseChildren(data)
      setPermissionTree(data)
      const _data = cloneDeep(data)
      setPermissionData(_data)
      setPermissionTable((prevState) => ({ ...prevState, data: data }))
    })
  }, [setPermissionTree])
  useEffect(() => {
    if(permissionsMap['bi-sys.BISysUserController']) {
      getUserList()
    }
  }, [getUserList, permissionsMap])
  useEffect(() => {
    if(permissionsMap['bi-sys.BiSysRoleController']) {
      getRoleList()
    }
  }, [getRoleList, permissionsMap])

  useEffect(getPermissionList, [getPermissionList])

  const [modalForm, setModalForm] = useState({})
  const [modalTitle, setModalTitle] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [roleModalVisible, setRoleModalVisible] = useState(false)
  const [cfgRolePermissionVisible, setCfgRolePermissionVisible] = useState(false)
  const [roleFormInitialValues, setRoleFormInitialValues] = useState({})
  const addNew = () => {
    setModalForm({
      idUser: '',
      nameCn: '',
      userName: '',
      employeeNo: '',
      isAdmin: false,
      phone: '',
    })
    setModalTitle('新增用户')
    setModalVisible(true)
  }

  const cancelModal = () => {
    setModalVisible(false)
  }

  const formRef = useRef(null)
  const saveModalData = () => {
    formRef.current.validateFields().then((form) => {
      axios
        .post('/bi-sys/api/admin/biSysUser/saveOrUpdate', {
          ...form,
          isAdmin: form.isAdmin ? 1 : 0,
          userName: form.employeeNo,
          idUser: modalForm.idUser,
        })
        .then(() => {
          message.success('保存成功')
          setModalVisible(false)
          getUserList()
        })
    })
  }

  const handleTableChange = ({ current, pageSize }) => {
    setTable((prevState) => ({ ...prevState, pagination: { ...prevState.pagination, current, pageSize } }))
  }

  const addNewRole = () => {
    setRoleModalVisible(true)
    setRoleFormInitialValues({})
  }
  const RoleModal = function (props) {
    const formRef = useRef(null)
    const updateRole = (row) => {
      formRef.current.validateFields().then((form) => {
        const { idRole } = row
        axios
          .post('/bi-sys/api/admin/biSysUser/saveOrUpdateRole', {
            idRole,
            ...form,
          })
          .then(() => {
            message.success('更新成功')
            setRoleModalVisible(false)
            getRoleList()
          })
      })
    }

    return (
      <DraggableModal
        title={props.initialValues.idRole ? '修改角色信息' : '新增角色'}
        visible={props.visible}
        onOk={() => updateRole(props.initialValues)}
        onCancel={() => setRoleModalVisible(false)}
        destroyOnClose>
        <Form ref={formRef} initialValues={props.initialValues} labelCol={{ span: 4 }}>
          <Form.Item label="角色名" name="roleName" rules={[{ required: true, message: '此项必填' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="CODE" name="roleCode">
            <Input />
          </Form.Item>
          <Form.Item label="备注" name="intro">
            <Input />
          </Form.Item>
        </Form>
      </DraggableModal>
    )
  }

  const CfgRolePermissionModal = function (props) {
    const [rolePermission, setRolePermission] = useState([])
    const { visible } = props
    const { idRole, roleName } = props.record
    useEffect(() => {
      if (idRole && visible) {
        axios
          .get('/bi-sys/api/user/biSysRolePermission/queryByRoleIdOrPerId', {
            params: { idRole },
          })
          .then(({ data }) => {
            setRolePermission(data.map((_) => _['idPermission']))
          })
      }
    }, [idRole, visible])

    const handleCheck = (checkedKeys) => {
      setRolePermission(checkedKeys)
    }
    const handleUpdatePerm = () => {
      axios
        .post('/bi-sys/api/admin/biSysRolePermission/updateRolePermission', null, {
          params: {
            idRole,
            permissions: rolePermission.join(','),
          },
        })
        .then(() => {
          message.success('更新成功')
          setCfgRolePermissionVisible(false)
        })
    }

    const [treeExpandedKeys, setTreeExpandedKeys] = useState([])
    const [keyword, setKeyword] = useState('')
    const [filteredTree, setFilteredTree] = useState(permissionTree)

    const debounceSearch = useMemo(() => {
      return debounce((keyword) => {
        const ret = filterDeep(
          permissionData,
          (child) => {
            return [child.permissionName].some((word) => {
              return (word || '').toLowerCase().indexOf((keyword || '').toLowerCase()) > -1
            })
          },
          {
            childrenPath: 'children',
            onTrue: { skipChildren: true },
          }
        )
        const keys = mapDeep(
          ret,
          (child) => {
            return child?.idPermission
          },
          { childrenPath: 'children' }
        )

        setFilteredTree(ret || [])
        setTreeExpandedKeys(keys.filter(Boolean))
      }, 300)
    }, [setFilteredTree, setTreeExpandedKeys])
    const handleChange = useCallback(
      (e) => {
        setKeyword(e.target.value)
        debounceSearch(e.target.value)
      },
      [debounceSearch]
    )

    const handleOnTreeExpand = (expandedKeys) => {
      setTreeExpandedKeys(expandedKeys)
    }

    return (
      <DraggableModal
        destroyOnClose
        visible={visible}
        title={`角色权限配置（${roleName}）`}
        onOk={handleUpdatePerm}
        onCancel={() => setCfgRolePermissionVisible(false)}>
        <div>
          <Input value={keyword} onChange={handleChange} className={'mb-2'} placeholder={'输入关键字搜索'} />
          <Tree
            checkable
            height={350}
            treeData={filteredTree}
            expandedKeys={treeExpandedKeys}
            onExpand={handleOnTreeExpand}
            checkedKeys={rolePermission}
            onCheck={handleCheck}
          />
        </div>
      </DraggableModal>
    )
  }

  const [searchPermissionKeyword, setSearchPermissionKeyword] = useState('')
  useEffect(() => {
    if (!searchPermissionKeyword) {
      setPermissionTable((prevState) => ({ ...prevState, data: permissionData }))
      return
    }
    const result = filterDeep(
      permissionData,
      (child) => {
        return [child.permissionName, child.expression, child.systemCode].some((word) => {
          return (word || '').toLowerCase().indexOf((searchPermissionKeyword || '').toLowerCase()) > -1
        })
      },
      { cloneDeep: cloneDeep, childrenPath: ['children'], onTrue: { skipChildren: true } }
    )
    setPermissionTable((prevState) => ({ ...prevState, data: result }))
  }, [searchPermissionKeyword, permissionData])

  return (
    <div className={'px-6 py-6'}>
      <Tabs type="card">
        {
            permissionsMap['bi-sys.BISysUserController'] &&
            <Tabs.TabPane tab="用户" key="1">
              <div className="flex justify-end mb-2.5">
                <div style={{flex: '1', marginRight: '10px'}}>
                  <Input
                      value={searchKeyword}
                      allowClear
                      onChange={(e) => {
                        setKeyword(e.target.value)
                        setTable((prevState) => {
                          return {...prevState, pagination: {...prevState.pagination, current: 1}}
                        })
                      }}
                      className={'w-64'}
                      placeholder="输入名称、账号、手机号搜索"
                  />
                </div>
                {permissionsMap['bi-sys.BISysUserController.saveOrUpdate'] && (
                    <Button style={{flex: '0 0 auto'}} type="primary" onClick={addNew}>
                      新增
                    </Button>
                )}
              </div>

              <Table
                  rowKey="idUser"
                  scroll={table.scroll}
                  tableLayout="fixed"
                  dataSource={table.data}
                  columns={table.columns}
                  size="small"
                  onChange={handleTableChange}
                  pagination={table.pagination}
              />

              <DraggableModal
                  title={modalTitle}
                  width={580}
                  visible={modalVisible}
                  onCancel={cancelModal}
                  onOk={saveModalData}
                  destroyOnClose>
                <Form initialValues={modalForm} labelCol={{span: 4}} wrapperCol={{span: 20}} ref={formRef}>
                  <Form.Item label="名称" name="nameCn" rules={[{required: true, message: '此项必填'}]}>
                    <Input/>
                  </Form.Item>
                  <Form.Item label="工号" name="employeeNo" rules={[{required: true}]}>
                    <Input disabled={!!modalForm.idUser} placeholder="工号即为登录账号"/>
                  </Form.Item>
                  <Form.Item label="手机号" name="phone">
                    <Input/>
                  </Form.Item>
                  <Form.Item label="API_TOKEN" name="apiToken">
                    <Input maxLength={150}/>
                  </Form.Item>
                  <Form.Item label="是否管理员" name="isAdmin" valuePropName={'checked'}>
                    <Switch checkedChildren="是" unCheckedChildren="否" defaultChecked={modalForm.isAdmin}/>
                  </Form.Item>
                </Form>
              </DraggableModal>
              <CfgUserRoleModal visible={cfgUserRoleVisible} record={currentUserRoleRecord}/>
            </Tabs.TabPane>
        }
        {
          permissionsMap['bi-sys.BiSysRoleController'] &&
          <Tabs.TabPane tab="角色" key="2">
          <div className="flex justify-end mb-2.5">
            <div style={{ flex: '1', marginRight: '10px' }}>
              <Input
                value={searchRoleKeyword}
                allowClear
                onChange={(e) => {
                  setRoleKeyword(e.target.value)
                  setRoleTable((prevState) => {
                    return { ...prevState, pagination: { ...prevState.pagination, current: 1 } }
                  })
                }}
                className={'w-64'}
                placeholder="输入角色名搜索"
              />
            </div>
            {permissionsMap['bi-sys.BiSysRoleController.saveOrUpdateRole'] && (
              <Button onClick={addNewRole} type={'primary'}>
                新增
              </Button>
            )}
          </div>
          <Table
            columns={roleTable.columns}
            tableLayout={'fixed'}
            dataSource={roleTable.data}
            pagination={roleTable.pagination}
            onChange={({ current, pageSize }) => {
              setRoleTable((prevState) => ({
                ...prevState,
                pagination: { ...prevState.pagination, current, pageSize },
              }))
            }}
            rowKey="idRole"
            size="small"
          />

          <RoleModal visible={roleModalVisible} initialValues={roleFormInitialValues} />
          <CfgRolePermissionModal visible={cfgRolePermissionVisible} record={currentCfgPermRecord} />
        </Tabs.TabPane>
        }
        <Tabs.TabPane tab="权限集" key="3">
          <div className="mb-2.5">
            <Input
              className={'w-64'}
              placeholder="搜索"
              allowClear
              value={searchPermissionKeyword}
              onChange={(e) => {
                setSearchPermissionKeyword(e.target.value)
              }}
            />
          </div>
          <Table
            columns={permissionTable.columns}
            tableLayout={'fixed'}
            dataSource={permissionTable.data}
            rowKey="idPermission"
            size="small"
            pagination={false}
          />
        </Tabs.TabPane>
      </Tabs>
    </div>
  )
}

export default connect(
  (state) => {
    return {
      permissionsMap: state.user?.userInfo?.permissionsMap,
      permissionTree: state.permission.permissionTree,
    }
  },
  (dispatch) => {
    return {
      setPermissionTree: (payload) => {
        return dispatch({
          type: 'set_permission_tree',
          payload,
        })
      },
    }
  }
)(UserRole)
