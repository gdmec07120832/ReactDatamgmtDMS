import DraggableModal from '../../../components/DraggableModal'
import { DatePicker, Form, Input, InputNumber, message, TreeSelect } from 'antd'
import React, { useEffect, useState } from 'react'
import ExSelect from '../../../components/Select'
import useConstant from '../../../hooks/useConstant'
import { useRequest } from 'ahooks'
import axios from '../../../utils/axios'
import { useForm } from 'antd/es/form/Form'
import FileChooser from '../components/FileChooser'
import { useUpdate } from 'ahooks'
import eachDeep from 'deepdash/es/eachDeep'
import moment from 'moment'
import StyledTreeSelect from '../components/StyledTreeSelect';
import {useSelector} from 'react-redux';

const sign = Math.random().toString(32).slice(-4)

const useServerList = (...args) => {
  const [listMap, setListMap] = useState({})
  useRequest(() => {
    return axios.get('/bi-sys/api/user/datasourceConfig/findAllInfo').then(({ data }) => {
        const ret = ([]).reduce.call(args, (acc, cur) => {
            acc[cur['key']] = cur['parse']?.(data)
            return acc
          }, {})
        setListMap(ret)
    })
  })
  console.log(listMap)
  return listMap
}

const EditModal = (props) => {
  const [userList, setUserList] = useState([])
  const userInfo = useSelector(state => state.user.userInfo)
  useRequest(() => {
    return axios.get('/bi-sys/api/user/biSysUser/resultForSelectByPermissionExpression', {
      params: {
        expression: 'bi-task-scheduling-system.JobController.insertOrUpdate'
      }
    }).then(({data}) => {
      setUserList(data)
    })
  })
  const logLevelList = useConstant('logLevel')
  const forceUpdate = useUpdate()

  const {yhServerList = [], apiLinkList = []} = useServerList({
    key: 'yhServerList',
    parse(data) {
      return data.filter(item => {return item.dbType === 4}).map(item => ({...item, label: item.dbCnName, value: item.id }))
    }
  }, {
    key: 'apiLinkList',
    parse(data) {
      return data.filter(item => {return item.dbType === 9}).map(item => ({...item, label: item.dbCnName, value: item.id }))
    }
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
          (child) => {
            child.title = child.text
            child.value = `${child.id}#${sign}#${child.text}`
          },
          { childrenPath: 'children' }
        )
        setJobTree(ret)
      })
  })

  const [superiorJobList, setSuperiorJobList] = useState([])
  const {run: getSuperiorJobList} = useRequest(
    (params) => {
      return axios
        .get('/bi-task-scheduling-system/api/user/job/listJobForComboBoxByGroupId', {
          params,
        })
        .then(({ data }) => {
          setSuperiorJobList(
            data.map((item) => ({
              value: item.id,
              label: item.jobName,
            }))
          )
        })
    },
    {
      manual: true,
    }
  )

  const { editRow, setEditRow, onSuccess } = props
  const [form] = useForm()
  const title = editRow?.id ? '????????????' : '????????????'
  const close = () => {
    setEditRow(null)
    form.resetFields()
  }

  useEffect(() => {
    editRow?.id &&
      form.setFieldsValue({
        ...editRow,
        depJobIdList: editRow?.depJobs
          ? editRow?.depJobs.map((item) => {
              return `${item.id}#${sign}#${item.jobName}`
            })
          : [],
        apiServer: apiLinkList.find(item => editRow.apiKey === item.apiKey)?.id,
        yHServerId: yhServerList.find(item => editRow.callIp === item.host && editRow.callPort === item.port)?.id,
        etlStartDate: editRow.etlStartDate ? moment(editRow.etlStartDate, 'YYYY-MM-DD') : null,
        etlEndDate: editRow.etlEndDate ? moment(editRow.etlEndDate, 'YYYY-MM-DD') : null,
      })
    if(editRow?.groupId) {
      getSuperiorJobList({groupId: editRow.groupId})
    }
    if(!editRow?.id) {
      form.setFieldsValue({
        directorId: userInfo.id,
        logLevelCode: 3,
        realTime: false,
        retryNumber: 3,
        seq: 5,
        extInterval: 200,
        overTime: 2000,
        limitedRunningTime: 7200,
      })
    }
    forceUpdate()
  }, [userInfo, editRow, form, forceUpdate, getSuperiorJobList, yhServerList, apiLinkList])

  const [groupList, setGroupList] = useState([])
  useRequest(() => {
    return axios.get('/bi-task-scheduling-system/api/user/group/listGroupsForComboBoxIncludeLevel').then(({ data }) => {
      setGroupList(
        data.map((item) => {
          return {
            label: item.groupName,
            value: item.id,
          }
        })
      )
    })
  })

  const [chooseFileType, setChooseFileType] = useState(null)
  const PopupFileChooser = () => {
    let type = form.getFieldValue('jobType')
    if (!type) {
      message.error('????????????????????????')
      return
    }
    setChooseFileType(type)
  }

  const chooseAFile = (fileInfo) => {
    const name = fileInfo.name
    const ret = /(.+)\.([^.])+/.exec(name)?.[1]
    if (ret) {
      form.setFieldsValue({
        jobName: ret,
      })
    }
    form.setFieldsValue({
      jobFileName: fileInfo.name,
      jobPath: fileInfo.filePath,
    })
  }

  const handleSubmit = () => {
    form.validateFields().then(
      (values) => {
        axios
          .post(
            '/bi-task-scheduling-system/api/admin/job/insertOrUpdate',
            {},
            {
              params: {
                ...values,
                depJobIdList: (values.depJobIdList || [])
                  .map((item) => {
                    return item.split(`#${sign}#`)[0]
                  })
                  .join(','),
                etlStartDate: values.etlStartDate ? values.etlStartDate.format('YYYY-MM-DD') : null,
                etlEndDate: values.etlEndDate ? values.etlEndDate.format('YYYY-MM-DD') : null,
              },
            }
          )
          .then(() => {
            message.success('????????????')
            close()
            onSuccess?.()
          })
      },
      () => {}
    )
  }

  const changeYhServer = (v) => {
    const item = yhServerList.find((item) => item.id === v)
    if (item) {
      form.setFieldsValue({
        callIp: item.host,
        callPort: item.port,
      })
    }
  }

  const changeAPiServer = (v) => {
    const item = apiLinkList.find((item) => item.id === v)
    if(item) {
      form.setFieldsValue({
        apiHost: item.host,
        apiKey: item.apiKey,
      })
    }
  }

  const handleGroupChange = (v) => {
    form.setFieldsValue({
      superiorJobId: undefined
    })
    if(v) {
      getSuperiorJobList({groupId: v})
    }
  }

  return (
    <DraggableModal
      bodyStyle={{
        height: 600,
        overflowY: 'auto',
      }}
      title={title}
      width={860}
      destroyOnClose
      visible={!!editRow}
      onCancel={close}
      onOk={handleSubmit}>
      <Form
        form={form}
        labelCol={{ span: 6 }}>
        <Form.Item label={'id'} name={'id'} hidden>
          <Input />
        </Form.Item>
        <div className={'grid grid-cols-2 gap-x-6'}>
          <Form.Item label={'????????????'} name={'jobType'} rules={[{ required: true }]}>
            <ExSelect
                getPopupContainer={(node) => node.parentNode}
              onChange={forceUpdate}
              options={[
                { label: 'Kettle', value: 'kettle' },
                { label: 'JAR', value: 'JarFile' },
              ]}
              placeholder={'????????????'}
            />
          </Form.Item>
          <Form.Item label={'????????????'} name={'realTime'} rules={[{ required: true }]}>
            <ExSelect
                getPopupContainer={(node) => node.parentNode}
              options={[
                { label: '???', value: true },
                { label: '???', value: false },
              ]}
              placeholder={'??????????????????'}
            />
          </Form.Item>
          <Form.Item label={'????????????'} name={'jobName'} rules={[{ required: true }]}>
            <Input placeholder={'????????????'} />
          </Form.Item>
          <Form.Item label={'??????'} name={'groupId'} rules={[{ required: true }]}>
            <ExSelect onChange={handleGroupChange} options={groupList} placeholder={'??????'} getPopupContainer={(node) => node.parentNode} />
          </Form.Item>
          <Form.Item label={'?????????'} name={'directorId'} rules={[{ required: true }]}>
            <ExSelect
                getPopupContainer={(node) => node.parentNode}
              options={userList.map((item) => ({ label: item.nameCn, value: item.idUser }))}
              placeholder={'?????????'}
              allowClear
            />
          </Form.Item>
          <Form.Item label={'????????????'} name={'logLevelCode'}>
            <ExSelect
                getPopupContainer={(node) => node.parentNode}
              options={logLevelList.map((item) => ({ ...item, value: Number(item.value) }))}
              placeholder={'????????????'}
            />
          </Form.Item>
          <Form.Item label={'??????'} name={'description'}>
            <Input maxLength={50} placeholder={'??????'} />
          </Form.Item>
          <div />
          <Form.Item label={'????????????'} name={'jobFileName'} rules={[{ required: true }]}>
            <Input
              readOnly
              onClick={PopupFileChooser}
              title={form.getFieldValue('jobFileName')}
              placeholder={'????????????'}
            />
          </Form.Item>
          <Form.Item label={'????????????'} name={'jobPath'}>
            <Input placeholder={'<--?????????????????????????????????'} readOnly />
          </Form.Item>
          {
            form.getFieldValue('jobType') === 'JarFile' &&
            <>
              <Form.Item label={'API?????????'} name={'apiServer'}>
                <ExSelect onChange={changeAPiServer} options={apiLinkList} placeholder={'API?????????'} />
              </Form.Item>
              <Form.Item label={'API??????'} name={'apiHost'}>
                <Input placeholder={'API??????'} />
              </Form.Item>
              <Form.Item hidden label={'API KEY'} name={'apiKey'}>
                <Input />
              </Form.Item>
            </>
          }
          <Form.Item label={'????????????'} name={'superiorTri'}>
            <ExSelect
              onChange={forceUpdate}
              options={[
                { label: '???', value: true },
                { label: '???', value: false },
              ]}
              placeholder={'??????????????????'}
            />
          </Form.Item>
          {form.getFieldValue('superiorTri') ? (
            <Form.Item label={'??????'} name={'superiorJobId'}>
              <ExSelect options={superiorJobList} placeholder={'????????????'} getPopupContainer={(node) => node.parentNode} />
            </Form.Item>
          ) : (
            <div />
          )}

          <Form.Item label={'??????????????????'} name={'callAscURL'}>
            <ExSelect
              onChange={forceUpdate}
              options={[
                { label: '???', value: true },
                { label: '???', value: false },
              ]}
              placeholder={'????????????????????????'}
            />
          </Form.Item>
          {form.getFieldValue('callAscURL') && (
            <Form.Item label={'???????????????'} name={'yHServerId'}>
              <ExSelect onChange={changeYhServer} options={yhServerList} getPopupContainer={(node) => node.parentNode} />
            </Form.Item>
          )}
          {form.getFieldValue('callAscURL') && (
            <Form.Item label={'????????????IP'} name={'callIp'}>
              <Input readOnly />
            </Form.Item>
          )}
          {form.getFieldValue('callAscURL') && (
            <Form.Item label={'??????????????????'} name={'callPort'}>
              <Input readOnly />
            </Form.Item>
          )}
        </div>

        {form.getFieldValue('callAscURL') && (
          <Form.Item labelCol={{ span: 3 }} label={'??????????????????'} name={'callParameter'}>
            <Input placeholder={'??????????????????'} />
          </Form.Item>
        )}

        <Form.Item label={'????????????API'} labelCol={{ span: 3 }} name={'extCallingUrls'}>
          <Input.TextArea autoSize={{ maxRows: 4 }} placeholder={'???????????????????????????,?????????'} />
        </Form.Item>

        <Form.Item label={'????????????'} name={'depJobIdList'} labelCol={{ span: 3 }}>
          <StyledTreeSelect
            getPopupContainer={(node) => node.parentNode}
            treeData={jobTree}
            fieldNames={{ label: 'text', key: 'id' }}
            treeCheckable
            showCheckedStrategy={TreeSelect.SHOW_CHILD}
            allowClear
            placeholder={'????????????'}
          />
        </Form.Item>
        <div className={'grid grid-cols-2 gap-x-6'}>
          <Form.Item label={'??????????????????'} name={'retryNumber'}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label={'????????????(???)'} name={'overTime'}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label={'??????'} name={'seq'}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label={'????????????(???)'} name={'extInterval'}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label={'??????????????????'} name={'limitedRunningTime'}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        </div>
        <div className={'grid grid-cols-2 gap-x-6'}>
          <Form.Item label={'ETL_StartDate'} name={'etlStartDate'}>
            <DatePicker style={{ width: '100%' }} getPopupContainer={(node) => node.parentNode} />
          </Form.Item>
          <Form.Item label={'ETL_EndDate'} name={'etlEndDate'}>
            <DatePicker style={{ width: '100%' }} getPopupContainer={(node) => node.parentNode} />
          </Form.Item>
        </div>
      </Form>
      <FileChooser fileType={chooseFileType} setFileType={setChooseFileType} onSuccess={chooseAFile} />
    </DraggableModal>
  )
}

export default EditModal
