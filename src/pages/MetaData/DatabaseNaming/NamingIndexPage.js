import React, { useEffect, useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { TreeItem, TreeView } from '@material-ui/lab'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import ChevronRightIcon from '@material-ui/icons/ChevronRight'
import ArticleEditAndView from './ArticleEditAndView'
import { Button, Col, Form, Input, message, Popconfirm, Row, Space, Table } from 'antd'
import useTable from '../../../hooks/useTable'
import axios from '../../../utils/axios'
import FieldItem from '../../../components/FieldItem'
import DraggableModal from '../../../components/DraggableModal'
import { useForm } from 'antd/es/form/Form'

const useStyle = makeStyles((theme) => ({
  leftTreeRoot: {
    color: theme.palette.text.secondary,
    '&:hover > $leftTreeContent': {
      backgroundColor: theme.palette.action.hover,
    },
    '&:focus > $leftTreeContent, &$leftTreeSelected > $leftTreeContent': {
      backgroundColor: `var(--tree-view-bg-color, ${theme.palette.grey[400]})`,
      color: 'var(--tree-view-color)',
    },
    '&:focus > $leftTreeContent $leftTreeLabel, &:hover > $leftTreeContent $leftTreeLabel, &$leftTreeSelected > $leftTreeContent $leftTreeLabel':
      {
        backgroundColor: 'transparent',
      },
  },
  leftTreeContent: {},
  leftTreeSelected: {},
  leftTreeLabelRoot: {
    display: 'flex',
    fontSize: 14,
    userSelect: 'none',
    alignItems: 'center',
    padding: theme.spacing(0.5, 0),
  },
  leftTreeLabel: {},
  mainHeight: {
    height: 'calc(100vh - 185px)',
    border: '1px solid rgba(0, 0, 0, 0.15)',
    borderRadius: '4px',
    padding: 10,
  },
  leftSide: {
    width: '250px',
    flex: '0 0 250px',
    marginRight: 10,
  },
  rightSide: {
    width: 'calc(100% - 260px)',
  },
}))

const StyledTreeItem = (props) => {
  const classes = useStyle()
  return (
    <TreeItem
      {...props}
      label={<div className={classes.leftTreeLabelRoot}>{props.label}</div>}
      classes={{
        root: classes.leftTreeRoot,
        content: classes.leftTreeContent,
        label: classes.leftTreeLabel,
        selected: classes.leftTreeSelected,
      }}
    />
  )
}

const EditModal = (props) => {
  const { visible, setVisible, currentSide, currentEditRow, setRefreshKey } = props
  const [form] = useForm()
  const [saveLoading, setSaveLoading] = useState(false)
  useEffect(() => {
    if (currentEditRow && visible) {
      form.setFieldsValue(currentEditRow)
    }
  }, [currentEditRow, visible, form])

  const handleCancel = () => {
    form.resetFields()
    setVisible(false)
  }

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const urls = {
        2: '/bi-metadata/api/admin/biMtdUpdateFreqAttri/saveOrUpdate',
        3: '/bi-metadata/api/admin/biMtdDeterminer/saveOrUpdate',
        4: '/bi-metadata/api/admin/biMtdKindWord/saveOrUpdate',
        5: '/bi-metadata/api/admin/biMtdThemeNamingRules/saveOrUpdate',
        6: '/bi-metadata/api/admin/biMtdAbbreDbName/saveOrUpdate',
        7: '/bi-metadata/api/admin/biMtdWordAbbre/saveOrUpdate',
        8: '/bi-metadata/api/admin/biMtdColumnSet/saveOrUpdate',
      }
      setSaveLoading(true)
      axios
        .post(urls[currentSide], {
          ...values,
          id: currentEditRow?.id,
        })
        .then(() => {
          message.success('????????????')
          form.resetFields()
          setVisible(false)
          setRefreshKey((prev) => prev + 1)
        })
        .finally(() => {
          setSaveLoading(false)
        })
    })
  }

  return (
    <DraggableModal
      title={'??????/??????'}
      visible={visible}
      width={['3', '4'].includes(currentSide) ? 600 : 520}
      onOk={handleSubmit}
      okButtonProps={{ loading: saveLoading }}
      onCancel={handleCancel}>
      <Form form={form} labelCol={{ span: 4 }}>
        {['2'].includes(currentSide) && (
          <Form.Item label={'??????'} name={'attribute'} rules={[{ required: true }]}>
            <Input maxLength={10} />
          </Form.Item>
        )}
        {['2'].includes(currentSide) && (
          <Form.Item label={'?????????'} name={'contractName'} rules={[{ required: true }]}>
            <Input maxLength={20} />
          </Form.Item>
        )}
        {['3', '4'].includes(currentSide) && (
          <Form.Item label={'??????'} name={'cnName'} rules={[{ required: true }]}>
            <Input maxLength={20} />
          </Form.Item>
        )}
        {['3', '4'].includes(currentSide) && (
          <Form.Item label={'???????????????'} name={'colFullName'} rules={[{ required: true }]}>
            <Input maxLength={50} />
          </Form.Item>
        )}
        {['3', '4'].includes(currentSide) && (
          <Form.Item label={'????????????'} name={'abbreNo'} rules={[{ required: true }]}>
            <Input maxLength={10} />
          </Form.Item>
        )}
        {['5'].includes(currentSide) && (
          <>
            <Form.Item label={'????????????'} name={'archLayers'} rules={[{ required: true }]}>
              <Input maxLength={20} />
            </Form.Item>
            <Form.Item label={'????????????'} name={'levleOneName'} rules={[{ required: true }]}>
              <Input maxLength={20} />
            </Form.Item>
            <Form.Item label={'????????????'} name={'levleOneAbbreName'} rules={[{ required: true }]}>
              <Input maxLength={50} />
            </Form.Item>
            <Form.Item label={'????????????'} name={'levleTwoName'} rules={[{ required: true }]}>
              <Input maxLength={20} />
            </Form.Item>
            <Form.Item label={'????????????'} name={'levleTwoAbbreName'} rules={[{ required: true }]}>
              <Input maxLength={50} />
            </Form.Item>
            <Form.Item label={'??????'} name={'exampleName'} rules={[{ required: true }]}>
              <Input maxLength={50} />
            </Form.Item>
          </>
        )}
        {['6'].includes(currentSide) && (
          <>
            <Form.Item label={'?????????'} name={'dbCnName'} rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label={'?????????'} name={'dbAbbreEnName'} rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </>
        )}
        {['7'].includes(currentSide) && (
          <>
            <Form.Item label={'???'} name={'word'} rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label={'??????'} name={'abbreviation'} rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label={'??????'} name={'description'}>
              <Input />
            </Form.Item>
          </>
        )}
        {['8'].includes(currentSide) && (
          <>
            <Form.Item label={'????????????'} name={'enName'} rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label={'????????????'} name={'cnName'} rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </>
        )}
        {['2', '4', '6'].includes(currentSide) && (
          <Form.Item label={'??????'} name={'description'}>
            <Input />
          </Form.Item>
        )}
      </Form>
    </DraggableModal>
  )
}

function NamingIndexPage() {
  const classes = useStyle()

  const [tableLoading, setTableLoading] = useState(false)
  const [currentSide, setCurrentSide] = useState('1')

  const handleChangeSide = (e, value) => {
    setCurrentSide(value)
  }

  const [__refreshKey, setRefreshKey] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [currentEditRow, setCurrentEditRow] = useState(null)
  const { table, setTable } = useTable({})

  const { table: table2 } = useTable({
    columns: [
      { dataIndex: 'attribute', title: '??????' },
      { dataIndex: 'contractName', title: '?????????' },
      { dataIndex: 'description', title: '??????' },
    ],
  })

  const { table: table3 } = useTable({
    columns: [
      { dataIndex: 'cnName', title: '??????' },
      { dataIndex: 'colFullName', title: '???????????????' },
      { dataIndex: 'abbreNo', title: '????????????' },
    ],
  })
  const { table: table4 } = useTable({
    columns: [
      { dataIndex: 'cnName', title: '??????' },
      { dataIndex: 'colFullName', title: '???????????????' },
      { dataIndex: 'abbreNo', title: '????????????' },
      { dataIndex: 'description', title: '??????' },
    ],
  })
  const { table: table5 } = useTable({
    columns: [
      { dataIndex: 'archLayers', title: '????????????' },
      { dataIndex: 'levleOneName', title: '????????????' },
      { dataIndex: 'levleOneAbbreName', title: '??????' },
      { dataIndex: 'levleTwoName', title: '????????????' },
      { dataIndex: 'levleTwoAbbreName', title: '??????' },
      { dataIndex: 'exampleName', title: '??????/????????????????????????' },
    ],
  })

  const { table: table6 } = useTable({
    columns: [
      { dataIndex: 'dbCnName', title: '?????????' },
      { dataIndex: 'dbAbbreEnName', title: '?????????' },
      { dataIndex: 'description', title: '??????' },
    ],
  })

  const { table: table7 } = useTable({
    columns: [
      { dataIndex: 'word', title: '???' },
      { dataIndex: 'abbreviation', title: '??????' },
      { dataIndex: 'description', title: '??????' },
      { dataIndex: 'lastUpdatorName', title: '?????????' },
      { dataIndex: 'updateDate', title: '????????????' },
    ],
  })

  const { table: table8 } = useTable({
    columns: [
      { dataIndex: 'enName', title: '????????????' },
      { dataIndex: 'cnName', title: '????????????' },
      { dataIndex: 'aa', title: '???????????????' },
      { dataIndex: 'lastUpdatorName', title: '?????????' },
      { dataIndex: 'updateDate', title: '????????????' },
    ],
  })
  useEffect(() => {
    if (currentSide !== '1') {
      setTable(() => {
        let tableResult
        let newColumns = []
        tableResult =
          {
            2: table2,
            3: table3,
            4: table4,
            5: table5,
            6: table6,
            7: table7,
            8: table8,
          }[currentSide] || {}

        if (tableResult.columns?.length) {
          newColumns = tableResult.columns.concat({
            dataIndex: 'action',
            title: '??????',
            render: (text, row) => {
              return (
                <Space>
                  <Button type={'link'} size={'small'} onClick={() => handleEditRow(row)}>
                    ??????
                  </Button>
                  <Popconfirm title={'??????????????????'} onConfirm={() => handleDeleteRow(row)}>
                    <Button type={'link'} size={'small'} danger>
                      ??????
                    </Button>
                  </Popconfirm>
                </Space>
              )
            },
          })
        }
        return {
          ...tableResult,
          pagination: ['2', '3', '4', '5', '6'].includes(currentSide)
            ? {
                ...tableResult.pagination,
                pageSize: 999,
                showTotal: true,
                hideOnSinglePage: true,
              }
            : tableResult.pagination,
          scroll: {
            y: 'calc(100vh - 330px)',
          },
          columns: newColumns,
        }
      })
    }
    // eslint-disable-next-line
  }, [currentSide])

  const handleAddNew = () => {
    setEditModalVisible(true)
    setCurrentEditRow(null)
  }

  const handleEditRow = (row) => {
    setEditModalVisible(true)
    setCurrentEditRow(row)
  }

  const handleDeleteRow = (row) => {
    const urls = {
      2: '/bi-metadata/api/admin/biMtdUpdateFreqAttri/delById',
      3: '/bi-metadata/api/admin/biMtdDeterminer/delById',
      4: '/bi-metadata/api/admin/biMtdKindWord/delById',
      5: '/bi-metadata/api/admin/biMtdThemeNamingRules/delById',
      6: '/bi-metadata/api/admin/biMtdAbbreDbName/delById',
      7: '/bi-metadata/api/admin/biMtdWordAbbre/delById',
      8: '/bi-metadata/api/admin/biMtdColumnSet/delById',
    }
    axios
      .get(urls[currentSide], {
        params: {
          id: row.id,
        },
      })
      .then(() => {
        message.success('????????????')
        setRefreshKey((prevState) => prevState + 1)
      })
  }

  useEffect(() => {
    if (currentSide !== '1') {
      let urls = {
        2: '/bi-metadata/api/admin/biMtdUpdateFreqAttri/list',
        3: '/bi-metadata/api/admin/biMtdDeterminer/list',
        4: '/bi-metadata/api/admin/biMtdKindWord/list',
        5: '/bi-metadata/api/admin/biMtdThemeNamingRules/list',
        6: '/bi-metadata/api/admin/biMtdAbbreDbName/list',
        7: '/bi-metadata/api/admin/biMtdWordAbbre/list',
        8: '/bi-metadata/api/admin/biMtdColumnSet/list',
      }
      setTableLoading(true)
      axios
        .get(urls[currentSide], {
          params: {
            pageSize: table.pagination?.pageSize,
            page: table.pagination?.current,
            keyword,
          },
          headers: {
            fullResponse: true,
          },
        })
        .then(({ data, config }) => {
          const {
            data: { list, totalRows: total },
          } = data
          if (urls[currentSide] === config.url) {
            setTable((prevState) => ({
              ...prevState,
              rowKey: 'id',
              dataSource: list,
              pagination: { ...prevState.pagination, total },
              onChange: ({ current, pageSize }) => {
                setTable((prevState) => ({
                  ...prevState,
                  pagination: { ...prevState.pagination, current, pageSize },
                }))
              },
            }))
          }
        })
        .finally(() => {
          setTableLoading(false)
        })
    }
    // eslint-disable-next-line
  }, [currentSide, table.pagination?.current, table.pagination?.pageSize, keyword, __refreshKey])

  return (
    <div className={'flex p-6'}>
      <div className={`${classes.mainHeight} ${classes.leftSide}`}>
        <TreeView
          className={classes.leftTreeRoot}
          selected={currentSide}
          onNodeSelect={handleChangeSide}
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpandIcon={<ChevronRightIcon />}>
          <StyledTreeItem nodeId={'1'} label={'???????????????'}>
            <StyledTreeItem nodeId={'2'} label={'?????????????????????'} />
            <StyledTreeItem nodeId={'3'} label={'?????????'} />
            <StyledTreeItem nodeId={'4'} label={'??????'} />
          </StyledTreeItem>
          <StyledTreeItem nodeId={'5'} label={'??????????????????'} />
          <StyledTreeItem nodeId={'6'} label={'???????????????????????????'} />
          <StyledTreeItem nodeId={'7'} label={'??????????????????'} />
          <StyledTreeItem nodeId={'8'} label={'?????????'} />
        </TreeView>
      </div>
      <div className={`${classes.mainHeight} ${classes.rightSide}`}>
        {currentSide === '1' && <ArticleEditAndView />}
        {currentSide !== '1' && (
          <>
            <div className={'flex justify-between mb-2.5'}>
              <Row className={'flex-1'}>
                <Col span={6}>
                  <FieldItem label={'?????????'} labelAlign={'left'} labelWidth={45}>
                    <Input
                      placeholder={'???????????????'}
                      value={keyword}
                      allowClear
                      onChange={(e) => setKeyword(e.target.value)}
                    />
                  </FieldItem>
                </Col>
              </Row>
              <Button type={'primary'} onClick={handleAddNew}>
                ??????
              </Button>
            </div>
            <Table {...table} key={currentSide} loading={tableLoading} />
          </>
        )}
      </div>
      <EditModal
        visible={editModalVisible}
        setVisible={setEditModalVisible}
        setRefreshKey={setRefreshKey}
        currentEditRow={currentEditRow}
        currentSide={currentSide}
      />
    </div>
  )
}

export default NamingIndexPage
