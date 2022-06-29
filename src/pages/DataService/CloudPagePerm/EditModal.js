import React, {useEffect, useRef, useState} from 'react'
import DraggableModal from '../../../components/DraggableModal'
import {Form, Input, message, Transfer} from 'antd'
import {useForm} from 'antd/es/form/Form'
import axios from '../../../utils/axios'

function EditModal(props) {
  const {currentRow, setCurrentRow, onSuccess} = props
  const isEdit = !!currentRow?.__isEdit__
  const [form] = useForm()

  const [permissionList, setPermissionList] = useState([])

  useEffect(() => {
    axios
        .get('/bi-mobile-aliyun/api/user/permission/findAll', {
          params: {
            appCode: 'DigitalSupplier',
          },
        })
        .then(({data}) => {
          setPermissionList(
              data.map((item) => ({
                ...item,
                key: item.id,
                title: item.name,
              }))
          )
        })
  }, [])

  const close = () => {
    setCurrentRow(null)
    form.resetFields()
  }
  const currentRowRef = useRef(currentRow)
  if (isEdit) {
    axios.get('/bi-mobile-aliyun/api/user/pagePermission/findById', {
      params: {id: currentRow.id}
    }).then(({data}) => {
      form.setFieldsValue({
        ...currentRow,
        ...data
      })
      currentRowRef.current = {...currentRow, ...data}
    })
  }

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      let params = {}
      if (isEdit) {
        params.id = currentRow?.id
        params.parentId = currentRowRef.current?.parentId
      } else {
        params.parentId = currentRow?.id
      }

      axios
          .post('/bi-mobile-aliyun/api/admin/pagePermission/saveOrUpdate', {
            ...params,
            ...values,
            appCode: 'DigitalSupplier',
          })
          .then(() => {
            message.success('保存成功')
            close()
            onSuccess?.()
          })
    })
  }

  return (
      <DraggableModal
          width={960}
          title={isEdit ? '编辑页面' : '新增页面'}
          visible={!!currentRow}
          onCancel={close}
          onOk={handleSubmit}>
        {!isEdit && <div className={'pb-4 ml-2.5'}>上级页面：{currentRow?.name || '无'}</div>}
        <Form form={form} labelCol={{flex: '80px'}}>
          <Form.Item label={'页面名称'} name={'name'} rules={[{required: true}]}>
            <Input maxLength={20}/>
          </Form.Item>
          <Form.Item label={'页面接口'} name={'apiPermissionIds'} valuePropName={'targetKeys'}>
            <Transfer panelHeader={'页面接口'}
                      showSearch
                      dataSource={permissionList}
                      listStyle={{flex: 1, height: 300}}
                      pagination={{pageSize: 20}}
                      render={(item) => item.title}
                      titles={['未选', '已选']}/>
          </Form.Item>
        </Form>
      </DraggableModal>
  )
}

export default EditModal
