import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { useHistory, useRouteMatch } from 'react-router-dom'
import debounce from 'lodash/debounce'
import { connect } from 'react-redux'
import {
  Button,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Timeline,
  Tooltip,
  Tree,
} from 'antd'
import { TASK_TYPE } from './TaskMgmt'
import { useForm } from 'antd/es/form/Form'
import moment from 'moment'
import useTable from '../../../hooks/useTable'
import DraggableModal from '../../../components/DraggableModal'
import axios from '../../../utils/axios'
import filterDeep from 'deepdash/es/filterDeep'
import cloneDeep from 'lodash/cloneDeep'
import ExcelJs from 'exceljs'

const walk = (data) => {
  const _walk = (_data) => {
    _data.forEach((item) => {
      item.key = item.id
      item.title = item.label
      item.disableCheckbox = !!item.children
      if (item.children) {
        _walk(item.children)
      }
    })
  }
  _walk(data)
  return data
}

const FileChooseModal = (props) => {
  const { visible, dispatch, addFileRecord, selectedKeys, fileTreeData } = props
  const [allData, setAllData] = useState([])
  const [treeData, setTreeData] = useState([])
  const [checkedKeys, setCheckedKeys] = useState([])
  const [cachedCheckedKeys, setCachedCheckedKeys] = useState([])
  const [treeKey, setTreeKey] = useState(1)
  useEffect(() => {
    if (visible) {
      setTreeData(JSON.parse(JSON.stringify(fileTreeData)))
      setAllData(JSON.parse(JSON.stringify(fileTreeData)))
    }
  }, [visible, fileTreeData])

  useEffect(() => {
    if (visible) {
      setCheckedKeys(selectedKeys)
      setCachedCheckedKeys(selectedKeys)
    }
  }, [selectedKeys, setCheckedKeys, visible, setCachedCheckedKeys])

  const handleSearch = debounce(
    (_value) => {
      const value = _value.trim()
      const _checkedKeys = checkedKeys.slice()
      const result = filterDeep(
        allData,
        (item) => {
          if ((item.title || '').toLowerCase().indexOf((value || '').toLowerCase()) !== -1) {
            if (_checkedKeys.indexOf(item.key) === -1 && cachedCheckedKeys.indexOf(item.key) > -1) {
              _checkedKeys.push(item.key)
            }
            return true
          } else {
            const index = _checkedKeys.indexOf(item.key)
            if (index > -1) {
              _checkedKeys.splice(index, 1)
            }
            return false
          }
        },
        { cloneDeep: cloneDeep, childrenPath: ['children'] }
      )

      setCheckedKeys(_checkedKeys)
      setTreeKey((prevState) => prevState + 1)
      setTreeData(result || [])
    },
    500,
    { leading: false, trailing: true }
  )

  const handleCheck = (checkedKeys, e) => {
    setCheckedKeys(() => {
      return checkedKeys.filter(() => {
        // return /\.(kjb|ktr|sql|kdb)$/i.test(v)
        return true
      })
    })
    setCachedCheckedKeys((prevState) => {
      const {
        checked,
        checkedNodes,
        node: { key },
      } = e
      const keys = checkedNodes
        .map((_) => _.key)
        .filter((_key) => {
          // return /\.(kjb|ktr|sql|kdb)$/i.test(_key)
          return true
        })
      console.log(keys)
      if (checked) {
        return Array.from(new Set(prevState.concat(keys)))
      } else {
        return prevState.filter((_key) => {
          return !_key.startsWith(key)
        })
      }
    })
  }

  const handleOk = () => {
    const files = cachedCheckedKeys.filter(() => {
      // return /\.(kjb|ktr|sql|kdb)$/i.test(key)
      return true
    })
    console.log(files)
    if (files.length > 50) {
      message.error('选中超过了50个文件，请适当减少')
      return
    }

    dispatch({
      type: 'changeFileChooseVisible',
      payload: false,
    })
    addFileRecord(files)
  }

  const refreshFile = useCallback(() => {
    axios
      .get('/bi-auto-deploy/api/user/common/getFileTreeNodeByTaskType', {
        params: {
          taskType: 'FileDeploy',
        },
      })
      .then(({ data }) => {
        message.success('刷新成功')
        const _data = walk(data)
        dispatch({
          type: 'setFileTreeData',
          payload: _data,
        })
        setTreeData(_data)
        setAllData(_data)
      })
  }, [dispatch])

  return (
    <DraggableModal
      destroyOnClose
      title={'文件路径'}
      width={800}
      visible={visible}
      onOk={handleOk}
      onCancel={() => {
        dispatch({
          type: 'changeFileChooseVisible',
          payload: false,
        })
      }}>
      <div className={'flex justify-between'}>
        <Input.Search onSearch={handleSearch} className={'mb-2'} onChange={(e) => handleSearch(e.target.value)} />

        <Button className={'ml-2 mb-2'} type={'primary'} size={'middle'} onClick={refreshFile}>
          刷新
        </Button>
      </div>
      {!!treeData.length && (
        <Tree
          key={treeKey}
          checkable
          selectable={false}
          defaultExpandAll={true}
          checkedKeys={checkedKeys}
          autoExpandParent={true}
          onCheck={handleCheck}
          treeData={treeData}
          height={450}
        />
      )}

      {!treeData.length && (
        <Empty description={'暂无数据，请【更换搜索关键字】或【刷新】试试'} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </DraggableModal>
  )
}

function Edit(props) {
  const { setBreadcrumbParams, userInfo } = props
  const readonly = useRef(false)
  const matches = useRouteMatch()
  const history = useHistory()
  const {
    params: { taskId },
    url,
  } = matches
  const [form] = useForm()
  const [recordLogs, setRecordLogs] = useState([])

  const [taskType, setTaskType] = useState('FileDeploy')

  readonly.current = /readonly$/.test(url)

  const enumList = useRef({})
  useEffect(() => {
    axios
      .get('/bi-auto-deploy/api/user/common/getSystemEnum', {
        params: {
          enumNames: ['PermissionOperationType', 'YHDataSetType', 'TaskProcessState', 'ColumnType'].toString(),
        },
      })
      .then(({ data }) => {
        enumList.current = data
      })
  }, [])

  const targetServerList = useRef([])
  useEffect(() => {
    axios.get('/bi-auto-deploy/api/user/server/selectForSelectOptionInGroup').then(({ data }) => {
      targetServerList.current = data
    })
  }, [])

  const yhServerInfo = useRef({})
  useEffect(() => {
    axios.get('/bi-auto-deploy/api/user/server/getYHServerMessage').then(({ data }) => {
      yhServerInfo.current = data
    })
  }, [])

  const { table: table1, setTable: setTable1 } = useTable({
    rowKey: '__index__',
    pagination: false,
    columns: [
      {
        title: '#',
        dataIndex: '',
        width: 60,
        render: (_, record, index) => {
          return index + 1
        },
      },
      {
        title: '目标服务器',
        dataIndex: 'targetServerId',
        render: (_, record) => {
          const { filePath } = record
          const isSQL = /\.(sql)$/i.test(filePath)
          return (
            isSQL && (
              <Select
                value={record['targetServerId']}
                style={{ width: '100%' }}
                disabled={readonly.current}
                onChange={(v) => handleTable1RowChange(record, 'targetServerId', v)}>
                {targetServerList.current
                  .filter((s) => s['typeEnName'] === 'OracleDataBase')
                  .map((s) => {
                    return (
                      <Select.OptGroup label={s['typeCnName']} key={s['typeEnName']}>
                        {s['servers'].map((server) => {
                          return (
                            <Select.Option value={server.id} key={server.id}>
                              {server['serverName']}
                            </Select.Option>
                          )
                        })}
                      </Select.OptGroup>
                    )
                  })}
              </Select>
            )
          )
        },
      },
      {
        title: '源文件路径',
        dataIndex: 'filePath',
        render: (_, record) => {
          return (
            <Tooltip trigger={['focus']} title={record.filePath}>
              <Input value={record.filePath} disabled={readonly.current} />
            </Tooltip>
          )
        },
      },
      {
        title: '部署路径',
        dataIndex: 'deployPath',
        render: (_, record) => {
          return (
            <Tooltip trigger={['focus']} title={record.deployPath}>
              <Input
                value={record.deployPath}
                disabled={readonly.current}
                onChange={(e) => handleTable1RowChange(record, 'deployPath', e.target.value)}
              />
            </Tooltip>
          )
        },
      },
      {
        title: '部署文件名',
        dataIndex: 'deployFileName',
        render: (_, record) => {
          return (
            <Tooltip trigger={['focus']} title={record.deployFileName}>
              <Input
                value={record.deployFileName}
                disabled={readonly.current}
                onChange={(e) => handleTable1RowChange(record, 'deployFileName', e.target.value)}
              />
            </Tooltip>
          )
        },
      },
      {
        title: '文件标签',
        dataIndex: 'fileLabel',
        render: (_, record) => {
          const { deployFileName } = record
          let label = ''
          if (/\.(sql)$/i.test(deployFileName)) {
            label = 'SQL'
          } else if (/\.(kjb|kdb|ktr)$/i.test(deployFileName)) {
            label = 'KETTLE'
          } else {
            const _ext = deployFileName.split('.')
            label = _ext.length > 1 ? _ext.pop().toUpperCase() : 'OTHER'
          }

          const color = { SQL: 'gold', KETTLE: 'blue' }[label] || 'cyan'
          return <Tag color={color}>{label}</Tag>
        },
      },
      {
        title: '文件更新类型',
        dataIndex: 'fileDeployUpdateType',
        render: (_, record) => {
          return (
            <Select
              style={{ width: '100%' }}
              value={record['fileDeployUpdateType']}
              disabled={readonly.current}
              onChange={(v) => handleTable1RowChange(record, 'fileDeployUpdateType', v)}>
              <Select.Option value={'Update'}>更新</Select.Option>
              <Select.Option value={'Delete'}>删除</Select.Option>
              <Select.Option value={'Create'}>新建</Select.Option>
            </Select>
          )
        },
      },
      {
        title: '排序',
        dataIndex: 'orderValue',
        render: (_, record) => {
          return (
            <InputNumber
              value={record.orderValue}
              disabled={readonly.current}
              onChange={(v) => handleTable1RowChange(record, 'orderValue', v)}
            />
          )
        },
      },
      {
        title: '运行sql文件',
        dataIndex: 'runSql',
        render: (_, record) => {
          const { deployFileName } = record
          if (/\.(sql)$/i.test(deployFileName)) {
            return (
              <Switch
                checked={record['runSql']}
                disabled={readonly.current}
                onChange={(v) => handleTable1RowChange(record, 'runSql', v)}
              />
            )
          } else {
            return null
          }
        },
      },
      {
        title: '操作',
        dataIndex: 'actions',
        render: (_, record) => {
          const isSQL = /\.(sql)$/i.test(record.deployFileName)
          return (
            <Space>
              {!readonly.current && (
                <Button size={'small'} type={'link'} danger onClick={() => deleteTable1Row(record)}>
                  删除
                </Button>
              )}
              {isSQL && (
                <Button size={'small'} type={'link'} onClick={() => checkSQLContent(record)}>
                  查看SQL
                </Button>
              )}
            </Space>
          )
        },
      },
    ],
  })

  const [selectedRows, setSelectedRows] = useState([])
  const { table: table2, setTable: setTable2, components: components2 } = useTable({
    rowKey: '__index__',
    resizeable: true,
    scroll: { x: 1200 },
    rowSelection: {
      type: 'checkbox',
      onChange: (selectedRowKeys, selectedRows) => {
        setSelectedRows(selectedRows)
      },
    },
    pagination: false,
    columns: [
      {
        title: '#',
        dataIndex: '',
        width: 60,
        render: (_, record, index) => {
          return index + 1
        },
      },
      {
        title: '目标服务器',
        dataIndex: 'targetServerId',
        width: 180,
        render: (_, record) => {
          return (
            <Select
              style={{ width: '100%' }}
              value={record['targetServerId']}
              disabled={readonly.current}
              onChange={(v) => handleTable2RowChange(record, 'targetServerId', v)}>
              {targetServerList.current
                .filter((s) => s['typeEnName'] === 'YongHongAPIServer')
                .map((s) => {
                  return (
                    <Select.OptGroup label={s['typeCnName']} key={s['typeEnName']}>
                      {s['servers'].map((server) => {
                        return (
                          <Select.Option value={server.id} key={server.id}>
                            {server['serverName']}
                          </Select.Option>
                        )
                      })}
                    </Select.OptGroup>
                  )
                })}
            </Select>
          )
        },
      },
      {
        title: '操作类型',
        dataIndex: 'permissionOperationType',
        width: 180,
        render: (_, record) => {
          return (
            record['targetServerId'] && (
              <Select
                value={record['permissionOperationType']}
                disabled={readonly.current}
                onChange={(v) => handleTable2RowChange(record, 'permissionOperationType', v)}
                style={{ width: '100%' }}>
                {enumList.current['PermissionOperationType'].map((item) => {
                  return (
                    <Select.Option
                      key={item.value}
                      value={item.value}
                      disabled={['ROLE_ADD', 'ROLE_DELETE'].includes(item.value)}>
                      {item.label}
                    </Select.Option>
                  )
                })}
              </Select>
            )
          )
        },
      },
      {
        title: '工号/角色',
        width: 180,
        dataIndex: 'targetName',
        render: (_, record) => {
          const { permissionOperationType: type, targetServerId } = record
          return (
            type && (
              <>
                {['USER_ADD', 'ROLE_ADD'].includes(type) && (
                  <Input
                    value={record['targetName']}
                    disabled={readonly.current}
                    onChange={(e) => handleTable2RowChange(record, 'targetName', e.target.value)}
                  />
                )}
                {['USER_DELETE', 'USER_ADD_ROLE', 'USER_DELETE_ROLE'].includes(type) && (
                  <Select
                    style={{ width: '100%' }}
                    value={record['targetName']}
                    disabled={readonly.current}
                    optionLabelProp={'name'}
                    filterOption={(search, item) => {
                      return (item.label + item.value).toLowerCase().indexOf(search.toLowerCase()) >= 0
                    }}
                    onChange={(v) => handleTable2RowChange(record, 'targetName', v)}
                    showSearch>
                    {(yhServerInfo.current[`server-${targetServerId}`]?.user || []).map((u) => {
                      return (
                        <Select.Option value={u.name} key={u.name} label={u.alias}>
                          <span style={{ fontSize: 12 }}>
                            {u.name}({u.alias})
                          </span>
                        </Select.Option>
                      )
                    })}
                  </Select>
                )}
                {['ROLE_DELETE', 'ROLE_ADD_REPORT_PERMISSION', 'ROLE_ADD_DATA_SET_PERMISSION'].includes(type) && (
                  <Select
                    style={{ width: '100%' }}
                    value={record['targetName']}
                    optionLabelProp={'name'}
                    disabled={readonly.current}
                    filterOption={(search, item) => {
                      return (item.label + item.value).toLowerCase().indexOf(search.toLowerCase()) >= 0
                    }}
                    onChange={(v) => handleTable2RowChange(record, 'targetName', v)}
                    showSearch>
                    {(yhServerInfo.current[`server-${targetServerId}`]?.role || []).map((u) => {
                      return (
                        <Select.Option value={u.name} key={u.name} label={u.alias}>
                          <div title={u.alias} style={{ fontSize: 12 }}>
                            {u.name}
                          </div>
                        </Select.Option>
                      )
                    })}
                  </Select>
                )}
              </>
            )
          )
        },
      },
      {
        title: '报表路径',
        dataIndex: 'reportPath',
        width: 300,
        render: (_, record) => {
          const { permissionOperationType: type, targetServerId } = record
          return (
            type && (
              <>
                {type === 'ROLE_ADD_REPORT_PERMISSION' && (
                  <Select
                    style={{ width: '100%' }}
                    disabled={readonly.current}
                    filterOption={(search, item) => {
                      return (item.label + item.value).toLowerCase().indexOf(search.toLowerCase()) >= 0
                    }}
                    value={record['reportPath']}
                    onChange={(v) => handleTable2RowChange(record, 'reportPath', v)}
                    showSearch>
                    {(yhServerInfo.current[`server-${targetServerId}`]?.['reportPaths'] || []).map((u) => {
                      return (
                        <Select.Option value={u.name} key={u.name} label={u.alias}>
                          <div title={u.alias} style={{ fontSize: 12 }}>
                            {u.name}
                          </div>
                        </Select.Option>
                      )
                    })}
                  </Select>
                )}
              </>
            )
          )
        },
      },
      {
        title: '数据集路径',
        width: 300,
        dataIndex: 'dataSetPath',
        render: (_, record) => {
          const { permissionOperationType: type, targetServerId } = record
          return (
            type === 'ROLE_ADD_DATA_SET_PERMISSION' && (
              <>
                <Select
                  style={{ width: '100%' }}
                  value={record['dataSetPath']}
                  showSearch
                  disabled={readonly.current}
                  optionLabelProp={'label'}
                  filterOption={(search, item) => {
                    return item.label.toLowerCase().indexOf(search.toLowerCase()) >= 0
                  }}
                  onChange={(v) => handleTable2RowChange(record, 'dataSetPath', v)}>
                  {(yhServerInfo.current[`server-${targetServerId}`]?.['dataSetPaths'] || []).map((u) => {
                    return (
                      <Select.Option value={`${u.name}-${u.alias}`} key={`${u.name}-${u.alias}`} label={u.name}>
                        <div title={u.name} style={{ fontSize: 12 }}>
                          {u.name}
                        </div>
                      </Select.Option>
                    )
                  })}
                </Select>
              </>
            )
          )
        },
      },
      {
        title: '数据集类型',
        width: 150,
        dataIndex: 'dataSetType',
        render: (_, record) => {
          const { dataSetPath, targetServerId } = record
          const dataSet = (yhServerInfo.current[`server-${targetServerId}`]?.['dataSetPaths'] || []).find((item) => {
            return item.name + '-' + item.alias === record['dataSetPath']
          })
          record['dataSetType'] = dataSet?.alias
          const label = enumList.current['YHDataSetType'].find((item) => item.value === record.dataSetType)?.label
          return !!dataSetPath && <Tag>{label || '未知'}</Tag>
        },
      },
      {
        title: '读权限',
        width: 100,
        dataIndex: 'canRead',
        render: (_, record) => {
          const { permissionOperationType: type } = record
          return (
            ['ROLE_ADD_DATA_SET_PERMISSION', 'ROLE_ADD_REPORT_PERMISSION'].includes(type) && (
              <Switch checked={record.canRead} disabled />
            )
          )
        },
      },
      {
        title: '写权限',
        width: 100,
        dataIndex: 'canWrite',
        render: (_, record) => {
          const { permissionOperationType: type } = record
          return (
            ['ROLE_ADD_DATA_SET_PERMISSION', 'ROLE_ADD_REPORT_PERMISSION'].includes(type) && (
              <Switch
                checked={record.canWrite}
                disabled={readonly.current}
                onChange={(v) => handleTable2RowChange(record, 'canWrite', v)}
              />
            )
          )
        },
      },
      {
        title: '角色列表',
        width: 200,
        dataIndex: 'targetRoles',
        render: (_, record) => {
          const { permissionOperationType: type, targetServerId } = record
          return (
            ['USER_ADD', 'USER_ADD_ROLE', 'USER_DELETE_ROLE'].includes(type) && (
              <Select
                value={record['targetRoles']}
                style={{ width: '100%' }}
                disabled={readonly.current}
                onChange={(v) => handleTable2RowChange(record, 'targetRoles', v)}
                mode="multiple">
                {(yhServerInfo.current[`server-${targetServerId}`]?.role || []).map((u) => {
                  return (
                    <Select.Option value={u.name} key={u.name} label={u.alias}>
                      <div title={u.alias} style={{ fontSize: 12 }}>
                        {u.name}
                      </div>
                    </Select.Option>
                  )
                })}
              </Select>
            )
          )
        },
      },
      {
        title: '昵称',
        width: 150,
        dataIndex: 'targetUserAlias',
        render: (_, record) => {
          const { permissionOperationType: type } = record
          return (
            ['USER_ADD'].includes(type) && (
              <Input
                value={record['targetUserAlias']}
                disabled={readonly.current}
                onChange={(e) => handleTable2RowChange(record, 'targetUserAlias', e.target.value)}
              />
            )
          )
        },
      },
      {
        title: '邮箱地址',
        width: 150,
        dataIndex: 'targetUserEmail',
        render: (_, record) => {
          const { permissionOperationType: type } = record
          return (
            ['USER_ADD'].includes(type) && (
              <Input
                value={record['targetUserEmail']}
                disabled={readonly.current}
                onChange={(e) => handleTable2RowChange(record, 'targetUserEmail', e.target.value)}
              />
            )
          )
        },
      },
      {
        title: '用户分组',
        width: 180,
        dataIndex: 'targetUserParent',
        render: (_, record) => {
          const { permissionOperationType: type } = record
          return (
            ['USER_ADD'].includes(type) && (
              <Input
                value={record['targetUserParent']}
                disabled={readonly.current}
                placeholder={'多个可用逗号分隔'}
                onChange={(e) => handleTable2RowChange(record, 'targetUserParent', e.target.value)}
              />
            )
          )
        },
      },
      {
        title: '排序',
        width: 150,
        dataIndex: 'orderValue',
        render: (_, record) => {
          return (
            <InputNumber
              value={record.orderValue}
              disabled={readonly.current}
              onChange={(v) => handleTable2RowChange(record, 'orderValue', v)}
            />
          )
        },
      },
      {
        title: '操作',
        width: 150,
        dataIndex: 'actions',
        fixed: 'right',
        render: (_, record) => {
          return (
            <Space>
              {!readonly.current && (
                <Space>
                  <Button type={'link'} size={'small'} onClick={() => copyTable2Row(record)}>
                    复制
                  </Button>
                  <Button type={'link'} size={'small'} onClick={() => deleteTable2Row(record)} danger>
                    删除
                  </Button>
                </Space>
              )}
            </Space>
          )
        },
      },
    ],
  })

  const { table: table3, setTable: setTable3 } = useTable({
    rowKey: '__index__',
    pagination: false,
    scroll: { x: 1200 },
    columns: [
      {
        title: '#',
        dataIndex: '',
        width: 60,
        render: (_, record, index) => {
          return index + 1
        },
      },
      {
        title: '源服务器',
        dataIndex: 'sourceServerId',
        width: 170,
        render: (_, record) => {
          return (
            <Select
              value={record['sourceServerId']}
              style={{ width: '100%' }}
              disabled={readonly.current}
              onChange={(v) => handleTable3RowChange(record, 'sourceServerId', v)}>
              {targetServerList.current
                .filter((s) => s['typeEnName'] === 'OracleDataBase')
                .map((s) => {
                  return (
                    <Select.OptGroup label={s['typeCnName']} key={s['typeEnName']}>
                      {s['servers'].map((server) => {
                        return (
                          <Select.Option value={server.id} key={server.id}>
                            {server['serverName']}
                          </Select.Option>
                        )
                      })}
                    </Select.OptGroup>
                  )
                })}
            </Select>
          )
        },
      },
      {
        title: '目标服务器',
        dataIndex: 'targetServerId',
        width: 170,
        render: (_, record) => {
          return (
            <Select
              value={record['targetServerId']}
              style={{ width: '100%' }}
              disabled={readonly.current}
              onChange={(v) => handleTable3RowChange(record, 'targetServerId', v)}>
              {targetServerList.current
                .filter((s) => s['typeEnName'] === 'OracleDataBase')
                .map((s) => {
                  return (
                    <Select.OptGroup label={s['typeCnName']} key={s['typeEnName']}>
                      {s['servers'].map((server) => {
                        return (
                          <Select.Option value={server.id} key={server.id}>
                            {server['serverName']}
                          </Select.Option>
                        )
                      })}
                    </Select.OptGroup>
                  )
                })}
            </Select>
          )
        },
      },
      {
        title: '数据同步类型',
        dataIndex: 'tableSyncType',
        width: 100,
        render: (_, record) => {
          return (
            <Select
              value={record['tableSyncType']}
              style={{ width: '100%' }}
              disabled={readonly.current}
              onChange={(v) => handleTable3RowChange(record, 'tableSyncType', v)}>
              <Select.Option value={'FullDose'}>全量</Select.Option>
              <Select.Option value={'Increment'}>增量</Select.Option>
            </Select>
          )
        },
      },
      {
        title: '源表用户',
        dataIndex: 'sourceUser',
        width: 150,
        render: (_, record) => {
          return (
            <Input
              value={record['sourceUser']}
              disabled={readonly.current}
              maxlength={30}
              onChange={(e) => handleTable3RowChange(record, 'sourceUser', e.target.value)}
            />
          )
        },
      },
      {
        title: '源表名',
        dataIndex: 'sourceTableName',
        width: 150,
        render: (_, record) => {
          return (
            <Input
              value={record['sourceTableName']}
              disabled={readonly.current}
              maxlength={30}
              onChange={(e) => handleTable3RowChange(record, 'sourceTableName', e.target.value)}
            />
          )
        },
      },
      {
        title: '源表取数条件',
        dataIndex: 'incSrcSearchConditions',
        width: 200,
        render: (_, record) => {
          const { tableSyncType } = record
          return (
            tableSyncType === 'Increment' && (
              <Input.TextArea
                value={record['incSrcSearchConditions']}
                disabled={readonly.current}
                onChange={(e) => handleTable3RowChange(record, 'incSrcSearchConditions', e.target.value)}
              />
            )
          )
        },
      },
      {
        title: '目标表用户',
        dataIndex: 'targetUser',
        width: 150,
        render: (_, record) => {
          return (
            <Input
              value={record.targetUser}
              disabled={readonly.current}
              maxlength={30}
              onChange={(e) => handleTable3RowChange(record, 'targetUser', e.target.value)}
            />
          )
        },
      },
      {
        title: '目标表名',
        dataIndex: 'targetTableName',
        width: 150,
        render: (_, record) => {
          return (
            <Input
              value={record.targetTableName}
              disabled={readonly.current}
              maxlength={30}
              onChange={(e) => handleTable3RowChange(record, 'targetTableName', e.target.value)}
            />
          )
        },
      },
      {
        title: '是否备份',
        dataIndex: 'backupData',
        width: 100,
        render: (_, record) => {
          return (
            <Switch
              checked={record.backupData}
              disabled={readonly.current}
              onChange={(v) => handleTable3RowChange(record, 'backupData', v)}
            />
          )
        },
      },
      {
        title: '备份用户',
        dataIndex: 'backupUser',
        width: 150,
        render: (_, record) => {
          const { backupData } = record
          return (
            backupData && (
              <Input
                value={record.backupUser}
                disabled={readonly.current}
                maxlength={30}
                onChange={(e) => handleTable3RowChange(record, 'backupUser', e.target.value)}
              />
            )
          )
        },
      },
      {
        title: '备份表名',
        dataIndex: 'backupTableName',
        width: 150,
        render: (_, record) => {
          const { backupData } = record
          return (
            backupData && (
              <Input
                value={record.backupTableName}
                disabled={readonly.current}
                maxlength={30}
                onChange={(e) => handleTable3RowChange(record, 'backupTableName', e.target.value)}
              />
            )
          )
        },
      },
      {
        title: '排序',
        dataIndex: 'orderValue',
        width: 100,
        render: (_, record) => {
          return (
            <InputNumber
              value={record.orderValue}
              disabled={readonly.current}
              onChange={(v) => handleTable3RowChange(record, 'orderValue', v)}
            />
          )
        },
      },
      {
        title: '操作',
        dataIndex: 'actions',
        width: 120,
        fixed: 'right',
        render: (text, record) => {
          return (
            <Space>
              {!readonly.current && (
                <Button danger size={'small'} type={'link'} onClick={() => deleteTable3Row(record)}>
                  删除
                </Button>
              )}
            </Space>
          )
        },
      },
    ],
  })

  const { table: table4, setTable: setTable4 } = useTable({
    rowKey: '__index__',
    pagination: false,
    scroll: { x: 1200 },
    columns: [
      {
        title: '#',
        dataIndex: '',
        width: 60,
        render: (_, record, index) => {
          return index + 1
        },
      },
      {
        title: '字段',
        dataIndex: 'columnName',
        render: (_, record) => {
          return (
            <Input
              maxLength={30}
              value={record.columnName}
              disabled={readonly.current}
              onChange={(e) => handleTable4RowChange(record, 'columnName', e.target.value)}
            />
          )
        },
      },
      {
        title: '字段注释',
        dataIndex: 'columnCnName',
        render: (_, record) => {
          return (
            <Input
              maxLength={30}
              value={record.columnCnName}
              disabled={readonly.current}
              onChange={(e) => handleTable4RowChange(record, 'columnCnName', e.target.value)}
            />
          )
        },
      },
      {
        title: '字段类型',
        dataIndex: 'columnType',
        render: (_, record) => {
          return (
            <Select
              value={record.columnType}
              disabled={readonly.current}
              style={{ width: '100%' }}
              onChange={(v) => handleTable4RowChange(record, 'columnType', v)}>
              {enumList.current.ColumnType.map((item) => {
                return (
                  <Select.Option value={item.value} key={item.value}>
                    {item.label}
                  </Select.Option>
                )
              })}
            </Select>
          )
        },
      },
      {
        title: '字段长度',
        dataIndex: 'columnLength',
        render: (_, record) => {
          const { columnType } = record
          return (
            ['VARCHAR2', 'CLOB'].includes(columnType) && (
              <InputNumber
                value={record.columnLength}
                disabled={readonly.current}
                onChange={(v) => handleTable4RowChange(record, 'columnLength', v)}
              />
            )
          )
        },
      },
      {
        title: '排序',
        dataIndex: 'orderValue',
        render: (_, record) => {
          return (
            <InputNumber
              value={record.orderValue}
              disabled={readonly.current}
              onChange={(v) => handleTable4RowChange(record, 'orderValue', v)}
            />
          )
        },
      },
      {
        title: '操作',
        dataIndex: 'actions',
        fixed: 'right',
        render: (_, record) => {
          return (
            <Space>
              {!readonly.current && (
                <Button danger type={'link'} size={'small'} onClick={() => deleteTable4Row(record)}>
                  删除
                </Button>
              )}
            </Space>
          )
        },
      },
    ],
  })

  useEffect(() => {
    if (taskId === 'create') {
      setBreadcrumbParams([{ title: '新建任务单' }])
      form.setFieldsValue({
        taskType: 'FileDeploy',
      })
    } else {
      // 获取任务详情
      axios
        .get('/bi-auto-deploy/api/user/task/selectById', {
          params: { id: taskId },
        })
        .then(({ data }) => {
          const { taskName, taskType, taskDetails, logs } = data
          setRecordLogs(
            logs.sort((a, b) => {
              return moment(a.operationDate) - moment(b.operationDate)
            })
          )
          setBreadcrumbParams([{ title: taskName }])
          setTaskType(taskType)
          form.setFieldsValue(data)
          if (taskType === 'FileDeploy') {
            setTable1((prevState) => {
              return {
                ...prevState,
                dataSource: taskDetails.map((_) => {
                  return { ..._, __index__: _.filePath }
                }),
              }
            })
          } else if (taskType === 'BIPermission') {
            setTable2((prevState) => {
              return {
                ...prevState,
                dataSource: taskDetails.map((_) => {
                  return {
                    ..._,
                    targetRoles: _.targetRoles ? _.targetRoles.split(',') : [],
                    dataSetPath: _.dataSetPath ? _.dataSetPath + '-' + _.dataSetType : _.dataSetPath,
                    __index__: Math.random().toString(32).slice(-8),
                  }
                }),
              }
            })
          } else if (taskType === 'DataSynchronism') {
            setTable3((prevState) => {
              return {
                ...prevState,
                dataSource: taskDetails.map((_) => {
                  return { ..._, __index__: Math.random().toString(32).slice(-8) }
                }),
              }
            })
          } else if (taskType === 'DataRequirement') {
            setTable4((prevState) => {
              return {
                ...prevState,
                dataSource: taskDetails.map((_) => {
                  return { ..._, __index__: Math.random().toString(32).slice(-8) }
                }),
              }
            })
          }
        })
    }
  }, [taskId, setBreadcrumbParams, form, setTable1, setTable2, setTable3, setTable4])

  useEffect(() => {
    form.setFieldsValue({
      autoDeploy: false,
      integratedType: 'ADD_TABLE',
    })

    form.setFieldsValue({
      taskName: moment().format('YYYYMMDD') + '-' + taskType + '-' + userInfo.nameCn + '-',
    })
  }, [taskType, taskId, form, userInfo.nameCn])

  const checkSQLContent = (record) => {
    axios
      .get('/bi-auto-deploy/api/user/common/getSqlFileContent', {
        params: {
          filePath: record.filePath,
        },
      })
      .then(({ msg }) => {
        Modal.info({
          width: 850,
          title: record.filePath.split('/').slice(-1)[0],
          content: (
            <div
              style={{ whiteSpace: 'pre-wrap', fontFamily: 'serif', maxHeight: 500, overflow: 'auto' }}
              dangerouslySetInnerHTML={{
                __html: msg,
              }}
            />
          ),
        })
      })
  }

  const generateSql = () => {
    const integratedType = form.getFieldValue('integratedType')
    const srcTableCnName = form.getFieldValue('srcTableCnName')
    const srcTableName = form.getFieldValue('srcTableName')
    let str = ''
    if (integratedType === 'ADD_TABLE') {
      let commonStr =
        srcTableCnName === '' ? '' : 'COMMENT ON TABLE ' + srcTableName + " IS '" + srcTableCnName + "';\n"
      str = 'CREATE TABLE ' + srcTableName + '{\n'
      table4.dataSource.forEach(function (taskDetail) {
        commonStr +=
          'COMMENT ON COLUMN ' + srcTableName + '.' + taskDetail.columnName + " IS '" + taskDetail.columnCnName + "';\n"
        let columnStr
        switch (taskDetail.columnType) {
          case 'VARCHAR2':
            columnStr = "'" + taskDetail.columnName + "' VARCHAR2(" + taskDetail.columnLength + '),\n'
            break
          case 'NUMBER':
            columnStr = "'" + taskDetail.columnName + "' NUMBER,\n"
            break
          case 'TIMESTAMP':
            columnStr = "'" + taskDetail.columnName + "' TIMESTAMP(6),\n"
            break
          case 'CHAR':
            columnStr = "'" + taskDetail.columnName + "' CHAR(1),\n"
            break
          case 'CLOB':
            columnStr = "'" + taskDetail.columnName + "' CLOB(" + taskDetail.columnLength + '),\n'
            break
          default:
            columnStr = ''
        }
        str += '   ' + columnStr
      })
      if (str.lastIndexOf(',') > 0) {
        str = str.substring(0, str.lastIndexOf(','))
        str += '\n};'
      }
      str = str + '\n\n' + commonStr
    } else if (integratedType === 'ADD_FIELDS') {
      let commonStr = ''
      table4.dataSource.forEach(function (taskDetail) {
        let columnStr
        commonStr +=
          'COMMENT ON COLUMN ' + srcTableName + '.' + taskDetail.columnName + " IS '" + taskDetail.columnCnName + "';\n"
        switch (taskDetail.columnType) {
          case 'VARCHAR2':
            columnStr = "'" + taskDetail.columnName + "' VARCHAR2(" + taskDetail.columnLength + ')'
            break
          case 'NUMBER':
            columnStr = "'" + taskDetail.columnName + "' NUMBER"
            break
          case 'TIMESTAMP':
            columnStr = "'" + taskDetail.columnName + "' TIMESTAMP(6)"
            break
          case 'CHAR':
            columnStr = "'" + taskDetail.columnName + "' CHAR(1)"
            break
          case 'CLOB':
            columnStr = "'" + taskDetail.columnName + "' CLOB(" + taskDetail.columnLength + ')'
            break
          default:
            columnStr = ''
        }
        str += 'ALTER TABLE ' + srcTableName + ' ADD ' + columnStr + ';\n'
      })
      str = str + '\n\n' + commonStr
    }

    Modal.info({
      width: 850,
      title: '生成Sql',
      content: (
        <div
          style={{ whiteSpace: 'pre-wrap', fontFamily: 'serif', maxHeight: 500, overflow: 'auto' }}
          dangerouslySetInnerHTML={{
            __html: str,
          }}
        />
      ),
    })
  }

  const baseHandleTableChange = (setter, record, prop, value) => {
    setter((prevState) => {
      const index = prevState.dataSource.findIndex((item) => item.__index__ === record.__index__)
      return {
        ...prevState,
        dataSource:
          index > -1
            ? [
                ...prevState.dataSource.slice(0, index),
                {
                  ...prevState.dataSource[index],
                  [prop]: value,
                },
                ...prevState.dataSource.slice(index + 1),
              ]
            : prevState.dataSource,
      }
    })
  }

  const handleTable2RowChange = (record, prop, value) => {
    baseHandleTableChange(setTable2, record, prop, value)
  }

  const handleTable1RowChange = (record, prop, value) => {
    baseHandleTableChange(setTable1, record, prop, value)
  }

  const handleTable3RowChange = (record, prop, value) => {
    baseHandleTableChange(setTable3, record, prop, value)
  }

  const handleTable4RowChange = (record, prop, value) => {
    baseHandleTableChange(setTable4, record, prop, value)
  }

  const baseDeleteTableRow = (setter, record) => {
    setter((prevState) => {
      const index = prevState.dataSource.findIndex((item) => item.__index__ === record.__index__)
      return {
        ...prevState,
        dataSource:
          index > -1
            ? [...prevState.dataSource.slice(0, index), ...prevState.dataSource.slice(index + 1)]
            : prevState.dataSource,
      }
    })
  }

  const deleteTable1Row = (record) => {
    baseDeleteTableRow(setTable1, record)
  }

  const deleteTable2Row = (record) => {
    baseDeleteTableRow(setTable2, record)
  }

  const deleteTable3Row = (record) => {
    baseDeleteTableRow(setTable3, record)
  }

  const deleteTable4Row = (record) => {
    baseDeleteTableRow(setTable4, record)
  }

  const copyTable2Row = (row) => {
    setTable2((prevState) => ({
      ...prevState,
      dataSource: [
        ...prevState.dataSource,
        {
          ...row,
          __index__: Math.random().toString(32).slice(-8),
          orderValue: prevState.dataSource.length,
          targetServerId:
            (targetServerList.current.find((s) => s['typeEnName'] === 'YongHongAPIServer')?.servers || []).find(
              (s) => s['dbCnName'] === '正式永洪9.0'
            )?.id || row.targetServerId,
        },
      ],
    }))
  }
  const multiCopy = () => {
    setTable2((prevState) => ({
      ...prevState,
      dataSource: [
        ...prevState.dataSource,
        ...selectedRows.map((row, index) => {
          return {
            ...row,
            __index__: Math.random().toString(32).slice(-8),
            orderValue: prevState.dataSource.length + index,
            targetServerId:
              (targetServerList.current.find((s) => s['typeEnName'] === 'YongHongAPIServer')?.servers || []).find(
                (s) => s['dbCnName'] === '正式永洪9.0'
              )?.id || row.targetServerId,
          }
        }),
      ],
    }))
  }

  const [state, dispatch] = useReducer(
    (state, action) => {
      switch (action.type) {
        case 'changeFileChooseVisible':
          return { ...state, fileChooseVisible: action.payload }
        case 'setSelectedFiles':
          return { ...state, selectedFiles: action.payload }
        case 'setFileTreeData':
          return { ...state, fileTreeData: action.payload }
        default:
          return state
      }
    },
    {},
    () => {
      return {
        fileChooseVisible: false,
        selectedFiles: [],
        fileTreeData: [],
      }
    }
  )

  // 获取所有文件列表
  useEffect(() => {
    axios
      .get('/bi-auto-deploy/api/user/common/getFileTreeNodeByTaskType', {
        params: {
          taskType: 'FileDeploy',
        },
      })
      .then(({ data }) => {
        const _data = walk(data)
        dispatch({
          type: 'setFileTreeData',
          payload: _data,
        })
      })
  }, [])

  const popupFileChoose = () => {
    dispatch({
      type: 'changeFileChooseVisible',
      payload: true,
    })
    dispatch({
      type: 'setSelectedFiles',
      payload: table1.dataSource.map((_) => _.__index__),
    })
  }

  const addFileRecord = (files) => {
    setTable1((prevState) => {
      const dataSource = files.map((file, index) => {
        const old = prevState.dataSource.find((item) => item.__index__ === file)
        if (old) {
          return old
        }
        return {
          __index__: file,
          orderValue: index,
          filePath: file,
          deployPath: file.split('/').slice(0, -1).join('/') + '/',
          deployFileName: file.split('/').slice(-1)[0],
          fileDeployUpdateType: 'Update',
        }
      })
      return {
        ...prevState,
        dataSource,
      }
    })
  }

  const addRowForTable2 = () => {
    setTable2((prevState) => {
      return {
        ...prevState,
        dataSource: [
          ...prevState.dataSource,
          {
            __index__: Math.random().toString(32).slice(-8),
            canRead: true,
            canWrite: false,
            orderValue: prevState.dataSource.length,
          },
        ],
      }
    })
  }

  const addRowForTable3 = () => {
    setTable3((prevState) => {
      return {
        ...prevState,
        dataSource: [
          ...prevState.dataSource,
          {
            __index__: Math.random().toString(32).slice(-8),
            orderValue: prevState.dataSource.length,
          },
        ],
      }
    })
  }

  const addRowForTable4 = () => {
    setTable4((prevState) => {
      return {
        ...prevState,
        dataSource: [
          ...prevState.dataSource,
          {
            __index__: Math.random().toString(32).slice(-8),
            columnLength: 50,
            orderValue: prevState.dataSource.length,
          },
        ],
      }
    })
  }

  const saveForm = () => {
    form.validateFields().then((values) => {
      console.log(values)

      let taskDetails = []
      if (taskType === 'FileDeploy') {
        taskDetails = table1.dataSource.map((item) => {
          const ret = {
            ...item,
          }
          delete ret.__index__
          return ret
        })
      } else if (taskType === 'BIPermission') {
        taskDetails = table2.dataSource.map((item) => {
          const ret = {
            ...item,
            dataSetPath: item.dataSetType
              ? (item.dataSetPath || '').slice(0, item.dataSetPath.length - item.dataSetType.length - 1)
              : item.dataSetPath,
          }
          delete ret.__index__
          return ret
        })
      } else if (taskType === 'DataSynchronism') {
        taskDetails = table3.dataSource.map((item) => {
          const ret = {
            ...item,
          }
          delete ret.__index__
          return ret
        })
      } else if (taskType === 'DataRequirement') {
        taskDetails = table4.dataSource.map((item) => {
          const ret = {
            ...item,
          }
          delete ret.__index__
          return ret
        })
      }

      axios
        .post('/bi-auto-deploy/api/admin/task/saveOrUpdate', {
          id: taskId === 'create' ? null : taskId,
          ...values,
          taskDetails,
        })
        .then(() => {
          message.success('保存成功')
          history.push('/autoDeploy/taskMgmt')
        })
    })
  }

  const [solveFileLoading, setSolveFileLoading] = useState(false)
  const solveFile = (e) => {
    const file = e.target.files[0]
    if (!file) {
      return
    }
    const workbook = new ExcelJs.Workbook()
    const reader = new FileReader()

    reader.readAsArrayBuffer(file)
    reader.onload = async () => {
      const buffer = reader.result
      await workbook.xlsx.load(buffer)
      let jsonData = []
      workbook.worksheets.forEach(function (sheet) {
        // read first row as data keys
        let firstRow = sheet.getRow(1)
        if (!firstRow.cellCount) return
        let keys = firstRow.values
        sheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return
          let values = row.values
          let obj = {}
          for (let i = 1; i < keys.length; i++) {
            obj[keys[i]] = values[i]
          }
          jsonData.push(obj)
        })
      })
      console.log(jsonData)
      e.target.value = ''
    }
  }

  return (
    <div className={'p-6'}>
      <div className={'flex justify-end mb-2.5'}>
        <Space>
          {!readonly.current && (
            <Button type={'primary'} onClick={saveForm}>
              保存
            </Button>
          )}
          {!readonly.current && <Button onClick={() => history.go(-1)}>取消</Button>}
          {readonly.current && <Button onClick={() => history.go(-1)}>返回</Button>}
          {taskType === 'DataRequirement' && <Button onClick={generateSql}>生成sql</Button>}
        </Space>
      </div>
      <Form labelCol={{ span: 3 }} form={form}>
        <Row gutter={24}>
          <Col span={6}>
            <Form.Item name={'taskType'} label={'任务类型'} labelCol={{ span: 4 }}>
              <Select onChange={(v) => setTaskType(v)} disabled={readonly.current}>
                {Object.keys(TASK_TYPE).map((key) => (
                  <Select.Option value={key} key={key} disabled={key === 'DataRequirement'}>
                    {TASK_TYPE[key]}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name={'autoDeploy'} label={'自动部署'} labelCol={{ span: 4 }} valuePropName={'checked'}>
              <Switch disabled={taskType === 'DataRequirement' || readonly.current} />
            </Form.Item>

            {taskType === 'DataRequirement' && (
              <>
                <Form.Item label={'集成类型'} labelCol={{ span: 4 }} name={'integratedType'}>
                  <Select disabled={readonly.current}>
                    <Select.Option value={'ADD_TABLE'}>新增表</Select.Option>
                    <Select.Option value={'ADD_FIELDS'}>新增字段</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item label={'处理状态'} labelCol={{ span: 4 }}>
                  <Select defaultValue={'UNDISPOSED'} disabled>
                    {enumList.current['TaskProcessState'].map((item) => {
                      return (
                        <Select.Option value={item.value} key={item.value}>
                          {item.label}
                        </Select.Option>
                      )
                    })}
                  </Select>
                </Form.Item>
              </>
            )}
          </Col>
          <Col span={12}>
            <Form.Item name={'taskName'} label={'任务名称'} rules={[{ required: true }, { max: 100 }]}>
              <Input maxLength={100} disabled={readonly.current} />
            </Form.Item>
            <Form.Item name={'description'} label={'备注'}>
              <Input.TextArea disabled={readonly.current} maxLength={250} />
            </Form.Item>
            {taskType === 'DataRequirement' && (
              <>
                <Form.Item name={'businessLibrary'} label={'业务库'} rules={[{ required: true }]}>
                  <Input disabled={readonly.current} />
                </Form.Item>
                <Form.Item name={'srcTableName'} label={'源表'} rules={[{ required: true }]}>
                  <Input disabled={readonly.current} />
                </Form.Item>
                <Form.Item name={'srcTableCnName'} label={'源表注释'} rules={[{ required: true }]}>
                  <Input disabled={readonly.current} />
                </Form.Item>
              </>
            )}
          </Col>
          <Col span={12}>
            <Form.Item name={'dwModelAuditBillId'} hidden>
              <Input />
            </Form.Item>
          </Col>
        </Row>
      </Form>

      <div className={'mt-2.5'}>
        {taskType === 'FileDeploy' && (
          <>
            <div className={'mb10'}>
              <Button onClick={popupFileChoose} disabled={readonly.current}>
                新增
              </Button>
            </div>
            <Table {...table1} />
          </>
        )}

        {taskType === 'BIPermission' && (
          <>
            <div className={'mb10 space-x-2.5'}>
              <Button onClick={addRowForTable2} disabled={readonly.current}>
                新增
              </Button>
              {
                <Button disabled={!selectedRows.length || readonly.current} onClick={multiCopy}>
                  复制
                </Button>
              }
              {/*<Button className={'p-0'}>*/}
              {/*  <label htmlFor="import" className={'cursor-pointer'} style={{padding: '4px 15px'}}>*/}
              {/*    导入*/}
              {/*    <input*/}
              {/*      onChange={(e) => solveFile(e)}*/}
              {/*      accept={'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}*/}
              {/*      type={'file'}*/}
              {/*      id={'import'}*/}
              {/*      className={'hidden'}*/}
              {/*    />*/}
              {/*  </label>*/}
              {/*</Button>*/}
            </div>
            <Table {...table2} components={components2} />
          </>
        )}

        {taskType === 'DataSynchronism' && (
          <>
            <div className={'mb10'}>
              <Button onClick={addRowForTable3} disabled={readonly.current}>
                新增
              </Button>
            </div>
            <Table {...table3} />
          </>
        )}

        {taskType === 'DataRequirement' && (
          <>
            <div className={'mb-2.5 space-x-2'}>
              <Button onClick={addRowForTable4} disabled={readonly.current}>
                新增
              </Button>
            </div>
            <Table {...table4} />
          </>
        )}
      </div>
      {recordLogs.length > 0 && (
        <div className={'flex justify-start items-start mt-5'}>
          <div className={'flex-none mr-5'}>日志</div>
          <div>
            <Timeline reverse>
              {recordLogs.map((log) => {
                return (
                  <Timeline.Item key={log.id}>
                    <div>
                      {log?.user?.['nickName']}-{log?.description}
                    </div>
                    <div>{log?.['operationDate']}</div>
                  </Timeline.Item>
                )
              })}
            </Timeline>
          </div>
        </div>
      )}

      <FileChooseModal
        selectedKeys={state.selectedFiles}
        visible={state.fileChooseVisible}
        fileTreeData={state.fileTreeData}
        dispatch={dispatch}
        addFileRecord={addFileRecord}
      />
    </div>
  )
}

export default connect(
  (state) => {
    return {
      userInfo: state.user.userInfo,
    }
  },
  (dispatch) => {
    return {
      setBreadcrumbParams: (payload) => {
        dispatch({ type: 'set_breadcrumb_params', payload })
      },
    }
  }
)(Edit)
