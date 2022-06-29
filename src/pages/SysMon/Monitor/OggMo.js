import React, { forwardRef, useEffect, useImperativeHandle, useReducer, useRef, useState } from 'react'
import {
  Button,
  Card,
  Col,
  Drawer,
  Form,
  Input,
  message,
  Pagination,
  Popconfirm,
  Row,
  Space,
  Spin,
  Switch,
  Table,
} from 'antd'
import useTable from '../../../hooks/useTable'
import axios from '../../../utils/axios'
import OverflowTooltip from '../../../components/OverflowTooltip'
import DraggableModal from '../../../components/DraggableModal'
import { useForm } from 'antd/es/form/Form'
import { useRequest } from 'ahooks'
import moment from 'moment'
import { makeStyles } from '@material-ui/core/styles'
import { useSelector } from 'react-redux'

const EditModal = (props) => {
  const { visible, dispatch, currentRecord, onSubmitted } = props
  const [form] = useForm()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible && currentRecord?.id) {
      form.setFieldsValue(currentRecord)
    } else {
      form.resetFields()
    }
  }, [visible, currentRecord, form])

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        setLoading(true)
        axios
          .post('/bi-auto-deploy/api/admin/oggMonitor/saveOrUpdate', null, {
            params: {
              ...values,
            },
          })
          .then(() => {
            message.success('保存成功')
            onSubmitted()
            dispatch({
              type: 'changeEditModalVisible',
              payload: false,
            })
          })
      })
      .finally(() => {
        setLoading(false)
      })
  }
  return (
    <DraggableModal
      visible={visible}
      title={'新增/编辑'}
      onOk={handleOk}
      okButtonProps={{ loading }}
      onCancel={() =>
        dispatch({
          type: 'changeEditModalVisible',
          payload: false,
        })
      }>
      <Form form={form} labelCol={{ span: 4 }}>
        <Form.Item label={'ID'} name={'id'} hidden>
          <Input />
        </Form.Item>
        <Form.Item label={'名称'} name={'serverName'} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label={'URL'} name={'url'} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label={'TOKEN'} name={'token'} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label={'是否监控'} name={'needMonitor'} valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </DraggableModal>
  )
}

const PageMgmt = forwardRef((props, ref) => {
  const permissionsMap = useSelector((state) => state.user.permissionsMap)
  const { visible, dispatch } = props
  const { table, setTable } = useTable({
    rowKey: 'id',
    columns: [
      { title: '主键', dataIndex: 'id' },
      { title: '服务名', dataIndex: 'serverName' },
      {
        title: 'URL',
        dataIndex: 'url',
        render: (text) => {
          return <OverflowTooltip>{text}</OverflowTooltip>
        },
      },
      {
        title: '是否监控',
        dataIndex: 'needMonitor',
        render: (text) => {
          return text ? '是' : '否'
        },
      },
      {
        title: '操作',
        dataIndex: 'action',
        render: (_, record) => {
          return (
            <Space>
              {permissionsMap['bi-auto-deploy.OggMonitorController.saveOrUpdate'] && (
                <Button type={'link'} size={'small'} onClick={() => editRecord(record)}>
                  编辑
                </Button>
              )}
              {permissionsMap['bi-auto-deploy.OggMonitorController.delete'] && (
                <Popconfirm title={'确定删除吗？'} onConfirm={() => deleteRecord(record)}>
                  <Button type={'link'} size={'small'} danger>
                    删除
                  </Button>
                </Popconfirm>
              )}
            </Space>
          )
        },
      },
    ],
  })

  const { current: page, pageSize } = table.pagination

  const { run: fetchList, loading } = useRequest(
    () => {
      return axios
        .get('/bi-auto-deploy/api/admin/oggMonitor/list', {
          params: {
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
    { manual: true }
  )

  useEffect(() => {
    fetchList()
  }, [visible, page, pageSize, fetchList])

  const addRecord = () => {
    dispatch({
      type: 'changeEditModalVisible',
      payload: true,
    })
    dispatch({
      type: 'setCurrentRecord',
      payload: null,
    })
  }

  const editRecord = (record) => {
    dispatch({
      type: 'changeEditModalVisible',
      payload: true,
    })
    dispatch({
      type: 'setCurrentRecord',
      payload: record,
    })
  }

  const deleteRecord = (record) => {
    axios
      .get('/bi-auto-deploy/api/admin/oggMonitor/delete', {
        params: {
          id: record.id,
        },
      })
      .then(() => {
        message.success('删除成功')
        fetchList()
      })
  }

  useImperativeHandle(ref, () => {
    return {
      fetchList,
    }
  })

  return (
    <Drawer
      title={'监控服务列表'}
      width={800}
      visible={visible}
      onClose={() => dispatch({ type: 'changeDrawerVisible', payload: false })}>
      <div className={'flex justify-between mb-2.5'}>
        <span />
        <div>
          {permissionsMap['bi-auto-deploy.OggMonitorController.saveOrUpdate'] && (
            <Button onClick={addRecord}>新增</Button>
          )}
        </div>
      </div>
      <Table {...table} loading={loading} />
    </Drawer>
  )
})

const useStyles = makeStyles({
  card: {
    minHeight: 500,
    borderRadius: 16,
    boxShadow: 'rgb(17 17 26 / 5%) 0 1px 0, rgb(17 17 26 / 10%) 0 0 8px',
  },
})

function OggMo() {
  const classes = useStyles()
  const [state, dispatch] = useReducer(
    (state, action) => {
      switch (action.type) {
        case 'changeDrawerVisible':
          return { ...state, drawerVisible: action.payload }
        case 'changeEditModalVisible':
          return { ...state, editModalVisible: action.payload }
        case 'setCurrentRecord':
          return { ...state, currentRecord: action.payload }
        default:
          return state
      }
    },
    {},
    () => {
      return {
        drawerVisible: false,
        editModalVisible: false,
        currentRecord: null,
      }
    }
  )
  const [timeDelay, setTimeDelay] = useState(5)

  const [MonList, setMonList] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const { run: fetchMonitorList, loading } = useRequest(
    () => {
      return axios
        .get('/bi-auto-deploy/api/user/oggMonitor/getMonitorData', {
          params: {
            page,
            pageSize: 2,
          },
        })
        .then(({ data: { list, totalRows } }) => {
          setMonList(list)
          setTotal(totalRows)
        })
    },
    {
      manual: true,
    }
  )

  useEffect(() => {
    fetchMonitorList()
  }, [page, fetchMonitorList])

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchMonitorList()
    }, timeDelay * 1000)
    return () => {
      clearInterval(intervalId)
    }
  }, [fetchMonitorList, timeDelay])

  const handlePageChange = (page) => {
    setPage(page)
  }

  const handleTimeChange = (v) => {
    if (!isNaN(Number(v))) {
      setTimeDelay(Math.max(v, 5))
    } else {
      setTimeDelay(5)
    }
  }

  const pageMgmtRef = useRef()

  const fetchList = () => {
    fetchMonitorList()
    pageMgmtRef.current?.fetchList()
  }

  return (
    <div className={'px-6 py-6'}>
      <div className={'flex justify-between'}>
        <div style={{ width: 200 }}>
          <Input
            type={'number'}
            min={5}
            addonBefore="刷新频率"
            addonAfter="秒"
            defaultValue="5"
            onBlur={(e) => handleTimeChange(e.target.value)}
          />
        </div>

        <div>
          <Button
            type={'primary'}
            onClick={() =>
              dispatch({
                type: 'changeDrawerVisible',
                payload: true,
              })
            }>
            管理页面
          </Button>
        </div>
      </div>
      <Spin spinning={loading}>
        <Row gutter={24} className={'mt20'}>
          {MonList.map((item) => {
            return (
              <Col span={12} key={item.id}>
                <Card
                  className={classes.card}
                  title={
                    <div className={'flex justify-between'}>
                      <span style={{ overflow: 'hidden' }}>
                        <OverflowTooltip>
                          {item['serverName']}-{item.url}
                        </OverflowTooltip>
                      </span>
                      <span
                        style={{
                          flex: '0 1 230px',
                          marginLeft: 20,
                        }}>
                        更新时间：{moment(item['refreshDate']).format('YYYY-MM-DD HH:mm:ss')}
                      </span>
                    </div>
                  }
                  bodyStyle={{}}>
                  <p
                    style={{ whiteSpace: 'pre-wrap', background: 'black', color: '#fff', padding: 5 }}
                    dangerouslySetInnerHTML={{
                      __html: unescape(item['monitor'].replace(/\\/g, '%')),
                    }}
                  />
                </Card>
              </Col>
            )
          })}
        </Row>
        <Pagination
          className={'mt20'}
          current={page}
          pageSize={2}
          total={total}
          showTotal={(total) => `共${total}条记录`}
          onChange={handlePageChange}
        />
      </Spin>
      <PageMgmt ref={pageMgmtRef} visible={state.drawerVisible} dispatch={dispatch} />

      <EditModal
        visible={state.editModalVisible}
        onSubmitted={fetchList}
        currentRecord={state.currentRecord}
        dispatch={dispatch}
      />
    </div>
  )
}

export default OggMo
