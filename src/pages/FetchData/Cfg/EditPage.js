import React, { useEffect, useRef, useState } from 'react'
import {Button, Checkbox, Form, Input, message, Modal, Popover, Radio, Result, Spin, Steps} from 'antd'
import ExSelect from '../../../components/Select'
import {AlertOutlined, EyeOutlined, LoadingOutlined} from '@ant-design/icons'
import CodeMirrorLayer from '../../../components/CodeMirrorLayer'
import ExTable from '../../../components/ExTable/ExTable'
import { useHistory, useRouteMatch } from 'react-router-dom'
import { useForm } from 'antd/es/form/Form'
import useUserList from '../../../hooks/useUserList'
import { useRequest } from 'ahooks'
import axios from '../../../utils/axios'
import PreviewResult from '../Fetch/components/PreviewResult'
import validFields from '../validFields'
import { encode } from 'js-base64';

const BzInput = ({ value = {}, onChange }) => {
  const _change1 = (v) => {
    onChange?.({ dataFieldId: v, businessProcessId: undefined })
  }

  const _change2 = (v) => {
    onChange?.({ ...value, businessProcessId: v })
  }

  const [list1, setList1] = useState([])
  const [list2, setList2] = useState([])

  useRequest(() => {
    return axios.get('/bi-metadata/api/user/kpiNode/queryLevelInfo?contains=true&level=1').then(({ data }) => {
      setList1(data.filter((item) => {
        return validFields.includes(item.nodeName)
      }))
    })
  })

  useEffect(() => {
    if (value.dataFieldId) {
      const selected = list1.find((item) => item.id === value.dataFieldId)
      if (selected) {
        axios
          .get('/bi-metadata/api/user/nodeQuery/findByParentId', {
            params: {
              parentUUID: selected.uuid,
            },
          })
          .then(({ data }) => {
            setList2((data?.children || []).map((item) => ({ label: item.nodeName, value: item.id })))
          })
      }
    }
  }, [value, list1])

  return (
    <div className={'flex space-x-2.5'}>
      <ExSelect
        options={list1.map((item) => ({ label: item.nodeName, value: item.id }))}
        value={value.dataFieldId}
        placeholder={'?????????????????????'}
        onChange={_change1}
      />
      <ExSelect options={list2} value={value.businessProcessId} placeholder={'?????????????????????'} onChange={_change2} />
    </div>
  )
}

const SqlInput = ({ value, onChange, onPreview }) => {
  return (
    <div className={'relative mt-4'}>
      <div className={'flex justify-between absolute -top-6 w-full right-0'}>
        <Popover content={<div className={'text-sm space-y-1.5'} style={{width: 400}}>
            <div>1. ????????????<span className={'text-yellow-500'}>?????????1???</span> ????????????19????????????18?????????????????????</div>
          <div>2. ??????????????????SQL?????????<span className={'text-yellow-500'}>????????????20???</span>?????????????????????</div>
            <div>
              <div>3. ??????????????????SQL?????????<span className={'text-yellow-500'}>????????????20???????????????ETL??????</span>??????????????????????????????</div>
              <div className={'ml-4'}>
                3.1 ????????????????????????????????????????????????
              </div>
              <div className={'ml-4'}>
                3.2 ??????????????????????????????????????????????????????
              </div>
            </div>
        </div>} title={'??????????????????'}>
            <span className={'cursor-pointer text-yellow-500'}>
          <AlertOutlined />??????????????????
        </span>
        </Popover>

        <span className={'cursor-pointer text-blue-500'} onClick={onPreview}>
          <EyeOutlined /> ????????????
        </span>
      </div>
      <CodeMirrorLayer
        _value={value}
        onChange={onChange}
        fullscreenButton
        options={{
          mode: 'sql',
          theme: 'darcula',
          tabSize: 2,
          styleActiveLine: true,
          lineWrapping: true,
          autofocus: false,
        }}
      />
    </div>
  )
}

function EditPage() {
  const [current, setCurrent] = useState(0)
  const [form] = useForm()
  const users = useUserList()
  const match = useRouteMatch()
  const queryFields = useRef([])
  const templateData = useRef({})
  const [dataSourceList, setDataSourceList] = useState([])
  useEffect(() => {
    axios.get('/bi-sys/api/user/datasourceConfig/findByAttributeDataSources').then(({data}) => {
      setDataSourceList(data.map(item => {
        return {
          ...item,
          label: item.dbCnName,
          value: item.id
        }
      }))
    })
  }, [])

  useEffect(() => {
    if (/create/.test(match.path)) {
      // new
    } else {
      const id = match.params?.id
      axios
        .get('/bi-data-fetch/api/user/biDfSqlTemplate/findByTemplateAuditId', {
          params: { id },
        })
        .then(({ data: { template, tempDetails } }) => {
          queryFields.current = tempDetails
          templateData.current = template
          form.setFieldsValue({
            ...template,
            _businessFor: {
              businessProcessId: template.businessProcessId,
              dataFieldId: template.dataFieldId,
            },
          })
        })
    }
  }, [match, form])

  const gotoStep = (step) => {
    setCurrent(step)
  }

  const [table, setTable] = useState({
    pagination: false,
    rowKey: '_key',
    columns: [
      {
        dataIndex: 'column',
        title: '????????????',
        render(_, record) {
          return `${record.alias}???${record.column}???`
        },
      },
      { dataIndex: 'colType', title: '????????????' },
      {
        dataIndex: 'selected',
        title: '??????',
        width: 100,
        render(_, record) {
          return <Checkbox checked={record.selected} onChange={(e) => handleSelectedChange(record, e.target.checked)} />
        },
      },
      {
        dataIndex: 'isRequired',
        title: '?????????',
        width: 100,
        render(_, record) {
          return <Checkbox disabled={!record.selected} checked={record.isRequired} onChange={(e) => handleIsRequiredChange(record, e.target.checked)} />
        },
      }
    ],
    dataSource: [],
  })

  const handleSelectedChange = (record, v) => {
    setTable((prevState) => {
      const index = prevState.dataSource.findIndex((item) => item._key === record._key)
      if (index > -1) {
        return {
          ...prevState,
          dataSource: [
            ...prevState.dataSource.slice(0, index),
            {
              ...prevState.dataSource[index],
              selected: v,
              isRequired: false
            },
            ...prevState.dataSource.slice(index + 1),
          ],
        }
      } else {
        return prevState
      }
    })
  }

  const handleIsRequiredChange = (record, v) => {
    setTable((prevState) => {
      const index = prevState.dataSource.findIndex((item) => item._key === record._key)
      if (index > -1) {
        return {
          ...prevState,
          dataSource: [
            ...prevState.dataSource.slice(0, index),
            {
              ...prevState.dataSource[index],
              isRequired: v,
            },
            ...prevState.dataSource.slice(index + 1),
          ],
        }
      } else {
        return prevState
      }
    })
  }

  const submitConfirm = () => {
    const selected = table.dataSource.filter((item) => item.selected)
    const formValues = {...form.getFieldsValue(true)}
    formValues.dataFieldId = formValues._businessFor.dataFieldId
    formValues.businessProcessId = formValues._businessFor.businessProcessId
    delete formValues._businessFor
    Modal.confirm({
      title: '????????????',
      content: `?????????????????????????????? ${selected.length} ???????????????`,
      okText: '????????????',
      onOk: () => {
        return axios
          .post('/bi-data-fetch/api/admin/biDfSqlTemplate/saveOrUpdate', {
            template: formValues,
            tempDetails: selected.map((item) => ({
              colName: item.column,
              colType: item.colType,
              alias: item.alias,
              status: 'SELECT',
              options: item.isRequired ? 'REQUIRED' : 'NOT_REQUIRED'
            })),
          })
          .then(() => {
            gotoStep(2)
          })
      },
    })
  }

  const history = useHistory()
  const jumpUrl = (url) => {
    history.push(url)
  }

  const createNew = () => {
    setCurrent(0)
  }

  const [getColumnsLoading, setGetColumnsLoading] = useState(false)
  const [sqlTiming, setSqlTiming] = useState(null)
  const checkFirstStep = () => {
    if(sqlTiming === null) {
      message.error('??????????????????????????????')
      return
    }


    form.validateFields().then((values) => {
      setGetColumnsLoading(true)
      const controller = new AbortController();
      cancelController.current = controller
      axios
        .post('/bi-data-fetch/api/user/biDfSqlTemplate/getColumnInfo', {
          sql: encode(values.sqlStr),
          dataSourceId: values.dataSourceId
        }, {
          signal: controller.signal,
          timeout: 10 * 60 * 1000
        })
        .then(({ data }) => {
          setTable((prevState) => ({
            ...prevState,
            dataSource: data.map((item) => {
              return {
                ...item,
                selected: !!queryFields.current.find(
                  (field) => field.colName === item.column && field.colType === item.colType
                ),
                isRequired: queryFields.current.find(
                    (field) => field.colName === item.column && field.colType === item.colType
                )?.options === 'REQUIRED',
                _key: Math.random().toString(32).slice(-8),
              }
            }),
          }))
          gotoStep(1)
        }).finally(() => {
          setGetColumnsLoading(false)
      })
    })
  }

  const [resultContent, setResultContent] = useState([])
  const [resultVisible, setResultVisible] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)

  const cancelController = useRef()
  const handlePreview = () => {
    const sql = form.getFieldValue('sqlStr')
    const dataSourceId = form.getFieldValue('dataSourceId')
    if (!sql?.trim()) {
      message.error('?????????sql????????????')
      return
    }
    if (!dataSourceId) {
      message.error('??????????????????????????????')
      return
    }
    setPreviewLoading(true)
    const controller = new AbortController();
    cancelController.current = controller
    axios
      .post('/bi-data-fetch/api/user/biDfSqlTemplate/dataPreview', {
        sql: encode(sql),
        dataSourceId: dataSourceId
      }, {
        timeout: 10 * 60 * 1000,
        signal: controller.signal
      })
      .then(({ data, consumeTime }) => {
        setResultVisible(true)
        setResultContent(data)
        setSqlTiming(consumeTime)
        if(consumeTime > 60) {
          Modal.info({
            okText: '????????????',
            title: 'SQL??????????????????',
            content: <div>
              SQL????????????1???????????????????????????????????????????????????????????????????????? <span className={'text-yellow-500'}>??????????????????</span> ??????SQL??????'
            </div>
          })
        }
      })
      .finally(() => {
        setPreviewLoading(false)
      })
  }

  const cancelRequest = () => {
    cancelController.current?.abort()
  }

  return (
    <div className={'p-6 mx-auto'} style={{ width: 950 }}>
      <PreviewResult visible={resultVisible} setVisible={setResultVisible} result={resultContent} />

      <Steps current={current} className={'mb-10'}>
        <Steps.Step title="??????SQL" />
        <Steps.Step title="???????????????" />
        <Steps.Step title="??????" />
      </Steps>
      {current === 0 && (
        <Spin
          spinning={previewLoading || getColumnsLoading}
          indicator={
            <div className={'flex flex-col'}>
              <LoadingOutlined className={'text-lg'} />
              <div className={'text-xs w-12 py-4'}>
                <span className={'cursor-pointer'} onClick={cancelRequest}>
                  ??????
                </span>
              </div>
            </div>
          }>
          <div>
            <Form
              form={form}
              labelCol={{ flex: '0 0 90px' }}
              initialValues={{ secrecyLevel: 'OPEN', _businessFor: {} }}>
              <Form.Item hidden label={'id'} name={'id'}>
                <Input />
              </Form.Item>
              <Form.Item label={'????????????'} name={'templateName'} rules={[{ required: true, message: '????????????' }]}>
                <Input placeholder={'?????????'} maxLength={50} />
              </Form.Item>
              <Form.Item label={'????????????'} name={'descr'}>
                <Input.TextArea autoSize={{ minRows: 5, maxRows: 5 }} placeholder={'?????????'} />
              </Form.Item>
              <Form.Item
                name={'_businessFor'}
                label={'????????????'}
                rules={[
                  { required: true, message: '????????????' },
                  {
                    validator: (_, value) => {
                      if (!value?.dataFieldId) {
                        return Promise.reject(new Error('?????????????????????'))
                      }
                      if (!value?.businessProcessId) {
                        return Promise.reject(new Error('?????????????????????'))
                      }
                      return Promise.resolve()
                    },
                  },
                ]}>
                <BzInput />
              </Form.Item>
              <Form.Item
                label={'???????????????'}
                name={'businessManagerId'}
                rules={[{ required: true, message: '????????????' }]}>
                <ExSelect
                  allowClear
                  options={users.map((item) => ({ label: item.nameCn, value: item.employeeNo }))}
                  placeholder={'?????????'}
                />
              </Form.Item>
              <Form.Item label={'????????????'} name={'productManagerId'} rules={[{ required: true, message: '????????????' }]}>
                <ExSelect
                  allowClear
                  options={users.map((item) => ({ label: item.nameCn, value: item.employeeNo }))}
                  placeholder={'?????????'}
                />
              </Form.Item>
              <Form.Item label={'????????????'} name={'secrecyLevel'} rules={[{ required: true, message: '????????????' }]}>
                <Radio.Group>
                  <Radio value={'OPEN'}>??????</Radio>
                  <Radio value={'PARTLY_OPEN'}>?????????</Radio>
                  <Radio value={'CONFIDENTIAL'}>??????</Radio>
                  <Radio value={'TOP_SECRET'}>??????</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item label={'?????????'} name={'dataSourceId'} rules={[{ required: true, message: '????????????' }]}>
                <ExSelect options={dataSourceList} placeholder={'?????????'} />
              </Form.Item>
              <Form.Item label={'SQL??????'} name={'sqlStr'} rules={[{ required: true, message: '????????????' }]}>
                <SqlInput onChange={() => setSqlTiming(null)} onPreview={handlePreview} />
              </Form.Item>
            </Form>
            <Button block type={'primary'} size={'large'} disabled={sqlTiming === null} onClick={checkFirstStep}>
              {sqlTiming === null ? '??????????????????': '?????????'}
            </Button>
          </div>
        </Spin>
      )}
      {current === 1 && (
        <div>
          <ExTable {...table} setTable={setTable} />
          <div className={'flex space-x-2.5 mt-2.5'}>
            <Button block size={'large'} onClick={() => gotoStep(0)}>
              ?????????
            </Button>
            <Button
              disabled={templateData.current.status === 'WAITING_APPROVED'}
              block
              type={'primary'}
              size={'large'}
              onClick={submitConfirm}>
              {templateData.current.status === 'WAITING_APPROVED' ? '???????????????????????????...' : '????????????'}
            </Button>
          </div>
        </div>
      )}

      {current === 2 && (
        <div>
          <Result
            status="success"
            title="????????????"
            subTitle="????????????????????????????????????????????????????????????????????????"
            extra={[
              <Button key="create" onClick={createNew}>
                ????????????
              </Button>,
              <Button key="audit" onClick={() => history.push('/fetchData/audit')}>
                ????????????
              </Button>,
              <Button key="list" type={'primary'} onClick={() => jumpUrl('/fetchData/cfg/temp-cfg')}>
                ????????????
              </Button>,
            ]}
          />
        </div>
      )}
    </div>
  )
}

export default EditPage
