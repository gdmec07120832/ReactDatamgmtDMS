import React, { useEffect, useRef, useState } from 'react'
import { connect, useSelector } from 'react-redux'
import {
  Alert,
  Button,
  Col,
  Empty,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
} from 'antd'
import useTable from '../../../hooks/useTable'
import { useHistory, useLocation, useParams } from 'react-router-dom'
import numeral from 'numeral'
import axios from '../../../utils/axios'
import { useRequest } from 'ahooks'
import OverflowTooltip from '../../../components/OverflowTooltip'
import DraggableModal from '../../../components/DraggableModal'
import FieldItem from '../../../components/FieldItem'
import { useForm } from 'antd/es/form/Form'
import useTarget from './hooks/useTarget'
import { ImportFileDetail } from './importFileDetail'
import { Tooltip } from '@material-ui/core'
import moment from 'moment'
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { getBrowserVersion } from '../../../utils/helpers'

const browserVersion = getBrowserVersion()

const importStatusList = {
  Imported: '已导入',
  NotImported: '未导入',
  ReImported: '已重新导入',
  RemoveImported: '已删除导入数据',
}

// 查看临时表数据
const CheckTempTableDataModal = (props) => {
  const { visible, setVisible, currentRow } = props
  return (
    <DraggableModal
      width={'70vw'}
      visible={visible}
      destroyOnClose
      footer={null}
      onCancel={() => setVisible(false)}
      title={`【${currentRow?.name}】临时表数据`}>
      <ImportFileDetail fileId={currentRow?.id} forTempTable={true} />
    </DraggableModal>
  )
}

// 提交填报审核
const FillAuditRequestModal = (props) => {
  const permissionsMap = useSelector((state) => state.user.permissionsMap)
  const { visible, setVisible, currentRow, onSubmitted, excelTemplate } = props
  const [loading, setLoading] = useState(false)
  const [form] = useForm()
  useEffect(() => {
    if (visible) {
      form.resetFields()
    }
  }, [form, visible])
  const handleOk = () => {
    form.validateFields().then((values) => {
      setLoading(true)
      axios
        .get('/bi-data-reporting/api/user/excel/excelAudit/submitAudit', {
          params: {
            ...values,
            recordId: currentRow.id,
          },
        })
        .then(() => {
          message.success('提交成功')
          setVisible(false)
          onSubmitted()
        })
        .finally(() => {
          setLoading(false)
        })
    })
  }
  return (
    <DraggableModal
      visible={visible}
      destroyOnClose
      onOk={handleOk}
      okButtonProps={{ loading }}
      onCancel={() => setVisible(false)}
      title={'提交审核'}>
      <Alert
        message={
          <p>
            由于管理员把本模板设置成需要审核才能把数据插入到数据库中，因此，是否需要提交审核？待审核人员审核通过后才会直接插入数据
          </p>
        }
      />
      <Form form={form} initialValues={{}} className={'mt20'} labelCol={{ span: 4 }}>
        <Form.Item label={'导入方式'} name={'importWay'} rules={[{ required: true }]}>
          <Select>
            <Select.Option
              value={'CoverAll'}
              disabled={
                !excelTemplate.coverAll ||
                !permissionsMap['bi-data-reporting.ExcelImportRecordController.coverAllImportData']
              }>
              全量
            </Select.Option>
            <Select.Option
              value={'CoverOld'}
              disabled={
                !excelTemplate.coverOld ||
                !permissionsMap['bi-data-reporting.ExcelImportRecordController.coverOldImportData']
              }>
              覆盖
            </Select.Option>
            <Select.Option
              value={'CoverAppend'}
              disabled={
                !excelTemplate.coverAppend ||
                !permissionsMap['bi-data-reporting.ExcelImportRecordController.coverAppendImportData']
              }>
              增量
            </Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label={'描述'} name={'description'}>
          <Input />
        </Form.Item>
      </Form>
    </DraggableModal>
  )
}

// 数据校验
const CheckDataValid = (props) => {
  const { rules, setRules, recordId, setCurrentCheckRule, setCheckDataValidResultVisible, resultCheckRef, checkType } =
    props
  const _rules = useRef([])
  rules.forEach((rule) => {
    const { id } = rule
    const cachedResult = sessionStorage.getItem(`ruleResult-${recordId}-${id}-${checkType}`)
    if (cachedResult) {
      rule.cachedResult = JSON.parse(cachedResult)
    } else {
      rule.cachedResult = undefined
    }
  })
  const findIndex = (ruleId) => {
    return _rules.current.findIndex((_) => _.id === ruleId)
  }

  const runAllRule = () => {
    message.info('已开始运行，请注意检查运行结果')
    rules.forEach((rule) => {
      runRule(rule, true)
    })
  }

  const runRule = (rule, silent) => {
    const { id } = rule
    setTable((prevState) => {
      const index = findIndex(id)
      if (index === -1) {
        return { ...prevState }
      }
      return {
        ...prevState,
        dataSource: [
          ...prevState.dataSource.slice(0, index),
          {
            ...prevState.dataSource[index],
            loading: true,
          },
          ...prevState.dataSource.slice(index + 1),
        ],
      }
    })
    axios
      .get('/bi-data-reporting/api/user/excel/excelAudit/runAuditRule', {
        params: {
          id,
          recordId,
        },
      })
      .then(({ data }) => {
        if (!silent) {
          message.success('SQL运行完毕')
        }
        const cachedResult = {
          timestamp: Date.now(),
          result: data,
        }
        setTable((prevState) => {
          const index = findIndex(id)
          return {
            ...prevState,
            dataSource: [
              ...prevState.dataSource.slice(0, index),
              {
                ...prevState.dataSource[index],
                cachedResult,
                loading: false,
              },
              ...prevState.dataSource.slice(index + 1),
            ],
          }
        })

        sessionStorage.setItem(`ruleResult-${recordId}-${id}-${checkType}`, JSON.stringify(cachedResult))
      })
      .finally(() => {
        setTable((prevState) => {
          const index = findIndex(id)
          return {
            ...prevState,
            dataSource: [
              ...prevState.dataSource.slice(0, index),
              {
                ...prevState.dataSource[index],
                loading: false,
              },
              ...prevState.dataSource.slice(index + 1),
            ],
          }
        })
      })
  }

  const setRuleChecked = (rule) => {
    setTable((prev) => {
      const index = prev.dataSource.findIndex((item) => item.id === rule.id)
      if (index > -1) {
        const result = {
          ...prev,
          dataSource: [
            ...prev.dataSource.slice(0, index),
            {
              ...prev.dataSource[index],
              hasViewed: true,
            },
            ...prev.dataSource.slice(index + 1),
          ],
        }
        resultCheckRef.current = result.dataSource
        if (setRules) {
          setTimeout(() => {
            setRules(result.dataSource)
          }, 100)
        }
        return result
      } else {
        return prev
      }
    })
  }
  const checkResult = (rule) => {
    setRuleChecked(rule)
    setCurrentCheckRule(rule)
    setCheckDataValidResultVisible(true)
  }
  const { table, setTable } = useTable({
    rowKey: 'id',
    dataSource: [],
    pagination: false,
    columns: [
      {
        title: '规则ID',
        dataIndex: 'id',
        render: (text, row) => {
          return (
            <span>
              {row.hasViewed && (
                <Tooltip title={'已查看此条规则的校验结果'} placement={'top'}>
                  <CheckCircleOutlined className={'mr-1'} style={{ color: 'var(--primary-color)' }} />
                </Tooltip>
              )}
              {text}
            </span>
          )
        },
        width: 100,
      },
      {
        title: '规则名称',
        dataIndex: 'name',
        render: (text) => {
          return <OverflowTooltip>{text}</OverflowTooltip>
        },
      },
      {
        title: 'SQL',
        dataIndex: 'sqlStr',
        render: (text) => {
          return <OverflowTooltip>{text}</OverflowTooltip>
        },
      },
      {
        title: '操作',
        dataIndex: 'actions',
        width: 160,
        render: (text, record) => {
          return (
            <Space>
              <Button size={'small'} type={'link'} onClick={() => runRule(record)} loading={record.loading}>
                运行
              </Button>
              {record.cachedResult && !record.loading && (
                <Tooltip
                  title={`结果产生于：${moment(record.cachedResult.timestamp).format('YYYY-MM-DD HH:mm:ss')}`}
                  placement={'top'}>
                  <Button size={'small'} type={'link'} onClick={() => checkResult(record)}>
                    查看结果
                  </Button>
                </Tooltip>
              )}
            </Space>
          )
        },
      },
    ],
  })

  useEffect(() => {
    _rules.current = rules
    setTable((prevState) => ({
      ...prevState,
      dataSource: rules,
    }))
  }, [rules, setTable])

  const hasResultRule = table.dataSource.filter((r) => r.cachedResult)
  const [resultCheckActiveKey, setResultCheckActiveKey] = useState(null)

  useEffect(() => {
    const tabs = table.dataSource.filter((r) => r.cachedResult)
    if (tabs.length) {
      setTimeout(() => {
        setResultCheckActiveKey((prev) => {
          return prev ? prev : tabs[0].id
        })
      }, 100)
    }
  }, [table.dataSource, resultCheckActiveKey])

  const tabClick = (key) => {
    setResultCheckActiveKey(key)
  }

  const { table: resultTable, setTable: setResultTable } = useTable({
    rowKey: (record) => {
      return JSON.stringify(record)
    },
    scroll: { y: 240 },
    dataSource: [],
    pagination: false,
    columns: [],
  })

  useEffect(() => {
    let dataSource = []
    let ruleResult = sessionStorage.getItem(`ruleResult-${recordId}-${resultCheckActiveKey}-${checkType}`)
    if (ruleResult) {
      dataSource = JSON.parse(ruleResult).result
    }
    setResultTable((prevState) => ({
      ...prevState,
      dataSource: dataSource || [],
      columns: Object.keys(dataSource?.[0] || {}).map((key) => {
        return {
          dataIndex: key,
          title: key,
        }
      }),
    }))
  }, [resultCheckActiveKey, setResultTable, recordId, checkType])

  useEffect(() => {
    if (resultCheckActiveKey) {
      const rule = _rules.current.find((item) => item.id === resultCheckActiveKey)
      setRuleChecked(rule)
    }
    // eslint-disable-next-line
  }, [resultCheckActiveKey])

  return (
    <>
      <div className={'mb-4 flex justify-between'}>
        <div>
          <span className={'font-medium text-base'}>规则列表</span>
          <span>
            （必须运行 <b>所有规则</b> 且 <b>查看结果</b> 后才能进行下一步操作）
          </span>
        </div>

        <Button onClick={runAllRule}>运行全部</Button>
      </div>
      <Table {...table} />
      <div style={{ minHeight: 100, borderTop: '4px solid #5493fa', background: '#fafafa', marginTop: 20 }}>
        <div className={'leading-4 px-4 pt-4 text-base'}>规则校验结果查看</div>
        <Tabs className={'px-4'} activeKey={resultCheckActiveKey} onTabClick={tabClick}>
          {hasResultRule.map((r) => (
            <Tabs.TabPane tab={r.name} key={r.id} />
          ))}
        </Tabs>
        <div className={'px-4'}>
          <Table {...resultTable} />
        </div>
      </div>
    </>
  )
}

// 查看数据校验结果
const CheckDataValidResult = (props) => {
  const { visible, setVisible, recordId, currentCheckRule, checkType } = props
  const id = currentCheckRule?.id
  const { table, setTable } = useTable({
    scroll: { y: 300, x: 800 },
    rowKey: (record) => {
      return String(record)
    },
    dataSource: [],
    pagination: false,
    columns: [],
  })
  useEffect(() => {
    if (visible) {
      let dataSource = []
      let ruleResult = sessionStorage.getItem(`ruleResult-${recordId}-${id}-${checkType}`)
      if (ruleResult) {
        dataSource = JSON.parse(ruleResult).result
      }
      setTable((prevState) => ({
        ...prevState,
        dataSource: dataSource || [],
        columns: Object.keys(dataSource?.[0] || {}).map((key) => {
          return {
            dataIndex: key,
            title: key,
          }
        }),
      }))
    }
  }, [visible, id, recordId, setTable, checkType])

  return (
    <DraggableModal
      visible={visible}
      title={'规则运行结果查看'}
      destroyOnClose
      footer={[
        <Button key={'close'} onClick={() => setVisible(false)}>
          关闭
        </Button>,
      ]}
      onCancel={() => setVisible(false)}>
      {table.dataSource?.length ? (
        <Table {...table} />
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={'结果为空，请检查配置的SQL是否正确'} />
      )}
    </DraggableModal>
  )
}

// 发起提交审核 需先校验
const FillAuditModal = (props) => {
  const {
    visible,
    setVisible,
    rules,
    setRules,
    recordId,
    popupSubmit,
    commonSubmit,
    currentModalRow,
    setCurrentCheckRule,
    setCheckDataValidResultVisible,
  } = props
  const okText = { 1: '覆盖', 2: '增量', 3: '全量' }[currentModalRow?.auditType] || '提交审核'
  const handleOK = () => {
    if (currentModalRow.auditType) {
      commonSubmit()
    } else {
      popupSubmit()
    }
  }
  const resultCheckedRef = useRef([])
  const [okButtonDisabled, setOkButtonDisabled] = useState(true)
  useEffect(() => {
    if (visible) {
      resultCheckedRef.current = rules
    } else {
      resultCheckedRef.current = []
      setTimeout(() => {
        setRules((prev) => {
          return prev.map((item) => {
            return {
              ...item,
              hasViewed: false,
            }
          })
        })
      }, 200)
    }
    const ret = resultCheckedRef.current.some((rule) => !rule.hasViewed)
    setOkButtonDisabled(ret)
  }, [rules, visible, setRules])

  useEffect(() => {
    const ret = resultCheckedRef.current.some((rule) => !rule.hasViewed)
    setOkButtonDisabled(ret)
  }, [rules])

  return (
    <DraggableModal
      width={960}
      okButtonProps={{ disabled: okButtonDisabled }}
      okText={okText}
      title={'数据校验'}
      onOk={() => handleOK()}
      visible={visible}
      destroyOnClose
      onCancel={() => setVisible(false)}>
      <CheckDataValid
        checkType={'submit'}
        resultCheckRef={resultCheckedRef}
        rules={rules}
        setRules={setRules}
        recordId={recordId}
        setCheckDataValidResultVisible={setCheckDataValidResultVisible}
        setCurrentCheckRule={setCurrentCheckRule}
      />
    </DraggableModal>
  )
}

// 生成临时表
const GenerateTempModal = (props) => {
  const { visible, setVisible, currentRow, onSubmitted } = props
  const [loading, setLoading] = useState(false)
  const handleOk = () => {
    setLoading(true)
    axios
      .get('/bi-data-reporting/api/user/excel/excelTemplate/createTemporaryTable', {
        params: {
          id: currentRow.id,
        },
      })
      .then(() => {
        message.success('操作成功')
        setVisible(false)
        setTimeout(() => {
          onSubmitted()
        }, 0)
      })
      .finally(() => {
        setLoading(false)
      })
  }
  return (
    <DraggableModal
      visible={visible}
      onCancel={() => setVisible(false)}
      okButtonProps={{ loading }}
      onOk={handleOk}
      title={'生成临时表'}
      maskClosable={false}>
      <p>文件名：{currentRow?.name} </p>
      <p>点击下方【确定】按钮，开始生成临时表</p>
      <p>导入数据数据量的不同会出现耗时不一致，请耐心等候</p>
    </DraggableModal>
  )
}

// 全表同步
const SyncAllModal = (props) => {
  const { visible, setVisible, templateId } = props
  const targetList = useTarget()
  const [form] = useForm()
  const handleOk = () => {
    form.validateFields().then((values) => {
      axios
        .get('/bi-data-reporting/api/admin/excel/excelImportRecord/syncAllImportedExcel', {
          params: {
            ...values,
            templateId,
          },
        })
        .then(() => {
          message.success('操作成功')
          setVisible(false)
        })
    })
  }
  return (
    <DraggableModal visible={visible} title={'全表同步'} onOk={handleOk} onCancel={() => setVisible(false)}>
      <Alert
        className={'mb-4'}
        showIcon
        type={'warning'}
        message={
          '全表同步会按插入顺序【增量】插入到目标系统中；如果选择同步模板数据，则会在同步Excel文件前，先把模板数据同步到目标系统中，后执行生成表的操作，所以此时会把目标系统中【清空数据】,请谨慎使用!!'
        }
      />
      <Form form={form}>
        <Form.Item label={'同步目标'} name={'syncTargetId'} rules={[{ required: true }]}>
          <Select>
            {targetList.map((_) => (
              <Select.Option value={_.id} key={_.id}>
                {_.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label={'是否同步模板数据'} name={'syncTemplateData'} rules={[{ required: true }]}>
          <Select>
            <Select.Option value={true}>是</Select.Option>
            <Select.Option value={false}>否</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </DraggableModal>
  )
}

// 数据同步
const SyncDataModal = (props) => {
  const [loading, setLoading] = useState(false)
  const permissionsMap = useSelector((state) => state.user.permissionsMap)
  const { visible, setVisible, syncDataRecord, excelTemplate } = props
  const [importWay, setImportWay] = useState(undefined)

  const handleOk = () => {
    if (!importWay) {
      message.error('请选择数据导入类型')
    }
    setLoading(true)
    axios
      .get('/bi-data-reporting/api/admin/excel/excelImportRecord/syncData', {
        params: {
          id: syncDataRecord.id,
          importWay,
        },
      })
      .then(() => {
        message.success('操作成功')
        setVisible(false)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const close = () => {
    if (loading) {
      return
    }
    setVisible(false)
    setImportWay(undefined)
  }

  return (
    <DraggableModal
      visible={visible}
      title={'同步数据'}
      maskClosable={!loading}
      onOk={handleOk}
      okButtonProps={{
        loading: loading,
      }}
      cancelButtonProps={{ loading: loading }}
      onCancel={close}>
      <p>增量：把Excel中的数据全量导入，并更新相同数据</p>
      <p>覆盖：把Excel中的数据部分导入，并更新相同数据，不同数据不导入</p>
      <p>全量：先清空表中所有数据，然后把Excel中的文件全量导入</p>
      <FieldItem label={'数据导入类型'} required labelWidth={90}>
        <Select value={importWay} onChange={(v) => setImportWay(v)} style={{ flex: 1 }}>
          <Select.Option
            value={'CoverAppend'}
            disabled={
              !excelTemplate.coverAppend ||
              !permissionsMap['bi-data-reporting.ExcelImportRecordController.coverAppendImportData']
            }>
            增量
          </Select.Option>
          <Select.Option
            value={'CoverOld'}
            disabled={
              !excelTemplate.coverOld ||
              !permissionsMap['bi-data-reporting.ExcelImportRecordController.coverOldImportData']
            }>
            覆盖
          </Select.Option>
          <Select.Option
            value={'CoverAll'}
            disabled={
              !excelTemplate.coverAll ||
              !permissionsMap['bi-data-reporting.ExcelImportRecordController.coverAllImportData']
            }>
            全量
          </Select.Option>
        </Select>
      </FieldItem>
    </DraggableModal>
  )
}

function ImportRecord(props) {
  const location = useLocation()
  const pollingTimer = useRef(null)
  const { setBreadcrumbParams, permissionsMap } = props
  const { id } = useParams()
  const excelTemplateRef = useRef({})
  const excelAudit = useRef(false)
  const [pageLoading, setPageLoading] = useState(false)
  const [query, setQuery] = useState({
    name: '',
    importState: undefined,
  })

  const { table, setTable } = useTable({
    rowKey: 'id',
    tableLayout: 'fixed',
    scroll: { x: 1800 },
    dataSource: [],
    columns: [
      { title: 'ID', dataIndex: 'id', width: 80, align: 'center' },
      {
        title: '文件名',
        dataIndex: 'name',
        render: (text, record) => {
          return (
            <a href={axios.defaults.baseURL + record.filePath} download={text}>
              <div className={'break-all'}>{text}</div>
            </a>
          )
        },
      },
      {
        title: '文件大小',
        dataIndex: 'fileSize',
        width: 100,
        render: (text) => {
          return numeral(text).format('0.00b')
        },
      },
      { title: '上传用户', dataIndex: 'uploadUserName', width: 80 },
      {
        title: '导入方式',
        dataIndex: 'importWay',
        width: 80,
        render: (text) => {
          return { CoverAll: '全量', CoverAppend: '增量', CoverOld: '覆盖' }[text]
        },
      },
      { title: '导入用户', dataIndex: 'importUserName', width: 80 },
      { title: '导入次数', dataIndex: 'importNum', width: 80 },
      { title: '导入行数', dataIndex: 'lineNum', width: 80 },
      {
        title: '状态',
        width: 160,
        dataIndex: 'mergeStatus',
        render(text, record) {
          const { importState, errorMsg } = record
          return (
            <div className={'flex'}>
              <OverflowTooltip className={'flex-1'}>{text}</OverflowTooltip>
              <div className={'flex-grow-0'}>
                {importState === 'TempTableImportFailed' && errorMsg && (
                  <Tooltip title={errorMsg}>
                    <ExclamationCircleOutlined className={'text-red-500'} />
                  </Tooltip>
                )}
              </div>
            </div>
          )
        },
      },
      { title: '创建时间', dataIndex: 'createTime', width: 160 },
      { title: '更新时间', dataIndex: 'updateTime', width: 160 },
      {
        title: '操作',
        dataIndex: 'actions',
        render: (text, record) => {
          const { importState, stateCode, existsTempTable, importNum } = record
          const { excelAuditRules } = excelTemplateRef.current
          return !excelTemplateRef.current.id ? null : (
            <Space>
              {!excelAudit.current && ['Imported', 'ReImported'].includes(importState) && (
                <Button
                  type={'link'}
                  size={'small'}
                  onClick={() => {
                    checkRow(record)
                  }}>
                  查看数据
                </Button>
              )}
              {permissionsMap['bi-data-reporting.ExcelImportRecordController.remove'] &&
                ['Imported', 'ReImported'].includes(importState) && (
                  <Popconfirm
                    title={
                      <div style={{ maxWidth: 340 }}>
                        确认删除【{record.id}】【{record.name}】导入过的数据吗？
                      </div>
                    }
                    onConfirm={() => handleActions(record, 90)}>
                    <Button type={'link'} danger size={'small'}>
                      删除数据
                    </Button>
                  </Popconfirm>
                )}
              {excelAudit.current &&
                ['Approved'].includes(stateCode) &&
                ['Imported', 'ReImported'].includes(importState) && (
                  <Button
                    type={'link'}
                    size={'small'}
                    onClick={() => {
                      checkRow(record)
                    }}>
                    查看数据
                  </Button>
                )}
              {((excelAudit.current &&
                ['WaitingSubmitAudit', 'WaitingAudit', 'AuditNotThrough', 'Approved'].includes(stateCode)) ||
                !excelAudit.current) &&
                existsTempTable && (
                  <Button
                    type={'link'}
                    size={'small'}
                    onClick={() => {
                      setCheckTempDataVisible(true)
                      setCurrentModalRow(record)
                    }}>
                    查看临时表数据
                  </Button>
                )}
              {excelAudit.current && ['WaitingSubmitAudit'].includes(stateCode) && existsTempTable && (
                <Button type={'link'} size={'small'} onClick={() => popupFillAuditModal(record)}>
                  提交审核
                </Button>
              )}
              {excelAudit.current && ['WaitingAudit'].includes(stateCode) && (
                <Popconfirm
                  title={'确定撤回审核申请吗？'}
                  onConfirm={() => {
                    recallFillAudit(record)
                  }}>
                  <Button type={'link'} size={'small'}>
                    撤回
                  </Button>
                </Popconfirm>
              )}

              {permissionsMap['bi-data-reporting.ExcelImportRecordController.remove'] &&
                [
                  'NotImported',
                  'RemoveImported',
                  'TempTableDelete',
                  'TempTableImportFailed',
                  'TempTableImportFinish',
                ].includes(importState) &&
                !['WaitingAudit'].includes(stateCode) && (
                  <Popconfirm placement={'topRight'} title={`确认删除吗？`} onConfirm={() => handleActions(record, -1)}>
                    <Button type={'link'} danger size={'small'}>
                      删除文件
                    </Button>
                  </Popconfirm>
                )}
              {permissionsMap['bi-data-reporting.ExcelImportRecordController.syncData'] &&
                ((!excelAudit.current && !['TempTableImporting', 'TempTableImportFailed'].includes(importState)) ||
                  (excelAudit.current && ['Approved', 'DeleteTemplateTable'].includes(stateCode))) && (
                  <Button
                    type={'link'}
                    size={'small'}
                    onClick={() => {
                      setSyncDataRecord(record)
                      setSyncDataModalVisible(true)
                    }}>
                    数据同步
                  </Button>
                )}
              {excelAudit.current &&
                ['WaitingGenerateTemporaryTable', 'WaitingSubmitAudit'].includes(stateCode) &&
                !existsTempTable &&
                !['TempTableImporting'].includes(importState) && (
                  <Button
                    type={'link'}
                    size={'small'}
                    onClick={() => {
                      setCurrentModalRow(record)
                      setGenerateTempModalVisible(true)
                    }}>
                    生成临时表
                  </Button>
                )}
              {['TempTableImporting'].includes(importState) && (
                <>
                  <span className={'text-gray-600'}>临时表生成中...</span>
                </>
              )}
              {permissionsMap['bi-data-reporting.ExcelImportRecordController.coverAllImportData'] &&
                !excelAudit.current &&
                !['TempTableImporting', 'TempTableImportFailed'].includes(importState) &&
                excelTemplateRef.current.coverAll &&
                (importNum > 0 || !excelAuditRules?.length ? (
                  <Popconfirm
                    placement={'topRight'}
                    title={
                      <div style={{ maxWidth: 340 }}>
                        确认全量导入【{record.id}】【{record.name}】吗？
                      </div>
                    }
                    onConfirm={() => handleActions(record, 3)}>
                    <Button type={'link'} size={'small'}>
                      全量
                    </Button>
                  </Popconfirm>
                ) : (
                  <Button type={'link'} size={'small'} onClick={() => handleActions2(record, 3)}>
                    全量
                  </Button>
                ))}
              {permissionsMap['bi-data-reporting.ExcelImportRecordController.coverOldImportData'] &&
                !excelAudit.current &&
                !['TempTableImporting', 'TempTableImportFailed'].includes(importState) &&
                excelTemplateRef.current.coverOld &&
                (importNum > 0 || !excelAuditRules?.length ? (
                  <Popconfirm
                    placement={'topRight'}
                    title={
                      <div style={{ maxWidth: 340 }}>
                        确认覆盖导入【{record.id}】【{record.name}】吗？此操作只会更新已有数据
                      </div>
                    }
                    onConfirm={() => handleActions(record, 1)}>
                    <Button type={'link'} size={'small'}>
                      覆盖
                    </Button>
                  </Popconfirm>
                ) : (
                  <Button type={'link'} size={'small'} onClick={() => handleActions2(record, 1)}>
                    覆盖
                  </Button>
                ))}
              {permissionsMap['bi-data-reporting.ExcelImportRecordController.coverAppendImportData'] &&
                !excelAudit.current &&
                !['TempTableImporting', 'TempTableImportFailed'].includes(importState) &&
                excelTemplateRef.current.coverAppend &&
                (importNum > 0 || !excelAuditRules?.length ? (
                  <Popconfirm
                    placement={'topRight'}
                    title={
                      <div style={{ maxWidth: 340 }}>
                        确认增量导入【{record.id}】【{record.name}】吗？此操作存在数据则更新，不存在则写入
                      </div>
                    }
                    onConfirm={() => handleActions(record, 2)}>
                    <Button type={'link'} size={'small'}>
                      增量
                    </Button>
                  </Popconfirm>
                ) : (
                  <Button type={'link'} size={'small'} onClick={() => handleActions2(record, 2)}>
                    增量
                  </Button>
                ))}
            </Space>
          )
        },
        width: 400,
        fixed: 'right',
      },
    ],
  })
  const refreshRecordState = (record) => {
    const { id } = record
    axios.get(`/bi-data-reporting/api/user/excel/excelImportRecord/${id}`).then(({ data }) => {
      setTable((prevState) => {
        const index = prevState.dataSource.findIndex((item) => item.id === id)
        if (id > -1) {
          return {
            ...prevState,
            dataSource: [
              ...prevState.dataSource.slice(0, index),
              {
                ...prevState.dataSource[index],
                ...data,
              },
              ...prevState.dataSource.slice(index + 1),
            ],
          }
        }
        return prevState
      })
      if (data.importState === 'TempTableImporting') {
        pollingTimer.current = setTimeout(() => {
          refreshRecordState(record)
        }, 2000)
      } else {
        fetchList()
      }
    })
  }

  const { current, pageSize } = table.pagination
  const { name, importState } = query

  const { run: fetchList, loading } = useRequest(
    () => {
      return axios
        .get('/bi-data-reporting/api/user/excel/excelImportRecord/list', {
          params: {
            page: current,
            pageSize,
            templateId: id,
            name,
            importState,
          },
        })
        .then(({ data: { list, totalRows } }) => {
          const importingItem = list.find((item) => item.importState === 'TempTableImporting')
          if (importingItem) {
            clearTimeout(pollingTimer.current)
            pollingTimer.current = setTimeout(() => {
              refreshRecordState(importingItem)
            }, 2000)
          }
          setTable((prevState) => ({
            ...prevState,
            dataSource: list,
            pagination: { ...prevState.pagination, total: totalRows },
          }))
        })
    },
    {
      manual: true,
    }
  )

  useEffect(() => {
    fetchList()
    return function () {
      clearTimeout(pollingTimer.current)
    }
  }, [fetchList, setTable, current, pageSize, name, importState])

  const handleActions = (row, type) => {
    setPageLoading(true)
    switch (type) {
      case 1:
        // 覆盖
        axios
          .get('/bi-data-reporting/api/admin/excel/excelImportRecord/coverOldImportData', {
            params: {
              id: row.id,
            },
            timeout: 0,
          })
          .then(() => {
            message.success('操作成功')
            fetchList()
          })
          .finally(() => {
            setPageLoading(false)
          })
        break
      case 2:
        // 增量
        axios
          .get('/bi-data-reporting/api/admin/excel/excelImportRecord/coverAppendImportData', {
            params: {
              id: row.id,
            },
            timeout: 0,
          })
          .then(() => {
            message.success('操作成功')
            fetchList()
          })
          .finally(() => {
            setPageLoading(false)
          })
        break
      case 3:
        // 全量
        axios
          .get('/bi-data-reporting/api/admin/excel/excelImportRecord/coverAllImportData', {
            params: {
              id: row.id,
            },
            timeout: 0,
          })
          .then(() => {
            message.success('操作成功')
            fetchList()
          })
          .finally(() => {
            setPageLoading(false)
          })
        break
      case 90:
        // 删除数据
        axios
          .get('/bi-data-reporting/api/user/excel/excelImportRecord/deleteData', {
            params: {
              id: row.id,
            },
          })
          .then(() => {
            message.success('数据删除成功')
            fetchList()
          })
          .finally(() => {
            setPageLoading(false)
          })
        break
      case -1:
        // 删除文件
        axios
          .get('/bi-data-reporting/api/admin/excel/excelImportRecord/remove', {
            params: {
              ids: row.id,
            },
          })
          .then(() => {
            message.success('删除成功')
            fetchList()
          })
          .finally(() => {
            setPageLoading(false)
          })
        break
      default:
      //
    }
  }

  const handleActions2 = (row, type) => {
    setCurrentModalRow({ ...row, auditType: type })
    setFillAuditVisible(true)
  }

  const commonSubmit = () => {
    const auditType = currentModalRow?.auditType
    Modal.confirm({
      title: '注意',
      content: (
        <div>
          确认{{ 1: '覆盖', 2: '增量', 3: '全量' }[auditType]}导入【{currentModalRow.id}】【{currentModalRow.name}】吗？
          {auditType === 1 && '此操作只会更新已有数据'}
          {auditType === 2 && '此操作存在数据则更新，不存在则写入'}
        </div>
      ),
      onOk: () => {
        handleActions(currentModalRow, currentModalRow?.auditType)
        setFillAuditVisible(false)
      },
    })
  }

  const history = useHistory()
  const popupFillAuditModal = (record) => {
    setCurrentModalRow(record)
    setFillAuditVisible(true)
  }
  const checkRow = (row) => {
    const { pathname } = location
    if (pathname.indexOf('/dataFill/todo/templateRecord') === 0) {
      history.push(`/dataFill/todo/templateRecord/record/${id}/detail/${row.id}`)
    } else {
      history.push(`/dataFill/fill/templateList/record/${id}/detail/${row.id}`)
    }
  }

  const recallFillAudit = (row) => {
    axios
      .get('/bi-data-reporting/api/user/excel/excelTemplate/recall', {
        params: { id: row.id },
      })
      .then(() => {
        message.success('审核申请已撤回')
        // 清空缓存的规则结果

        excelTemplateRef.current?.excelAuditRules?.forEach((rule) => {
          console.log(`ruleResult-${row.id}-${rule.id}-submit`)
          sessionStorage.removeItem(`ruleResult-${row.id}-${rule.id}-submit`)
          sessionStorage.removeItem(`ruleResult-${row.id}-${rule.id}-audit`)
        })
        fetchList()
      })
  }

  const [excelAuditRules, setExcelAuditRules] = useState([])
  useEffect(() => {
    axios
      .get(`/bi-data-reporting/api/user/excel/excelTemplate/getDetails`, {
        params: { id },
      })
      .then(({ data: { excelTemplate } }) => {
        setBreadcrumbParams([{ title: excelTemplate.excelName, id: id }])
        setExcelAuditRules(excelTemplate.excelAuditRules)
        excelTemplateRef.current = excelTemplate
        excelAudit.current = excelTemplate.excelAudit
        setTable((prevState) => ({
          key: Math.random(),
          ...prevState,
        }))
      })
  }, [setBreadcrumbParams, id, setTable])

  const [syncDataModalVisible, setSyncDataModalVisible] = useState(false)
  const [syncDataRecord, setSyncDataRecord] = useState(null)

  const [currentModalRow, setCurrentModalRow] = useState(null)
  const [syncAllModalVisible, setSyncAllModalVisible] = useState(false)

  const [generateTempModalVisible, setGenerateTempModalVisible] = useState(false)

  const [fillAuditVisible, setFillAuditVisible] = useState(false)
  const [fillAuditRequestVisible, setFillAuditRequestVisible] = useState(false)
  const [checkTempDataVisible, setCheckTempDataVisible] = useState(false)

  const [checkDataValidResultVisible, setCheckDataValidResultVisible] = useState(false)
  const [currentCheckRule, setCurrentCheckRule] = useState(null)

  const beforeUploadExcel = () => {
    const xhr = new XMLHttpRequest()
    xhr.open(
      'GET',
      axios.defaults.baseURL +
        `/bi-data-reporting/api/user/excel/excelImportRecord/isExistUndoneProcess?templateId=${id}`,
      !(browserVersion.browser === 'Chrome' && browserVersion.mainVersion < 80)
    )
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        const ret = JSON.parse(xhr.responseText)
        if (!ret.success) {
          message.error('系统错误')
        } else {
          const { data } = ret
          if (data) {
            message.destroy()
            message.error('尚有文件未成功填报，请处理后再试')
            setTable((prevState) => ({
              ...prevState,
              rowClassName: (record, index) => {
                return index === 0 ? 'animate-highlight-row' : ''
              },
              pagination: { ...prevState.pagination, current: 1 },
            }))

            setTimeout(() => {
              setTable((prevState) => ({
                ...prevState,
                rowClassName: '',
              }))
            }, 2000)
          } else {
            document.getElementById('uploadFile').click()
          }
        }
      }
    }
    xhr.send()
  }
  const uploadExcel = (e) => {
    const files = e.target.files
    if (!files.length) {
      return
    }
    const handleUpload = (file) => {
      const name = file.name
      const suffix = name.split('.').pop()?.toLowerCase()
      if (!suffix || suffix !== 'xlsx') {
        message.error('请上传后缀为xlsx的文件')
        return
      }

      if (file.size > 20 * 1024 * 1024) {
        message.error('文件大下不能超过20M')
        return
      }

      const fd = new FormData()
      fd.append('file', file)
      axios
        .post('/bi-data-reporting/api/user/file/uploadFile', fd, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        .then(({ data }) => {
          return axios.post('/bi-data-reporting/api/user/excel/excelImportRecord/saveOrUpdate', null, {
            params: {
              templateId: id,
              name: data.name,
              fileSize: data.fileSize,
              filePath: data.filePath,
            },
          })
        })
        .then(() => {
          message.success('上传成功')
          fetchList()
        })
    }
    for (let _file of files) {
      handleUpload(_file)
    }
    e.target.value = ''
  }

  const handleViewAll = () => {
    history.push(`/dataFill/fill/templateRecord/allData/${id}`)
  }

  return (
    <div className={'p-6'}>
      <Spin spinning={pageLoading}>
        <div className={'flex justify-between mb-2.5'}>
          <div style={{ flex: '1', marginRight: 10 }}>
            <Row gutter={24}>
              <Col span={8}>
                <div className={'flex'}>
                  <span style={{ flex: '0 0 80px' }}>名称</span>
                  <Input
                    placeholder={'名称'}
                    onChange={(e) => setQuery((prevState) => ({ ...prevState, name: e.target.value }))}
                    allowClear
                  />
                </div>
              </Col>
              <Col span={8}>
                <div className={'flex'}>
                  <span style={{ flex: '0 0 80px' }}>导入状态</span>
                  <Select
                    value={query.importState}
                    onChange={(v) => setQuery((prevState) => ({ ...prevState, importState: v }))}
                    placeholder={'导入状态'}
                    allowClear
                    style={{ flex: '1 0 auto' }}>
                    {Object.keys(importStatusList).map((key) => (
                      <Select.Option value={key} key={key}>
                        {importStatusList[key]}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
              </Col>
            </Row>
          </div>
          <Space>
            <Tooltip title={'仅支持后缀为xlsx的文件'} placement={'top'}>
              <Button type={'primary'} onClick={beforeUploadExcel}>
                上传Excel
              </Button>
            </Tooltip>
            <input
              accept={'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}
              multiple={!excelAudit.current}
              type={'file'}
              id={'uploadFile'}
              hidden
              onChange={uploadExcel}
            />
            <Button type={'primary'} onClick={handleViewAll}>
              查看全部
            </Button>
            {permissionsMap['bi-data-reporting.ExcelImportRecordController.syncAllImportedExcel'] && (
              <Button onClick={() => setSyncAllModalVisible(true)}>全表同步</Button>
            )}
          </Space>
        </div>
        <Table {...table} loading={loading} />
      </Spin>
      <SyncDataModal
        visible={syncDataModalVisible}
        excelTemplate={excelTemplateRef.current}
        setVisible={setSyncDataModalVisible}
        syncDataRecord={syncDataRecord}
      />
      <SyncAllModal visible={syncAllModalVisible} setVisible={setSyncAllModalVisible} templateId={id} />

      <GenerateTempModal
        visible={generateTempModalVisible}
        currentRow={currentModalRow}
        onSubmitted={fetchList}
        setVisible={setGenerateTempModalVisible}
      />

      <FillAuditModal
        visible={fillAuditVisible}
        rules={excelAuditRules}
        setRules={setExcelAuditRules}
        recordId={currentModalRow?.id}
        setCurrentCheckRule={setCurrentCheckRule}
        setCheckDataValidResultVisible={setCheckDataValidResultVisible}
        currentModalRow={currentModalRow}
        commonSubmit={commonSubmit}
        popupSubmit={() => {
          setFillAuditRequestVisible(true)
        }}
        setVisible={setFillAuditVisible}
      />
      <FillAuditRequestModal
        visible={fillAuditRequestVisible}
        excelTemplate={excelTemplateRef.current}
        currentRow={currentModalRow}
        onSubmitted={() => {
          setFillAuditVisible(false)
          fetchList()
        }}
        setVisible={setFillAuditRequestVisible}
      />
      <CheckTempTableDataModal
        visible={checkTempDataVisible}
        currentRow={currentModalRow}
        setVisible={setCheckTempDataVisible}
      />
      <CheckDataValidResult
        checkType={'submit'}
        visible={checkDataValidResultVisible}
        currentCheckRule={currentCheckRule}
        recordId={currentModalRow?.id}
        setVisible={setCheckDataValidResultVisible}
      />
    </div>
  )
}

export { CheckDataValid, CheckDataValidResult }
export default connect(
  (state) => {
    return {
      permissionsMap: state.user.permissionsMap,
    }
  },
  (dispatch) => {
    return {
      setBreadcrumbParams: (payload) => {
        dispatch({ type: 'set_breadcrumb_params', payload })
      },
    }
  }
)(ImportRecord)
