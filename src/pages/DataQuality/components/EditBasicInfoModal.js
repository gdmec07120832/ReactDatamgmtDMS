import React, {useEffect} from 'react'
import DraggableModal from '../../../components/DraggableModal'
import {Form, Input, message} from 'antd';
import {useForm} from 'antd/es/form/Form';
import ExSelect from '../../../components/Select';
import axios from '../../../utils/axios';

function EditBasicInfoModal(props) {
  const { currentRow, setCurrentRow, bizModeList = [], onSuccess } = props
  const title = currentRow?.id ? '更新基本信息' : '新增方案'
  const [form] = useForm()
  const close = () => {
    setCurrentRow(null)
  }

  useEffect(() => {
    currentRow && form.setFieldsValue(currentRow)
  }, [currentRow, form])

  const handleSubmit = () => {
    form.validateFields().then(values => {
      axios.post('bi-data-quality/api/admin/verificationScheme/saveOrUpdate', {
        ...values
      }).then(() => {
        message.success('保存成功')
        close()
        onSuccess?.()
      })
    })
  }

  return <DraggableModal title={title} destroyOnClose visible={!!currentRow} onCancel={close} onOk={handleSubmit}>
    <Form form={form} labelCol={{span: 4}}>
      <Form.Item hidden label={'id'} name={'id'}>
        <Input />
      </Form.Item>
      <Form.Item label={'方案名称'} name="schemeName" rules={[{required: true}]}>
        <Input maxLength={30}/>
      </Form.Item>
      <Form.Item label={'业务类型'} name="businessModeId" rules={[{required: true}]}>
        <ExSelect options={bizModeList} />
      </Form.Item>
      <Form.Item label={'描述'} name="description">
        <Input.TextArea maxLength={200} showCount rows={5} autoSize/>
      </Form.Item>
    </Form>
  </DraggableModal>
}

export default EditBasicInfoModal
