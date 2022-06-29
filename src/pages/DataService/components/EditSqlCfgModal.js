import React, {useEffect, useState} from 'react'
import {useSelector} from 'react-redux'

import {Button, Drawer, Form, Input, message, Space, Switch} from 'antd'
import {useForm} from 'antd/es/form/Form'
import ExSelect from '../../../components/Select'
import CodeMirrorLayer from '../../../components/CodeMirrorLayer'
import axios from '../../../utils/axios'

const validator1 = (rule, value, cb) => {
  if (value && !/^[\w-]+$/.test(value)) {
    cb(new Error('只能包含大小写字母、数字、_和-'))
  } else {
    cb()
  }
}

function EditSqlCfgModal(props) {
  const {currentRow, setCurrentRow, type, cloud, refresh} = props
  const permissionsMap = useSelector((state) => state.user.permissionsMap)
  const [form] = useForm()
  const title = currentRow?.id ? '编辑' : '新增'
  const [currentRowData, setCurrentRowData] = useState({})
  useEffect(() => {
    if (currentRow?.id || (currentRow?.__isCopy && currentRow?.__id)) {
      axios
          .get(
              cloud
                  ? '/bi-mobile-aliyun/api/user/dataInterfaceConfig/findById'
                  : '/bi-mobile/api/user/dataInterfaceConfig/findById',
              {
                params: {
                  id: currentRow.id || (currentRow?.__isCopy && currentRow.__id),
                },
              }
          )
          .then(({data}) => {
            if (currentRow?.__isCopy) {
              message.success('复制成功')
              const {id, ...rest} = data
              setCurrentRowData(rest)
            } else {
              setCurrentRowData(data)
            }
          })
    }
  }, [currentRow, cloud])
  const [dataSourceList, setDatasourceList] = useState([])
  useEffect(() => {
    if (cloud) {
      axios
          .get('/bi-mobile-aliyun/api/user/datasourceConfig/findAllInfo', {
            params: {
              appCode: type,
            },
          })
          .then(({data}) => {
            setDatasourceList(
                data.map((item) => ({
                  ...item,
                  label: item.name,
                  value: item.id,
                }))
            )
          })
    } else {
      axios
          .get('/bi-sys/api/user/datasourceConfig/findByAttributeDataSources', {
            params: {
              appCode: type,
            },
          })
          .then(({data}) => {
            setDatasourceList(
                data.map((item) => ({
                  ...item,
                  label: item.dbCnName,
                  value: item.id,
                }))
            )
          })
    }
  }, [cloud, type])

  const [interfaceList, setInterfaceList] = useState([])
  useEffect(() => {
    if (type && currentRow) {
      axios
          .get(
              cloud
                  ? '/bi-mobile-aliyun/api/user/dataInterfaceConfig/findAll'
                  : '/bi-mobile/api/user/dataInterfaceConfig/findAll',
              {
                params: cloud
                    ? {
                      appCode: type,
                    }
                    : {
                      interfaceType: type,
                    },
              }
          )
          .then(({data}) => {
            setInterfaceList(
                data.map((item) => ({
                  ...item,
                  label: item.cnName,
                  value: item.id,
                }))
            )
          })
    }
  }, [type, cloud, currentRow])

  useEffect(() => {
    currentRow &&
    form.setFieldsValue({
      ...currentRowData,
      datasourceId: currentRowData.datasourceId,
      id: currentRowData.id || null,
    })
  }, [form, currentRow, currentRowData])

  useEffect(() => {
    if (!currentRow?.id && cloud) {
      const defaultDatasource = dataSourceList.find((item) => item.default)
      form.setFieldsValue({
        datasourceId: defaultDatasource?.id,
      })
    }
  }, [dataSourceList, currentRow, cloud, form])

  const handleClose = () => {
    setCurrentRow(null)
    setCurrentRowData({})
    form.resetFields()
  }

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      axios
          .post(
              cloud
                  ? '/bi-mobile-aliyun/api/admin/dataInterfaceConfig/saveOrUpdate'
                  : '/bi-mobile/api/admin/dataInterfaceConfig/saveOrUpdate',
              cloud
                  ? {
                    ...values,
                    datasourceId: values.datasourceId || '',
                    appCode: type,
                  }
                  : {
                    ...values,
                    interfaceType: type,
                  }
          )
          .then(() => {
            message.success('保存成功')
            handleClose()
            refresh?.()
          })
    })
  }
  return (
      <Drawer
          destroyOnClose
          width={'50vw'}
          title={title}
          getContainer={() => document.body}
          visible={!!currentRow}
          onClose={handleClose}
          footer={
            <Space className={'float-right'}>
              <Button key={'cancel'} onClick={handleClose}>
                关闭
              </Button>
              {permissionsMap[
                  cloud
                      ? 'bi-mobile-aliyun.DataInterfaceConfigController.saveOrUpdate'
                      : 'bi-mobile.DataInterfaceConfigController.saveOrUpdate'
                  ] && (
                  <Button key={'submit'} type={'primary'} onClick={handleSubmit}>
                    保存
                  </Button>
              )}
            </Space>
          }>
        <Form form={form} layout="vertical">
          <Form.Item label={'id'} name={'id'} hidden>
            <Input/>
          </Form.Item>
          <Form.Item label={'父级'} name={'parentId'}>
            <ExSelect
                options={interfaceList.map((item) => ({label: item.label, value: item.value}))}
                className={'relative'}
                placeholder={'父级'}
                getPopupContainer={() => document.body}
                allowClear
            />
          </Form.Item>
          <Form.Item label={'中文名称'} name={'cnName'} rules={[{required: true}]}>
            <Input maxLength={50} placeholder={'中文名称'}/>
          </Form.Item>

          <Form.Item label={'前缀'} name={'prefix'} rules={[{validator: validator1, trigger: 'change'}]}>
            <Input maxLength={50} placeholder={'前缀'}/>
          </Form.Item>
          <Form.Item label={'接口名称'} name={'interfaceName'} rules={[{validator: validator1, trigger: 'change'}]}>
            <Input maxLength={50} placeholder={'接口名称'}/>
          </Form.Item>
          <Form.Item label={'SQL语句'} valuePropName={'_value'} name={'sqlStr'}>
            <CodeMirrorLayer
                fullscreenButton
                options={{
                  mode: 'sql',
                  theme: 'darcula',
                  tabSize: 2,
                  styleActiveLine: true,
                  lineWrapping: false,
                  lineNumbers: true,
                  autofocus: true,
                }}
            />
          </Form.Item>

          <Form.Item label={'使用缓存'} name={'useCache'} valuePropName={'checked'}>
            <Switch/>
          </Form.Item>

          <Form.Item noStyle shouldUpdate>
            {() => {
              return (
                  form.getFieldValue('sqlStr')?.trim() && (
                      <Form.Item label={'数据源'} name={'datasourceId'} rules={[{required: true}]}>
                        <ExSelect
                            getPopupContainer={node => node.parentNode}
                            allowClear
                            options={dataSourceList.map((item) => ({label: item.label, value: item.value}))}
                            placeholder={'数据源'}
                        />
                      </Form.Item>
                  )
              )
            }}
          </Form.Item>

          <Form.Item label={'备注'} name={'description'}>
            <Input.TextArea placeholder={'备注'}/>
          </Form.Item>
        </Form>
      </Drawer>
  )
}

export default EditSqlCfgModal
