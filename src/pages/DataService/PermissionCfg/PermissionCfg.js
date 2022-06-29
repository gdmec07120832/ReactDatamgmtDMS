import React, { useEffect, useState } from 'react'
import { Input, Table } from 'antd'
import useTable from '../../../hooks/useTable'
import { useRequest } from 'ahooks'
import axios from '../../../utils/axios'

function PermissionCfg(props) {
  const { cloud, type } = props
  const { table, setTable } = useTable({
    rowKey: 'id',
    columns: [
      { dataIndex: 'id', title: 'ID', width: 120 },
      { dataIndex: 'name', title: '名称' },
      { dataIndex: 'expression', title: '表达式' },
    ],
  })

  const [keyword, setKeyword] = useState(null)
  const { current: page, pageSize } = table.pagination
  const { run: getData, loading } = useRequest(
    () => {
      return axios
        .get(cloud ? '/bi-mobile-aliyun/api/admin/permission/list' : '/bi-mobile/api/admin/permission/list', {
          params: cloud
            ? {
                page,
                pageSize,
                keyword,
                appCode: type,
              }
            : {
                page,
                pageSize,
                keyword,
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
    { manual: true, debounceInterval: 200 }
  )

  useEffect(() => {
    getData()
  }, [page, pageSize, keyword, getData])

  return (
    <div className={'p-6'}>
      <div className={'flex justify-start mb-2'}>
        <Input
          onChange={(e) => setKeyword(e.target.value)}
          allowClear
          className={'w-60'}
          placeholder={'输入关键字查找'}
        />
      </div>

      <Table {...table} loading={loading} />
    </div>
  )
}

export default PermissionCfg
