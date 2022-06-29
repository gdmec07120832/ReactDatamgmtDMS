import React, { useEffect, useState } from 'react'
import { Table } from 'antd'
import OverflowTooltip from '../OverflowTooltip'

function ExTable(props) {
  const { setTable, columns, onChange, size, pagination, rowKey, dataSource = [], ...restProps } = props

  const [_columns, _setColumns] = useState(
    columns.map((col) => {
      return {
        render(text) {
          return <OverflowTooltip>{text}</OverflowTooltip>
        },
        ...col,
      }
    })
  )

  const [_pagination, _setPagination] = useState(pagination === false ? false : {
    total: 0,
    pageSize: 10,
    current: 1,
    showSizeChanger: true,
    pageSizeOptions: [10, 20],
    size: 'default',
    showTotal: (total) => `共${total}条记录`,
    ...pagination,
  })

  useEffect(() => {
    _setPagination((prevState) => (prevState === false ? false : {
      ...prevState,
      ...pagination,
    }))
  }, [pagination])

  useEffect(() => {
    _setColumns(
      columns.map((col) => {
        return {
          render(text) {
            return <OverflowTooltip>{text}</OverflowTooltip>
          },
          ...col,
        }
      })
    )
  }, [columns])

  const handleChange = ({ current, pageSize }) => {
    _setPagination((prevState) => (prevState === false ? false : { ...prevState, current, pageSize }))
    setTable((prevState) => ({
      ...prevState,
      pagination: prevState.pagination === false ? false : { ...prevState.pagination, current, pageSize },
    }))
  }

  return (
    <Table
      {...restProps}
      tableLayout={'fixed'}
      dataSource={dataSource}
      rowKey={rowKey || 'id'}
      size={size || 'small'}
      columns={_columns}
      pagination={_pagination}
      onChange={onChange || handleChange}
    />
  )
}

export default ExTable
