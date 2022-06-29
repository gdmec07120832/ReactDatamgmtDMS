import React, { useEffect, useRef, useState } from 'react'
import {
  Button,
  Checkbox,
  Col,
  Empty,
  Input,
  InputNumber,
  message,
  Radio,
  Row,
  Select,
  TimePicker,
  TreeSelect,
} from 'antd'
import styles from './indicatorCreatePage.module.less'
import { CloseOutlined, InfoCircleOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons'
import axios from '../../../../utils/axios'
import { useHistory, useLocation, useRouteMatch } from 'react-router-dom'
import findDeep from 'deepdash/es/findDeep'
import moment from 'moment'
import DebounceSelect from '../../../../components/DebounceSelect/DebounceSelect'
import { Tooltip } from '@material-ui/core'

function RefreshRate(props) {
  let { innerRef, initExCycleForm, disabled } = props
  const [form, setForm] = useState({
    exCycle: 0,
    timeInterval: undefined,
    timeIntervalUnit: undefined,
    dayOfWeek: undefined,
    dayOfMonth: [],
    monthOfYear: [],
    diyExCycle: '',
    timeOfDayList: [],
  })

  const handleDayTime = () => {
    setForm((prevState) => ({
      ...prevState,
      timeOfDayList: [
        ...prevState.timeOfDayList,
        {
          value: '',
          key: Math.random().toString(36).slice(-8),
        },
      ],
    }))
  }

  const handleTimeValueChange = (time, item) => {
    setForm((prevState) => {
      const index = prevState.timeOfDayList.findIndex((_) => {
        return _.key === item.key
      })
      const arr = [...prevState.timeOfDayList]
      arr.splice(index, 1, {
        ...prevState.timeOfDayList[index],
        value: time,
      })
      return {
        ...prevState,
        timeOfDayList: arr,
      }
    })
  }

  const handleDayTimeDelete = (item) => {
    setForm((prevState) => {
      const index = prevState.timeOfDayList.findIndex((_) => {
        return _.key === item.key
      })
      const arr = [...prevState.timeOfDayList]
      arr.splice(index, 1)
      return {
        ...prevState,
        timeOfDayList: arr,
      }
    })
  }
  useEffect(() => {
    const { dayOfMonth, monthOfYear, timeOfDay } = initExCycleForm
    setForm((prevState) => ({
      ...prevState,
      ...initExCycleForm,
      timeOfDayList: timeOfDay
        ? timeOfDay.split(',').map((time) => ({
            value: moment(time, 'HH:mm:ss'),
            key: Math.random().toString(36).slice(-8),
          }))
        : [],
      dayOfMonth: dayOfMonth ? dayOfMonth.split(',') : [],
      monthOfYear: monthOfYear ? monthOfYear.split(',') : [],
    }))
  }, [initExCycleForm])
  useEffect(() => {
    innerRef.current = form
  }, [form, innerRef])

  useEffect(() => {
    if (form.timeOfDayList.length && (form.timeInterval || form.timeIntervalUnit)) {
      setForm((prevState) => ({ ...prevState, timeInterval: undefined, timeIntervalUnit: undefined }))
    }
  }, [form.timeOfDayList, form.timeInterval, form.timeIntervalUnit])
  return (
    <>
      <div>
        <div className={'flex flex-start'}>
          <div className={'mr20 text-right'} style={{ flex: '0 0 100px' }}>
            执行周期:
          </div>
          <div>
            <Radio.Group
              value={form.exCycle}
              onChange={(e) => setForm((prevState) => ({ ...prevState, exCycle: e.target.value }))}
              disabled={disabled}>
              <Radio.Button value={0}>每天</Radio.Button>
              <Radio.Button value={1}>每周</Radio.Button>
              <Radio.Button value={2}>每月</Radio.Button>
              <Radio.Button value={3}>每年</Radio.Button>
              <Radio.Button value={4}>自定义</Radio.Button>
            </Radio.Group>
          </div>
        </div>
        {form.exCycle === 0 ? (
          <>
            <div className={'flex flex-start mt10'}>
              <div className={'mr20 text-right'} style={{ flex: '0 0 100px' }}>
                每天定时:
              </div>
              <div>
                {form.timeOfDayList.map((item) => {
                  return (
                    <div style={{ display: 'inline-block', margin: '0 10px 10px 0' }} key={item.key}>
                      <TimePicker
                        value={item.value}
                        disabled={disabled}
                        onChange={(time) => handleTimeValueChange(time, item)}
                      />
                      <Button
                        onClick={() => handleDayTimeDelete(item)}
                        disabled={disabled}
                        size={'small'}
                        danger
                        icon={<MinusOutlined />}
                        shape={'circle'}
                        className="ml10"
                      />
                    </div>
                  )
                })}
                <Button
                  onClick={handleDayTime}
                  type={'primary'}
                  disabled={disabled}
                  icon={<PlusOutlined />}
                  shape={'circle'}
                  size={'small'}
                />
              </div>
            </div>
            <div className={'flex flex-start mt10'}>
              <div className={'mr20 text-right'} style={{ flex: '0 0 100px' }}>
                时间间隔:
              </div>
              <Input.Group compact style={{ flex: '0 0 180px' }}>
                <InputNumber
                  value={form.timeInterval}
                  disabled={form.timeOfDayList.length || disabled}
                  onChange={(v) => setForm((prevState) => ({ ...prevState, timeInterval: v }))}
                  min={1}
                  placeholder={'间隔'}
                />
                <Select
                  value={form.timeIntervalUnit}
                  disabled={form.timeOfDayList.length || disabled}
                  onChange={(v) => setForm((prevState) => ({ ...prevState, timeIntervalUnit: v }))}
                  style={{ width: 80 }}
                  placeholder={'单位'}>
                  <Select.Option value={2}>小时</Select.Option>
                  <Select.Option value={1}>分钟</Select.Option>
                  <Select.Option value={0}>秒</Select.Option>
                </Select>
              </Input.Group>
              {form.timeOfDayList.length ? null : (
                <Button
                  type={'link'}
                  onClick={() => {
                    setForm((prevState) => ({ ...prevState, timeInterval: undefined, timeIntervalUnit: undefined }))
                  }}
                  disabled={disabled}>
                  清空
                </Button>
              )}
            </div>
          </>
        ) : null}
        {form.exCycle === 1 ? (
          <div className={'flex flex-start mt10'}>
            <div className={'mr20 text-right'} style={{ flex: '0 0 100px' }}>
              星期:
            </div>
            <Select
              value={form.dayOfWeek}
              disabled={disabled}
              onChange={(v) => setForm((prevState) => ({ ...prevState, dayOfWeek: v }))}
              style={{ width: '50%' }}
              placeholder={'星期'}>
              <Select.Option value={1}>一</Select.Option>
              <Select.Option value={2}>二</Select.Option>
              <Select.Option value={3}>三</Select.Option>
              <Select.Option value={4}>四</Select.Option>
              <Select.Option value={5}>五</Select.Option>
              <Select.Option value={6}>六</Select.Option>
              <Select.Option value={7}>天</Select.Option>
            </Select>
          </div>
        ) : null}

        {form.exCycle === 2 ? (
          <div className={'flex flex-start mt10'}>
            <div className={'mr20 text-right'} style={{ flex: '0 0 100px' }}>
              每月:
            </div>
            <Select
              value={form.dayOfMonth}
              onChange={(v) => setForm((prevState) => ({ ...prevState, dayOfMonth: v }))}
              disabled={disabled}
              style={{ width: '50%' }}
              placeholder={'每月xx号'}
              mode={'multiple'}>
              {Array(31)
                .fill(null)
                .map((_, index) => {
                  return (
                    <Select.Option value={index + 1} key={index}>
                      {index + 1}
                    </Select.Option>
                  )
                })}
            </Select>
            &nbsp;号
          </div>
        ) : null}

        {form.exCycle === 3 ? (
          <div className={'flex flex-start mt10'}>
            <div className={'mr20 text-right'} style={{ flex: '0 0 100px' }}>
              每年:
            </div>
            <Select
              value={form.monthOfYear}
              onChange={(v) => setForm((prevState) => ({ ...prevState, monthOfYear: v }))}
              disabled={disabled}
              style={{ width: '50%' }}
              placeholder={'每年xx月'}
              mode={'multiple'}>
              {Array(12)
                .fill(null)
                .map((_, index) => {
                  return (
                    <Select.Option value={index + 1} key={index}>
                      {index + 1}
                    </Select.Option>
                  )
                })}
            </Select>
            &nbsp;月
          </div>
        ) : null}

        {form.exCycle === 4 ? (
          <div className={'flex flex-start mt10'}>
            <div className={'mr20 text-right'} style={{ flex: '0 0 100px' }}>
              自定义:
            </div>
            <Input.TextArea
              value={form.diyExCycle}
              disabled={disabled}
              onChange={(e) => setForm((prevState) => ({ ...prevState, diyExCycle: e.target.value }))}
              style={{ flex: 1 }}
              placeholder={'自定义数据刷新频率'}
              maxLength={200}
              showCount
            />
          </div>
        ) : null}
      </div>
    </>
  )
}

const fetchTableFieldList = (keyword) => {
  return axios
    .get('/bi-metadata/api/user/kpiNode/listAllDBTable', {
      params: {
        keyword,
        page: 1,
        pageSize: 100,
      },
    })
    .then(({ data: { list } }) => {
      return list.map((_) => ({
        label: _['fieldExpression'],
        value: _['fieldExpression'],
      }))
    })
}

function IndicatorCreatePage() {
  const location = useLocation()
  const match = useRouteMatch()
  const [isAuditing, setIsAuditing] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [treeList, setTreeList] = useState([])
  const [datasourceList, setDatasourceList] = useState([])
  const [dimensionList, setDimensionList] = useState([])
  const fetchDataById = (id) => {
    axios
      .get('/bi-metadata/api/user/kpiNode/selectById', {
        params: { id },
      })
      .then(({ data }) => {
        setIsAuditing(() => data['isPendingAudit'] === 1)
        let { scopeOfRefreshType } = data
        let scopeOfRefreshTypeExtra
        if ([1, 2, 3].includes(scopeOfRefreshType)) {
          scopeOfRefreshTypeExtra = scopeOfRefreshType
          scopeOfRefreshType = 1
        }
        setForm((prevState) => ({
          ...prevState,
          uuid: data.uuid,
          id: data.id,
          biMenuIds: data.biMenuIds,
          fieldExpressions: data.fieldExpressions,
          parentUuid: data.parentUuid,
          nodeName: data.nodeName,
          nodeType: data.nodeType,
          calcFormula: data.calcFormula,
          kpiDcrp: data.kpiDcrp,
          kpiDataDcrp: data.kpiDataDcrp,
          dataSourceIdList: data.dataSourceIdList,
          filterCondition: data.filterCondition,
          scopeOfRefreshType: scopeOfRefreshType,
          scopeOfRefreshTypeExtra,
          scopeOfRefreshValue: data.scopeOfRefreshValue,
          dimensionSelected: data.kpiAndDimRels.map((_) => ({
            id: _.dimensionId,
            label: _['dimensionName'],
            value: _['dimensionValue'],
          })),
        }))
        setInitExCycleForm(() => ({
          exCycle: data.exCycle,
          timeOfDay: data.timeOfDay,
          timeInterval: data.timeInterval,
          timeIntervalUnit: data.timeIntervalUnit,
          dayOfMonth: data.dayOfMonth,
          monthOfYear: data.monthOfYear,
          dayOfWeek: data.dayOfWeek,
          diyExCycle: data.diyExCycle,
        }))
      })
  }
  useEffect(() => {
    const isUpdate = location.pathname.indexOf('update') > -1
    const isView = location.pathname.indexOf('check') > -1
    const isCreate = location.pathname.indexOf('create') > -1

    if (isView || isUpdate) {
      const id = match?.params.id
      if (id) {
        fetchDataById(id)
      }
      if (isView) {
        setDisabled(true)
      }
    }

    if (isCreate) {
      const defaultUUID = sessionStorage.getItem('metadata-defaultParentNodeUUID')
      if (defaultUUID) {
        setForm((prevState) => ({ ...prevState, parentUuid: defaultUUID }))
      }
    }
  }, [location.pathname, match])
  useEffect(() => {
    axios
      .get('/bi-metadata/api/user/kpiNode/listNodeTree', {
        params: {
          parentUUID: '-1',
        },
      })
      .then(({ data }) => {
        const func = (list, parentPath = []) => {
          list.forEach((item) => {
            item.value = item.uuid
            item.title = item.nodeName
            item.key = item.uuid
            item.parentPath = parentPath
            item.__level__ = item.parentPath.length
            item.disabled = item.nodeType === 2 ? true : item.__level__ < 1
            item.showName = parentPath.concat(item.title).join('/')
            if (item.children) {
              func(item.children, item.parentPath.concat(item.title))
            }
          })
          return list
        }
        setTreeList(func(data))
      })
  }, [])
  useEffect(() => {
    axios.get('/bi-metadata/api/user/dataSource/listAllStarted').then(({ data }) => {
      setDatasourceList(data)
    })
  }, [])

  useEffect(() => {
    axios.get('/bi-metadata/api/user/dimension/listAllStarted').then(({ data }) => {
      setDimensionList(data)
    })
  }, [])

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
  const [form, setForm] = useState({
    /**
     * @member {string}
     */
    parentUuid: undefined,
    nodeName: '',
    nodeType: 1,
    businessAscertainer: '',
    kpiDcrp: '',
    kpiDataDcrp: '',
    calcFormula: '',
    biMenuIds: [],
    fieldExpressions: [],
    dataSourceIdList: [],
    filterCondition: '',
    dimensionSelected: [],
    scopeOfRefreshType: 0,
    scopeOfRefreshValue: '',
  })
  const [initExCycleForm, setInitExCycleForm] = useState({})
  const refreshFormRef = useRef({})
  const history = useHistory()
  const handleSubmit = () => {
    let {
      id,
      uuid,
      calcFormula,
      parentUuid,
      nodeName,
      nodeType,
      kpiDcrp,
      kpiDataDcrp,
      biMenuIds,
      fieldExpressions,
      dataSourceIdList,
      filterCondition,
      scopeOfRefreshType,
      scopeOfRefreshValue,
      dimensionSelected,
      businessAscertainer,
    } = form
    const { exCycle, timeOfDayList, timeInterval, timeIntervalUnit, diyExCycle, dayOfWeek, dayOfMonth, monthOfYear } =
      refreshFormRef.current
    if (scopeOfRefreshType === 1) {
      scopeOfRefreshType = form.scopeOfRefreshTypeExtra || 1
    }
    axios
      .post('/bi-metadata/api/admin/kpiNode/insertOrUpdate', {
        id,
        uuid,
        parentUuid,
        nodeName,
        nodeType,
        calcFormula,
        kpiDcrp,
        kpiDataDcrp,
        biMenuIds,
        fieldExpressions,
        dataSourceIdList,
        kpiAndDimRels: dimensionSelected.map((item) => ({
          dimensionId: item.id,
          dimensionValue: item.value,
        })),
        filterCondition,
        exCycle,
        timeIntervalUnit,
        timeInterval,
        timeOfDay: timeOfDayList.map((_) => _.value.format('HH:mm:ss')).toString(),
        diyExCycle,
        dayOfWeek,
        dayOfMonth: dayOfMonth.toString(),
        monthOfYear: monthOfYear.toString(),
        scopeOfRefreshType,
        scopeOfRefreshValue,
        businessAscertainer,
      })
      .then(() => {
        message.success('提交成功')
        history.push('/metaData/metricsSys/metricsDesign')
      })
  }

  const handleBack = () => {
    history.go(-1)
  }

  const [parentNodeType, setParentNodeType] = useState(null)
  useEffect(() => {
    const item = findDeep(
      treeList,
      (value, key, parentValue, context) => {
        return value.uuid === form.parentUuid
      },
      {
        childrenPath: ['children'],
      }
    )
    const node = item?.value
    if (node) {
      const parentNodeType = node.nodeType
      setParentNodeType(parentNodeType)
      // 0 逻辑 1 原子 2 派生
      if (parentNodeType === 0) {
        // 逻辑节点子节点 只能是原子指标
        setForm((prevState) => ({ ...prevState, nodeType: 1 }))
      }
      if (parentNodeType === 1) {
        // 原子节点的子节点 只能是派生指标
        setForm((prevState) => ({ ...prevState, nodeType: 2 }))
      }

      if (parentNodeType === 2) {
        // 派生指标的子节点 只能是派生指标
        setForm((prevState) => ({ ...prevState, nodeType: 2 }))
      }
    }
  }, [form.parentUuid, treeList])

  const removeSelectedDimensionItem = (item) => {
    const index = form.dimensionSelected.findIndex((selected) => selected.id === item.id)
    if (index > -1) {
      setForm((prev) => {
        return {
          ...prev,
          dimensionSelected: [...form.dimensionSelected.slice(0, index), ...form.dimensionSelected.slice(index + 1)],
        }
      })
    }
  }

  return (
    <div className={styles.pageWrapper}>
      {isAuditing ? (
        <div className={styles.auditStatus}>
          <div>审核中</div>
        </div>
      ) : null}

      <Row className={'mb-4'}>
        <div className={styles.sectionHead}>
          <div className={styles.headTitle}>指标基本信息</div>
        </div>
        <div style={{ width: '100%', marginTop: 20 }}>
          <Row justify={'space-between'}>
            <Col span={11} style={{ paddingRight: '2%' }}>
              <div className={styles.formItem}>
                <span className={`${styles.formLabel} required`}>上级节点:</span>
                <div className={styles.formField} style={{ maxWidth: 'calc(100% - 120px)' }}>
                  <div className={'flex justify-start'}>
                    <TreeSelect
                        style={{ width: '100%', minWidth: 0 }}
                        value={form.parentUuid}
                        onChange={(v) => setForm((prevState) => ({ ...prevState, parentUuid: v }))}
                        treeNodeLabelProp="showName"
                        placeholder="请选择上级节点"
                        treeData={treeList}
                        disabled={disabled}
                    />
                    <Tooltip title={'上级节点只能选择【业务过程】或【原子指标】'}>
                      <InfoCircleOutlined className={'ml-2 text-gray-500'} />
                    </Tooltip>
                  </div>
                </div>
              </div>
              <div className={styles.formItem}>
                <span className={`${styles.formLabel} required`}>指标名称:</span>
                <div className={styles.formField}>
                  <Input
                    value={form.nodeName}
                    placeholder="指标名称"
                    onChange={(e) => setForm((prevState) => ({ ...prevState, nodeName: e.target.value }))}
                    disabled={disabled}
                    maxLength={20}
                  />
                </div>
              </div>
              <div className={styles.formItem}>
                <span className={styles.formLabel}>指标性质:</span>
                <div className={styles.formField} style={{ lineHeight: '32px' }}>
                  <Radio.Group
                    value={form.nodeType}
                    onChange={(e) => setForm((prevState) => ({ ...prevState, nodeType: e.target.value }))}
                    disabled={disabled}>
                    <Radio value={1} disabled={parentNodeType === 1 || parentNodeType === 2}>
                      原子指标
                    </Radio>
                    <Radio value={2} disabled={parentNodeType === 0}>
                      派生指标
                    </Radio>
                  </Radio.Group>
                </div>
              </div>
              <div className={styles.formItem}>
                <span className={styles.formLabel}>计算公式:</span>
                <div className={styles.formField}>
                  <Input.TextArea
                    value={form.calcFormula}
                    placeholder="计算公式"
                    onChange={(e) => setForm((prevState) => ({ ...prevState, calcFormula: e.target.value }))}
                    disabled={disabled}
                    maxLength={200}
                    showCount
                  />
                </div>
              </div>
              <div className={styles.formItem}>
                <span className={styles.formLabel}>业务确定人</span>
                <div className={styles.formField}>
                  <Input
                    placeholder={'业务确定人'}
                    value={form.businessAscertainer}
                    onChange={(e) => setForm((prevState) => ({ ...prevState, businessAscertainer: e.target.value }))}
                    disabled={disabled}
                    maxLength={20}
                  />
                </div>
              </div>
              <div className={styles.formItem}>
                <span className={styles.formLabel}>指标业务描述:</span>
                <div className={styles.formField}>
                  <Input.TextArea
                    value={form.kpiDcrp}
                    placeholder="指标业务描述"
                    onChange={(e) => setForm((prevState) => ({ ...prevState, kpiDcrp: e.target.value }))}
                    disabled={disabled}
                    maxLength={500}
                    showCount
                  />
                </div>
              </div>
              <div className={styles.formItem}>
                <span className={styles.formLabel}>指标取数口径:</span>
                <div className={styles.formField}>
                  <Input.TextArea
                    value={form.kpiDataDcrp}
                    placeholder="指标取数口径"
                    onChange={(e) => setForm((prevState) => ({ ...prevState, kpiDataDcrp: e.target.value }))}
                    disabled={disabled}
                    maxLength={500}
                    showCount
                  />
                </div>
              </div>
              <div className={styles.formItem}>
                <span className={styles.formLabel}>数据来源:</span>
                <div className={styles.formField}>
                  <Select
                    style={{ width: '100%' }}
                    getPopupContainer={(dom) => dom}
                    value={form.dataSourceIdList}
                    onChange={(v) => setForm((prevState) => ({ ...prevState, dataSourceIdList: v }))}
                    filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                    placeholder="数据来源"
                    mode="multiple"
                    disabled={disabled}>
                    {datasourceList.map((item) => (
                      <Select.Option value={item.id} key={item.id}>
                        {item['sourceName']}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className={styles.formItem}>
                <span className={styles.formLabel}>过滤条件:</span>
                <div className={styles.formField}>
                  <Input.TextArea
                    value={form.filterCondition}
                    onChange={(e) =>
                      setForm((prevState) => ({
                        ...prevState,
                        filterCondition: e.target.value,
                      }))
                    }
                    placeholder="过滤条件"
                    disabled={disabled}
                    maxLength={500}
                    showCount
                  />
                </div>
              </div>
              <div className={styles.formItem}>
                <span className={styles.formLabel}>涉及的报表:</span>
                <div className={styles.formField}>
                  <TreeSelect
                    value={form.biMenuIds}
                    getPopupContainer={(dom) => dom}
                    onChange={(v) => setForm((prevState) => ({ ...prevState, biMenuIds: v }))}
                    treeData={biMenusTree}
                    style={{ width: '100%' }}
                    treeCheckable
                    disabled={disabled}
                    filterTreeNode={(search, item) => {
                      return item.title.toLowerCase().indexOf(search.toLowerCase()) >= 0
                    }}
                    placeholder={'涉及的报表'}
                  />
                </div>
              </div>
              <div className={styles.formItem}>
                <span className={styles.formLabel}>对应的模型:</span>
                <div className={styles.formField}>
                  <DebounceSelect
                    value={form.fieldExpressions}
                    onChange={(v) => setForm((prevState) => ({ ...prevState, fieldExpressions: v }))}
                    style={{ width: '100%' }}
                    disabled={disabled}
                    mode={'multiple'}
                    fetchOptions={fetchTableFieldList}
                    placeholder={'对应的模型'}
                  />
                </div>
              </div>
            </Col>
            <Col span={12}>
              <div className="flex" style={{ alignItems: 'flex-start' }}>
                <div
                  className={'border rounded border-gray-300 border-solid'}
                  style={{ width: 200, flex: '0 0 200px' }}>
                  <div
                    className={'flex justify-between px-3.5 border-b border-gray-300'}
                    style={{ lineHeight: '42px', borderBottomStyle: 'solid' }}>
                    <span className={'font-bold'}>维度选择</span>
                    <span>
                      {form.dimensionSelected?.length || 0} / {dimensionList.length}条
                    </span>
                  </div>
                  <div className={styles.dimensionWrapper}>
                    <Checkbox.Group
                      value={form.dimensionSelected.map((_) => _.id)}
                      onChange={(v) =>
                        setForm((prevState) => ({
                          ...prevState,
                          dimensionSelected: dimensionList
                            .filter((_) => v.includes(_.id))
                            .map((item) => {
                              const old = prevState.dimensionSelected.find((_) => _.id === item.id)
                              return old
                                ? old
                                : {
                                    id: item.id,
                                    value: '',
                                    label: dimensionList.find((_) => _.id === item.id)['dimensionName'],
                                  }
                            }),
                        }))
                      }
                      disabled={disabled}>
                      {dimensionList.map((item) => (
                        <div key={item.id}>
                          <Checkbox value={item.id}>{item['dimensionName']}</Checkbox>
                        </div>
                      ))}
                    </Checkbox.Group>
                  </div>
                </div>
                <div
                  style={{ flex: 1, marginLeft: 10, height: 729 }}
                  className={'border rounded border-gray-300 border-solid'}>
                  <div
                    style={{ lineHeight: '42px' }}
                    className={'font-bold px-3.5 border-0 border-b border-gray-300 border-solid'}>
                    维度取值
                  </div>
                  <div style={{ maxHeight: 683, overflow: 'auto' }}>
                    {form.dimensionSelected.length ? (
                      form.dimensionSelected.map((item, index) => {
                        return (
                          <div className={styles.dimensionItem} key={item.id}>
                            {!disabled && (
                              <span
                                onClick={() => removeSelectedDimensionItem(item)}
                                className={'mr-1 cursor-pointer'}
                                style={{ color: 'rgba(0, 0, 0, .65)' }}>
                                <CloseOutlined />
                              </span>
                            )}
                            <div className={styles.dimensionItemLabel}>{item['label']}:</div>
                            <div className={styles.dimensionField}>
                              <Input
                                disabled={disabled}
                                maxLength={20}
                                value={item.value}
                                onChange={(e) => {
                                  const listData = [...form.dimensionSelected]
                                  setForm((prevState) => {
                                    return {
                                      ...prevState,
                                      dimensionSelected: listData.map((field, idx) =>
                                        idx === index
                                          ? {
                                              ...field,
                                              value: e.target.value,
                                            }
                                          : field
                                      ),
                                    }
                                  })
                                }}
                              />
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请先从左侧选择维度" />
                    )}
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </Row>

      <div className={styles.sectionHead}>
        <div className={styles.headTitle}>数据刷新信息</div>
      </div>
      <Row justify={'space-between'}>
        <Col span={11} style={{ paddingRight: '2%' }}>
          <div className={'leading-4 py-4 font-bold'}>数据刷新频率</div>
          <RefreshRate innerRef={refreshFormRef} initExCycleForm={initExCycleForm} disabled={disabled} />
        </Col>
        <Col span={12}>
          <div className={'leading-4 py-4 font-bold'}>数据刷新范围</div>
          <div>
            <Radio.Group
              className={styles.radio1}
              value={form.scopeOfRefreshType}
              style={{ width: '100%' }}
              onChange={(e) =>
                setForm((prevState) => ({
                  ...prevState,
                  scopeOfRefreshType: e.target.value,
                  scopeOfRefreshValue: '',
                }))
              }
              disabled={disabled}>
              <Radio value={0}>全量刷新</Radio>
              <div className={'mb5'} />
              <div className={'flex justify-start'}>
                <Radio value={1} className={'mr-0'}>
                  <span className={'mr-1'}>前</span>
                  <InputNumber
                    value={[1, 2, 3].includes(form.scopeOfRefreshType) ? form.scopeOfRefreshValue : ''}
                    onChange={(v) =>
                      setForm((prevState) => ({
                        ...prevState,
                        scopeOfRefreshValue: v,
                      }))
                    }
                    min={1}
                    disabled={![1, 2, 3].includes(form.scopeOfRefreshType) || disabled}
                    style={{ width: 80 }}
                  />
                </Radio>
                {[1, 2, 3].includes(form.scopeOfRefreshType) ? (
                  <Select
                    value={form.scopeOfRefreshTypeExtra}
                    onChange={(v) =>
                      setForm((prev) => ({
                        ...prev,
                        scopeOfRefreshTypeExtra: v,
                      }))
                    }
                    style={{ width: 80 }}
                    disabled={![1, 2, 3].includes(form.scopeOfRefreshType) || disabled}>
                    <Select.Option value={1}>天</Select.Option>
                    <Select.Option value={2}>月</Select.Option>
                    <Select.Option value={3}>年</Select.Option>
                  </Select>
                ) : (
                  <Select style={{ width: 80 }} disabled />
                )}

                <div style={{ fontSize: 14, marginLeft: 4 }}>至今</div>
              </div>
              <div className={'mb5'} />
              <Radio value={4}>本月</Radio>
              <Radio value={5}>上月</Radio>
              <Radio value={6}>
                次月
                <InputNumber
                  value={form.scopeOfRefreshType === 6 ? form.scopeOfRefreshValue : ''}
                  min={1}
                  max={31}
                  onChange={(v) =>
                    setForm((prevState) => ({
                      ...prevState,
                      scopeOfRefreshValue: v,
                    }))
                  }
                  disabled={form.scopeOfRefreshType !== 6 || disabled}
                  style={{ width: 80, margin: '0 5px' }}
                />
                号冻结
              </Radio>
              <br />
              <div className={'flex justify-start items-start mt-2'}>
                <Radio value={7}>自定义</Radio>
                {form.scopeOfRefreshType === 7 && (
                  <Input.TextArea
                    className={'flex-1'}
                    value={form.scopeOfRefreshType === 7 ? form.scopeOfRefreshValue : ''}
                    placeholder={'自定义数据刷新范围'}
                    onChange={(e) =>
                      setForm((prevState) => ({
                        ...prevState,
                        scopeOfRefreshValue: e.target.value,
                      }))
                    }
                    rows={2}
                    disabled={disabled}
                    maxLength={200}
                    showCount
                  />
                )}
              </div>
            </Radio.Group>
          </div>
        </Col>
      </Row>
      <div className={'mt20'} style={{ textAlign: 'center' }}>
        {disabled ? null : (
          <Button type={'primary'} className={'mr10'} onClick={handleSubmit}>
            提交审批
          </Button>
        )}
        <Button onClick={handleBack}>返回</Button>
      </div>
    </div>
  )
}

export default IndicatorCreatePage
