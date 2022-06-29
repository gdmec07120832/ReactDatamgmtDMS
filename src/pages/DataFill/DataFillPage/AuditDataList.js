import React, {useEffect, useState} from 'react'
import {connect} from 'react-redux'
import {Button, Col, Form, Input, message, Modal, Row, Select, Space, Table} from 'antd'
import {useParams} from 'react-router-dom'
import axios from '../../../utils/axios'
import useTable from '../../../hooks/useTable'
import {useRequest} from 'ahooks'
import DraggableModal from '../../../components/DraggableModal'
import {useForm} from 'antd/es/form/Form'
import OverflowTooltip from '../../../components/OverflowTooltip';

const RejectModal = (props) => {
  const [form] = useForm()
  const [loading, setLoading] = useState(false)
  const {visible, setVisible, recordId, templateId, onSubmitted} = props
  const handleSubmit = () => {
    form.validateFields().then((values) => {
      setLoading(true)
      axios.get('/bi-data-reporting/api/admin/excel/excelTemplate/audit', {
        params: {
          dataId: recordId,
          templateId: templateId,
          result: '-1',
          ...values

        }
      }).then(() => {
        setLoading(false)
        setVisible(false)
        onSubmitted()
      }).catch(() => {
        setLoading(false)
      })
    })

  }
  return <DraggableModal visible={visible} title={'不通过'}
                         okButtonProps={{loading}}
                         onOk={handleSubmit}
                         onCancel={() => setVisible(false)}>
    <Form form={form}>
      <Form.Item label={'理由'} name={'auditOpinion'} rules={[{required: true}]}>
        <Input/>
      </Form.Item>
    </Form>
  </DraggableModal>

}

function AuditDataList(props) {
  const {setBreadcrumbParams, forAudit} = props
  const {templateId} = useParams()
  const [templateName, setTemplateName] = useState('')
  const [columnList, setColumnList] = useState([])
  const [dataAudit, setDataAudit] = useState(false)
  const [query, setQuery] = useState({
    searchColumnName: undefined,
    searchKeyword: ''
  })

  const [realQuery, setRealQuery] = useState({})

  useEffect(() => {
    axios.get(`/bi-data-reporting/api/user/excel/excelTemplate/getDetails`, {
      params: {id: templateId}
    }).then(({data: {excelTemplate}}) => {
      setTemplateName(excelTemplate.excelName)
      setBreadcrumbParams([{title: excelTemplate.excelName, id: templateId}])
    })
  }, [setBreadcrumbParams, templateId])

  const {table, setTable} = useTable({
    scroll: {x: 1600},
    bordered: true,
    rowKey: 'ID',
    dataSource: [],
    columns: [],
  })

  const [selectedRowKeys, setSelectedRowKeys] = useState([])


  const {current: page, pageSize} = table.pagination
  const {searchColumnName, searchKeyword} = realQuery

  const {run: fetchList, loading} = useRequest(() => {
    return axios.get('/bi-data-reporting/api/user/excel/excelTemplate/viewData', {
      params: {
        id: templateId,
        page, pageSize,
        searchColumnName, searchKeyword,
        forAudit: forAudit ? true : undefined
      }
    }).then(({data: {totalRows, columnList, list, dataAudit}}) => {
      const columns = columnList.map(col => {
        return {
          title: col.name,
          width: 100,
          render: (text) => {
            return <OverflowTooltip>{text}</OverflowTooltip>
          },
          dataIndex: col.field,
          shouldCellUpdate: (record, prevRecord) => {
            return record[col.field] !== prevRecord[col.field]
          }
        }
      })
      setDataAudit(dataAudit)
      if (dataAudit) {
        columns.push({
          title: '操作',
          dataIndex: 'action',
          width: 120,
          align: 'center',
          fixed: 'right',
          render: (text, record) => {
            const {AUDIT_RESULT: result} = record
            return <>
              {
                (!result && !forAudit) &&
                <Button size={'small'} type={'link'} onClick={() => handleSubmit(record.ID)}>提交审核</Button>
              }
              {
                (result === '0' && !forAudit) && <Button size={'small'} type={'link'} danger
                                                         onClick={() => handleCancelSubmit(record.ID)}>取消提交</Button>
              }
              {
                (result === '0' && forAudit) && <>
                  <Button type={'link'} size={'small'} onClick={() => handlePass(record.ID)}>通过</Button>
                  <Button type={'link'} size={'small'} danger onClick={() => handleReject(record.ID)}>不通过</Button>
                </>
              }
              {
                ((result === '1' || result === '-1') && forAudit)
                && <Button type={'link'} size={'small'} onClick={() => handleRecall(record.ID)}>撤回</Button>
              }
            </>
          }
        })
      }
      setColumnList(columnList)
      setTable(prevState => ({
        ...prevState,
        pagination: {...prevState.pagination, total: totalRows},
        dataSource: list || [],
        columns
      }))
    })
  }, {manual: true})

  useEffect(() => {
    fetchList()
  }, [
    fetchList,
    templateId, page, pageSize, setTable, setColumnList, searchColumnName, searchKeyword
  ])

  const handleBatchProcess = (ids, action) => {
    return axios.get('/bi-data-reporting/api/user/excel/excelTemplate/batchProcessing', {
      params: {
        ids,
        templateId: templateId,
        operation: action
      }
    })
  }

  const handlePass = (ids) => {
    Modal.confirm({
      content: '确定通过吗？',
      onOk: () => {
        return handleBatchProcess(ids, 'PASS').then(() => {
          fetchList()
        })
      }
    })
  }

  const [rejectModalVisible, setRejectModalVisible] = useState(false)
  const [currentRejectId, setCurrentRejectId] = useState(null)
  const handleReject = (id) => {
    setRejectModalVisible(true)
    setCurrentRejectId(id)
  }

  const handleRecall = (ids) => {
    Modal.confirm({
      content: '确定撤回吗？',
      onOk: () => {
        return handleBatchProcess(ids, 'RECALL').then(() => {
          fetchList()
        })
      }
    })
  }

  const handleSubmit = (ids) => {
    return handleBatchProcess(ids, 'SUBMIT').then(() => {
      fetchList()
    })
  }

  const handleCancelSubmit = (ids) => {
    return handleBatchProcess(ids, 'CANCELSUBMIT').then(() => {
      fetchList()
    })
  }

  const batchPass = () => {
    if (!selectedRowKeys.length) {
      message.error('请至少选中一条记录')
      return
    }
    Modal.confirm({
      content: '确定批量通过吗？',
      onOk: () => {
        return handleBatchProcess(selectedRowKeys.toString(), 'PASS').then(() => {
          fetchList()
          setSelectedRowKeys([])
        })
      }
    })
  }

  const batchRecall = () => {
    if (!selectedRowKeys.length) {
      message.error('请至少选中一条记录')
      return
    }
    Modal.confirm({
      content: '确定批量撤回吗？',
      onOk: () => {
        return handleBatchProcess(selectedRowKeys.toString(), 'RECALL').then(() => {
          fetchList()
          setSelectedRowKeys([])
        })
      }
    })
  }

  const batchSubmit = () => {
    if (!selectedRowKeys.length) {
      message.error('请至少选中一条记录')
      return
    }
    Modal.confirm({
      content: '确定批量提审吗？',
      onOk: () => {
        return handleSubmit(selectedRowKeys.toString()).then(() => {
          setSelectedRowKeys([])
        })
      }
    })
  }

  const batchCancelSubmit = () => {
    if (!selectedRowKeys.length) {
      message.error('请至少选中一条记录')
      return
    }
    Modal.confirm({
      content: '确定批量提审吗？',
      onOk: () => {
        return handleCancelSubmit(selectedRowKeys.toString()).then(() => {
          setSelectedRowKeys([])
        })
      }
    })
  }

  const handleQueryClick = () => {
    setTable((prevState) => ({...prevState, pagination: {...prevState.pagination, current: 1}}))
    setRealQuery(() => ({
      ...query
    }))
  }

  const exportRejectedData = () => {
    let url = axios.defaults.baseURL + '/bi-data-reporting/api/user/excel/excelTemplate/data/downloadRejectData'
    url = url + `?templateId=${templateId}&templateName=${window.encodeURI(templateName)}`
    window.open(url)
  }

  return (
    <div className={'px-6 py-6'}>
      <div className={'mb10 flex flex-start'}>
        <Row gutter={24} style={{flex: 1}}>
          <Col span={6}>
            <div className={'flex'}>
              <span style={{flex: '0 0 80px'}}>列名</span>
              <Select value={query.searchColumnName}
                      allowClear
                      onChange={v => setQuery(prevState => ({...prevState, searchColumnName: v}))} placeholder={'列名'}
                      style={{flex: 1}}>
                {
                  columnList.map(col => <Select.Option value={col.field} key={col.field}>
                    {col.name}</Select.Option>)
                }
              </Select>
            </div>
          </Col>
          <Col span={6}>
            <div className={'flex'}>
              <span style={{flex: '0 0 80px'}}>关键字</span>
              <Input value={query.searchKeyword}
                     allowClear
                     onChange={e => setQuery(prevState => {
                       return {...prevState, searchKeyword: e.type === 'change' ? e.target.value : ''}
                     })}
                     placeholder={'关键字'}/>
            </div>
          </Col>
        </Row>

        <div className={'ml20'}>
          <Space>
            <Button type={'primary'} onClick={handleQueryClick}>查询</Button>
            {
              (dataAudit && !forAudit) && <>
                <Button onClick={batchSubmit}>批量提审</Button>
                <Button onClick={batchCancelSubmit}>批量撤销提审</Button>
              </>
            }
            {
              (dataAudit && forAudit) && <>
                <Button onClick={batchPass}>批量通过</Button>
                <Button onClick={batchRecall}>批量撤回</Button>
                <Button onClick={exportRejectedData}>导出不通过数据</Button>
              </>
            }
          </Space>
        </div>
      </div>
      <RejectModal visible={rejectModalVisible} setVisible={setRejectModalVisible}
                   recordId={currentRejectId}
                   templateId={templateId} onSubmitted={fetchList}/>
      <Table {...table} loading={loading}/>
    </div>
  )
}

export default connect(null, (dispatch) => {
  return {
    setBreadcrumbParams: (payload) => {
      dispatch({type: 'set_breadcrumb_params', payload})
    }
  }
})(AuditDataList)
