import React, { useEffect, useRef, useState } from 'react'
import { connect } from 'react-redux'
import { Button, Input, message, Popconfirm, Space, Table } from 'antd'
import useTable from '../../../hooks/useTable'
import axios from '../../../utils/axios'
import { useRequest } from 'ahooks'
import OverflowTooltip from '../../../components/OverflowTooltip'
import EditModal from './EditModal'
import useConstant from '../../../hooks/useConstant'

function DataMessageCfg(props) {
  const { permissionsMap } = props
  const ddChartGroupRef = useRef([])
  ddChartGroupRef.current = useConstant('DD_CHART_SESSION_TYPE')
  const { table, setTable } = useTable({
    rowKey: 'id',
    columns: [
      { dataIndex: 'id', title: 'ID', width: 100 },
      { dataIndex: 'title', title: '标题' },
      { dataIndex: 'description', title: '描述' },
      {
        dataIndex: 'dynamicCover',
        title: '启用动态封面',
        width: 100,
        render: (text) => {
          return text ? '是' : '否'
        },
      },
      { dataIndex: 'pageUrl', title: '页面路径' },
      {
        dataIndex: 'prefix',
        title: '前缀',
        render: (text, row) => {
          /**@property {any} coverConfig */
          return <OverflowTooltip>{row?.coverConfig?.prefix}</OverflowTooltip>
        },
      },
      {
        dataIndex: 'interfaceName',
        title: '接口名称',
        render: (text, row) => {
          /**@property {any} interfaceName */
          return <OverflowTooltip>{row?.coverConfig?.interfaceName}</OverflowTooltip>
        },
      },
      {
        dataIndex: 'targetChartGroupId',
        title: '目标群',
        render(text) {
          const groupKeys = (text || '').split(',').filter(Boolean)
          const t = groupKeys.map((key) => ddChartGroupRef.current.find((item) => item.value === key)?.label).join('，')
          return <OverflowTooltip>{t}</OverflowTooltip>
        },
      },
      {
        dataIndex: 'action',
        title: '操作',
        width: 210,
        fixed: 'right',
        render: (text, row) => {
          return (
            <Space>
              {permissionsMap['bi-mobile.DataMessageConfigController.saveOrUpdate'] && (
                <Button type={'link'} size={'small'} onClick={editRow.bind(null, row)}>
                  编辑
                </Button>
              )}
              {permissionsMap['bi-mobile.DataMessageConfigController.send'] && (
                <Popconfirm title={'确定推送吗？'} onConfirm={pushRow.bind(null, row)}>
                  <Button type={'link'} size={'small'}>
                    推送
                  </Button>
                </Popconfirm>
              )}
              {row.status === 'Frozen' && permissionsMap['bi-mobile.DataMessageConfigController.start'] && (
                <Popconfirm title={'确定启用吗？'} onConfirm={toggleRow.bind(null, row, 1)}>
                  <Button type={'link'} size={'small'}>
                    启用
                  </Button>
                </Popconfirm>
              )}

              {row.status === 'Normal' && permissionsMap['bi-mobile.DataMessageConfigController.stop'] && (
                <Popconfirm title={'确定禁用吗？'} onConfirm={toggleRow.bind(null, row, 0)}>
                  <Button type={'link'} size={'small'}>
                    禁用
                  </Button>
                </Popconfirm>
              )}
              {permissionsMap['bi-mobile.DataMessageConfigController.delete'] && (
                <Popconfirm title={'确定删除吗？'} onConfirm={deleteRow.bind(null, row)} placement={'topLeft'}>
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

  const { run: _deleteRow, loading: loading2 } = useRequest(
    (id) => {
      return axios.get('/bi-mobile/api/admin/dataMessageConfig/delete', {
        params: { id },
      })
    },
    {
      manual: true,
    }
  )

  const toggleRow = (row, state) => {
    let url
    if (state === 1) {
      // 启用
      url = '/bi-mobile/api/admin/dataMessageConfig/start'
    } else {
      url = '/bi-mobile/api/admin/dataMessageConfig/stop'
    }
    axios.get(url, { params: { id: row.id } }).then(() => {
      message.success('操作成功')
      getData()
    })
  }

  const deleteRow = (row) => {
    _deleteRow(row.id).then(() => {
      message.success('删除成功')
      getData()
    })
  }

  const addRow = () => {
    setCurrentRow({})
  }

  const pushRow = (row) => {
    axios
      .get('/bi-mobile/api/admin/dataMessageConfig/send', {
        params: { id: row.id },
      })
      .then(() => {
        message.success('推送成功')
      })
  }

  const editRow = (row) => {
    setCurrentRow({
      ...row,
      coverConfigId: row.coverConfig.id,
      interfaceType: row.coverConfig.interfaceType,
    })
  }

  const [keyword, setKeyword] = useState('')
  const { current: page, pageSize } = table.pagination
  const { run: getData, loading } = useRequest(
    () => {
      return axios
        .get('/bi-mobile/api/admin/dataMessageConfig/list', {
          params: {
            page,
            pageSize,
            keyword,
          },
        })
        .then(({ data: { list, totalRows: total } }) => {
          setTable((prevState) => {
            return {
              ...prevState,
              dataSource: list,
              pagination: { ...prevState.pagination, total },
            }
          })
        })
    },
    { manual: true, debounceInterval: 200 }
  )
  useEffect(() => {
    getData()
  }, [page, pageSize, keyword, getData])

  const [currentRow, setCurrentRow] = useState(null)

  return (
    <div className={'p-6'}>
      <div className="flex mb-2">
        <div className={'flex-1'}>
          <Input
            onChange={(e) => setKeyword(e.target.value)}
            className={'w-60'}
            placeholder={'输入关键字'}
            allowClear
          />
        </div>
        <div>
          {permissionsMap['bi-mobile.DataMessageConfigController.saveOrUpdate'] && (
            <Button type={'primary'} onClick={addRow}>
              新增
            </Button>
          )}
        </div>
      </div>

      <Table {...table} loading={loading || loading2} />

      <EditModal currentRow={currentRow} setCurrentRow={setCurrentRow} refresh={getData} />
    </div>
  )
}

export default connect((state) => {
  return {
    permissionsMap: state.user?.userInfo?.permissionsMap,
  }
})(DataMessageCfg)
