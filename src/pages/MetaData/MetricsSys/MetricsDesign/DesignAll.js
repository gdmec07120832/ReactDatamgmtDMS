import React, { useEffect, useRef, useState } from 'react'
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd'
import { Button, Empty, Form, Input, message, Modal, Select, Spin, Tabs, Upload } from 'antd'
import axios from '../../../../utils/axios'
import { makeStyles } from '@material-ui/core/styles'
import {
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  RightOutlined,
} from '@ant-design/icons'
import OverflowTooltip from '../../../../components/OverflowTooltip'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import DebounceSelect from '../../../../components/DebounceSelect/DebounceSelect'
import classNames from 'classnames'
import { Menu, MenuItem, Popover, Tooltip } from '@material-ui/core'
import DraggableModal from '../../../../components/DraggableModal'
import { useForm } from 'antd/es/form/Form'
import { useHistory } from 'react-router-dom'
import { refreshRateString, refreshScopeString } from '../../IndicatorSys/utils'
import { downloadBlob } from '../../../../utils/helpers'
import debounce from 'lodash/debounce'
import styled from 'styled-components'
import MaintainInfo from './MaintainInfo'
import { useDebounceEffect } from 'ahooks'

// a little function to help us with reordering the result
const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list)
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)

  return result
}

const EditProcessModal = (props) => {
  const { visible, setVisible, parentUUID, refreshCurProcess, currentProcessEditItem } = props
  const [form] = useForm()
  useEffect(() => {
    if (visible) {
      form.setFieldsValue(currentProcessEditItem || {})
    } else {
      form.resetFields()
    }
  }, [visible, currentProcessEditItem, form])
  const handleSubmit = () => {
    form.validateFields().then((values) => {
      let data = {}
      if (currentProcessEditItem) {
        // 更新
        data.uuid = currentProcessEditItem.uuid
        data.id = currentProcessEditItem.id
      } else {
        // 新建
        data.parentUuid = parentUUID
        data.nodeType = 0
      }

      axios
        .post('/bi-metadata/api/admin/kpiNode/insertOrUpdate', {
          ...(currentProcessEditItem || {}),
          ...data,
          ...values,
        })
        .then(() => {
          setVisible(false)
          form.resetFields()
          refreshCurProcess((key) => key + 1)
        })
    })
  }

  return (
    <DraggableModal
      visible={visible}
      destroyOnClose
      onCancel={() => setVisible(false)}
      title={currentProcessEditItem ? '编辑业务过程' : '新增业务过程'}
      onOk={handleSubmit}>
      <Form form={form} labelCol={{ span: 5 }}>
        <Form.Item label={'业务过程名称'} name={'nodeName'}>
          <Input placeholder={'输入业务过程名称'} maxLength={12} />
        </Form.Item>
      </Form>
    </DraggableModal>
  )
}

const parseDimension = (string) => {
  if (!string) {
    return []
  }
  const matches = string.match(/\[.+?:.*],?/g).filter(Boolean)
  return matches.map((item) => {
    const ret = /\[(.+?):(.*)],?/g.exec(item)
    const label = ret[1]
    const value = ret[2]
    return [label, value]
  })
}

const MetricDetailModal = (props) => {
  const { visible, setVisible, metricItem } = props
  return (
    <DraggableModal
      width={960}
      destroyOnClose
      visible={visible}
      onCancel={() => setVisible(false)}
      title={metricItem?.nodeName}
      footer={[
        <Button key={'back'} onClick={() => setVisible(false)}>
          返回
        </Button>,
      ]}>
      <div style={{ marginTop: '-10px' }}>
        <div className={'leading4 pb-2 font-bold'}>基本信息</div>
        <div className={'grid grid-cols-2 gap-x-8'} style={{ color: 'rgba(0, 0, 0, .65)' }}>
          <div className={'flex justify-start py-1'}>
            <span className={'flex-grow-0'}>上级指标：</span>
            <span className={'flex-1'}>
              <OverflowTooltip>{metricItem?.sName}</OverflowTooltip>
            </span>
          </div>
          <div className={'flex justify-start py-1'}>
            <span className={'flex-grow-0'}>指标性质：</span>
            <span className={'flex-1'}>
              <OverflowTooltip>{{ 1: '原子指标', 2: '派生指标' }[metricItem?.nodeType]}</OverflowTooltip>
            </span>
          </div>
          <div className={'flex justify-start py-1'}>
            <span className={'flex-grow-0'}>数据来源：</span>
            <span className={'flex-1'}>
              <OverflowTooltip>{metricItem?.dataSourceNames}</OverflowTooltip>
            </span>
          </div>
          <div className={'flex justify-start py-1'}>
            <span className={'flex-grow-0'}>计算公式：</span>
            <span className={'flex-1'}>
              <OverflowTooltip>{metricItem?.calcFormula}</OverflowTooltip>
            </span>
          </div>
          <div className={'flex justify-start py-1'}>
            <span className={'flex-grow-0'}>指标业务描述：</span>
            <span className={'flex-1'}>
              <Tooltip
                title={
                  <div style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: metricItem?.kpiDcrp }} />
                }>
                <span className={'ellipsis'}>{metricItem?.kpiDcrp}</span>
              </Tooltip>
            </span>
          </div>
          <div className={'flex justify-start py-1'}>
            <span className={'flex-grow-0'}>指标取数口径：</span>
            <span className={'flex-1'}>
              <OverflowTooltip>{metricItem?.kpiDataDcrp}</OverflowTooltip>
            </span>
          </div>
          <div className={'flex justify-start py-1'}>
            <span className={'flex-grow-0'}>过滤条件：</span>
            <span className={'flex-1'}>
              <OverflowTooltip>{metricItem?.filterCondition}</OverflowTooltip>
            </span>
          </div>
          <div className={'flex justify-start py-1'}>
            <span className={'flex-grow-0'}>涉及的报表：</span>
            <span className={'flex-1'}>
              <OverflowTooltip>
                {((metricItem?.reportsInvolved || '').split(',') || []).filter(Boolean).map((item) => {
                  return (
                    <span className={'px-1 rounded-sm mr-1'} style={{ background: '#f5f5f5' }} key={item}>
                      {item}
                    </span>
                  )
                })}
              </OverflowTooltip>
            </span>
          </div>
        </div>

        <div className={'flex justify-start items-start py-1'} style={{ color: 'rgba(0, 0, 0, .65)' }}>
          <span className={'flex-grow-0'}>对应的模型：</span>
          <span className={'flex-1'}>
            <div className={'table-caption'}>
              {(metricItem?.tableFields || '')
                .split(',')
                .filter(Boolean)
                .map((item) => {
                  return (
                    <div
                      className={'px-1 rounded-sm mr-1 mb-1 inline-block whitespace-nowrap'}
                      style={{ background: '#f5f5f5' }}
                      key={item}>
                      {item}
                    </div>
                  )
                })}
            </div>
          </span>
        </div>

        <div className={'border border-b border-dashed mt-4 mb-2'} style={{ borderColor: '#d9d9d9' }} />

        <div className={'leading4 py-2 font-bold'}>指标维度</div>
        <div className={'grid grid-cols-2 gap-x-8'} style={{ color: 'rgba(0, 0, 0, .65)' }}>
          {parseDimension(metricItem?.dimensionNames).map((item) => {
            return (
              <div className={'flex justify-start py-1'} key={item[0]}>
                <span className={'flex-grow-0'}>{item[0]}：</span>
                <span className={'flex-1'}>
                  <OverflowTooltip>{item[1]}</OverflowTooltip>
                </span>
              </div>
            )
          })}
        </div>

        <div className={'border border-b border-dashed mt-4 mb-2'} style={{ borderColor: '#d9d9d9' }} />
        <div className={'leading4 py-2 font-bold'}>数据刷新信息</div>
        <div className={'grid grid-cols-2 gap-x-8'} style={{ color: 'rgba(0, 0, 0, .65)' }}>
          <div className={'flex justify-start py-1'}>
            <span className={'flex-grow-0'}>数据刷新范围：</span>
            <span className={'flex-1'}>
              <OverflowTooltip>
                {refreshScopeString(metricItem?.scopeOfRefreshType, metricItem?.scopeOfRefreshValue)}
              </OverflowTooltip>
            </span>
          </div>
          <div className={'flex justify-start py-1'}>
            <span className={'flex-grow-0'}>每次更新时间：</span>
            <span className={'flex-1'}>
              <OverflowTooltip>{refreshRateString(metricItem || {})}</OverflowTooltip>
            </span>
          </div>
          <div className={'flex justify-start py-1'}>
            <span className={'flex-grow-0'}>最后更新人：</span>
            <span className={'flex-1'}>
              <OverflowTooltip>{metricItem?.updateName}</OverflowTooltip>
            </span>
          </div>
          <div className={'flex justify-start py-1'}>
            <span className={'flex-grow-0'}>最后更新时间：</span>
            <span className={'flex-1'}>
              <OverflowTooltip>{metricItem?.updateDate}</OverflowTooltip>
            </span>
          </div>
        </div>
      </div>
    </DraggableModal>
  )
}

const useStyle = makeStyles({
  paper: {
    overflowX: 'unset',
    overflowY: 'unset',
    '&::before': {
      content: '""',
      position: 'absolute',
      marginRight: '-0.71em',
      top: -9,
      left: 40,
      width: 10,
      height: 10,
      backgroundColor: '#5493fa',
      transform: 'translate(-50%, 50%) rotate(135deg)',
    },
  },
  leftSide: {
    position: 'relative',
    overflow: 'hidden',
    width: 200,
    height: '100%',
    borderRight: '1px solid #f0f0f0',
    '&.collapsed': {
      width: 0,
      border: 0,
    },
  },
  rightSide: {
    position: 'relative',
    border: '1px solid #f0f0f0',
    flex: 1,
    marginLeft: 16,
    height: '100%',
    overflowY: 'auto',
    '& .collapse-btn': {
      position: 'absolute',
      left: -18,
      top: 192,
      width: 12,
      height: 80,
      lineHeight: '80px',
      color: '#adadad',
      border: '1px solid #e7e7e7',
      borderRadius: '0 10px 10px 0',
      cursor: 'pointer',
      '& .anticon': {
        textIndent: -2,
      },
    },
  },
})

const StyledTabs = styled(Tabs)`
  & > .ant-tabs-nav {
    line-height: 32px;
  }
`

const StatusText = styled.div`
  position: absolute;
  right: 1px;
  top: 50%;
  transform: scale(0.8) translateY(-60%);
  width: 20px;
  height: 20px;
  text-align: center;
  border-radius: 50%;
  line-height: 20px;
  color: var(--secondary-color);
  border: 1px solid;
`

const ProcessNodeItem = styled.div`
  display: inline-block;
  position: relative;
  margin-right: 8px;
  padding: 0 30px;
  height: 40px;
  line-height: 40px;
  text-align: center;
  border: 1px solid #5493fa;
  border-radius: 4px;
  color: #5493fa;
  background: #f2f8ff;
  &:hover {
    cursor: pointer;
    .processItem-action-trigger {
      transform: scale(1);
    }
  }
  &.active {
    color: #fff;
    background: #5493fa;
    .processItem-action-trigger {
      &:hover {
        color: rgba(0, 0, 0, 0.65);
      }
    }
  }
  .processItem-action-trigger {
    position: absolute;
    display: flex;
    transform: scale(0);
    transition: all 0.3s;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    top: 11px;
    left: 7px;
    font-size: 18px;
    border-radius: 4px;
    &:hover {
      background: #eaeaea;
    }
  }
`

const MetricsNodeItem = styled.div`
  display: flex;
  position: relative;
  padding: 8px 16px;
  user-select: none;
  line-height: 24px;
  &:hover {
    cursor: pointer;
    background: #f2f8ff;
    .metrics-node-item-actions {
      display: flex;
    }
  }
  &.active {
    color: #5493fa;
    background: #f2f8ff;
  }
  .metrics-node-item-actions {
    display: none;
    padding: 0 4px;
    flex-wrap: nowrap;
    font-size: 15px;
    background: #f2f8ff;
    color: rgba(0, 0, 0, 0.35);
    & > span {
      padding: 0 4px;
      border-radius: 6px;
      &:hover {
        background: #e6e7e7;
        color: rgba(0, 0, 0, 0.65);
      }
    }
    &.isPending {
      display: none;
    }
  }
`

const DeriveMetric = styled.div`
  position: relative;
  line-height: 24px;
  padding: 8px 0;
  background: #f7f7f7;
  border-radius: 4px;
  text-align: center;
  color: rgba(0, 0, 0, 0.65);
  border: 1px solid #d9d9d9;
  &:hover {
    cursor: pointer;
  }
`

const saveCurrentActive = (keyArray) => {
  sessionStorage.setItem('metrics_activeKeys', JSON.stringify(keyArray))
}

const getCurrentActive = () => {
  let ret = sessionStorage.getItem('metrics_activeKeys')
  if (ret) {
    return JSON.parse(ret)
  } else {
    return []
  }
}

const transStatus = (status) => {
  return status === -1 ? '' : status
}

function DesignAll(props) {
  const { isEdit, defaultTabName } = props
  const defaultTabNameRef = useRef(defaultTabName)
  const history = useHistory()

  const scrollbarsComponentRef = useRef(null)
  const [statusFilter, setStatusFilter] = useState(-1)
  const [collapsed] = useState(false)
  const isQuerying1 = useRef(false)
  const isQuerying2 = useRef(false)
  const isQuerying3 = useRef(false)
  const classes = useStyle()
  const [exportLoading, setExportLoading] = useState(false)
  const [, setLoading] = useState(false)
  const [bz1, setBz1] = useState([])
  const [bz2, setBz2] = useState([])
  const [bz3, setBz3] = useState([])
  const [bz4, setBz4] = useState([])
  const [loading2, setLoading2] = useState(false)
  const [loading3, setLoading3] = useState(false)
  const [loading4, setLoading4] = useState(false)

  const [bz1ActiveKey, setBz1ActiveKey] = useState('')
  const [bz2ActiveKey, setBz2ActiveKey] = useState('')
  const [bz3ActiveKey, setBz3ActiveKey] = useState('')
  const [selectedMetric, setSelectedMetric] = useState(null)

  const [refreshKey1, setRefreshKey1] = useState(1)
  const [refreshKey2, setRefreshKey2] = useState(1)
  const [refreshKey3, setRefreshKey3] = useState(1)

  const [anchorEl1, setAnchorEl1] = useState(null) // 业务过程的编辑菜单trigger

  const [anchorEl2, setAnchorEl2] = useState(null) // 派生指标弹出框的trigger

  /**@member dataSourceNames */
  /**@member isPendingAudit */
  const [currentDerivedMetric, setCurrentDerivedMetric] = useState(null)
  const [popoverWidth, setPopoverWidth] = useState(0)

  const [curProcessItem, setCurProcessItem] = useState(null)

  const [queryUUID, setQueryUUID] = useState('')

  const fetchMetrics = (keyword) => {
    if (!keyword) {
      return Promise.resolve([])
    }
    return axios
      .get(
        isEdit ? '/bi-metadata/api/user/kpiNode/findByKeyword' : '/bi-metadata/api/user/kpiNodeQuery/findByKeyword',
        {
          params: {
            auditStatus: transStatus(statusFilter),
            keyword,
          },
        }
      )
      .then(({ data }) => {
        return data.filter(item => {
          const p = item.superiorName.split('-->') || []
          return isEdit ? true : p.indexOf('品牌市场') === -1 && p.indexOf('财务管理') === -1
        }).map((item) => {
          return {
            label: item.nodeName,
            value: item.uuid,
          }
        })
      })
  }

  useEffect(() => {
    setQueryUUID(undefined)
  }, [statusFilter])

  const handleImport = (e) => {
    const file = e.file
    if (!file) {
      return
    }
    const fd = new FormData()
    fd.append('file', file)
    axios
      .post('/bi-metadata/api/user/kpiNode/importNodes', fd, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then(() => {
        message.success('导入成功')
        setRefreshKey1((prev) => prev + 1)
        setRefreshKey2((prev) => prev + 1)
        setRefreshKey3((prev) => prev + 1)
      })
  }

  const handleExport = () => {
    setExportLoading(true)
    axios
      .get(isEdit ? '/bi-metadata/api/user/kpiNode/exportNodes' : '/bi-metadata/api/user/kpiNodeQuery/exportNodes', {
        responseType: 'blob',
      })
      .then(({ data, headers }) => {
        const filename = headers['content-disposition'].match(/filename=(.*)/)[1]
        downloadBlob(data, decodeURIComponent(filename))
      })
      .finally(() => {
        setExportLoading(false)
      })
  }

  const statusFilterChange = (v) => {
    setStatusFilter(v)
  }

  const operations = (
    <div className={'flex py-3'}>
      {isEdit && (
        <Select style={{ width: 100 }} value={statusFilter} onChange={statusFilterChange}>
          <Select.Option value={-1}>全部</Select.Option>
          <Select.Option value={1}>待审核</Select.Option>
          <Select.Option value={0}>已审核</Select.Option>
        </Select>
      )}
      <DebounceSelect
        className={'ml-2'}
        value={queryUUID}
        fetchOptions={fetchMetrics}
        onChange={(value) => handleQueryChange(value)}
        placeholder={'输入关键字搜索指标'}
        style={{ width: 200 }}
        allowClear
      />
      {isEdit && (
        <Upload maxCount={1} showUploadList={false} accept={'.xlsx'} customRequest={handleImport}>
          <Button className="ml-2">导入</Button>
        </Upload>
      )}
      {
        <Button onClick={handleExport} loading={exportLoading} className={'ml-2'}>
          导出
        </Button>
      }
    </div>
  )

  const handleQueryChange = (value) => {
    setTimeout(() => {
      setQueryUUID(value)
    }, 200)
  }

  const getDetailByUUID = (uuid) => {
    if (!uuid) {
      return Promise.reject()
    }
    return axios.get(
      isEdit
        ? '/bi-metadata/api/user/kpiNode/selectByUUIDDetails'
        : '/bi-metadata/api/user/nodeQuery/selectByUUIDDetails',
      {
        params: { uuid },
      }
    )
  }

  const getChildrenByPUUID = (params) => {
    return axios
      .get(isEdit ? '/bi-metadata/api/user/kpiNode/findByParentId' : '/bi-metadata/api/user/nodeQuery/findByParentId', {
        params,
      })
      .then(({ data }) => {
        return Promise.resolve(data?.children || [])
      })
  }

  const scrollToTarget = (data) => {
    setTimeout(() => {
      const index = (data || []).findIndex((item) => item.uuid === queryUUID)
      const ins = scrollbarsComponentRef.current?.osInstance()
      ins?.scroll({ top: index * 40 })
    }, 200)
  }

  // 查询
  useEffect(() => {
    if (!queryUUID) {
      return
    }
    axios
      .get('/bi-metadata/api/user/kpiNode/findByUUidTopPath', {
        params: {
          uuid: queryUUID,
        },
      })
      .then(({ data }) => {
        if (data[0]) {
          if (data[0].uuid !== bz1ActiveKey) {
            setBz2([])
          }
          isQuerying1.current = true
          setBz1ActiveKey(data[0]?.uuid)
        }
        if (data[1]) {
          if (data[0].uuid !== bz1ActiveKey) {
            isQuerying2.current = true
          }
          setBz2ActiveKey(data[1]?.uuid)
        }
        if (data[2]) {
          if (data[1]?.uuid !== bz2ActiveKey) {
            isQuerying3.current = true
          } else {
            // scroll to target metric
            scrollToTarget(bz3)
          }
          setBz3ActiveKey(data[2]?.uuid)
        }
      })
    // eslint-disable-next-line
  }, [queryUUID])

  // 初始化
  useEffect(() => {
    const data = getCurrentActive()
    if (data[0]) {
      isQuerying1.current = true
      setBz1ActiveKey(data[0])
    }
    if (data[1]) {
      isQuerying2.current = true
      setBz2ActiveKey(data[1])
    }
    if (data[2]) {
      isQuerying3.current = true
      setBz3ActiveKey(data[2])
    }
  }, [])

  // 利用session记住当前点击的
  useEffect(() => {
    saveCurrentActive([bz1ActiveKey, bz2ActiveKey, bz3ActiveKey])
  }, [bz1ActiveKey, bz2ActiveKey, bz3ActiveKey])

  // 获取第一级节点
  useEffect(() => {
    let p
    if (isEdit) {
      p = axios.get('/bi-metadata/api/user/kpiNode/queryLevelInfo', {
        params: {
          contains: true,
          level: 1,
        },
      })
    } else {
      p = axios.get('/bi-metadata/api/user/kpiNode/queryOneLevelInfo', {
        params: {
          auditStatus: transStatus(statusFilter),
        },
      })
    }
    p.then(({ data }) => {
      setBz1(data)
      if (defaultTabNameRef.current) {
        const uuid = data.find((item) => item.nodeName === defaultTabNameRef.current)?.uuid
        if (uuid) {
          setBz1ActiveKey(uuid)
        } else {
          setBz1ActiveKey(data[0]?.uuid)
        }
        defaultTabNameRef.current = null
      } else {
        if (!isQuerying1.current) {
          setBz1ActiveKey(data[0]?.uuid)
        }
        isQuerying1.current = false
      }
    })
    // eslint-disable-next-line
  }, [isEdit, transStatus])

  useDebounceEffect(
    () => {
      setLoading2(true)
      if (bz1ActiveKey) {
        getChildrenByPUUID({
          auditStatus: transStatus(statusFilter),
          parentUUID: bz1ActiveKey,
        })
          .then((data) => {
            setBz2(data)
            if (data.length) {
              !isQuerying2.current && setBz2ActiveKey(data[0]?.uuid)
            } else {
              setBz2ActiveKey('')
              setBz3ActiveKey('')
            }
            isQuerying2.current = false
          })
          .finally(() => {
            setTimeout(() => {
              setLoading2(false)
            }, 50)
          })
      } else {
        setBz2([])
        setBz2ActiveKey('')
        setBz3ActiveKey('')
        isQuerying2.current = false
        setLoading2(false)
      }
      // eslint-disable-next-line
    },
    [bz1ActiveKey, refreshKey1, statusFilter],
    { wait: 50 }
  )

  useDebounceEffect(
    () => {
      if (!bz2ActiveKey) {
        setBz3([])
        setLoading3(false)
        return
      }
      setLoading3(true)

      getChildrenByPUUID({
        auditStatus: transStatus(statusFilter),
        parentUUID: bz2ActiveKey,
      })
        .then((data) => {
          setLoading(false)
          setBz3(data)
          if (isQuerying3.current) {
            scrollToTarget(data)
          }
          if (data.length) {
            !isQuerying3.current && setBz3ActiveKey(data[0].uuid)
          } else {
            setBz3ActiveKey('')
            setSelectedMetric(null)
          }
          isQuerying3.current = false
        })
        .finally(() => {
          setTimeout(() => {
            setLoading3(false)
          }, 150)
        })
      // eslint-disable-next-line
    },
    [bz2ActiveKey, refreshKey2, statusFilter],
    { wait: 20 }
  )

  const showSelectedMetric = debounce(() => {
    if (!bz3ActiveKey) {
      setBz4([])
      setSelectedMetric(null)
      setLoading4(false)
    } else {
      setLoading4(true)
      getDetailByUUID(bz3ActiveKey).then(({ data }) => {
        setSelectedMetric(data)
        setTimeout(() => {
          setLoading4(false)
        }, 150)
      })
      getChildrenByPUUID({
        auditStatus: transStatus(statusFilter),
        parentUUID: bz3ActiveKey,
      }).then((data) => {
        setBz4(data)
      })
    }
  }, 50)
  useEffect(() => {
    showSelectedMetric()
    // eslint-disable-next-line
  }, [bz3ActiveKey, refreshKey3, statusFilter])

  const handleTabClick = (key) => {
    if (key === bz1ActiveKey) {
      return
    }
    setBz1ActiveKey(key)
    setLoading2(true)
    setBz2([])
    setBz3([])
    setBz4([])
    setSelectedMetric(null)
  }
  const handleProcessClick = (item) => {
    if (item.uuid === bz2ActiveKey) {
      return
    }
    setBz2ActiveKey(item.uuid)
    setLoading3(true)
    setBz3([])
    setBz4([])
  }

  const handleProcessTriggerClick = (event, item) => {
    setCurProcessItem(item)
    setAnchorEl1(event.currentTarget)
    event.stopPropagation()
  }

  const handleProcessTriggerClose = () => {
    setAnchorEl1(null)
    setCurProcessItem(null)
  }

  const handleMetricItemClick = (item) => {
    if (item.uuid === bz3ActiveKey) {
      return
    }
    setBz3ActiveKey(item.uuid)
    setBz4([])
  }

  const editMetric = (event, item) => {
    event.stopPropagation()
    history.push(`/metaData/metricsSys/metricsEdit/update/${item.id}`)
  }

  const editDerived = (item) => {
    history.push(`/metaData/metricsSys/metricsEdit/update/${item.id}`)
  }

  const deleteMetric = (event, item) => {
    event.stopPropagation()
    Modal.confirm({
      content: `确定删除【${item.nodeName}】吗？`,
      onOk: () => {
        return handleDeleteNode(item).then(() => {
          setRefreshKey2((prev) => prev + 1)
          message.info({
            content: '进入指标删除审核阶段',
            icon: <ExclamationCircleOutlined style={{ color: 'var(--dangerous-color)' }} />,
          })
        })
      },
    })
  }

  const [editProcessVisible, setEditProcessVisible] = useState(false)
  const [currentProcessEditItem, setCurrentProcessEditItem] = useState(null)
  const addProcessItem = () => {
    setCurrentProcessEditItem(null)
    setEditProcessVisible(true)
  }

  const handleDerivedPopover = (event) => {
    const el = event.currentTarget
    const width = el.clientWidth
    const uuid = el.getAttribute('data-uuid')
    const isPendingAudit = el.getAttribute('data-is-pending-audit')
    getDetailByUUID(uuid).then(({ data }) => {
      setCurrentDerivedMetric({ ...data, uuid, isPendingAudit: Number(isPendingAudit) })
    })
    setPopoverWidth(Math.max(width, 300))
    setAnchorEl2(el)
  }

  const handleDerivedPopoverClose = () => {
    setAnchorEl2(null)
    setTimeout(() => {
      setCurrentDerivedMetric(null)
    }, 100)
  }

  const handleDeleteNode = (node) => {
    return axios.get('/bi-metadata/api/user/kpiNode/delByUUID', {
      params: { kpiNodeId: node.uuid },
    })
  }

  const handleDeleteMetric = (metric) => {
    handleDerivedPopoverClose()
    Modal.confirm({
      content: `确定删除【${metric.nodeName}】吗？`,
      onOk: () => {
        return handleDeleteNode(metric).then(() => {
          setRefreshKey3((prev) => prev + 1)
          message.info({
            content: '进入指标删除审核阶段',
            icon: <ExclamationCircleOutlined style={{ color: 'var(--dangerous-color)' }} />,
          })
        })
      },
    })
  }

  const handleDeleteProcessItem = (metric) => {
    handleProcessTriggerClose()
    Modal.confirm({
      content: `确定删除【${metric.nodeName}】吗？`,
      onOk: () => {
        return handleDeleteNode(metric).then(() => {
          setRefreshKey1((prev) => prev + 1)
          message.info({
            content: '已删除',
            icon: <ExclamationCircleOutlined style={{ color: 'var(--dangerous-color)' }} />,
          })
        })
      },
    })
  }

  const handleEditProcessItem = (metric) => {
    handleProcessTriggerClose()
    setCurrentProcessEditItem(metric)
    setEditProcessVisible(true)
  }

  const addMetricItem = () => {
    sessionStorage.setItem('metadata-defaultParentNodeUUID', bz2ActiveKey)
    history.push('/metaData/metricsSys/metricsEdit/create')
  }
  const addDerivedItem = () => {
    sessionStorage.setItem('metadata-defaultParentNodeUUID', bz3ActiveKey)
    history.push('/metaData/metricsSys/metricsEdit/create')
  }

  const [metricDetailVisible, setMetricDetailVisible] = useState(false)
  const checkMetricDetail = () => {
    setMetricDetailVisible(true)
  }

  const dragEnd1 = (result) => {
    if (!result.destination) {
      return
    }
    const items = reorder(bz2, result.source.index, result.destination.index)
    axios.post(
      '/bi-metadata/api/user/kpiNode/updateKpiNodeSortValue',
      items.map((item, index) => {
        return { id: item.id, sortValue: index }
      })
    )
    setBz2(items)
  }

  const dragEnd2 = (result) => {
    if (!result.destination) {
      return
    }
    const items = reorder(bz3, result.source.index, result.destination.index)
    axios.post(
      '/bi-metadata/api/user/kpiNode/updateKpiNodeSortValue',
      items.map((item, index) => {
        return { id: item.id, sortValue: index }
      })
    )
    setBz3(items)
  }

  const wrapperRef = useRef()

  return (
    <>
      <Spin spinning={false} style={{ marginTop: -24 }}>
        <StyledTabs
          activeKey={bz1ActiveKey}
          onTabClick={handleTabClick}
          destroyInactiveTabPane
          tabBarExtraContent={operations}>
          {bz1.map((item) => (
            <Tabs.TabPane
              tab={item.nodeName}
              key={item.uuid}
              disabled={isEdit ? false : ['品牌市场', '财务管理'].includes(item.nodeName)}
            />
          ))}
        </StyledTabs>

        <div ref={wrapperRef} className={'relative'}>
          <div className={'flex justify-between'}>
            <span className={'font-bold'}>业务过程({bz2.length}个)</span>
            <div>
              {isEdit && (
                <span
                  className={'cursor-pointer hover:ring-current'}
                  style={{ color: '#5493fa' }}
                  onClick={addProcessItem}>
                  <PlusOutlined /> 新增业务过程
                </span>
              )}
            </div>
          </div>
          <div className={'mt-4'}>
            {!!bz2.length && !loading2 && (
              <div className={'whitespace-nowrap'}>
                <DragDropContext onDragEnd={dragEnd1}>
                  <Droppable droppableId="droppable01" direction="horizontal">
                    {(dropProvided) => (
                      <div style={{ height: 40 }} ref={dropProvided.innerRef} {...dropProvided.droppableProps}>
                        <div style={{ overflow: 'auto hidden' }}>
                          <div ref={dropProvided.innerRef}>
                            {bz2.map((item, index) => (
                              <Draggable isDragDisabled={!isEdit} key={item.uuid} draggableId={item.uuid} index={index}>
                                {(dragProvided) => (
                                  <ProcessNodeItem
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    {...dragProvided.dragHandleProps}
                                    onClick={() => handleProcessClick(item)}
                                    className={classNames({
                                      active: item.uuid === bz2ActiveKey,
                                    })}
                                    key={item.uuid}>
                                    <OverflowTooltip>{item.nodeName}</OverflowTooltip>
                                    {isEdit && (
                                      <span
                                        className={'processItem-action-trigger'}
                                        onClick={(e) => handleProcessTriggerClick(e, item)}>
                                        <EllipsisOutlined />
                                      </span>
                                    )}
                                  </ProcessNodeItem>
                                )}
                              </Draggable>
                            ))}
                          </div>
                        </div>
                        {dropProvided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            )}
            {!loading2 && !bz2.length && (
              <div style={{ lineHeight: '40px' }} className={'text-center text-gray-400 bg-gray-100 rounded'}>
                暂无业务过程数据
              </div>
            )}

            {loading2 && (
              <div className={'table w-full'} style={{ height: 40 }}>
                <Spin className={'table-cell align-middle text-center'} spinning={loading2} delay={200} />
              </div>
            )}
          </div>
          {!loading2 && (
            <div className={'flex justify-start items-start mt-4'} style={{ height: 'calc(100vh - 324px)' }}>
              <div className={classNames(classes.leftSide, { collapsed: collapsed })}>
                <div className={'flex justify-between bg-gray-50 leading-10 font-bold px-4 py-2'}>
                  <span>原子指标池（{bz3.length}个）</span>
                  <div>
                    {isEdit && (
                      <Tooltip title={'新增原子指标'} placement={'top'}>
                        <PlusOutlined onClick={addMetricItem} className={'cursor-pointer hover:text-blue-500'} />
                      </Tooltip>
                    )}
                  </div>
                </div>
                <div style={{ height: 'calc(100% - 56px)' }}>
                  {!!bz3.length && !loading3 && (
                    <OverlayScrollbarsComponent
                      key={bz1ActiveKey}
                      ref={scrollbarsComponentRef}
                      options={{
                        className: 'os-theme-dark',
                        scrollbars: { autoHide: 'scroll' },
                      }}
                      style={{ height: '100%' }}>
                      <DragDropContext onDragEnd={dragEnd2}>
                        <Droppable droppableId="droppable01" direction="vertical">
                          {(dropProvided) => (
                            <div ref={dropProvided.innerRef} {...dropProvided.droppableProps}>
                              {bz3.map((item, index) => (
                                <Draggable
                                  isDragDisabled={!isEdit}
                                  key={item.uuid}
                                  draggableId={item.uuid}
                                  index={index}>
                                  {(dragProvided, snapshot) => (
                                    <MetricsNodeItem
                                      ref={dragProvided.innerRef}
                                      {...dragProvided.draggableProps}
                                      {...dragProvided.dragHandleProps}
                                      style={{
                                        paddingRight: isEdit ? '' : '16px',
                                        background: snapshot.isDragging ? 'rgb(249, 250, 251)' : '',
                                        ...dragProvided.draggableProps.style,
                                      }}
                                      key={item.uuid}
                                      onClick={() => handleMetricItemClick(item)}
                                      className={`${bz3ActiveKey === item.uuid ? 'active' : ''}`}>
                                      <OverflowTooltip className={'flex-1'}>{item.nodeName}</OverflowTooltip>
                                      {isEdit && (
                                        <div
                                          className={classNames('metrics-node-item-actions', 'space-x-0.5', {
                                            isPending: item.isPendingAudit === 1,
                                          })}>
                                          <span onClick={(e) => editMetric(e, item)}>
                                            <EditOutlined />
                                          </span>
                                          <span onClick={(e) => deleteMetric(e, item)}>
                                            <DeleteOutlined />
                                          </span>
                                        </div>
                                      )}
                                      {item.isPendingAudit === 1 && (
                                        <Tooltip title={'审核中'} enterDelay={1000}>
                                          <StatusText>审</StatusText>
                                        </Tooltip>
                                      )}
                                      {item.isPendingAudit === 0 && item.status === 2 && (
                                        <Tooltip title={'草稿'} enterDelay={1000}>
                                          <StatusText>稿</StatusText>
                                        </Tooltip>
                                      )}
                                    </MetricsNodeItem>
                                  )}
                                </Draggable>
                              ))}
                              {dropProvided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    </OverlayScrollbarsComponent>
                  )}
                  {!loading3 && !bz3.length && (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={'暂无原子指标'} />
                  )}
                  {loading3 && (
                    <div className={'table w-full h-full'}>
                      <Spin className={'table-cell align-middle text-center'} spinning={loading3} delay={200} />
                    </div>
                  )}
                </div>
              </div>

              <div className={classes.rightSide}>
                <Spin spinning={loading4}>
                  <div className={'flex justify-between bg-gray-50 leading-10 font-bold px-4 py-2'}>
                    <div style={{ height: 40 }}>
                      {loading2 || loading3 || loading4 ? '加载中...' : selectedMetric?.nodeName || '暂无指标详情'}
                    </div>
                    <div>
                      {selectedMetric && (
                        <div className={'font-normal cursor-pointer'} onClick={checkMetricDetail}>
                          <span style={{ color: '#5493fa' }}>
                            查看更多 <RightOutlined />
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={'grid grid-cols-3 gap-x-12 px-4 pt-1'}>
                    <div className={'flex pt-3'}>
                      <span>业务描述：</span>
                      <span className={'flex-1'}>
                        <OverflowTooltip>{selectedMetric?.kpiDcrp}</OverflowTooltip>
                      </span>
                    </div>
                    <div className={'flex pt-3'}>
                      <span>计算公式：</span>
                      <span className={'flex-1'}>
                        <OverflowTooltip>{selectedMetric?.calcFormula}</OverflowTooltip>
                      </span>
                    </div>
                    <div className={'flex pt-3'}>
                      <span>数据来源：</span>
                      <span className={'flex-1'}>
                        <OverflowTooltip>{selectedMetric?.dataSourceNames}</OverflowTooltip>
                      </span>
                    </div>
                    <div className={'flex pt-3'}>
                      <span>取数口径：</span>
                      <span className={'flex-1'}>
                         <OverflowTooltip>{selectedMetric?.kpiDataDcrp}</OverflowTooltip>
                      </span>
                    </div>
                    <div className={'flex pt-3'}>
                      <span>最后更新人：</span>
                      <span className={'flex-1'}>
                        <OverflowTooltip>{selectedMetric?.updateName}</OverflowTooltip>
                      </span>
                    </div>
                    {/*<div className={'flex pt-3'}>*/}
                    {/*  <span>业务确定人：</span>*/}
                    {/*  <span className={'flex-1'}>*/}
                    {/*    <OverflowTooltip>{selectedMetric?.businessAscertainer}</OverflowTooltip>*/}
                    {/*  </span>*/}
                    {/*</div>*/}
                    <div className={'flex pt-3'}>
                      <span>最后更新日期：</span>
                      <span className={'flex-1'}>
                        <OverflowTooltip>{selectedMetric?.updateDate}</OverflowTooltip>
                      </span>
                    </div>
                  </div>

                  <div className={'mt-6 px-4'}>
                    <div className={'font-bold'}>派生指标池（{bz4.length}个）</div>
                    <div className={'py-4'}>
                      {bz4.length ? (
                        <div className={'grid grid-cols-4 gap-x-4 gap-y-4'}>
                          {bz4.map((item) => (
                            <DeriveMetric
                              data-uuid={item.uuid}
                              data-is-pending-audit={item.isPendingAudit}
                              onClick={(e) => handleDerivedPopover(e, item)}
                              key={item.uuid}>
                              <span>{item.nodeName}</span>
                              {item.isPendingAudit === 1 && (
                                <Tooltip title={'审核中'}>
                                  <StatusText>审</StatusText>
                                </Tooltip>
                              )}
                              {item.isPendingAudit === 0 && item.status === 2 && (
                                <Tooltip title={'草稿'} enterDelay={1000}>
                                  <StatusText>稿</StatusText>
                                </Tooltip>
                              )}
                            </DeriveMetric>
                          ))}
                        </div>
                      ) : (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={'暂无派生指标'} />
                      )}
                    </div>
                  </div>

                  {!!bz3ActiveKey && isEdit && (
                    <div
                      onClick={addDerivedItem}
                      className={
                        'mx-4 text-center text-gray-500 cursor-pointer leading-10 border border-dashed rounded border-gray-300 hover:text-blue-500 hover:border-blue-500'
                      }>
                      <PlusOutlined /> 新增派生指标
                    </div>
                  )}
                </Spin>
              </div>
            </div>
          )}
        </div>
      </Spin>
      <Menu
        open={Boolean(anchorEl1)}
        anchorEl={anchorEl1}
        onClose={handleProcessTriggerClose}
        elevation={0}
        PaperProps={{
          style: {
            width: '120px',
            color: 'rgba(0, 0, 0, .64)',
            padding: '0 10px',
            boxShadow: '0px 10px 24px 0px rgba(29, 42, 68, 0.12)',
          },
        }}
        transformOrigin={{
          vertical: -40,
          horizontal: 'left',
        }}>
        <MenuItem
          style={{ fontSize: 14, padding: '6px 12px', borderRadius: 4 }}
          onClick={() => handleEditProcessItem(curProcessItem)}>
          <span>
            <EditOutlined style={{ marginRight: 12, color: 'rgba(0, 0, 0, .35)' }} />
            编辑
          </span>
        </MenuItem>
        <MenuItem
          style={{ fontSize: 14, padding: '6px 12px', borderRadius: 4 }}
          onClick={() => handleDeleteProcessItem(curProcessItem)}>
          <span>
            <DeleteOutlined style={{ marginRight: 12, color: 'rgba(0, 0, 0, .35)' }} />
            删除
          </span>
        </MenuItem>
      </Menu>

      <Popover
        classes={{ paper: classes.paper }}
        PaperProps={{
          style: {
            width: popoverWidth,
            boxShadow: '0px 10px 24px 0px rgba(29, 42, 68, 0.12)',
          },
        }}
        open={Boolean(anchorEl2)}
        elevation={0}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: -12,
          horizontal: 0,
        }}
        anchorEl={anchorEl2}
        onClose={handleDerivedPopoverClose}>
        <div
          className={'flex justify-between leading-8 py-2 text-white px-2 font-medium'}
          style={{ background: '#5493fa', borderRadius: '4px 4px 0 0' }}>
          <span>{currentDerivedMetric?.nodeName}</span>
          <span>
            {!currentDerivedMetric?.isPendingAudit && isEdit && (
              <Tooltip title={'编辑'} placement={'top'}>
                <EditOutlined className={'mr-2 cursor-pointer'} onClick={() => editDerived(currentDerivedMetric)} />
              </Tooltip>
            )}
            {!currentDerivedMetric?.isPendingAudit && isEdit && (
              <Tooltip title={'删除'} placement={'top'}>
                <DeleteOutlined
                  className={'mr-2 cursor-pointer'}
                  onClick={() => handleDeleteMetric(currentDerivedMetric)}
                />
              </Tooltip>
            )}
            <Tooltip title={'关闭'} placement={'top'}>
              <CloseOutlined className={'mr-2 cursor-pointer hover:border'} onClick={handleDerivedPopoverClose} />
            </Tooltip>
          </span>
        </div>

        <div className={'px-6 py-4 leading-6'} style={{ color: 'rgba(0, 0, 0, .64)' }}>
          <div className={'flex justify-start'}>
            <span>业务描述：</span>
            <span className={'flex-1'}>
              <OverflowTooltip>{currentDerivedMetric?.kpiDcrp}</OverflowTooltip>
            </span>
          </div>
          <div className={'flex justify-start'}>
            <span>计算公式：</span>
            <span className={'flex-1'}>
              <OverflowTooltip>{currentDerivedMetric?.calcFormula}</OverflowTooltip>
            </span>
          </div>
          <div className={'flex justify-start'}>
            <span>数据来源：</span>
            <span className={'flex-1'}>
              <OverflowTooltip>{currentDerivedMetric?.dataSourceNames}</OverflowTooltip>
            </span>
          </div>
          <div className={'flex justify-start'}>
            <span>最后更新人：</span>
            <span className={'flex-1'}>
              <OverflowTooltip>{currentDerivedMetric?.updateName}</OverflowTooltip>
            </span>
          </div>
          <div className={'flex justify-start'}>
            <span>业务确定人：</span>
            <span className={'flex-1'}> </span>
          </div>
          <div className={'flex justify-start'}>
            <span>最后更新日期：</span>
            <span className={'flex-1'}>
              <OverflowTooltip>{currentDerivedMetric?.updateDate}</OverflowTooltip>
            </span>
          </div>
        </div>
      </Popover>

      <EditProcessModal
        visible={editProcessVisible}
        setVisible={setEditProcessVisible}
        currentProcessEditItem={currentProcessEditItem}
        parentUUID={bz1ActiveKey}
        refreshCurProcess={setRefreshKey1}
      />

      <MetricDetailModal
        visible={metricDetailVisible}
        setVisible={setMetricDetailVisible}
        metricItem={selectedMetric}
      />

      <MaintainInfo anchorEl={wrapperRef.current} />
    </>
  )
}

export default DesignAll
