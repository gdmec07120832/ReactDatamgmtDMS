import React from 'react'
import styled from 'styled-components'
import { Empty, Spin } from 'antd'

const TableWrapper = styled.div`
  border: 1px solid #e9e9e9;
  min-height: ${(props) => (props.dataSource.length ? 'none' : '275px')};
  table {
    width: 100%;
    table-layout: fixed;
    thead th {
      font-size: 13px;
      background: rgba(247, 248, 249, 0.39);
      color: rgba(0, 0, 0, 0.65);
      line-height: 36px;
    }

    tbody {
      tr:not(:last-child) {
        border-bottom: 1px solid #e9e9e9;
      }

      tr {
        &:hover {
          background: #f0f7ff;
        }
        td {
          text-align: center;
          line-height: 24px;
          color: #000;
        }
      }
    }
  }
`

function SimpleTable(props) {
  const { columns = [], dataSource = [], rowKey, loading = false, ...restProps } = props
  return (
    <Spin spinning={loading}>
      <TableWrapper {...restProps} dataSource={dataSource}>
        <table>
          <thead>
            <tr>
              {columns.map((item) => {
                return <th key={item.title}>{item.title}</th>
              })}
            </tr>
          </thead>
          <tbody>
            {dataSource.map((row, index) => {
              return (
                <tr key={row[rowKey]}>
                  {columns.map((col) => {
                    return <td key={col.dataIndex}>{col.render ? col.render(row, index) : row[col.dataIndex]}</td>
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
        {!dataSource.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} className={'py-10'} />}
      </TableWrapper>
    </Spin>
  )
}

export default SimpleTable
