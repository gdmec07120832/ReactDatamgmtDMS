import DraggableModal from '../../../components/DraggableModal'
import { Button, Form, Input, message } from 'antd'
import React, { useEffect, useState } from 'react'
import ExSelect from '../../../components/Select'
import { useRequest } from 'ahooks'
import axios from '../../../utils/axios'
import { useForm } from 'antd/es/form/Form'

const EditModal = (props) => {
  const { editRow, setEditRow, onSuccess } = props
  const [form] = useForm()
  const close = () => {
    setEditRow(null)
    form.resetFields()
  }

  useEffect(() => {
    editRow?.id && form.setFieldsValue(editRow)
  }, [editRow, form])

  const [jobList, setJobList] = useState([])
  useRequest(() => {
    return axios.get('/bi-task-scheduling-system/api/user/job/listJobForExInfoComboBox').then(({ data }) => {
      setJobList(
        data.map((item) => {
          return {
            label: item.jobName,
            value: item.id,
          }
        })
      )
    })
  })

  const handleJobChange = (v) => {
    axios
      .get('/bi-task-scheduling-system/api/user/job/selectJobWithExpandInfo', {
        params: { id: v },
      })
      .then(({ data }) => {
        form.setFieldsValue(data)
      })
  }

  const { run: _submit, loading } = useRequest(
    (params) => {
      return axios.post('/bi-task-scheduling-system/api/admin/job/updateExpandInfo', null, {
        params,
      })
    },
    { manual: true }
  )

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      _submit(values).then(() => {
        message.success('保存成功')
        close()
        onSuccess?.()
      })
    })
  }

  return (
    <DraggableModal
      title={'拓展信息'}
      destroyOnClose
      width={960}
      visible={!!editRow}
      onCancel={close}
      footer={[
        <Button key={'close'} onClick={close}>
          关闭
        </Button>,
        <Button key={'submit'} type={'primary'} onClick={handleSubmit} loading={loading}>
          确定
        </Button>,
      ]}>
      <Form form={form} labelCol={{ span: 6 }}>
        <div className={'grid grid-cols-2 gap-x-6'}>
          <Form.Item label={'抽取类型'} name={'upOrTot'} rules={[{ required: true }]}>
            <ExSelect
                getPopupContainer={(node) => node.parentNode}
              options={[
                { label: '全量', value: true },
                { label: '增量', value: false },
              ]}
              placeholder={'抽取类型'}
            />
          </Form.Item>
          <Form.Item label={'作业'} name={'id'} rules={[{ required: true }]}>
            <ExSelect options={jobList} placeholder={'作业'} onChange={handleJobChange} getPopupContainer={(node) => node.parentNode} />
          </Form.Item>
          <Form.Item label={'来源系统简称'} name={'srcSysName'} rules={[{ required: true }]}>
            <Input placeholder={'来源系统简称'} />
          </Form.Item>
          <Form.Item label={'源表名'} name={'srcTblEn'} rules={[{ required: true }]}>
            <Input placeholder={'源表名'} />
          </Form.Item>
          <Form.Item label={'目标表名'} name={'tgtTblEn'} rules={[{ required: true }]}>
            <Input placeholder={'目标表名'} />
          </Form.Item>
          <Form.Item label={'目标表用户'} name={'tgtTblUser'} rules={[{ required: true }]}>
            <Input placeholder={'目标表用户'} />
          </Form.Item>
          <Form.Item label={'目标表中文名'} name={'tgtTblCn'} rules={[{ required: true }]}>
            <Input placeholder={'目标表中文名'} />
          </Form.Item>
          <Form.Item label={'主键'} name={'priKey'}>
            <Input placeholder={'主键'} />
          </Form.Item>
        </div>
        <div>
          <Form.Item label={'取数字段'} name={'fetchFld'} labelCol={{ span: 3 }} rules={[{ required: true }]}>
            <Input.TextArea rows={5} placeholder={'取数字段'} />
          </Form.Item>
        </div>
        <div>
          <Form.Item label={'取数条件'} name={'fetchCond'} labelCol={{ span: 3 }}>
            <Input.TextArea rows={5} placeholder={'取数条件'} />
          </Form.Item>
        </div>
      </Form>
    </DraggableModal>
  )
}

export default EditModal
