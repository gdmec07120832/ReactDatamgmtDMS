import React, { useCallback, useEffect, useRef, useState } from 'react'
import styled, { keyframes, css } from 'styled-components'
import OverflowTooltip from '../../components/OverflowTooltip'
import { useRequest } from 'ahooks'
import axios from '../../utils/axios'
import { useHistory, useRouteMatch } from 'react-router-dom'
import { Button, Input, message, Modal, Popconfirm, Rate, Select, Table, Tag } from 'antd'
import EditBasicInfoModal from './components/EditBasicInfoModal'
import useTable from '../../hooks/useTable'
import { CheckCircleOutlined, ExclamationCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import ExSelect from '../../components/Select'
import { Tooltip, useEventCallback } from '@material-ui/core'
import LogTableModal from './components/LogTableModal'
import CollapseButtons from '../../components/CollapseButtons'
import { useSelector } from 'react-redux'

const HeadTitle = styled.div`
  height: 55px;
  font-size: 16px;
  font-family: PingFangSC-Medium, PingFang SC, 'Microsoft YaHei UI', sans-serif;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
  line-height: 24px;
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
`

const SubTitle = styled.div`
  height: 22px;
  font-size: 14px;
  font-family: PingFangSC-Medium, PingFang SC, 'Microsoft YaHei UI', sans-serif;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.88);
  line-height: 22px;
`

const RulesWrapper = styled.div`
  border: 1px solid #ebebeb;
`

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
`
const RefreshIcon = styled.div`
  padding: 4px 8px;
  &:hover {
    background: rgba(0, 0, 0, 0.08);
    border-radius: 5px;
  }
  > span {
    animation: ${(props) =>
      props.animate
        ? css`${rotate} 1s`
        : ''};
  }
`

const RuleTempItem = styled.div`
  cursor: pointer;
  user-select: none;
  height: 36px;
  line-height: 36px;
  padding: 0 12px;
  color: ${(props) => (props.active ? '#327BF8' : '#5A5E66')};
  background: ${(props) => (props.active ? 'rgba(214, 230, 249, .43)' : '')};
  font-weight: ${(props) => (props.active ? 500 : 400)};
  &:hover {
    background: rgba(214, 230, 249, 0.43);
  }
`

function PlanV2() {
  const permissionsMap = useSelector((state) => state.user.permissionsMap)

  const match = useRouteMatch()
  const history = useHistory()
  const id = match.params.id

  const [basicInfo, setBasicInfo] = useState({})
  const [bizModeList, setBizModeList] = useState([])
  useRequest(() => {
    return axios.get('bi-data-quality/api/user/businessMode/findAllInfo').then(({ data }) => {
      setBizModeList(data.map((item) => ({ ...item, label: item.modeName, value: item.id })))
    })
  })

  const { run: getDetail } = useRequest(() => {
    return axios
      .get('/bi-data-quality/api/user/verificationScheme/findById', {
        params: { id },
      })
      .then(({ data }) => {
        setBasicInfo(data)
      })
  })

  const [currentRow, setCurrentRow] = useState(null)
  const [dataSourceList, setDataSourceList] = useState([])
  const datasourceListRef = useRef([])
  useRequest(() => {
    return axios.get('/bi-sys/api/user/datasourceConfig/findAllInfo').then(({ data }) => {
      const list = data.map((item) => ({ label: item.dbCnName, value: item.id }))
      setDataSourceList(list)
      datasourceListRef.current = list
      return data
    })
  })
  const cachedQueryString = sessionStorage.getItem(match.url)
  const [query, _setQuery] = useState({
    keyword: '',
    tempId: undefined,
    status: undefined,
    targetDatasourceId: undefined,
    problemLevel: undefined,
    ...(cachedQueryString ? JSON.parse(cachedQueryString) : {}),
  })

  const { table, setTable } = useTable({
    rowKey: 'id',
    scroll: { x: 1000 },
    columns: [
      {
        dataIndex: 'logStatus',
        title: '执行结果',
        align: 'center',
        width: 80,
        fixed: 'left',
        render(text, record) {
          return (
            <Tooltip title={'点击查看日志'}>
              <div
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  handleCheckLog(record)
                }}>
                {text === 1 ? (
                  <Tag color={'success'}>成功</Tag>
                ) : text === -1 ? (
                  <Tag color={'error'}>失败</Tag>
                ) : text === null ? (
                  <Tag color={'warning'}>暂无</Tag>
                ) : (
                  <Tag color={'processing'}>进行中</Tag>
                )}
              </div>
            </Tooltip>
          )
        },
      },
      { dataIndex: 'tempName', title: '规则模板' },
      { dataIndex: 'ruleName', title: '规则名称' },
      {
        dataIndex: 'problemLevel',
        title: '问题级别',
        align: 'center',
        render(text) {
          return <Rate value={text} allowHalf disabled style={{ fontSize: '12px', color: 'var(--secondary-color)' }} />
        },
        minWidth: 110,
      },
      { dataIndex: 'ruleDescription', title: '规则描述' },
      {
        dataIndex: 'dbCnName',
        title: '执行库',
        render(text, record) {
          return datasourceListRef.current.find((item) => item.value === record.targetDatasourceId)?.label
        },
      },
      {
        dataIndex: 'actions',
        title: '操作',
        fixed: 'right',
        width: 200,
        render(text, record) {
          const { ruleLogStatus } = record
          return (
            <CollapseButtons>
              {permissionsMap['bi-data-quality.VerificationRuleController.saveOrUpdate'] && (
                <Button type="link" size="small" onClick={() => editRule(record)}>
                  编辑
                </Button>
              )}
              {!permissionsMap['bi-data-quality.VerificationRuleController.saveOrUpdate'] &&
                permissionsMap['bi-data-quality.VerificationSchemeController.saveOrUpdate'] && (
                  <Button type="link" size="small" onClick={() => checkRule(record)}>
                    查看
                  </Button>
                )}
              {record.status === 1 && permissionsMap['bi-data-quality.VerificationRuleController.pause'] && (
                <Popconfirm title="确认停用吗？" onConfirm={() => toggleRuleStatus(record, 0)}>
                  <Button type="link" size="small" danger>
                    停用
                  </Button>
                </Popconfirm>
              )}
              {record.status === 0 && permissionsMap['bi-data-quality.VerificationRuleController.start'] && (
                <Popconfirm title="确认启用吗？" onConfirm={() => toggleRuleStatus(record, 1)}>
                  <Button type="link" size="small">
                    启用
                  </Button>
                </Popconfirm>
              )}
              {permissionsMap['bi-data-quality.VerificationRuleController.runRule'] && ruleLogStatus !== 0 && (
                <Popconfirm
                  title={`确定执行吗？`}
                  onConfirm={() => execRule(record)}
                  onCancel={(e) => e.stopPropagation()}>
                  <Button type="link" size="small" onClick={(e) => e.stopPropagation()}>
                    执行
                  </Button>
                </Popconfirm>
              )}
              {permissionsMap['bi-data-quality.VerificationRuleController.interruptRule'] && ruleLogStatus === 0 && (
                <Popconfirm
                  title={`确定中断吗？`}
                  onConfirm={() => interruptRule(record)}
                  onCancel={(e) => e.stopPropagation()}>
                  <Button type="link" size="small" onClick={(e) => e.stopPropagation()}>
                    中断
                  </Button>
                </Popconfirm>
              )}
              {permissionsMap['bi-data-quality.VerificationRuleController.saveOrUpdate'] && (
                <Button type={'link'} size={'small'} onClick={() => copyRecordToEdit(record)}>
                  复制
                </Button>
              )}
              {permissionsMap['bi-data-quality.VerificationRuleController.delInfo'] && (
                <Popconfirm
                  title={`确定删除吗？`}
                  onCancel={(e) => e.stopPropagation()}
                  onConfirm={(e) => {
                    e.stopPropagation()
                    deleteRule(record)
                  }}>
                  <Button type="link" size="small" danger onClick={(e) => e.stopPropagation()}>
                    删除
                  </Button>
                </Popconfirm>
              )}
            </CollapseButtons>
          )
        },
      },
    ],
  })

  const setQuery = useCallback(
      (params) => {
        setTable((prevState) => ({
          ...prevState,
          pagination: { ...prevState.pagination, current: 1 },
        }))
        _setQuery(params)
      },
      [_setQuery, setTable]
  )

  const cacheQuery = useEventCallback(() => {
    sessionStorage.setItem(match.url, JSON.stringify(query))
  }, [query])

  const { current: page, pageSize } = table.pagination
  const { run: getList, loading } = useRequest(
    () => {
      return axios
        .get('/bi-data-quality/api/user/verificationRule/selectRulesBySchemeId', {
          params: {
            schemeId: id,
            ...query,
            page,
            pageSize,
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

  const [tempList, setTempList] = useState([])
  const { run: getRuleTempList } = useRequest(() => {
    return axios
      .get('/bi-data-quality/api/user/verificationScheme/groupByTempRuleId', {
        params: { id },
      })
      .then(({ data }) => {
        setTempList(
          data.map((_) => ({
            tempName: _['TEMP_NAME'],
            id: _['TEMP_ID'],
            count: _['COUNT'],
            code: _['TEMP_CODE'],
          }))
        )
      })
  })

  useEffect(() => {
    getList()
    cacheQuery()
  }, [page, pageSize, query, getList, cacheQuery])

  const editRule = (record) => {
    history.push(`/dataQuality/plan/${id}/editRule/${record.id}`)
  }

  // for readonly
  const checkRule = (record) => {
    history.push(`/dataQuality/plan/${id}/checkRule/${record.id}`)
  }

  const addNewRule = () => {
    history.push(`/dataQuality/plan/${id}/editRule/new`)
  }

  const toggleRuleStatus = (record, status) => {
    let url = {
      0: '/bi-data-quality/api/admin/verificationRule/pause',
      1: '/bi-data-quality/api/admin/verificationRule/start',
    }[status]
    axios
      .get(url, {
        params: {
          id: record.id,
        },
      })
      .then(() => {
        message.success('修改成功')
        getList()
      })
  }

  const execRule = (record) => {
    axios
      .get('/bi-data-quality/api/admin/verificationRule/runRule', {
        params: {
          id: record.id,
        },
      })
      .then(() => {
        message.success('执行成功')
      })
  }

  const interruptRule = (record) => {
    axios
      .get('/bi-data-quality/api/admin/verificationRule/interruptRule', {
        params: {
          id: record.id,
        },
      })
      .then(() => {
        message.success('已中断')
      })
  }

  const copyRecordToEdit = (record) => {
    axios
      .get('/bi-data-quality/api/user/verificationRule/findById', {
        params: { id: record.id },
      })
      .then(({ data }) => {
        Modal.confirm({
          title: '复制成功!',
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
          content: '是否进入编辑页？',
          onOk: () => {
            history.push(`/dataQuality/plan/${id}/editRule/new`, {
              copiedValue: data,
            })
          },
        })
      })
  }

  const deleteRule = (record) => {
    axios
      .get('/bi-data-quality/api/admin/verificationRule/delInfo', {
        params: {
          id: record.id,
        },
      })
      .then(() => {
        message.success('删除成功')
        getList()
        getRuleTempList()
      })
  }

  const [refreshState, setRefreshState] = useState(false)
  const handleRefresh = () => {
    setRefreshState(true)
    getList().then(() => {
      setTimeout(() => {
        setRefreshState(false)
      }, 1000)
    })
  }

  const handleRuleTempClick = (item) => {
    let id
    if (item.id !== query.tempId) {
      id = item.id
    }
    setQuery((prevState) => ({
      ...prevState,
      tempId: id,
    }))
  }

  const [checkLogRecord, setCheckLogRecord] = useState(null)
  const handleCheckLog = (record) => {
    setCheckLogRecord({
      ...record,
      ruleId: record.id,
    })
  }

  return (
    <div style={{ background: 'var(--content-section-bg-color)' }}>
      <div className={'bg-white'}>
        <HeadTitle className={'p-6'}>{basicInfo.schemeName}</HeadTitle>
        <div className={'px-6 py-4'}>
          <div className={'flex justify-between mb-2.5'}>
            <SubTitle>基本信息</SubTitle>
            <div>
              <Button size={'small'} type={'link'} onClick={() => setCurrentRow(basicInfo)}>
                编辑
              </Button>
            </div>
          </div>

          <div className={'w-4/5 grid grid-cols-3 gap-2.5'} style={{ color: 'rgba(0,0,0,.65' }}>
            <div className={'flex justify-start '}>
              <span className={'flex-none'}>方案：</span>
              <span className={'flex-1'}> {basicInfo.schemeName}</span>
            </div>
            <div className={'flex justify-start'}>
              <span className={'flex-none'}>业务类型：</span>
              <span className={'flex-1'}>
                {bizModeList.find((item) => item.id === basicInfo.businessModeId)?.modeName}
              </span>
            </div>
            <div className={'flex justify-start'}>
              <span className={'flex-none'}>描述：</span>
              <OverflowTooltip>
                <span className={'flex-1'}>{basicInfo.description}</span>
              </OverflowTooltip>
            </div>
            <div className={'flex justify-start'}>
              <span className={'flex-none'}>创建者：</span>
              <span className={'flex-1'}>{basicInfo.createName || '-'}</span>
            </div>
            <div className={'flex justify-start'}>
              <span className={'flex-none'}>最后更新人：</span>
              <span className={'flex-1'}>{basicInfo.lastUpdateName || '-'}</span>
            </div>
            <div className={'flex justify-start'}>
              <span className={'flex-none'}>最后修改时间：</span>
              <span className={'flex-1'}>{basicInfo.updateDate || '-'}</span>
            </div>
            <div className={'flex justify-start'}>
              <span className={'flex-none'}>最新得分：</span>
              <span className={'flex-1'}>{basicInfo.lastScore}</span>
            </div>
          </div>
        </div>
      </div>

      <EditBasicInfoModal
        currentRow={currentRow}
        setCurrentRow={setCurrentRow}
        bizModeList={bizModeList}
        onSuccess={getDetail}
      />

      <div className={'mt-4 bg-white p-6'}>
        <SubTitle className={'mb-2.5'}>规则配置</SubTitle>

        <RulesWrapper className={'flex justify-start items-stretch'}>
          <div className={'left-side flex-none'} style={{ width: 180, borderRight: '1px solid #ebebeb' }}>
            <div style={{ height: 48, padding: 12, background: '#fafafa' }}>
              <span className={'mr-1'}>规则模板</span>
              <Tooltip title={'点击下方模板名称进行筛选，再次点击取消筛选'}>
                <ExclamationCircleOutlined />
              </Tooltip>
            </div>
            {tempList.map((item) => (
              <RuleTempItem
                className={'flex justify-start'}
                active={item.id === query.tempId}
                key={item.id}
                onClick={handleRuleTempClick.bind(null, item)}>
                <OverflowTooltip>{item.tempName}</OverflowTooltip>
                <span className={'flex-grow-0'}>（{item.count}）</span>
              </RuleTempItem>
            ))}
          </div>
          <div className={'flex-1 py-3 pl-4 min-w-0'}>
            <div className={'flex mb-3'}>
              <div className={'flex-1 grid grid-cols-4 gap-x-4'}>
                <div className={'flex'}>
                  <span className={'flex-none'}>关键字：</span>
                  <Input
                    value={query.keyword}
                    onChange={(e) => setQuery((prevState) => ({ ...prevState, keyword: e.target.value }))}
                    className={'flex-1'}
                    allowClear
                    placeholder={'关键字'}
                  />
                </div>
                <div className={'flex'}>
                  <span className={'flex-none'}>问题级别：</span>
                  <Select
                    className={'flex-1'}
                    value={query.problemLevel}
                    onChange={(value) => setQuery((prevState) => ({ ...prevState, problemLevel: value }))}
                    allowClear
                    placeholder="问题级别">
                    {Array(10)
                      .fill(null)
                      .map((item, index) => (
                        <Select.Option value={(10 - index) * 0.5} key={index}>
                          <Rate
                            value={(10 - index) * 0.5}
                            disabled
                            allowHalf
                            style={{ fontSize: 12, color: 'var(--secondary-color)' }}
                          />
                        </Select.Option>
                      ))}
                  </Select>
                </div>
                <div className={'flex'}>
                  <span className={'flex-none'}>状态：</span>
                  <Select
                    value={query.status}
                    onChange={(value) => setQuery((prevState) => ({ ...prevState, status: value }))}
                    className={'flex-1'}
                    placeholder="状态"
                    allowClear>
                    <Select.Option value={0}>停用</Select.Option>
                    <Select.Option value={1}>启用</Select.Option>
                  </Select>
                </div>
                <div className={'flex'}>
                  <span className={'flex-none'}>执行库：</span>
                  <ExSelect
                    value={query.targetDatasourceId}
                    onChange={(v) => setQuery((prevState) => ({ ...prevState, targetDatasourceId: v }))}
                    options={dataSourceList}
                    placeholder={'执行库'}
                    allowClear
                  />
                </div>
              </div>
              <div className={'flex-none ml-4 flex'}>
                {permissionsMap['bi-data-quality.VerificationRuleController.saveOrUpdate'] && (
                  <Button type={'primary'} onClick={addNewRule}>
                    新增
                  </Button>
                )}
                <RefreshIcon animate={refreshState} className={'mx-4 cursor-pointer text-base'} onClick={handleRefresh}>
                  <ReloadOutlined />
                </RefreshIcon>
              </div>
            </div>
            <Table {...table} loading={loading} />
          </div>
        </RulesWrapper>
      </div>

      <LogTableModal record={checkLogRecord} setRecord={setCheckLogRecord} />
    </div>
  )
}

export default PlanV2
