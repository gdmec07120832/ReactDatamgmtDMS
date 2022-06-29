import { useState } from 'react'
import OverflowTooltip from '../components/OverflowTooltip'
import { Resizable } from 'react-resizable'

const ResizableTitle = (props) => {
  const { onResize, width, ...restProps } = props

  if (!width) {
    return <th {...restProps} />
  }

  return (
    <Resizable
      width={width}
      height={0}
      handle={
        <span
          className="react-resizable-handle"
          onClick={(e) => {
            e.stopPropagation()
          }}
        />
      }
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}>
      <th
        {...restProps}
        style={{
          userSelect: 'none',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          ...restProps.style,
        }}
      />
    </Resizable>
  )
}

export default function useTable(initialTable) {
  const tableChange = ({ current, pageSize }) => {
    setTable((prevState) => ({ ...prevState, pagination: { ...prevState.pagination, current, pageSize } }))
  }
  const { resizeable } = initialTable

  initialTable.columns = (initialTable.columns || []).map((col) => {
    if (col.render) {
      return col
    } else {
      return {
        ...col,
        render: (text) => {
          return <OverflowTooltip>{text ? text.toString() : text}</OverflowTooltip>
        },
      }
    }
  })

  const handleResize = (index) => {
    return function (e, data) {
      const size = data.size
      setTable((prevState) => ({
        ...prevState,
        columns: [
          ...prevState.columns.slice(0, index),
          {
            ...prevState.columns[index],
            width: Math.min(Math.max(size.width, 50), 600),
          },
          ...prevState.columns.slice(index + 1),
        ],
      }))
    }
  }

  if (resizeable) {
    initialTable.columns = (initialTable.columns || []).map((col, index) => {
      return {
        ...col,
        onHeaderCell: (column) => ({
          width: column.width,
          onResize: handleResize(index),
        }),
      }
    })
  }
  const { pagination, ...rest } = initialTable
  const [table, setTable] = useState({
    size: 'small',
    loading: false,
    tableLayout: 'fixed',
    pagination:
      pagination === false
        ? false
        : {
            total: 0,
            pageSize: 10,
            current: 1,
            showSizeChanger: true,
            pageSizeOptions: [10, 20],
            size: 'default',
            showTotal: (total) => `共${total}条记录`,
            ...pagination,
          },
    dataSource: [],
    columns: [],
    onChange: tableChange,
    ...rest,
  })

  return {
    table,
    setTable,
    components: {
      header: {
        cell: ResizableTitle,
      },
    },
  }
}
