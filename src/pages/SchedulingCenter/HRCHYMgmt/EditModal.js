import React from 'react'
import DraggableModal from '../../../components/DraggableModal'
import { Form, Input, message } from 'antd'
import { useForm } from 'antd/es/form/Form'
import axios from '../../../utils/axios'

function EditModal(props) {
  const { currentRow, setCurrentRow, onSuccess } = props
  const isEdit = !!currentRow?.__isEdit__
  const [form] = useForm()

  const close = () => {
    setCurrentRow(null)
    form.resetFields()
  }

  if (isEdit) {
    form.setFieldsValue(currentRow)
  }

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      let params = {}
      if (isEdit) {
        params.id = currentRow?.id
      } else {
        params.parentId = currentRow?.id
      }

      axios
        .post('/bi-task-scheduling-system/api/admin/level/insertOrUpdate', null, {
          params: {
            ...params,
            ...values,
          },
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
      title={isEdit ? '编辑节点' : '新增节点'}
      visible={!!currentRow}
      onCancel={close}
      onOk={handleSubmit}>
      {!isEdit && <div className={'pb-4'}>上级节点：{currentRow?.hierarchy || '无'}</div>}
      <Form form={form}>
        <Form.Item label={'层级名称'} name={'hierarchy'} rules={[{ required: true }]}>
          <Input maxLength={20} />
        </Form.Item>
      </Form>
    </DraggableModal>
  )
}

export default EditModal
