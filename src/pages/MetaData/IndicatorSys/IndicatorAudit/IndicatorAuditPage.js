import React, { useEffect, useRef, useState } from 'react'
import { connect } from 'react-redux'
import {
  Button,
  Col,
  Input,
  message,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  TreeSelect,
} from 'antd'
import useTable from '../../../../hooks/useTable'
import axios from '../../../../utils/axios'
import OverflowTooltip from '../../../../components/OverflowTooltip'
import DraggableModal from '../../../../components/DraggableModal'
import { useHistory } from 'react-router-dom'
import styles from './indicatorAuditPage.module.less'
import { refreshRateString, refreshScopeString } from '../utils'
import useUserList from '../../../../hooks/useUserList'
import StyledDateRangePicker from '../../../../components/StyledDateRangePicker';

function DetailModal(props) {
  const history = useHistory()
  const { visible, setVisible, record } = props
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState({
    sName: '',
    dimensionNames: '',
    calcFormula: '',
    kpiDcrp: '',
    reportsInvolved: '',
    tableFields: '',
    scopeOfRefreshType: '',
    scopeOfRefreshValue: '',
    updateName: '',
    updateDate: '',
  })
  useEffect(() => {
    setLoading(true)
    if (record) {
      axios
        .get('/bi-metadata/api/user/kpiNode/selectByIdDetails', {
          params: {
            id: record.kpiNodeId,
          },
        })
        .then(({ data }) => {
          setDetail(data || {})
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [record])
  const checkMore = () => {
    setVisible(false)
    history.push(`/metaData/metricsSys/metricsEdit/check/${detail.id}`)
  }

  return (
    <DraggableModal
      visible={visible}
      title="详情"
      okText={'更多信息'}
      onOk={checkMore}
      onCancel={() => setVisible(false)}>
      {loading ? (
        <Spin style={{ width: '100%', padding: '20%' }} />
      ) : (
        <div className={styles.descList}>
          <div>
            <span>上级指标：</span>
            <span>{detail.sName}</span>
          </div>
          <div>
            <span>指标维度：</span>
            <span
              style={{
                display: 'block',
                flex: 1,
                maxHeight: '110px',
                overflow: 'auto',
              }}>
              {(detail.dimensionNames || '')
                .split(',')
                .filter(Boolean)
                .map((_) => (
                  <div key={_}>{_}</div>
                ))}
            </span>
          </div>
          <div>
            <span>计算公式：</span>
            <span>{detail.calcFormula}</span>
          </div>
          <div>
            <span>指标业务描述：</span>
            <span style={{ maxHeight: 110, flex: '1', overflow: 'auto' }}>{detail.kpiDcrp}</span>
          </div>
          <div>
            <span>数据刷新范围：</span>
            <span>{refreshScopeString(detail.scopeOfRefreshType, detail.scopeOfRefreshValue)}</span>
          </div>
          <div>
            <span>数据刷新频率：</span>
            <span>{refreshRateString(detail)}</span>
          </div>
          <div>
            <span>涉及的报表：</span>
            <span
              style={{
                display: 'block',
                flex: 1,
                maxHeight: '110px',
                overflow: 'auto',
              }}>
              {(detail.reportsInvolved || '')
                .split(',')
                .filter(Boolean)
                .map((_) => (
                  <div key={_}>{_}</div>
                ))}
            </span>
          </div>
          <div>
            <span>数据来源：</span>
            <span
              style={{
                display: 'block',
                flex: 1,
                maxHeight: '110px',
                overflow: 'auto',
              }}>
              {(detail.dataSourceNames || '')
                .split(',')
                .filter(Boolean)
                .map((_) => (
                  <div key={_}>{_}</div>
                ))}
            </span>
          </div>
          <div>
            <span>最后更新人：</span>
            <span>{detail.updateName}</span>
          </div>
          <div>
            <span>最后更新日期：</span>
            <span>{detail.updateDate}</span>
          </div>
        </div>
      )}
    </DraggableModal>
  )
}

function IndicatorAuditPage(props) {
  const { permissionsMap } = props
  const selectedKeyRef = useRef([])
  const { table, setTable } = useTable({
    rowKey: 'id',
    loading: false,
    rowSelection: {
      selectedRowKeys: [],
      onChange: (selectedRowKeys) => {
        selectedKeyRef.current = selectedRowKeys
        setTable((prevState) => ({
          ...prevState,
          rowSelection: { ...prevState.rowSelection, selectedRowKeys },
        }))
      },
      getCheckboxProps(record) {
        return {
          disabled: record.status !== 0,
        }
      },
    },
    columns: [
      { title: '指标名称', dataIndex: 'nodeName' },
      {
        title: '指标类型',
        dataIndex: 'nodeType',
        width: 80,
        render(text) {
          return <OverflowTooltip>{{ 1: '原子', 2: '派生' }[text]}</OverflowTooltip>
        },
      },
      {
        title: '变更类型',
        dataIndex: 'changeType',
        render(text) {
          return <span>{{ 0: '新增', 1: '修改', 2: '删除' }[text]}</span>
        },
        align: 'center',
        width: 120,
      },
      { title: '标题', dataIndex: 'title' },
      { title: '提交人', dataIndex: 'submitterName' },
      { title: '提交时间', dataIndex: 'submitDate', align: 'center' },
      {
        title: '详细信息',
        dataIndex: 'id',
        render(text, record) {
          return (
            <Button size={'small'} type={'link'} onClick={() => checkRowDetail(record)}>
              详情
            </Button>
          )
        },
        align: 'center',
      },
      {
        title: '审批状态',
        dataIndex: 'status',
        render(text) {
          return (
            <>
              {text === 0 && (
                <Tag color={'processing'} style={{ margin: 0 }}>
                  待审核
                </Tag>
              )}
              {text === 1 && (
                <Tag color={'success'} style={{ margin: 0 }}>
                  通过
                </Tag>
              )}
              {text === -1 && (
                <Tag color={'error'} style={{ margin: 0 }}>
                  拒绝
                </Tag>
              )}
            </>
          )
        },
        align: 'center',
      },
      { title: '审批人', dataIndex: 'auditorName' },
      { title: '审批时间', dataIndex: 'auditDate', align: 'center' },
      {
        title: '操作',
        dataIndex: 'action',
        shouldCellUpdate() {
          return true
        },
        render(text, record) {
          const hasPerm = permissionsMap['bi-metadata.NodeAuditController.batchAudit']
          if (selectedKeyRef.current.includes(record.id)) {
            return '已选中'
          }
          return record.status === 0 ? (
            <Space>
              <Popconfirm disabled={!hasPerm} title={'确定通过吗？'} onConfirm={() => handleAudit(record, 'Pass')}>
                <Button type={'link'} size={'small'} disabled={!hasPerm}>
                  通过
                </Button>
              </Popconfirm>
              <Popconfirm
                placement={'topRight'}
                disabled={!hasPerm}
                title="确定拒绝吗？"
                onConfirm={() => handleAudit(record, 'Reject')}>
                <Button type={'link'} size={'small'} disabled={!hasPerm} danger>
                  拒绝
                </Button>
              </Popconfirm>
            </Space>
          ) : (
            '/'
          )
        },
        align: 'center',
        width: 120,
        fixed: 'right',
      },
    ],
  })
  const [detailVisible, setDetailVisible] = useState(false)
  const [_key, _setKey] = useState(1)
  const [currentModalRecord, setCurrentModalRecord] = useState(null)
  const checkRowDetail = (record) => {
    setDetailVisible(true)
    setCurrentModalRecord(record)
  }

  const handleAudit = (record, result) => {
    axios
      .get('/bi-metadata/api/admin/nodeAudit/batchAudit', {
        params: { ids: record.id, result },
      })
      .then(() => {
        message.success('操作成功')
        _setKey((prevState) => prevState + 1)
      })
  }

  const handleBatchAudit = (result) => {
    axios
      .get('/bi-metadata/api/admin/nodeAudit/batchAudit', {
        params: {
          ids: table.rowSelection.selectedRowKeys.toString(),
          result,
        },
      })
      .then(() => {
        message.success('操作成功')
        selectedKeyRef.current = []
        setTable((prevState) => ({
          ...prevState,
          rowSelection: {
            ...prevState.rowSelection,
            selectedRowKeys: [],
          },
        }))
        _setKey((prevState) => prevState + 1)
      })
  }

  const [biMenusTree, setBiMenusTree] = useState([])

  useEffect(() => {
    axios.get('/bi-metadata/api/user/kpiNode/listBIMenuTree').then(({ data }) => {
      const func = (list, parentPath = []) => {
        list.forEach((item) => {
          item.value = item.id
          item.title = item['cnName']
          item.key = item.id
          item.children = item['subMenu']
          item.selectable = !item['subMenu'].length
          item.checkable = !item['subMenu'].length
          item.parentPath = parentPath
          item.fullName = parentPath.concat(item.title).join('/')
          if (item.children) {
            func(item.children, item.parentPath.concat(item.title))
          }
        })
        return list
      }
      setBiMenusTree(func(data))
    })
  }, [])

  let [query, setQuery] = useState({
    nodeName: '',
    keyword: '',
    reportsInvolvedId: undefined,
    submitterId: undefined,
    auditorId: undefined,
    auditDate: [],
    submitDate: [],
    status: undefined,
  })

  const [search, setSearch] = useState(query)

  const { current, pageSize } = table.pagination
  const { nodeName, keyword, reportsInvolvedId, submitterId, auditorId, submitDate, auditDate, status } = search
  const [startDate1, endDate1] = submitDate || []
  const submitStartDate = startDate1 ? startDate1.format('YYYY-MM-DD') : undefined
  const submitEndDate = endDate1 ? endDate1.format('YYYY-MM-DD') : undefined
  const [startDate2, endDate2] = auditDate || []
  const auditStartDate = startDate2 ? startDate2.format('YYYY-MM-DD') : undefined
  const audiEndDate = endDate2 ? endDate2.format('YYYY-MM-DD') : undefined

  useEffect(() => {
    setTable((prevState) => ({ ...prevState, pagination: { ...prevState.pagination, current: 1 } }))
    setSearch((prevState) => ({ ...prevState, ...query }))
  }, [query, setTable])

  useEffect(() => {
    setTable((prevState) => ({ ...prevState, loading: true }))
    axios
      .get('/bi-metadata/api/admin/nodeAudit/list', {
        params: {
          page: current,
          pageSize,
          nodeName,
          keyword,
          reportsInvolvedId,
          submitterId,
          auditorId,
          submitStartDate,
          submitEndDate,
          auditStartDate,
          audiEndDate,
          status,
        },
      })
      .then(({ data: { list, totalRows } }) => {
        setTable((prevState) => ({
          ...prevState,
          loading: false,
          dataSource: list,
          pagination: { ...prevState.pagination, total: totalRows },
        }))
      })
      .catch(() => {
        setTable((prevState) => ({ ...prevState, loading: false }))
      })
    /* eslint-disable-next-line */
  }, [
    current,
    pageSize,
    nodeName,
    keyword,
    reportsInvolvedId,
    submitterId,
    auditorId,
    status,
    submitStartDate,
    submitEndDate,
    auditStartDate,
    audiEndDate,
    setTable,
    _key,
    setTable,
  ])

  const userList = useUserList()

  const cancelBatchAudit = () => {
    selectedKeyRef.current = []
    setTable((prevState) => ({
      ...prevState,
      rowSelection: {
        ...prevState.rowSelection,
        selectedRowKeys: [],
      },
    }))
  }

  return (
    <div className={'px-6 py-6'}>
      <div className="mb10 relative">
        <div>
          <Row gutter={16} className="mb10">
            <Col span={6}>
              <div className="flex justify-between">
                <span style={{ flex: '0 0 80px', width: 80 }}>指标名称</span>
                <Input
                  placeholder="指标名称"
                  value={query.nodeName}
                  allowClear
                  onChange={(e) =>
                    setQuery((prevState) => ({
                      ...prevState,
                      nodeName: e.target.value,
                    }))
                  }
                />
              </div>
            </Col>
            <Col span={6}>
              <div className="flex justify-between">
                <span style={{ flex: '0 0 80px', width: 80 }}>关键字</span>
                <Input
                  placeholder="标题、计算公式、口径、过滤条件、相关表"
                  value={query.keyword}
                  allowClear
                  onChange={(e) =>
                    setQuery((prevState) => ({
                      ...prevState,
                      keyword: e.target.value,
                    }))
                  }
                />
              </div>
            </Col>
            <Col span={6}>
              <div className="flex justify-between">
                <span style={{ flex: '0 0 80px', width: 80 }}>使用报表</span>
                <TreeSelect
                  value={query.reportsInvolvedId}
                  getPopupContainer={(dom) => dom}
                  onChange={(v) =>
                    setQuery((prevState) => ({
                      ...prevState,
                      reportsInvolvedId: v,
                    }))
                  }
                  treeData={biMenusTree}
                  style={{ width: '100%' }}
                  showSearch
                  filterTreeNode={(search, item) => {
                    return item.title.toLowerCase().indexOf(search.toLowerCase()) >= 0
                  }}
                  placeholder={'使用报表'}
                  allowClear
                />
              </div>
            </Col>
            <Col span={6}>
              <div className="flex justify-between">
                <span style={{ flex: '0 0 80px', width: 80 }}>审批状态</span>
                <Select
                  style={{ width: '100%' }}
                  placeholder="审批状态"
                  allowClear
                  value={query.status}
                  onChange={(value) => setQuery((prevState) => ({ ...prevState, status: value }))}>
                  <Select.Option value={0}>待审核</Select.Option>
                  <Select.Option value={1}>通过</Select.Option>
                  <Select.Option value={-1}>拒绝</Select.Option>
                </Select>
              </div>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <div className="flex justify-between">
                <span style={{ flex: '0 0 80px', width: 80 }}>提交人</span>
                <Select
                  value={query.submitterId}
                  onChange={(value) => setQuery((prevState) => ({ ...prevState, submitterId: value }))}
                  filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                  style={{ width: '100%' }}
                  placeholder="提交人"
                  allowClear
                  showSearch>
                  {userList.map((item) => (
                    <Select.Option value={item.idUser} key={item.idUser}>
                      {item.nameCn}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </Col>
            <Col span={6}>
              <div className="flex justify-between">
                <span style={{ flex: '0 0 80px', width: 80 }}>提交时间</span>
                <StyledDateRangePicker
                  allowEmpty={[true, true]}
                  style={{ width: '100%' }}
                  value={query.submitDate}
                  onChange={(value) =>
                    setQuery((prevState) => ({
                      ...prevState,
                      submitDate: value,
                    }))
                  }
                />
              </div>
            </Col>
            <Col span={6}>
              <div className="flex justify-between">
                <span style={{ flex: '0 0 80px', width: 80 }}>审批人</span>
                <Select
                  value={query.auditorId}
                  onChange={(value) => setQuery((prevState) => ({ ...prevState, auditorId: value }))}
                  filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                  style={{ width: '100%' }}
                  placeholder="审批人"
                  allowClear
                  showSearch>
                  {userList.map((item) => (
                    <Select.Option value={item.idUser} key={item.idUser}>
                      {item.nameCn}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </Col>
            <Col span={6}>
              <div className="flex justify-between">
                <span style={{ flex: '0 0 80px', width: 80 }}>审批时间</span>
                <StyledDateRangePicker
                  allowEmpty={[true, true]}
                  style={{ width: '100%' }}
                  value={query.auditDate}
                  onChange={(value) =>
                    setQuery((prevState) => ({
                      ...prevState,
                      auditDate: value,
                    }))
                  }
                />
              </div>
            </Col>
          </Row>
        </div>
        {!!table.rowSelection.selectedRowKeys.length && (
          <div className={`${styles.overlayActions} flex justify-end`}>
            <Space>
              <Popconfirm
                disabled={!permissionsMap['bi-metadata.NodeAuditController.batchAudit']}
                title={'确定批量通过吗？'}
                onConfirm={() => handleBatchAudit('Pass')}>
                <Button disabled={!permissionsMap['bi-metadata.NodeAuditController.batchAudit']} type={'primary'}>
                  批量通过
                </Button>
              </Popconfirm>
              <Popconfirm
                disabled={!permissionsMap['bi-metadata.NodeAuditController.batchAudit']}
                placement={'topRight'}
                title={'确定批量拒绝吗？'}
                onConfirm={() => handleBatchAudit('Reject')}>
                <Button disabled={!permissionsMap['bi-metadata.NodeAuditController.batchAudit']} danger>
                  批量拒绝
                </Button>
              </Popconfirm>
              <Button onClick={cancelBatchAudit}>取消</Button>
            </Space>
          </div>
        )}
      </div>
      <Table tableLayout={'fixed'} {...table} />
      <DetailModal visible={detailVisible} setVisible={setDetailVisible} record={currentModalRecord} />
    </div>
  )
}

export default connect((state) => {
  return {
    permissionsMap: state.user.userInfo.permissionsMap,
  }
})(IndicatorAuditPage)
