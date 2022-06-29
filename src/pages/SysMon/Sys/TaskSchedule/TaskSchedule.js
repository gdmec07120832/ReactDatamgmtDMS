import React, { useEffect, useRef, useState } from 'react'
import Timeline, {TodayMarker} from 'react-calendar-timeline/lib'
import random from 'lodash/random'
import moment from 'moment'
import { useRequest, useSize } from 'ahooks'
import 'react-calendar-timeline/lib/Timeline.css'
import styled, { css, keyframes } from 'styled-components'
import {Button, Cascader, DatePicker, Input, message, Select} from 'antd'
import { Popover as MPopover, Tooltip } from '@material-ui/core'
import { colord } from 'colord'
import {
  ClockCircleOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  LeftCircleOutlined,
  RightCircleOutlined,
  UserOutlined,
} from '@ant-design/icons'
import axios from '../../../../utils/axios'

const colors = ['#9e5fff', '#00a9ff', '#ff5583', '#03bd9e', '#bbdc00', '#9d9d9d', '#ffbb3b', '#ff4040']

const flicker = keyframes`
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.2;
  }
  100% {
    opacity: 1;
  }
`

const ItemText = styled.div`
  animation: ${(props) =>
    props.isComplete
      ? ''
      : css`
          ${flicker} 2s infinite
        `};
`

const StyledTimeline = styled(Timeline)`
  &.react-calendar-timeline .rct-header-root {
    background: var(--primary-color);
    position: sticky;
    top: -25px;
    z-index: 99;
  }

  &.react-calendar-timeline .rct-dateHeader {
    border-width: 1px;
    transform: translateX(-1px);
  }
`

const StyledInfoPopover = styled.div`
  max-width: 400px;

  .actions {
    border-top: 1px solid #ccc;
    height: 40px;
    line-height: 40px;

    > div {
      position: relative;

      + div:before {
        content: '';
        position: absolute;
        left: 0;
        height: 10px;
        top: calc(50% - 5px);
        width: 1px;
        background: #ccc;
      }
    }
  }
`

const EditMPopover = ({ item, onSuccess, onCancel }) => {
  const { start_time, end_time, group, title, id, isComplete, bgColor } = item || {}
  const [form, setForm] = useState({
    title: '',
    startDate: moment(start_time),
    endDate: moment(end_time || start_time),
  })

  useEffect(() => {
    setForm(() => ({
      color: bgColor,
      title: isComplete ? title : '',
      startDate: moment(start_time),
      endDate: moment(end_time || start_time),
    }))
  }, [title, start_time, end_time, isComplete, bgColor])

  const saveForm = () => {
    if (!form.title) {
      message.error('请填写任务名称')
      return
    }
    if (!form.startDate || !form.endDate) {
      message.error('请填写开始时间和结束时间')
      return
    }
    axios
      .post('/bi-sys/api/admin/workPlan/saveOrUpdate', {
        id: isComplete ? id : null,
        employeeNo: group,
        color: form.color,
        startDate: form.startDate.startOf('day').format('YYYY-MM-DD HH:mm:ss'),
        endDate: form.endDate.endOf('day').format('YYYY-MM-DD HH:mm:ss'),
        mattersName: form.title,
      })
      .then(() => {
        message.success('保存成功')
        onSuccess?.()
      })
  }
  return (
    <div className={'space-y-2.5'}>
      <Input.Group compact>
        <Select
          style={{ width: 60 }}
          value={form.color}
          onChange={(v) => setForm((prevState) => ({ ...prevState, color: v }))}>
          {colors.map((color) => (
            <Select.Option value={color} key={color}>
              {<div style={{ background: color, width: 12, height: 12, borderRadius: 12, display: 'inline-block' }} />}
            </Select.Option>
          ))}
        </Select>
        <Input
          style={{ width: 'calc(100% - 60px)' }}
          placeholder={'任务名称'}
          maxLength={50}
          value={form.title}
          onChange={(e) => setForm((prevState) => ({ ...prevState, title: e.target.value.trim() }))}
        />
      </Input.Group>
      <div className={'flex justify-around space-x-2.5'}>
        <DatePicker
          value={form.startDate}
          onChange={(v) => {
            setForm((prevState) => ({ ...prevState, startDate: v }))
            form.endDate && v.valueOf() > form.endDate && setForm((prevState) => ({ ...prevState, endDate: '' }))
          }}
          placeholder={'开始时间'}
          allowClear={false}
        />
        <span>~</span>
        <DatePicker
          value={form.endDate}
          disabledDate={(date) => {
            return form.startDate ? date.valueOf() < form.startDate.valueOf() : false
          }}
          onChange={(v) => setForm((prevState) => ({ ...prevState, endDate: v }))}
          placeholder={'结束时间'}
          allowClear={false}
        />
      </div>
      <div className={'text-right pt-2 space-x-2.5'}>
        <Button onClick={onCancel}>取消</Button>
        <Button type={'primary'} onClick={saveForm}>
          保存
        </Button>
      </div>
    </div>
  )
}

function TaskSchedule() {
  const [groups, setGroups] = useState([])
  const [items, setItems] = useState([])
  const [newItem, setNewItem] = useState(null)
  const [deptList, setDeptList] = useState([])
  const [deptOptions, setDeptOptions] = useState([])
  const [visibleTime, setVisibleTime] = useState({
    visibleTimeStart: moment().startOf('month').valueOf(),
    visibleTimeEnd: moment().endOf('month').valueOf(),
  })
  const [key, setKey] = useState(1)
  const wrapperRef = useRef()
  const size = useSize(wrapperRef)

  const [anchorEl, setAnchorEl] = useState(null)
  const [isEditPopover, setIsEditPopover] = useState(false)
  const [currentTask, setCurrentTask] = useState(null)

  const { run: getScheduleList } = useRequest(
    () => {
      return axios
        .get('/bi-sys/api/user/workPlan/queryByAttribute', {
          params: {
            startDate: moment(visibleTime.visibleTimeStart).format('YYYY-MM-DD'),
            endDate: moment(visibleTime.visibleTimeEnd).format('YYYY-MM-DD'),
          },
        })
        .then(({ data }) => {
          setItems(() => {
            return data.map((t) => {
              return {
                id: t.id,
                canResize: 'both',
                canMove: true,
                group: t.employeeNo,
                title: t.mattersName,
                start_time: moment(t.startDate).valueOf(),
                end_time: moment(t.endDate).valueOf(),
                updateBy: t.updateBy,
                createBy: t.createBy,
                employeeName: t.employeeName,
                bgColor: t.color,
                isComplete: true,
                editPopover: false,
              }
            })
          })
          setKey((prevState) => prevState + 1)
        })
    },
    { manual: true }
  )

  useEffect(() => {
    if (groups.length) {
      getScheduleList()
    }
  }, [visibleTime, getScheduleList, groups])

 const {run: getGroups} =  useRequest(() => {
    return axios.get('/bi-sys/api/user/biSysUser/findByWorkPlanGetUserInfo', {
      params: {
        deptLv1Name: deptList?.[0],
        deptLv2Name: deptList?.[1],
        deptLv3Name: deptList?.[2],
        deptLv4Name: deptList?.[3]
      }
    }).then(({ data }) => {
      setGroups(() => {
        return data.map((u) => {
          return {
            id: u.employeeNo,
            title: u.nameCn,
          }
        })
      })
    })
  }, {manual: true})
  useEffect(() => {
    getGroups()
  }, [deptList, getGroups])

  useEffect(() => {
    setTimeout(() => {
      setKey((prevState) => prevState + 1)
    }, 50)
  }, [size.width])

  // 时间切换
  const onChange = (date) => {
    setVisibleTime({
      visibleTimeStart: date.startOf('month').valueOf(),
      visibleTimeEnd: date.endOf('month').valueOf(),
    })
  }

  const handleCanvasClick = (groupId, time) => {
    if (newItem === null || groupId !== newItem.groupId || newItem.isComplete) {
      const newItem = {
        id: Math.random(),
        bgColor: colors[random(0, colors.length - 1)],
        canResize: false,
        canMove: false,
        group: groupId,
        title: '点击新建',
        start_time: moment(time).startOf('day').valueOf(),
        end_time: moment(time).endOf('day').valueOf(),
        isComplete: false,
        editPopover: true,
      }
      setNewItem(newItem)
    }
  }

  const handleItemMove = (itemId, dragTime, newGroupOrder) => {
    const newGroup = groups[newGroupOrder]
    const oldItem = items.find((item) => item.id === itemId)
    let start_time
    if (
      moment(dragTime).isBetween(
        moment(dragTime).startOf('day').subtract(6, 'hours'),
        moment(dragTime).startOf('day').add(6, 'hours'),
        '()'
      )
    ) {
      start_time = moment(dragTime).startOf('day').valueOf()
    }
    if (
      moment(dragTime).isBetween(
        moment(dragTime).endOf('day').subtract(6, 'hours'),
        moment(dragTime).endOf('day').add(6, 'hours'),
        '()'
      )
    ) {
      start_time = moment(dragTime).add(1, 'day').startOf('day').valueOf()
    }
    if (
      moment(dragTime).isBetween(
        moment(dragTime).startOf('day').add('6', 'hours'),
        moment(dragTime).startOf('day').add('18', 'hours'),
        '[]'
      )
    ) {
      start_time = moment(dragTime).startOf('day').add(12, 'hours').valueOf()
    }

    setItems((prevState) => {
      return prevState.map((item) =>
        item.id === itemId
          ? {
              ...item,
              start_time: start_time,
              end_time: start_time + (item.end_time - item.start_time),
              group: newGroup.id
            }
          : item
      )
    })
    axios
      .post('/bi-sys/api/admin/workPlan/saveOrUpdate', {
        id: oldItem.id,
        mattersName: oldItem.title,
        employeeNo: newGroup.id,
        startDate: moment(start_time).format('YYYY-MM-DD HH:mm:ss'),
        endDate: moment(start_time + oldItem.end_time - oldItem.start_time).format('YYYY-MM-DD HH:mm:ss'),
      })
      .then(() => {
        getScheduleList()
      })
  }

  const handleItemResize = (itemId, time, edge) => {
    const oldItem = items.find((item) => item.id === itemId)
    let start_time, end_time
    if (edge === 'left') {
      if (
        moment(time).isBetween(
          moment(time).startOf('day').subtract(6, 'hours'),
          moment(time).startOf('day').add(6, 'hours'),
          '()'
        )
      ) {
        start_time = moment(time).startOf('day').valueOf()
      }
      if (
        moment(time).isBetween(
          moment(time).endOf('day').subtract(6, 'hours'),
          moment(time).endOf('day').add(6, 'hours'),
          '()'
        )
      ) {
        start_time = moment(time).add(1, 'day').startOf('day').valueOf()
      }
      if (
        moment(time).isBetween(
          moment(time).startOf('day').add('6', 'hours'),
          moment(time).startOf('day').add('18', 'hours'),
          '[]'
        )
      ) {
        start_time = moment(time).startOf('day').add(12, 'hours').valueOf()
      }
    }
    if (edge === 'right') {
      if (
        moment(time).isBetween(
          moment(time).startOf('day').subtract(6, 'hours'),
          moment(time).startOf('day').add(6, 'hours'),
          '()'
        )
      ) {
        end_time = moment(time).subtract(1, 'day').endOf('day').valueOf()
      }

      if (
        moment(time).isBetween(
          moment(time).endOf('day').subtract(6, 'hours'),
          moment(time).endOf('day').add(6, 'hours'),
          '()'
        )
      ) {
        end_time = moment(time).endOf('day').valueOf()
      }

      if (
        moment(time).isBetween(
          moment(time).startOf('day').add('6', 'hours'),
          moment(time).startOf('day').add('18', 'hours'),
          '[]'
        )
      ) {
        end_time = moment(time).startOf('day').add(12, 'hours').valueOf()
      }
    }

    setItems((prevState) => {
      return prevState.map((item) =>
        item.id === itemId
          ? Object.assign({}, item, {
              start_time: edge === 'left' ? start_time : item.start_time,
              end_time: edge === 'left' ? item.end_time : end_time,
            })
          : item
      )
    })
    axios
      .post('/bi-sys/api/admin/workPlan/saveOrUpdate', {
        id: oldItem.id,
        mattersName: oldItem.title,
        employeeNo: oldItem.group,
        startDate: moment(edge === 'left' ? start_time : oldItem.start_time).format('YYYY-MM-DD HH:mm:ss'),
        endDate: moment(edge === 'left' ? oldItem.end_time : end_time).format('YYYY-MM-DD HH:mm:ss'),
      })
      .then(() => {
        getScheduleList()
      })
  }

  const itemRenderer = ({ item, itemContext, getItemProps, getResizeProps }) => {
    const backgroundColor = itemContext.selected
      ? colord(item.bgColor).darken(0.1).toHex()
      : item.bgColor || 'rgb(33, 150, 243)'
    const { left: leftResizeProps, right: rightResizeProps } = getResizeProps()
    return (
      <div {...getItemProps({ style: { border: '1px solid', borderColor: backgroundColor, borderRadius: 8, backgroundColor } })}>
        {itemContext.useResizeHandle ? (
          <div {...leftResizeProps} style={{ ...leftResizeProps.style, cursor: 'w-resize', left: -3 }} />
        ) : null}
        <ItemText
          isComplete={item.isComplete}
          style={{
            border: 0,
            height: itemContext.dimensions.height,
            overflow: 'hidden',
            paddingLeft: 3,
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
          {itemContext.title}
        </ItemText>
        {itemContext.useResizeHandle ? (
          <div {...rightResizeProps} style={{ ...rightResizeProps.style, cursor: 'w-resize', right: -3 }} />
        ) : null}
      </div>
    )
  }

  const handleItemSelect = (itemId, e) => {
    e.preventDefault()
    e.stopPropagation()
    const item = items.find((item) => item.id === itemId)
    if (item?.isComplete) {
      setNewItem(null)
      return
    }
    if (e.button === 2) {
      setNewItem(null)
      return
    }
    setAnchorEl(e.target)
    setIsEditPopover(true)
    setCurrentTask(newItem)
  }
  const handleItemClick = (itemId, e) => {
    const item = items.find((item) => item.id === itemId)
    if (e.button === 2 || !item?.isComplete) {
      return
    }
    setAnchorEl(e.target)

    setCurrentTask(item)
  }

  const handleItemDelete = () => {
    axios
      .post('/bi-sys/api/admin/workPlan/deleteById', null, {
        params: { id: currentTask?.id },
      })
      .then(() => {
        setCurrentTask(null)
        setAnchorEl(null)
        message.success('删除成功')
        getScheduleList()
      })
  }

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

  return (
    <div className={'p-6 overflow-x-hidden'} style={{maxHeight: 'calc(100vh - 140px)'}} ref={wrapperRef}>
      <div className={'flex mb-2.5'}>
        <div className={'flex flex-1 space-x-4'}>
          <Button className={'rounded'} onClick={() => onChange(moment())}>
            本月
          </Button>
          <div className={'space-x-1 text-xl text-gray-400'}>
            <Tooltip enterDelay={500} title={'上个月'}>
              <LeftCircleOutlined
                className={'cursor-pointer hover:text-gray-600 p-2 rounded-full hover:bg-gray-200'}
                onClick={() => onChange(moment(visibleTime.visibleTimeStart).subtract(1, 'months'))}
              />
            </Tooltip>
            <Tooltip enterDelay={500} title={'下个月'}>
              <RightCircleOutlined
                className={'cursor-pointer hover:text-gray-600 p-2 rounded-full hover:bg-gray-200'}
                onClick={() => onChange(moment(visibleTime.visibleTimeStart).add(1, 'months'))}
              />
            </Tooltip>
          </div>
          <span className={'text-2xl font-bold'}>{moment(visibleTime.visibleTimeStart).format('YYYY年M月')}</span>
        </div>
        <div>
          <Cascader className={'w-96'} options={deptOptions} placeholder={'选择部门'} onChange={(v) => {
            setDeptList(v)
          }} loadData={loadDept} changeOnSelect />
        </div>
      </div>
      <StyledTimeline
          fixedHeader="fixed"
        key={key}
        groups={groups}
        items={items.concat(newItem ? [newItem] : [])}
        sidebarWidth={70}
        itemTouchSendsClick={false}
        showCursorLine
        useResizeHandle
        stackItems
        visibleTimeStart={visibleTime.visibleTimeStart}
        visibleTimeEnd={visibleTime.visibleTimeEnd}
        onCanvasClick={handleCanvasClick}
        onItemMove={handleItemMove}
        onItemResize={handleItemResize}
        onItemClick={handleItemClick}
        onItemSelect={handleItemSelect}
        itemRenderer={itemRenderer}
      >
        <TodayMarker>
          {({ styles }) =>
              <div style={{...styles, background: 'var(--primary-color)'}} />
          }
        </TodayMarker>
      </StyledTimeline>

      <MPopover
        style={{ zIndex: 100 }}
        PaperProps={{
          style: {
            boxShadow: '0px 10px 24px 0px rgba(29, 42, 68, 0.12)',
          },
        }}
        elevation={0}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={() => {
          setAnchorEl(null)
          setNewItem(null)
          setIsEditPopover(false)
        }}>
        <div style={{height: 4, background: currentTask?.bgColor}} />
        <StyledInfoPopover className={'p-3 py-0.5'}>

          {!isEditPopover && (
            <>
              <div className={'flex justify-between'}>
                <div className={'font-bold'} style={{ lineHeight: '40px' }}>
                  {currentTask?.title}
                </div>
                <CloseOutlined
                  className={'text-gray-500 hover:text-black'}
                  onClick={() => {
                    setAnchorEl(null)
                  }}
                />
              </div>
              <div className={'space-y-1.5'}>
                <div>
                  <UserOutlined /> {currentTask?.employeeName}
                </div>
                <div>
                  <ClockCircleOutlined /> {moment(currentTask?.start_time).format('YYYY-MM-DD HH:mm')} ~{' '}
                  {moment(currentTask?.end_time).format('YYYY-MM-DD HH:mm')}
                </div>
                <div>
                  <EditOutlined /> {currentTask?.updateBy || currentTask?.createBy}
                </div>
              </div>

              <div className={'actions grid-cols-2 grid text-center mt-2.5'}>
                <div className={'cursor-pointer'} onClick={handleItemDelete}>
                  <DeleteOutlined /> 删除
                </div>
                <div className={'cursor-pointer'} onClick={() => setIsEditPopover(true)}>
                  <EditOutlined /> 编辑
                </div>
              </div>
            </>
          )}

          {isEditPopover && (
            <div className={'pb-2'}>
              <div className={'font-bold'} style={{ lineHeight: '40px' }}>
                {currentTask?.isComplete ? '编辑' : '新建任务'}
              </div>
              <EditMPopover
                item={currentTask}
                onCancel={() => {
                  setAnchorEl(null)
                  setTimeout(() => {
                    setNewItem(null)
                    setIsEditPopover(false)
                  }, 200)
                }}
                onSuccess={() => {
                  setAnchorEl(null)
                  setIsEditPopover(false)
                  setNewItem(null)
                  getScheduleList()
                }}
              />
            </div>
          )}
        </StyledInfoPopover>
      </MPopover>
    </div>
  )
}

export default TaskSchedule
