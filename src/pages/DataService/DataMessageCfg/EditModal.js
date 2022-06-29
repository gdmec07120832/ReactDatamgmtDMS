import React, { useEffect, useState } from 'react'
import DraggableModal from '../../../components/DraggableModal'
import {Form, Input, message, Switch} from 'antd'
import ExSelect from '../../../components/Select'
import axios from '../../../utils/axios'
import { useForm } from 'antd/es/form/Form'
import useConstant from '../../../hooks/useConstant'
import { useRequest } from 'ahooks'

function EditModal(props) {
  const { currentRow, setCurrentRow, refresh } = props
  const title = currentRow?.id ? '更新' : '新增'
  const [form] = useForm()
  const pageUrlList = useConstant('pushConfigUrl')
  const ddChatGroup = useConstant('DD_CHART_SESSION_TYPE')


  const [interfaceTypeList, setInterfaceTypeList] = useState([])
  useEffect(() => {
    axios.get('/bi-mobile/api/user/dataInterfaceConfig/getSelectInterfaceTypeEnum').then(({ data }) => {
      setInterfaceTypeList(
        data.map((item) => ({
          ...item,
          label: item.value,
          value: item.key,
        }))
      )
    })
  }, [])

  const [sqlConfigList, setSqlConfigList] = useState([])

  const { run: getSqlConfigList } = useRequest(
    (v) => {
      return axios
        .get('/bi-mobile/api/user/dataInterfaceConfig/findAll', {
          params: {
            interfaceType: v || null,
          },
        })
        .then(({ data }) => {
          setSqlConfigList(
            data.map((item) => ({
              ...item,
              /**@property cnName */
              label: item.cnName,
              value: item.id,
            }))
          )
        })
    },
    { manual: true }
  )


  useEffect(() => {
    if (!currentRow) {
      form.resetFields()
      return
    }
    /**@property targetChartGroupId */
    form.setFieldsValue({
      ...currentRow,
      ddChatGroupId: (currentRow?.targetChartGroupId || '').split(',').filter(Boolean)
    })
    if(currentRow.interfaceType) {
      getSqlConfigList(currentRow.interfaceType)
    }
  }, [currentRow, form, getSqlConfigList])

  const handleTypeChange = (v) => {
    form.setFieldsValue({
      coverConfigId: undefined,
    })
    getSqlConfigList(v)
  }

  const handleSubmit = () => {
    form.validateFields().then(values => {
      const {ddChatGroupId, ...restValues} = values
      axios.post('/bi-mobile/api/admin/dataMessageConfig/saveOrUpdate', {
        ...restValues,
        targetChartGroupId: ddChatGroupId.join(',')
      }).then(() => {
        message.success('保存成功')
        setCurrentRow(null)
        refresh?.()
      })
    })
  }

  return (
    <DraggableModal
      width={640}
      destroyOnClose
      title={title}
      visible={!!currentRow}
      onOk={handleSubmit}
      onCancel={() => setCurrentRow(null)}>
      <Form form={form} labelCol={{ span: 4 }} initialValues={{ cron: '0 30 8 * * ?' }}>
        <Form.Item label={'id'} name={'id'} hidden>
          <Input />
        </Form.Item>
        <Form.Item label={'标题'} name={'title'} rules={[{ required: true }]}>
          <Input maxLength={50} placeholder={'标题'} />
        </Form.Item>
        <Form.Item label={'SQL配置'} name={'coverConfigId'} shouldUpdate rules={[{required: true}]}>
          <Input.Group compact style={{ display: 'flex' }}>
            <Form.Item noStyle name={'interfaceType'} shouldUpdate>
              <ExSelect
                options={interfaceTypeList}
                onChange={handleTypeChange}
                style={{ flex: '0 0 120px' }}
                placeholder={'类型'}
              />
            </Form.Item>
            <Form.Item noStyle name={'coverConfigId'} shouldUpdate>
              <ExSelect
                options={sqlConfigList}
                placeholder={form.getFieldValue('interfaceType') ? '请选择' : '请先选择类型'}
                disabled={!form.getFieldValue('interfaceType')}
              />
            </Form.Item>
          </Input.Group>
        </Form.Item>
        <Form.Item label={'页面路径'} name={'pageUrl'} rules={[{required: true}]}>
          <ExSelect options={pageUrlList} placeholder={'页面路径'} />
        </Form.Item>
        <Form.Item label={'cron'} name={'cron'} rules={[{ required: true }]}>
          <Input maxLength={50} placeholder={'cron'} />
        </Form.Item>
        <Form.Item label={'目标群号'} name={'ddChatGroupId'} rules={[{required: true, type: 'array'}]}>
          <ExSelect options={ddChatGroup} mode={'multiple'} placeholder={'目标群号'} />
        </Form.Item>
        <Form.Item label={'动态封面'} name={'dynamicCover'} valuePropName={'checked'}>
          <Switch />
        </Form.Item>
        <Form.Item label={'描述'} name={'description'}>
          <Input.TextArea maxLength={50} placeholder={'描述'} />
        </Form.Item>
      </Form>
    </DraggableModal>
  )
}

export default EditModal
