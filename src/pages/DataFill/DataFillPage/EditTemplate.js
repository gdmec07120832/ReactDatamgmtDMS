import React, { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import {Prompt, useHistory, useParams} from 'react-router-dom'
import { useRequest } from 'ahooks'
import {
  Alert,
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Row,
  Select,
  Space, Spin,
  Switch,
  Table,
  Tag,
  TimePicker,
} from 'antd'
import useTable from '../../../hooks/useTable'
import FieldItem from '../../../components/FieldItem'
import { makeStyles } from '@material-ui/core/styles'
import axios from '../../../utils/axios'
import useTarget from './hooks/useTarget'
import useValueType from './hooks/useValueType'
import moment from 'moment'
import isEqual from 'lodash/isEqual'
import DraggableModal from '../../../components/DraggableModal'
import { useForm } from 'antd/es/form/Form'
import CodeMirrorLayer from '../../../components/CodeMirrorLayer'
import useRoleList from '../../../hooks/useRoleList'
import { PlusOutlined } from '@ant-design/icons'
import { Tooltip } from '@material-ui/core'

const MemoTable = React.memo(Table, (prevProps, nextProps) => {
  return isEqual(prevProps.dataSource, nextProps.dataSource)
})

const useStyles = makeStyles({
  fieldWrapper: {
    '& .ant-checkbox-wrapper': {
      lineHeight: '32px',
    },
    '& .ant-switch': {
      margin: '5px 0',
    },
    '& >div': {
      marginBottom: 10,
      '& >span:first-child': {
        textAlign: 'right',
        marginRight: 10,
      },
    },
  },
})

//  eslint-disable-next-line
const SqlEditModal = (props) => {
  const { visible, setVisible, currentRow, onSubmitted } = props
  const [value, setValue] = useState('')

  useEffect(() => {
    if (currentRow) {
      setValue(currentRow.sqlStr)
    }
  }, [visible, currentRow])

  const handleOk = () => {
    onSubmitted?.(value)
    setVisible(false)
  }

  return (
    <DraggableModal
      width={800}
      visible={visible}
      title={'编辑SQL'}
      destroyOnClose={true}
      onOk={handleOk}
      onCancel={() => setVisible(false)}>
      <div className={'mb-2'}>
        临时表表名：<code className={'bg-gray-200 px-1 rounded'}>TEMP_TABLE_NAME#</code> <br />
        例如： <code  className={'bg-gray-200 px-1 rounded'}>select * from TEMP_TABLE_NAME#</code>
      </div>
      <CodeMirrorLayer
        _value={value}
        onChange={(v) => setValue(v)}
        options={{
          mode: 'sql',
          theme: 'darcula',
          lineWrapping: true,
          lineNumbers: true,
          autofocus: true,
        }}
      />
    </DraggableModal>
  )
}

const RuleModal = (props) => {
  const { visible, setVisible, rules, setRules } = props

  const { table, setTable } = useTable({
    dataSource: [],
    rowKey: '__index__',
    pagination: false,
    scroll: { y: 245 },
    columns: [
      {
        title: '名称',
        dataIndex: 'name',
        render: (text, row, index) => {
          return <Input value={row.name} onChange={(e) => handleTableChange(row, index, e.target.value, 'name')} />
        },
      },
      {
        title: '排序',
        dataIndex: 'orderValue',
        render: (text, row, index) => {
          return <InputNumber defaultValue={text} onChange={(v) => handleTableChange(row, index, v, 'orderValue')} />
        },
      },
      {
        title: '验证SQL',
        dataIndex: 'sqlStr',
        render: (text, row, index) => {
          return (
            <Input
              value={row.sqlStr}
              readOnly
              onClick={() => popupSqlEdit(row)}
              onChange={(e) => handleTableChange(row, index, e.target.value, 'sqlStr')}
            />
          )
        },
      },
      {
        title: '操作',
        dataIndex: 'action',
        render: (text, row) => {
          return (
            <>
              <Button
                type={'link'}
                onClick={() => {
                  deleteRow(row)
                }}>
                删除
              </Button>
            </>
          )
        },
      },
    ],
  })

  const [sqlEditVisible, setSqlEditVisible] = useState(false)

  const [currentRuleRow, setCurrentRuleRow] = useState(null)

  const handleTableChange = (record, index, value, prop) => {
    setTable((prevState) => {
      const data = [...prevState.dataSource]
      data[index] = { ...data[index], [prop]: value }
      return { ...prevState, dataSource: data }
    })
  }

  const popupSqlEdit = (row) => {
    setCurrentRuleRow(row)
    setSqlEditVisible(true)
  }

  useEffect(() => {
    if (visible) {
      setTable((prevState) => ({
        ...prevState,
        dataSource: rules.map((item) => {
          return {
            __index__: Math.random().toString(32).slice(-8),
            ...item,
          }
        }),
      }))
    }
  }, [rules, visible, setTable])

  const deleteRow = (row) => {
    setTable((prevState) => {
      const index = prevState.dataSource.indexOf(row)
      let newDataSource = [...prevState.dataSource]
      newDataSource.splice(index, 1)
      return {
        ...prevState,
        dataSource: newDataSource,
      }
    })
  }

  const addRow = () => {
    setTable((prevState) => ({
      ...prevState,
      dataSource: [
        ...prevState.dataSource,
        {
          __index__: Math.random().toString(32).slice(-8),
          name: '',
          sqlStr: '',
          orderValue: 1,
        },
      ],
    }))
  }
  const handleOk = () => {
    setRules(table.dataSource)
    setVisible(false)
  }

  const saveRowSql = (value) => {
    const index = table.dataSource.findIndex((item) => item.__index__ === currentRuleRow.__index__)
    if (index > -1) {
      setTable((prevState) => ({
        ...prevState,
        dataSource: [
          ...prevState.dataSource.slice(0, index),
          {
            ...prevState.dataSource[index],
            sqlStr: value,
          },
          ...prevState.dataSource.slice(index + 1),
        ],
      }))
    }
  }

  return (
    <DraggableModal width={800} visible={visible} title={'校验规则'} onOk={handleOk} onCancel={() => setVisible(false)}>
      <Table {...table} style={{ minHeight: 190 }} />
      <Tooltip title={'添加规则'} enterDelay={1000}>
        <Button type={'dashed'} block onClick={addRow} icon={<PlusOutlined />} className={'text-gray-400'} />
      </Tooltip>

      <SqlEditModal
        visible={sqlEditVisible}
        setVisible={setSqlEditVisible}
        currentRow={currentRuleRow}
        onSubmitted={saveRowSql}
      />
    </DraggableModal>
  )
}

const SyncTempModal = (props) => {
  const { visible, setVisible, targetList, templateId } = props
  const [form] = useForm()
  const { run, loading } = useRequest(
    (params) => {
      return axios.get('/bi-data-reporting/api/user/excel/excelTemplate/batchSyncTemplate', {
        params,
      })
    },
    {
      manual: true,
    }
  )
  const handleOk = () => {
    form.validateFields().then((values) => {
      run({
        ...values,
        templateIds: templateId,
      }).then(() => {
        message.success('操作成功')
        setVisible(false)
      })
    })
  }
  return (
    <DraggableModal
      title={'同步模板'}
      visible={visible}
      width={550}
      okButtonProps={{ loading }}
      onOk={handleOk}
      onCancel={() => setVisible(false)}>
      <Alert
        className={'mb10'}
        message={'如果模板存在于模板系统中，则会覆盖模板的设置。请谨慎使用本功能！'}
        type={'warning'}
      />
      <Form form={form} labelCol={{ span: 5 }} labelAlign={'left'}>
        <Form.Item name={'syncTargetId'} label={'同步目标'} rules={[{ required: true }]}>
          <Select>
            {targetList.map((item) => (
              <Select.Option value={item.id} key={item.id}>
                {item.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name={'createTable'} label={'是否生成表'} rules={[{ required: true }]}>
          <Select>
            <Select.Option value={true}>是</Select.Option>
            <Select.Option value={false}>否</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item shouldUpdate noStyle>
          {
            () => {
              return form.getFieldValue('createTable') &&
                  <div className={'text-red-400'}>
                    你选择了【是否生成表：是】，此功能属于危险操作，请再三确认后执行！！！
                  </div>
            }
          }
        </Form.Item>
      </Form>
    </DraggableModal>
  )
}

function EditTemplate() {
  const [isEdited, setIsEdited] = useState(false)
  const permissionsMap = useSelector((state) => state.user.permissionsMap)
  const classes = useStyles()

  const roleList = useRoleList()
  const targetList = useTarget()
  const valueType = useValueType(() => {
    setTable((prevState) => ({
      ...prevState,
      key: Math.random(),
    }))
  })
  const [cateList, setCateList] = useState([])
  useEffect(() => {
    axios.get('/bi-data-reporting/api/user/excel/excelCategory/queryCategoryLevel').then(({ data }) => {
      setCateList(
        data.map((item) => {
          return {
            label: item['CATEGORYLEVEL'],
            value: item['ID'],
          }
        })
      )
    })
  }, [])

  const { table, setTable } = useTable({
    scroll: { y: 490 },
    pagination: false,
    rowKey: '__index__',
    tableLayout: 'fixed',
    dataSource: [],
    columns: [
      {
        title: '#',
        dataIndex: 'index',
        width: 60,
        render: (text, record, index) => {
          return index + 1
        },
      },
      {
        title: '列名',
        dataIndex: 'excelColumn',
        shouldCellUpdate: (record, prevRecord) => {
          return record.excelColumn !== prevRecord.excelColumn
        },
        render: (text, record, index) => {
          return (
            <Input
              value={record.excelColumn}
              onChange={(e) => handleTableChange(record, index, e.target.value, 'excelColumn')}
              maxLength={50}
              placeholder={'列名'}
            />
          )
        },
      },
      {
        title: '数据库列名',
        dataIndex: 'dbColumn',
        shouldCellUpdate: (record, prevRecord) => {
          return record.dbColumn !== prevRecord.dbColumn
        },
        render: (text, record, index) => {
          return (
            <Input
              value={record.dbColumn}
              onChange={(e) => handleTableChange(record, index, e.target.value, 'dbColumn')}
              maxLength={50}
              placeholder={'数据库列名'}
            />
          )
        },
      },
      {
        title: '列类型',
        dataIndex: 'columnType',
        shouldCellUpdate: (record, prevRecord) => {
          return record.columnType !== prevRecord.columnType
        },
        render(text, record, index) {
          return (
            <Select
              value={record.columnType}
              onChange={(v) => handleTableChange(record, index, v, 'columnType')}
              style={{ width: '100%' }}>
              {valueType.current.map((item) => (
                <Select.Option value={item.value} key={item.value}>
                  {item.label}
                </Select.Option>
              ))}
            </Select>
          )
        },
      },
      {
        title: '是否标识',
        dataIndex: 'identification',
        shouldCellUpdate: (record, prevRecord) => {
          return record.identification !== prevRecord.identification
        },
        render: (text, record, index) => {
          return (
            <Switch
              checked={record.identification}
              onChange={(v) => handleTableChange(record, index, v, 'identification')}
            />
          )
        },
        width: 120,
      },
      {
        title: '是否可为空',
        dataIndex: 'nullable',
        shouldCellUpdate: (record, prevRecord) => {
          return record.nullable !== prevRecord.nullable
        },
        render: (text, record, index) => {
          return <Switch checked={record.nullable} onChange={(v) => handleTableChange(record, index, v, 'nullable')} />
        },
        width: 120,
      },
      {
        title: '长度',
        dataIndex: 'columnLength',
        shouldCellUpdate: (record, prevRecord) => {
          return record.columnLength !== prevRecord.columnLength
        },
        render: (text, record, index) => {
          return (
            <InputNumber
              value={record.columnLength}
              onChange={(v) => handleTableChange(record, index, v, 'columnLength')}
              min={1}
            />
          )
        },
        width: 100,
      },
      {
        title: '排序',
        dataIndex: 'orderValue',
        shouldCellUpdate: () => {
          return true
        },
        render: (text, record, index) => {
          return (
            <InputNumber
              value={record.orderValue}
              onChange={(v) => handleTableChange(record, index, v, 'orderValue')}
            />
          )
        },
        width: 100,
      },
      {
        title: '操作',
        shouldCellUpdate: () => {
          return true
        },
        dataIndex: 'actions',
        fixed: 'right',
        width: 80,
        align: 'center',
        render: (text, record) => {
          return (
            <>
              <Button type={'link'} danger onClick={() => deleteRow(record)}>
                删除
              </Button>
            </>
          )
        },
      },
    ],
    expandable: {
      expandIcon: ({ expanded, onExpand, record }) => {
        return expanded ? (
          <Button type={'link'} size={'small'} onClick={(e) => onExpand(record, e)}>
            收起
          </Button>
        ) : (
          <Button type={'link'} size={'small'} onClick={(e) => onExpand(record, e)}>
            更多
          </Button>
        )
      },
      expandedRowRender: (record, index) => {
        return (
          <>
            <Row gutter={24} className={'mb10'} style={{ width: '95%' }}>
              <Col span={6}>
                <FieldItem label={'时间格式'}>
                  <Input
                    value={record.timeFormat}
                    onChange={(e) => handleTableChange(record, index, e.target.value, 'timeFormat')}
                  />
                </FieldItem>
              </Col>
              <Col span={6}>
                <FieldItem label={'开始时间'}>
                  <DatePicker
                    value={record.startTime}
                    showTime
                    onChange={(v) => handleTableChange(record, index, v, 'startTime')}
                    style={{ flex: 1 }}
                  />
                </FieldItem>
              </Col>
              <Col span={6}>
                <FieldItem label={'结束时间'}>
                  <DatePicker
                    value={record.endTime}
                    showTime
                    onChange={(v) => handleTableChange(record, index, v, 'endTime')}
                    style={{ flex: 1 }}
                  />
                </FieldItem>
              </Col>
            </Row>
            <Row gutter={24} style={{ width: '95%' }}>
              <Col span={6}>
                <FieldItem label={'最小值'}>
                  <Input
                    value={record.minValue}
                    onChange={(e) => handleTableChange(record, index, e.target.value, 'minValue')}
                  />
                </FieldItem>
              </Col>
              <Col span={6}>
                <FieldItem label={'最大值'}>
                  <Input
                    value={record.maxValue}
                    onChange={(e) => handleTableChange(record, index, e.target.value, 'maxValue')}
                  />
                </FieldItem>
              </Col>
              <Col span={6}>
                <FieldItem label={'验证表名'}>
                  <Input
                    value={record.checkTable}
                    onChange={(e) => handleTableChange(record, index, e.target.value, 'checkTable')}
                  />
                </FieldItem>
              </Col>
              <Col span={6}>
                <FieldItem label={'验证字段'}>
                  <Input
                    value={record.checkColumn}
                    onChange={(e) => handleTableChange(record, index, e.target.value, 'checkColumn')}
                  />
                </FieldItem>
              </Col>
            </Row>
          </>
        )
      },
    },
  })

  useEffect(() => {
    if (valueType.current.length) {
      setTable((prevState) => ({ ...prevState }))
    }
  }, [valueType, setTable])

  const handleTableChange = (record, index, value, prop) => {
    setTable((prevState) => {
      const data = [...prevState.dataSource]
      data[index] = { ...data[index], [prop]: value }
      return { ...prevState, dataSource: data }
    })
    setIsEdited(true)
  }

  const deleteRow = (record) => {
    setTable((prevState) => {
      const index = prevState.dataSource.indexOf(record)
      const newRows = prevState.dataSource.slice()
      newRows.splice(index, 1)
      return {
        ...prevState,
        dataSource: newRows,
      }
    })
    setIsEdited(true)
  }

  const addRow = () => {
    setTable((prevState) => ({
      ...prevState,
      dataSource: [
        ...prevState.dataSource,
        {
          __index__: Math.random().toString(36).slice(-8),
          excelColumn: '',
          dbColumn: '',
          columnType: '',
          columnLength: 50,
          nullable: false,
          identification: false,
          startTime: '',
          endTime: '',
          minValue: '',
          maxValue: '',
          timeFormat: 'yyyy-MM-DD HH:mm:ss',
          checkTable: '',
          checkColumn: '',
          orderValue: prevState.dataSource.length + 1,
        },
      ],
    }))
    setIsEdited(true)
  }

  const [params, setParams] = useState({
    id: undefined,
    excelName: '',
    tableName: 'TB_',
    excelExample: '',
    excelStartRow: 2,
    excelSheetIndex: 1,
    orderValue: 1,
    categoryId: '',
    templateDescription: '',
    syncTargetId: '',
    coverAll: false,
    coverOld: true,
    coverAppend: true,
    divided: false,
    dataAudit: false,
    auditorId: '',
    excelAudit: false,
    excelAuditorId: '',
    excelAuditRules: [],
    auditRoleIds: [],
    submitRoleIds: [],
    importFrequency: 'AnyTime',
    frequencyType: 'Daily',
    cutTime: undefined,
    daysOfWeek: undefined,
    daysOfMonth: undefined,
    monthOfYear: undefined,
    tableCreated: false,
    tableCreatedTime: '',
    createrName: '',
    modifierName: '',
    createTime: '',
    updateTime: '',
  })
  const { id: recordId } = useParams()
  const [isNew, setIsNew] = useState(true)
  const [recordData, setRecordData] = useState(null)
  const history = useHistory()
  const historyKey = history.location?.state?.key
  useEffect(() => {
    if (recordId && recordId !== 'create') {
      setIsNew(false)
      axios
        .get('/bi-data-reporting/api/user/excel/excelTemplate/getDetails', {
          params: {
            id: recordId,
          },
        })
        .then(({ data: { excelTemplate, columnList } }) => {
          setRecordData({ excelTemplate, columnList })
          let fillIn = {}
          Object.keys(params).forEach((key) => {
            fillIn[key] = excelTemplate[key]
          })
          fillIn['submitRoleIds'] = (excelTemplate['submitRoleIds'] || []).filter(Boolean).map(Number)
          fillIn['auditRoleIds'] = (excelTemplate['auditRoleIds'] || []).filter(Boolean).map(Number)
          fillIn['cutTime'] = excelTemplate['cutTime'] ? moment(`1970-01-01 ${excelTemplate['cutTime']}`) : null
          fillIn['categoryId'] = excelTemplate['category']?.['id']
          fillIn['syncTargetId'] = excelTemplate['syncTarget']?.['id']
          fillIn['auditorId'] = excelTemplate['auditor']
          setParams((prevState) => {
            return { ...prevState, ...fillIn }
          })
          setTable((prevState) => {
            return {
              ...prevState,
              dataSource: columnList.map((_, index) => {
                return {
                  ..._,
                  startTime: _.startTime ? moment(_.startTime) : '',
                  endTime: _.endTime ? moment(_.endTime) : '',
                  __index__: index,
                }
              }),
            }
          })
        })
    }
    // eslint-disable-next-line
  }, [historyKey, recordId, setTable])

  const [loading, setLoading] = useState(false)
  const saveOrUpdate = () => {
    const colData = table.dataSource.map((item) => {
      const data = {
        ...item,
      }
      delete data.__index__
      return data
    })
    if (!params.submitRoleIds?.length) {
      message.error('填报提交角色不能为空')
      return
    }

    if (params.excelAudit && !params.auditRoleIds?.length) {
      message.error('填报审核角色不能为空')
      return
    }

    let dateValid = true
    if (params.importFrequency === 'Frequency') {
      switch (params.frequencyType) {
        case 'Daily':
          if (!params.cutTime) {
            dateValid = false
          }
          break
        case 'Weekly':
          if (!params.cutTime || !params.daysOfWeek) {
            dateValid = false
          }
          break
        case 'Monthly':
          if (!params.cutTime || !params.daysOfMonth) {
            dateValid = false
          }
          break
        case 'Yearly':
          if (!params.cutTime || !params.daysOfMonth || !params.monthOfYear) {
            dateValid = false
          }
          break
        default:
          dateValid = true
      }
      if (!dateValid) {
        message.error('请完善填报频率配置')
        return
      }
    }

    setLoading(true)
    axios
      .post(
        '/bi-data-reporting/api/admin/excel/excelTemplate/saveOrUpdate',
        {
          ...params,
          cutTime: params.cutTime ? params.cutTime.format('HH:mm:ss') : '',
          columnInfos: colData,
        },
        {}
      )
      .then(({ data }) => {
        setIsEdited(false)
        message.success('保存成功')
        setTimeout(() => {
          history.push(`/dataFill/cfg/templateList/editTemplate/${data.id}`, {
            key: Math.random().toString(32).slice(-8),
          })
        }, 500)
      }).finally(() => {
        setLoading(false)
    })
  }
  const [ruleModalVisible, setRuleModalVisible] = useState(false)

  const handleCreateTable = () => {
    let content
    if (recordData.excelTemplate.tableCreated) {
      content = `确认在数据库【删除旧表和数据】，重新生成【${recordData.excelTemplate.excelName}】对应的表
      【${recordData.excelTemplate.tableName}】吗？`
    } else {
      content = `确认生成【${recordData.excelTemplate.excelName}】对应的表【${recordData.excelTemplate.tableName}】吗?`
    }

    Modal.confirm({
      content,
      title: <span className={'text-red-400'}>危险操作，请再三确认后执行！！！</span>,
      onOk() {
        return axios
          .get('/bi-data-reporting/api/user/excel/excelTemplate/createTable', {
            params: { id: recordData.excelTemplate.id },
          })
          .then(({ data: { tableCreatedTime } }) => {
            message.success('操作成功')
            setParams((prevState) => ({
              ...prevState,
              tableCreated: true,
              tableCreatedTime,
            }))
          })
          .catch(() => {
            return Promise.reject()
          })
      },
    })
  }

  const [syncTempModalVisible, setSyncTempModalVisible] = useState(false)

  const handleSyncTemp = () => {
    setSyncTempModalVisible(true)
  }

  const setRules = (rules) => {
    setParams((prevState) => ({
      ...prevState,
      excelAuditRules: rules,
    }))
  }

  const _setParams = (payload) => {
    setParams(payload)
    setIsEdited(true)
  }
  useEffect(() => {}, [])

  const handleCancel = useCallback(() => {
    history.go(-1)
  }, [history])
  return (
    <div className={'p-6'}>
      <Prompt message="编辑的内容还未保存，确定要离开该页面吗?" when={isEdited} />
      <Spin spinning={loading}>
        <div className={'flex justify-start items-start mb-2.5'}>
          <div style={{ flex: '0 0 30%', marginRight: '3%' }} className={classes.fieldWrapper}>
            <FieldItem label={'模板名称'} required>
              <Input
                value={params.excelName}
                maxLength={30}
                onChange={(e) =>
                  _setParams((prevState) => ({ ...prevState, excelName: e.target.value.replace(/\s/g, '') }))
                }
              />
            </FieldItem>
            <FieldItem label={'数据表名'} required>
              <Input
                value={params.tableName}
                maxLength={50}
                disabled={!isNew}
                onChange={(e) => {
                  const v = (e.target.value || '').replace(/^..?.?/, 'TB_').replace(/[^a-zA-z_\d]/g, '')
                  _setParams((prevState) => ({ ...prevState, tableName: v }))
                }}
              />
            </FieldItem>
            <FieldItem label={'Sheet索引'}>
              <InputNumber
                value={params.excelSheetIndex}
                onChange={(value) =>
                  _setParams((prevState) => ({
                    ...prevState,
                    excelSheetIndex: value,
                  }))
                }
                style={{ flex: 1 }}
              />
            </FieldItem>
            <FieldItem label={'Excel起始行'}>
              <InputNumber
                value={params.excelStartRow}
                onChange={(value) => _setParams((prevState) => ({ ...prevState, excelStartRow: value }))}
                style={{ flex: 1 }}
              />
            </FieldItem>
            <FieldItem label={'Excel样例'}>
              <Input
                value={params.excelExample}
                onChange={(e) => _setParams((prevState) => ({ ...prevState, excelExample: e.target.value }))}
              />
            </FieldItem>
            <FieldItem label={'分类'} required>
              <Select
                style={{ flex: 1 }}
                showSearch
                allowClear
                value={params.categoryId}
                onChange={(v) => _setParams((prevState) => ({ ...prevState, categoryId: v }))}
                filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}>
                {cateList.map((item) => (
                  <Select.Option value={item.value} key={item.value}>
                    {item.label}
                  </Select.Option>
                ))}
              </Select>
            </FieldItem>
            <FieldItem label={'应用描述'}>
              <Input
                value={params.templateDescription}
                onChange={(e) => _setParams((prevState) => ({ ...prevState, templateDescription: e.target.value }))}
              />
            </FieldItem>
            <FieldItem label={'排序'}>
              <InputNumber
                value={params.orderValue}
                onChange={(value) => _setParams((prevState) => ({ ...prevState, orderValue: value }))}
                style={{ flex: 1 }}
              />
            </FieldItem>
            <FieldItem label={'同步目标'} required>
              <Select
                value={params.syncTargetId}
                style={{ flex: 1 }}
                allowClear
                onChange={(v) => _setParams((prevState) => ({ ...prevState, syncTargetId: v }))}
                filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}>
                {targetList.map((item) => (
                  <Select.Option value={item.id} key={item.id}>
                    {item.name}
                  </Select.Option>
                ))}
              </Select>
            </FieldItem>
          </div>
          <div style={{ flex: '0 0 350px', marginRight: '2%' }} className={classes.fieldWrapper}>
            <FieldItem label={'支持全量导入'} labelWidth={100}>
              <Switch
                checked={params.coverAll}
                onChange={(v) => _setParams((prevState) => ({ ...prevState, coverAll: v }))}
              />
            </FieldItem>
            <FieldItem label={'支持覆盖导入'} labelWidth={100}>
              <Switch
                checked={params.coverOld}
                onChange={(v) => _setParams((prevState) => ({ ...prevState, coverOld: v }))}
              />
            </FieldItem>
            <FieldItem label={'支持追加导入'} labelWidth={100}>
              <Switch
                checked={params.coverAppend}
                onChange={(v) => _setParams((prevState) => ({ ...prevState, coverAppend: v }))}
              />
            </FieldItem>
            <FieldItem label={'启用分列导入'} labelWidth={100}>
              <Switch
                checked={params.divided}
                onChange={(v) => _setParams((prevState) => ({ ...prevState, divided: v }))}
              />
            </FieldItem>
            <FieldItem label={'启用填报审核'} labelWidth={100}>
              <Switch
                checked={params.excelAudit}
                onChange={(v) => _setParams((prevState) => ({ ...prevState, excelAudit: v }))}
              />
              {params.excelAudit && (
                <Select
                  mode={'multiple'}
                  placeholder={'选择填报审核角色'}
                  style={{ width: 180, marginLeft: 8 }}
                  value={params.auditRoleIds}
                  onChange={(v) => _setParams((prevState) => ({ ...prevState, auditRoleIds: v }))}
                  filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}>
                  {roleList.map((role) => (
                    <Select.Option value={role.idRole} key={role.idRole}>
                      {role.roleName}
                    </Select.Option>
                  ))}
                </Select>
              )}
            </FieldItem>

            <FieldItem label={'填报提交角色'} labelWidth={100} required>
              <Select
                style={{ flex: '0 0 232px', width: 232 }}
                mode={'multiple'}
                placeholder={'选择填报提交角色'}
                value={params.submitRoleIds}
                showSearch
                onChange={(v) => _setParams((prevState) => ({ ...prevState, submitRoleIds: v }))}
                filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}>
                {roleList.map((role) => (
                  <Select.Option value={role.idRole} key={role.idRole}>
                    {role.roleName}
                  </Select.Option>
                ))}
              </Select>
            </FieldItem>

            <FieldItem label={'填报校验规则'} labelWidth={100}>
              <Button size={'middle'} type={'secondary'} style={{ width: 232 }} onClick={() => setRuleModalVisible(true)}>
                编辑/查看规则 {params.excelAuditRules.length ? `(${params.excelAuditRules.length})` : ''}
              </Button>
            </FieldItem>
            <FieldItem label={'填报频率配置'} labelWidth={100}>
              <Radio.Group
                value={params.importFrequency}
                onChange={(e) => _setParams((prevState) => ({ ...prevState, importFrequency: e.target.value }))}>
                <Radio value={'AnyTime'} style={{ lineHeight: '32px' }}>
                  按需
                </Radio>
                <Radio value={'Frequency'} style={{ lineHeight: '32px' }}>
                  按周期
                </Radio>
              </Radio.Group>
            </FieldItem>
            {params.importFrequency === 'Frequency' && (
              <FieldItem label={''} labelWidth={100}>
                <div>
                  <Radio.Group
                    value={params.frequencyType}
                    onChange={(e) => _setParams((prevState) => ({ ...prevState, frequencyType: e.target.value }))}>
                    <Radio.Button value={'Daily'}>每天</Radio.Button>
                    <Radio.Button value={'Weekly'}>每周</Radio.Button>
                    <Radio.Button value={'Monthly'}>每月</Radio.Button>
                    <Radio.Button value={'Yearly'}>每年</Radio.Button>
                  </Radio.Group>

                  {params.frequencyType === 'Yearly' && (
                    <div className={'flex justify-start leading-8 mt-2'}>
                      <span className={'mr-2'}>
                        <span className={'text-red-600'}>*</span> 月份
                      </span>
                      <Select
                        className={'flex-1'}
                        value={params.monthOfYear}
                        onChange={(v) => _setParams((prevState) => ({ ...prevState, monthOfYear: v }))}>
                        {Array.from({ length: 12 }, (_, index) => {
                          return (
                            <Select.Option key={index} value={index + 1}>
                              {index + 1}月
                            </Select.Option>
                          )
                        })}
                      </Select>
                    </div>
                  )}
                  {['Yearly', 'Monthly'].includes(params.frequencyType) && (
                    <div className={'flex justify-start leading-8 mt-2'}>
                      <span className={'mr-2'}>
                        <span className={'text-red-600'}>*</span> 日期
                      </span>
                      <Select
                        className={'flex-1'}
                        value={params.daysOfMonth}
                        onChange={(v) => _setParams((prevState) => ({ ...prevState, daysOfMonth: v }))}>
                        {Array.from({ length: 31 }, (_, index) => {
                          return (
                            <Select.Option key={index} value={index + 1}>
                              {index + 1}号
                            </Select.Option>
                          )
                        })}
                      </Select>
                    </div>
                  )}
                  {params.frequencyType === 'Weekly' && (
                    <div className={'flex justify-start leading-8 mt-2'}>
                      <span className={'mr-2'}>
                        <span className={'text-red-600'}>*</span> 星期
                      </span>
                      <Select
                        className={'flex-1'}
                        value={params.daysOfWeek}
                        onChange={(v) => _setParams((prevState) => ({ ...prevState, daysOfWeek: v }))}>
                        <Select.Option value={1}>一</Select.Option>
                        <Select.Option value={2}>二</Select.Option>
                        <Select.Option value={3}>三</Select.Option>
                        <Select.Option value={4}>四</Select.Option>
                        <Select.Option value={5}>五</Select.Option>
                        <Select.Option value={6}>六</Select.Option>
                        <Select.Option value={7}>日</Select.Option>
                      </Select>
                    </div>
                  )}
                  <div className={'flex justify-start leading-8 mt-2'}>
                    <span className={'mr-2'}>
                      <span className={'text-red-600'}>*</span> 时间
                    </span>
                    <TimePicker
                      value={params.cutTime}
                      onChange={(v) => _setParams((prevState) => ({ ...prevState, cutTime: v }))}
                      className={'flex-1'}
                      placeholder={''}
                    />
                  </div>
                </div>
              </FieldItem>
            )}
          </div>
          <div style={{ flex: '0 0 30%' }} className={classes.fieldWrapper}>
            {!isNew && (
              <>
                <FieldItem label={'是否已生成表'} labelWidth={100}>
                  <Tag>{params.tableCreated ? '是' : '否'}</Tag>
                </FieldItem>
                {params.tableCreated && (
                  <FieldItem label={'生成表的时间'} labelWidth={100}>
                    <Input disabled value={params.tableCreatedTime} />
                  </FieldItem>
                )}

                <FieldItem label={'创建人'} labelWidth={100}>
                  <Input disabled value={params.createrName} />
                </FieldItem>
                <FieldItem label={'创建时间'} labelWidth={100}>
                  <Input disabled value={params.createTime} />
                </FieldItem>
                <FieldItem label={'更新人'} labelWidth={100}>
                  <Input disabled value={params.modifierName} />
                </FieldItem>
                <FieldItem label={'更新时间'} labelWidth={100}>
                  <Input disabled value={params.updateTime} />
                </FieldItem>
              </>
            )}
          </div>
        </div>
        <div className={'mb10'}>
          <Button type={'primary'} onClick={addRow}>
            新增列
          </Button>
        </div>
        <MemoTable {...table} />
        <RuleModal
          rules={params.excelAuditRules}
          setRules={setRules}
          visible={ruleModalVisible}
          setVisible={setRuleModalVisible}
        />
        <SyncTempModal
          visible={syncTempModalVisible}
          targetList={targetList}
          templateId={recordData?.excelTemplate?.id}
          setVisible={setSyncTempModalVisible}
        />
        <div className={'flex justify-center mt-5'}>
          <Space>
            <Button onClick={handleCancel}>取消</Button>
            {permissionsMap['bi-data-reporting.ExcelTemplateController.saveOrUpdate'] && (
              <Button type={'primary'} onClick={saveOrUpdate}>
                保存
              </Button>
            )}
            {!isNew && permissionsMap['bi-data-reporting.ExcelTemplateController.saveOrUpdate'] && (
              <Button danger onClick={handleCreateTable}>
                生成表
              </Button>
            )}
            {!isNew && permissionsMap['bi-data-reporting.ExcelTemplateController.saveOrUpdate'] && (
              <Button type={'primary'} onClick={handleSyncTemp}>
                同步模板
              </Button>
            )}
          </Space>
        </div>
      </Spin>
    </div>
  )
}

export default EditTemplate
