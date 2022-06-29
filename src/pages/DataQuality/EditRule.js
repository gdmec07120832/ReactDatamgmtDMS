import React, { useEffect, useState } from 'react'
import { useHistory, useLocation, useRouteMatch } from 'react-router-dom'
import { connect } from 'react-redux'
import styled from 'styled-components'
import { Button, Form, Input, InputNumber, message, Rate } from 'antd'
import ExSelect from '../../components/Select'
import CodeMirrorLayer from '../../components/CodeMirrorLayer'
import axios from '../../utils/axios'
import { useForm } from 'antd/es/form/Form'
import cronstrue from 'cronstrue/i18n'
import { DeleteOutlined, InfoCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { useRequest } from 'ahooks'
import useUserList from '../../hooks/useUserList'
import { Tooltip } from '@material-ui/core'
import ComparisonInput from './components/ComparisonInput'
import { isNil } from 'lodash/lang'

// 需要推送的类型
const PUSH_TYPE_CODE = 'AbnormalDataCheck'

const PageWrapper = styled.div`
  .ant-form-item-label {
    min-width: 85px;
  }
`

const HeadTitle = styled.div`
  font-size: 16px;
  padding: 12px 24px;
  font-family: PingFangSC-Medium, PingFang SC, 'Microsoft YaHei UI', sans-serif;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
  line-height: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
`

function EditRule(props) {
  const { setBreadcrumbParams } = props
  const match = useRouteMatch()
  const history = useHistory()
  const location = useLocation()
  const readonly = match.path.includes('checkRule')
  const { id, ruleId } = match.params
  const [tempRuleId, setTempRuleId] = useState()
  const [form] = useForm()

  const userList = useUserList()
  // 钉钉群
  const [ddGroupList, setDdGroupList] = useState([])
  // 钉钉群机器人
  const [ddGroupRbtList, setDdGroupRbtList] = useState([])

  // 个人消息
  const [personalRec, setPersonalRec] = useState([])
  // 群消息
  const [groupRec, setGroupRec] = useState([])
  // 机器人
  const [robotRec, setRobotRec] = useState([
    {
      key: Math.random().toString(32).slice(-8),
      sendTo: undefined,
      phones: [],
    },
  ])

  const handleRobotRowChange = (v, row, prop) => {
    setRobotRec((prevState) => {
      const index = prevState.findIndex((item) => item.key === row.key)
      if (index > -1) {
        return [
          ...prevState.slice(0, index),
          {
            ...prevState[index],
            phones: prop === 'sendTo' && !v ? [] : prevState[index].phones,
            [prop]: v,
          },
          ...prevState.slice(index + 1),
        ]
      } else {
        return prevState
      }
    })
  }

  const addRobotRecRow = () => {
    if (readonly) {
      return
    }
    setRobotRec((prevState) => [
      ...prevState,
      {
        key: Math.random().toString(32).slice(-8),
        sendTo: undefined,
        phones: [],
      },
    ])
  }

  const deleteRobotRecRow = (row) => {
    if (readonly) {
      return
    }
    setRobotRec((prevState) => {
      const index = prevState.findIndex((item) => item.key === row.key)
      if (index > -1) {
        return [...prevState.slice(0, index), ...prevState.slice(index + 1)]
      } else {
        return prevState
      }
    })
  }

  useRequest(() => {
    return axios.get('/bi-sys/api/user/noticeToObj/findAllInfo').then(({ data }) => {
      setDdGroupList(
        data
          .filter((item) => item.messageType === 1)
          .map((item) => {
            return {
              value: item.chartId,
              label: item.chartName,
            }
          })
      )
      setDdGroupRbtList(
        data
          .filter((item) => item.messageType === 3)
          .map((item) => {
            return {
              value: item.chartId,
              label: item.chartName,
            }
          })
      )
    })
  })

  useEffect(() => {
    setBreadcrumbParams([{ id }])
  }, [setBreadcrumbParams, id])

  const [dataSourceList, setDataSourceList] = useState([])
  useRequest(() => {
    return axios.get('/bi-sys/api/user/datasourceConfig/findAllInfo').then(({ data }) => {
      const list = data.map((item) => ({ label: item.dbCnName, value: item.id }))
      setDataSourceList(list)
      return data
    })
  })

  useEffect(() => {
    const initForm = (data) => {
      const { tempRuleId, noticeConfigs, comparisonOperator, threshold } = data
      const msgDescription = noticeConfigs?.[0]?.msgDescription
      setTempRuleId(tempRuleId)
      form.setFieldsValue({
        ...data,
        msgDescription,
        comparison: {
          comparisonOperator,
          threshold,
        },
      })
      setPersonalRec((noticeConfigs || []).filter((item) => item.msgType === 0).map((item) => item.sendTo))
      setGroupRec((noticeConfigs || []).filter((item) => item.msgType === 1).map((item) => item.sendTo))
      const ret = (noticeConfigs || [])
        .filter((item) => item.msgType === 2)
        .map((item) => {
          return {
            key: Math.random().toString(32).slice(-8),
            sendTo: item.sendTo,
            phones: (item.phones || '').split(',').filter(Boolean),
          }
        })
      setRobotRec(
        ret.length
          ? ret
          : [
              {
                key: Math.random().toString(32).slice(-8),
                sendTo: undefined,
                phones: [],
              },
            ]
      )
    }

    if (ruleId && ruleId !== 'new') {
      axios
        .get('/bi-data-quality/api/user/verificationRule/findById', {
          params: { id: ruleId },
        })
        .then(({ data }) => {
          initForm(data)
        })
    } else {
      // 如果是通过复制进入的
      const value = location.state?.copiedValue
      if (value) {
        initForm(value)
      }
    }
  }, [ruleId, form, location])
  const [tempList, setTempList] = useState([])
  useRequest(() => {
    return axios
      .get('/bi-data-quality/api/admin/ruleTemplate/queryPage', {
        params: { page: 1, pageSize: 99 },
      })
      .then(({ data: { list } }) => {
        setTempList(
          list.map((item) => ({
            ...item,
            code: item.tempCode,
            value: item.id,
            label: item.tempName,
          }))
        )
      })
  })
  // 规则
  const isFileType = tempList.find((item) => item.id === tempRuleId)?.code === PUSH_TYPE_CODE

  const handleCheckCron = () => {
    const cron = form.getFieldValue('cron')
    if (!(cron || '').trim()) {
      message.error('表达式不能为空')
      return
    }
    try {
      const str = cronstrue.toString(cron, { locale: 'zh_CN' })
      message.success(str)
    } catch (err) {
      message.error('表达式有误')
    }
  }

  const cancelEdit = () => {
    history.push(`/dataQuality/plan/${id}`)
  }

  const { run: submitReq, loading: submitLoading } = useRequest(
    (data) => {
      return axios.post('/bi-data-quality/api/admin/verificationRule/saveOrUpdate', data)
    },
    { manual: true }
  )

  const checkComparison = (_, value) => {
    if (value?.comparisonOperator && !isNil(value?.threshold)) {
      return Promise.resolve()
    }
    return Promise.reject(new Error('请完善执行结果'))
  }

  const submitForm = () => {
    form.validateFields().then(
      (values) => {
        const { msgDescription, comparison, ...restValues } = values
        const personalRecObj = personalRec.map((empNo) => {
          return {
            msgType: 0,
            msgDescription,
            sendTo: empNo,
            status: 1,
          }
        })
        const groupRecObj = groupRec.map((groupId) => {
          return {
            msgType: 1,
            msgDescription,
            sendTo: groupId,
            status: 1,
          }
        })
        const errIndex = robotRec.findIndex(item => !item.sendTo && item.phones?.length)
        if(errIndex > -1) {
          message.error(`错误：【钉钉群消息@人】 第【${errIndex + 1}】条记录（群名称不能为空）`)
          return
        }
        const robotRecObj = robotRec
          .filter((item) => item.sendTo)
          .map((robotItem) => {
            return {
              msgType: 2,
              msgDescription,
              sendTo: robotItem.sendTo,
              phones: robotItem.phones?.length ? robotItem.phones.join(',') : undefined,
              status: 1,
            }
          })

        const data = {
          ...restValues,
          ...(comparison || {}),
          schemeId: Number(id),
          noticeConfigs: [...personalRecObj, ...groupRecObj, ...robotRecObj],
        }
        if (ruleId && ruleId !== 'new') {
          data.id = Number(ruleId)
        }
        submitReq(data).then(() => {
          message.success('保存成功')
          setTimeout(() => {
            history.push(`/dataQuality/plan/${id}`)
          }, 200)
        })
      },
      (err) => {
        const { errorFields } = err
        if (errorFields.length) {
          message.error('请检查表单字段')
        }
        return Promise.reject(err)
      }
    )
  }

  return (
    <PageWrapper>
      <Form form={form} labelCol={{ span: 4 }} disabled={readonly}>
        <HeadTitle>编辑规则</HeadTitle>

        <div className={'p-6'}>
          <div className={'w-3/4'}>
            <div className={'grid grid-cols-2 gap-x-6'}>
              <Form.Item label={'规则模板'} name={'tempRuleId'} rules={[{ required: true }]}>
                <ExSelect options={tempList} onChange={(v) => setTempRuleId(v)} disabled={readonly} />
              </Form.Item>
              <Form.Item label={'规则名称'} name={'ruleName'} rules={[{ required: true }]}>
                <Input maxLength={50} disabled={readonly} />
              </Form.Item>
              <Form.Item label={'问题级别'} name={'problemLevel'} rules={[{ required: true }]}>
                <Rate allowHalf style={{ color: 'var(--secondary-color)' }} disabled={readonly} />
              </Form.Item>
              <Form.Item label="规则描述" name="ruleDescription">
                <Input maxLength={200} disabled={readonly} />
              </Form.Item>
              <Form.Item label="权重" name="weights" rules={[{ required: true }, { type: 'number', min: 1, max: 100 }]}>
                <InputNumber style={{ width: '100%' }} disabled={readonly} />
              </Form.Item>
              <Form.Item label="执行库" name="targetDatasourceId" rules={[{ required: true }]}>
                <ExSelect options={dataSourceList} disabled={readonly} />
              </Form.Item>
            </div>

            <Form.Item
              label={'执行脚本'}
              labelCol={{ span: 2 }}
              layout="vertical"
              name={'sqlStr'}
              rules={[{ required: true }]}>
              <CodeMirrorLayer
                disabled={readonly}
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

            <div className={'grid grid-cols-2 gap-x-6'}>
              {isFileType ? null : (
                <Form.Item
                  label="执行结果"
                  required
                  name={'comparison'}
                  rules={[{ validator: checkComparison }]}>
                  <ComparisonInput disabled={readonly} />
                </Form.Item>
              )}
              <Form.Item label="Cron" required>
                <div className="flex justify-between">
                  <Form.Item name="cron" rules={[{ required: true }]} noStyle style={{ width: '80%' }}>
                    <Input disabled={readonly} />
                  </Form.Item>
                  <Button type={'link'} onClick={handleCheckCron}>
                    检验
                  </Button>
                </div>
              </Form.Item>
            </div>
          </div>
        </div>
        <HeadTitle>编辑通知对象</HeadTitle>
        <div className={'p-6'}>
          <div className={'w-3/4'}>
            <Form.Item
              label={isFileType ? '文件名称' : '消息内容'}
              name={'msgDescription'}
              labelCol={{ span: 2 }}
              rules={[{ required: true }]}>
              {isFileType ? (
                <Input maxLength={50} disabled={readonly} />
              ) : (
                <Input.TextArea autoSize={{ minRows: 1, maxRows: 6 }} disabled={readonly} maxLength={500} />
              )}
            </Form.Item>
            <div className={'flex py-3'} style={{ background: '#fafafa', marginLeft: '2.5%' }}>
              <div className={'flex-grow-0 w-40 px-4 font-medium'}>消息类型</div>
              <div className={'flex-1 px-4 font-medium'}>发送对象</div>
            </div>

            <div className={'flex py-5'} style={{ marginLeft: '2.5%', borderBottom: '1px solid rgba(0,0,0,.06)' }}>
              <div className={'flex-grow-0 w-40 px-4'}>钉钉个人消息</div>
              <div className={'flex-1 px-4 flex'}>
                <ExSelect
                  disabled={readonly}
                  value={personalRec}
                  onChange={(v) => setPersonalRec(v)}
                  mode={'multiple'}
                  options={userList.map((item) => ({ value: item.employeeNo, label: item.nameCn }))}
                />
                <div className={'flex-grow-0'}>
                  <Button disabled={readonly} type={'link'} onClick={() => setPersonalRec([])}>
                    清空
                  </Button>
                </div>
              </div>
            </div>

            <div className={'flex py-5'} style={{ marginLeft: '2.5%', borderBottom: '1px solid rgba(0,0,0,.06)' }}>
              <div className={'flex-grow-0 w-40 px-4'}>钉钉群消息</div>
              <div className={'flex-1 px-4 flex'}>
                <ExSelect
                  disabled={readonly}
                  value={groupRec}
                  onChange={(v) => setGroupRec(v)}
                  mode={'multiple'}
                  options={ddGroupList}
                />
                <div className={'flex-grow-0'}>
                  <Button type={'link'} disabled={readonly} onClick={() => setGroupRec([])}>
                    清空
                  </Button>
                </div>
              </div>
            </div>

            {isFileType ? null : (
              <div
                className={'flex items-start py-5'}
                style={{ marginLeft: '2.5%', borderBottom: '1px solid rgba(0,0,0,.06)' }}>
                <div className={'flex-grow-0 w-40 px-4'}>
                  钉钉群消息@人
                  <Tooltip title={'用户填写手机号后才能被@，可在【后台管理】中完善'}>
                    <InfoCircleOutlined className={'ml-1 text-gray-500'} />
                  </Tooltip>
                </div>
                <div className={'flex-1 px-4'}>
                  {robotRec.map((item, index) => (
                    <div className={'flex justify-start last:mb-0 mb-4 w-full'} key={item.key}>
                      <ExSelect
                        disabled={readonly}
                        value={item.sendTo}
                        onChange={(v) => handleRobotRowChange(v, item, 'sendTo')}
                        options={ddGroupRbtList}
                        allowClear
                        style={{ width: '45%' }}
                        className={'flex-grow-0 mr-4'}
                      />
                      <span className={'mr-2'}>你想@谁</span>
                      <ExSelect
                        disabled={readonly}
                        value={item.phones}
                        onChange={(v) => handleRobotRowChange(v, item, 'phones')}
                        mode={'multiple'}
                        options={userList
                          .filter((item) => item.phone)
                          .map((item) => ({ value: item.phone, label: item.nameCn }))}
                        style={{ width: 'calc(55% - 140px)' }}
                        className={'flex-grow-0 mr-4'}
                      />
                      <div className={'mx-2 cursor-pointer'} style={{ color: 'rgba(165, 165, 165, 1)' }}>
                        {index === 0 ? (
                          <PlusOutlined onClick={addRobotRecRow} />
                        ) : (
                          <DeleteOutlined disabled={readonly} onClick={() => deleteRobotRecRow(item)} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Form>
      {!readonly && (
        <div className={'p-6 text-right bg-white sticky -bottom-6 shadow-2xl'} style={{ zIndex: 900 }}>
          <Button className={'mr-2'} onClick={cancelEdit}>
            取消
          </Button>
          <Button type={'primary'} onClick={submitForm} loading={submitLoading}>
            确定
          </Button>
        </div>
      )}
    </PageWrapper>
  )
}

export default connect(
  () => {
    return {}
  },
  (dispatch) => {
    return {
      setBreadcrumbParams: (payload) => {
        dispatch({ type: 'set_breadcrumb_params', payload })
      },
    }
  }
)(EditRule)
