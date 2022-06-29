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
      axios.post('/bi-auto-deploy/api/admin/processTemplate/saveOrUpdate', {
        id: currentModalRow?.id,
        ...values
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
        form.setFieldsValue(currentModalRow)
      } else {
        form.resetFields()
      }
    }
  }, [form, visible, currentModalRow])

  return <DraggableModal
    visible={visible}
    onCancel={() => setVisible(false)}
    onOk={() => handleOk()}
    title={currentModalRow ? '编辑' : '新增'}>
    <Form form={form} labelCol={{span: 4}}>
      <Form.Item label={'模板名称'} name={'templateName'} rules={[{required: true}]}>
        <Input/>
      </Form.Item>

      <Form.Item label={'流程'} name={'p4ts'}>
        <Input.TextArea/>
      </Form.Item>
      <p style={{color: 'red', marginLeft: 70}}>请使用逗号隔开","</p>
    </Form>
  </DraggableModal>
}


const FlowTemplateCfg = props => {
  const {permissionsMap} = props
  const [query, setQuery] = useState({
    name: ''
  })
  const {table, setTable} = useTable({
    rowKey: 'id',
    columns: [
      {title: 'ID', dataIndex: 'id'},
      {title: '模板名称', dataIndex: 'templateName'},
      {
        title: '流程', dataIndex: 'p4ts', render: (text) => {
          return <OverflowTooltip>{text}</OverflowTooltip>
        }
      },
      {
        title: '操作', dataIndex: 'actions', render: (_, record) => {
          return <Space>
            {
              permissionsMap['bi-auto-deploy.ProcessTemplateController.saveOrUpdate'] &&
              <Button type={'link'} size={'small'} onClick={() => handleEdit(record)}>编辑</Button>
            }
            {
              permissionsMap['bi-auto-deploy.ProcessTemplateController.delete'] &&
              <Popconfirm title={'确定删除吗'} onConfirm={() => deleteRow(record)}>
                <Button type={'link'} size={'small'} danger>删除</Button>
              </Popconfirm>
            }
          </Space>
        }
      },
    ]
  })

  const {current: page, pageSize} = table.pagination
  const {run: fetchList, loading} = useRequest(() => {
    return axios.get('/bi-auto-deploy/api/admin/processTemplate/list', {
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

  const deleteRow = (row) => {
    axios.get('/bi-auto-deploy/api/admin/processTemplate/delete', {
      params: {
        id: row.id
      }
    }).then(() => {
      message.success('删除成功')
      fetchList()
    })
  }

  const handleEdit = (row) => {
    setCurrentModalRow(row)
    setEditVisible(true)
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
            permissionsMap['bi-auto-deploy.ProcessTemplateController.saveOrUpdate'] &&
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
})(FlowTemplateCfg);
