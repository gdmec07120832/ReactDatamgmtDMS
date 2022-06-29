import React, { useCallback, useEffect, useRef, useState } from 'react'
import DraggableModal from '../../../components/DraggableModal'
import { Button, Spin, Table } from 'antd'
import useTable from '../../../hooks/useTable'
import D3Tree from 'react-d3-tree'
import axios from '../../../utils/axios'
import { Tooltip } from '@material-ui/core'
import { useRequest } from 'ahooks'
import { FullscreenOutlined } from '@ant-design/icons'
import styled from 'styled-components'

const ToggleFullIcon = styled(FullscreenOutlined)`
  position: absolute;
  padding: 6px;
  border-radius: 4px;
  top: 0;
  right: 0;
  cursor: pointer;
  background: #eee;
  &:hover {
    background: #ccc;
  }
`

const useCenteredTree = () => {
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const domRef = useRef()
  const calcFn = useCallback((dom) => {
    if (dom) {
      const { width, height } = dom.getBoundingClientRect()
      setTranslate({ x: width / 4, y: height / 2.2 })
    }
  }, [])

  return [translate, calcFn, domRef]
}
const TreeChart = (props) => {
  const { treeData } = props
  const [isFull, setIsFull] = useState(false)
  const isFullRef = useRef(false)
  const [translate, calcFn, domRef] = useCenteredTree()

  useEffect(() => {
    calcFn(domRef.current)
  }, [domRef, calcFn])

  const toggleFull = () => {
    if (!isFull) {
      isFullRef.current = true
      domRef.current?.requestFullscreen()
      setTimeout(() => {
        setIsFull(true)
      }, 100)
    } else {
      isFullRef.current = false
      document.exitFullscreen()
      setTimeout(() => {
        setIsFull(false)
      }, 100)
    }
  }

  useEffect(() => {
    const handler = () => {
      calcFn(domRef.current)
      if (!document.fullscreenElement) {
        setIsFull(false)
      }
    }
    document.addEventListener('fullscreenchange', handler)
    return () => {
      document.removeEventListener('fullscreenchange', handler)
    }
  }, [calcFn, domRef])

  return (
    <div ref={domRef} className={'h-60 bg-white relative'}>
      <Tooltip title={'切换全屏'}>
        <ToggleFullIcon onClick={toggleFull} />
      </Tooltip>

      <D3Tree
        translate={translate}
        data={treeData}
        nodeSize={{ x: 300, y: 50 }}
        renderCustomNodeElement={(rd3tProps) => {
          const { nodeDatum } = rd3tProps
          return (
            <g>
              <foreignObject width={250} height={50} x={-120} y={-25}>
                <Tooltip
                  title={`${nodeDatum.name} ${nodeDatum.principal ? '负责人：' + nodeDatum.principal : ''}`}
                  PopperProps={{
                    container: () => domRef.current || document.body,
                  }}>
                  <div
                    style={{
                      userSelect: 'none',
                      width: 250,
                      padding: 12,
                      borderRadius: 10,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      ...(nodeDatum?.styles || {}),
                    }}>
                    {nodeDatum.name} {nodeDatum.principal && `负责人：${nodeDatum.principal}`}
                  </div>
                </Tooltip>
              </foreignObject>
            </g>
          )
        }}
      />
    </div>
  )
}

function RelationshipModal(props) {
  const { currentRow, setCurrentRow } = props
  const [treeData, setTreeData] = useState({ name: '' })
  const { table, setTable } = useTable({
    rowKey: 'id',
    pagination: {
      pageSize: 5,
      current: 1,
      hideOnSinglePage: true,
      size: 'default',
    },
    columns: [
      { dataIndex: 'reportPathInBI', title: '数据灯塔菜单路径' },
      {
        dataIndex: 'active',
        title: '状态',
        width: 120,
        render(text) {
          return text ? '启用' : '禁用'
        },
      },
      { dataIndex: 'reportPathInYH', title: '永洪报告路径' },
      { dataIndex: 'dataSetPathInYH', title: '永洪数据集路径' },
      { dataIndex: 'tableNameInDB', title: '数据库中的表' },
      { dataIndex: 'principal', title: '负责人' },
    ],
  })

  const close = () => {
    setCurrentRow(null)
    setTreeData({ name: '' })
    setTable((prevState) => ({
      ...prevState,
      dataSource: [],
    }))
  }

  const { run: getGraphData, loading } = useRequest(
    (row) => {
      return axios
        .get('/bi-auto-deploy/api/user/reportRelationship/findByPathGetReportBloodRelation', {
          params: {
            reportPathInBI: row?.reportPathInBI,
          },
        })
        .then(({ data }) => {
          const { oneLevel, twoLevel } = data
          const tree = {
            name: oneLevel,
            styles: {
              background: '#5396f6',
              color: '#fff',
            },
            children: twoLevel.map((item) => {
              return {
                name: item['datasetPathInYH'],
                styles: {
                  border: '1px solid #5396f650',
                  background: '#f4f7ff',
                  color: '#000',
                },
                children: (data[item['datasetPathInYH']] || []).map((_item) => {
                  return {
                    name: _item['tableNameInDB'],
                    ..._item,
                    styles: {
                      borderColor: '#ccc',
                      background: '#f8f6f9',
                      color: '#000',
                    },
                  }
                }),
              }
            }),
          }
          setTreeData(tree)
        })
    },
    { manual: true }
  )

  const { current: page, pageSize } = table.pagination
  const { run: getList, loading: loading2 } = useRequest(
    (row) => {
      return axios
        .get('/bi-auto-deploy/api/user/reportRelationship/listForReport', {
          params: {
            page,
            pageSize,
            reportPathInBI: row.reportPathInBI,
          },
        })
        .then(({ data: { list, totalRows: total } }) => {
          setTable((prevState) => ({
            ...prevState,
            dataSource: list,
            pagination: {
              ...prevState.pagination,
              total,
            },
          }))
        })
    },
    { manual: true }
  )

  useEffect(() => {
    if (currentRow) {
      getGraphData(currentRow)
    }
  }, [currentRow, getGraphData])

  useEffect(() => {
    if (currentRow) {
      getList(currentRow)
    }
  }, [getList, currentRow, page, pageSize])

  return (
    <DraggableModal
      destroyOnClose
      footer={[
        <Button key={'close'} onClick={close}>
          关闭
        </Button>,
      ]}
      width={1200}
      title={'查看血缘关系'}
      visible={!!currentRow}
      onCancel={close}>
      <Spin spinning={loading}>{currentRow && <TreeChart treeData={treeData} />}</Spin>
      <Table {...table} loading={loading2} className={'mt-2'} />
    </DraggableModal>
  )
}

export default RelationshipModal
