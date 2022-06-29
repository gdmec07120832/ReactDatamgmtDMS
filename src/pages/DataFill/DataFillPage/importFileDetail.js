import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { Button, Col, Input, Pagination, Row, Select } from 'antd'
import { useParams } from 'react-router-dom'
import axios from '../../../utils/axios'
import { BaseTable, useTablePipeline, features } from 'ali-react-table'
import OverflowTooltip from '../../../components/OverflowTooltip'
import styled from 'styled-components'

const MyBaseTable = styled(BaseTable)`
  & {
    --row-height: 36px;
  }

  & .resize-handle {
    width: 4px;
    right: -2px;
  }

  &,
  .art-horizontal-scroll-container {
    ::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }

    ::-webkit-scrollbar-thumb {
      background: #ccc;
      border: 1px solid #eaeaea;

      &:hover {
        background: #6e6e6e;
      }
    }

    ::-webkit-scrollbar-track {
      background: #eaeaea;
    }
  }
`

function ImportFileDetail(props) {
  const { recordId, fileId } = useParams()
  const [loading, setLoading] = useState(false)
  const { setBreadcrumbParams, fileId: _fileId, forTempTable } = props
  const [query, setQuery] = useState({
    searchColumnName: undefined,
    searchKeyword: '',
  })

  const [_query, _setQuery] = useState({ ...query })

  const [table, setTable] = useState({
    rowKey: 'ID',
    size: 'small',
    bordered: true,
    pagination: {
      total: 0,
      pageSize: 10,
      current: 1,
      size: 'default',
      showTotal: (total) => `共${total}条记录`,
    },
    tableLayout: 'fixed',
    scroll: { x: forTempTable ? 1200 : 1600, y: forTempTable ? 420 : 'auto' },
    dataSource: [],
    columns: [],
  })
  const pipeline = useTablePipeline()
    .input({ dataSource: table.dataSource, columns: table.columns })
    .use(
      features.columnResize({
        fallbackSize: 120,
        handleBackground: '#ddd',
        handleHoverBackground: '#aaa',
        handleActiveBackground: '#89bff7',
      })
    )

  const [columnList, setColumnList] = useState([])
  useEffect(() => {
    if (forTempTable) {
      setQuery(() => ({
        searchKeyword: '',
        searchColumnName: undefined,
      }))
      setTable((prevState) => ({
        ...prevState,
        pagination: { ...prevState.pagination, current: 1 },
      }))
    }
  }, [_fileId, forTempTable])
  useEffect(() => {
    if (forTempTable) {
      return
    }
    axios
      .get('/bi-data-reporting/api/user/excel/excelImportRecord/findByIdGetFileNameAndTemplateName', {
        params: {
          id: fileId,
        },
      })
      .then(({ data: { EXCELNAME, FILENAME } }) => {
        setBreadcrumbParams([
          { title: EXCELNAME, id: recordId },
          { title: FILENAME, id: fileId },
        ])
      })
  }, [fileId, recordId, setBreadcrumbParams, forTempTable])

  const { current, pageSize } = table.pagination
  const { searchKeyword, searchColumnName } = _query
  useEffect(() => {
    setLoading(true)
    const url = forTempTable
      ? '/bi-data-reporting/api/user/excel/excelImportRecord/viewTemporaryData'
      : '/bi-data-reporting/api/user/excel/excelImportRecord/viewData'
    axios
      .get(url, {
        params: {
          id: forTempTable ? _fileId : fileId,
          page: current,
          pageSize,
          searchKeyword,
          searchColumnName,
        },
      })
      .then(({ data: { columnList, dataList, total } }) => {
        setColumnList(columnList)
        setTable((prevState) => ({
          ...prevState,
          columns: columnList.map((col) => {
            return {
              name: col.name,
              code: col.field,
              align: 'center',
              render: (text) => {
                return <OverflowTooltip>{text}</OverflowTooltip>
              },
            }
          }),
          pagination: { ...prevState.pagination, total },
          dataSource: dataList || [],
        }))
      })
      .catch(() => {
        setTable((prevState) => ({
          ...prevState,
          columns: [{ name: '表格列为空', align: 'center' }],
        }))
      })
      .finally(() => {
        setLoading(false)
      })
    // eslint-disable-next-line
  }, [fileId, current, pageSize, setTable, _fileId, forTempTable, _query])

  const handleSearch = () => {
    setTable((prevState) => {
      return {
        ...prevState,
        pagination: { ...prevState.pagination, current: 1 },
      }
    })
    _setQuery((prevState) => ({
      ...prevState,
      ...query,
    }))
  }
  const handleTableChange = (current, pageSize) => {
    setTable((prevState) => ({
      ...prevState,
      pagination: { ...prevState.pagination, pageSize, current },
    }))
  }

  return (
    <div className={forTempTable ? '' : 'p-6'}>
      <div className={'mb10 flex flex-start'}>
        <Row gutter={24} style={{ flex: 1 }}>
          <Col span={6}>
            <div className={'flex'}>
              <span style={{ flex: '0 0 40px' }}>列名</span>
              <Select
                value={query.searchColumnName}
                onChange={(v) => setQuery((prevState) => ({ ...prevState, searchColumnName: v }))}
                placeholder={'列名'}
                style={{ flex: 1 }}
                allowClear>
                {columnList.map((col) => (
                  <Select.Option value={col.field} key={col.field}>
                    {col.name}
                  </Select.Option>
                ))}
              </Select>
            </div>
          </Col>
          <Col span={6}>
            <div className={'flex'}>
              <span style={{ flex: '0 0 50px' }}>关键字</span>
              <Input
                value={query.searchKeyword}
                onChange={(e) =>
                  setQuery((prevState) => ({
                    ...prevState,
                    searchKeyword: e.target.value,
                  }))
                }
                placeholder={'关键字'}
                allowClear
              />
            </div>
          </Col>
        </Row>

        <div className={'ml20'}>
          <Button type={'primary'} onClick={handleSearch}>
            查询
          </Button>
        </div>
      </div>
      <MyBaseTable
        {...pipeline.getProps()}
        useVirtual={true}
        useOuterBorder
        isLoading={loading}
        style={{ height: 396, overflow: 'auto' }}
      />
      {!!table.dataSource.length && (
        <div className={'text-right mt-2'}>
          <Pagination {...table.pagination} onChange={handleTableChange} />
        </div>
      )}
    </div>
  )
}

export { ImportFileDetail }

export default connect(null, (dispatch) => {
  return {
    setBreadcrumbParams: (payload) => {
      dispatch({ type: 'set_breadcrumb_params', payload })
    },
  }
})(ImportFileDetail)
