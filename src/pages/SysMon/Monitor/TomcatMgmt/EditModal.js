import React, {useEffect, useState} from 'react'
import DraggableModal from '../../../../components/DraggableModal'
import { Button, Form, Input, InputNumber } from 'antd'
import { useForm } from 'antd/es/form/Form'
import axios from '../../../../utils/axios'
import { useRequest } from 'ahooks'
import ExSelect from '../../../../components/Select';

function EditModal(props) {
  const { current, setCurrent, onSubmit } = props
  const title = current?.id ? '编辑' : '新增'
  const [ipList, setIpList] = useState([])

  useRequest(() => {
   return axios.get('/bi-sys/api/user/token/findAll').then(({data}) => {
     setIpList(data)
   })
  })

  const [form] = useForm()

  useEffect(() => {
    if (current) {
      form.setFieldsValue(current)
    } else {
      form.resetFields()
    }
  }, [form, current])

  const close = () => {
    setCurrent(null)
  }

  const { run: submit, loading: submitLoading } = useRequest(
    (data) => {
      return axios.post('/bi-sys/api/admin/tomcat/saveOrUpdate', data)
    },
    { manual: true }
  )

  const handleOk = () => {
    form.validateFields().then((values) => {
      submit(values).then(() => {
        close()
        onSubmit?.()
      })
    })
  }

  const handleIpChange = (v) => {
    const item = ipList.find(item => item.ip === v)
    if(item) {
      form.setFieldsValue({
        apiPort: item.port,
        apiToken: item.token
      })
    }
  }

  return (
    <DraggableModal
      destroyOnClose
      visible={!!current}
      footer={[
        <Button onClick={close} key={'close'}>
          取消
        </Button>,
        <Button type={'primary'} onClick={handleOk} loading={submitLoading} key={'submit'}>
          确定
        </Button>,
      ]}
      title={title}
      onOk={handleOk}
      onCancel={close}>
      <Form form={form} labelCol={{ span: 4 }} initialValues={{ orderNum: 1 }}>
        <Form.Item label={'ID'} name={'id'} hidden>
          <Input />
        </Form.Item>
        <Form.Item label={'名称'} name={'name'} rules={[{ required: true }]}>
          <Input maxLength={100} />
        </Form.Item>
        <Form.Item label={'IP'} name={'ipAddress'} rules={[{ required: true }]}>
          <ExSelect options={ipList.map(item => ({
            value: item.ip,
            label: item.ip
          }))} onChange={handleIpChange} />
        </Form.Item>
        <Form.Item label={'API端口'} name={'apiPort'}>
          <InputNumber maxLength={10} readOnly />
        </Form.Item>
        <Form.Item label={'TOKEN'} name={'apiToken'}>
          <Input maxLength={1000} readOnly />
        </Form.Item>
        <Form.Item label={'路径'} name={'linuxPath'} rules={[{ required: true }]}>
          <Input maxLength={100} />
        </Form.Item>
        <Form.Item label={'显示排序'} name={'orderNum'}>
          <InputNumber min={1} />
        </Form.Item>
      </Form>
    </DraggableModal>
  )
}

export default EditModal
