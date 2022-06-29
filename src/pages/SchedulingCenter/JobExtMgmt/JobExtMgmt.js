import React, { useEffect, useState } from 'react'
import { Button, Input, message, Popconfirm, Table } from 'antd'
import { EditOutlined } from '@ant-design/icons'

import useTable from '../../../hooks/useTable'

import ExSelect from '../../../components/Select'
import EditModal from './EditModal'
import { useRequest } from 'ahooks'
import axios from '../../../utils/axios'
import CollapseButtons from '../../../components/CollapseButtons'
import { useSelector } from 'react-redux'

function JobExtMgmt() {
  const permissionsMap = useSelector((state) => state.user.permissionsMap)
  const { table, setTable, components } = useTable({
    rowKey: 'id',
    resizeable: true,
    columns: [
      { dataIndex: 'id', title: 'ID', width: 80 },
      { dataIndex: 'groupName', title: '分组名称', width: 120 },
      { dataIndex: 'jobName', title: '作业名称', width: 150 },
      { dataIndex: 'directorName', title: '负责人', width: 80 },
      { dataIndex: 'srcSysName', title: '来源系统', width: 80 },
      { dataIndex: 'srcTblEn', title: '源表名', width: 100 },
      { dataIndex: 'tgtTblEn', title: '目标表名', width: 100 },
      { dataIndex: 'tgtTblUser', title: '目标表用户', width: 100 },
      { dataIndex: 'tgtTblCn', title: '目标表中文名', width: 100 },
      {
        dataIndex: 'upOrTot',
        title: '抽取方式',
        width: 80,
        render(text) {
          return text ? '全量' : '增量'
        },
      },
      {
        dataIndex: 'actions',
        fixed: 'right',
        width: 80,
        title: '操作',
        render(text, row) {
          return (
            <CollapseButtons>
              {permissionsMap['bi-task-scheduling-system.ExpandController.updateExpandInfo'] && (
                <Button size={'small'} type={'link'} onClick={handleEditRow.bind(null, row)}>
                  编辑
                </Button>
              )}
              {permissionsMap['bi-task-scheduling-system.ExpandController.cleanExpandInfo'] && (
                <Popconfirm title={'确定清空拓展信息吗？'} placement={'topLeft'} onConfirm={clearRow.bind(null, row)}>
                  <Button size={'small'} type={'link'} danger>
                    清空
                  </Button>
                </Popconfirm>
              )}
            </CollapseButtons>
          )
        },
      },
    ],
  })

  const [editRow, setEditRow] = useState(false)

  const handleAddNew = () => {
    setEditRow({})
  }

  const clearRow = (row) => {
    axios
      .get('/bi-task-scheduling-system/api/admin/job/cleanExpandInfo', {
        params: { id: row.id },
      })
      .then(() => {
        message.success('操作成功')
        getList()
      })
  }

  const handleEditRow = (row) => {
    setEditRow(row)
  }

  const [query, setQuery] = useState({})
  const { current: page, pageSize } = table.pagination
  const { run: getList, loading } = useRequest(
    () => {
      return axios
        .get('/bi-task-scheduling-system/api/user/job/queryJob', {
          params: {
            includeExpand: true,
            ...query,
            page,
            rows: pageSize,
          },
        })
        .then(({ data: { list, totalRows: total } }) => {
          setTable((prevState) => ({
            ...prevState,
            dataSource: list,
            pagination: { ...prevState.pagination, total },
          }))
        })
    },
    { manual: true, debounceInterval: 300 }
  )

  useEffect(() => {
    getList()
  }, [getList, page, pageSize, query])

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

  return (
    <div className={'p-6'}>
      <div className={'flex w-full mb-3'}>
        <div className={'flex-1 grid grid-cols-4 gap-x-6'}>
          <div className={'flex space-x-2.5'}>
            <span className={'flex-none'}>关键字</span>
            <Input
              value={query.keyWord}
              onChange={(e) => setQuery((prevState) => ({ ...prevState, keyWord: e.target.value }))}
              placeholder={'关键字'}
              allowClear
            />
          </div>
          <div className={'flex space-x-2.5'}>
            <span>分组</span>
            <ExSelect
              value={query.superior}
              onChange={(v) => setQuery((prevState) => ({ ...prevState, superior: v }))}
              options={groupList}
              placeholder={'分组'}
              allowClear
            />
          </div>
        </div>

        <div className={'ml-4 space-x-3'}>
          <Button onClick={getList}>刷新</Button>
          {permissionsMap['bi-task-scheduling-system.ExpandController.updateExpandInfo'] && (
            <Button type={'primary'} icon={<EditOutlined />} onClick={handleAddNew}>
              维护拓展信息
            </Button>
          )}
        </div>
      </div>

      <Table {...table} components={components} loading={loading} />
      <EditModal editRow={editRow} setEditRow={setEditRow} onSuccess={getList} />
    </div>
  )
}

export default JobExtMgmt
