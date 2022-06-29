import React, {useEffect, useState} from 'react';
import {connect} from 'react-redux';
import {Row, Col, Input, Button, Table, Form, message, Popconfirm, Space} from 'antd';
import FieldItem from '../../components/FieldItem';
import useTable from '../../hooks/useTable';
import {useRequest} from 'ahooks';
import axios from '../../utils/axios';
import OverflowTooltip from '../../components/OverflowTooltip';
import DraggableModal from '../../components/DraggableModal';
import {useForm} from 'antd/es/form/Form';


const EditModal = (props) => {
  const {visible, setVisible, currentModalRow, onSubmitted} = props
  const [form] = useForm()
  const handleOk = () => {
    form.validateFields().then(values => {
      axios.post('/bi-auto-deploy/api/admin/businessMode/saveOrUpdate', null, {
        params: {
          id: currentModalRow?.id,
          ...values,
          modeCode: 'BM_' + values.modeCode
        }
      }).then(() => {
        message.success('保存成功')
        setVisible(false)
        onSubmitted()
      })
    })
  }
  useEffect(() => {
    if (visible) {
      if (currentModalRow) {
        form.setFieldsValue({...currentModalRow, modeCode: currentModalRow.modeCode.replace(/^BM_/, '')})
      } else {
        form.resetFields()
      }
    }
  }, [visible, currentModalRow, form])

  return <DraggableModal
    visible={visible}
    onCancel={() => setVisible(false)}
    onOk={() => handleOk()}
    title={currentModalRow ? '编辑' : '新增'}>
    <Form form={form} labelCol={{span: 4}}>
      <Form.Item label={'模块名称'} name={'modeName'} rules={[{required: true}]}>
        <Input/>
      </Form.Item>

      <Form.Item label={'模块代码'} name={'modeCode'} rules={[{required: true}]}>
        <Input addonBefore={'BM_'}/>
      </Form.Item>
      <Form.Item label={'备注'} name={'description'}>
        <Input/>
      </Form.Item>
    </Form>
  </DraggableModal>
}


const BizModeCfg = props => {
  const {permissionsMap} = props
  const [query, setQuery] = useState({
    name: ''
  })
  const {table, setTable} = useTable({
    rowKey: 'id',
    columns: [
      {title: 'ID', dataIndex: 'id'},
      {title: '模块名称', dataIndex: 'modeName'},
      {title: '模块代码', dataIndex: 'modeCode'},
      {
        title: '状态', dataIndex: 'status', render: (text) => {
          return ({'Delete': '冻结', 'Normal': '正常'})[text]
        }
      },
      {
        title: '备注', dataIndex: 'description', render: (text) => {
          return <OverflowTooltip>{text}</OverflowTooltip>
        }
      },
      {
        title: '操作', dataIndex: 'actions', render: (_, record) => {
          return <Space>
            {
              permissionsMap['bi-auto-deploy.BusinessModeController.saveOrUpdate'] &&
              <Button type={'link'} size={'small'} onClick={() => handleEdit(record)}>编辑</Button>
            }
            {
              permissionsMap['bi-auto-deploy.BusinessModeController.updateStatus'] &&
              <Popconfirm title={`确定${record.status === 'Delete' ? '启用' : '冻结'}吗`} onConfirm={() => toggleRow(record)}>
                <Button type={'link'} size={'small'} danger={record.status !== 'Delete'}>{
                  record.status === 'Delete' ? '启用' : '冻结'
                }</Button>
              </Popconfirm>
            }
          </Space>
        }
      },
    ]
  })

  const {current: page, pageSize} = table.pagination
  const {run: fetchList, loading} = useRequest(() => {
    return axios.get('/bi-auto-deploy/api/admin/businessMode/list', {
      params: {
        page, pageSize,
        ...query
      }
    }).then(({data: {list, totalRows: total}}) => {
      setTable(prevState => ({
        ...prevState,
        dataSource: list,
        pagination: {...prevState.pagination, total}
      }))
    })
  }, {
    manual: true
  })

  useEffect(() => {
    fetchList()
  }, [query, page, pageSize, fetchList])

  const [editVisible, setEditVisible] = useState(false)
  const [currentModalRow, setCurrentModalRow] = useState(null)

  const toggleRow = (row) => {
    axios.get('/bi-auto-deploy/api/admin/businessMode/updateStatus', {
      params: {
        businessModeId: row.id,
        businessModeStatus: row.status === 'Delete' ? 'Normal' : 'Delete'
      }
    }).then(() => {
      message.success('修改成功')
      fetchList()
    })
  }

  const handleEdit = (row) => {
    setEditVisible(true)
    setCurrentModalRow(row)
  }
  return (
    <div className={'px-6 py-6'}>
      <div className={'flex flex-start'}>
        <div style={{flex: 1}} className={'mb10'}>
          <Row gutter={12}>
            <Col span={6}>
              <FieldItem label={'关键字'} labelAlign={'left'}>
                <Input value={query.name}
                       allowClear
                       onChange={e => setQuery(prevState => ({...prevState, name: e.target.value}))}/>
              </FieldItem>
            </Col>
          </Row>
        </div>
        <div className={'ml10'}>
          {
            permissionsMap['bi-auto-deploy.BusinessModeController.saveOrUpdate'] &&
            <Button type={'primary'} onClick={() => {
              handleEdit()
            }}>新增</Button>
          }
        </div>
      </div>
      <Table {...table} loading={loading}/>
      <EditModal visible={editVisible}
                 setVisible={setEditVisible}
                 currentModalRow={currentModalRow} onSubmitted={fetchList}/>
    </div>
  );
};


export default connect(state => {
  return {
    permissionsMap: state.user.userInfo.permissionsMap
  }
})(BizModeCfg);

