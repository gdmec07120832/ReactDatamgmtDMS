import React, { useEffect } from 'react'
import DraggableModal from '../../../../components/DraggableModal'
import {Form, Input, message, Select} from 'antd'
import { useForm } from 'antd/es/form/Form'
import { useRequest } from 'ahooks'
import axios from '../../../../utils/axios'

function CloseServeModal(props) {
  const { current, setCurrent, onSubmit } = props
  const [form] = useForm()

  useEffect(() => {
    if (current) {
      form.setFieldsValue({
        ...current,
        stopCause: '系统卡顿'
      })
    }
  }, [current, form])

  const close = () => {
    setCurrent(null)
    form.resetFields()
  }

  const { run: submit, loading } = useRequest(
    (params) => {
      return axios.post('/bi-sys/api/admin/tomcat/changeStatus', null, {
        params: {
          status: '1',
          ...params
        }
      }).then(() => {
        close()
        message.success('关闭成功')
        onSubmit?.()
      })
    },
    { manual: true }
  )

  const handleSubmit = () => {
    submit(form.getFieldsValue())
  }

  return (
    <DraggableModal
      visible={!!current}
      title={'请选择关闭原因'}
      okButtonProps={{ loading: loading }}
      destroyOnClose
      onCancel={close}
      onOk={handleSubmit}>
      <Form form={form} labelCol={{ span: 4 }}>
        <Form.Item label={'ID'} name={'id'} hidden>
          <Input />
        </Form.Item>
        <Form.Item label={'关闭原因'} name={'stopCause'}>
          <Select options={[{ value: '系统卡顿' }, { value: '功能更新' }, { value: '系统维护' }, { value: '其他' }]} />
        </Form.Item>
      </Form>
    </DraggableModal>
  )
}

export default CloseServeModal
