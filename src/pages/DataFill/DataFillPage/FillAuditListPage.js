import React, {useCallback, useEffect, useRef, useState} from 'react'
import { Button, Col, DatePicker, Input, message, Row, Select, Space, Table, Tag } from 'antd'
import useTable from '../../../hooks/useTable'
import useUserList from '../../../hooks/useUserList'
import { Tooltip } from '@material-ui/core'
import DraggableModal from '../../../components/DraggableModal'
import { useRequest } from 'ahooks'
import axios from '../../../utils/axios'
import OverflowTooltip from '../../../components/OverflowTooltip'
import { ImportFileDetail } from './importFileDetail'
import { CheckDataValid, CheckDataValidResult } from './ImportRecord'
import { useLocation } from 'react-router-dom'

import ExSelect from '../../../components/Select'
import useDataFields from './hooks/useDataFields'
import { fetchLevelInfo } from '../helpers'
import CheckData from '../components/CheckData'
import { useSelector } from 'react-redux'

const AuditStatus = {
  '-1': '不通过',
  1: '通过',
  0: '待审核',
}

function AuditFill(props) {
  const { currentRow, setCurrentCheckRule, setCheckDataValidResultVisible, innerResultRef, setCheckResultRefKey } =
    props
  const { recordId, templateId } = currentRow || {}
  const [rules, setRules] = useState([])

  useEffect(() => {
    if (templateId) {
      axios
        .get('/bi-data-reporting/api/user/excel/excelTemplate/getDetails', {
          params: {
            id: templateId,
          },
        })
        .then(({ data: { excelTemplate } }) => {
          setRules(excelTemplate.excelAuditRules || [])
        })
    }
  }, [templateId])

  useEffect(() => {
    innerResultRef.current = rules
    setCheckResultRefKey((prev) => prev + 1)
  }, [rules, innerResultRef, setCheckResultRefKey])

  return (
    <>
      <CheckDataValid
        checkType={'audit'}
        rules={rules}
        recordId={recordId}
        resultCheckRef={innerResultRef}
        setRules={setRules}
        setCurrentCheckRule={setCurrentCheckRule}
        setCheckDataValidResultVisible={setCheckDataValidResultVisible}
      />
    </>
  )
}

function FillAuditListPage() {
  const permissionsMap = useSelector((state) => state.user.permissionsMap)
  const { table, setTable } = useTable({
    rowKey: 'id',
    dataSource: [],
    tableLayout: 'fixed',
    scroll: { x: 1600 },
    columns: [
      {
        title: '文件名',
        dataIndex: 'fileName',
        render: (text, record) => {
          return (
            <a href={axios.defaults.baseURL + record['auditFilePath']} download={text}>
              <div className={'break-all line-clamp-3'}>{text}</div>
            </a>
          )
        },
      },
      { title: '模板名称', dataIndex: 'templateName' },
      { title: '第二层分类', dataIndex: 'templateCategory', width: 100 },
      { title: '第一层分类', dataIndex: 'oneTierName', width: 100 },
      { title: '数据域', dataIndex: 'dataFieldName', width: 100 },

      { title: '导入方式', dataIndex: 'importWay', width: 100 },
      {
        title: '申请描述',
        dataIndex: 'description',
        width: 100,
        render: (text) => {
          return <OverflowTooltip>{text}</OverflowTooltip>
        },
      },
      {
        title: '提交人',
        dataIndex: 'submitorName',
        width: 100,
        render: (text) => {
          return <OverflowTooltip>{text}</OverflowTooltip>
        },
      },
      {
        title: '提交时间',
        dataIndex: 'submitDate',
        width: 160,
        render: (text) => {
          return <OverflowTooltip>{text}</OverflowTooltip>
        },
      },
      {
        title: '审核人',
        dataIndex: 'auditorName',
        width: 100,
        render: (text) => {
          return <OverflowTooltip>{text}</OverflowTooltip>
        },
      },
      {
        title: '审核时间',
        dataIndex: 'auditDate',
        width: 160,
        render: (text) => {
          return <OverflowTooltip>{text}</OverflowTooltip>
        },
      },
      {
        title: '审核状态',
        dataIndex: 'status',
        width: 80,
        render: (text) => {
          const color = { 1: 'success', '-1': 'error' }[text]
          return <Tag color={color}>{AuditStatus[text]}</Tag>
        },
      },
      {
        title: '操作',
        dataIndex: 'actions',
        width: 120,
        fixed: 'right',
        render: (text, record) => {
          const { status } = record
          return (
            <Space>
              {status === '1' && (
                <Tooltip title={'查看正式表数据'} placement={'top'}>
                  <Button type={'link'} size={'small'} onClick={() => checkData(record)}>
                    查看
                  </Button>
                </Tooltip>
              )}
              {['0', '-1'].includes(status) && (
                <Tooltip title={'查看临时表数据'} placement={'top'}>
                  <Button type={'link'} size={'small'} onClick={() => checkTemporary(record)}>
                    查看
                  </Button>
                </Tooltip>
              )}
              {status === '0' && permissionsMap['bi-data-reporting.ExcelAuditController.audit'] && (
                <Button type={'link'} size={'small'} onClick={() => auditRow(record)}>
                  审核
                </Button>
              )}
            </Space>
          )
        },
      },
    ],
  })
  const location = useLocation()

  const userList = useUserList()

  const dataFields = useDataFields()

  const [level1List, setLevel1List] = useState([])
  const [level2List, setLevel2List] = useState([])

  useEffect(() => {
    const _fetch = async () => {
      const list = await fetchLevelInfo(1)
      setLevel1List(list)

      const list2 = await fetchLevelInfo(2)
      setLevel2List(list2)
    }

    _fetch()
  }, [])

  const [visible, setVisible] = useState(false)
  const [visible2, setVisible2] = useState(false)

  const [checkDataRecord, setCheckDataRecord] = useState(null)
  const checkData = (record) => {
    setCheckDataRecord(record)
  }

  const checkTemporary = (record) => {
    setCurrentModalRow(record)
    setVisible(true)
  }
  const [currentModalRow, setCurrentModalRow] = useState({})
  const auditRow = (record) => {
    setCurrentModalRow(record)
    setVisible2(true)
  }

  const [query, _setQuery] = useState({
    status: undefined,
    auditorId: undefined,
    submitorId: undefined,
    dataFieldId: undefined,
    oneTier: undefined,
    twoTier: undefined,
    keyword: '',
    submitDate: [],
  })

  const setQuery = useCallback((args) => {
    setTable(prevState => ({
      ...prevState,
      pagination: {...prevState.pagination, current: 1}
    }))
    _setQuery(args)
  }, [_setQuery, setTable])

  useEffect(() => {
    if (location.state?.query) {
      setQuery((prev) => {
        return {
          ...prev,
          ...location.state.query,
        }
      })
    }
  }, [location, setQuery])

  const { submitDate, ...restQuery } = query
  const { current, pageSize } = table.pagination
  const { run: fetchList, loading } = useRequest(
    () => {
      return axios
        .get('/bi-data-reporting/api/admin/excel/excelAudit/list', {
          params: {
            page: current,
            pageSize,
            ...restQuery,
            submitStartDate: submitDate?.[0]?.format('YYYY-MM-DD'),
            submitEndDate: submitDate?.[1]?.format('YYYY-MM-DD'),
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

  useEffect(() => {
    fetchList()
  }, [fetchList, current, query])
  const [auditPassLoading, setAuditPassLoading] = useState(false)
  const [auditRejectLoading, setRejectPassLoading] = useState(false)

  const handleAudit = (result) => {
    if (result === 'Pass') {
      setAuditPassLoading(true)
    }
    if (result === 'Reject') {
      setRejectPassLoading(true)
    }
    axios
      .get('/bi-data-reporting/api/admin/excel/excelAudit/audit', {
        params: {
          result,
          id: currentModalRow.id,
        },
        timeout: 0
      })
      .then(() => {
        message.success('审核完成')
        setVisible2(false)
        fetchList()
      })
      .finally(() => {
        if (result === 'Pass') {
          setAuditPassLoading(false)
        }
        if (result === 'Reject') {
          setRejectPassLoading(false)
        }
      })
  }

  const [checkDataValidResultVisible, setCheckDataValidResultVisible] = useState(false)
  const [currentCheckRule, setCurrentCheckRule] = useState(null)

  const checkResultRef = useRef([])
  const [checkResultRefKey, setCheckResultRefKey] = useState(1)
  const [approvalButtonDisabled, setApprovalButtonDisabled] = useState(true)

  useEffect(() => {
    const ret = checkResultRef.current.some((item) => !item.hasViewed)
    setApprovalButtonDisabled(ret)
  }, [checkResultRefKey])

  return (
    <div className={'p-6'}>
      <div className={'mb-2.5'}>
        <Row gutter={24}>
          <Col span={6}>
            <div className={'flex flex-start'}>
              <span style={{ flex: '0 0 80px' }}>审核状态</span>
              <Select
                placeholder={'审核状态'}
                style={{ flex: '1' }}
                value={query.status}
                onChange={(v) => setQuery((prevState) => ({ ...prevState, status: v }))}
                allowClear>
                <Select.Option key={0} value={0}>
                  待审核
                </Select.Option>
                <Select.Option key={1} value={1}>
                  通过
                </Select.Option>
                <Select.Option key={-1} value={-1}>
                  不通过
                </Select.Option>
              </Select>
            </div>
          </Col>
          <Col span={6}>
            <div className={'flex flex-start'}>
              <span style={{ flex: '0 0 80px' }}>关键字</span>
              <Input
                value={query.keyword}
                onChange={(e) => setQuery((prevState) => ({ ...prevState, keyword: e.target.value }))}
                placeholder={'关键字'}
                allowClear
              />
            </div>
          </Col>
          <Col span={6}>
            <div className={'flex flex-start'}>
              <span style={{ flex: '0 0 80px' }}>提交人</span>
              <Select
                value={query.submitorId}
                onChange={(v) => setQuery((prevState) => ({ ...prevState, submitorId: v }))}
                placeholder={'提交人'}
                style={{ flex: '1' }}
                allowClear
                showSearch
                filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}>
                {userList.map((item) => (
                  <Select.Option value={item.idUser} key={item.idUser}>
                    {item.nameCn}
                  </Select.Option>
                ))}
              </Select>
            </div>
          </Col>
          <Col span={6}>
            <div className={'flex flex-start'}>
              <span style={{ flex: '0 0 80px' }}>审核人</span>
              <Select
                value={query.auditorId}
                onChange={(v) => setQuery((prevState) => ({ ...prevState, auditorId: v }))}
                placeholder={'审核人'}
                style={{ flex: '1' }}
                allowClear
                showSearch
                filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}>
                {userList.map((item) => (
                  <Select.Option value={item.idUser} key={item.idUser}>
                    {item.nameCn}
                  </Select.Option>
                ))}
              </Select>
            </div>
          </Col>
        </Row>
        <Row gutter={24} className={'mt10'}>
          <Col span={6}>
            <div className={'flex flex-start'}>
              <span style={{ flex: '0 0 80px' }}>提交时间</span>
              <DatePicker.RangePicker
                value={query.submitDate}
                onChange={(v) => setQuery((prevState) => ({ ...prevState, submitDate: v }))}
                format={'YYYY/MM/DD'}
                style={{ flex: 1 }}
              />
            </div>
          </Col>
          <Col span={6}>
            <div className={'flex flex-start'}>
              <span style={{ flex: '0 0 80px' }}>数据域</span>
              <ExSelect
                value={query.dataFieldId}
                onChange={(v) => setQuery((prevState) => ({ ...prevState, dataFieldId: v }))}
                options={dataFields.map(item => ({label: item.label, value: item.value}))}
                placeholder={'数据域'}
                allowClear
              />
            </div>
          </Col>
          <Col span={6}>
            <div className={'flex flex-start'}>
              <span style={{ flex: '0 0 80px' }}>第一层分类</span>
              <ExSelect
                value={query.oneTier}
                onChange={(v) => setQuery((prevState) => ({ ...prevState, oneTier: v }))}
                options={level1List.map(item => ({label: item.label, value: item.value}))}
                placeholder={'第一层分类'}
                allowClear
              />
            </div>
          </Col>
          <Col span={6}>
            <div className={'flex flex-start'}>
              <span style={{ flex: '0 0 80px' }}>第二层分类</span>
              <ExSelect
                options={Array.from(new Set(level2List.map((item) => item.name))).map((item) => ({
                  label: item,
                  value: item,
                }))}
                onChange={(v) => setQuery((prevState) => ({ ...prevState, twoTier: v }))}
                allowClear
                placeholder={'第二层分类'}
              />
            </div>
          </Col>
        </Row>
      </div>
      <Table {...table} loading={loading} />

      <DraggableModal
        visible={visible}
        title={'查看临时表数据'}
        footer={null}
        width={'70vw'}
        destroyOnClose
        onCancel={() => setVisible(false)}>
        <ImportFileDetail fileId={currentModalRow.recordId} forTempTable={true} />
      </DraggableModal>

      <DraggableModal
        visible={!!checkDataRecord}
        title={'查看数据'}
        width={'70vw'}
        footer={null}
        destroyOnClose
        onCancel={() => setCheckDataRecord(null)}>
        <CheckData forModal={true} fileId={checkDataRecord?.recordId} />
      </DraggableModal>

      <DraggableModal
        visible={visible2}
        width={960}
        title={'审核'}
        destroyOnClose
        footer={[
          <Button key={1} onClick={() => setVisible2(false)}>
            取消
          </Button>,
          <Button
            key={2}
            loading={auditPassLoading}
            disabled={approvalButtonDisabled || auditRejectLoading}
            type={'primary'}
            onClick={() => handleAudit('Pass')}>
            通过
          </Button>,
          <Button
            key={3}
            loading={auditRejectLoading}
            disabled={approvalButtonDisabled || auditPassLoading}
            type={'primary'}
            onClick={() => handleAudit('Reject')}>
            不通过
          </Button>,
        ]}
        onCancel={() => setVisible2(false)}>
        <AuditFill
          currentRow={currentModalRow}
          setCheckResultRefKey={setCheckResultRefKey}
          innerResultRef={checkResultRef}
          setCurrentCheckRule={setCurrentCheckRule}
          setCheckDataValidResultVisible={setCheckDataValidResultVisible}
        />
      </DraggableModal>

      <CheckDataValidResult
        checkType={'audit'}
        visible={checkDataValidResultVisible}
        currentCheckRule={currentCheckRule}
        recordId={currentModalRow?.recordId}
        setVisible={setCheckDataValidResultVisible}
      />
    </div>
  )
}

export default FillAuditListPage
