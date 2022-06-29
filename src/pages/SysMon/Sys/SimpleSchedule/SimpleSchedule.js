import React, { useEffect, useRef, useState } from 'react'
import { Button, Calendar, Cascader, Drawer, Form, Input, message, Modal, Popconfirm, Space, Spin } from 'antd'
import { EyeOutlined, LeftCircleOutlined, MinusCircleOutlined, RightCircleOutlined } from '@ant-design/icons'
import moment from 'moment'
import { Tooltip } from '@material-ui/core'
import ExTable from '../../../../components/ExTable/ExTable'
import ExSelect from '../../../../components/Select'
import tw, { css, styled } from 'twin.macro'
import DraggableModal from '../../../../components/DraggableModal'
import { useRequest } from 'ahooks'
import axios from '../../../../utils/axios'
import { useSelector } from 'react-redux'
import { useForm } from 'antd/es/form/Form'
import useConstant from '../../../../hooks/useConstant'
import groupBy from 'lodash/groupBy'

const StyledCell = styled.div(({ isActive, disabled }) => [
  tw`grid grid-cols-2 divide-x h-full border-2 rounded border-transparent border-dashed hover:border-blue-500 overflow-hidden`,
  isActive && tw`border-blue-500`,
  disabled &&
    css`
      cursor: not-allowed;
      opacity: 0.5;
    `,
  css`
    .item {
      ${tw`overflow-auto px-1`}
      &::-webkit-scrollbar {
        width: 0;
      }

      .expand-icon {
        display: none;
      }

      &:hover {
        .expand-icon {
          display: inline-block;
        }
      }

      .employeeName:hover {
        border-radius: 4px;
        color: var(--primary-color);
        background: rgba(0, 0, 0, 0.06);
      }
    }
  `,
])

const StyledCal = styled(Calendar)`
  &.ant-picker-calendar-full .ant-picker-panel .ant-picker-cell-selected .ant-picker-calendar-date {
    background: initial;
  }

  &.ant-picker-calendar-full .ant-picker-panel .ant-picker-cell-today .ant-picker-calendar-date {
    background: #f0f8ff;
  }
`

const StyleModalDetail = styled.div`
  .item {
    .delete-icon {
      display: none;
    }

    &:hover {
      .delete-icon {
        display: inline-block;
      }
    }
  }
`

function SimpleSchedule() {
  const [date, setDate] = useState(moment())
  const [employeeNo, setEmployeeNo] = useState(undefined)
  const [deptList, setDeptList] = useState([])
  const [dayList, setDayList] = useState({})
  const permissionsMap = useSelector((state) => state.user.permissionsMap)
  const currentUser = useSelector((state) => state.user)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [defaultListKeyword, setDefaultListKeyword] = useState('')
  const [userList, setUserList] = useState([])
  const [userList2, setUserList2] = useState([])
  const loadUserRef = useRef(false)
  const [editOfficeForm] = useForm()

  const officeList = useConstant('USER_DEFAULT_OFFICE_TYPE')

  const { run: loadUserList } = useRequest(
    () => {
      return axios.get('/bi-sys/api/user/biSysUser/findAllUserWithEmployeeNo').then(({ data }) => {
        loadUserRef.current = true
        setUserList(
          data.map((item) => {
            return {
              label: item.value,
              value: item.key,
              disabled: item.status !== 1,
            }
          })
        )
      })
    },
    { manual: true }
  )

   const {run: getUserList2, cancel: cancelGetUserList2} =  useRequest(() => {
    return axios.get('/bi-sys/api/user/userDefaultOffice/listUsers', {
      params: {
        deptLv1Name: deptList?.[0],
        deptLv2Name: deptList?.[1],
        deptLv3Name: deptList?.[2],
        deptLv4Name: deptList?.[3]
      }
    }).then(({ data }) => {
      setUserList2(
        data.map((item) => {
          return {
            label: item.value,
            value: item.key,
          }
        })
      )
    })
  }, {manual: true})

  useEffect(() => {
    cancelGetUserList2()
    getUserList2()
    setEmployeeNo(undefined)
  }, [deptList, getUserList2, cancelGetUserList2])

  const { run: getDayList, loading: dayListLoading } = useRequest(
    () => {
      return axios
        .get('/bi-sys/api/admin/userOfficeSkd/listSkdByMonth', {
          params: {
            month: date.format('YYYY-MM'),
            employeeNo: employeeNo,
            deptLv1Name: deptList?.[0],
            deptLv2Name: deptList?.[1],
            deptLv3Name: deptList?.[2],
            deptLv4Name: deptList?.[3]
          },
        })
        .then(({ data }) => {
          setDayList(
            data.reduce((acc, cur) => {
              const list = cur.skds
              acc[cur.workday] = groupBy(list, 'officeLocation')
              return acc
            }, {})
          )
        })
    },
    { manual: true, debounceInterval: 100 }
  )

  useEffect(() => {
    setDayList({})
    getDayList()
  }, [date, getDayList, employeeNo, deptList])

  const settingClick = () => {
    if (!loadUserRef.current) {
      loadUserList()
    }
    setDrawerVisible(true)
  }

  const [editDefaultRow, setEditDefaultRow] = useState(null)

  const [table, setTable] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
    },
    columns: [
      {
        dataIndex: 'employeeNo',
        title: '名称（工号）',
        render: (text, record) => {
          return (
            <span>
              {record.nameCn || '??'}({text})
            </span>
          )
        },
      },
      { dataIndex: 'defaultOffice', title: '默认工作地' },
      {
        dataIndex: 'actions',
        title: '操作',
        width: 120,
        render(text, record) {
          return (
            <Space>
              {permissionsMap['bi-sys.UserDefaultOfficeController.saveOrUpdate'] && (
                <Button size={'small'} type={'link'} onClick={() => editRow(record)}>
                  编辑
                </Button>
              )}
              {permissionsMap['bi-sys.UserDefaultOfficeController.delete'] && (
                <Popconfirm title={'确定删除吗'} placement={'leftTop'} onConfirm={() => deleteRow(record)}>
                  <Button size={'small'} type={'link'} danger>
                    删除
                  </Button>
                </Popconfirm>
              )}
            </Space>
          )
        },
      },
    ],
  })

  const { current: currentPage, pageSize } = table.pagination
  const { run: getDefaultList, loading } = useRequest(
    () => {
      return axios
        .get('/bi-sys/api/admin/userDefaultOffice/list', {
          params: { currentPage, pageSize, keyword: defaultListKeyword },
        })
        .then(({ data: { list, totalRows: total } }) => {
          setTable((prevState) => ({
            ...prevState,
            dataSource: list,
            pagination: {
              ...prevState.pagination,
              total,
              current: Math.max(Math.min(currentPage, Math.ceil(total / pageSize)), 1),
            },
          }))
        })
    },
    { manual: true, debounceInterval: 200 }
  )

  const deleteRow = (record) => {
    axios
      .get('/bi-sys/api/admin/userDefaultOffice/delete', {
        params: { id: record.id },
      })
      .then(() => {
        message.success('删除成功')
        getDefaultList()
      })
  }

  const editRow = (record) => {
    setEditDefaultRow(record)
    editOfficeForm.setFieldsValue(record)
  }

  useEffect(() => {
    if (drawerVisible) {
      getDefaultList()
    }
  }, [drawerVisible, currentPage, pageSize, getDefaultList, defaultListKeyword])

  const [editModalVisible, setEditModalVisible] = useState(false)
  const [startDate, setStartDate] = useState(null)
  const [deptOptions, setDeptOptions] = useState([])

  const { run: loadDept } = useRequest((selectedOptions) => {
    const tgt = selectedOptions?.[selectedOptions?.length - 1]
    if (tgt) {
      tgt.loading = true
    }
    return axios
      .get('/bi-sys/api/user/userDefaultOffice/selectDeptByParentDeptName', {
        params: {
          currentDeptLevel: (tgt?.level || 0) + 1,
          parentDeptName: tgt?.value,
        },
      })
      .then(({ data }) => {
        const ret = data.map((item) => {
          return {
            label: item.value,
            value: item.value,
            isLeaf: false,
            level: (tgt?.level || 0) + 1,
          }
        })

        if (tgt) {
          if (!data.length) {
            tgt.isLeaf = true
          } else {
            tgt.children = ret
          }
          tgt.loading = false
          setDeptOptions([...deptOptions])
        } else {
          setDeptOptions(ret)
        }
      })
  })
  useEffect(() => {
    loadDept([])
  }, [loadDept])

  const headerRender = ({ value, onChange }) => {
    return (
      <div className={'flex'}>
        <div className={'flex flex-1 space-x-4'}>
          <Button
            className={'rounded'}
            onClick={() => {
              setDate(moment())
              onChange(moment())
            }}>
            今天
          </Button>
          <div className={'space-x-1 text-xl text-gray-400'}>
            <Tooltip enterDelay={500} title={'上个月'}>
              <LeftCircleOutlined
                className={'cursor-pointer hover:text-gray-600 p-2 rounded-full hover:bg-gray-200'}
                onClick={() => {
                  setDate(moment(value).subtract(1, 'months'))
                  onChange(moment(value).subtract(1, 'months'))
                }}
              />
            </Tooltip>
            <Tooltip enterDelay={500} title={'下个月'}>
              <RightCircleOutlined
                className={'cursor-pointer hover:text-gray-600 p-2 rounded-full hover:bg-gray-200'}
                onClick={() => {
                  setDate(moment(value).add(1, 'months'))
                  onChange(moment(value).add(1, 'months'))
                }}
              />
            </Tooltip>
          </div>
          <span className={'text-2xl font-bold'}>{value.format('YYYY年M月')}</span>
        </div>
        <div className={'space-x-2.5'}>
          <Cascader className={'w-96'} options={deptOptions} placeholder={'选择部门'} onChange={(v) => {
            setDeptList(v)
          }} loadData={loadDept} changeOnSelect />
          <ExSelect
            className={'w-64'}
            placeholder={'选择人员'}
            options={userList2}
            value={employeeNo}
            onChange={(v) => setEmployeeNo(v)}
            allowClear
          />
          {permissionsMap['bi-sys.UserDefaultOfficeController.list'] && (
            <Button type={'primary'} onClick={settingClick}>
              默认配置
            </Button>
          )}
        </div>
      </div>
    )
  }

  const handleCellClick = (date) => {
    setEditModalVisible(true)
    setStartDate(date)
  }

  const showDetails = (loc, dateStr, list) => {
    const handleDelete = (item) => {
      axios
        .get('/bi-sys/api/user/userOfficeSkd/deleteSkd', {
          params: { id: item.id },
        })
        .then(() => {
          message.success('删除成功')
          Modal.destroyAll()
          getDayList()
        })
    }
    Modal.info({
      title: '详情',
      okText: '关闭',
      content: (
        <StyleModalDetail>
          <div className={'mb-2.5'}>
            以下人员 <span className={'font-bold'}>{dateStr}</span> 在 <span className={'font-bold'}>{loc}</span> 办公：
            <br />
            (<span style={{color: 'red'}}>红色标记</span>表示非默认办公地)
          </div>
          <div className={'grid grid-cols-4'}>
            {list.map((item) => {
              return (
                <div className={'item flex space-x-2'} key={item.id}>
                  <span style={{ color: item.officeLocationChange ? 'red' : '' }}>
                    {item.nameCn || item.employeeNo}
                  </span>
                  {(currentUser.userInfo.isAdmin || currentUser.userInfo.userName === item.employeeNo) &&
                    moment().startOf('day') <= moment(dateStr).startOf('day') && (
                      <MinusCircleOutlined
                        className={'delete-icon cursor-pointer text-red-600'}
                        onClick={() => handleDelete(item)}
                      />
                    )}
                </div>
              )
            })}
          </div>
        </StyleModalDetail>
      ),
    })
  }

  const handleEmployeeClick = (item) => {
    workDayForm.setFieldsValue({
      employeeNo: currentUser.userInfo.isAdmin ? item.employeeNo : currentUser.userInfo.userName,
    })
  }

  const dateCellRender = (_date) => {
    const dateStr = _date.format('YYYY-MM-DD')
    return (
      <StyledCell
        onClick={(e) => {
          e.stopPropagation()
          _date.month() === moment(date).month() &&
            _date.startOf('day').valueOf() >= moment().startOf('day').valueOf() &&
            handleCellClick(_date)
        }}
        disabled={_date.startOf('day') < moment().startOf('day')}
        isActive={_date.format('YYYY-MM-DD') === startDate?.format('YYYY-MM-DD')}>
        <div className={'item text-left'}>
          {!!(dayList[dateStr]?.['桂城'] || []).length && (
            <span
              className={'text-gray-600 font-bold cursor-pointer'}
              onClick={(e) => {
                e.stopPropagation()
                showDetails('桂城', dateStr, dayList[dateStr]?.['桂城'] || [])
              }}>
              桂城 <EyeOutlined className={'expand-icon'} />
            </span>
          )}

          {(dayList[dateStr]?.['桂城'] || []).map((item) => {
            return (
              <div
                className={'employeeName'}
                style={{ color: item.officeLocationChange ? 'red' : '' }}
                key={item.id}
                title={item.nameCn || item.employeeNo}
                onClick={() => handleEmployeeClick(item)}>
                {item.nameCn || item.employeeNo}
              </div>
            )
          })}
        </div>
        <div className={'item text-right'}>
          {!!(dayList[dateStr]?.['沙头'] || []).length && (
            <span
              className={'text-gray-600 font-bold cursor-pointer'}
              onClick={(e) => {
                e.stopPropagation()
                showDetails('沙头', dateStr, dayList[dateStr]?.['沙头'] || [])
              }}>
              <EyeOutlined className={'expand-icon'} /> 沙头
            </span>
          )}
          {(dayList[dateStr]?.['沙头'] || []).map((item) => {
            return (
              <div
                className={'employeeName'}
                key={item.id}
                title={item.nameCn || item.employeeNo}
                onClick={() => handleEmployeeClick(item)}>
                {item.nameCn || item.employeeNo}
              </div>
            )
          })}
        </div>
      </StyledCell>
    )
  }

  const closeDrawer = () => {
    setDrawerVisible(false)
    setTable((prevState) => ({
      ...prevState,
      pagination: { ...prevState.pagination, current: 1, pageSize: 10 },
    }))
  }

  const addNewRow = () => {
    setEditDefaultRow({})
  }

  const cancelEdit = () => {
    setEditDefaultRow(null)
    editOfficeForm.resetFields()
  }

  const submitOfficeForm = () => {
    editOfficeForm.validateFields().then((value) => {
      axios
        .get('/bi-sys/api/admin/userDefaultOffice/saveOrUpdate', {
          params: value,
        })
        .then(() => {
          cancelEdit()
          getDefaultList()
        })
    })
  }

  const [workDayForm] = useForm()
  const editModalClose = () => {
    setEditModalVisible(false)
    setStartDate(null)
    workDayForm.resetFields()
  }
  const handleSubmit = () => {
    workDayForm.validateFields().then((values) => {
      axios
        .post('/bi-sys/api/admin/userOfficeSkd/saveOrUpdateSkd', {
          officeLocation: values.officeLocation,
          employeeNo: values.employeeNo,
          workday: startDate?.format('YYYY-MM-DD'),
        })
        .then(() => {
          message.success('编辑成功')
          editModalClose()
          getDayList()
        })
    })
  }

  return (
    <div className={'p-6 select-none'}>
      <Spin spinning={dayListLoading}>
        <StyledCal
          value={date}
          onChange={(v) => {
            v.format('YYYY-MM') !== date.format('YYYY-MM') && setDate(v)
          }}
          headerRender={headerRender}
          dateCellRender={dateCellRender}
        />
      </Spin>
      <Drawer
        extra={
          permissionsMap['bi-sys.UserDefaultOfficeController.saveOrUpdate'] && (
            <Button type={'primary'} onClick={addNewRow}>
              新增
            </Button>
          )
        }
        visible={drawerVisible}
        width={'40vw'}
        title={'默认工作地配置'}
        destroyOnClose
        onClose={closeDrawer}>
        <div>
          <Input
            value={defaultListKeyword}
            onChange={(e) => setDefaultListKeyword(e.target.value)}
            className={'w-64 mb-2.5'}
            placeholder={'输入关键字搜索'}
            allowClear
          />
          <ExTable {...table} setTable={setTable} loading={loading} />
        </div>
      </Drawer>
      {/*编辑默认值*/}
      <DraggableModal visible={editDefaultRow} title={'编辑/新增'} onOk={submitOfficeForm} onCancel={cancelEdit}>
        <Form form={editOfficeForm} labelCol={{ span: 5 }}>
          <Form.Item label={'ID'} name={'id'} hidden>
            <Input />
          </Form.Item>
          <Form.Item label={'用户'} name={'employeeNo'} rules={[{ required: true }]}>
            <ExSelect options={userList} disabled={!!editOfficeForm.getFieldValue('id')} />
          </Form.Item>
          <Form.Item label={'默认工作地'} name={'defaultOffice'} rules={[{ required: true }]}>
            <ExSelect options={officeList} />
          </Form.Item>
        </Form>
      </DraggableModal>

      <DraggableModal
        visible={editModalVisible}
        destroyOnClose
        title={'编辑'}
        onOk={handleSubmit}
        onCancel={editModalClose}>
        <Form
          form={workDayForm}
          labelCol={{ span: 4 }}
          initialValues={{ workday: startDate, employeeNo: currentUser.userInfo.userName }}>
          <Form.Item label={'用户'} name={'employeeNo'}>
            {currentUser.userInfo.isAdmin ? (
              <ExSelect options={userList2} />
            ) : (
              <span>
                {currentUser.userInfo.nameCn}（{currentUser.userInfo.userName}）
              </span>
            )}
          </Form.Item>
          <Form.Item label={'时间'} name={'workday'}>
            <span>{startDate?.format('YYYY-MM-DD')}</span>
          </Form.Item>
          <Form.Item label={'工作地点'} name={'officeLocation'}>
            <ExSelect options={officeList.map((item) => ({ label: item.value, value: item.value }))} />
          </Form.Item>
        </Form>
      </DraggableModal>
    </div>
  )
}

export default SimpleSchedule
