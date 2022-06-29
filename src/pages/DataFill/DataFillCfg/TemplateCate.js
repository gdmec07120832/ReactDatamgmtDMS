import React, {useCallback, useEffect, useRef, useState} from 'react'
import { connect } from 'react-redux'
import { useRequest } from 'ahooks'
import { Button, Form, Input, message, Popconfirm, Space, Table } from 'antd'
import useTable from '../../../hooks/useTable'
import DraggableModal from '../../../components/DraggableModal'
import axios from '../../../utils/axios'
import ExSelect from '../../../components/Select'
import { fetchDataFields, fetchLevelInfo } from '../helpers'

function TemplateCate(props) {
  const { table, setTable } = useTable({
    rowKey: 'id',
    dataSource: [],
    columns: [
      { title: '数据域', dataIndex: 'dataFieldName' },
      { title: '第一层分类', dataIndex: 'oneTierName' },
      { title: '第二层分类', dataIndex: 'name' },
      { title: '创建时间', dataIndex: 'createTime' },
      { title: '更新时间', dataIndex: 'updateTime' },
      {
        title: '操作',
        dataIndex: 'action',
        align: 'center',
        width: 120,
        render: (_, row) => {
          return (
            <Space>
              {props.permissionsMap['bi-data-reporting.ExcelCategoryController.saveOrUpdate'] && (
                <Button type={'link'} size={'small'} onClick={() => editRow(row)}>
                  编辑
                </Button>
              )}
              {props.permissionsMap['bi-data-reporting.ExcelCategoryController.remove'] && (
                <Popconfirm title={'确定删除吗？'} placement={'topLeft'} onConfirm={() => deleteRow(row)}>
                  <Button type={'link'} size={'small'} danger>
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

  const [dataFields, setDataFields] = useState([])
  const [level1List, setLevel1List] = useState([])
  const [level2List, setLevel2List] = useState([])
  useEffect(() => {
    const _fetch = async () => {
      const data = await fetchDataFields()
      setDataFields(data.map((item) => ({ label: item.nodeName, value: String(item.id) })))
    }
    _fetch()
  }, [])

  useEffect(() => {
    const _fetch = async () => {
      const data1 = await fetchLevelInfo(1)
      setLevel1List(
        data1.map((item) => ({
          label: item.name,
          value: item.id,
        }))
      )

      const data2 = await fetchLevelInfo(2)
      setLevel2List(
        data2.map((item) => ({
          ...item,
          label: item.name,
          value: item.id,
        }))
      )
    }
    _fetch()
  }, [])

  const [visible, setVisible] = useState(false)
  const createNew = () => {
    setVisible(true)
    setTimeout(() => {
      form.current.resetFields()
    }, 20)
  }

  const form = useRef(null)
  const saveOrUpdateForm = () => {
    form.current.validateFields().then((values) => {
      axios
        .post('/bi-data-reporting/api/admin/excel/excelCategory/saveOrUpdate', null, {
          params: {
            ...values,
          },
        })
        .then(() => {
          form.current.resetFields()
          message.success('编辑成功')
          setVisible(false)
          run()
        })
    })
  }
  const [query, _setQuery] = useState({
    dataFieldId: undefined,
    oneTier: undefined,
    twoTier: undefined,
  })

  const setQuery = useCallback((args) => {
    setTable(prevState => ({
      ...prevState,
      pagination: {...prevState.pagination, current: 1}
    }))
    _setQuery(args)
  }, [_setQuery, setTable])

  const { pageSize, current } = table.pagination
  const { run, loading } = useRequest(
    () => {
      return axios
        .get('bi-data-reporting/api/admin/excel/excelCategory/list', {
          params: {
            page: current,
            pageSize,
            ...query,
          },
        })
        .then(({ data: { list, totalRows } }) => {
          setTable((prevState) => ({
            ...prevState,
            dataSource: list,
            pagination: { ...prevState.pagination, total: totalRows },
          }))
        })
    },
    {
      debounceInterval: 200,
      manual: true,
    }
  )

  const deleteRow = (row) => {
    axios
      .get('/bi-data-reporting/api/admin/excel/excelCategory/remove', {
        params: { ids: row.id },
      })
      .then(() => {
        message.success('删除成功')
        run()
      })
  }

  const editRow = (row) => {
    setVisible(true)
    setTimeout(() => {
      form.current.setFieldsValue({
        name: row.name,
        ...row,
        id: row.id,
        orderValue: row.orderValue,
      })
    }, 20)
  }

  useEffect(() => {
    run()
  }, [pageSize, current, run, setTable, query])

  return (
    <div className={'px-6 py-6'}>
      <div className={'flex justify-start mb-2.5'}>
        <div className={'flex-1 grid grid-cols-4 gap-x-6'}>
          <div className={'flex'}>
            <span className={'flex-none mr-2.5'}>数据域</span>
            <ExSelect
              value={query.dataFieldId}
              onChange={(v) => setQuery((prevState) => ({ ...prevState, dataFieldId: v }))}
              className={'flex-1'}
              options={dataFields}
              placeholder={'数据域'}
              allowClear
            />
          </div>
          <div className={'flex'}>
            <span className={'flex-none mr-2.5'}>第一层分类</span>
            <ExSelect
              value={query.oneTier}
              onChange={(v) => {
                setQuery((prevState) => ({ ...prevState, oneTier: v }))
              }}
              className={'flex-1'}
              options={level1List}
              placeholder={'第一层分类'}
              allowClear
            />
          </div>
          <div className={'flex'}>
            <span className={'flex-none mr-2.5'}>第二层分类</span>
            <ExSelect
              value={query.twoTier}
              onChange={(v) => setQuery((prevState) => ({ ...prevState, twoTier: v }))}
              className={'flex-1'}
              options={Array.from(new Set(level2List.map((item) => item.name))).map((item) => ({
                label: item,
                value: item,
              }))}
              placeholder={'第二层分类'}
              allowClear
            />
          </div>
        </div>
        {props.permissionsMap['bi-data-reporting.ExcelCategoryController.saveOrUpdate'] && (
          <Button type={'primary'} onClick={createNew}>
            新增
          </Button>
        )}
      </div>
      <Table {...table} loading={loading} />

      <DraggableModal visible={visible} title={'新建/编辑'} onOk={saveOrUpdateForm} onCancel={() => setVisible(false)}>
        <Form ref={form} labelCol={{ span: 5 }}>
          <Form.Item label={'ID'} name={'id'} hidden>
            <Input />
          </Form.Item>
          <Form.Item label={'数据域'} name={'dataFieldId'} rules={[{ required: true }]}>
            <ExSelect options={dataFields} placeholder={'数据域'} />
          </Form.Item>
          <Form.Item label={'第一层分类'} name={'parentId'} rules={[{ required: true }]}>
            <ExSelect options={level1List} placeholder={'第一层分类'} />
          </Form.Item>
          <Form.Item label={'第二层分类'} name={'name'} rules={[{ required: true }]}>
            <Input maxLength={30} placeholder={'第二层分类'} />
          </Form.Item>
        </Form>
      </DraggableModal>
    </div>
  )
}

export default connect((state) => {
  return {
    permissionsMap: state.user?.userInfo?.permissionsMap,
  }
})(TemplateCate)
