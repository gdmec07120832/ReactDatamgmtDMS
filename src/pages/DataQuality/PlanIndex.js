import React, { useCallback, useEffect, useState } from 'react'
import { Table, Button, Input, Popconfirm, message, Select, Space } from 'antd'

import { useHistory, useLocation } from 'react-router-dom'
import axios from '../../utils/axios'
import { useEventCallback } from '@material-ui/core'
import { useLastLocation } from 'react-router-last-location'
import OverflowTooltip from '../../components/OverflowTooltip'
import ExSelect from '../../components/Select'
import EditBasicInfoModal from './components/EditBasicInfoModal'
import { useRequest } from 'ahooks'
import useUserList from '../../hooks/useUserList'
import LogTableModal from './components/LogTableModal'
import { useSelector } from 'react-redux'

function PlanIndex() {
  const location = useLocation()
  const history = useHistory()
  const permissionsMap = useSelector((state) => state.user.permissionsMap)

  const userList = useUserList()
  const [table, setTable] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
      size: 'default',
      showTotal: (total) => `共${total}条记录`,
    },
    columns: [
      {
        dataIndex: 'schemeName',
        title: '方案名称',
        render: (text) => {
          return <OverflowTooltip>{text}</OverflowTooltip>
        },
      },
      { dataIndex: 'modelTypeName', title: '业务类型', align: 'center' },
      {
        dataIndex: 'createName',
        title: '创建者',
        align: 'center',
        render(text) {
          return text ?? '-'
        },
      },
      {
        dataIndex: 'lastUpdateName',
        title: '最后更新人',
        align: 'center',
        render(text) {
          return text ?? '-'
        },
      },
      {
        dataIndex: 'ruleLogStatus',
        title: '最新执行结果',
        align: 'center',
        render(text) {
          return { 0: '进行中', 1: '成功', 2: '规则未启用', '-1': '失败' }[text]
        },
      },
      {
        dataIndex: 'lastScore',
        title: '最新得分',
        align: 'center',
        render(text) {
          return text ?? '-'
        },
      },
      {
        dataIndex: 'action',
        title: '操作',
        align: 'center',
        width: 250,
        render(text, record) {
          return (
            <Space>
              {permissionsMap['bi-data-quality.VerificationSchemeController.saveOrUpdate'] && (
                <Button type={'link'} size={'small'} onClick={() => handleItemClick(record)}>
                  方案配置
                </Button>
              )}
              <Button type="link" size="small" onClick={() => showRecordLog(record)}>
                日志
              </Button>
              {permissionsMap['bi-data-quality.VerificationSchemeController.delInfo'] && (
                <Popconfirm placement={'topLeft'} title="确定删除吗？" onConfirm={() => deletePlanRow(record)}>
                  <Button type="text" size="small" danger>
                    删除
                  </Button>
                </Popconfirm>
              )}
            </Space>
          )
        },
      },
    ],
    dataSource: [],
  })

  const searchStatus = new URLSearchParams(location.search).get('status')
  let cachedQuery = window.sessionStorage.getItem(location.pathname)
  cachedQuery = cachedQuery ? JSON.parse(cachedQuery) : {}
  const lastLocation = useLastLocation()
  if (!(lastLocation && lastLocation.pathname && lastLocation.pathname.startsWith(location.pathname))) {
    cachedQuery = {}
  }

  const [query, _setQuery] = useState({
    keyword: '',
    businessModeId: undefined,
    lastUpdaterId: undefined,
    creatorId: undefined,
    ruleLogStatus: searchStatus ? Number(searchStatus) : undefined,
    ruleLogVerifyStatus: undefined,
    templateRuleId: undefined,
    ...cachedQuery,
  })

  const setQuery = useCallback(
    (params) => {
      setTable((prevState) => ({
        ...prevState,
        pagination: {
          ...prevState.pagination,
          current: 1,
        },
      }))
      _setQuery(params)
    },
    [_setQuery]
  )

  const handleItemClick = useEventCallback(
    (record) => {
      window.sessionStorage.setItem(location.pathname, JSON.stringify(query))
      history.push(`/dataQuality/plan/${record.id}`)
    },
    [query]
  )

  const [checkLogRow, setCheckLogRow] = useState(null)

  const showRecordLog = (record) => {
    setCheckLogRow({
      schemeId: record.id,
    })
  }

  const { current: currentPage, pageSize } = table.pagination
  const { run: getList, loading } = useRequest(
    () => {
      return axios
        .get('/bi-data-quality/api/admin/verificationScheme/queryPage', {
          params: {
            currentPage,
            pageSize,
            ...query,
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

  const deletePlanRow = (record) => {
    axios
      .get('/bi-data-quality/api/admin/verificationScheme/delInfo', {
        params: {
          id: record.id,
        },
      })
      .then(() => {
        message.success('删除成功')
        getList()
      })
  }

  const [bizModeList, setBizModeList] = useState([])
  useRequest(() => {
    return axios.get('bi-data-quality/api/user/businessMode/findAllInfo').then(({ data }) => {
      setBizModeList(data.map((item) => ({ ...item, label: item.modeName, value: item.id })))
    })
  })

  const [templateRuleList, setTemplateRuleList] = useState([])
  useRequest(() => {
    return axios
      .get('/bi-data-quality/api/admin/ruleTemplate/queryPage', {
        params: {
          pageSize: 999,
          page: 1,
        },
      })
      .then(({ data: { list } }) => {
        setTemplateRuleList(
          list.map((item) => {
            return {
              ...item,
              value: item.id,
              label: item.tempName,
            }
          })
        )
      })
  })

  useEffect(() => {
    getList()
  }, [currentPage, pageSize, query, getList])

  const handleTableChange = ({ current, pageSize }) => {
    setTable((prevState) => ({ ...prevState, pagination: { ...prevState.pagination, current, pageSize } }))
  }

  const [currentRow, setCurrentRow] = useState(null)

  return (
    <div className={'p-6'}>
      <div className="flex items-start space-x-2.5 mb-2.5">
        <div className={'flex-1 grid grid-cols-4 gap-x-6 gap-y-2.5'}>
          <div className={'flex'}>
            <span className={'flex-none w-20'}>关键字</span>
            <Input
              placeholder="名称、描述、脚本"
              className={'flex-1'}
              value={query.keyword}
              allowClear
              onChange={(e) => setQuery((prevState) => ({ ...prevState, keyword: e.target.value }))}
            />
          </div>
          <div className={'flex'}>
            <span className={'flex-none w-20'}>业务类型</span>
            <ExSelect
              className={'flex-1'}
              options={bizModeList.map((item) => ({ label: item.modeName, value: item.id }))}
              allowClear
              placeholder={'业务类型'}
              onChange={(v) => setQuery((prevState) => ({ ...prevState, businessModeId: v }))}
              value={query.businessModeId}
            />
          </div>
          <div className={'flex'}>
            <span className={'flex-none w-20'}>创建者</span>
            <ExSelect
              options={userList.map((item) => ({ label: item.nameCn, value: item.idUser }))}
              className={'flex-1'}
              placeholder="创建者"
              allowClear
              value={query.creatorId}
              onChange={(v) => {
                setQuery((prevState) => ({ ...prevState, creatorId: v }))
              }}
            />
          </div>
          <div className={'flex'}>
            <span className={'flex-none w-20'}>更新人</span>
            <ExSelect
              options={userList.map((item) => ({ label: item.nameCn, value: item.idUser }))}
              className={'flex-1'}
              placeholder="最后更新人"
              allowClear
              value={query.lastUpdaterId}
              onChange={(v) => {
                setQuery((prevState) => ({ ...prevState, lastUpdaterId: v }))
              }}
            />
          </div>

          <div className={'flex'}>
            <span className={'flex-none w-20'}>执行结果</span>
            <Select
              value={query.ruleLogStatus}
              onChange={(v) => setQuery((prevState) => ({ ...prevState, ruleLogStatus: v }))}
              className={'flex-1'}
              placeholder="规则执行结果"
              allowClear>
              <Select.Option value={0}>执行中</Select.Option>
              <Select.Option value={1}>成功</Select.Option>
              <Select.Option value={-1}>失败</Select.Option>
            </Select>
          </div>
          <div className={'flex'}>
            <span className={'flex-none w-20'}>校验结果</span>
            <Select
              value={query.ruleLogVerifyStatus}
              onChange={(v) => setQuery((prevState) => ({ ...prevState, ruleLogVerifyStatus: v }))}
              className={'flex-1'}
              placeholder="规则校验结果"
              allowClear>
              <Select.Option value={1}>成功</Select.Option>
              <Select.Option value={-1}>失败</Select.Option>
            </Select>
          </div>
          <div className={'flex'}>
            <span className={'flex-none w-20'}>规则模板</span>
            <ExSelect
              value={query.templateRuleId}
              onChange={(v) => setQuery((prevState) => ({ ...prevState, templateRuleId: v }))}
              allowClear
              placeholder={'规则模板'}
              options={templateRuleList}
            />
          </div>
        </div>
        {permissionsMap['bi-data-quality.VerificationSchemeController.saveOrUpdate'] && (
          <Button
            type="primary"
            onClick={() => {
              setCurrentRow({})
            }}>
            新增
          </Button>
        )}
      </div>
      <Table {...table} loading={loading} size="small" tableLayout={'fixed'} rowKey="id" onChange={handleTableChange} />
      <LogTableModal record={checkLogRow} setRecord={setCheckLogRow} />
      <EditBasicInfoModal
        currentRow={currentRow}
        setCurrentRow={setCurrentRow}
        bizModeList={bizModeList}
        onSuccess={getList}
      />
    </div>
  )
}

export default PlanIndex
