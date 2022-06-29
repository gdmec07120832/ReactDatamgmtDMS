import React, { useEffect, useRef, useState } from 'react'
import {Button, Input, Popconfirm, Progress, Tag} from 'antd'
import ExTable from '../../../components/ExTable/ExTable'
import { useRequest } from 'ahooks-v3'
import axios from '../../../utils/axios'
import moment from 'moment'
import { pick } from 'lodash'
import { InfoCircleOutlined } from '@ant-design/icons'
import { Tooltip } from '@material-ui/core'
import { useDispatch } from 'react-redux'

function DownloadList() {
  const [table, setTable] = useState({
    scroll: { x: 1200 },
    pagination: { pageSize: 10, current: 1, total: 0 },
    columns: [
      { dataIndex: 'id', title: '任务ID', width: 100 },
      { dataIndex: 'fileName', title: '任务名称' },
      {
        dataIndex: 'progressBar',
        title: '服务器生成进度',
        render(text) {
          return (
            <div className={'pr-6'}>
              <Progress percent={(text * 100).toFixed(2)} />
            </div>
          )
        },
      },
      {
        dataIndex: 'status',
        title: '文件生成状态',
        width: 120,
        render(text, record) {
          const name = {
            Generate_success: '生成成功',
            Generate_failure: '生成失败',
            Invalid_File: '文件已失效',
            In_the_generated: '生成中',
            Waiting_Generate: '等待生成',
            Cancel: '已取消'
          }[text]
          const color = {
            Generate_success: 'success',
            Generate_failure: 'error',
            Invalid_File: 'error',
            In_the_generated: 'processing',
            Waiting_Generate: '',
            Cancel: ''
          }[text]

          return (
            <>
              <Tag color={color}>{name}</Tag>
              {(text === 'Generate_failure' || !!record.errorMsg) && (
                <Tooltip title={record.errorMsg || '未知原因，请联系系统管理员'}>
                  <InfoCircleOutlined />
                </Tooltip>
              )}
            </>
          )
        },
      },
      { dataIndex: 'createDate', title: '创建时间', width: 160 },
      { dataIndex: 'invalidDate', title: '预计失效时间', width: 160 },
      { dataIndex: 'creatorName', title: '下载人员', width: 100 },
      {
        dataIndex: 'actions',
        title: '操作',
        width: 150,
        fixed: 'right',
        render(text, record) {
          const isInvalid = moment().valueOf() >= moment(record.invalidDate)
          const { status } = record
          return (
            <div className={'space-x-2.5'}>
              {isInvalid ? (
                <span className={'text-gray-400'}>已失效</span>
              ) : (
                <>
                  {status === 'Generate_success' && (
                    <Button loading={record.__loading__} type={'link'} size={'small'} onClick={() => downloadFile(record)}>
                      下载到本地
                    </Button>
                  )}
                  {
                    status === 'Cancel' && <Button type={'link'} size={'small'} onClick={() => handleReGenerate(record)}>重新生成</Button>
                  }
                  {['In_the_generated', 'Waiting_Generate'].includes(status) && (
                    <Popconfirm title={'确定取消吗?'} onConfirm={() => handleCancel(record)}>
                      <Button type={'link'} size={'small'}>
                        取消
                      </Button>
                    </Popconfirm>
                  )}
                  <Popconfirm title={'确定删除吗？'} placement={'topLeft'} onConfirm={() => handleDelete(record)}>
                    <Button type={'link'} size={'small'} danger>
                      删除
                    </Button>
                  </Popconfirm>
                </>
              )}
            </div>
          )
        },
      },
    ],
    dataSource: [],
  })
  const [keyword, setKeyword] = useState()
  const timer = useRef()

  const { current, pageSize } = table.pagination
  const { run: getList, loading } = useRequest(
    (keyword) => {
      return axios
        .get('/bi-data-fetch/api/admin/biDfDataFile/list', {
          params: {
            keyword: keyword,
            page: current,
            pageSize,
          },
        })
        .then(({ data: { list, totalRows } }) => {
          setTable((prevState) => ({
            ...prevState,
            dataSource: list,
            pagination: {
              ...prevState.pagination,
              total: totalRows,
              current: Math.max(Math.min(current, Math.ceil(totalRows / pageSize)), 1),
            },
          }))
        })
    },
    {
      manual: true,
      debounceInterval: 200,
      debounceLeading: true,
    }
  )

  const dispatch = useDispatch()
  const count = useRef(0)
  useEffect(() => {
    count.current = 1
    axios.get('/bi-data-fetch/api/user/notification/getDownloadTaskCount').then(({ data }) => {
      dispatch({
        type: 'set_menuBadges',
        payload: {
          'fetchData-download': data,
        },
      })
    })
  }, [dispatch])

  useEffect(() => {
    const poll = (dataSource) => {
      clearTimeout(timer.current)
      const notFinishedItems = dataSource.filter((item) =>
        ['In_the_generated', 'Waiting_Generate'].includes(item.status)
      )
      if (notFinishedItems.length) {
        let p = notFinishedItems.map((item) => {
          return axios
            .get('/bi-data-fetch/api/user/biDfDataFile/selectColumnFindById', { params: { id: item.id } })
            .then(({ data }) => data)
        })
        Promise.all(p).then((results) => {
          setTable((prevState) => {
            const prevDataSource = prevState.dataSource
            const newDataSource = prevDataSource.map((v) => ({
              ...v,
              ...pick(
                results.find((item) => {
                  return item.id === v.id
                }) || {},
                ['progressBar', 'status']
              ),
            }))

            if (JSON.stringify(newDataSource) === JSON.stringify(prevDataSource)) {
              timer.current = setTimeout(() => {
                poll(newDataSource)
              }, 5000)
              return prevState
            }
            return {
              ...prevState,
              dataSource: newDataSource,
            }
          })
        })
      }
    }

    setTimeout(() => {
      poll(table.dataSource)
    }, 5000)
  }, [table.dataSource])

  const handleReGenerate = ({id}) => {
    axios.get('/bi-data-fetch/api/admin/biDfDataFile/afreshDownload', {
      params: {id}
    }).then(() => {
      getList(keyword)
    })
  }

  const handleDelete = ({ id }) => {
    axios
      .get('/bi-data-fetch/api/admin/biDfDataFile/delById', {
        params: { id },
      })
      .then(() => {
        getList(keyword)
      })
  }

  const handleCancel = ({ id }) => {
    axios
      .get('/bi-data-fetch/api/admin/biDfDataFile/cancelOperate', {
        params: { id },
      })
      .then(() => {
        getList(keyword)
      })
  }

  const downloadFile = ({ id }) => {
    window.location.href = axios.defaults.baseURL + '/bi-data-fetch/api/user/biDfDownloadRecord/zipDownload?id=' + id
  }

  useEffect(() => {
    getList(keyword)
  }, [getList, keyword, current, pageSize])

  return (
    <div className={'p-6'}>
      <div className={'mb-2.5'}>
        <Input
          value={keyword}
          onChange={(e) => {
            setTable((prevState) => ({ ...prevState, pagination: { ...prevState.pagination, current: 1 } }))
            setKeyword(e.target.value)
          }}
          allowClear
          className={'w-64'}
          placeholder={'输入关键字搜索'}
        />
      </div>

      <ExTable {...table} setTable={setTable} loading={loading} />
    </div>
  )
}

export default DownloadList