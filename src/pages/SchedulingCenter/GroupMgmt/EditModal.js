import DraggableModal from '../../../components/DraggableModal'
import { Checkbox, Form, Input, message, TimePicker, TreeSelect } from 'antd'
import React, { useEffect, useState } from 'react'
import { useForm } from 'antd/es/form/Form'
import { useRequest, useUpdate } from 'ahooks'
import axios from '../../../utils/axios'
import ExSelect from '../../../components/Select'
import eachDeep from 'deepdash/eachDeep'
import moment from 'moment'
import StyledTreeSelect from '../components/StyledTreeSelect';

const sign = Math.random().toString(32).slice(-4)

const EditModal = (props) => {
  const { editRow, setEditRow, onSuccess } = props
  const title = editRow?.id ? '编辑分组' : '新建分组'
  const forceUpdate = useUpdate()

  const [levelsList, setLevelList] = useState([])

  useRequest(() => {
    return axios.get('/bi-task-scheduling-system/api/user/common/listLevelsForComboBox').then(({ data }) => {
      setLevelList(data.map((item) => ({ label: item.hierarchy, value: item.id })))
    })
  })

  const [groupTree, setGroupTree] = useState([])
  useRequest(() => {
    return axios
      .get('/bi-task-scheduling-system/api/user/level/listLevelsWithGroupForTree', {
        params: { excludeGroupId: editRow?.id },
      })
      .then(({ data }) => {
        const ret = eachDeep(
          data,
          (child) => {
            child.title = child.text
            child.value = `${child.id}#${sign}#${child.text}`
          },
          { childrenPath: 'children' }
        )
        setGroupTree(ret)
      })
  })

  const [jobTree, setJobTree] = useState([])
  useRequest(() => {
    return axios
      .get('/bi-task-scheduling-system/api/user/level/listLevelsWithGroupWithJobForTree', {
        params: { excludeGroupId: editRow?.id },
      })
      .then(({ data }) => {
        const ret = eachDeep(
          data,
          (child, i, parent, ctx) => {
            child.title = child.text
            child.value = `${child.id}#${sign}#${child.text}`
          },
          { childrenPath: 'children' }
        )
        setJobTree(ret)
      })
  })

  const [form] = useForm()
  const close = () => {
    setEditRow(null)
    form.resetFields()
  }

  useEffect(() => {
    editRow?.id &&
      form.setFieldsValue({
        ...editRow,
        depGroupIdList: editRow?.depGroups
          ? editRow?.depGroups.map((item) => {
              return `${item.id}#${sign}#${item.groupName}`
            })
          : [],
        depJobIdList: editRow?.depJobs
          ? editRow?.depJobs.map((item) => {
              return `${item.id}#${sign}#${item.jobName}`
            })
          : [],
        limitStartTime: editRow?.limitStartTime ? moment(editRow?.limitStartTime, 'HH:mm:ss') : null,
        limitEndTime: editRow?.limitEndTime ? moment(editRow?.limitEndTime, 'HH:mm:ss') : null,
      })
    editRow === null && form.setFieldsValue({
      cron: '0 30 2 ? * *',
      status: 0
    })
    forceUpdate()
  }, [editRow, forceUpdate, form])

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const data = {
        ...values,
        depGroupIdList: (values.depGroupIdList || [])
          .map((item) => {
            return item.split(`#${sign}#`)[0]
          })
          .join(','),
        depJobIdList: (values.depJobIdList || [])
          .map((item) => {
            return item.split(`#${sign}#`)[0]
          })
          .join(','),
      }

      if (values.limitExecTime) {
        data.limitStartTime = values.limitStartTime.format('HH:mm:ss')
        data.limitEndTime = values.limitEndTime.format('HH:mm:ss')
      }

      axios
        .post('/bi-task-scheduling-system/api/admin/group/insertOrUpdate', null, {
          params: data,
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
      destroyOnClose
      width={720}
      bodyStyle={{ maxHeight: 640, overflowY: 'auto' }}
      title={title}
      visible={!!editRow}
      onCancel={close}
      onOk={handleSubmit}>
      <Form form={form} labelCol={{ span: 3 }}>
        <Form.Item label={'id'} name={'id'} hidden>
          <Input />
        </Form.Item>
        <Form.Item label={'Status'} name={'status'} hidden>
          <Input />
        </Form.Item>
        <Form.Item label={'层级'} name={'levelId'} rules={[{ required: true }]}>
          <ExSelect options={levelsList} placeholder={'层级'} allowClear getPopupContainer={(node) => node.parentNode} />
        </Form.Item>
        <Form.Item label={'分组名称'} name={'groupName'} rules={[{ required: true }]}>
          <Input placeholder={'分组名称'} maxLength={50} />
        </Form.Item>
        <Form.Item label={'描述'} name={'descr'}>
          <Input placeholder={'描述'} maxLength={50} />
        </Form.Item>
        <Form.Item label={'CRON'} name={'cron'} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label={'依赖分组'} name={'depGroupIdList'}>
          <StyledTreeSelect
              getPopupContainer={(node) => node.parentNode}
            treeData={groupTree}
            fieldNames={{ label: 'text', key: 'id' }}
            treeCheckable
            showCheckedStrategy={TreeSelect.SHOW_CHILD}
            placeholder={'依赖分组'}
            allowClear
          />
        </Form.Item>
        <Form.Item label={'依赖作业'} name={'depJobIdList'}>
          <StyledTreeSelect
              getPopupContainer={(node) => node.parentNode}
            treeData={jobTree}
            fieldNames={{ label: 'text', key: 'id' }}
            treeCheckable
            showCheckedStrategy={TreeSelect.SHOW_CHILD}
            allowClear
            placeholder={'依赖作业'}
          />
        </Form.Item>
        <Form.Item name="limitExecTime" valuePropName="checked" wrapperCol={{ offset: 3, span: 16 }}>
          <Checkbox onChange={forceUpdate}>限定执行时间段</Checkbox>
        </Form.Item>
        {form.getFieldValue('limitExecTime') && (
          <>
            <Form.Item name={'limitStartTime'} label={'开始时间'} rules={[{ required: true }]}>
              <TimePicker getPopupContainer={(node) => node.parentNode} />
            </Form.Item>
            <Form.Item name={'limitEndTime'} label={'结束时间'} rules={[{ required: true }]}>
              <TimePicker getPopupContainer={(node) => node.parentNode} />
            </Form.Item>
          </>
        )}
      </Form>
    </DraggableModal>
  )
}

export default EditModal
