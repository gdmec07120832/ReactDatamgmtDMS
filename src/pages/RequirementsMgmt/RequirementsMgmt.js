import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from 'react';
import {
  Alert,
  Button,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  message, Modal, Popconfirm,
  Progress,
  Row,
  Select,
  Space, Steps,
  Table,
  Timeline, Typography,
  Upload
} from 'antd';
import {connect} from 'react-redux';
import FieldItem from '../../components/FieldItem';
import useUserList from '../../hooks/useUserList';
import useTable from '../../hooks/useTable';
import {useRequest} from 'ahooks';
import axios from '../../utils/axios';
import OverflowTooltip from '../../components/OverflowTooltip';
import moment from 'moment';
import DraggableModal from '../../components/DraggableModal';
import {useForm} from 'antd/es/form/Form';
import {DownOutlined, MinusOutlined, PlusOutlined, RightOutlined} from '@ant-design/icons';
import {makeStyles} from '@material-ui/core/styles';
import StyledDateRangePicker from '../../components/StyledDateRangePicker';


const DEMAND_TYPE = {
  'Create': '新增',
  'Update': '迭代'
}

const DEMAND_STATUS = {
  'Created': '新建',
  'Reject': '驳回',
  'PendingTrial': '待审',
  'Ready': '就绪',
  'Underway': '进行中',
  'Finished': '完结',
  'Freeze': '冻结',
}

const PROCESS_DETAIL_STATUS = {
  'Ready': '就绪',
  'Finished': '完结',
  'Underway': '进行中',
}


const useStyle = makeStyles({
  'miniHeaderTable': {
    '& .ant-table-thead': {
      '& .ant-table-cell': {
        paddingTop: '2px!important',
        paddingBottom: '2px!important'
      }
    }
  },
  'demandDetailsTable': {
    '& .ant-table': {
      margin: '0!important'
    },
    '& .ant-table-thead > tr > th': {
      background: '#ecf5ff!important',
      color: '#409eff'
    }
  }
})


const CollapsedRow = connect(state => {
  return {
    loginUserId: state.user.userInfo.id,
    permissionsMap: state.user.userInfo.permissionsMap
  }
})(React.memo(({record, userList, loginUserId, permissionsMap, setTable: _setTable}) => {
  console.log(record)
  const classes = useStyle()
  const {demandDetails, processes: __processes, __dirty__} = record
  const [processes, setProcesses] = useState([])
  const _processes = __processes.map(p => {
    const {processDetails} = p
    const _processDetails = processDetails.map(d => {
      return {
        ...d,
        __key__: Math.random().toString(32).slice(-8)
      }
    })
    return {
      ...p,
      __key__: Math.random().toString(32).slice(-8),
      processDetails: _processDetails
    }
  })

  useEffect(() => {
    if (!__dirty__) {
      setProcesses(_processes)
    }
    // eslint-disable-next-line
  }, [__dirty__, __processes])

  const {table, setTable} = useTable({
    pagination: false,
    bordered: true,
    rowKey: 'id',
    columns: [
      {
        dataIndex: 'index', title: '序号', align: 'center', width: 100, render: (text, record, index) => {
          return index + 1
        }
      },
      {
        dataIndex: 'type', title: '需求说明文档', align: 'center', render: (text) => {
          return text
        }
      },
      {
        dataIndex: 'id', title: '内容/文件', align: 'center', render: (text, record) => {
          const {type, fileName} = record
          return <>
            {
              type === 'Text' && <Typography.Link onClick={() => viewContent(record)}>查看</Typography.Link>
            }
            {
              type === 'File' && <Typography.Link onClick={() => {
                downloadFile(record)
              }}>{fileName}</Typography.Link>
            }
          </>
        }
      }
    ]
  })
  useEffect(() => {
    setTable(prevState => ({
      ...prevState,
      dataSource: demandDetails
    }))
  }, [setTable, demandDetails])

  const downloadFile = (record) => {
    const url = axios.defaults.baseURL + '/bi-auto-deploy/api/user/file/download/' + record.id
    window.open(url)
  }

  const viewContent = (record) => {
    Modal.info({
      icon: null,
      width: 800,
      title: '查看内容详情',
      content: <div style={{whiteSpace: 'pre-line', height: 400, overflow: 'auto'}}>{record.description}</div>
    })
  }

  // 负责人权限控制
  const hasProcessDetailEditRightForPrincipal = (demand, processDetailRow) => {
    if (demand.status === "PendingTrial") {
      //待审状态
      //创建者和产品经理可以修改全部,不检查负责人
      if (permissionsMap[demand?.businessMode?.modeCode] || demand?.creatorId === loginUserId) {
        return true;
      }
    } else if (demand.status !== "Finished") {
      //待审以外的状态
      if (processDetailRow?.status === "Finished") {
        return false;
      } else if (permissionsMap[demand?.businessMode?.modeCode]) {
        return true;
      } else if (processDetailRow?.principalId === loginUserId) {
        return false;
      }
    }
    return false;
  }

  const hasProcessDetailEditRightForAPD = (demand) => {
    if (demand.status === "PendingTrial") {
      //待审状态
      //创建者和产品经理可以修改全部,不检查负责人
      if (permissionsMap[demand?.businessMode?.modeCode] || (demand?.creatorId === loginUserId)) {
        return true;
      }
    } else {
      return false
    }
  }


  const hasProcessDetailEditRight = (demand, processDetailRow) => {
    if (demand.status === "PendingTrial") {
      //待审状态
      //创建者和产品经理可以修改全部,不检查负责人
      if (permissionsMap[demand?.businessMode?.modeCode] || (demand?.creatorId === loginUserId)) {
        return true;
      }
    } else if (demand.status !== "Finished") {
      //待审以外的状态
      if (processDetailRow?.status === "Finished") {
        return false;
      } else if (permissionsMap[demand?.businessMode?.modeCode]
        || (processDetailRow?.principalId === loginUserId)) {
        return true;
      }
    }
  }

  const resolveNewRecord = (newRecord) => {
    _setTable(_prevState => {
      const rowIndex = _prevState.dataSource.findIndex(item => item.id === record.id)
      if (rowIndex === -1) {
        return _prevState
      }
      return {
        ..._prevState,
        dataSource: [..._prevState.dataSource.slice(0, rowIndex), {
          ..._prevState.dataSource[rowIndex],
          __dirty__: true,
          __processes__: newRecord,
        }, ..._prevState.dataSource.slice(rowIndex + 1)]
      }
    })
  }


  const handleDetailChange = (newVal, prop, process, detail) => {
    const pk = process.__key__
    const dk = detail.__key__
    setProcesses(prevState => {
      const pIndex = prevState.findIndex(item => item.__key__ === pk)
      if (pIndex === -1) {
        return prevState
      }
      const dIndex = prevState[pIndex]['processDetails'].findIndex(item => item.__key__ === dk)
      if (dIndex === -1) {
        return prevState
      }

      const newRecord = [...prevState.slice(0, pIndex), {
        ...prevState[pIndex],
        processDetails: [...prevState[pIndex]['processDetails'].slice(0, dIndex), {
          ...prevState[pIndex]['processDetails'][dIndex],
          [prop]: newVal,
        }, ...prevState[pIndex]['processDetails'].slice(dIndex + 1)]
      }, ...prevState.slice(pIndex + 1)]

      if (newRecord) {
        resolveNewRecord(newRecord)
      }

      return newRecord
    })
  }

  const addProcessDetail = (process) => {
    const pk = process.__key__
    setProcesses(prevState => {
      const pIndex = prevState.findIndex(item => item.__key__ === pk)
      if (pIndex === -1) {
        return prevState
      }
      const newRecord = [...prevState.slice(0, pIndex), {
        ...prevState[pIndex],
        processDetails: [...prevState[pIndex].processDetails, {
          __key__: Math.random().toString(32).slice(-8),
          startDate: new Date(),
          endDate: new Date(),
          status: 'Ready'
        }]
      }, ...prevState.slice(pIndex + 1)]

      if (newRecord) {
        resolveNewRecord(newRecord)
      }

      return newRecord
    })
  }

  const deleteProcessDetail = (process, detail) => {
    const pk = process.__key__
    const dk = detail.__key__
    setProcesses(prevState => {
      const pIndex = prevState.findIndex(item => item.__key__ === pk)
      if (pIndex === -1) {
        return prevState
      }
      const dIndex = prevState[pIndex]['processDetails'].findIndex(item => item.__key__ === dk)
      if (dIndex === -1) {
        return prevState
      }

      const newRecord = [...prevState.slice(0, pIndex), {
        ...prevState[pIndex],
        processDetails: [...prevState[pIndex]['processDetails'].slice(0, dIndex),
          ...prevState[pIndex]['processDetails'].slice(dIndex + 1)]
      }, ...prevState.slice(pIndex + 1)]

      if (newRecord) {
        resolveNewRecord(newRecord)
      }

      return newRecord
    })
  }

  const isOverTime = (record) => {
    if (record.endDate) {
      if (record['finishDate']) {
        const finishDate = new Date(record['finishDate']);
        const endDate = new Date(record.endDate);
        return finishDate <= endDate ? "否" : "超时"
      } else if (record.status === 'Underway') {
        const now = new Date();
        now.setHours(0);
        now.setSeconds(0);
        now.setMinutes(0);
        const endDate = new Date(record.endDate);
        return now <= endDate ? "否" : "超时"
      } else {
        return "-"
      }
    } else {
      return "-"
    }

  }
  return <div style={{padding: '20px 50px'}}>
    {
      !!processes.length && <>
        <Steps progressDot direction="vertical" current={processes.length}>
          {
            processes.map(p => {
              return <Steps.Step key={p.id}
                                 style={{width: '70%', minWidth: 1080}}
                                 title={
                                   <Space>
                                     <span style={{color: 'var(--primary-color)'}}>{p.processName}</span>
                                     {
                                       (permissionsMap['bi-auto-deploy.DemandController.saveOrUpdate'] && hasProcessDetailEditRightForAPD(record, p)) &&
                                       <Button style={{transform: 'scale(0.9)'}}
                                               icon={<PlusOutlined/>} type={'primary'}
                                               onClick={() => addProcessDetail(p)}
                                               size={'small'} shape={'circle'}/>
                                     }
                                   </Space>
                                 }
                                 description={<>{p.processDetails.map(d => {
                                   return <div key={d.id} className={'flex flex-start'}>
                                     <Row key={d.id} gutter={8} className={'flex-auto'}>
                                       <Col span={4} className={'mb5'}>
                                         <Input.Group compact>
                                           <Input defaultValue={'负责人'} disabled
                                                  style={{width: 70, textAlign: 'center'}}/>
                                           <Select style={{width: 'calc(95% - 70px)'}}
                                                   value={d.principalId}
                                                   onChange={v => handleDetailChange(v, 'principalId', p, d)}
                                                   showSearch
                                                   disabled={record.status === 'Freeze' || !hasProcessDetailEditRightForPrincipal(record, d)}
                                                   filterOption={(search, item) => {
                                                     return item.children.toLowerCase().indexOf(search.toLowerCase()) >= 0
                                                   }}>
                                             {
                                               userList.current.map(u => {
                                                 return <Select.Option value={u.idUser}
                                                                       key={u.idUser}>{u.nameCn}</Select.Option>
                                               })
                                             }
                                           </Select>
                                         </Input.Group>
                                       </Col>
                                       <Col span={6}>
                                         <Input.Group compact>
                                           <Input defaultValue={'开始日期'} disabled
                                                  style={{width: 80, textAlign: 'center'}}/>
                                           <DatePicker
                                             disabled={record.status === 'Freeze' || !hasProcessDetailEditRight(record, d)}
                                             value={moment(d.startDate)}
                                             onChange={v => handleDetailChange(v.format('YYYY-MM-DD'), 'startDate', p, d)}
                                             allowClear={false}
                                             style={{width: 'calc(95% - 80px)'}}/>
                                         </Input.Group>
                                       </Col>
                                       <Col span={6}>
                                         <Input.Group compact>
                                           <Input defaultValue={'结束日期'} disabled
                                                  style={{width: 80, textAlign: 'center'}}/>
                                           <DatePicker
                                             disabled={record.status === 'Freeze' || !hasProcessDetailEditRight(record, d)}
                                             value={moment(d.endDate)}
                                             onChange={v => handleDetailChange(v.format('YYYY-MM-DD'), 'endDate', p, d)}
                                             allowClear={false}
                                             style={{width: 'calc(95% - 80px)'}}/>
                                         </Input.Group>
                                       </Col>
                                       <Col span={4}>
                                         <Input.Group compact>
                                           <Input defaultValue={'是否超时'} disabled
                                                  style={{width: 80, textAlign: 'center'}}/>
                                           <Select value={isOverTime(d)} style={{width: 'calc(95% - 80px)'}} disabled>
                                             <Select.Option value={'超时'}>超时</Select.Option>
                                             <Select.Option value={'否'}>否</Select.Option>
                                           </Select>
                                         </Input.Group>
                                       </Col>
                                       <Col span={4}>
                                         <Input.Group compact>
                                           <Input defaultValue={'状态'} disabled
                                                  style={{width: 50, textAlign: 'center'}}/>
                                           <Select
                                             disabled={['PendingTrial', 'Ready', 'Freeze'].includes(record.status) || !hasProcessDetailEditRight(record, d)}
                                             value={d.status} style={{width: 'calc(95% - 50px)'}}
                                             onChange={v => handleDetailChange(v, 'status', p, d)}>
                                             {
                                               Object.keys(PROCESS_DETAIL_STATUS).map(key => {
                                                 return <Select.Option value={key}
                                                                       key={key}>{PROCESS_DETAIL_STATUS[key]}</Select.Option>
                                               })
                                             }
                                           </Select>
                                         </Input.Group>
                                       </Col>
                                     </Row>
                                     {
                                       (hasProcessDetailEditRight(record, d) && permissionsMap['bi-auto-deploy.DemandController.saveOrUpdate']) &&
                                       <Button size={'small'} icon={<MinusOutlined/>} shape={'circle'} danger
                                               onClick={() => deleteProcessDetail(p, d)}
                                               style={{transform: 'scale(0.9)', marginBottom: 10}}/>
                                     }
                                   </div>
                                 })}</>}/>
            })
          }
        </Steps>
      </>
    }
    <Table style={{width: '70%', minWidth: 960}} locale={{emptyText: '没有数据'}}
           className={classes.demandDetailsTable} {...table} />
  </div>
}))


const SetNewFlowNodeName = (props) => {
  const {visible, setVisible, addFlowNode} = props
  const [form] = useForm()
  useEffect(() => {
    if (visible) {
      form.resetFields()
    }
  }, [visible, form])

  const handleOk = () => {
    form.validateFields().then(values => {
      addFlowNode(values['processName'])
      setVisible(false)
    })
  }

  return <DraggableModal visible={visible} title={'输入流程名称'}
                         destroyOnClose
                         onOk={handleOk}
                         onCancel={() => setVisible(false)}>
    <Form form={form}>
      <Form.Item label={'名称'} name={'processName'} rules={[{required: true}, {min: 2, max: 15}]}>
        <Input/>
      </Form.Item>
    </Form>
  </DraggableModal>
}

const SetDemandDesc = (props) => {
  const {visible, setVisible, onSubmitted, currentDemandRow} = props
  const [descText, setDescText] = useState()
  const handleOk = () => {
    onSubmitted({...(currentDemandRow || {}), description: descText, type: 'Text'})
    setVisible(false)
  }

  useEffect(() => {
    if (visible) {
      setDescText(currentDemandRow?.description)
    }
  }, [visible, currentDemandRow])

  return <DraggableModal visible={visible} title={'内容编辑'}
                         width={800}
                         onOk={handleOk}
                         onCancel={() => setVisible(false)} destroyOnClose>
    <Input.TextArea rows={15} value={descText} onChange={e => setDescText(e.target.value)}/>
  </DraggableModal>
}


const EditModal = forwardRef((props, ref) => {
  const classes = useStyle()
  const {
    visible,
    setVisible,
    modeList,
    userList,
    setNewFlowNodeVisible,
    setDemandDescVisible,
    setCurrentDemandRow, onSubmitted, currentRecordRow
  } = props
  const [form] = useForm()
  const flowNodes = useRef([])
  const [, _setFlowNodes] = useState([])
  const [flowTemplateList, setFlowTemplateList] = useState([])
  useEffect(() => {
    if (visible) {
      axios.get('/bi-auto-deploy/api/user/processTemplate/listForSelect').then(({data}) => {
        setFlowTemplateList(data)
      })
    } else {
      flowNodes.current = []
    }

  }, [visible, setFlowTemplateList])

  const generateRowCfg = (processName, dataSource = []) => {
    const key = Math.random().toString(32).slice(-8)
    return {
      __key__: key,
      table: {
        ...table0,
        dataSource,
        columns: [{title: processName, align: 'center'},
          {
            title: '负责人', dataIndex: 'principalId', align: 'center', render: (_, record) => {
              return <Select style={{width: '100%'}} size={'small'} showSearch
                             getPopupContainer={el => el}
                             defaultValue={record.principalId}
                             onChange={(v) => handleCellChange(key, record, 'principalId', v)}
                             filterOption={(search, item) => {
                               return item.children.toLowerCase().indexOf(search.toLowerCase()) >= 0
                             }}>
                {userList.map(item => <Select.Option value={item.idUser}
                                                     key={item.idUser}>{item.nameCn}</Select.Option>)}
              </Select>
            }
          },
          {
            title: '开始日期', dataIndex: 'startDate', align: 'center', render: (text, record) => {
              return <DatePicker size={'small'}
                                 defaultValue={record.startDate ? moment(record.startDate) : ''}
                                 getPopupContainer={el => el}
                                 onChange={v => handleCellChange(key, record, 'startDate', moment(v).format('YYYY-MM-DD'))}/>
            }
          },
          {
            title: '结束日期', dataIndex: 'endDate', align: 'center', render: (text, record) => {
              return <DatePicker size={'small'}
                                 defaultValue={record.endDate ? moment(record.endDate) : ''}
                                 getPopupContainer={el => el}
                                 onChange={v => handleCellChange(key, record, 'endDate', moment(v).format('YYYY-MM-DD'))}/>
            }
          },
          {
            title: <Space style={{transform: 'scale(0.9)'}}>
              <Button size={'small'} shape={'circle'} type={'primary'}
                      onClick={() => handleAddRowForFlowNode(key)}><PlusOutlined/></Button>
              <Button size={'small'} shape={'circle'} danger onClick={() => handleDeleteFlowNode(key)}><MinusOutlined/></Button>
            </Space>,
            render: (text, record) => {
              return <Space style={{transform: 'scale(0.9)'}}>
                <Button size={'small'} danger shape={'circle'}
                        onClick={() => handleDeleteFlowRow(record, key)}><MinusOutlined/></Button>
              </Space>
            },
            align: 'center'
          }
        ]
      }
    }
  }

  useEffect(() => {
    if (visible && currentRecordRow?.id) {
      flowNodes.current = currentRecordRow.processes.map(item => {
        return generateRowCfg(item.processName, item.processDetails)
      })
      form.setFieldsValue({
        ...currentRecordRow,
        businessModeId: currentRecordRow['businessMode'].id,
        startDate: moment(currentRecordRow.startDate),
        endDate: moment(currentRecordRow.endDate)
      })

      setTable1(prevState => {
        return {
          ...prevState,
          dataSource: currentRecordRow.demandDetails.map(_ => {

            return {
              __key__: Math.random().toString(32).slice(-8),
              ..._
            }
          })
        }
      })

    } else {
      form.resetFields()
    }
    // eslint-disable-next-line
  }, [visible, currentRecordRow, form])

  const popupFlowNodeNameModal = () => {
    setNewFlowNodeVisible(true)
  }

  const popupDemandDescModal = () => {
    setCurrentDemandRow(null)
    setDemandDescVisible(true)
  }

  const checkDemandRow = (record) => {
    setDemandDescVisible(true)
    setCurrentDemandRow(record)
  }

  const {table: table0} = useTable({
    pagination: false,
    size: 'small',
    rowKey: '__key__',
    locale: {
      emptyText: '暂无数据'
    },
  })

  const {table: table1, setTable: setTable1} = useTable({
    pagination: false,
    rowKey: '__key__',
    size: 'small',
    locale: {
      emptyText: '暂无数据'
    },
    columns: [
      {
        dataIndex: '', title: '#', render: (_, record, index) => {
          return index + 1
        }, width: 80, align: 'center'
      },
      {
        dataIndex: 'type', title: '类型', align: 'center'
      },
      {
        dataIndex: 'content', title: '内容/文件', align: 'center', render: (_, record) => {
          const {type, fileName} = record
          return type === 'Text' ?
            <Button size={'small'} type={'link'} onClick={() => checkDemandRow(record)}>查看</Button> : fileName
        }
      },
      {
        dataIndex: 'actions', title: '操作', align: 'center', render: (_, record) => {
          return <Button danger size={'small'} onClick={() => deleteDemandRow(record)}><MinusOutlined/></Button>
        }
      }
    ]
  })


  const handleFlowTempChange = (v) => {
    const selected = flowTemplateList.find(item => item.id === v)
    flowNodes.current = (selected ? selected['processes'] : []).map((item) => {
      return {
        ...item,
        ...generateRowCfg(item['processName'])
      }
    })
    _setFlowNodes(flowNodes.current)
  }

  const handleCellChange = (tableKey, record, prop, v) => {
    const index = flowNodes.current.findIndex(_ => _.__key__ === tableKey)
    const _flowNodes = flowNodes.current.slice()
    const rowIndex = _flowNodes[index].table.dataSource.findIndex(item => item.__key__ === record.__key__)
    flowNodes.current[index].table.dataSource[rowIndex][prop] = v
  }

  const handleDeleteFlowRow = (record, key) => {
    const index = flowNodes.current.findIndex(_ => _.__key__ === key)
    const _flowNodes = flowNodes.current.slice()
    const rowIndex = _flowNodes[index].table.dataSource.findIndex(item => item.__key__ === record.__key__)
    _flowNodes[index].table = {
      ..._flowNodes[index].table,
      dataSource: [..._flowNodes[index].table.dataSource.slice(0, rowIndex), ..._flowNodes[index].table.dataSource.slice(rowIndex + 1)]
    }
    flowNodes.current = _flowNodes
    _setFlowNodes(_flowNodes)
  }

  const handleDeleteFlowNode = (key) => {
    const index = flowNodes.current.findIndex(_ => _.__key__ === key)
    const _flowNodes = flowNodes.current.slice()
    _flowNodes.splice(index, 1)
    flowNodes.current = _flowNodes
    _setFlowNodes(_flowNodes)
  }

  const handleAddRowForFlowNode = (key) => {
    const index = flowNodes.current.findIndex(_ => _.__key__ === key)
    const _flowNodes = flowNodes.current.slice()
    _flowNodes[index].table = {
      ..._flowNodes[index].table,
      dataSource: _flowNodes[index].table.dataSource.concat({
        __key__: Math.random().toString(32).slice(-8),
        startDate: '',
        endDate: '',
        principalId: undefined
      }),
    }
    flowNodes.current = _flowNodes
    console.log(flowNodes.current)
    _setFlowNodes(() => [..._flowNodes])
  }

  const addFlowNode = (processName) => {
    flowNodes.current.push({
      ...generateRowCfg(processName)
    })
  }
  const handleImportDemandFile = (e) => {
    const file = e.file
    if (!file) {
      return
    }
    const fd = new FormData()
    fd.append('files', file)
    axios.post('/bi-auto-deploy/api/user/file/upload', fd, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).then(({data: [result]}) => {
      const {fileName, filePath, type} = result
      updateDemandRow({fileName, filePath, type})
    })
  }

  const deleteDemandRow = (row) => {
    setTable1(prevState => {
      const idx = prevState.dataSource.findIndex(item => item.__key__ === row.__key__)
      return {
        ...prevState,
        dataSource: [...prevState.dataSource.slice(0, idx), ...prevState.dataSource.slice(idx + 1)]
      }
    })
  }
  const updateDemandRow = (row) => {
    if (row.__key__) {
      const idx = table1.dataSource.findIndex(item => item.__key__ === row.__key__)
      setTable1(prevState => ({
        ...prevState,
        dataSource: [...table1.dataSource.slice(0, idx), {
          ...row
        }, ...table1.dataSource.slice(idx + 1)]
      }))
    } else {
      setTable1(prevState => ({
        ...prevState,
        dataSource: [...table1.dataSource.slice(), {...row, __key__: Math.random().toString(32).slice(-8)}]
      }))
    }
  }
  useImperativeHandle(ref, () => {
    return {
      addFlowNode,
      updateDemandRow,
    }
  })

  const handleOk = () => {
    form.validateFields().then(values => {
      console.log(values)
      const demandDetails = table1.dataSource.slice().map(item => {
        delete item.__key__
        return item
      })
      const processes = flowNodes.current.map((_, index) => {
        return {
          orderValue: index,
          processName: _.table.columns[0].title,
          processDetails: _.table.dataSource.map((p, index) => {
            delete p.__key__
            return {
              ...p,
              orderValue: index
            }
          })
        }
      })

      console.log(processes, demandDetails)

      axios.post('/bi-auto-deploy/api/admin/demand/saveOrUpdate', {
        ...values,
        startDate: values.startDate ? moment(values.startDate).format('YYYY-MM-DD') : undefined,
        endDate: values.endDate ? moment(values.endDate).format('YYYY-MM-DD') : undefined,
        demandDetails,
        processes
      }).then(() => {
        message.success('操作成功')
        setVisible(false)
        onSubmitted()
      })
    })
  }

  return <DraggableModal visible={visible}
                         destroyOnClose={true}
                         width={1000}
                         title={currentRecordRow?.id ? '编辑需求' : '新增需求'} onOk={handleOk}
                         onCancel={() => setVisible(false)}>
    <Form form={form}>
      <Form.Item hidden name={'id'}>
        <Input/>
      </Form.Item>
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item label={'需求名称'} name={'demandName'}>
            <Input/>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label={'需求类型'} name={'demandType'}>
            <Select getPopupContainer={el => el}>
              {Object.keys(DEMAND_TYPE).map(key => <Select.Option value={key}
                                                                  key={key}>{DEMAND_TYPE[key]}</Select.Option>)}
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item label={'业务模块'} name={'businessModeId'}>
            <Select getPopupContainer={el => el}>
              {modeList.map(item => {
                return <Select.Option value={item.id} key={item.id}>{item['modeName']}</Select.Option>
              })}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label={'产品经理'} name={'productManagerId'}>
            <Select getPopupContainer={el => el}
                    showSearch
                    filterOption={(search, item) => {
                      return item.children.toLowerCase().indexOf(search.toLowerCase()) >= 0
                    }}>
              {
                userList.map(_ => <Select.Option value={_.idUser} key={_.idUser}>{_.nameCn}</Select.Option>)
              }
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item label={'开始时间'} name={'startDate'}>
            <DatePicker style={{width: '100%'}} getPopupContainer={el => el}/>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label={'结束时间'} name={'endDate'}>
            <DatePicker style={{width: '100%'}} getPopupContainer={el => el}/>
          </Form.Item>
        </Col>
      </Row>
    </Form>
    <div className={'mb10'}>
      <Button onClick={popupFlowNodeNameModal}>增加流程节点</Button>
      <Select style={{width: 150, marginLeft: 20}} placeholder={'选择流程模板'}
              onChange={v => handleFlowTempChange(v)}>
        {
          flowTemplateList.map(item => <Select.Option value={item.id}
                                                      key={item.id}>{item['templateName']}</Select.Option>)
        }
      </Select>
      <Alert className={'mt10'} type={'error'} message={'请谨慎使用模板，当选择新的模板时会清空已设置的数据'}/>
    </div>
    {
      flowNodes.current.map(item => <Table key={item.__key__} {...item.table}
                                           className={`${classes.miniHeaderTable} ${classes.demandDetailsTable}`}
                                           size={'small'}/>)
    }

    {
      !flowNodes.current.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}/>
    }

    <div className={'my10'}>
      <Space>
        <Button onClick={popupDemandDescModal}>增加需求描述</Button>
        <Upload maxCount={1} showUploadList={false} accept={'.xlsx,.jar'} customRequest={handleImportDemandFile}>
          <Button>上传Excel需求文档/jar文件</Button>
        </Upload>
      </Space>
    </div>
    <Table  {...table1} className={`${classes.miniHeaderTable} ${classes.demandDetailsTable}`}/>
  </DraggableModal>
})


const RecordLog = (props) => {
  const {visible, setVisible, currentRecordRow} = props
  const logs = (currentRecordRow?.['logs'] || [])
  return <DraggableModal visible={visible} setVisible={setVisible}
                         destroyOnClose={true}
                         width={850}
                         bodyStyle={{height: 500, overflow: 'auto'}}
                         onCancel={() => setVisible(false)}
                         footer={<Button type={'primary'} onClick={() => setVisible(false)}>确定</Button>}
                         title={'日志'}>
    <Timeline>
      {
        logs.map(item => {
          return <Timeline.Item key={item.id}>
            <div>{item.description}</div>
            <p>{item['operationDate']}</p>
          </Timeline.Item>
        })
      }
    </Timeline>
  </DraggableModal>
}

function RequirementsMgmt(props) {
  const {userInfo} = props
  const userList = useUserList()
  const userListRef = useRef()
  userListRef.current = userList
  const [query, setQuery] = useState({
    businessModeId: undefined,
    name: '',
    overTime: undefined,
    demandType: undefined,
    productManagerId: undefined,
    principalId: undefined,
    status: undefined,
  })
  const {permissionsMap} = userInfo

  useEffect(() => {
    const {userName, permissions, id} = userInfo
    if (userName !== 'admin') {
      const hasModulePerm = permissions.find(pk => /^BM_.+/.test(pk))
      if (hasModulePerm) {
        // 去掉了产品经理的默认值
        setQuery(prevState => ({...prevState, productManagerId: undefined}))
      } else {
        setQuery(prevState => ({...prevState, principalId: id}))
      }
    }
  }, [userInfo])


  const [dateRange, seDateRange] = useState([])
  const [modeList, setModeList] = useState([])
  useEffect(() => {
    axios.get('/bi-auto-deploy/api/user/businessMode/listAllNormalMode').then(({data}) => {
      setModeList(data)
    })
  }, [])

  const hasFinished = (demand) => {
    let isFinish = true;
    demand.processes.forEach(process => {
      process.processDetails.forEach(pd => {
        if (pd.status !== 'Finished') {
          isFinish = false;
        }
      })
    })
    return isFinish;
  }

  const {table, setTable} = useTable({
    rowKey: 'id',
    scroll: {
      x: 1200
    },
    expandable: {
      fixed: 'left',
      expandRowByClick: false,
      expandedRowRender: record => <CollapsedRow setTable={setTable} record={record}
                                                 userList={userListRef}/>,
      expandIcon: ({expanded, onExpand, record}) =>
        expanded ? (
          <DownOutlined style={{width: 32, lineHeight: '32px', color: '#999'}} onClick={e => onExpand(record, e)}/>
        ) : (
          <RightOutlined style={{width: 32, lineHeight: '32px', color: '#999'}} onClick={e => onExpand(record, e)}/>
        )
    },
    columns: [
      {
        title: '业务模块', dataIndex: 'businessMode', shouldCellUpdate: (record, prevRecord) => {
          return record['businessMode'] !== prevRecord['businessMode']
        }, render: (_, record) => {
          return <OverflowTooltip>{record?.['businessMode']?.['modeName']}</OverflowTooltip>
        }
      },
      {
        title: '需求类型', dataIndex: 'demandType', shouldCellUpdate: (record, prevRecord) => {
          return record['demandType'] !== prevRecord['demandType']
        }, render: (text) => {
          return <OverflowTooltip>{DEMAND_TYPE[text]}</OverflowTooltip>
        }
      },
      {
        title: '需求名称', dataIndex: 'demandName', shouldCellUpdate: (record, prevRecord) => {
          return record['demandName'] !== prevRecord['demandName']
        }, render: (text) => {
          return <OverflowTooltip>{text}</OverflowTooltip>
        }
      },
      {
        title: '产品经理', dataIndex: 'productManager', shouldCellUpdate: (record, prevRecord) => {
          return record['productManager'] !== prevRecord['productManager']
        }, render: (_, record) => {
          return <OverflowTooltip>{record?.['productManager']?.['nameCn']}</OverflowTooltip>
        }
      },
      {
        title: '开始时间', dataIndex: 'startDate', shouldCellUpdate: (record, prevRecord) => {
          return record['startDate'] !== prevRecord['startDate']
        },
      },
      {
        title: '结束时间', dataIndex: 'endDate', shouldCellUpdate: (record, prevRecord) => {
          return record['endDate'] !== prevRecord['endDate']
        },
      },
      {
        title: '进度', dataIndex: 'progress', shouldCellUpdate: (record, prevRecord) => {
          return !(record['startDate'] === prevRecord['startDate'] && record['endDate'] === prevRecord['endDate']
            && record['status'] === prevRecord['status'])
        }, render: (_, record) => {
          let progress = 0
          const {processes} = record
          let totalDay = 0
          let finishDay = 0
          processes.forEach(process => {
            process.processDetails.forEach(pd => {
              const {startDate, endDate, status} = pd
              const days = ((moment(endDate) - moment(startDate)) / (86400 * 1000)) + 1
              if (!isNaN(days)) {
                totalDay += days

                if (status === 'Finished') {
                  finishDay += days
                }
              }
            })
          })

          if (totalDay === 0) {
            if (record.status !== 'PendingTrial' && record.status !== 'Ready') {
              progress = 100
            }
          } else {
            progress = (finishDay / totalDay * 100).toFixed(0)
          }
          return <Progress percent={progress} status="active"/>
        }
      },
      {
        title: '是否超时', dataIndex: 'isOvertime', shouldCellUpdate: (record, prevRecord) => {
          return !(record['startDate'] === prevRecord['startDate'] && record['endDate'] === prevRecord['endDate']
            && record['status'] === prevRecord['status'])
        }, width: 100, render: (text, record) => {
          const {endDate, finishDate, status} = record
          if (endDate) {
            if (finishDate) {
              return moment(finishDate) < moment(endDate) ? '否' : '超时'
            } else if (status === 'Underway') {
              return moment() < moment(endDate) ? '否' : '超时'
            } else {
              return '--'
            }
          } else {
            return '--'
          }
        }
      },
      {
        title: '状态', dataIndex: 'status', width: 100, shouldCellUpdate: (record, prevRecord) => {
          return record['status'] !== prevRecord['status']
        }, render: (text) => {
          return <OverflowTooltip>{DEMAND_STATUS[text]}</OverflowTooltip>
        }
      },
      {
        title: '操作', dataIndex: 'actions', fixed: 'right', shouldCellUpdate: () => {
          return true
        }, width: 300, render: (_, record) => {
          const {status, __dirty__, businessMode: {modeCode}} = record
          return <Space>
            {
              __dirty__ ? <>
                {
                  (permissionsMap['bi-auto-deploy.DemandController.saveOrUpdate'] && status !== 'Finished') &&
                  < Button size={'small'} type={'link'} onClick={() => saveRecordExpandChange(record)}>保存</Button>
                }

                <Button size={'small'} type={'link'} danger onClick={() => resetRecordExpand(record)}>重置</Button>
              </> : <>
                {
                  (permissionsMap['bi-auto-deploy.DemandController.saveOrUpdate'] && status !== 'Finished') &&
                  <Button size={'small'} type={'link'} onClick={() => editRecord(record)}>编辑</Button>
                }
                {
                  (status === 'PendingTrial' && permissionsMap[modeCode] && permissionsMap['bi-auto-deploy.DemandController.underway']) &&
                  <Popconfirm title={'是否开始该需求？'} onConfirm={() => passRecord(record)}>
                    <Button size={'small'} type={'link'}>审核通过</Button>
                  </Popconfirm>
                }
                {
                  (permissionsMap[modeCode] && status === 'Underway'
                    && permissionsMap['bi-auto-deploy.DemandController.finish'] && hasFinished(record)) &&
                  <Popconfirm title={'确定完结此需求吗？'} onConfirm={() => finishedRecord(record)}>
                    <Button size={'small'} type={'link'}>完结</Button>
                  </Popconfirm>
                }
                {
                  (permissionsMap[modeCode] && status === 'Underway' && permissionsMap['bi-auto-deploy.DemandController.freeze']) &&
                  <Button size={'small'} type={'link'} onClick={() => freezeRecord(record)}>冻结</Button>
                }
                {
                  (permissionsMap[modeCode] && status === 'Freeze' && permissionsMap['bi-auto-deploy.DemandController.freeze']) &&
                  <Button size={'small'} type={'link'} onClick={() => unFreezeRecord(record)}>解除冻结</Button>
                }
                {
                  (permissionsMap[modeCode] && permissionsMap['bi-auto-deploy.DemandController.delete'] && status !== 'Finished') &&
                  <Popconfirm title={'确定删除吗？'} onConfirm={() => deleteRecord(record)}>
                    <Button size={'small'} type={'link'} danger>删除</Button>
                  </Popconfirm>
                }
                <Button size={'small'} type={'link'} onClick={() => checkLog(record)}>日志</Button>
              </>
            }
          </Space>
        }
      }
    ]
  })
  const {current: page, pageSize} = table.pagination
  const [_startDate, _endDate] = dateRange || []
  const startDate = _startDate ? moment(_startDate).format('YYYY-MM-DD') : ''
  const endDate = _endDate ? moment(_endDate).format('YYYY-MM-DD') : ''
  const {run: fetchList, loading} = useRequest(() => {
    return axios.get('/bi-auto-deploy/api/admin/demand/list', {
      params: {
        ...query,
        page, pageSize,
        startDate, endDate
      }
    }).then(({data: {list, totalRows: total}}) => {
      setTable(prevState => ({
        ...prevState,
        dataSource: list,
        pagination: {...prevState.pagination, total}
      }))
    })
  }, {
    manual: true,
    debounceInterval: 200
  })

  useEffect(() => {
    setTable(prevState => ({
      ...prevState,
      pagination: {...prevState.pagination, current: 1}
    }))
    // eslint-disable-next-line
  }, [query])

  useEffect(() => {
    fetchList()
  }, [page, pageSize, query, startDate, endDate, fetchList])

  const checkLog = (record) => {
    setRecordLogVisible(true)
    setCurrentRecordRow(record)
  }

  const editRecord = (record) => {
    setEditModalVisible(true)
    setCurrentRecordRow(record)
  }

  const passRecord = (record) => {
    axios.get('/bi-auto-deploy/api/admin/demand/underway', {params: {id: record.id}}).then(() => {
      message.success('已开始需求')
      fetchList()
    })
  }

  const freezeRecord = (record) => {
    axios.get('/bi-auto-deploy/api/admin/demand/freeze', {params: {id: record.id}}).then(() => {
      message.success('冻结成功')
      fetchList()
    })
  }

  const unFreezeRecord = (record) => {
    axios.get('/bi-auto-deploy/api/admin/demand/relieve', {params: {id: record.id}}).then(() => {
      message.success('解除冻结成功')
      fetchList()
    })
  }

  const deleteRecord = (record) => {
    axios.get('/bi-auto-deploy/api/admin/demand/delete', {params: {id: record.id}}).then(() => {
      message.success('删除成功')
      fetchList()
    })
  }

  const finishedRecord = (record) => {
    axios.get('/bi-auto-deploy/api/admin/demand/finish', {params: {id: record.id}}).then(() => {
      message.success('已完结')
      fetchList()
    })
  }


  const [editModalKey, setEditModalKey] = useState()
  const [editModalVisible, setEditModalVisible] = useState(false)

  const handleEdit = () => {
    setEditModalKey(Math.random())
    setCurrentRecordRow(null)
    setEditModalVisible(true)
  }

  const resetRecordExpand = (record) => {
    setTable(prevState => {
      const index = prevState.dataSource.findIndex(item => item.id === record.id)
      if (index === -1) {
        return prevState
      }
      return {
        ...prevState,
        dataSource: [
          ...prevState.dataSource.slice(0, index),
          {
            ...prevState.dataSource[index],
            __dirty__: false,
          },
          ...prevState.dataSource.slice(index + 1)
        ]
      }
    })
  }

  const saveRecordExpandChange = (record) => {
    const {__processes__, businessMode} = record
    const data = {
      ...record,
      businessModeId: businessMode?.id,
      processes: __processes__
    }
    delete data.businessMode
    delete data.creator
    delete data.__processes__
    delete data.__dirty__
    axios.post('/bi-auto-deploy/api/admin/demand/saveOrUpdate', data).then(() => {
      message.success('保存成功')
      fetchList()
    })
  }


  const [newFlowNodeVisible, setNewFlowNodeVisible] = useState(false)

  const editRef = useRef()

  const addFlowNode = (processName) => {
    editRef && editRef.current?.addFlowNode(processName)
  }

  const updateDemandRow = (row) => {
    editRef && editRef.current?.updateDemandRow(row)
  }

  const [demandDescVisible, setDemandDescVisible] = useState(false)

  const [currentDemandRow, setCurrentDemandRow] = useState()


  const [recordLogVisible, setRecordLogVisible] = useState()


  const [currentRecordRow, setCurrentRecordRow] = useState()

  return (
    <div className={'px-6 py-6'}>
      <div className={'flex flex-start'} style={{alignItems: 'flex-start'}}>
        <div style={{flex: 1}}>
          <Row gutter={24}>
            <Col span={6}>
              <FieldItem label={'业务模块'} labelAlign={'left'}>
                <Select style={{flex: 1}} allowClear value={query.businessModeId} placeholder={'业务模块'}
                        onChange={v => setQuery(prevState => ({...prevState, businessModeId: v}))}>
                  {modeList.map(item => {
                    return <Select.Option value={item.id} key={item.id}>{item['modeName']}</Select.Option>
                  })}
                </Select>
              </FieldItem>
            </Col>
            <Col span={6}>
              <FieldItem label={'需求类型'} labelAlign={'left'}>
                <Select style={{flex: 1}} allowClear value={query.demandType} placeholder={'需求类型'}
                        onChange={v => setQuery(prevState => ({...prevState, demandType: v}))}>
                  {Object.keys(DEMAND_TYPE).map(key => <Select.Option value={key}
                                                                      key={key}>{DEMAND_TYPE[key]}</Select.Option>)}
                </Select>
              </FieldItem>
            </Col>
            <Col span={6}>
              <FieldItem label={'产品经理'} labelAlign={'left'} >
                <Select style={{flex: 1}} allowClear value={query.productManagerId}
                        showSearch placeholder={'产品经理'}
                        filterOption={(search, item) => {
                          return item.children.toLowerCase().indexOf(search.toLowerCase()) >= 0
                        }}
                        onChange={v => setQuery(prevState => ({...prevState, productManagerId: v}))}>
                  {
                    userList.map(_ => <Select.Option value={_.idUser} key={_.idUser}>{_.nameCn}</Select.Option>)
                  }
                </Select>
              </FieldItem>
            </Col>
            <Col span={6}>
              <FieldItem label={'是否超时'} labelAlign={'left'}>
                <Select style={{flex: 1}} allowClear value={query.overTime} placeholder={'是否超时'}
                        onChange={v => setQuery(prevState => ({...prevState, overTime: v}))}>
                  <Select.Option key={0} value={0}>否</Select.Option>
                  <Select.Option key={1} value={1}>是</Select.Option>
                </Select>
              </FieldItem>
            </Col>
          </Row>
          <Row gutter={24} className={'mt10'}>
            <Col span={6}>
              <FieldItem label={'需求状态'} labelAlign={'left'}>
                <Select style={{flex: 1}} allowClear value={query.status} placeholder={'需求状态'}
                        onChange={v => setQuery(prevState => ({...prevState, status: v}))}>
                  {
                    Object.keys(DEMAND_STATUS).map(key => <Select.Option
                      value={key} key={key}>{DEMAND_STATUS[key]}</Select.Option>)
                  }
                </Select>
              </FieldItem>
            </Col>
            <Col span={6}>
              <FieldItem label={'开始日期'} labelAlign={'left'}>
                <StyledDateRangePicker placeholder={['开始日期始', '开始日期终']} value={dateRange}
                                        onChange={v => seDateRange(v)}
                                        style={{flex: 1}} allowClear/>
              </FieldItem>
            </Col>
            <Col span={6}>
              <FieldItem label={'责任人'} labelAlign={'left'}>
                <Select style={{flex: 1}} allowClear value={query.principalId}
                        showSearch placeholder={'责任人'}
                        filterOption={(search, item) => {
                          return item.children.toLowerCase().indexOf(search.toLowerCase()) >= 0
                        }}
                        onChange={v => setQuery(prevState => ({...prevState, principalId: v}))}>
                  {
                    userList.map(_ => <Select.Option value={_.idUser} key={_.idUser}>{_.nameCn}</Select.Option>)
                  }
                </Select>
              </FieldItem>
            </Col>
            <Col span={6}>
              <FieldItem label={'需求名称'} labelAlign={'left'}>
                <Input allowClear value={query.name} placeholder={'需求名称'}
                       onChange={e => setQuery(prevState => ({...prevState, name: e.target.value}))}/>
              </FieldItem>
            </Col>
          </Row>
        </div>
        <div className={'ml-4'}>
          {
            permissionsMap['bi-auto-deploy.DemandController.saveOrUpdate'] &&
            <Button type={'primary'} onClick={() => handleEdit()}>新增</Button>
          }
        </div>
      </div>
      <Table  {...table} loading={loading} className={'mt10'}/>

      <EditModal visible={editModalVisible}
                 key={editModalKey}
                 setVisible={setEditModalVisible}
                 setNewFlowNodeVisible={setNewFlowNodeVisible}
                 setDemandDescVisible={setDemandDescVisible}
                 setCurrentDemandRow={setCurrentDemandRow}
                 userList={userList}
                 onSubmitted={fetchList}
                 currentRecordRow={currentRecordRow}
                 modeList={modeList} ref={editRef}/>

      <SetNewFlowNodeName addFlowNode={addFlowNode} visible={newFlowNodeVisible} setVisible={setNewFlowNodeVisible}/>

      <SetDemandDesc visible={demandDescVisible}
                     currentDemandRow={currentDemandRow}
                     setVisible={setDemandDescVisible} onSubmitted={updateDemandRow}/>

      <RecordLog visible={recordLogVisible} setVisible={setRecordLogVisible} currentRecordRow={currentRecordRow}/>
    </div>
  );
}

export default connect(state => {
  return {
    userInfo: state.user.userInfo
  }
})(RequirementsMgmt);
