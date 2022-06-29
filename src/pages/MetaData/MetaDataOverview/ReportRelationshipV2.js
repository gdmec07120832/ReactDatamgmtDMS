import React, { useEffect, useState } from 'react'
import { Button, Input, Select, Spin, Table, Tag } from 'antd'
import { Tooltip } from '@material-ui/core'
import useTable from '../../../hooks/useTable'
import { useRequest } from 'ahooks'
import axios from '../../../utils/axios'
import { downloadBlob } from '../../../utils/helpers'
import RelationshipModal from './RelationshipModal'
import ButtonRadioGroup from '../../../components/ButtonRadioGroup'

function ReportRelationshipV2() {
  const [type, setType] = useState(2)
  const [exportLoading, setExportLoading] = useState(false)
  const handleChangeType = (v) => {
    setType(v)
  }

  const [query, setQuery] = useState({
    active: undefined,
    keyword: '',
  })

  const {
    table: table1,
    setTable: setTable1,
    components,
  } = useTable({
    rowKey: 'id',
    scroll: {x: 1200},
    resizeable: true,
    columns: [
      { dataIndex: 'reportPathInBI', width: 250, title: '数据灯塔菜单路径' },
      {
        dataIndex: 'active',
        title: '状态',
        render: (text) => {
          return <Tag color={text ? 'success' : 'error'}>{text ? '启用' : '未启用'}</Tag>
        },
        width: 80,
      },
      { dataIndex: 'reportPathInYH', title: '永洪报告路径', width: 250 },
      { dataIndex: 'dataSetPathInYH', title: '永洪数据集路径', width: 250 },
      { dataIndex: 'tableNameInDB', title: '数据库中的表', width: 250 },
      { dataIndex: 'principal', title: '负责人', width: 100 },
    ],
  })

  const { table: table2, setTable: setTable2 } = useTable({
    rowKey: 'reportPathInBI',
    columns: [
      { dataIndex: 'firstLevelCnName', title: '一级菜单' },
      { dataIndex: 'secondLevelCnName', title: '二级菜单' },
      { dataIndex: 'thirdLevelCnName', title: '三级菜单' },
      { dataIndex: 'fourthLevelCnName', title: '四级菜单' },
      { dataIndex: 'fifthLevelCnName', title: '五级菜单' },
      { dataIndex: 'reportCnName', title: '报表名称' },
      { dataIndex: 'versionMainNum', title: '主编码' },
      {
        dataIndex: 'action',
        title: '操作',
        width: 150,
        render: (text, row) => {
          return (
            <Button type={'link'} size={'small'} onClick={checkRelationship.bind(null, row)}>
              查看血缘
            </Button>
          )
        },
      },
    ],
  })

  const [currentRow, setCurrentRow] = useState(null)
  const checkRelationship = (row) => {
    setCurrentRow(row)
  }

  const { current: page, pageSize } = table1.pagination
  const { active, keyword } = query
  const { run: getList1, loading: loading1 } = useRequest(
    () => {
      return axios
        .get('/bi-auto-deploy/api/admin/reportRelationship/list', {
          params: {
            page,
            pageSize,
            active,
            name: keyword,
          },
        })
        .then(({ data: { list, totalRows: total } }) => {
          setTable1((prevState) => ({
            ...prevState,
            dataSource: list,
            pagination: { ...prevState.pagination, total },
          }))
        })
    },
    { manual: true, debounceInterval: 200 }
  )

  const { current: page2, pageSize: pageSize2 } = table2.pagination
  const { run: getList2, loading: loading2 } = useRequest(
    () => {
      return axios
        .get('/bi-auto-deploy/api/user/reportRelationship/distinctListForReport', {
          params: {
            page: page2,
            pageSize: pageSize2,
            active,
            name: keyword,
          },
        })
        .then(({ data: { list, totalRows: total } }) => {
          setTable2((prevState) => ({
            ...prevState,
            dataSource: list,
            pagination: { ...prevState.pagination, total },
          }))
        })
    },
    {
      manual: true,
      debounceInterval: 200,
    }
  )

  const exportFile = () => {
    setExportLoading(true)
    let url
    if (type === 1) {
      url = '/bi-auto-deploy/api/user/reportRelationship/downloadList'
    } else {
      url = '/bi-auto-deploy/api/user/reportRelationship/downloadListForReport'
    }
    axios
      .get(url, {
        params: { active, page, pageSize, name: keyword },
        responseType: 'blob',
      })
      .then(({ data, headers }) => {
        const filename = headers['content-disposition'].match(/filename=(.*)/)[1]
        downloadBlob(data, decodeURIComponent(filename))
      })
      .finally(() => {
        setExportLoading(false)
      })
  }

  useEffect(() => {
    getList1()
  }, [active, keyword, getList1, page, pageSize])

  useEffect(() => {
    getList2()
  }, [active, keyword, getList2, page2, pageSize2])

  return (
    <div className={'p-6'}>
      <Spin spinning={exportLoading} delay={200}>
        <div className={'flex justify-start mb-4'}>
          <div className={'flex-1 grid grid-cols-4 gap-x-6'}>
            <div className={'flex'}>
              <div className={'flex-none'}>关键字：</div>
              <Input
                value={query.keyword}
                className={'flex-1'}
                allowClear
                placeholder={'关键字'}
                onChange={(e) => setQuery((prevState) => ({ ...prevState, keyword: e.target.value }))}
              />
            </div>
            <div className={'flex'}>
              <div className={'flex-none'}>状态：</div>
              <Select
                className={'flex-1'}
                allowClear
                placeholder={'状态'}
                value={query.active}
                onChange={(v) => setQuery((prevState) => ({ ...prevState, active: v }))}>
                <Select.Option value={true}>启用</Select.Option>
                <Select.Option value={false}>未启用</Select.Option>
              </Select>
            </div>
          </div>
          <div className={'ml-4 flex-none flex justify-start'}>
            <ButtonRadioGroup value={type} onChange={handleChangeType}>
              <ButtonRadioGroup.Radio value={2}>报表血缘</ButtonRadioGroup.Radio>
              <ButtonRadioGroup.Radio value={1}>作业血缘</ButtonRadioGroup.Radio>
            </ButtonRadioGroup>
            <Tooltip title={'根据当前筛选条件下载数据'}>
              <Button type={'primary'} className={'ml-2'} onClick={exportFile}>
                条件下载
              </Button>
            </Tooltip>
          </div>
        </div>
        {type === 1 && <Table {...table1} components={components} loading={loading1} />}
        {type === 2 && <Table {...table2} loading={loading2} />}
      </Spin>

      <RelationshipModal currentRow={currentRow} setCurrentRow={setCurrentRow} />
    </div>
  )
}

export default ReportRelationshipV2
