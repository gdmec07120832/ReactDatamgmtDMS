import React, { useEffect, useState } from 'react'
import { Button, Col, Input, message, Modal, Row, Space, Table } from 'antd'
import FieldItem from '../../../components/FieldItem'
import useTable from '../../../hooks/useTable'
import { useRequest } from 'ahooks'
import axios from '../../../utils/axios'
import OverflowTooltip from '../../../components/OverflowTooltip'
import { downloadByUrl } from '../../../utils/helpers'
import 'codemirror/mode/sql/sql'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/darcula.css'
import CodeMirrorLayer from '../../../components/CodeMirrorLayer'

const PreviewRecord = (props) => {
  const { visible, setVisible, current } = props
  const [loading, setLoading] = useState(false)
  const [_key, _setKey] = useState(1)
  const { table, setTable } = useTable({
    rowKey: 'kettleName',
    pagination: false,
    scroll: { y: 600 },
    expandable: {
      expandRowByClick: true,
      expandedRowRender: (record) => (
        <CodeMirrorLayer
          fullscreenButton={true}
          options={{ mode: 'sql', theme: 'darcula', lineWrapping: true, lineNumbers: true }}
          value={record.sqlString}
          onBeforeChange={() => {}}
        />
      ),
    },
    columns: [
      { title: '脚本名称', dataIndex: 'kettleName', width: 300 },
      {
        title: 'SQL语句',
        dataIndex: 'sqlString',
        render: (text) => {
          return <div className={'ellipsis'}>{text}</div>
        },
      },
    ],
  })
  useEffect(() => {
    if (visible && current) {
      setLoading(true)
      axios
        .post('/bi-auto-deploy/api/user/etl/preview', null, {
          params: {
            kettleName: (current?.jobname || '').replace(/\//g, '|'),
          },
        })
        .then(({ data }) => {
          setTable((prevState) => ({
            ...prevState,
            dataSource: data,
          }))
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setTable((prevState) => ({
        ...prevState,
        dataSource: [],
      }))
    }
  }, [current, visible, setTable, _key])

  const refresh = () => {
    _setKey((prevState) => prevState + 1)
  }

  return (
    <Modal
      destroyOnClose
      width={'60vw'}
      footer={null}
      title={'SQL脚本'}
      visible={visible}
      onCancel={() => setVisible(false)}>
      <div className={'flex justify-end mb-2.5'}>
        <Button type={'primary'} onClick={refresh} loading={loading}>
          刷新
        </Button>
      </div>
      <Table {...table} loading={loading} key={_key} />
    </Modal>
  )
}

function ETLSearch() {
  const [query, setQuery] = useState({
    keywd: undefined,
  })

  const { table, setTable, components } = useTable({
    rowKey: 'jobname',
    resizeable: true,
    scroll: { x: 1200 },
    columns: [
      {
        title: 'JOB ID',
        dataIndex: 'id',
        width: 100,
        render: (text) => {
          return text || '-'
        },
      },
      {
        title: 'JOB名称',
        dataIndex: 'jobname',
        render: (text) => {
          return <OverflowTooltip>{text}</OverflowTooltip> || '-'
        },
      },
      {
        title: '负责人',
        dataIndex: 'username',
        width: 120,
        render: (text) => {
          return text || '-'
        },
      },
      {
        title: '分组名称',
        dataIndex: 'groupname',
        width: 300,
        render: (text) => {
          return text || '-'
        },
      },
      {
        title: '操作',
        dataIndex: 'action',
        width: 120,
        fixed: 'right',
        render: (text, record) => {
          return (
            <Space>
              <Button type={'link'} size={'small'} onClick={() => checkRecord(record)}>
                预览
              </Button>
              <Button type={'link'} size={'small'} onClick={() => exportRecord(record)}>
                下载
              </Button>
            </Space>
          )
        },
      },
    ],
  })

  const exportRecord = (record) => {
    const { jobname } = record
    let url = window.location.origin + axios.defaults.baseURL + '/bi-auto-deploy' + jobname
    downloadByUrl(url, jobname.split('/').pop() || 'file')
  }

  const { keywd } = query
  const { run: fetchList, loading } = useRequest(
    () => {
      return axios
        .post('/bi-auto-deploy/api/admin/etl/kettlejob', null, {
          params: { keywd: keywd.trim() },
        })
        .then(({ data }) => {
          setTable((prevState) => ({
            ...prevState,
            dataSource: data,
          }))
        })
    },
    {
      manual: true,
    }
  )

  const handleSearch = () => {
    setTable((prevState) => ({
      ...prevState,
      dataSource: [],
      pagination: { ...prevState.pagination, current: 1 },
    }))
    if (!keywd.trim()) {
      message.warn('请输入关键字')
      return
    }
    fetchList()
  }

  const [previewVisible, setPreviewVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)

  const checkRecord = (record) => {
    setPreviewVisible(true)
    setCurrentRecord(record)
  }

  return (
    <div className={'px-6 py-6'}>
      <div className={'flex justify-between mb-2.5'}>
        <Row gutter={24} className={'flex-auto'}>
          <Col span={6}>
            <FieldItem label={'关键字'} labelAlign={'left'} labelWidth={45}>
              <Input
                value={query.keywd}
                allowClear
                placeholder={'关键字'}
                onChange={(e) => setQuery((prevState) => ({ ...prevState, keywd: e.target.value }))}
              />
            </FieldItem>
          </Col>
        </Row>
        <div>
          <Button type={'primary'} onClick={handleSearch} loading={loading}>
            搜索
          </Button>
        </div>
      </div>
      <Table {...table} components={components} loading={loading} />

      <PreviewRecord visible={previewVisible} setVisible={setPreviewVisible} current={currentRecord} />
    </div>
  )
}

export default ETLSearch
